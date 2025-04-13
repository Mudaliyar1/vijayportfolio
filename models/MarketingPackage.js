const mongoose = require('mongoose');

const MarketingPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
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
    },
    customFeatures: [{
      name: String,
      included: Boolean
    }]
  },
  pagesAllowed: {
    type: Number,
    default: 1
  },
  isFree: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Flag to identify this as a marketing package (not a website builder package)
  isMarketingPackage: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('MarketingPackage', MarketingPackageSchema);
