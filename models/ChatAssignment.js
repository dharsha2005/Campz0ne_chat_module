const mongoose = require('mongoose');

const chatAssignmentSchema = new mongoose.Schema({
  chatRoomId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  createdBy: { type: String, required: true, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatAssignment', chatAssignmentSchema);
