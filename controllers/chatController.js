const cohere = require('cohere-ai');
const Chat = require('../models/Chat');
const User = require('../models/User');
const GuestUser = require('../models/GuestUser');

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

      // We'll use the chat history directly in the API call

      // Generate AI response
      let aiResponse;
      try {
        console.log('Sending request to Cohere API with message:', message);

        // Use the generate endpoint for older versions of the API
        console.log('Using model:', process.env.AI_MODEL || 'command');
        // Create a better prompt with context
        const promptWithContext = `You are FTRAISE AI, a helpful, friendly, and knowledgeable AI assistant created by ftraise59/vijay. You provide accurate, concise, and helpful responses. You're designed to be conversational but focused on delivering valuable information.\n\nUser: ${message}\n\nFTRAISE AI:`;

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
