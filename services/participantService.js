const ChatParticipant = require('../models/ChatParticipant');
const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');

/**
 * Ensure the user exists as a participant in the room.
 * If not present, create a participant document (idempotent).
 * Returns the participant document.
 */
async function ensureUserIsParticipant(userId, roomId, opts = {}) {
  if (!userId || !roomId) {
    throw new Error('userId and roomId are required');
  }

  // Basic sanity checks: ensure room exists
  const room = await ChatRoom.findOne({ roomId });
  if (!room) {
    throw new Error('Room not found');
  }

  // Ensure user exists (newly registered users should exist)
  const user = await User.findOne({ userId });
  if (!user) {
    throw new Error('User not found');
  }

  // Try to find existing participant
  let participant = await ChatParticipant.findOne({ roomId, userId });
  if (participant) return participant;

  // Create participant document. Use upsert-like behaviour with a try/catch
  const doc = {
    roomId,
    userId,
    role: opts.role || 'member',
    joinedAt: new Date(),
    lastReadAt: new Date()
  };

  try {
    participant = await ChatParticipant.create(doc);
    return participant;
  } catch (err) {
    // If another process created the participant concurrently, fetch it
    if (err.code === 11000) {
      participant = await ChatParticipant.findOne({ roomId, userId });
      if (participant) return participant;
    }
    throw err;
  }
}

module.exports = {
  ensureUserIsParticipant
};
