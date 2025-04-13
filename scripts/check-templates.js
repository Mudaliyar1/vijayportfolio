/**
 * Script to check existing templates
 */

require('dotenv').config();
const mongoose = require('mongoose');
const WebsiteTemplate = require('../models/WebsiteTemplate');

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
      templates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name} (${template.isPaid ? 'Paid' : 'Free'})`);
      });
    } else {
      console.log('No templates found in the database.');
    }
    
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

connectDB();
