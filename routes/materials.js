const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const ChatMaterialsController = require('../controllers/chatMaterialsController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'materials');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) { }

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) { const unique = Date.now() + '-' + Math.round(Math.random() * 1e9); const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_'); cb(null, `${unique}-${safe}`); }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Update material (faculty/admin)
router.put('/:id', authenticateToken, requireRole('faculty','admin'), upload.single('materialFile'), ChatMaterialsController.updateMaterial);
// Delete material (faculty/admin)
router.delete('/:id', authenticateToken, requireRole('faculty','admin'), ChatMaterialsController.deleteMaterial);

module.exports = router;
