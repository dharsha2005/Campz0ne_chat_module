const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const SubjectsController = require('../controllers/subjectsController');

// Create subject (faculty/admin)
router.post('/', authenticateToken, requireRole('faculty','admin'), SubjectsController.createSubject);
// Get my subjects (faculty/admin)
router.get('/my', authenticateToken, requireRole('faculty','admin'), SubjectsController.mySubjects);
// Get subjects by college (admin only)
router.get('/college/:collegeId', authenticateToken, requireRole('admin'), SubjectsController.getSubjectsByCollege);
// Get subjects by classroom (authenticated users)
router.get('/classroom/:classroomId', authenticateToken, SubjectsController.getSubjectsByClassroom);

module.exports = router;
