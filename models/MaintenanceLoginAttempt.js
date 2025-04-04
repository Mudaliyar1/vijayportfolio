const mongoose = require('mongoose');

const MaintenanceLoginAttemptSchema = new mongoose.Schema({
  username: {
    type: String,
    default: 'Guest'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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
  status: {
    type: String,
    enum: ['failed', 'passed', 'blocked'],
    default: 'failed'
  },
  reason: {
    type: String,
    default: 'Non-admin user during maintenance'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MaintenanceLoginAttempt', MaintenanceLoginAttemptSchema);
