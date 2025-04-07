/**
 * Script to clear all flash messages from the session store
 * Run with: node scripts/clear-flash-messages.js
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

      let updatedCount = 0;
      const updatePromises = sessions.map(session => {
        try {
          // Check if session.session is a string
          if (typeof session.session !== 'string') {
            console.log(`Removing invalid session: ${session._id}`);
            return sessionsCollection.deleteOne({ _id: session._id })
              .then(() => {
                updatedCount++;
              });
          }

          // Handle case where session is "[object Object]"
          if (session.session === "[object Object]") {
            console.log(`Removing corrupted session: ${session._id}`);
            return sessionsCollection.deleteOne({ _id: session._id })
              .then(() => {
                updatedCount++;
              });
          }

          try {
            // Parse the session data
            const sessionData = JSON.parse(session.session);

            // Check if the session has flash data
            if (sessionData.flash) {
              // Remove flash data
              delete sessionData.flash;

              // Update the session
              return sessionsCollection.updateOne(
                { _id: session._id },
                { $set: { session: JSON.stringify(sessionData) } }
              ).then(() => {
                updatedCount++;
              });
            }
            return Promise.resolve();
          } catch (parseErr) {
            console.error(`Error parsing session ${session._id}:`, parseErr);
            console.log(`Removing unparseable session: ${session._id}`);
            return sessionsCollection.deleteOne({ _id: session._id })
              .then(() => {
                updatedCount++;
              });
          }
        } catch (err) {
          console.error('Error processing session:', err);
          return Promise.resolve();
        }
      });

      return Promise.all(updatePromises)
        .then(() => {
          console.log(`Processed ${updatedCount} sessions (cleared flash messages or removed invalid sessions)`);
          return mongoose.connection.close();
        });
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
