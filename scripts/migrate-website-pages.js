/**
 * Migration script to add htmlContent field to existing WebsitePage documents
 *
 * This script:
 * 1. Finds all WebsitePage documents
 * 2. For each page, copies the content field to htmlContent if htmlContent is empty
 *
 * Run with: node scripts/migrate-website-pages.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const WebsitePage = require('../models/WebsitePage');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log('MongoDB Connected');
    await migrateWebsitePages();
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

connectDB();

async function migrateWebsitePages() {
  try {
    // Find all website pages
    const pages = await WebsitePage.find({});
    console.log(`Found ${pages.length} website pages`);

    let updatedCount = 0;

    // Process each page
    for (const page of pages) {
      // If the page has content but no htmlContent, copy content to htmlContent
      if (page.content && !page.htmlContent) {
        page.htmlContent = page.content;
        await page.save();
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} website pages`);
    console.log('Migration completed successfully');

    // Close MongoDB connection
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    mongoose.connection.close();
    process.exit(1);
  }
}
