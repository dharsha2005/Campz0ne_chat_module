const Sale = require('../models/Sale');
const SalesService = require('../services/salesService');
const { asyncHandler } = require('../middleware/errorHandler');

exports.create = asyncHandler(async (req, res) => {
  const saleData = {
    ...req.body,
    created_by: req.user.id
  };

  const sale = await SalesService.createSale(saleData);

  res.status(201).json({
    success: true,
    message: 'Sale recorded successfully',
    data: sale
  });
});

exports.getAll = asyncHandler(async (req, res) => {
  const filters = {
    startDate: req.query.start_date,
    endDate: req.query.end_date,
    riceVarietyId: req.query.rice_variety_id
  };

  const sales = await Sale.getAll(filters);

  res.json({
    success: true,
    data: sales
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sale = await Sale.findById(id);

  if (!sale) {
    return res.status(404).json({
      success: false,
      message: 'Sale not found'
    });
  }

  res.json({
    success: true,
    data: sale
  });
});

exports.getSummary = asyncHandler(async (req, res) => {
  const filters = {
    startDate: req.query.start_date,
    endDate: req.query.end_date
  };

  const summary = await Sale.getSummary(filters);
  const salesWithProfit = await Sale.getSalesWithProfit(filters);

  const totalProfit = salesWithProfit.reduce((sum, item) => sum + parseFloat(item.profit), 0);

  res.json({
    success: true,
    data: {
      ...summary,
      total_profit: totalProfit,
      variety_wise: salesWithProfit
    }
  });
});

