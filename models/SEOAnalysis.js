const mongoose = require('mongoose');

const SEOAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  website: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    default: null
  },
  url: {
    type: String,
    required: true
  },
  keywords: {
    type: String,
    default: ''
  },
  pageTitle: {
    type: String,
    required: true
  },
  metaDescription: {
    type: String,
    default: ''
  },
  analysis: {
    type: Object,
    required: true
  },
  optimizedTitle: {
    type: String,
    default: null
  },
  optimizedMetaDescription: {
    type: String,
    default: null
  },
  optimizedContent: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SEOAnalysis', SEOAnalysisSchema);
