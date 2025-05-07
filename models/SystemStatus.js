const mongoose = require('mongoose');

const SystemStatusSchema = new mongoose.Schema({
  // Overall system status
  overallStatus: {
    type: String,
    enum: ['operational', 'partial_outage', 'major_outage'],
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
  
  // User who last updated the status
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Update the updatedAt field before saving
SystemStatusSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SystemStatus', SystemStatusSchema);
