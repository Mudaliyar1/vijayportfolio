/**
 * Script to fix corrupted sessions in MongoDB
 * This script will:
 * 1. Remove all corrupted sessions
 * 2. Ensure all sessions have proper expires field
 * 
 * Run with: node scripts/fix-sessions.js
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
  
  // Get all sessions
  return sessionsCollection.find({}).toArray()
    .then(sessions => {
      console.log(`Found ${sessions.length} sessions`);
      
      const now = new Date();
      const stats = {
        total: sessions.length,
        corrupted: 0,
        fixed: 0,
        deleted: 0
      };
      
      const updatePromises = sessions.map(session => {
        // Check if session is missing expires field
        if (!session.expires) {
          console.log(`Session ${session._id} is missing expires field - deleting`);
          return sessionsCollection.deleteOne({ _id: session._id })
            .then(() => {
              stats.corrupted++;
              stats.deleted++;
            });
        }
        
        // Check if session.session is not a string
        if (typeof session.session !== 'string') {
          console.log(`Session ${session._id} has invalid session data - deleting`);
          return sessionsCollection.deleteOne({ _id: session._id })
            .then(() => {
              stats.corrupted++;
              stats.deleted++;
            });
        }
        
        // Try to parse the session data
        try {
          JSON.parse(session.session);
          // Session data is valid JSON, no need to fix
          return Promise.resolve();
        } catch (e) {
          // Session data is not valid JSON, delete it
          console.log(`Session ${session._id} has invalid JSON - deleting`);
          return sessionsCollection.deleteOne({ _id: session._id })
            .then(() => {
              stats.corrupted++;
              stats.deleted++;
            });
        }
      });
      
      return Promise.all(updatePromises)
        .then(() => {
          console.log('\nSession Fix Summary:');
          console.log('------------------------');
          console.log(`Total sessions found: ${stats.total}`);
          console.log(`Corrupted sessions: ${stats.corrupted}`);
          console.log(`Fixed sessions: ${stats.fixed}`);
          console.log(`Deleted sessions: ${stats.deleted}`);
          
          return mongoose.connection.close();
        });
    });
})
.then(() => {
  console.log('\nMongoDB connection closed');
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
