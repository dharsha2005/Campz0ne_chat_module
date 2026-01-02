const express = require('express');
const router = express.Router();
const riceController = require('../controllers/riceController');
const { authenticate, authorizeStaff } = require('../middleware/auth');
const { validateRiceVariety, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);
router.use(authorizeStaff);

// GET /api/rice
router.get('/', riceController.getAll);

// GET /api/rice/:id
router.get('/:id', riceController.getById);

// POST /api/rice
router.post('/', validateRiceVariety, handleValidationErrors, riceController.create);

// PUT /api/rice/:id
router.put('/:id', validateRiceVariety, handleValidationErrors, riceController.update);

// DELETE /api/rice/:id
router.delete('/:id', riceController.delete);

module.exports = router;

