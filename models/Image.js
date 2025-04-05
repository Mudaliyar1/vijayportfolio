const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  guestId: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['generated', 'uploaded', 'transformed'],
    required: true
  },
  prompt: {
    type: String,
    default: ''
  },
  referenceImagePath: {
    type: String,
    default: null
  },
  style: {
    type: String,
    default: ''
  },
  originalImagePath: {
    type: String,
    default: null
  },
  imagePath: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Image', ImageSchema);
