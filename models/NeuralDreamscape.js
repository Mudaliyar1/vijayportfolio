const mongoose = require('mongoose');

const NeuralDreamscapeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  // Canvas data stored as JSON
  canvasData: {
    type: Object,
    default: {}
  },
  // Themes/concepts represented in this dreamscape
  themes: [String],
  // AI-generated insights about this dreamscape
  aiInsights: {
    type: String,
    default: ''
  },
  // Color palette used in the dreamscape
  colorPalette: {
    primary: {
      type: String,
      default: '#00f2ff' // Default neon blue
    },
    secondary: {
      type: String,
      default: '#8a2be2' // Default neon purple
    },
    accent: {
      type: String,
      default: '#ff00ff' // Default magenta
    },
    background: {
      type: String,
      default: '#1f2937' // Default dark background
    }
  },
  // Stats
  stats: {
    views: {
      type: Number,
      default: 0
    },
    connections: {
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

// Update the updatedAt field on save
NeuralDreamscapeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('NeuralDreamscape', NeuralDreamscapeSchema);
