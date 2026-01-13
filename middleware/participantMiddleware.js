const ChatParticipant = require('../models/ChatParticipant');
const ChatRoom = require('../models/ChatRoom');

async function ensureParticipant(req, res, next) {
  const chatRoomId = req.params.chatRoomId || req.body.chatRoomId;
  if (!chatRoomId) return res.status(400).json({ success: false, error: 'chatRoomId is required' });

  // Ensure room exists
  const room = await ChatRoom.findOne({ roomId: chatRoomId });
  if (!room) return res.status(404).json({ success: false, error: 'Chat room not found' });

  const participant = await ChatParticipant.findOne({ roomId: chatRoomId, userId: req.user.userId });
  if (!participant) return res.status(403).json({ success: false, error: 'User is not a participant of this chat' });

  req.participant = participant;
  next();
}

module.exports = { ensureParticipant };
