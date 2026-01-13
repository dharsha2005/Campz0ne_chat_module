const mongoose = require('mongoose');

const chatEncryptionKeySchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  encryptionKey: {
    type: String,
    required: true
  },
  keyVersion: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  rotatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatEncryptionKey', chatEncryptionKeySchema);

