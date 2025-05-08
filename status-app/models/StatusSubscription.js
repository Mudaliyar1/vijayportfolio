const mongoose = require('mongoose');

const StatusSubscriptionSchema = new mongoose.Schema({
  // Email address for the subscription
  email: {
    type: String,
    required: true,
    unique: true
  },
  
  // Verification token
  verificationToken: {
    type: String,
    default: null
  },
  
  // Whether the subscription is verified
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Unsubscribe token
  unsubscribeToken: {
    type: String,
    required: true
  },
  
  // Created at
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StatusSubscription', StatusSubscriptionSchema);
