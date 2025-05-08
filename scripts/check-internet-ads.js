/**
 * Script to check internet ads in the database
 * Run with: node scripts/check-internet-ads.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Ad = require('../models/Ad');
const SystemSetting = require('../models/SystemSetting');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function checkInternetAds() {
  try {
    // Check system settings
    const internetAdsSetting = await SystemSetting.findOne({ key: 'internetAdsEnabled' });
    const allAdsDisabledSetting = await SystemSetting.findOne({ key: 'allAdsDisabled' });
    
    console.log('System Settings:');
    console.log('- Internet Ads Enabled:', internetAdsSetting ? internetAdsSetting.value : 'not set');
    console.log('- All Ads Disabled:', allAdsDisabledSetting ? allAdsDisabledSetting.value : 'not set');
    
    // Count internet ads
    const internetAdsCount = await Ad.countDocuments({ source: 'internet' });
    console.log(`\nFound ${internetAdsCount} internet ads in the database`);
    
    // Count active internet ads
    const activeInternetAdsCount = await Ad.countDocuments({ 
      source: 'internet',
      active: true
    });
    console.log(`- ${activeInternetAdsCount} are active`);
    
    // Count inactive internet ads
    const inactiveInternetAdsCount = await Ad.countDocuments({ 
      source: 'internet',
      active: false
    });
    console.log(`- ${inactiveInternetAdsCount} are inactive`);
    
    // Count custom ads
    const customAdsCount = await Ad.countDocuments({ source: 'custom' });
    console.log(`\nFound ${customAdsCount} custom ads in the database`);
    
    // Count active custom ads
    const activeCustomAdsCount = await Ad.countDocuments({ 
      source: 'custom',
      active: true
    });
    console.log(`- ${activeCustomAdsCount} are active`);
    
    // Count inactive custom ads
    const inactiveCustomAdsCount = await Ad.countDocuments({ 
      source: 'custom',
      active: false
    });
    console.log(`- ${inactiveCustomAdsCount} are inactive`);
    
    // Check if we need to fetch internet ads
    if (internetAdsSetting && internetAdsSetting.value === true && internetAdsCount === 0) {
      console.log('\nInternet ads are enabled but none exist in the database.');
      console.log('You should run the fetchAndStoreInternetAds function to populate them.');
    }
    
  } catch (err) {
    console.error('Error checking internet ads:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Run the function
checkInternetAds();
