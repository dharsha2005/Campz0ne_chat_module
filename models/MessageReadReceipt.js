const mongoose = require('mongoose');

const messageReadReceiptSchema = new mongoose.Schema({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Message',
    index: true
  },
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
  readAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate read receipts
messageReadReceiptSchema.index({ messageId: 1, userId: 1 }, { unique: true });

// Index for querying read receipts by room
messageReadReceiptSchema.index({ roomId: 1, userId: 1 });

module.exports = mongoose.model('MessageReadReceipt', messageReadReceiptSchema);

