const mongoose = require('mongoose');

const PackageInquirySchema = new mongoose.Schema({
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketingPackage',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  budget: {
    type: Number,
    default: 0
  },
  preferences: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'approved', 'completed', 'cancelled'],
    default: 'new'
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

module.exports = mongoose.model('PackageInquiry', PackageInquirySchema);
