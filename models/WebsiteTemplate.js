const mongoose = require('mongoose');

const WebsiteTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  thumbnail: {
    type: String,
    required: true,
    default: '/images/templates/placeholder.jpg'
  },
  category: {
    type: String,
    required: true,
    enum: ['Business', 'Portfolio', 'Blog', 'E-commerce', 'Landing Page', 'Personal', 'Other'],
    default: 'Other'
  },
  tags: {
    type: [String],
    default: []
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
WebsiteTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WebsiteTemplate', WebsiteTemplateSchema);
