const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  collegeId: {
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
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  type: {
    type: String,
    enum: ['engineering', 'arts', 'science', 'commerce', 'medical', 'polytechnic', 'university'],
    required: true
  },
  establishedYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
collegeSchema.index({ code: 1 });
collegeSchema.index({ collegeId: 1 });

// Method to exclude sensitive fields from JSON output
collegeSchema.methods.toJSON = function() {
  const obj = this.toObject();
  return obj;
};

module.exports = mongoose.model('College', collegeSchema);
