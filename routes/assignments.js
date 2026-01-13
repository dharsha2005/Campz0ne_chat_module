const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const ChatAssignmentsController = require('../controllers/chatAssignmentsController');

// Submit assignment (students)
router.post('/:assignmentId/submit', authenticateToken, ChatAssignmentsController.submitAssignment);

// Get submissions for an assignment (faculty only)
router.get('/:assignmentId/submissions', authenticateToken, ChatAssignmentsController.getSubmissions);

// Grade a submission (faculty only)
router.put('/:assignmentId/submissions/:submissionId/grade', authenticateToken, ChatAssignmentsController.gradeSubmission);

module.exports = router;
