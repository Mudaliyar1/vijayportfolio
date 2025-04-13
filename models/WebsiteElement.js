const mongoose = require('mongoose');

const WebsiteElementSchema = new mongoose.Schema({
  pageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsitePage',
    required: true
  },
  type: {
    type: String,
    enum: [
      // Basic elements
      'heading',
      'paragraph',
      'text',
      'button',
      'image',
      'video',
      'audio',
      'icon',
      'list',
      'grid',
      'spacer',
      'divider',

      // Form elements
      'input',
      'textarea',
      'checkbox',
      'radio',
      'select',
      'form',
      'contact-form',
      'login-form',
      'register-form',

      // Layout elements
      'section',
      'navbar',
      'footer',
      'hero',

      // Advanced elements
      'carousel',
      'tabs',
      'accordion',
      'modal',
      'pricing',
      'pricing-table',
      'testimonial',
      'team',
      'progress',
      'counter',
      'chart',
      'gallery',
      'map',

      // Media elements
      'embed',
      'svg',
      'lottie',
      '360',
      'file'
    ],
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  styles: {
    type: String,
    default: '',
    // Increase the max length to accommodate more complex styles
    maxlength: 5000
  },
  position: {
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    },
    width: {
      type: Number,
      default: 100
    },
    height: {
      type: Number,
      default: 100
    },
    zIndex: {
      type: Number,
      default: 0
    }
  },
  isHidden: {
    type: Boolean,
    default: false
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
WebsiteElementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WebsiteElement', WebsiteElementSchema);
