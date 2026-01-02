const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate, authorizeStaff } = require('../middleware/auth');
const { validateExpense, handleValidationErrors } = require('../middleware/validation');


// Public GET routes (allow listing and viewing without login)
router.get('/', expenseController.getAll);

// Protected routes require authentication and staff authorization
// POST /api/expenses
router.post('/', authenticate, authorizeStaff, validateExpense, handleValidationErrors, expenseController.create);


// GET /api/expenses/monthly
router.get('/monthly', expenseController.getMonthly);

// GET /api/expenses/:id
router.get('/:id', expenseController.getById);

// PUT /api/expenses/:id
router.put('/:id', authenticate, authorizeStaff, validateExpense, handleValidationErrors, expenseController.update);

// DELETE /api/expenses/:id
router.delete('/:id', authenticate, authorizeStaff, expenseController.delete);

module.exports = router;

