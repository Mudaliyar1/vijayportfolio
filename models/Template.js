const mongoose = require('mongoose');

const TemplatePageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isHomepage: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
});

const TemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  businessType: {
    type: String,
    required: true
  },
  theme: {
    type: String,
    default: 'default'
  },
  colorScheme: {
    type: String,
    default: 'blue'
  },
  thumbnail: {
    type: String,
    required: true
  },
  pages: [TemplatePageSchema],
  packageType: {
    type: String,
    default: 'All'
  },
  pageCount: {
    type: Number,
    default: 1
  },
  isResponsive: {
    type: Boolean,
    default: true
  },
  active: {
    type: Boolean,
    default: true
  },
  // Marketplace features
  price: {
    type: Number,
    default: 0 // 0 means free
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  downloads: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Template', TemplateSchema);
