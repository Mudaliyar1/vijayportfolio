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

  // Digital Twin reference
  digitalTwin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DigitalTwin',
    default: null
  },

  // Ad-free subscription status
  adFree: {
    type: Boolean,
    default: false
  },

  // Ad-free subscription end date
  adFreeUntil: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('User', UserSchema);
