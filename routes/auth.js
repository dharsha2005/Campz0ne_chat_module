const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

/**
 * Auth Routes
 * 
 * POST /api/auth/register - Register a new user
 * POST /api/auth/login - Login user
 */

// Register endpoint
router.post('/register', AuthController.register);

// Login endpoint
router.post('/login', AuthController.login);

// Me endpoint - returns current user profile
const { authenticateToken } = require('../middleware/authMiddleware');
router.get('/me', authenticateToken, AuthController.me);

module.exports = router;

