const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { ensureParticipant } = require('../middleware/participantMiddleware');
const ChatMaterialsController = require('../controllers/chatMaterialsController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'materials');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) { /* ignore */ }

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
		cb(null, `${unique}-${safe}`);
	}
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
const ChatAssignmentsController = require('../controllers/chatAssignmentsController');

// Materials
router.post('/:chatRoomId/materials', authenticateToken, ensureParticipant, upload.single('materialFile'), ChatMaterialsController.createMaterial);
router.get('/:chatRoomId/materials', authenticateToken, ensureParticipant, ChatMaterialsController.listMaterials);

// Assignments
router.post('/:chatRoomId/assignments', authenticateToken, ensureParticipant, ChatAssignmentsController.createAssignment);
router.get('/:chatRoomId/assignments', authenticateToken, ensureParticipant, ChatAssignmentsController.listAssignments);

module.exports = router;
