/**
 * Script to fix invalid maintenance history records
 * This script will:
 * 1. Find all maintenance history records
 * 2. Check if they have all required fields
 * 3. Fix any invalid records by adding missing required fields
 * 4. Remove any records that cannot be fixed
 *
 * Run with: node scripts/fix-maintenance-history.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const MaintenanceHistory = require('../models/MaintenanceHistory');
const MaintenanceMode = require('../models/MaintenanceMode');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB Connected');

  try {
    // Get all maintenance history records
    const historyRecords = await MaintenanceHistory.find({});
    console.log(`Found ${historyRecords.length} maintenance history records`);

    // Get the latest maintenance mode settings
    const maintenanceSettings = await MaintenanceMode.findOne().sort({ updatedAt: -1 });

    // Default admin ID (fallback)
    const defaultAdminId = new mongoose.Types.ObjectId('000000000000000000000000');

    // Track stats
    let fixedCount = 0;
    let removedCount = 0;

    // Process each record
    for (const record of historyRecords) {
      let needsSave = false;

      // Check required fields
      if (!record.reason) {
        record.reason = 'System Maintenance';
        needsSave = true;
      }

      if (!record.message) {
        record.message = 'Scheduled system maintenance';
        needsSave = true;
      }

      if (!record.startTime) {
        // Set to 1 hour before end time or current time
        if (record.endTime) {
          const startTime = new Date(record.endTime);
          startTime.setHours(startTime.getHours() - 1);
          record.startTime = startTime;
        } else {
          const startTime = new Date();
          startTime.setHours(startTime.getHours() - 1);
          record.startTime = startTime;
        }
        needsSave = true;
      }

      if (!record.endTime) {
        // Set to 1 hour after start time or current time
        if (record.startTime) {
          const endTime = new Date(record.startTime);
          endTime.setHours(endTime.getHours() + 1);
          record.endTime = endTime;
        } else {
          record.endTime = new Date();
        }
        needsSave = true;
      }

      if (!record.durationUnit) {
        record.durationUnit = 'hours';
        needsSave = true;
      }

      if (!record.durationValue) {
        // Calculate duration based on start and end times
        if (record.startTime && record.endTime) {
          const durationMs = record.endTime - record.startTime;
          const durationHours = Math.max(1, Math.round(durationMs / (1000 * 60 * 60)));
          record.durationValue = durationHours;
        } else {
          record.durationValue = 1; // Default to 1 hour
        }
        needsSave = true;
      }

      if (!record.adminId) {
        // Use the admin ID from maintenance settings or default
        if (maintenanceSettings && maintenanceSettings.updatedBy) {
          record.adminId = maintenanceSettings.updatedBy;
        } else {
          record.adminId = defaultAdminId;
        }
        needsSave = true;
      }

      // Save the record if it was modified
      if (needsSave) {
        try {
          await record.save();
          console.log(`Fixed record ${record._id}`);
          fixedCount++;
        } catch (err) {
          console.error(`Error saving record ${record._id}:`, err);

          // If we can't save it, delete it
          try {
            await MaintenanceHistory.findByIdAndDelete(record._id);
            console.log(`Removed invalid record ${record._id}`);
            removedCount++;
          } catch (deleteErr) {
            console.error(`Error deleting record ${record._id}:`, deleteErr);
          }
        }
      }
    }

    console.log(`Fixed ${fixedCount} records, removed ${removedCount} invalid records`);
  } catch (err) {
    console.error('Error processing maintenance history records:', err);
  }

  // Close the connection
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
