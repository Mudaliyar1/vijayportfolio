const mongoose = require('mongoose');

const WebsitePageSchema = new mongoose.Schema({
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  isHomePage: {
    type: Boolean,
    default: false
  },
  content: {
    type: String,
    default: ''
  },
  htmlContent: {
    type: String,
    default: ''
  },
  cssContent: {
    type: String,
    default: ''
  },
  jsContent: {
    type: String,
    default: ''
  },
  elements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsiteElement'
  }],
  seo: {
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    keywords: {
      type: [String],
      default: []
    }
  },
  order: {
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
  }
});

// Update the updatedAt field before saving
WebsitePageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WebsitePage', WebsitePageSchema);
