const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomName: {
    type: String,
    required: true
  },
  roomType: {
    type: String,
    enum: ['one-to-one', 'group', 'class', 'department', 'club'],
    required: true
  },
  createdBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);

