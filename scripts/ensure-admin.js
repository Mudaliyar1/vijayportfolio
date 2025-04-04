require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');

    try {
      // Find the admin user - use environment variable if available
      const adminEmail = process.env.ADMIN_EMAIL || 'vijaymudaliyar224@gmail.com';
      let adminUser = await User.findOne({ email: adminEmail });

      if (adminUser) {
        // Update the admin flag if needed
        if (!adminUser.isAdmin) {
          console.log(`Updating admin status for ${adminEmail}`);
          adminUser.isAdmin = true;
          await adminUser.save();
          console.log('Admin status updated successfully');
        } else {
          console.log(`User ${adminEmail} is already an admin`);
        }
      } else {
        console.log(`Admin user with email ${adminEmail} not found`);
      }
    } catch (err) {
      console.error('Error:', err);
    }

    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('MongoDB Disconnected');
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
