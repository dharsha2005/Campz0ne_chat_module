const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    sparse: true, // Allow multiple nulls but enforce uniqueness for non-null values
    lowercase: true,
    trim: true,
    index: true,
    validate: {
      validator: function(v) {
        // Email validation regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  passwordHash: {
    type: String,
    required: false, // Optional for users created via other methods (e.g., presence tracking)
    select: false // Never return passwordHash in queries by default
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'hod', 'admin'],
    default: 'student'
  },
  // Roll number for students, e.g. 23ITR030
  rollNo: {
    type: String,
    required: false,
    sparse: true,
    index: true,
    trim: true,
    uppercase: true
  },
  // College identifier
  collegeId: {
    type: String,
    required: function() { return this.role !== 'admin'; },
    trim: true,
    index: true,
    ref: 'College'
  },
  // Department identifier (string code or ObjectId as string)
  departmentId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  // Classroom/Section identifier for subjects
  classroomId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ collegeId: 1 });

// Method to exclude password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

