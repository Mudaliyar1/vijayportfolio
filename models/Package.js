const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    required: true
  },
  features: [{
    type: String
  }],
  maxPages: {
    type: Number,
    required: true
  },
  allowBlog: {
    type: Boolean,
    default: false
  },
  allowGallery: {
    type: Boolean,
    default: false
  },
  allowContact: {
    type: Boolean,
    default: false
  },
  allowTestimonials: {
    type: Boolean,
    default: false
  },
  allowEcommerce: {
    type: Boolean,
    default: false
  },
  allowAiContent: {
    type: Boolean,
    default: false
  },
  allowCustomLayout: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Package', PackageSchema);
