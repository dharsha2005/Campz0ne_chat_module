const AuthService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await AuthService.login(email, password);

  res.json({
    success: true,
    message: 'Login successful',
    data: result
  });
});

