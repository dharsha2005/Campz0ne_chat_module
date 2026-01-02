const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorizeStaff } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);
router.use(authorizeStaff);

// GET /api/dashboard
router.get('/', dashboardController.getDashboard);

module.exports = router;

