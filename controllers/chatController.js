const cohere = require('cohere-ai');
const Chat = require('../models/Chat');
const User = require('../models/User');
const GuestUser = require('../models/GuestUser');
const Memory = require('../models/Memory');
const { detectLanguage } = require('../utils/languageDetection');
const { enhanceChatPrompt } = require('../utils/coherePromptEnhancer');

// Initialize Cohere client
const COHERE_API_KEY = process.env.COHERE_API_KEY || 'sw2JkgFWgvRJ4aylridTNPLYLzOOIqEYRkCrkd1t';
console.log('Using Cohere API key:', COHERE_API_KEY.substring(0, 5) + '...');
cohere.init(COHERE_API_KEY);

// Chat page
const chatPage = (req, res) => {
  // Get rate limit information
  let rateLimit = {
    remaining: req.user ? 8 : 5,
    limit: req.user ? 8 : 5
  };

  // If user is logged in, get their rate limit from the session
  if (req.user && req.session.rateLimit) {
    rateLimit = req.session.rateLimit;
  }

  res.render('chat/index', {
    title: 'FTRAISE AI Chat',
    user: req.user,
    rateLimit,
    layout: 'layouts/chat' // Use the chat layout without footer
  });
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const userId = req.user ? req.user._id : null;
    const guestId = req.cookies.guestId || req.ip;

    // Check if message is empty
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Check rate limit
    let isRateLimited = false;
    let cooldownEndTime = null;
    let currentLimit = req.user ? 8 : 5;
    let remaining = currentLimit;

    // Different rate limiting for guests and users
    if (req.user) {
      // For logged-in users: 8 requests per 3 minutes
      const now = new Date();
      const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);

      // Get user's recent messages
      const recentMessages = await Chat.aggregate([
        { $match: { userId: req.user._id } },
        { $unwind: '$messages' },
        { $match: { 'messages.role': 'user', 'messages.createdAt': { $gte: threeMinutesAgo } } },
        { $count: 'count' }
      ]);

      const count = recentMessages.length > 0 ? recentMessages[0].count : 0;
      remaining = currentLimit - count;

      if (count >= currentLimit) {
        isRateLimited = true;
        // Calculate cooldown end time (3 minutes from the oldest message in the window)
        const oldestMessage = await Chat.aggregate([
          { $match: { userId: req.user._id } },
          { $unwind: '$messages' },
          { $match: { 'messages.role': 'user', 'messages.createdAt': { $gte: threeMinutesAgo } } },
          { $sort: { 'messages.createdAt': 1 } },
          { $limit: 1 }
        ]);

        if (oldestMessage.length > 0) {
          const oldestTime = oldestMessage[0].messages.createdAt;
          cooldownEndTime = new Date(oldestTime.getTime() + 3 * 60 * 1000);
        } else {
          cooldownEndTime = new Date(now.getTime() + 3 * 60 * 1000);
        }

        // Store rate limit info in session
        req.session.rateLimit = {
          isRateLimited: true,
          cooldownEndTime,
          remaining: 0,
          currentLimit
        };
      } else {
        // Update remaining count in session
        req.session.rateLimit = {
          isRateLimited: false,
          cooldownEndTime: null,
          remaining: currentLimit - count - 1, // -1 for the current request
          currentLimit
        };
      }
    } else {
      // For guests: 5 total requests
      const guestUser = await GuestUser.findOne({ guestId });

      if (guestUser) {
        remaining = currentLimit - guestUser.messageCount;

        if (guestUser.messageCount >= currentLimit) {
          isRateLimited = true;
          cooldownEndTime = null; // No cooldown for guests, they need to register
        }
      }
    }

    // If rate limited, return error
    if (isRateLimited) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        isRateLimited: true,
        cooldownEndTime,
        isGuest: !req.user,
        remaining,
        currentLimit
      });
    }

    // Find or create chat
    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);

      // Check if chat exists and belongs to the user
      if (!chat || (chat.userId && chat.userId.toString() !== (userId?.toString() || '')) ||
          (!chat.userId && chat.guestId !== guestId)) {
        return res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
      }
    } else {
      // Create new chat
      chat = new Chat({
        userId,
        guestId: userId ? null : guestId,
        messages: []
      });
    }

    // Add user message to chat
    chat.messages.push({
      role: 'user',
      content: message,
      createdAt: new Date()
    });

    // Save chat to get ID for new chats
    await chat.save();

    // Update guest user message count
    if (!userId) {
      let guestUser = await GuestUser.findOne({ guestId });
      if (!guestUser) {
        guestUser = new GuestUser({
          guestId,
          messageCount: 0
        });
      }
      guestUser.messageCount += 1;
      await guestUser.save();
    }

    // Find or create memory for this user/guest
    let memory;
    if (userId) {
      memory = await Memory.findOne({ userId });
      if (!memory) {
        memory = new Memory({
          userId,
          languagePreferences: {
            primary: 'english',
            secondary: null
          },
          learningProgress: {
            languages: [{
              name: 'english',
              proficiency: 5,
              commonPhrases: [],
              lastUsed: new Date()
            }]
          }
        });
      }
    } else {
      memory = await Memory.findOne({ guestId });
      if (!memory) {
        memory = new Memory({
          guestId,
          languagePreferences: {
            primary: 'english',
            secondary: null
          },
          learningProgress: {
            languages: [{
              name: 'english',
              proficiency: 5,
              commonPhrases: [],
              lastUsed: new Date()
            }]
          }
        });
      }
    }

    // Detect language
    const languageInfo = detectLanguage(message);
    console.log('Detected language:', languageInfo);

    // Update memory with language preferences
    if (languageInfo.primary !== 'unknown') {
      // Update primary language if confidence is high
      if (languageInfo.confidence > 0.7) {
        memory.languagePreferences.primary = languageInfo.primary;
      }

      // Update secondary language if mixed
      if (languageInfo.mixed && languageInfo.secondary !== 'unknown') {
        memory.languagePreferences.secondary = languageInfo.secondary;
      }

      // Update learning progress
      const existingLanguage = memory.learningProgress.languages.find(
        lang => lang.name === languageInfo.primary
      );

      if (existingLanguage) {
        // Update existing language
        existingLanguage.proficiency = Math.min(existingLanguage.proficiency + 0.1, 5);
        existingLanguage.lastUsed = new Date();
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
      // We use memory.languagePreferences directly in the code below

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

      // Add adaptation instructions based on user's language proficiency
      let adaptationInstructions = '';
      if (languageInfo.primary !== 'english' && languageInfo.primary !== 'unknown') {
        const languageEntry = memory.learningProgress.languages.find(
          lang => lang.name === languageInfo.primary
        );

        if (languageEntry) {
          const proficiency = languageEntry.proficiency;
          if (proficiency < 2) {
            adaptationInstructions = 'The user appears to be a beginner in this language. Use simple vocabulary and short sentences.';
          } else if (proficiency < 4) {
            adaptationInstructions = 'The user appears to have intermediate proficiency in this language. Use moderate vocabulary and clear explanations.';
          } else {
            adaptationInstructions = 'The user appears to be fluent in this language. You can use advanced vocabulary and complex sentences.';
          }
        }
      }

      // Get previous interactions for context
      const previousInteractions = chat.messages
        .slice(-10) // Get last 10 messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'FTRAISE AI'}: ${msg.content}`)
        .join('\n\n');

      // Enhance the prompt using Cohere AI prompt engineering
      let enhancedMessage;
      try {
        enhancedMessage = await enhanceChatPrompt(message, userId ? req.user : null);
      } catch (enhanceError) {
        console.error('Error enhancing prompt:', enhanceError);
        enhancedMessage = message; // Use original message if enhancement fails
      }

      // Create a comprehensive prompt with language instructions and examples
      const promptWithContext = `You are FTRAISE AI, a helpful, friendly, and knowledgeable multilingual AI assistant created by ftraise59/vijay. You provide accurate, concise, and helpful responses. You're designed to be conversational but focused on delivering valuable information.

${languageInstruction}

${adaptationInstructions}

Example response in ${languageInfo.primary}: ${exampleResponse}

Previous conversation:
${previousInteractions}

User: ${enhancedMessage}

FTRAISE AI:`;

      // Generate response using Cohere API
      console.log('Sending prompt to Cohere API:', promptWithContext);
      try {
        // Initialize response variable outside the conditional blocks
        let response = null;

        // Special handling for very short messages like 'hi', 'hello', etc.
        if (message.trim().length < 5) {
          console.log('Short greeting detected, using predefined response');

          // Array of friendly greetings
          const greetings = [
            "👋 Hello! How can I assist you today?",
            "Hi there! What can I help you with?",
            "Greetings! I'm FTRAISE AI. What would you like to know?",
            "Hello! I'm here to help. What's on your mind?",
            "Hi! I'm ready to assist you. What would you like to talk about?",
            "Hello there! How can I be of service today?",
            "Hi! What can I do for you today?",
            "Greetings! How may I assist you?",
            "Hello! What would you like to explore today?",
            "Hi there! I'm FTRAISE AI. How can I help you?"
          ];

          // Select a random greeting
          const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
          aiResponse = randomGreeting;
        } else {
          // For normal messages, use the Cohere API
          try {
            response = await cohere.generate({
              model: process.env.AI_MODEL || 'command',
              prompt: promptWithContext,
              max_tokens: 800,
              temperature: 0.7,
              k: 0,
              stop_sequences: ["User:", "FTRAISE AI:"],
              return_likelihoods: 'NONE'
            });
            console.log('Successfully used cohere.generate API');

            // Extract the response text from the generate API
            if (response && response.body && response.body.generations && response.body.generations.length > 0) {
              aiResponse = response.body.generations[0].text;
              console.log('Using response.body.generations[0].text:', aiResponse);
            } else if (response && response.generations && response.generations.length > 0) {
              aiResponse = response.generations[0].text;
              console.log('Using response.generations[0].text:', aiResponse);
            } else {
              console.log('Could not find valid response structure in:', response);

              // Check if this is a rate limit error (429)
              if (response && response.statusCode === 429) {
                // Custom error message for rate limit
                aiResponse = "⚠️ The AI service is taking too long to respond. Please try again later or contact admin (Vijay):\n\n" +
                          "- Instagram: [@ft_raise_59](https://www.instagram.com/ft_raise_59)\n" +
                          "- GitHub: [Mudaliyar1](https://github.com/Mudaliyar1)\n" +
                          "- Email: vijaymudaliyar224@gmail.com";
              } else {
                // Fallback response with a friendly message
                aiResponse = "I'm here to help! What would you like to know or discuss today?";
              }
            }
          } catch (apiError) {
            console.error('Error calling Cohere API:', apiError);
            throw apiError; // Let the outer catch block handle this
          }
        }

        // Only process response object if we used the Cohere API (not for short messages)
        if (response) {
          // Check for rate limit error (429) first
          if (response.statusCode === 429) {
            // Custom error message for rate limit
            aiResponse = "⚠️ The AI service is taking too long to respond. Please try again later or contact admin (Vijay):\n\n" +
                      "- Instagram: [@ft_raise_59](https://www.instagram.com/ft_raise_59)\n" +
                      "- GitHub: [Mudaliyar1](https://github.com/Mudaliyar1)\n" +
                      "- Email: vijaymudaliyar224@gmail.com";

            console.log('Rate limit exceeded (429). Using custom error message.');
          }
          // Extract the response text based on which API was used
          else if (response.text) {
            // New chat API format
            aiResponse = response.text;
            console.log('Using response.text from chat API:', aiResponse);
          } else if (response.body && response.body.generations && response.body.generations.length > 0) {
            // Old generate API format (body.generations)
            aiResponse = response.body.generations[0].text;
            console.log('Using response.body.generations[0].text:', aiResponse);
          } else if (response.generations && response.generations.length > 0) {
            // Old generate API format (generations)
            aiResponse = response.generations[0].text;
            console.log('Using response.generations[0].text:', aiResponse);
          } else {
            console.log('Could not find valid response structure in:', response);

            // Fallback response with a friendly message
            aiResponse = "Hello! I'm FTRAISE AI. How can I assist you today?";
          }
        }

        // If the response is empty or just whitespace, provide a fallback
        if (!aiResponse || aiResponse.trim() === '') {
          aiResponse = "I'm here to help! What would you like to know or discuss today?";
        }
      } catch (apiError) {
        console.error('Error calling Cohere API:', apiError);

        // Custom error message with contact information from environment variables
        const instagramUrl = process.env.INSTAGRAM_URL || 'https://www.instagram.com/ft_raise_59';
        const githubUrl = process.env.GITHUB_URL || 'https://github.com/Mudaliyar1';
        const emailAddress = process.env.EMAIL_ADDRESS || 'vijaymudaliyar224@gmail.com';

        aiResponse = "I'm having trouble connecting to my AI service right now. Please contact admin (Vijay) for assistance:\n\n" +
                    `- Instagram: [@ft_raise_59](${instagramUrl})\n` +
                    `- GitHub: [Mudaliyar1](${githubUrl})\n` +
                    `- Email: [${emailAddress}](mailto:${emailAddress})`;
      }
    } catch (error) {
      console.error('Error in overall AI response generation process:', error);

      // Custom error message with contact information from environment variables
      const instagramUrl = process.env.INSTAGRAM_URL || 'https://www.instagram.com/ft_raise_59';
      const githubUrl = process.env.GITHUB_URL || 'https://github.com/Mudaliyar1';
      const emailAddress = process.env.EMAIL_ADDRESS || 'vijaymudaliyar224@gmail.com';

      // If we haven't already set an aiResponse in the inner try-catch
      if (!aiResponse) {
        aiResponse = "I'm experiencing technical difficulties. Please contact admin (Vijay):\n\n" +
                    `- Instagram: [@ft_raise_59](${instagramUrl})\n` +
                    `- GitHub: [Mudaliyar1](${githubUrl})\n` +
                    `- Email: [${emailAddress}](mailto:${emailAddress})`;
      }
    }
    // Process AI response to fix spacing, add emojis, and enhance links
    let processedResponse = aiResponse.trim();

    // Replace multiple newlines with a single newline
    processedResponse = processedResponse.replace(/\n\s*\n\s*\n/g, '\n\n');
    processedResponse = processedResponse.replace(/\n\s*\n/g, '\n\n');

    // Process YouTube links to make them more user-friendly and validate them
    processedResponse = processedResponse.replace(
      /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})([^\s]*)/g,
      (match, _protocol, _subdomain, _domain, videoId, _extra) => {
        // Validate the video ID format (should be exactly 11 characters of letters, numbers, dashes, or underscores)
        if (videoId && videoId.length === 11 && /^[\w-]{11}$/.test(videoId)) {
          const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
          return `[🎬 YouTube Video](${fullUrl})`;
        } else {
          // If invalid, return the original text without making it a link
          return match;
        }
      }
    );

    // Remove any invalid YouTube links that might be generated
    processedResponse = processedResponse.replace(
      /\[🎬 YouTube Video\]\(https:\/\/www\.youtube\.com\/watch\?v=undefined\)/g,
      'YouTube Video (link unavailable)'
    );

    // Process Google search links
    processedResponse = processedResponse.replace(
      /(https?:\/\/)?(www\.)?google\.com\/search\?([^\s]+)/g,
      (_, __, ___, query) => {
        return `[🔍 Google Search](https://www.google.com/search?${query})`;
      }
    );

    // Add emojis based on content
    if (processedResponse.toLowerCase().includes('hello') ||
        processedResponse.toLowerCase().includes('hi ') ||
        processedResponse.toLowerCase().includes('hey ') ||
        processedResponse.toLowerCase().includes('greetings')) {
      if (!processedResponse.includes('👋')) {
        processedResponse = '👋 ' + processedResponse;
      }
    }

    if ((processedResponse.toLowerCase().includes('thank') ||
         processedResponse.toLowerCase().includes('glad to help') ||
         processedResponse.toLowerCase().includes('you\'re welcome')) &&
        !processedResponse.includes('😊')) {
      processedResponse += ' 😊';
    }

    // Add AI response to chat
    chat.messages.push({
      role: 'assistant',
      content: processedResponse,
      createdAt: new Date()
    });

    // Save chat
    await chat.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      response: processedResponse,
      chatId: chat._id,
      isRateLimited: false,
      remaining: req.session.rateLimit ? req.session.rateLimit.remaining : remaining,
      currentLimit
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while sending the message'
    });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const guestId = req.cookies.guestId || req.ip;

    // Find chats for this user/guest
    const chats = await Chat.find(
      userId ? { userId } : { guestId }
    ).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while getting chat history'
    });
  }
};

// Get specific chat
const getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user ? req.user._id : null;
    const guestId = req.cookies.guestId || req.ip;

    // Find chat
    const chat = await Chat.findById(chatId);

    // Check if chat exists
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    return res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Error getting chat:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while getting the chat'
    });
  }
};

// Delete chat
const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user ? req.user._id : null;
    const guestId = req.cookies.guestId || req.ip;

    // Find chat
    const chat = await Chat.findById(chatId);

    // Check if chat exists
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Delete chat
    await Chat.findByIdAndDelete(chatId);

    return res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the chat'
    });
  }
};

module.exports = {
  chatPage,
  sendMessage,
  getChatHistory,
  getChat,
  deleteChat
};
