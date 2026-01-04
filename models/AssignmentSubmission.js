const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatAssignment', required: true, index: true },
  studentId: { type: String, required: true, ref: 'User', index: true },
  fileUrl: { type: String },
  submittedAt: { type: Date, default: Date.now },
  marks: { type: Number }
}, {
  timestamps: true
});

assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
