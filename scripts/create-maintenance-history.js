require('dotenv').config();
const mongoose = require('mongoose');
const MaintenanceHistory = require('../models/MaintenanceHistory');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    try {
      // Find an admin user to associate with the history
      const adminEmail = process.env.ADMIN_EMAIL || 'vijaymudaliyar224@gmail.com';
      const adminUser = await User.findOne({ email: adminEmail });
      
      if (!adminUser) {
        console.error('Admin user not found');
        mongoose.disconnect();
        return;
      }
      
      // Create a sample maintenance history record
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - 2); // 2 hours ago
      
      const endTime = new Date();
      endTime.setHours(endTime.getHours() - 1); // 1 hour ago
      
      const historyRecord = new MaintenanceHistory({
        reason: 'System Update',
        message: 'Updating the AI model and database optimizations',
        startTime,
        endTime,
        durationUnit: 'hours',
        durationValue: 1,
        actualEndTime: endTime,
        status: 'completed',
        adminId: adminUser._id,
        loginAttempts: 3,
        notes: 'This is a sample maintenance record created by the script'
      });
      
      const savedRecord = await historyRecord.save();
      console.log('Created maintenance history record:', {
        id: savedRecord._id,
        reason: savedRecord.reason,
        startTime: savedRecord.startTime,
        endTime: savedRecord.endTime,
        status: savedRecord.status
      });
      
      // Check if the record was saved
      const count = await MaintenanceHistory.countDocuments();
      console.log(`Total maintenance history records: ${count}`);
      
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
