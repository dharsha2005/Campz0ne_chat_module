const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  facultyId: { type: String, required: true, ref: 'User', index: true },
  collegeId: { type: String, required: true, ref: 'College', index: true },
  departmentId: { type: String, required: true, index: true },
  classroomId: { type: String, required: true, index: true },
  chatRoomId: { type: String, default: 'general', required: false, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  rollStart: { type: String, required: true, uppercase: true, index: true },
  rollEnd: { type: String, required: true, uppercase: true, index: true },
  description: { type: String, trim: true },
  credits: { type: Number, min: 1, max: 10 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
subjectSchema.index({ facultyId: 1, collegeId: 1 });
subjectSchema.index({ collegeId: 1, departmentId: 1 });
subjectSchema.index({ classroomId: 1, isActive: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
