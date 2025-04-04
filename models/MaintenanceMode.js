const mongoose = require('mongoose');

const MaintenanceModeSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: false
  },
  reason: {
    type: String,
    default: 'System Maintenance'
  },
  message: {
    type: String,
    default: 'We are currently performing maintenance on our systems. Please check back later.'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: function() {
      // Default to 1 hour from now
      const date = new Date();
      date.setHours(date.getHours() + 1);
      return date;
    }
  },
  durationUnit: {
    type: String,
    enum: ['seconds', 'minutes', 'hours', 'days', 'months'],
    default: 'hours'
  },
  durationValue: {
    type: Number,
    default: 1
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
MaintenanceModeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MaintenanceMode', MaintenanceModeSchema);
