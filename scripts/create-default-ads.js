/**
 * Script to create default ads for testing
 * Run with: node scripts/create-default-ads.js
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

// Default ads to create
const defaultAds = [
  // Sidebar ads
  {
    title: 'Default Sidebar Ad',
    description: 'This is a default sidebar ad for testing',
    imageUrl: 'https://via.placeholder.com/160x600',
    link: 'https://example.com',
    positions: ['sidebar'],
    pages: ['all'],
    active: true,
    source: 'custom'
  },
  // Popup ads
  {
    title: 'Default Popup Ad',
    description: 'This is a default popup ad for testing',
    imageUrl: 'https://via.placeholder.com/300x250',
    link: 'https://example.com',
    positions: ['popup'],
    pages: ['all'],
    active: true,
    source: 'custom'
  },
  // Top banner ads
  {
    title: 'Default Top Banner Ad',
    description: 'This is a default top banner ad for testing',
    imageUrl: 'https://via.placeholder.com/728x90',
    link: 'https://example.com',
    positions: ['top'],
    pages: ['all'],
    active: true,
    source: 'custom'
  },
  // Bottom banner ads
  {
    title: 'Default Bottom Banner Ad',
    description: 'This is a default bottom banner ad for testing',
    imageUrl: 'https://via.placeholder.com/728x90',
    link: 'https://example.com',
    positions: ['bottom'],
    pages: ['all'],
    active: true,
    source: 'custom'
  },
  // Content ads
  {
    title: 'Default Content Ad',
    description: 'This is a default in-content ad for testing',
    imageUrl: 'https://via.placeholder.com/300x250',
    link: 'https://example.com',
    positions: ['content'],
    pages: ['all'],
    active: true,
    source: 'custom'
  },
  // Multi-position ad
  {
    title: 'Multi-Position Ad',
    description: 'This ad appears in multiple positions',
    imageUrl: 'https://via.placeholder.com/300x250',
    link: 'https://example.com',
    positions: ['sidebar', 'popup', 'content'],
    pages: ['all'],
    active: true,
    source: 'custom'
  }
];

// Create the default ads
async function createDefaultAds() {
  try {
    // Check if we already have ads
    const existingCount = await Ad.countDocuments();
    console.log(`Found ${existingCount} existing ads`);
    
    if (existingCount === 0) {
      // Create all default ads
      const result = await Ad.insertMany(defaultAds);
      console.log(`Created ${result.length} default ads`);
    } else {
      // Check if we have ads for each position
      const positions = ['sidebar', 'popup', 'top', 'bottom', 'content'];
      
      for (const position of positions) {
        const count = await Ad.countDocuments({ 
          positions: position,
          active: true
        });
        
        if (count === 0) {
          // Create a default ad for this position
          const defaultAd = defaultAds.find(ad => ad.positions.includes(position));
          if (defaultAd) {
            await Ad.create(defaultAd);
            console.log(`Created default ad for position: ${position}`);
          }
        } else {
          console.log(`Position ${position} already has ${count} ads`);
        }
      }
    }
    
    console.log('Default ads check complete');
  } catch (err) {
    console.error('Error creating default ads:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Run the function
createDefaultAds();
