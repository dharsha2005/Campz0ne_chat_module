const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const UsersController = require('../controllers/usersController');

// Admin creates HOD
router.post('/hod', authenticateToken, requireRole('admin'), UsersController.createHod);
// Admin or HOD creates faculty (HOD restricted to their department in controller)
router.post('/faculty', authenticateToken, requireRole('admin', 'hod'), UsersController.createFaculty);
// Admin or HOD creates student
router.post('/student', authenticateToken, requireRole('admin', 'hod'), UsersController.createStudent);
// Get all users (admin or hod)
router.get('/all', authenticateToken, requireRole('admin', 'hod'), UsersController.getAllUsers);
// Get users by college (admin only)
router.get('/college/:collegeId', authenticateToken, requireRole('admin'), UsersController.getUsersByCollege);

module.exports = router;
