const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const CollegesController = require('../controllers/collegesController');

// College management routes (admin only)
router.post('/', authenticateToken, requireRole('admin'), CollegesController.createCollege);
router.get('/', authenticateToken, requireRole('admin'), CollegesController.listColleges);
router.get('/:id', authenticateToken, requireRole('admin'), CollegesController.getCollege);
router.put('/:id', authenticateToken, requireRole('admin'), CollegesController.updateCollege);
router.delete('/:id', authenticateToken, requireRole('admin'), CollegesController.deleteCollege);

module.exports = router;
