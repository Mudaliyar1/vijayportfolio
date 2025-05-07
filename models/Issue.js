const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Bug', 'Feature Request', 'Feedback', 'Other']
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminReplies: [{
    message: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
IssueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate a unique token ID
IssueSchema.statics.generateTokenId = async function() {
  const prefix = 'ISSUE-';
  let tokenId;
  let isUnique = false;
  
  // Keep generating until we find a unique token ID
  while (!isUnique) {
    // Generate a random 6-digit number
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    tokenId = `${prefix}${randomNum}`;
    
    // Check if this token ID already exists
    const existingIssue = await this.findOne({ tokenId });
    if (!existingIssue) {
      isUnique = true;
    }
  }
  
  return tokenId;
};

module.exports = mongoose.model('Issue', IssueSchema);
