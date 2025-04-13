const mongoose = require('mongoose');

const NeuralConnectionSchema = new mongoose.Schema({
  // Source dreamscape
  sourceDreamscapeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NeuralDreamscape',
    required: true
  },
  // Target dreamscape
  targetDreamscapeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NeuralDreamscape',
    required: true
  },
  // Connection strength (0-100)
  strength: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  // Connection type
  type: {
    type: String,
    enum: ['similarity', 'contrast', 'inspiration', 'evolution', 'custom'],
    default: 'similarity'
  },
  // Description of the connection
  description: {
    type: String,
    default: ''
  },
  // Whether the connection was AI-suggested
  isAiSuggested: {
    type: Boolean,
    default: false
  },
  // Whether the connection has been confirmed by users
  isConfirmed: {
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

// Ensure connections are unique
NeuralConnectionSchema.index(
  { sourceDreamscapeId: 1, targetDreamscapeId: 1 },
  { unique: true }
);

// Update the updatedAt field on save
NeuralConnectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('NeuralConnection', NeuralConnectionSchema);
