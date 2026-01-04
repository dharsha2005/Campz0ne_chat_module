const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const ChatParticipant = require('../models/ChatParticipant');

/**
 * Auth Service
 * Handles authentication business logic: password hashing, validation, user creation
 */

class AuthService {
  // Bcrypt salt rounds (minimum 10 for security)
  static SALT_ROUNDS = 12;

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength (optional - can be enhanced)
   * @param {string} password - Password to validate
   * @returns {Object} { valid: boolean, message?: string }
   */
  static validatePassword(password) {
    if (!password || password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    return { valid: true };
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      throw new Error('Error hashing password');
    }
  }

  /**
   * Compare plain password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if match
   */
  static async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Error comparing password');
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - { email, password, name, role, collegeId, departmentId, rollNo }
   * @returns {Promise<Object>} Created user (without password)
   */
  static async registerUser(userData) {
    const { email, password, name, role, collegeId, departmentId, rollNo } = userData;

    // Resolve collegeId from alternate fields if provided (frontend may send college name/code)
    let resolvedCollegeId = collegeId;
    try {
      const College = require('../models/College');
      if (!resolvedCollegeId && userData.college) {
        // Try finding by _id, code, collegeId or name
        const q = userData.college;
        const found = await College.findOne({ $or: [ { _id: q }, { code: q }, { collegeId: q }, { name: q } ] });
        if (found) resolvedCollegeId = String(found._id);
      }

      // If client sent a collegeId-like token (e.g., COLL_...), try resolving to _id
      if (resolvedCollegeId && String(resolvedCollegeId).startsWith('COLL_')) {
        const found = await College.findOne({ collegeId: resolvedCollegeId });
        if (found) resolvedCollegeId = String(found._id);
      }
    } catch (e) {
      // ignore resolution errors; we'll validate presence later
      console.warn('College resolution warning:', e.message || e);
    }

    console.log('AuthService.registerUser - Received data:', { email, name, role, collegeId, hasPassword: !!password });

    // Determine and validate role early so we can apply conditional validation
    const validRoles = ['student', 'faculty', 'admin', 'hod'];
    const userRole = role && validRoles.includes(String(role).toLowerCase())
      ? String(role).toLowerCase()
      : 'student';

    // Validate core required fields
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    // For non-admin users, collegeId is required (use resolvedCollegeId)
    if (userRole !== 'admin' && !resolvedCollegeId) {
      throw new Error('collegeId is required for non-admin users');
    }

    // Validate email format
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Generate unique userId
    const userId = uuidv4();

    console.log('AuthService - Role processing:');
    console.log('  - Role received:', role);
    console.log('  - Final userRole:', userRole);

    // If role is student, require rollNo
    if (userRole === 'student') {
      if (!rollNo) throw new Error('rollNo is required for students');
      const { parseRoll } = require('./rollUtils');
      if (!parseRoll(String(rollNo))) throw new Error('Invalid rollNo format');
    }

    // Create user object
    const userObj = {
      userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: userRole,
      departmentId: departmentId ? String(departmentId) : undefined,
      rollNo: rollNo ? String(rollNo).trim().toUpperCase() : undefined
    };

    if (resolvedCollegeId) userObj.collegeId = String(resolvedCollegeId);

    const user = new User(userObj);

    console.log('Creating user with role:', userRole);
    await user.save();
    console.log('User saved. User role in DB:', user.role);
    
    // Reload user from DB to ensure we have the latest data including role
    const savedUser = await User.findOne({ userId });
    console.log('Reloaded user from DB - role:', savedUser?.role);

    // Automatically add user to default room (room1) if it exists
    await this.addUserToDefaultRoom(userId);

    // Return user without password - use savedUser to ensure we have role
    return {
      userId: savedUser.userId,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role || userRole, // Use role from DB or fallback to userRole
      collegeId: savedUser.collegeId,
      departmentId: savedUser.departmentId,
      rollNo: savedUser.rollNo,
      createdAt: savedUser.createdAt
    };
  }

  /**
   * Add user to default room (room1) if it exists
   * @param {string} userId - User ID
   */
  static async addUserToDefaultRoom(userId) {
    try {
      const defaultRoomId = 'room1';
      
      // Check if default room exists
      const room = await ChatRoom.findOne({ roomId: defaultRoomId });
      if (!room) {
        console.log(`Default room ${defaultRoomId} does not exist, skipping auto-add`);
        return;
      }

      // Check if user is already a participant
      const existing = await ChatParticipant.findOne({ roomId: defaultRoomId, userId });
      if (existing) {
        return; // Already a participant
      }

      // Add user as participant
      const participant = new ChatParticipant({
        roomId: defaultRoomId,
        userId,
        role: 'member'
      });

      await participant.save();
      console.log(`User ${userId} automatically added to default room ${defaultRoomId}`);
    } catch (error) {
      console.error('Error adding user to default room:', error);
      // Don't throw - registration should still succeed even if this fails
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object>} User data (without password)
   * @throws {Error} If credentials are invalid
   */
  static async loginUser(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email (include passwordHash for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user has a password (registered via auth system)
    if (!user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Compare password
    const isMatch = await this.comparePassword(password, user.passwordHash);
    
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    // Return user without password
    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role || 'student',
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    };
  }

  /**
   * Get user by userId (for Socket.IO integration)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  static async getUserById(userId) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User data
   */
  static async getUserByEmail(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

module.exports = AuthService;

