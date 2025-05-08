/**
 * Script to manually fetch internet ads
 * Run with: node scripts/fetch-internet-ads.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const internetAdsService = require('../services/internetAdsService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fetchInternetAds() {
  try {
    console.log('Checking if internet ads are enabled...');
    const enabled = await internetAdsService.areInternetAdsEnabled();
    
    if (enabled) {
      console.log('Internet ads are enabled. Fetching ads...');
      const count = await internetAdsService.fetchAndStoreInternetAds();
      console.log(`Successfully fetched and stored ${count} internet ads.`);
    } else {
      console.log('Internet ads are disabled. Enable them in the admin settings first.');
    }
  } catch (err) {
    console.error('Error fetching internet ads:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Run the function
fetchInternetAds();
