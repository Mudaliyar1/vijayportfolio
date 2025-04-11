const mongoose = require('mongoose');

const ContentTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  contentType: {
    type: String,
    required: true,
    enum: ['website', 'blog', 'social', 'email', 'product', 'seo', 'other']
  },
  promptPrefix: {
    type: String,
    default: ''
  },
  promptSuffix: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ContentTemplate', ContentTemplateSchema);
