const RiceVariety = require('../models/RiceVariety');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const riceVarieties = await RiceVariety.getAll();

  res.json({
    success: true,
    data: riceVarieties
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const riceVariety = await RiceVariety.findById(id);

  if (!riceVariety) {
    return res.status(404).json({
      success: false,
      message: 'Rice variety not found'
    });
  }

  res.json({
    success: true,
    data: riceVariety
  });
});

exports.create = asyncHandler(async (req, res) => {
  const riceData = req.body;
  const id = await RiceVariety.create(riceData);
  const riceVariety = await RiceVariety.findById(id);

  res.status(201).json({
    success: true,
    message: 'Rice variety created successfully',
    data: riceVariety
  });
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const riceData = req.body;

  const existing = await RiceVariety.findById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Rice variety not found'
    });
  }

  await RiceVariety.update(id, riceData);
  const riceVariety = await RiceVariety.findById(id);

  res.json({
    success: true,
    message: 'Rice variety updated successfully',
    data: riceVariety
  });
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await RiceVariety.findById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Rice variety not found'
    });
  }

  await RiceVariety.delete(id);

  res.json({
    success: true,
    message: 'Rice variety deleted successfully'
  });
});

