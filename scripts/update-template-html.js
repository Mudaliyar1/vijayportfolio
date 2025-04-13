/**
 * Script to update template HTML content
 */

require('dotenv').config();
const mongoose = require('mongoose');
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
        
        // Update the HTML content to remove "nooooo" from the header
        const originalHtml = page.htmlContent;
        
        // Update the website name in the HTML
        const updatedHtml = originalHtml.replace(
          /<h1>My Website<\/h1>/,
          `<h1>${website.name}</h1>`
        );
        
        // Save the updated HTML
        page.htmlContent = updatedHtml;
        await page.save();
        
        console.log(`    Updated HTML content for page ${page.title}`);
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
