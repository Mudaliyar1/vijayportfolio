const mongoose = require('mongoose');

const DigitalTwinSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    default: function() {
      return 'Digital Twin';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  // Personality traits and characteristics
  personality: {
    type: String,
    default: ''
  },
  interests: [String],
  expertise: [String],
  tone: {
    type: String,
    enum: ['professional', 'casual', 'friendly', 'formal', 'humorous'],
    default: 'friendly'
  },
  // Training data
  trainingData: [{
    question: String,
    answer: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Configuration
  configuration: {
    responseLength: {
      type: Number,
      default: 300, // Max tokens for response
      min: 50,
      max: 800
    },
    creativity: {
      type: Number,
      default: 0.7, // Temperature for AI responses
      min: 0.1,
      max: 1.0
    },
    contextMemory: {
      type: Number,
      default: 5, // Number of previous interactions to remember
      min: 1,
      max: 10
    }
  },
  // Interaction history
  interactions: [{
    visitorId: String, // Anonymous ID for visitors
    messages: [{
      role: {
        type: String,
        enum: ['visitor', 'twin'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    startedAt: {
      type: Date,
      default: Date.now
    },
    lastInteractionAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Stats
  stats: {
    totalInteractions: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    lastInteractionAt: {
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
DigitalTwinSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DigitalTwin', DigitalTwinSchema);
