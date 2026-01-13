const mongoose = require('mongoose');

const chatMaterialSchema = new mongoose.Schema({
  chatRoomId: { type: String, required: true, index: true },
  subjectId: { type: String, required: false, index: true, ref: 'Subject' },
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String },
  // Roll range for which this material is visible (inclusive)
  rollStart: { type: String, required: false, uppercase: true, index: true },
  rollEnd: { type: String, required: false, uppercase: true, index: true },
  uploadedBy: { type: String, required: true, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatMaterial', chatMaterialSchema);
