const DashboardService = require('../services/dashboardService');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getDashboard = asyncHandler(async (req, res) => {
  const dashboardData = await DashboardService.getDashboardData();

  res.json({
    success: true,
    data: dashboardData
  });
});

