const { body, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Login validation
exports.validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Rice variety validation
exports.validateRiceVariety = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').isIn(['Raw', 'Boiled', 'Steam']).withMessage('Invalid category'),
  body('stock_kg').isFloat({ min: 0 }).withMessage('Stock must be a positive number'),
  body('cost_price_per_kg').isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('selling_price_per_kg').isFloat({ min: 0 }).withMessage('Selling price must be a positive number')
];

// Sales validation
exports.validateSale = [
  body('rice_variety_id').isInt({ min: 1 }).withMessage('Valid rice variety ID is required'),
  body('quantity_kg').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('price_per_kg').isFloat({ min: 0 }).withMessage('Price per kg must be a positive number'),
  body('payment_type').optional().isIn(['Cash', 'UPI', 'Credit']).withMessage('Invalid payment type'),
  body('sale_date').optional().isISO8601().withMessage('Invalid date format'),
  body('customer_id').optional().isInt({ min: 1 }).withMessage('Invalid customer ID')
];

// Expense validation
exports.validateExpense = [
  body('expense_type').isIn(['Paddy Purchase', 'Labour Salary', 'Electricity', 'Transport', 'Maintenance', 'Other'])
    .withMessage('Invalid expense type'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('expense_date').optional().isISO8601().withMessage('Invalid date format'),
  body('notes').optional().trim()
];

// Customer validation
exports.validateCustomer = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('address').optional().trim()
];

// Payment validation
exports.validatePayment = [
  body('customer_id').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('payment_date').optional().isISO8601().withMessage('Invalid date format'),
  body('payment_mode').optional().isIn(['Cash', 'UPI', 'Bank Transfer', 'Cheque'])
    .withMessage('Invalid payment mode')
];

