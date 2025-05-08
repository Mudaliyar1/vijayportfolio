const mongoose = require('mongoose');

const SystemStatusSchema = new mongoose.Schema({
  // Overall system status
  overallStatus: {
    type: String,
    enum: ['operational', 'degraded_performance', 'partial_outage', 'major_outage'],
    default: 'operational'
  },

  // Individual component statuses
  components: [{
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['operational', 'degraded_performance', 'partial_outage', 'major_outage'],
      default: 'operational'
    },
    lastChecked: {
      type: Date,
      default: Date.now
    },
    responseTime: {
      type: Number,
      default: 0
    },
    statusCode: {
      type: Number,
      default: 200
    },
    errorMessage: {
      type: String,
      default: null
    },
    endpoint: {
      type: String,
      default: '/'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Last updated timestamp
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Auto-detected flag (true if status was automatically detected)
  autoDetected: {
    type: Boolean,
    default: false
  }
});

// Update the updatedAt field before saving
SystemStatusSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SystemStatus', SystemStatusSchema);
