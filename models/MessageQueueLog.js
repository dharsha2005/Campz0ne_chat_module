const mongoose = require('mongoose');

const messageQueueLogSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['PENDING', 'DELIVERED', 'FAILED', 'RETRY'],
    default: 'PENDING',
    index: true
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  lastAttemptAt: {
    type: Date,
    default: Date.now
  },
  nextRetryAt: {
    type: Date
  },
  errorMessage: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for retry queue processing
messageQueueLogSchema.index({ status: 1, nextRetryAt: 1 });

module.exports = mongoose.model('MessageQueueLog', messageQueueLogSchema);

