/**
 * Script to check template CSS content
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
    
    // Find all templates
    const templates = await WebsiteTemplate.find();
    console.log(`Found ${templates.length} templates:`);
    
    if (templates.length > 0) {
      for (const template of templates) {
        console.log(`\nTemplate: ${template.name} (${template.isPaid ? 'Paid' : 'Free'})`);
        
        // Find template pages
        const templatePages = await TemplatePage.find({ templateId: template._id });
        console.log(`  Pages: ${templatePages.length}`);
        
        for (const page of templatePages) {
          console.log(`  - ${page.title} (${page.isHomePage ? 'Home' : 'Regular'})`);
          console.log(`    CSS Content: ${page.cssContent ? page.cssContent : 'None'}`);
        }
        
        // Find websites using this template
        const websites = await Website.find({ templateId: template._id });
        console.log(`  Websites using this template: ${websites.length}`);
        
        for (const website of websites) {
          console.log(`  - ${website.name} (${website._id})`);
          
          // Find website pages
          const websitePages = await WebsitePage.find({ websiteId: website._id });
          console.log(`    Pages: ${websitePages.length}`);
          
          for (const page of websitePages) {
            console.log(`    - ${page.title} (${page.isHomePage ? 'Home' : 'Regular'})`);
            console.log(`      CSS Content: ${page.cssContent ? page.cssContent : 'None'}`);
          }
        }
      }
    } else {
      console.log('No templates found in the database.');
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
