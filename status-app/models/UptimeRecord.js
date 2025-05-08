const mongoose = require('mongoose');

const UptimeRecordSchema = new mongoose.Schema({
  // Component name
  componentName: {
    type: String,
    required: true
  },
  
  // Date of the record (stored as YYYY-MM-DD)
  date: {
    type: String,
    required: true
  },
  
  // Hour of the day (0-23)
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  
  // Total checks in this hour
  totalChecks: {
    type: Number,
    default: 0
  },
  
  // Successful checks in this hour
  successfulChecks: {
    type: Number,
    default: 0
  },
  
  // Average response time in ms
  averageResponseTime: {
    type: Number,
    default: 0
  },
  
  // Uptime percentage for this hour
  uptimePercentage: {
    type: Number,
    default: 100
  },
  
  // Created at
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Updated at
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient querying
UptimeRecordSchema.index({ componentName: 1, date: 1, hour: 1 }, { unique: true });

// Update the updatedAt field before saving
UptimeRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('UptimeRecord', UptimeRecordSchema);
