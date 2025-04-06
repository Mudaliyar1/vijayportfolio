require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('../models/Package');

// Default packages
const defaultPackages = [
  {
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
  },
  {
    name: 'Starter',
    price: 500,
    description: 'Perfect for small businesses just getting started online',
    features: [
      'Up to 3 pages',
      'Responsive design',
      'Basic site editor',
      'Contact form',
      'SEO optimization'
    ],
    maxPages: 3,
    allowBlog: false,
    allowGallery: false,
    allowContact: true,
    allowTestimonials: false,
    allowEcommerce: false,
    allowAiContent: false,
    allowCustomLayout: false,
    active: true
  },
  {
    name: 'Pro',
    price: 1000,
    description: 'Comprehensive solution for growing businesses',
    features: [
      'Up to 5 pages',
      'Responsive design',
      'Advanced editor',
      'Blog functionality',
      'Gallery/portfolio',
      'Contact form',
      'SEO optimization'
    ],
    maxPages: 5,
    allowBlog: true,
    allowGallery: true,
    allowContact: true,
    allowTestimonials: false,
    allowEcommerce: false,
    allowAiContent: false,
    allowCustomLayout: false,
    active: true
  },
  {
    name: 'Business',
    price: 2000,
    description: 'Complete business solution with advanced features',
    features: [
      'Up to 8 pages',
      'Responsive design',
      'Advanced editor',
      'Blog functionality',
      'Gallery/portfolio',
      'Contact form',
      'Testimonials section',
      'Custom layout options',
      'SEO optimization',
      'Priority support'
    ],
    maxPages: 8,
    allowBlog: true,
    allowGallery: true,
    allowContact: true,
    allowTestimonials: true,
    allowEcommerce: false,
    allowAiContent: false,
    allowCustomLayout: true,
    active: true
  },
  {
    name: 'Premium',
    price: 5000,
    description: 'All-inclusive package with e-commerce and AI content',
    features: [
      'Up to 10 pages',
      'Responsive design',
      'Advanced editor',
      'Blog functionality',
      'Gallery/portfolio',
      'Contact form',
      'Testimonials section',
      'E-commerce functionality',
      'AI-generated content',
      'Custom layout options',
      'SEO optimization',
      'Priority support',
      'Monthly performance report'
    ],
    maxPages: 10,
    allowBlog: true,
    allowGallery: true,
    allowContact: true,
    allowTestimonials: true,
    allowEcommerce: true,
    allowAiContent: true,
    allowCustomLayout: true,
    active: true
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB Connected');
  
  try {
    // Check if packages already exist
    const existingPackages = await Package.find();
    
    if (existingPackages.length > 0) {
      console.log(`${existingPackages.length} packages already exist in the database.`);
      console.log('Do you want to reset all packages? (yes/no)');
      
      // Simple way to get user input in Node.js
      process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase();
        
        if (answer === 'yes' || answer === 'y') {
          // Delete all existing packages
          await Package.deleteMany({});
          console.log('All existing packages deleted.');
          
          // Insert default packages
          await Package.insertMany(defaultPackages);
          console.log(`${defaultPackages.length} default packages inserted successfully.`);
        } else {
          console.log('Operation cancelled. Existing packages were not modified.');
        }
        
        mongoose.connection.close();
        process.exit(0);
      });
    } else {
      // Insert default packages
      await Package.insertMany(defaultPackages);
      console.log(`${defaultPackages.length} default packages inserted successfully.`);
      
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
