const mongoose = require('mongoose');

const UserLoginSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  username: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  forwardedIp: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  browser: {
    type: String,
    default: ''
  },
  browserVersion: {
    type: String,
    default: ''
  },
  operatingSystem: {
    type: String,
    default: ''
  },
  osVersion: {
    type: String,
    default: ''
  },
  deviceType: {
    type: String,
    default: 'Unknown'
  },
  deviceBrand: {
    type: String,
    default: ''
  },
  deviceModel: {
    type: String,
    default: ''
  },
  // Location data
  country: {
    type: String,
    default: 'Unknown'
  },
  countryCode: {
    type: String,
    default: ''
  },
  region: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  postalCode: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },
  timezone: {
    type: String,
    default: ''
  },
  isp: {
    type: String,
    default: 'Unknown'
  },
  loginStatus: {
    type: String,
    enum: ['success', 'failed', 'blocked'],
    default: 'success'
  },
  loginTime: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
UserLoginSchema.index({ loginTime: -1 });
UserLoginSchema.index({ userId: 1, loginTime: -1 });
UserLoginSchema.index({ ipAddress: 1 });

module.exports = mongoose.model('UserLogin', UserLoginSchema);
