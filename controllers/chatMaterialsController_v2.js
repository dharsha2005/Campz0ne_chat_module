const ChatMaterial = require('../models/ChatMaterial');
const ChatRoom = require('../models/ChatRoom');
const participantService = require('../services/participantService');
const socketService = require('../services/socketService');

class ChatMaterialsControllerV2 {
  static async createMaterial(req, res) {
    try {
      const { chatRoomId } = req.params;
      const { title, description, fileUrl } = req.body;
      if (!title) return res.status(400).json({ success: false, error: 'title is required' });

      const room = await ChatRoom.findOne({ roomId: chatRoomId });
      if (!room) return res.status(404).json({ success: false, error: 'Chat room not found' });

      await participantService.ensureUserIsParticipant(req.user.userId, chatRoomId);

      if (!['faculty', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Only faculty or admins can post materials' });
      }

      const material = new ChatMaterial({ chatRoomId, title, description, fileUrl, uploadedBy: req.user.userId });
      await material.save();

      socketService.emitToRoom(chatRoomId, 'material_posted', {
        materialId: material._id,
        chatRoomId,
        title: material.title,
        description: material.description,
        fileUrl: material.fileUrl,
        uploadedBy: material.uploadedBy,
        createdAt: material.createdAt
      });

      socketService.emitToRoom(chatRoomId, 'notification', {
        type: 'material_posted',
        chatRoomId,
        materialId: material._id,
        title: material.title,
        message: `${req.user.name || req.user.userId} posted material: ${material.title}`
      });

      return res.status(201).json({ success: true, data: material });
    } catch (err) {
      console.error('createMaterial error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async listMaterials(req, res) {
    try {
      const { chatRoomId } = req.params;
      await participantService.ensureUserIsParticipant(req.user.userId, chatRoomId);
      const materials = await ChatMaterial.find({ chatRoomId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: materials });
    } catch (err) {
      console.error('listMaterials error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

module.exports = ChatMaterialsControllerV2;
