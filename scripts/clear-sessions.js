/**
 * Script to clear all sessions from MongoDB
 * Run with: node scripts/clear-sessions.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB Connected');
  
  // Get the sessions collection
  const sessionsCollection = mongoose.connection.collection('sessions');
  
  // Delete all sessions
  return sessionsCollection.deleteMany({})
    .then(result => {
      console.log(`Deleted ${result.deletedCount} sessions`);
      return mongoose.connection.close();
    });
})
.then(() => {
  console.log('MongoDB connection closed');
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
