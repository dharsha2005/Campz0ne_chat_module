const Expense = require('../models/Expense');
const { asyncHandler } = require('../middleware/errorHandler');

exports.create = asyncHandler(async (req, res) => {
  const expenseData = {
    ...req.body,
    expense_date: req.body.expense_date || new Date().toISOString().split('T')[0],
    created_by: req.user.id
  };

  const id = await Expense.create(expenseData);
  const expense = await Expense.findById(id);

  res.status(201).json({
    success: true,
    message: 'Expense recorded successfully',
    data: expense
  });
});

exports.getAll = asyncHandler(async (req, res) => {
  const filters = {
    startDate: req.query.start_date,
    endDate: req.query.end_date,
    expenseType: req.query.expense_type
  };

  const expenses = await Expense.getAll(filters);

  res.json({
    success: true,
    data: expenses
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expense = await Expense.findById(id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  res.json({
    success: true,
    data: expense
  });
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expenseData = req.body;

  const existing = await Expense.findById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  await Expense.update(id, expenseData);
  const expense = await Expense.findById(id);

  res.json({
    success: true,
    message: 'Expense updated successfully',
    data: expense
  });
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await Expense.findById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  await Expense.delete(id);

  res.json({
    success: true,
    message: 'Expense deleted successfully'
  });
});

exports.getMonthly = asyncHandler(async (req, res) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  const totalExpenses = await Expense.getMonthlyExpenses(month, year);
  const expensesByType = await Expense.getByType({
    startDate: `${year}-${String(month).padStart(2, '0')}-01`,
    endDate: `${year}-${String(month).padStart(2, '0')}-31`
  });

  res.json({
    success: true,
    data: {
      month,
      year,
      total_expenses: totalExpenses,
      by_type: expensesByType
    }
  });
});

