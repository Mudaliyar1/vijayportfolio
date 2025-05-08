/**
 * Script to remove the test ad
 * Run with: node scripts/remove-test-ad.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Ad = require('../models/Ad');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function removeTestAd() {
  try {
    // Delete the test ad
    const result = await Ad.deleteOne({ title: 'TEST AD - PLEASE SHOW' });
    
    if (result.deletedCount > 0) {
      console.log('Test ad removed successfully');
    } else {
      console.log('No test ad found to remove');
    }
    
    // Count active ads
    const activeAds = await Ad.countDocuments({ active: true });
    console.log(`There are now ${activeAds} active ads in the database`);
    
  } catch (err) {
    console.error('Error removing test ad:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Run the function
removeTestAd();
