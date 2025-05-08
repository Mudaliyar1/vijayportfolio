/**
 * Script to clear all sessions from MongoDB
 * This can be useful when there are session-related issues in production
 *
 * Run with: node scripts/clear-sessions.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
    return true;
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    return false;
  }
}

// Clear sessions
async function clearSessions() {
  try {
    // Connect to the database
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to database. Cannot clear sessions.');
      process.exit(1);
    }

    // Get the sessions collection
    const sessionsCollection = mongoose.connection.db.collection('sessions');

    // Count sessions before deletion
    const sessionCount = await sessionsCollection.countDocuments();
    console.log(`Found ${sessionCount} sessions in the database.`);

    // Delete all sessions
    const result = await sessionsCollection.deleteMany({});
    console.log(`Deleted ${result.deletedCount} sessions.`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed.');

    console.log('Session clearing complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing sessions:', err);
    process.exit(1);
  }
}

// Run the script
clearSessions();
