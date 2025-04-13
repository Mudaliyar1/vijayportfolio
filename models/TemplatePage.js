const mongoose = require('mongoose');

const TemplatePageSchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsiteTemplate',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true
  },
  isHomePage: {
    type: Boolean,
    default: false
  },
  htmlContent: {
    type: String,
    required: true
  },
  cssContent: {
    type: String,
    default: ''
  },
  jsContent: {
    type: String,
    default: ''
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
TemplatePageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TemplatePage', TemplatePageSchema);
