const Website = require('../models/Website');
const WebsiteAssistantChat = require('../models/WebsiteAssistantChat');
const User = require('../models/User');
const { cohere } = require('../config/cohere');

// Helper function to generate AI response
async function generateAIResponse(messages, websiteData) {
  try {
    // Create system message with website context
    const systemPrompt = `You are an AI Website Customization Assistant for FTRAISE AI.
                You help users customize and improve their websites.

                Website Information:
                - Title: ${websiteData.title}
                - Description: ${websiteData.description}
                - Business Type: ${websiteData.businessType}
                - Theme: ${websiteData.theme}
                - Color Scheme: ${websiteData.colorScheme}
                - Number of Pages: ${websiteData.pages.length}

                Your goal is to provide helpful, specific advice for improving the website.
                Suggest design improvements, content ideas, and best practices.
                When appropriate, provide specific HTML/CSS code snippets that the user can implement.
                Always be supportive, professional, and focus on actionable advice.`;

    // Format conversation history
    let conversationHistory = '';
    messages.forEach(msg => {
      if (msg.role === 'user') {
        conversationHistory += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        conversationHistory += `Assistant: ${msg.content}\n`;
      }
    });

    // Get the latest user message
    const userMessage = messages[messages.length - 1].content;

    // Create the full prompt
    const prompt = `${systemPrompt}\n\nConversation History:\n${conversationHistory}\n\nUser: ${userMessage}\n\nAssistant:`;

    // Generate response using Cohere
    const response = await cohere.generate({
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.7,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    });

    return response.generations[0].text;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate response. Please try again later.');
  }
}

module.exports = {
  // User-facing controllers
  getWebsiteAssistantPage: async (req, res) => {
    try {
      // Get user's websites for the dropdown
      const websites = await Website.find({ user: req.user._id }).sort({ createdAt: -1 });

      // If no websites, redirect to website creation
      if (websites.length === 0) {
        req.flash('info_msg', 'You need to create a website first to use the Website Assistant');
        return res.redirect('/create-website');
      }

      // Get the selected website (default to the first one)
      const selectedWebsiteId = req.query.websiteId || websites[0]._id;
      const selectedWebsite = websites.find(w => w._id.toString() === selectedWebsiteId.toString());

      // Get chat history for the selected website
      const chatHistory = await WebsiteAssistantChat.find({
        user: req.user._id,
        website: selectedWebsiteId
      }).sort({ createdAt: 1 });

      res.render('website-assistant/index', {
        title: 'Website Customization Assistant - FTRAISE AI',
        user: req.user,
        websites,
        selectedWebsite,
        chatHistory
      });
    } catch (err) {
      console.error('Error loading website assistant page:', err);
      req.flash('error_msg', 'Failed to load website assistant');
      res.redirect('/dashboard/websites');
    }
  },

  sendMessage: async (req, res) => {
    try {
      const { websiteId, message } = req.body;

      // Validate input
      if (!websiteId || !message) {
        return res.status(400).json({ success: false, message: 'Website ID and message are required' });
      }

      // Get website data
      const website = await Website.findOne({ _id: websiteId, user: req.user._id });
      if (!website) {
        return res.status(404).json({ success: false, message: 'Website not found' });
      }

      // Get previous messages for context (limit to last 10)
      const previousChats = await WebsiteAssistantChat.find({
        user: req.user._id,
        website: websiteId
      }).sort({ createdAt: -1 }).limit(10);

      // Format messages for OpenAI
      const messages = previousChats.reverse().flatMap(chat => [
        { role: "user", content: chat.userMessage },
        { role: "assistant", content: chat.aiResponse }
      ]);

      // Add the new user message
      messages.push({ role: "user", content: message });

      // Generate AI response
      const aiResponse = await generateAIResponse(messages, website);

      // Save the chat
      const newChat = new WebsiteAssistantChat({
        user: req.user._id,
        website: websiteId,
        userMessage: message,
        aiResponse
      });

      await newChat.save();

      // Return the response
      res.json({
        success: true,
        message: 'Message sent successfully',
        response: aiResponse,
        chatId: newChat._id
      });
    } catch (err) {
      console.error('Error sending message:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getChatHistory: async (req, res) => {
    try {
      const { websiteId } = req.params;

      // Validate website ownership
      const website = await Website.findOne({ _id: websiteId, user: req.user._id });
      if (!website) {
        return res.status(404).json({ success: false, message: 'Website not found' });
      }

      // Get chat history
      const chatHistory = await WebsiteAssistantChat.find({
        user: req.user._id,
        website: websiteId
      }).sort({ createdAt: 1 });

      res.json({
        success: true,
        chatHistory
      });
    } catch (err) {
      console.error('Error fetching chat history:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
    }
  },

  deleteChat: async (req, res) => {
    try {
      const { chatId } = req.params;

      // Find and delete the chat
      const chat = await WebsiteAssistantChat.findOne({ _id: chatId, user: req.user._id });

      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat not found' });
      }

      await WebsiteAssistantChat.deleteOne({ _id: chatId, user: req.user._id });

      res.json({ success: true, message: 'Chat deleted successfully' });
    } catch (err) {
      console.error('Error deleting chat:', err);
      res.status(500).json({ success: false, message: 'Failed to delete chat' });
    }
  },

  // Admin controllers
  getAdminDashboard: async (req, res) => {
    try {
      // Get usage statistics
      const totalChats = await WebsiteAssistantChat.countDocuments();
      const totalUsers = await WebsiteAssistantChat.distinct('user').countDocuments();
      const recentChats = await WebsiteAssistantChat.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'username email')
        .populate('website', 'title');

      res.render('admin/website-assistant/dashboard', {
        title: 'Website Assistant Admin - FTRAISE AI',
        user: req.user,
        totalChats,
        totalUsers,
        recentChats,
        path: '/admin/website-assistant'
      });
    } catch (err) {
      console.error('Error loading admin website assistant dashboard:', err);
      req.flash('error_msg', 'Failed to load website assistant admin dashboard');
      res.redirect('/admin');
    }
  },

  getAdminChats: async (req, res) => {
    try {
      // Get all chats with pagination
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;

      const totalChats = await WebsiteAssistantChat.countDocuments();
      const totalPages = Math.ceil(totalChats / limit);

      const chats = await WebsiteAssistantChat.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username email')
        .populate('website', 'title');

      res.render('admin/website-assistant/chats', {
        title: 'Website Assistant Chats - FTRAISE AI',
        user: req.user,
        chats,
        currentPage: page,
        totalPages,
        path: '/admin/website-assistant/chats'
      });
    } catch (err) {
      console.error('Error loading admin website assistant chats:', err);
      req.flash('error_msg', 'Failed to load website assistant chats');
      res.redirect('/admin/website-assistant');
    }
  },

  getAdminSettings: async (req, res) => {
    try {
      // Get current settings
      // In a real implementation, these would be stored in a database
      const settings = {
        defaultModel: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
        enabledForFreeUsers: true,
        maxChatsPerDay: 10
      };

      res.render('admin/website-assistant/settings', {
        title: 'Website Assistant Settings - FTRAISE AI',
        user: req.user,
        settings,
        path: '/admin/website-assistant/settings'
      });
    } catch (err) {
      console.error('Error loading website assistant settings:', err);
      req.flash('error_msg', 'Failed to load website assistant settings');
      res.redirect('/admin/website-assistant');
    }
  },

  updateAdminSettings: async (req, res) => {
    try {
      const { defaultModel, maxTokens, temperature, enabledForFreeUsers, maxChatsPerDay } = req.body;

      // In a real implementation, these would be saved to a database
      // For now, just return success

      req.flash('success_msg', 'Website assistant settings updated successfully');
      res.redirect('/admin/website-assistant/settings');
    } catch (err) {
      console.error('Error updating website assistant settings:', err);
      req.flash('error_msg', 'Failed to update website assistant settings');
      res.redirect('/admin/website-assistant/settings');
    }
  },

  getAdminAnalytics: async (req, res) => {
    try {
      // Get usage statistics by day for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyStats = await WebsiteAssistantChat.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);

      // Format for chart display
      const formattedDailyStats = dailyStats.map(stat => {
        const date = new Date(stat._id.year, stat._id.month - 1, stat._id.day);
        return {
          date: date.toISOString().split('T')[0],
          count: stat.count
        };
      });

      res.render('admin/website-assistant/analytics', {
        title: 'Website Assistant Analytics - FTRAISE AI',
        user: req.user,
        dailyStats: formattedDailyStats,
        path: '/admin/website-assistant/analytics'
      });
    } catch (err) {
      console.error('Error loading website assistant analytics:', err);
      req.flash('error_msg', 'Failed to load website assistant analytics');
      res.redirect('/admin/website-assistant');
    }
  }
};
