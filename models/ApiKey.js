const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Base API Key Schema
 * This is the base schema for all API keys
 */
const ApiKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['static', 'dynamic'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'disabled', 'revoked'],
    default: 'active'
  },
  lastUsed: {
    type: Date,
    default: null
  },
  requestCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration is 1 year from creation
      const oneYear = new Date();
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      return oneYear;
    }
  }
}, { discriminatorKey: 'keyType' });

// Method to generate a new API key
ApiKeySchema.statics.generateKey = function() {
  return `ftr_${crypto.randomBytes(24).toString('hex')}`;
};

// Method to check if key is expired
ApiKeySchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Method to check if key is active
ApiKeySchema.methods.isActive = function() {
  return this.status === 'active' && !this.isExpired();
};

// Method to increment request count
ApiKeySchema.methods.incrementRequestCount = async function() {
  this.requestCount += 1;
  this.lastUsed = new Date();
  await this.save();
};

// Create the model
const ApiKey = mongoose.model('ApiKey', ApiKeySchema);

module.exports = ApiKey;
