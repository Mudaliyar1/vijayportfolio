const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
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

const WebsiteSchema = new mongoose.Schema({
  title: {
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
  pages: [PageSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  customDomain: {
    type: String,
    default: null
  },
  slug: {
    type: String,
    required: true,
    unique: true
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

// Update the updatedAt field on save
WebsiteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Website', WebsiteSchema);
