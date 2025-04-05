const mongoose = require('mongoose');

const CommunityPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Question', 'Discussion', 'Showcase', 'Feedback', 'Announcement', 'Other'],
    default: 'Discussion'
  },
  tags: {
    type: [String],
    default: []
  },
  media: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
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
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
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
CommunityPostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a text index for search functionality
CommunityPostSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text'
});

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);
