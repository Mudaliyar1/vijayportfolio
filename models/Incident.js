const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  // Title of the incident
  title: {
    type: String,
    required: true
  },
  
  // Description of the incident
  description: {
    type: String,
    required: true
  },
  
  // Affected component(s)
  affectedComponents: [{
    type: String,
    required: true
  }],
  
  // Status of the incident
  status: {
    type: String,
    enum: ['investigating', 'identified', 'monitoring', 'resolved'],
    default: 'investigating'
  },
  
  // Severity of the incident
  severity: {
    type: String,
    enum: ['minor', 'major', 'critical'],
    default: 'minor'
  },
  
  // Start time of the incident
  startTime: {
    type: Date,
    default: Date.now
  },
  
  // End time of the incident (null if ongoing)
  endTime: {
    type: Date,
    default: null
  },
  
  // Updates to the incident
  updates: [{
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['investigating', 'identified', 'monitoring', 'resolved'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Update the updatedAt field before saving
IncidentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate duration of the incident
IncidentSchema.virtual('duration').get(function() {
  const end = this.endTime || new Date();
  const start = this.startTime;
  const durationMs = end - start;
  
  // Convert to hours, minutes, seconds
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
});

// Check if incident is ongoing
IncidentSchema.virtual('isOngoing').get(function() {
  return this.endTime === null;
});

module.exports = mongoose.model('Incident', IncidentSchema);
