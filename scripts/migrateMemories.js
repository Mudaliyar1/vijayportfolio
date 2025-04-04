require('dotenv').config();
const mongoose = require('mongoose');
const Memory = require('../models/Memory');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

async function migrateMemories() {
  try {
    console.log('Starting memory migration...');
    
    // Find all memories
    const memories = await Memory.find({});
    console.log(`Found ${memories.length} memories to migrate`);
    
    let migratedCount = 0;
    
    for (const memory of memories) {
      // Skip already migrated memories
      if (memory.languagePreferences && memory.languagePreferences.primary) {
        console.log(`Memory ${memory._id} already migrated, skipping`);
        continue;
      }
      
      // Get the old language value
      const oldLanguage = memory.language || 'english';
      
      // Create new languagePreferences structure
      memory.languagePreferences = {
        primary: oldLanguage,
        secondary: null,
        history: [{
          language: oldLanguage,
          timestamp: new Date()
        }]
      };
      
      // Create learning progress structure
      memory.learningProgress = {
        languages: [{
          name: oldLanguage,
          proficiency: 1,
          commonPhrases: [],
          lastUsed: new Date()
        }]
      };
      
      // Update interactions with language information
      if (memory.interactions && memory.interactions.length > 0) {
        memory.interactions.forEach(interaction => {
          if (!interaction.queryLanguage) {
            interaction.queryLanguage = {
              primary: oldLanguage,
              secondary: null,
              mixed: false,
              confidence: 1.0
            };
          }
          
          if (!interaction.responseLanguage) {
            interaction.responseLanguage = oldLanguage;
          }
        });
      }
      
      // Save the updated memory
      await memory.save();
      migratedCount++;
      console.log(`Migrated memory ${memory._id}`);
    }
    
    console.log(`Migration complete. Migrated ${migratedCount} memories.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateMemories();
