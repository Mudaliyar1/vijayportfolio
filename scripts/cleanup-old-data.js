/**
 * Database Cleanup Script
 * 
 * This script deletes all old website, payment, and package data
 * to provide a fresh start for the new website builder implementation.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Website = require('../models/Website');
const WebsitePage = require('../models/WebsitePage');
const WebsiteElement = require('../models/WebsiteElement');
const Payment = require('../models/Payment');
const Package = require('../models/Package');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function cleanupDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Get counts before deletion
    const websiteCount = await Website.countDocuments();
    const pageCount = await WebsitePage.countDocuments();
    const elementCount = await WebsiteElement.countDocuments();
    const paymentCount = await Payment.countDocuments();
    const packageCount = await Package.countDocuments();
    
    console.log('Current data counts:');
    console.log(`- Websites: ${websiteCount}`);
    console.log(`- Website Pages: ${pageCount}`);
    console.log(`- Website Elements: ${elementCount}`);
    console.log(`- Payments: ${paymentCount}`);
    console.log(`- Packages: ${packageCount}`);
    
    // Delete all website elements
    console.log('Deleting website elements...');
    const elementsResult = await WebsiteElement.deleteMany({});
    console.log(`Deleted ${elementsResult.deletedCount} website elements`);
    
    // Delete all website pages
    console.log('Deleting website pages...');
    const pagesResult = await WebsitePage.deleteMany({});
    console.log(`Deleted ${pagesResult.deletedCount} website pages`);
    
    // Delete all payments
    console.log('Deleting payments...');
    const paymentsResult = await Payment.deleteMany({});
    console.log(`Deleted ${paymentsResult.deletedCount} payments`);
    
    // Delete all websites
    console.log('Deleting websites...');
    const websitesResult = await Website.deleteMany({});
    console.log(`Deleted ${websitesResult.deletedCount} websites`);
    
    // Delete all packages
    console.log('Deleting packages...');
    const packagesResult = await Package.deleteMany({});
    console.log(`Deleted ${packagesResult.deletedCount} packages`);
    
    console.log('Database cleanup completed successfully!');
    
    // Create default free package
    console.log('Creating default free package...');
    const freePackage = new Package({
      name: 'Free',
      price: 0,
      isFree: true,
      pagesAllowed: 1,
      features: {
        aiContent: true,
        seo: false,
        fullAi: false
      },
      description: 'Free package with basic features. Create a simple one-page website.',
      isActive: true
    });
    
    await freePackage.save();
    console.log('Default free package created successfully!');
    
    // Create starter paid package
    console.log('Creating starter paid package...');
    const starterPackage = new Package({
      name: 'Starter',
      price: 500,
      isFree: false,
      pagesAllowed: 3,
      features: {
        aiContent: true,
        seo: false,
        fullAi: true
      },
      description: 'Starter package with enhanced features. Create a professional website with up to 3 pages.',
      isActive: true
    });
    
    await starterPackage.save();
    console.log('Starter paid package created successfully!');
    
    // Create pro paid package
    console.log('Creating pro paid package...');
    const proPackage = new Package({
      name: 'Pro',
      price: 1000,
      isFree: false,
      pagesAllowed: 5,
      features: {
        aiContent: true,
        seo: true,
        fullAi: true
      },
      description: 'Professional package with all features. Create a comprehensive website with up to 5 pages.',
      isActive: true
    });
    
    await proPackage.save();
    console.log('Pro paid package created successfully!');
    
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the cleanup function
cleanupDatabase();
