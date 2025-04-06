const mongoose = require('mongoose');

const GuestUserSchema = new mongoose.Schema({
  guestId: {
    type: String,
    required: true,
    unique: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  requestsCount: {
    type: Number,
    default: 0
  },
  lastRequestTime: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GuestUser', GuestUserSchema);
