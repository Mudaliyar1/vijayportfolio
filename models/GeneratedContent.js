const mongoose = require('mongoose');

const GeneratedContentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['website', 'blog', 'social', 'email', 'product', 'seo', 'other']
  },
  tone: {
    type: String,
    required: true,
    enum: ['professional', 'casual', 'friendly', 'formal', 'persuasive']
  },
  length: {
    type: String,
    required: true,
    enum: ['short', 'medium', 'long']
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentTemplate',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GeneratedContent', GeneratedContentSchema);
