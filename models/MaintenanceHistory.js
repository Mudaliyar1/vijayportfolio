const mongoose = require('mongoose');

const MaintenanceHistorySchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  durationUnit: {
    type: String,
    enum: ['seconds', 'minutes', 'hours', 'days', 'months'],
    required: true
  },
  durationValue: {
    type: Number,
    required: true
  },
  actualEndTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'extended'],
    default: 'completed'
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MaintenanceHistory', MaintenanceHistorySchema);
