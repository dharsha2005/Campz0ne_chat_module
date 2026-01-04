const mongoose = require('mongoose');

const chatParticipantSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['member', 'admin', 'moderator'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastReadAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
chatParticipantSchema.index({ roomId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ChatParticipant', chatParticipantSchema);

