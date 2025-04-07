/**
 * Script to clean up the sessions collection in MongoDB
 * This script will:
 * 1. Remove expired sessions
 * 2. Remove invalid sessions (not valid JSON)
 * 3. Remove sessions with no user data
 * 4. Clear flash messages from valid sessions
 * 
 * Run with: node scripts/cleanup-sessions.js
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
  
  // Find all sessions
  return sessionsCollection.find({}).toArray()
    .then(sessions => {
      console.log(`Found ${sessions.length} sessions`);
      
      let stats = {
        expired: 0,
        invalid: 0,
        noUser: 0,
        flashCleared: 0,
        total: sessions.length
      };
      
      const now = new Date();
      
      const updatePromises = sessions.map(session => {
        try {
          // Check if session has expired
          if (session.expires && new Date(session.expires) < now) {
            console.log(`Removing expired session: ${session._id}`);
            return sessionsCollection.deleteOne({ _id: session._id })
              .then(() => {
                stats.expired++;
              });
          }
          
          // Check if session.session is a string
          if (typeof session.session !== 'string') {
            console.log(`Removing invalid session (not a string): ${session._id}`);
            return sessionsCollection.deleteOne({ _id: session._id })
              .then(() => {
                stats.invalid++;
              });
          }
          
          // Handle case where session is "[object Object]"
          if (session.session === "[object Object]") {
            console.log(`Removing corrupted session: ${session._id}`);
            return sessionsCollection.deleteOne({ _id: session._id })
              .then(() => {
                stats.invalid++;
              });
          }
          
          try {
            // Parse the session data
            const sessionData = JSON.parse(session.session);
            
            // Check if session has user data
            const hasUser = sessionData.passport && sessionData.passport.user;
            
            if (!hasUser) {
              console.log(`Removing session with no user data: ${session._id}`);
              return sessionsCollection.deleteOne({ _id: session._id })
                .then(() => {
                  stats.noUser++;
                });
            }
            
            // Check if the session has flash data
            if (sessionData.flash) {
              // Remove flash data
              delete sessionData.flash;
              
              // Update the session
              return sessionsCollection.updateOne(
                { _id: session._id },
                { $set: { session: JSON.stringify(sessionData) } }
              ).then(() => {
                stats.flashCleared++;
              });
            }
            
            return Promise.resolve();
          } catch (parseErr) {
            console.error(`Error parsing session ${session._id}:`, parseErr);
            console.log(`Removing unparseable session: ${session._id}`);
            return sessionsCollection.deleteOne({ _id: session._id })
              .then(() => {
                stats.invalid++;
              });
          }
        } catch (err) {
          console.error('Error processing session:', err);
          return Promise.resolve();
        }
      });
      
      return Promise.all(updatePromises)
        .then(() => {
          console.log('\nSession Cleanup Summary:');
          console.log('------------------------');
          console.log(`Total sessions found: ${stats.total}`);
          console.log(`Expired sessions removed: ${stats.expired}`);
          console.log(`Invalid sessions removed: ${stats.invalid}`);
          console.log(`Sessions with no user removed: ${stats.noUser}`);
          console.log(`Sessions with flash messages cleared: ${stats.flashCleared}`);
          console.log(`Total sessions processed: ${stats.expired + stats.invalid + stats.noUser + stats.flashCleared}`);
          
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
