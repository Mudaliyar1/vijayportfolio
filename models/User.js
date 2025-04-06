const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: '/images/default-avatar.png'
  },
  requestsCount: {
    type: Number,
    default: 0
  },
  lastRequestTime: {
    type: Date,
    default: null
  },
  requestsInWindow: {
    type: Number,
    default: 0
  },
  windowStartTime: {
    type: Date,
    default: null
  },
  // Custom rate limits
  chatRateLimit: {
    type: Number,
    default: 8 // Default: 8 requests per window
  },
  imageRateLimit: {
    type: Number,
    default: 1 // Default: 1 image per window
  },
  // Image generation window start time (separate from chat)
  imageWindowStartTime: {
    type: Date,
    default: null
  },
  // Image generation requests in window
  imageRequestsInWindow: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // User profile fields
  name: {
    type: String,
    default: function() {
      return this.username;
    }
  },
  bio: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  // Social media links removed as requested

  // Website builder related fields
  activePackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    default: null
  },
  packageExpiryDate: {
    type: Date,
    default: null
  },
  websiteCount: {
    type: Number,
    default: 0
  },
  maxWebsites: {
    type: Number,
    default: 1
  }
});

module.exports = mongoose.model('User', UserSchema);
