const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true
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
SubscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if a subscription is currently active
SubscriptionSchema.methods.isActive = function() {
  const now = new Date();
  return this.active && now <= this.endDate;
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);
