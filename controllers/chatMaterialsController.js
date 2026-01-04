const ChatMaterial = require('../models/ChatMaterial');
const ChatRoom = require('../models/ChatRoom');
const Subject = require('../models/Subject');
const participantService = require('../services/participantService');
const socketService = require('../services/socketService');
const { parseRoll, compareRoll, inRange } = require('../services/rollUtils');

class ChatMaterialsController {
  // POST /api/chats/:chatRoomId/materials
  static async createMaterial(req, res) {
    try {
      const { chatRoomId } = req.params;
      const { title, description, subjectId, rollStart, rollEnd } = req.body;
      // fileUrl may be provided by client as external link OR set by multer-uploaded file
      let fileUrl = req.body.fileUrl;
      if (req.file) {
        // Serve uploaded files from /uploads/materials
        fileUrl = `/uploads/materials/${req.file.filename}`;
      }

      if (!title) return res.status(400).json({ success: false, error: 'title is required' });

      const room = await ChatRoom.findOne({ roomId: chatRoomId });
      if (!room) return res.status(404).json({ success: false, error: 'Chat room not found' });

      await participantService.ensureUserIsParticipant(req.user.userId, chatRoomId);

      if (!['faculty', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Only faculty or admins can post materials' });
      }

      // If uploader is faculty, subjectId is required and must belong to faculty
      let subject = null;
      if (req.user.role === 'faculty') {
        if (!subjectId) return res.status(400).json({ success: false, error: 'subjectId is required for faculty uploads' });
        subject = await Subject.findOne({ _id: subjectId });
        if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' });
        if (String(subject.facultyId) !== String(req.user.userId)) return res.status(403).json({ success: false, error: 'Faculty can only post materials for their own subjects' });
      } else if (subjectId) {
        subject = await Subject.findOne({ _id: subjectId });
        if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' });
      }

      // If roll range provided, validate format. If absent and subject present, inherit subject range.
      let finalRollStart = rollStart ? String(rollStart).trim().toUpperCase() : undefined;
      let finalRollEnd = rollEnd ? String(rollEnd).trim().toUpperCase() : undefined;
      if ((!finalRollStart || !finalRollEnd) && subject) {
        finalRollStart = finalRollStart || subject.rollStart;
        finalRollEnd = finalRollEnd || subject.rollEnd;
      }
      if (!finalRollStart || !finalRollEnd) {
        return res.status(400).json({ success: false, error: 'rollStart and rollEnd are required (either provide or ensure subject has them)' });
      }
      if (!parseRoll(finalRollStart) || !parseRoll(finalRollEnd)) return res.status(400).json({ success: false, error: 'Invalid rollStart/rollEnd format' });
      if (compareRoll(finalRollStart, finalRollEnd) > 0) return res.status(400).json({ success: false, error: 'rollStart must be <= rollEnd' });
      if (subject) {
        if (compareRoll(finalRollStart, subject.rollStart) < 0 || compareRoll(finalRollEnd, subject.rollEnd) > 0) {
          return res.status(400).json({ success: false, error: 'Provided roll range must fit inside the subject range' });
        }
      }

      const material = new ChatMaterial({
        chatRoomId,
        subjectId: subject ? String(subject._id) : (subjectId || undefined),
        title,
        description,
        fileUrl: fileUrl || undefined,
        rollStart: finalRollStart,
        rollEnd: finalRollEnd,
        uploadedBy: req.user.userId
      });

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

  // PUT /api/materials/:id
  static async updateMaterial(req, res) {
    try {
      const { id } = req.params;
      const { title, description, subjectId, rollStart, rollEnd } = req.body;

      const material = await ChatMaterial.findById(id);
      if (!material) return res.status(404).json({ success: false, error: 'Material not found' });

      // Authorization: admin OR faculty owner OR faculty of subject
      if (req.user.role !== 'admin') {
        if (req.user.role !== 'faculty') return res.status(403).json({ success: false, error: 'Forbidden' });

        let allowed = false;
        if (String(material.uploadedBy) === String(req.user.userId)) allowed = true;
        if (!allowed && material.subjectId) {
          const subj = await Subject.findOne({ _id: material.subjectId });
          if (subj && String(subj.facultyId) === String(req.user.userId)) allowed = true;
        }
        if (!allowed) return res.status(403).json({ success: false, error: 'Faculty can only edit their materials/subjects' });
      }

      // Handle optional file upload
      if (req.file) {
        material.fileUrl = `/uploads/materials/${req.file.filename}`;
      }

      if (title) material.title = title;
      if (description) material.description = description;

      // If subject change requested, validate
      if (subjectId) {
        const subj = await Subject.findOne({ _id: subjectId });
        if (!subj) return res.status(404).json({ success: false, error: 'Subject not found' });
        // faculty must own the subject (unless admin)
        if (req.user.role === 'faculty' && String(subj.facultyId) !== String(req.user.userId)) {
          return res.status(403).json({ success: false, error: 'Cannot assign material to subject you do not own' });
        }
        material.subjectId = subjectId;
      }

      // Validate and assign roll ranges if provided
      const finalRollStart = rollStart ? String(rollStart).trim().toUpperCase() : material.rollStart;
      const finalRollEnd = rollEnd ? String(rollEnd).trim().toUpperCase() : material.rollEnd;
      if (finalRollStart && finalRollEnd) {
        const { parseRoll, compareRoll } = require('../services/rollUtils');
        if (!parseRoll(finalRollStart) || !parseRoll(finalRollEnd)) return res.status(400).json({ success: false, error: 'Invalid roll format' });
        if (compareRoll(finalRollStart, finalRollEnd) > 0) return res.status(400).json({ success: false, error: 'rollStart must be <= rollEnd' });
      }
      material.rollStart = finalRollStart;
      material.rollEnd = finalRollEnd;

      await material.save();

      // Emit socket update
      try { socketService.emitToRoom(material.chatRoomId, 'material_updated', { materialId: material._id }); } catch (e) { }

      return res.status(200).json({ success: true, data: material });
    } catch (err) {
      console.error('updateMaterial error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // DELETE /api/materials/:id
  static async deleteMaterial(req, res) {
    try {
      const { id } = req.params;
      const material = await ChatMaterial.findById(id);
      if (!material) return res.status(404).json({ success: false, error: 'Material not found' });

      // Authorization similar to update
      if (req.user.role !== 'admin') {
        if (req.user.role !== 'faculty') return res.status(403).json({ success: false, error: 'Forbidden' });

        let allowed = false;
        if (String(material.uploadedBy) === String(req.user.userId)) allowed = true;
        if (!allowed && material.subjectId) {
          const subj = await Subject.findOne({ _id: material.subjectId });
          if (subj && String(subj.facultyId) === String(req.user.userId)) allowed = true;
        }
        if (!allowed) return res.status(403).json({ success: false, error: 'Faculty can only delete their materials/subjects' });
      }

      await ChatMaterial.deleteOne({ _id: id });
      try { socketService.emitToRoom(material.chatRoomId, 'material_deleted', { materialId: id }); } catch (e) { }
      return res.status(200).json({ success: true, message: 'Material deleted' });
    } catch (err) {
      console.error('deleteMaterial error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // GET /api/chats/:chatRoomId/materials
  static async listMaterials(req, res) {
    try {
      const { chatRoomId } = req.params;

      await participantService.ensureUserIsParticipant(req.user.userId, chatRoomId);

      const materials = await ChatMaterial.find({ chatRoomId }).sort({ createdAt: -1 });

      // If student, filter materials by roll range on backend
      if (req.user.role === 'student') {
        // Load full user to get rollNo
        const User = require('../models/User');
        const user = await User.findOne({ userId: req.user.userId });
        const studentRoll = user && user.rollNo ? user.rollNo : null;
        if (!studentRoll) return res.status(200).json({ success: true, data: [] });
        const filtered = materials.filter(m => {
          // If material has no rollStart/rollEnd, hide by default
          if (!m.rollStart || !m.rollEnd) return false;
          try { return inRange(studentRoll, m.rollStart, m.rollEnd); } catch (e) { return false; }
        });
        return res.status(200).json({ success: true, data: filtered });
      }

      return res.status(200).json({ success: true, data: materials });
    } catch (err) {
      console.error('listMaterials error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

module.exports = ChatMaterialsController;

