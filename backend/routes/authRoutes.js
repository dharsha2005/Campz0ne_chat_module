const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, handleValidationErrors } = require('../middleware/validation');

// POST /api/auth/login
router.post('/login', validateLogin, handleValidationErrors, authController.login);

module.exports = router;

