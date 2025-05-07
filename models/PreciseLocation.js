const mongoose = require('mongoose');

const PreciseLocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  // Precise location data
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    default: 0,
    description: 'Accuracy in meters'
  },
  altitude: {
    type: Number,
    default: null,
    description: 'Altitude in meters'
  },
  altitudeAccuracy: {
    type: Number,
    default: null,
    description: 'Altitude accuracy in meters'
  },
  heading: {
    type: Number,
    default: null,
    description: 'Direction of travel in degrees'
  },
  speed: {
    type: Number,
    default: null,
    description: 'Speed in meters per second'
  },
  source: {
    type: String,
    enum: ['GPS', 'NETWORK', 'IP', 'MANUAL'],
    default: 'GPS',
    description: 'Source of the location data'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    description: 'When the location was recorded'
  },
  // Additional metadata
  deviceInfo: {
    type: Object,
    default: {},
    description: 'Device information when location was recorded'
  }
});

// Add indexes for faster queries
PreciseLocationSchema.index({ userId: 1, timestamp: -1 });
PreciseLocationSchema.index({ timestamp: -1 });

module.exports = mongoose.model('PreciseLocation', PreciseLocationSchema);
