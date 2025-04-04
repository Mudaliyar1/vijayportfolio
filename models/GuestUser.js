const mongoose = require('mongoose');

const GuestUserSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    unique: true
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
