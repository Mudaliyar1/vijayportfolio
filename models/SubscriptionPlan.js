const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  durationUnit: {
    type: String,
    enum: ['seconds', 'minutes', 'hours', 'days', 'months', 'years'],
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
SubscriptionPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to calculate end date based on current date and plan duration
SubscriptionPlanSchema.methods.calculateEndDate = function(startDate = new Date()) {
  const date = new Date(startDate);
  
  switch(this.durationUnit) {
    case 'seconds':
      date.setSeconds(date.getSeconds() + this.duration);
      break;
    case 'minutes':
      date.setMinutes(date.getMinutes() + this.duration);
      break;
    case 'hours':
      date.setHours(date.getHours() + this.duration);
      break;
    case 'days':
      date.setDate(date.getDate() + this.duration);
      break;
    case 'months':
      date.setMonth(date.getMonth() + this.duration);
      break;
    case 'years':
      date.setFullYear(date.getFullYear() + this.duration);
      break;
  }
  
  return date;
};

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
