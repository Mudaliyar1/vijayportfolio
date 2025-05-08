/**
 * Script to test session configuration
 * This script will:
 * 1. Connect to MongoDB
 * 2. Create a test session
 * 3. Verify it can be retrieved
 * 
 * Run with: node scripts/test-session.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

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

// Test session storage
async function testSession() {
  try {
    // Connect to the database
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to database. Cannot test sessions.');
      process.exit(1);
    }
    
    // Get the sessions collection
    const sessionsCollection = mongoose.connection.db.collection('sessions');
    
    // Create a test session ID
    const sessionId = uuidv4();
    
    // Create a test session
    const testSession = {
      _id: sessionId,
      expires: new Date(Date.now() + 3600000), // 1 hour from now
      session: JSON.stringify({
        cookie: {
          originalMaxAge: 1209600000,
          expires: new Date(Date.now() + 1209600000),
          secure: false,
          httpOnly: true,
          path: '/',
          sameSite: 'lax'
        },
        passport: {
          user: 'test-user-id'
        },
        test: 'This is a test session'
      })
    };
    
    // Insert the test session
    await sessionsCollection.insertOne(testSession);
    console.log('Test session created with ID:', sessionId);
    
    // Retrieve the test session
    const retrievedSession = await sessionsCollection.findOne({ _id: sessionId });
    
    if (retrievedSession) {
      console.log('Successfully retrieved test session:');
      console.log('- ID:', retrievedSession._id);
      console.log('- Expires:', retrievedSession.expires);
      
      // Parse the session data
      try {
        const sessionData = JSON.parse(retrievedSession.session);
        console.log('- Session data parsed successfully');
        console.log('- Cookie expires:', sessionData.cookie.expires);
        console.log('- Test value:', sessionData.test);
        console.log('- User ID:', sessionData.passport.user);
      } catch (err) {
        console.error('Error parsing session data:', err);
      }
      
      // Delete the test session
      await sessionsCollection.deleteOne({ _id: sessionId });
      console.log('Test session deleted');
    } else {
      console.error('Failed to retrieve test session');
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    
    console.log('Session test complete.');
  } catch (err) {
    console.error('Error testing sessions:', err);
  }
}

// Run the script
testSession();
