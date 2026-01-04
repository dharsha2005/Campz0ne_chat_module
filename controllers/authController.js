const AuthService = require('../services/authService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

/**
 * Auth Controller
 * Handles HTTP requests for authentication (register, login)
 */

class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   * Body: { email, password, name }
   */
  static async register(req, res) {
    try {
      const { email, password, name, role, collegeId } = req.body;

      console.log('=== Registration Request ===');
      console.log('Email:', email);
      console.log('Name:', name);
      console.log('Role received:', role);
      console.log('Role type:', typeof role);

      // Validate required fields
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and name are required'
        });
      }

      // Validate role if provided
      if (role && !['student', 'faculty', 'admin', 'hod'].includes(String(role).toLowerCase())) {
        return res.status(400).json({ success: false, error: 'Invalid role. Must be one of: student, faculty, hod, admin' });
      }

      console.log('Calling registerUser with role:', role);
      // Register user via service
      const { departmentId, rollNo } = req.body;
      console.log('AuthController.register - collegeId from request:', collegeId);
      const user = await AuthService.registerUser({ email, password, name, role, collegeId, departmentId, rollNo });
      console.log('User registered, returned user:', user);
      console.log('Returned user role:', user.role);

      // The user object from registerUser should already have the role
      // But let's verify by fetching from DB as well
      const UserModel = require('../models/User');
      const createdUser = await UserModel.findOne({ userId: user.userId });
      console.log('Fetched user from DB - role:', createdUser?.role);
      console.log('Service returned user role:', user.role);

      // Use role from service response (which should match DB), fallback to DB, then default
      const finalRole = user.role || createdUser?.role || 'student';
      console.log('Final role to return in response:', finalRole);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          userId: user.userId || createdUser.userId,
          name: user.name || createdUser.name,
          email: user.email || createdUser.email,
          role: finalRole,
          departmentId: createdUser.departmentId || undefined,
          rollNo: createdUser.rollNo || undefined,
          createdAt: user.createdAt || createdUser.createdAt
        }
      });
    } catch (error) {
      console.error('Register error:', error);

      // Handle duplicate email error
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      // Handle validation errors
      if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      // Generic server error
      return res.status(500).json({
        success: false,
        error: 'Internal server error during registration'
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   * Body: { email, password }
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Login user via service
      const user = await AuthService.loginUser(email, password);

      // Create JWT token
      const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '30d' });

      // Return success response with token
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role || 'student',
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);

      // Handle invalid credentials
      if (error.message.includes('Invalid credentials') || error.message.includes('not found')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Handle validation errors
      if (error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      // Generic server error
      return res.status(500).json({
        success: false,
        error: 'Internal server error during login'
      });
    }
  }

  // GET /api/auth/me
  static async me(req, res) {
    try {
      // authMiddleware attaches req.user
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      return res.status(200).json({ success: true, data: req.user });
    } catch (err) {
      console.error('me error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

module.exports = AuthController;

