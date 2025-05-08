/**
 * Script to fix disabled ads that are still marked as active
 * Run with: node scripts/fix-disabled-ads.js
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

async function fixDisabledAds() {
  try {
    // Check system settings
    const allAdsDisabledSetting = await SystemSetting.findOne({ key: 'allAdsDisabled' });
    const internetAdsSetting = await SystemSetting.findOne({ key: 'internetAdsEnabled' });
    
    console.log('System Settings:');
    console.log('- All Ads Disabled:', allAdsDisabledSetting ? allAdsDisabledSetting.value : 'not set');
    console.log('- Internet Ads Enabled:', internetAdsSetting ? internetAdsSetting.value : 'not set');
    
    // Fix internet ads if they're disabled but still active
    if (internetAdsSetting && internetAdsSetting.value === false) {
      const activeInternetAds = await Ad.find({ 
        source: 'internet',
        active: true
      });
      
      if (activeInternetAds.length > 0) {
        console.log(`\nFound ${activeInternetAds.length} active internet ads while internet ads are disabled.`);
        console.log('Deactivating these ads...');
        
        const result = await Ad.updateMany(
          { source: 'internet', active: true },
          { $set: { active: false } }
        );
        
        console.log(`Updated ${result.modifiedCount} internet ads to inactive.`);
      } else {
        console.log('\nNo active internet ads found while internet ads are disabled. No action needed.');
      }
    }
    
    // Check for any inactive ads that should be active
    if (internetAdsSetting && internetAdsSetting.value === true) {
      const inactiveInternetAds = await Ad.find({ 
        source: 'internet',
        active: false
      });
      
      if (inactiveInternetAds.length > 0) {
        console.log(`\nFound ${inactiveInternetAds.length} inactive internet ads while internet ads are enabled.`);
        console.log('Activating these ads...');
        
        const result = await Ad.updateMany(
          { source: 'internet', active: false },
          { $set: { active: true } }
        );
        
        console.log(`Updated ${result.modifiedCount} internet ads to active.`);
      }
    }
    
    console.log('\nAd status check complete.');
  } catch (err) {
    console.error('Error fixing disabled ads:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Run the function
fixDisabledAds();
