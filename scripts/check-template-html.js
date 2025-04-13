/**
 * Script to check template HTML content
 */

require('dotenv').config();
const mongoose = require('mongoose');
const WebsiteTemplate = require('../models/WebsiteTemplate');
const TemplatePage = require('../models/TemplatePage');
const Website = require('../models/Website');
const WebsitePage = require('../models/WebsitePage');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Connected');
    
    // Find the website with name "nooooo"
    const website = await Website.findOne({ name: "nooooo" });
    
    if (website) {
      console.log(`Found website: ${website.name} (${website._id})`);
      
      // Find website pages
      const websitePages = await WebsitePage.find({ websiteId: website._id });
      console.log(`  Pages: ${websitePages.length}`);
      
      for (const page of websitePages) {
        console.log(`  - ${page.title} (${page.isHomePage ? 'Home' : 'Regular'})`);
        console.log(`    HTML Content:\n${page.htmlContent}`);
      }
    } else {
      console.log('Website "nooooo" not found in the database.');
    }
    
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

connectDB();
