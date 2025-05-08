/**
 * Script to create a test ad that will definitely show up
 * Run with: node scripts/create-test-ad.js
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

async function createTestAd() {
  try {
    // Delete any existing test ads
    await Ad.deleteMany({ title: 'TEST AD - PLEASE SHOW' });
    
    // Create a new test ad for all positions
    const testAd = new Ad({
      source: 'custom',
      category: 'other',
      title: 'TEST AD - PLEASE SHOW',
      description: 'This is a test ad to debug the ad display system',
      imageUrl: 'https://via.placeholder.com/300x250/FF0000/FFFFFF?text=TEST+AD',
      link: 'https://example.com',
      positions: ['popup', 'top', 'bottom', 'sidebar', 'content'],
      pages: ['all'],
      active: true,
      startDate: new Date(2020, 0, 1), // Far in the past
      endDate: new Date(2030, 0, 1),   // Far in the future
      delay: 0,
      displayFrequency: 100,           // Show many times
      overlayText: 'TEST AD'
    });
    
    await testAd.save();
    console.log('Test ad created successfully');
    
    // Count active ads
    const activeAds = await Ad.countDocuments({ active: true });
    console.log(`There are now ${activeAds} active ads in the database`);
    
  } catch (err) {
    console.error('Error creating test ad:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Run the function
createTestAd();
