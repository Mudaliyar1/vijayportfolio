const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['AI Research', 'Tech News', 'Tutorial', 'Opinion', 'Case Study', 'Other'],
    default: 'Other'
  },
  tags: {
    type: [String],
    default: []
  },
  featuredImage: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true
    },
    date: {
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

// Update the updatedAt field before saving
BlogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a text index for search functionality
BlogSchema.index({ 
  title: 'text', 
  content: 'text', 
  summary: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Blog', BlogSchema);
