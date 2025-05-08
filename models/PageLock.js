const mongoose = require('mongoose');

const PageLockSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    unique: true
  },
  isLocked: {
    type: Boolean,
    default: true
  },
  reason: {
    type: String,
    default: 'Under Maintenance'
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
PageLockSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PageLock', PageLockSchema);
