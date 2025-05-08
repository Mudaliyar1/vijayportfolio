const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['custom', 'internet'],
    default: 'custom'
  },
  category: {
    type: String,
    enum: ['open-source', 'browser', 'social-media', 'tech-giant', 'dev-tool', 'cloud', 'education', 'other'],
    default: 'other'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  imageUrl: {
    type: String,
    required: false,
    default: '/images/default-ad.png',
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  },
  positions: {
    type: [String],
    enum: ['popup', 'top', 'bottom', 'sidebar', 'content'],
    default: ['popup']
  },
  pages: {
    type: [String],
    default: ['home']
  },
  overlayText: {
    type: String,
    default: '',
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  delay: {
    type: Number,
    default: 3000 // Delay in milliseconds for popups
  },
  displayFrequency: {
    type: Number,
    default: 1 // How many times to show per session (for popups)
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
AdSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if an ad is currently active based on start/end dates
AdSchema.methods.isCurrentlyActive = function() {
  const now = new Date();

  // Check if ad is marked as active
  if (!this.active) return false;

  // Check start date
  if (this.startDate && now < this.startDate) return false;

  // Check end date (if set)
  if (this.endDate && now > this.endDate) return false;

  return true;
};

module.exports = mongoose.model('Ad', AdSchema);
