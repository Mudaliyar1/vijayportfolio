const DigitalTwin = require('../models/DigitalTwin');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const { cohere } = require('../config/cohere');

/**
 * Helper function to get the base URL for the application
 * This handles both development and production environments
 * @param {Object} req - Express request object
 * @returns {String} - The base URL
 */
function getBaseUrl(req) {
  // Check if we're in production and have a SITE_URL environment variable
  if (process.env.NODE_ENV === 'production' && process.env.SITE_URL) {
    return process.env.SITE_URL;
  }

  // Otherwise, use the request protocol and host
  return `${req.protocol}://${req.get('host')}`;
}

/**
 * Digital Twin Controller
 * Handles all operations related to creating, managing, and interacting with digital twins
 */
const digitalTwinController = {
  // Render the digital twin dashboard
  dashboard: async (req, res) => {
    try {
      // Check if user already has a digital twin
      let digitalTwin = null;

      if (req.user.digitalTwin) {
        digitalTwin = await DigitalTwin.findById(req.user.digitalTwin);
      }

      // Generate the base URL for links
      const baseUrl = getBaseUrl(req);

      res.render('digital-twin/dashboard', {
        title: 'Digital Twin Dashboard',
        user: req.user,
        digitalTwin,
        baseUrl,
        req: req
      });
    } catch (error) {
      console.error('Error loading digital twin dashboard:', error);
      req.flash('error_msg', 'Failed to load digital twin dashboard');
      res.redirect('/profile');
    }
  },

  // Render the digital twin creation/setup page
  setupPage: async (req, res) => {
    try {
      // Check if user already has a digital twin
      if (req.user.digitalTwin) {
        const digitalTwin = await DigitalTwin.findById(req.user.digitalTwin);
        if (digitalTwin) {
          return res.render('digital-twin/edit', {
            title: 'Edit Your Digital Twin',
            user: req.user,
            digitalTwin,
            req: req
          });
        }
      }

      // If no digital twin exists, show the creation page
      res.render('digital-twin/create', {
        title: 'Create Your Digital Twin',
        user: req.user,
        req: req
      });
    } catch (error) {
      console.error('Error loading digital twin setup page:', error);
      req.flash('error_msg', 'Failed to load digital twin setup page');
      res.redirect('/profile');
    }
  },

  // Create a new digital twin
  create: async (req, res) => {
    try {
      const { name, personality, interests, expertise, tone, isPublic } = req.body;

      // Convert interests and expertise from comma-separated strings to arrays
      const interestsArray = interests ? interests.split(',').map(item => item.trim()) : [];
      const expertiseArray = expertise ? expertise.split(',').map(item => item.trim()) : [];

      // Create the digital twin
      const digitalTwin = new DigitalTwin({
        userId: req.user._id,
        name: name || `${req.user.username}'s Digital Twin`,
        personality: personality || '',
        interests: interestsArray,
        expertise: expertiseArray,
        tone: tone || 'friendly',
        isPublic: isPublic === 'on' || isPublic === true
      });

      // Save the digital twin
      await digitalTwin.save();

      // Update the user with the digital twin reference
      await User.findByIdAndUpdate(req.user._id, {
        digitalTwin: digitalTwin._id
      });

      req.flash('success_msg', 'Digital twin created successfully!');
      res.redirect('/digital-twin/train');
    } catch (error) {
      console.error('Error creating digital twin:', error);
      req.flash('error_msg', 'Failed to create digital twin');
      res.redirect('/digital-twin/setup');
    }
  },

  // Update an existing digital twin
  update: async (req, res) => {
    try {
      const { name, personality, interests, expertise, tone, isPublic } = req.body;

      // Convert interests and expertise from comma-separated strings to arrays
      const interestsArray = interests ? interests.split(',').map(item => item.trim()) : [];
      const expertiseArray = expertise ? expertise.split(',').map(item => item.trim()) : [];

      // Find and update the digital twin
      await DigitalTwin.findByIdAndUpdate(req.user.digitalTwin, {
        name: name || `${req.user.username}'s Digital Twin`,
        personality: personality || '',
        interests: interestsArray,
        expertise: expertiseArray,
        tone: tone || 'friendly',
        isPublic: isPublic === 'on' || isPublic === true
      });

      req.flash('success_msg', 'Digital twin updated successfully!');
      res.redirect('/digital-twin/dashboard');
    } catch (error) {
      console.error('Error updating digital twin:', error);
      req.flash('error_msg', 'Failed to update digital twin');
      res.redirect('/digital-twin/setup');
    }
  },

  // Render the digital twin training page
  trainingPage: async (req, res) => {
    try {
      // Check if user has a digital twin
      if (!req.user.digitalTwin) {
        req.flash('error_msg', 'You need to create a digital twin first');
        return res.redirect('/digital-twin/setup');
      }

      const digitalTwin = await DigitalTwin.findById(req.user.digitalTwin);
      if (!digitalTwin) {
        req.flash('error_msg', 'Digital twin not found');
        return res.redirect('/digital-twin/setup');
      }

      res.render('digital-twin/train', {
        title: 'Train Your Digital Twin',
        user: req.user,
        digitalTwin,
        req: req
      });
    } catch (error) {
      console.error('Error loading digital twin training page:', error);
      req.flash('error_msg', 'Failed to load digital twin training page');
      res.redirect('/digital-twin/dashboard');
    }
  },

  // Add training data to the digital twin
  addTrainingData: async (req, res) => {
    try {
      const { question, answer } = req.body;

      // Validate inputs
      if (!question || !answer) {
        req.flash('error_msg', 'Both question and answer are required');
        return res.redirect('/digital-twin/train');
      }

      // Find the digital twin
      const digitalTwin = await DigitalTwin.findById(req.user.digitalTwin);
      if (!digitalTwin) {
        req.flash('error_msg', 'Digital twin not found');
        return res.redirect('/digital-twin/setup');
      }

      // Add the training data
      digitalTwin.trainingData.push({
        question,
        answer,
        createdAt: new Date()
      });

      // Save the digital twin
      await digitalTwin.save();

      req.flash('success_msg', 'Training data added successfully!');
      res.redirect('/digital-twin/train');
    } catch (error) {
      console.error('Error adding training data:', error);
      req.flash('error_msg', 'Failed to add training data');
      res.redirect('/digital-twin/train');
    }
  },

  // Remove training data from the digital twin
  removeTrainingData: async (req, res) => {
    try {
      const { trainingDataId } = req.params;

      // Find the digital twin
      const digitalTwin = await DigitalTwin.findById(req.user.digitalTwin);
      if (!digitalTwin) {
        return res.status(404).json({ success: false, message: 'Digital twin not found' });
      }

      // Remove the training data
      digitalTwin.trainingData = digitalTwin.trainingData.filter(
        data => data._id.toString() !== trainingDataId
      );

      // Save the digital twin
      await digitalTwin.save();

      res.json({ success: true, message: 'Training data removed successfully' });
    } catch (error) {
      console.error('Error removing training data:', error);
      res.status(500).json({ success: false, message: 'Failed to remove training data' });
    }
  },

  // Render the public interface for a digital twin
  publicInterface: async (req, res) => {
    try {
      const { username } = req.params;

      // Find the user by username
      const user = await User.findOne({ username });
      if (!user || !user.digitalTwin) {
        return res.status(404).render('404', {
          title: '404 - Digital Twin Not Found',
          user: req.user
        });
      }

      // Find the digital twin
      const digitalTwin = await DigitalTwin.findById(user.digitalTwin);
      if (!digitalTwin || !digitalTwin.isPublic) {
        return res.status(404).render('404', {
          title: '404 - Digital Twin Not Found',
          user: req.user
        });
      }

      // Generate a unique visitor ID for this user/session
      // If the user is logged in, use their ID + a random string to ensure privacy
      // If not logged in, use a UUID stored in a cookie
      let visitorId;
      if (req.user) {
        // For logged-in users, create a unique ID based on their user ID
        // This ensures each logged-in user has their own conversation
        visitorId = `user_${req.user._id}_${Math.random().toString(36).substring(2, 10)}`;
        // Store this in a session cookie that expires when the browser is closed
        res.cookie('visitorId', visitorId, {
          httpOnly: true
        });
      } else {
        // For anonymous users, use a cookie-based UUID
        visitorId = req.cookies.visitorId;
        if (!visitorId) {
          visitorId = `anon_${uuidv4()}`;
          res.cookie('visitorId', visitorId, {
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            httpOnly: true
          });
        }
      }

      // Find or create an interaction for this visitor
      let interaction = digitalTwin.interactions.find(
        interaction => interaction.visitorId === visitorId
      );

      if (!interaction) {
        // Create a new interaction
        digitalTwin.interactions.push({
          visitorId,
          messages: [],
          startedAt: new Date(),
          lastInteractionAt: new Date()
        });

        // Update stats
        digitalTwin.stats.uniqueVisitors += 1;

        await digitalTwin.save();

        // Get the newly created interaction
        interaction = digitalTwin.interactions.find(
          interaction => interaction.visitorId === visitorId
        );
      }

      // Generate the base URL for links
      const baseUrl = getBaseUrl(req);

      res.render('digital-twin/public', {
        title: `${digitalTwin.name} - Digital Twin`,
        user: req.user,
        digitalTwin,
        twinOwner: user,
        interaction,
        visitorId,
        baseUrl,
        req: req
      });
    } catch (error) {
      console.error('Error loading digital twin public interface:', error);
      res.status(500).render('500', {
        title: '500 - Server Error',
        user: req.user
      });
    }
  },

  // Handle interaction with a digital twin
  interact: async (req, res) => {
    try {
      const { twinId, message, visitorId } = req.body;

      // Validate the visitorId to ensure it's properly formatted
      if (!visitorId || !(visitorId.startsWith('user_') || visitorId.startsWith('anon_'))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid visitor ID format'
        });
      }

      // Find the digital twin
      const digitalTwin = await DigitalTwin.findById(twinId);
      if (!digitalTwin || !digitalTwin.isPublic) {
        return res.status(404).json({
          success: false,
          message: 'Digital twin not found or not public'
        });
      }

      // Find the interaction for this visitor
      let interaction = digitalTwin.interactions.find(
        interaction => interaction.visitorId === visitorId
      );

      if (!interaction) {
        // Create a new interaction if none exists
        digitalTwin.interactions.push({
          visitorId,
          messages: [],
          startedAt: new Date(),
          lastInteractionAt: new Date()
        });

        // Update stats
        digitalTwin.stats.uniqueVisitors += 1;

        await digitalTwin.save();

        // Get the newly created interaction
        interaction = digitalTwin.interactions.find(
          interaction => interaction.visitorId === visitorId
        );
      }

      // Add the visitor's message to the interaction
      interaction.messages.push({
        role: 'visitor',
        content: message,
        timestamp: new Date()
      });

      // Update interaction timestamp
      interaction.lastInteractionAt = new Date();
      digitalTwin.stats.lastInteractionAt = new Date();
      digitalTwin.stats.totalInteractions += 1;

      // Generate a response using Cohere AI
      const response = await generateTwinResponse(digitalTwin, interaction, message);

      // Add the twin's response to the interaction
      interaction.messages.push({
        role: 'twin',
        content: response,
        timestamp: new Date()
      });

      // Save the digital twin
      await digitalTwin.save();

      res.json({
        success: true,
        response
      });
    } catch (error) {
      console.error('Error interacting with digital twin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to interact with digital twin',
        error: error.message
      });
    }
  },

  // Render the settings page for a digital twin
  settingsPage: async (req, res) => {
    try {
      // Check if user has a digital twin
      if (!req.user.digitalTwin) {
        req.flash('error_msg', 'You need to create a digital twin first');
        return res.redirect('/digital-twin/setup');
      }

      const digitalTwin = await DigitalTwin.findById(req.user.digitalTwin);
      if (!digitalTwin) {
        req.flash('error_msg', 'Digital twin not found');
        return res.redirect('/digital-twin/setup');
      }

      res.render('digital-twin/settings', {
        title: 'Digital Twin Settings',
        user: req.user,
        digitalTwin,
        req: req
      });
    } catch (error) {
      console.error('Error loading digital twin settings page:', error);
      req.flash('error_msg', 'Failed to load digital twin settings page');
      res.redirect('/digital-twin/dashboard');
    }
  },

  // Update digital twin settings
  updateSettings: async (req, res) => {
    try {
      const { responseLength, creativity, contextMemory, isActive, isPublic } = req.body;

      // Find the digital twin
      const digitalTwin = await DigitalTwin.findById(req.user.digitalTwin);
      if (!digitalTwin) {
        req.flash('error_msg', 'Digital twin not found');
        return res.redirect('/digital-twin/setup');
      }

      // Update settings
      digitalTwin.configuration.responseLength = Math.min(800, Math.max(50, parseInt(responseLength) || 300));
      digitalTwin.configuration.creativity = Math.min(1.0, Math.max(0.1, parseFloat(creativity) || 0.7));
      digitalTwin.configuration.contextMemory = Math.min(10, Math.max(1, parseInt(contextMemory) || 5));
      digitalTwin.isActive = isActive === 'on' || isActive === true;
      digitalTwin.isPublic = isPublic === 'on' || isPublic === true;

      // Save the digital twin
      await digitalTwin.save();

      req.flash('success_msg', 'Digital twin settings updated successfully!');
      res.redirect('/digital-twin/settings');
    } catch (error) {
      console.error('Error updating digital twin settings:', error);
      req.flash('error_msg', 'Failed to update digital twin settings');
      res.redirect('/digital-twin/settings');
    }
  },

  // Delete a digital twin
  delete: async (req, res) => {
    try {
      // Find the digital twin
      const digitalTwin = await DigitalTwin.findById(req.user.digitalTwin);
      if (!digitalTwin) {
        req.flash('error_msg', 'Digital twin not found');
        return res.redirect('/profile');
      }

      // Delete the digital twin
      await DigitalTwin.findByIdAndDelete(req.user.digitalTwin);

      // Update the user
      await User.findByIdAndUpdate(req.user._id, {
        digitalTwin: null
      });

      req.flash('success_msg', 'Digital twin deleted successfully');
      res.redirect('/profile');
    } catch (error) {
      console.error('Error deleting digital twin:', error);
      req.flash('error_msg', 'Failed to delete digital twin');
      res.redirect('/digital-twin/settings');
    }
  },

  // Cleanup old interactions to prevent database bloat
  cleanupOldInteractions: async (req, res) => {
    try {
      // Find all digital twins
      const digitalTwins = await DigitalTwin.find();
      let totalRemoved = 0;

      // Get date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Process each digital twin
      for (const twin of digitalTwins) {
        // Find interactions older than 30 days
        const oldInteractionsCount = twin.interactions.filter(
          interaction => new Date(interaction.lastInteractionAt) < thirtyDaysAgo
        ).length;

        // Remove old interactions
        if (oldInteractionsCount > 0) {
          twin.interactions = twin.interactions.filter(
            interaction => new Date(interaction.lastInteractionAt) >= thirtyDaysAgo
          );

          await twin.save();
          totalRemoved += oldInteractionsCount;
        }
      }

      res.json({
        success: true,
        message: `Cleaned up ${totalRemoved} old interactions`
      });
    } catch (error) {
      console.error('Error cleaning up old interactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clean up old interactions'
      });
    }
  },

  // List all public digital twins with optional search filter
  listPublicTwins: async (req, res) => {
    try {
      const { search } = req.query;
      let query = { isPublic: true };

      // If search term is provided, filter by interests or expertise
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query = {
          isPublic: true,
          $or: [
            { interests: { $in: [searchRegex] } },
            { expertise: { $in: [searchRegex] } },
            { personality: searchRegex },
            { name: searchRegex }
          ]
        };
      }

      // Find matching public digital twins
      const digitalTwins = await DigitalTwin.find(query)
        .sort({ 'stats.lastInteractionAt': -1 }) // Sort by most recently active
        .populate('userId', 'username profilePicture');

      // Get popular interests/expertise for quick filters (only if not already searching)
      let popularTags = [];
      if (!search) {
        // Aggregate all interests and expertise from public twins
        const allTwins = await DigitalTwin.find({ isPublic: true });
        const tagCounts = {};

        // Count occurrences of each tag
        allTwins.forEach(twin => {
          // Process interests
          twin.interests.forEach(interest => {
            const tag = interest.toLowerCase().trim();
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });

          // Process expertise
          twin.expertise.forEach(exp => {
            const tag = exp.toLowerCase().trim();
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        // Convert to array and sort by count
        popularTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
          .slice(0, 8) // Take top 8
          .map(entry => entry[0]); // Just keep the tag name
      }

      res.render('digital-twin/browse', {
        title: search ? `Digital Twins - ${search}` : 'Browse Digital Twins',
        user: req.user,
        digitalTwins,
        search,
        popularTags,
        req: req
      });
    } catch (error) {
      console.error('Error listing public digital twins:', error);
      req.flash('error_msg', 'Failed to load digital twins');
      res.redirect('/');
    }
  }
};

/**
 * Generate a response from the digital twin using Cohere AI
 * @param {Object} digitalTwin - The digital twin object
 * @param {Object} interaction - The current interaction
 * @param {String} message - The visitor's message
 * @returns {Promise<String>} - The generated response
 */
async function generateTwinResponse(digitalTwin, interaction, message) {
  try {
    // Check if the message is asking about who created the digital twin
    const creatorQuestionRegex = /who (created|made|built|designed|programmed|developed) you|who('s| is| are) your (creator|maker|developer|owner|designer|programmer)|who do you belong to|who owns you|who are you made by|who is behind you/i;

    // If the message is asking about the creator, fetch the creator's information
    if (creatorQuestionRegex.test(message)) {
      try {
        // Find the user who created this digital twin
        const creator = await User.findById(digitalTwin.userId);

        if (creator) {
          // Return a response with information about the creator with a clickable link in a compact card
          return `<div class="creator-card bg-dark-300/70 border border-neon-blue/20 rounded-lg p-3 my-2 max-w-xs">
            <div class="flex items-center mb-2">
              <img src="${creator.profilePicture || '/images/default-avatar.png'}" alt="${creator.username}" class="w-8 h-8 rounded-full mr-2 object-cover">
              <div>
                <p class="text-sm font-medium">Created by <a href="/profile/${creator.username}" class="text-neon-blue hover:text-neon-purple">${creator.username}</a></p>
              </div>
            </div>
            ${digitalTwin.personality ? `<p class="text-xs text-gray-400">Personality: ${digitalTwin.personality}</p>` : ''}
          </div>
          I'm ${digitalTwin.name}, a digital twin created to represent ${creator.username}.`;
        }
      } catch (userError) {
        console.error('Error fetching digital twin creator:', userError);
        // Continue with normal response generation if there's an error
      }
    }

    // Get recent conversation history
    const recentMessages = interaction.messages
      .slice(-digitalTwin.configuration.contextMemory * 2) // Get the last N exchanges (2 messages per exchange)
      .map(msg => `${msg.role === 'visitor' ? 'Visitor' : digitalTwin.name}: ${msg.content}`)
      .join('\n');

    // Create a prompt for Cohere AI
    const prompt = `You are ${digitalTwin.name}, a digital twin of a real person with the following characteristics:

Personality: ${digitalTwin.personality || 'Friendly and helpful'}
Interests: ${digitalTwin.interests.join(', ') || 'Various topics'}
Expertise: ${digitalTwin.expertise.join(', ') || 'General knowledge'}
Tone: ${digitalTwin.tone || 'friendly'}

You have been trained with the following information (question and answer pairs):
${digitalTwin.trainingData.map(data => `Q: ${data.question}\nA: ${data.answer}`).join('\n\n')}

If someone asks who created you or who made you, respond with this HTML card format:
<div class="creator-card bg-dark-300/70 border border-neon-blue/20 rounded-lg p-3 my-2 max-w-xs">
  <div class="flex items-center mb-2">
    <img src="/images/default-avatar.png" alt="${await getUsernameById(digitalTwin.userId)}" class="w-8 h-8 rounded-full mr-2 object-cover">
    <div>
      <p class="text-sm font-medium">Created by <a href="/profile/${await getUsernameById(digitalTwin.userId)}" class="text-neon-blue hover:text-neon-purple">${await getUsernameById(digitalTwin.userId)}</a></p>
    </div>
  </div>
  <p class="text-xs text-gray-400">Personality: ${digitalTwin.personality || 'Friendly and helpful'}</p>
</div>
I'm ${digitalTwin.name}, a digital twin created to represent ${await getUsernameById(digitalTwin.userId)}.

Recent conversation:
${recentMessages}
Visitor: ${message}
${digitalTwin.name}:`;

    // Generate a response using Cohere AI
    const response = await cohere.generate({
      prompt,
      max_tokens: digitalTwin.configuration.responseLength,
      temperature: digitalTwin.configuration.creativity,
      k: 0,
      stop_sequences: ["Visitor:", `${digitalTwin.name}:`],
      return_likelihoods: 'NONE'
    });

    // Extract and clean the response
    let generatedResponse = response.generations[0].text.trim();

    // Remove any instances of the digital twin's name or "Visitor:" that might have been generated
    generatedResponse = generatedResponse
      .replace(new RegExp(`^${digitalTwin.name}:`, 'i'), '')
      .replace(/^Visitor:/i, '')
      .trim();

    return generatedResponse;
  } catch (error) {
    console.error('Error generating digital twin response:', error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }
}

/**
 * Helper function to get a username by user ID
 * @param {String} userId - The user ID
 * @returns {Promise<String>} - The username
 */
async function getUsernameById(userId) {
  try {
    const user = await User.findById(userId);
    return user ? user.username : 'unknown';
  } catch (error) {
    console.error('Error fetching username by ID:', error);
    return 'unknown';
  }
}

module.exports = digitalTwinController;
