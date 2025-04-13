const mongoose = require('mongoose');

const WebsiteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsiteTemplate',
    default: null
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  domain: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return this.domain;
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'rejected'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  unpublishedBy: {
    type: String,
    enum: ['user', 'admin', null],
    default: null
  },
  settings: {
    theme: {
      type: String,
      default: 'default'
    },
    fonts: {
      heading: {
        type: String,
        default: 'Poppins'
      },
      body: {
        type: String,
        default: 'Poppins'
      }
    },
    colors: {
      primary: {
        type: String,
        default: '#3b82f6'
      },
      secondary: {
        type: String,
        default: '#10b981'
      },
      background: {
        type: String,
        default: '#ffffff'
      },
      text: {
        type: String,
        default: '#111827'
      }
    }
  },
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
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    lastViewed: {
      type: Date,
      default: null
    }
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
WebsiteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Website', WebsiteSchema);
