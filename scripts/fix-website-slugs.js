/**
 * Fix Website Slugs Script
 * 
 * This script fixes any websites with null or missing slug values
 * by setting the slug to match the domain.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Website = require('../models/Website');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixWebsiteSlugs() {
  try {
    console.log('Starting website slug fix...');
    
    // Find all websites with null or missing slug
    const websites = await Website.find({ $or: [{ slug: null }, { slug: { $exists: false } }] });
    console.log(`Found ${websites.length} websites with missing or null slugs`);
    
    let fixedCount = 0;
    
    for (const website of websites) {
      // Use domain as the slug
      website.slug = website.domain;
      
      // Save the updated website
      await website.save();
      fixedCount++;
      console.log(`Fixed website ${website._id} - Set slug to: ${website.slug}`);
    }
    
    console.log(`Fix complete. Fixed ${fixedCount} websites.`);
    
  } catch (error) {
    console.error('Error during website slug fix:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the fix function
fixWebsiteSlugs();
