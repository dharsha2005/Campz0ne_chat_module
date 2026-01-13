const User = require('../models/User');
const College = require('../models/College');
const AuthService = require('../services/authService');

class UsersController {
  // POST /api/users/hod  (admin only)
  static async createHod(req, res) {
    try {
      const { name, email, password, collegeId, departmentId } = req.body;
      if (!name || !email || !password || !collegeId || !departmentId) {
        return res.status(400).json({ success: false, error: 'name, email, password, collegeId and departmentId required' });
      }

      // Verify college exists
      const college = await College.findById(collegeId);
      if (!college) return res.status(404).json({ success: false, error: 'College not found' });

      // Hash password
      const passwordHash = await AuthService.hashPassword(password);

      const user = new User({
        userId: require('uuid').v4(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'hod',
        collegeId: String(collegeId),
        departmentId: String(departmentId)
      });

      await user.save();
      return res.status(201).json({ success: true, data: { userId: user.userId, name: user.name, email: user.email, role: user.role, collegeId: user.collegeId } });
    } catch (err) {
      console.error('createHod error', err);
      if (err.message && err.message.includes('exists')) return res.status(409).json({ success: false, error: err.message });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // POST /api/users/faculty (admin or hod)
  static async createFaculty(req, res) {
    try {
      const { name, email, password, collegeId, departmentId, classroomId } = req.body;
      if (!name || !email || !password || !collegeId || !departmentId) {
        return res.status(400).json({ success: false, error: 'name, email, password, collegeId and departmentId required' });
      }

      // Verify college exists
      const college = await College.findById(collegeId);
      if (!college) return res.status(404).json({ success: false, error: 'College not found' });

      // If creator is HOD, ensure college and department matches
      if (req.user.role === 'hod') {
        const creator = await User.findOne({ userId: req.user.userId });
        if (!creator) return res.status(401).json({ success: false, error: 'Creator not found' });
        if (!creator.collegeId || String(creator.collegeId) !== String(collegeId)) {
          return res.status(403).json({ success: false, error: 'HOD can only create faculty for their college' });
        }
        if (!creator.departmentId || String(creator.departmentId) !== String(departmentId)) {
          return res.status(403).json({ success: false, error: 'HOD can only create faculty for their department' });
        }
      }

      const passwordHash = await AuthService.hashPassword(password);

      const user = new User({
        userId: require('uuid').v4(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'faculty',
        collegeId: String(collegeId),
        departmentId: String(departmentId),
        classroomId: classroomId ? String(classroomId) : undefined
      });

      await user.save();
      return res.status(201).json({ success: true, data: { userId: user.userId, name: user.name, email: user.email, role: user.role, collegeId: user.collegeId } });
    } catch (err) {
      console.error('createFaculty error', err);
      if (err.message && err.message.includes('exists')) return res.status(409).json({ success: false, error: err.message });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // POST /api/users/student (admin only)
  static async createStudent(req, res) {
    try {
      const { name, email, password, rollNo, collegeId, departmentId, classroomId } = req.body;
      if (!name || !email || !password || !rollNo || !collegeId || !departmentId) {
        return res.status(400).json({ success: false, error: 'name, email, password, rollNo, collegeId and departmentId required' });
      }

      // Verify college exists
      const college = await College.findById(collegeId);
      if (!college) return res.status(404).json({ success: false, error: 'College not found' });

      // Validate roll number format
      const { parseRoll } = require('../services/rollUtils');
      if (!parseRoll(rollNo)) {
        return res.status(400).json({ success: false, error: 'Invalid roll number format. Expected format: 23ITR030' });
      }

      const passwordHash = await AuthService.hashPassword(password);

      const user = new User({
        userId: require('uuid').v4(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'student',
        rollNo: rollNo.trim().toUpperCase(),
        collegeId: String(collegeId),
        departmentId: String(departmentId),
        classroomId: classroomId ? String(classroomId) : undefined
      });

      await user.save();
      return res.status(201).json({ success: true, data: { userId: user.userId, name: user.name, email: user.email, role: user.role, rollNo: user.rollNo, collegeId: user.collegeId } });
    } catch (err) {
      console.error('createStudent error', err);
      if (err.message && err.message.includes('exists')) return res.status(409).json({ success: false, error: err.message });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // GET /api/users/all (admin or hod)
  static async getAllUsers(req, res) {
    try {
      let users;
      if (req.user.role === 'admin') {
        users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
      } else if (req.user.role === 'hod') {
        // HOD can only see users from their college and department
        const hod = await User.findOne({ userId: req.user.userId });
        if (!hod) return res.status(401).json({ success: false, error: 'HOD not found' });
        
        users = await User.find({ 
          collegeId: hod.collegeId, 
          departmentId: hod.departmentId 
        }).select('-passwordHash').sort({ createdAt: -1 });
      }
      return res.status(200).json({ success: true, data: users });
    } catch (err) {
      console.error('getAllUsers error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // GET /api/users/college/:collegeId - Get users by college (admin only)
  static async getUsersByCollege(req, res) {
    try {
      const { collegeId } = req.params;
      const users = await User.find({ collegeId }).select('-passwordHash').sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: users });
    } catch (err) {
      console.error('getUsersByCollege error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

module.exports = UsersController;
