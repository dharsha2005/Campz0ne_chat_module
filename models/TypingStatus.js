const mongoose = require('mongoose');

const typingStatusSchema = new mongoose.Schema({
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
  isTyping: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index for auto-expiry
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
typingStatusSchema.index({ roomId: 1, userId: 1 });

module.exports = mongoose.model('TypingStatus', typingStatusSchema);

