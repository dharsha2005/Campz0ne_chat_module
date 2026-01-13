const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  lamportTimestamp: {
    type: Number,
    required: true,
    index: true
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'DELIVERED', 'READ'],
    default: 'PENDING',
    index: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  // Optional reply reference (message this message is replying to)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Optional snippet of the replied-to message for quick display on clients
  replySnippet: {
    type: String
  },
  // Name of the sender of the replied-to message (for display purposes)
  replyToSenderName: {
    type: String
  },
  // File/Image attachment fields (for future resource sharing)
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  thumbnailUrl: {
    type: String // For images/videos
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for message ordering: lamportTimestamp ASC, createdAt ASC
messageSchema.index({ roomId: 1, lamportTimestamp: 1, createdAt: 1 });

// Index for idempotency check
messageSchema.index({ idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model('Message', messageSchema);

