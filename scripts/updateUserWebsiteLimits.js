require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Update all users to have unlimited websites
const updateUserWebsiteLimits = async () => {
  try {
    // Find all users with an active package
    const users = await User.find({ activePackage: { $ne: null } });
    
    console.log(`Found ${users.length} users with active packages`);
    
    // Update each user to have unlimited websites
    for (const user of users) {
      user.maxWebsites = 999999; // Effectively unlimited
      await user.save();
      console.log(`Updated user ${user.username} to have unlimited websites`);
    }
    
    console.log('All users updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error updating users:', err);
    process.exit(1);
  }
};

// Run the update function
updateUserWebsiteLimits();
