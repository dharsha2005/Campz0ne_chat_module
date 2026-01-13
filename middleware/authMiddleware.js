const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return res.status(401).json({ success: false, error: 'Authorization header missing' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, error: 'Invalid authorization header' });

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Attach minimal user info to request
    const user = await User.findOne({ userId: payload.userId });
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    // Attach useful fields for downstream authorization (include departmentId and rollNo)
    req.user = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      rollNo: user.rollNo,
      collegeId: user.collegeId,
      classroomId: user.classroomId,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

module.exports = { authenticateToken };
