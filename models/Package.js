const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  pagesAllowed: {
    type: Number,
    required: true,
    default: 1
  },
  features: {
    aiContent: {
      type: Boolean,
      default: false
    },
    seo: {
      type: Boolean,
      default: false
    },
    fullAi: {
      type: Boolean,
      default: false
    }
  },
  templates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsiteTemplate'
  }],
  defaultTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsiteTemplate',
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
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

// Update the updatedAt field before saving
PackageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Package', PackageSchema);
