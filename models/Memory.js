const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  guestId: {
    type: String,
    default: null
  },
  languagePreferences: {
    primary: {
      type: String,
      default: 'english'
    },
    secondary: {
      type: String,
      default: null
    },
    history: [{
      language: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  context: {
    type: String,
    required: true,
    default: 'General conversation'
  },
  interactions: [{
    query: {
      type: String,
      required: true
    },
    queryLanguage: {
      primary: String,
      secondary: String,
      mixed: {
        type: Boolean,
        default: false
      },
      confidence: Number
    },
    response: {
      type: String,
      required: true
    },
    responseLanguage: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    feedback: {
      helpful: {
        type: Boolean,
        default: null
      },
      notes: {
        type: String,
        default: ''
      }
    }
  }],
  learningProgress: {
    languages: [{
      name: String,
      proficiency: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
      },
      commonPhrases: [String],
      lastUsed: Date
    }],
    topics: [{
      name: String,
      frequency: {
        type: Number,
        default: 1
      },
      lastDiscussed: Date
    }]
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
MemorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Memory', MemorySchema);
