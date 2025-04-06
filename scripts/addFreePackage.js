require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('../models/Package');

// Free package definition
const freePackage = {
  name: 'Free',
  price: 0,
  description: 'Basic single-page website with essential features',
  features: [
    'Single page website',
    'Responsive design',
    'Basic layout',
    'Contact information'
  ],
  maxPages: 1,
  allowBlog: false,
  allowGallery: false,
  allowContact: false,
  allowTestimonials: false,
  allowEcommerce: false,
  allowAiContent: false,
  allowCustomLayout: false,
  active: true
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB Connected');
  
  try {
    // Check if free package already exists
    const existingFreePackage = await Package.findOne({ price: 0 });
    
    if (existingFreePackage) {
      console.log('Free package already exists.');
      mongoose.connection.close();
      process.exit(0);
    } else {
      // Create free package
      const newFreePackage = new Package(freePackage);
      await newFreePackage.save();
      console.log('Free package created successfully!');
      mongoose.connection.close();
      process.exit(0);
    }
  } catch (err) {
    console.error('Error:', err);
    mongoose.connection.close();
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});
