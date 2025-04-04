const cohere = require('cohere-ai');
const Chat = require('../models/Chat');
const User = require('../models/User');
const GuestUser = require('../models/GuestUser');
const Memory = require('../models/Memory');
const { detectLanguage } = require('../utils/languageDetection');

// Initialize Cohere client
console.log('API Key:', process.env.AI_API_KEY ? 'API key is set' : 'API key is not set');
cohere.init(process.env.AI_API_KEY); // Initialize with the API key
console.log('Cohere client initialized');

module.exports = {
  // Render chat page
  getChatPage: async (req, res) => {
    try {
      let rateLimit = {
        limit: 0,
        remaining: 0,
        total: 0
      };

      if (req.isAuthenticated()) {
        const user = await User.findById(req.user._id);
        const now = new Date();
        const windowDuration = 3 * 60 * 1000; // 3 minutes

        // Calculate remaining requests for registered users
        if (user.windowStartTime && now - user.windowStartTime < windowDuration) {
          rateLimit.limit = 8;
          rateLimit.remaining = Math.max(0, 8 - user.requestsInWindow);
          rateLimit.total = user.requestsCount;
        } else {
          rateLimit.limit = 8;
          rateLimit.remaining = 8;
          rateLimit.total = user.requestsCount;
        }
      } else {
        // Calculate remaining requests for guest users
        const ipAddress = req.ip || req.connection.remoteAddress;
        const guestUser = await GuestUser.findOne({ ipAddress });

        if (guestUser) {
          rateLimit.limit = 5;
          rateLimit.remaining = Math.max(0, 5 - guestUser.requestsCount);
          rateLimit.total = guestUser.requestsCount;
        } else {
          rateLimit.limit = 5;
          rateLimit.remaining = 5;
          rateLimit.total = 0;
        }
      }

      res.render('chat/index', {
        title: 'AI Chat - FTRAISE AI',
        rateLimit,
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('500', { title: '500 - Server Error' });
    }
  },

  // Process chat message
  processMessage: async (req, res) => {
    try {
      const { message, chatId } = req.body;
      const userId = req.isAuthenticated() ? req.user._id : null;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const guestId = !userId ? ipAddress : null;

      // Validate message
      if (!message || message.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Message cannot be empty'
        });
      }

      let chat;

      // Find or create chat
      if (chatId) {
        chat = await Chat.findById(chatId);

        // Verify chat ownership
        if (chat) {
          if ((userId && chat.userId && !chat.userId.equals(userId)) ||
              (!userId && chat.guestId !== guestId)) {
            return res.status(403).json({
              success: false,
              message: 'You do not have permission to access this chat'
            });
          }
        } else {
          return res.status(404).json({
            success: false,
            message: 'Chat not found'
          });
        }
      } else {
        // Create new chat
        chat = new Chat({
          userId,
          guestId,
          title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
          messages: []
        });
      }

      // Add user message to chat
      chat.messages.push({
        role: 'user',
        content: message
      });

      // Detect the language of the user's message
      const languageInfo = detectLanguage(message);
      console.log('Detected language:', languageInfo);

      // Find or create a memory for this user/guest
      let memory = null;
      if (userId) {
        memory = await Memory.findOne({ userId });
      } else if (guestId) {
        memory = await Memory.findOne({ guestId });
      }

      if (!memory) {
        // Create new memory for first-time user
        memory = new Memory({
          userId,
          guestId,
          languagePreferences: {
            primary: languageInfo.primary,
            secondary: languageInfo.secondary,
            history: [{
              language: languageInfo.primary,
              timestamp: new Date()
            }]
          },
          context: 'General conversation',
          learningProgress: {
            languages: [{
              name: languageInfo.primary,
              proficiency: 1,
              lastUsed: new Date()
            }]
          }
        });
        await memory.save();
      } else {
        // Update language preferences based on current detection

        // Add to language history
        memory.languagePreferences.history.push({
          language: languageInfo.primary,
          timestamp: new Date()
        });

        // Keep history at a reasonable size
        if (memory.languagePreferences.history.length > 20) {
          memory.languagePreferences.history = memory.languagePreferences.history.slice(-20);
        }

        // Update primary language if it's consistently used
        const recentHistory = memory.languagePreferences.history.slice(-5);
        const languageCounts = {};

        recentHistory.forEach(entry => {
          languageCounts[entry.language] = (languageCounts[entry.language] || 0) + 1;
        });

        // Find most frequent language in recent history
        let mostFrequentLanguage = memory.languagePreferences.primary;
        let highestCount = 0;

        for (const [language, count] of Object.entries(languageCounts)) {
          if (count > highestCount) {
            mostFrequentLanguage = language;
            highestCount = count;
          }
        }

        // Update primary language if a new one is more frequent
        if (mostFrequentLanguage !== memory.languagePreferences.primary) {
          memory.languagePreferences.secondary = memory.languagePreferences.primary;
          memory.languagePreferences.primary = mostFrequentLanguage;
        }

        // Update learning progress
        let languageEntry = memory.learningProgress.languages.find(l => l.name === languageInfo.primary);

        if (languageEntry) {
          // Update existing language
          languageEntry.proficiency = Math.min(10, languageEntry.proficiency + 0.1);
          languageEntry.lastUsed = new Date();
        } else {
          // Add new language
          memory.learningProgress.languages.push({
            name: languageInfo.primary,
            proficiency: 1,
            commonPhrases: [],
            lastUsed: new Date()
          });
        }

        await memory.save();
      }

      // Generate AI response
      let aiResponse;
      try {
        console.log('Sending request to Cohere API with message:', message);

        // Use the generate endpoint for older versions of the API
        console.log('Using model:', process.env.AI_MODEL || 'command');
        // Create a better prompt with context and language instructions
        let languageInstruction = '';
        let exampleResponse = '';

        // Add language-specific instructions based on detected language and user's history
        const primaryLanguage = memory.languagePreferences.primary;
        const secondaryLanguage = memory.languagePreferences.secondary;

        // Check if this is a mixed language input
        if (languageInfo.mixed) {
          languageInstruction = `The user is communicating in a mix of ${languageInfo.primary} and ${languageInfo.secondary}. Respond using a similar mix of languages, adapting to the user's style.`;
        } else {
          // Instructions based on primary detected language
          switch(languageInfo.primary) {
            case 'hindi':
              languageInstruction = 'Respond in Hindi. If the user is writing Hindi in Latin script (Hinglish), you should also respond in Hindi using Latin script.';
              exampleResponse = 'आप कैसे हैं? मैं आपकी कैसे मदद कर सकता हूँ?';
              break;
            case 'tamil':
              languageInstruction = 'Respond in Tamil. If the user is writing Tamil in Latin script, you should also respond in Tamil using Latin script.';
              exampleResponse = 'நீங்கள் எப்படி இருக்கிறீர்கள்? நான் உங்களுக்கு எப்படி உதவ முடியும்?';
              break;
            case 'spanish':
              languageInstruction = 'Respond in Spanish.';
              exampleResponse = '¿Cómo estás? ¿En qué puedo ayudarte hoy?';
              break;
            case 'french':
              languageInstruction = 'Respond in French.';
              exampleResponse = 'Comment allez-vous? Comment puis-je vous aider aujourd\'hui?';
              break;
            default:
              languageInstruction = 'Respond in English.';
              exampleResponse = 'How are you? How can I help you today?';
          }
        }

        // Add language adaptation instructions
        const adaptationInstructions = `
1. Always respond in the same language the user is using.
2. If the user switches languages mid-conversation, you should also switch to that language.
3. For mixed language inputs, respond with a similar mix of languages.
4. Maintain a natural, conversational tone appropriate for the language being used.
5. If you're unsure about the language, default to ${primaryLanguage}.
`;

        // Get previous interactions from memory for context (up to 5 most recent)
        const previousInteractions = memory.interactions.slice(-5).map(interaction =>
          `User: ${interaction.query}\nAI: ${interaction.response}`
        ).join('\n\n');

        // Create a comprehensive prompt with language instructions and examples
        const promptWithContext = `You are FTRAISE AI, a helpful, friendly, and knowledgeable multilingual AI assistant created by ftraise59/vijay. You provide accurate, concise, and helpful responses. You're designed to be conversational but focused on delivering valuable information.

${languageInstruction}

${adaptationInstructions}

Example response in ${languageInfo.primary}: ${exampleResponse}

Previous conversation:
${previousInteractions}

User: ${message}

FTRAISE AI:`;

        const response = await cohere.generate({
          prompt: promptWithContext,
          model: 'command', // Hardcode a known working model
          max_tokens: 300,
          temperature: 0.7,
          k: 0,
          stop_sequences: [],
          return_likelihoods: 'NONE'
        });

        console.log('Cohere API response:', JSON.stringify(response, null, 2));

        // Extract the response text from the generate API
        if (response && response.body && response.body.generations && response.body.generations.length > 0) {
          aiResponse = response.body.generations[0].text;
          console.log('Using response.body.generations[0].text');
        } else if (response && response.generations && response.generations.length > 0) {
          aiResponse = response.generations[0].text;
          console.log('Using response.generations[0].text');
        } else {
          console.log('Could not find valid response structure');
          aiResponse = "I'm sorry, I couldn't generate a response at this time. Please try again.";
        }
      } catch (error) {
        console.error('Error generating AI response:', error);
        aiResponse = "I apologize, but I encountered an error while processing your request. Please try again.";
      }
      // Process AI response to fix spacing and add emojis
      let processedResponse = aiResponse.trim();

      // Replace multiple newlines with a single newline
      processedResponse = processedResponse.replace(/\n\s*\n\s*\n/g, '\n\n');
      processedResponse = processedResponse.replace(/\n\s*\n/g, '\n\n');

      // Add emojis based on content
      if (processedResponse.toLowerCase().includes('hello') ||
          processedResponse.toLowerCase().includes('hi') ||
          processedResponse.toLowerCase().includes('hey')) {
        processedResponse = '👋 ' + processedResponse;
      } else if (processedResponse.toLowerCase().includes('thank')) {
        processedResponse = '🙏 ' + processedResponse;
      } else if (processedResponse.toLowerCase().includes('sorry')) {
        processedResponse = '😔 ' + processedResponse;
      } else if (processedResponse.toLowerCase().includes('congratulations') ||
                processedResponse.toLowerCase().includes('congrats')) {
        processedResponse = '🎉 ' + processedResponse;
      } else if (processedResponse.toLowerCase().includes('warning') ||
                processedResponse.toLowerCase().includes('caution') ||
                processedResponse.toLowerCase().includes('careful')) {
        processedResponse = '⚠️ ' + processedResponse;
      } else if (processedResponse.toLowerCase().includes('important')) {
        processedResponse = '📢 ' + processedResponse;
      } else if (processedResponse.match(/\d+\s*steps|\d+\s*tips|\d+\s*ways|\d+\s*methods/i)) {
        processedResponse = '📋 ' + processedResponse;
      } else if (processedResponse.toLowerCase().includes('example')) {
        processedResponse = '💡 ' + processedResponse;
      } else {
        // Default emoji for other responses
        processedResponse = '🤖 ' + processedResponse;
      }

      chat.messages.push({
        role: 'assistant',
        content: processedResponse
      });

      // Update the response for the JSON return
      aiResponse = processedResponse;

      // Determine the response language (same as query language unless specified otherwise)
      const responseLanguage = languageInfo.primary;

      // Save the interaction to memory with language information
      memory.interactions.push({
        query: message,
        queryLanguage: {
          primary: languageInfo.primary,
          secondary: languageInfo.secondary,
          mixed: languageInfo.mixed,
          confidence: languageInfo.confidence
        },
        response: processedResponse,
        responseLanguage: responseLanguage
      });

      // Extract and save common phrases for learning
      if (message.length < 50) {
        // Only save short phrases that are likely to be common expressions
        const languageEntry = memory.learningProgress.languages.find(l => l.name === languageInfo.primary);
        if (languageEntry && !languageEntry.commonPhrases.includes(message)) {
          languageEntry.commonPhrases.push(message);
          // Keep the list at a reasonable size
          if (languageEntry.commonPhrases.length > 20) {
            languageEntry.commonPhrases = languageEntry.commonPhrases.slice(-20);
          }
        }
      }

      await memory.save();

      console.log('Saved interaction to memory with language data');

      // Save chat
      await chat.save();

      return res.status(200).json({
        success: true,
        message: 'Message processed successfully',
        response: aiResponse,
        chatId: chat._id,
        rateLimit: req.rateLimit
      });
    } catch (err) {
      console.error('Chat processing error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while processing your message'
      });
    }
  },

  // Get user's chat history
  getChatHistory: async (req, res) => {
    try {
      let chats;

      if (req.isAuthenticated()) {
        // Get registered user's chats
        chats = await Chat.find({ userId: req.user._id })
          .sort({ updatedAt: -1 })
          .select('_id title updatedAt');
      } else {
        // Get guest user's chats by IP
        const ipAddress = req.ip || req.connection.remoteAddress;
        chats = await Chat.find({ guestId: ipAddress })
          .sort({ updatedAt: -1 })
          .select('_id title updatedAt');
      }

      return res.status(200).json({
        success: true,
        chats
      });
    } catch (err) {
      console.error('Error fetching chat history:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching chat history'
      });
    }
  },

  // Get a specific chat
  getChat: async (req, res) => {
    try {
      const chatId = req.params.id;
      const userId = req.isAuthenticated() ? req.user._id : null;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const chat = await Chat.findById(chatId);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
      }

      // Verify chat ownership
      if ((userId && chat.userId && !chat.userId.equals(userId)) ||
          (!userId && chat.guestId !== ipAddress)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this chat'
        });
      }

      return res.status(200).json({
        success: true,
        chat
      });
    } catch (err) {
      console.error('Error fetching chat:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the chat'
      });
    }
  },

  // Delete a chat
  deleteChat: async (req, res) => {
    try {
      const chatId = req.params.id;
      const userId = req.isAuthenticated() ? req.user._id : null;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const chat = await Chat.findById(chatId);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
      }

      // Verify chat ownership
      if ((userId && chat.userId && !chat.userId.equals(userId)) ||
          (!userId && chat.guestId !== ipAddress)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this chat'
        });
      }

      await Chat.findByIdAndDelete(chatId);

      return res.status(200).json({
        success: true,
        message: 'Chat deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting chat:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the chat'
      });
    }
  }
};
