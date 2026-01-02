const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { authenticate, authorizeStaff } = require('../middleware/auth');
const { validateSale, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);
router.use(authorizeStaff);

// POST /api/sales
router.post('/', validateSale, handleValidationErrors, salesController.create);

// GET /api/sales
router.get('/', salesController.getAll);

// GET /api/sales/summary
router.get('/summary', salesController.getSummary);

// GET /api/sales/:id
router.get('/:id', salesController.getById);

module.exports = router;

