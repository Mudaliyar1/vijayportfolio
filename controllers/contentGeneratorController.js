const ContentTemplate = require('../models/ContentTemplate');
const GeneratedContent = require('../models/GeneratedContent');
const User = require('../models/User');
const { cohere } = require('../config/cohere');

// Helper function to generate content using Cohere
async function generateContentWithAI(prompt, type, tone, length) {
  try {
    const maxTokens = length === 'short' ? 300 : length === 'medium' ? 600 : 1000;
    const temperature = tone === 'professional' ? 0.7 : tone === 'casual' ? 0.9 : 0.8;

    const systemPrompt = `You are a professional content writer specializing in ${type} content.
                        Create ${length} content with a ${tone} tone.
                        Format the response with proper HTML tags for web display.`;

    const response = await cohere.generate({
      prompt: `${systemPrompt}\n\nUser request: ${prompt}`,
      max_tokens: maxTokens,
      temperature: temperature,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    });

    return response.generations[0].text;
  } catch (error) {
    console.error('Error generating content with AI:', error);
    throw new Error('Failed to generate content. Please try again later.');
  }
}

module.exports = {
  // User-facing controllers
  getContentGeneratorPage: async (req, res) => {
    try {
      // Get content templates for dropdown
      const templates = await ContentTemplate.find({ active: true });

      res.render('content-generator/index', {
        title: 'AI Content Generator - FTRAISE AI',
        user: req.user,
        templates
      });
    } catch (err) {
      console.error('Error loading content generator page:', err);
      req.flash('error_msg', 'Failed to load content generator');
      res.redirect('/dashboard');
    }
  },

  generateContent: async (req, res) => {
    try {
      const { prompt, contentType, tone, length, templateId } = req.body;

      // Validate input
      if (!prompt) {
        return res.status(400).json({ success: false, message: 'Please provide a prompt' });
      }

      let finalPrompt = prompt;

      // If template is selected, use it to enhance the prompt
      if (templateId) {
        const template = await ContentTemplate.findById(templateId);
        if (template) {
          finalPrompt = `${template.promptPrefix} ${prompt} ${template.promptSuffix}`;
        }
      }

      // Generate content using AI
      const generatedContent = await generateContentWithAI(
        finalPrompt,
        contentType || 'website',
        tone || 'professional',
        length || 'medium'
      );

      // Return the generated content
      res.json({
        success: true,
        content: generatedContent,
        metadata: {
          prompt: finalPrompt,
          contentType: contentType || 'website',
          tone: tone || 'professional',
          length: length || 'medium',
          templateId: templateId || null
        }
      });
    } catch (err) {
      console.error('Error generating content:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  saveGeneratedContent: async (req, res) => {
    try {
      const { content, metadata } = req.body;

      // Validate input
      if (!content) {
        return res.status(400).json({ success: false, message: 'No content to save' });
      }

      // Create new generated content record
      const newContent = new GeneratedContent({
        user: req.user._id,
        content,
        prompt: metadata.prompt,
        contentType: metadata.contentType,
        tone: metadata.tone,
        length: metadata.length,
        template: metadata.templateId
      });

      await newContent.save();

      res.json({
        success: true,
        message: 'Content saved successfully',
        contentId: newContent._id
      });
    } catch (err) {
      console.error('Error saving generated content:', err);
      res.status(500).json({ success: false, message: 'Failed to save content' });
    }
  },

  getContentHistory: async (req, res) => {
    try {
      const contentHistory = await GeneratedContent.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .populate('template', 'name');

      res.render('content-generator/history', {
        title: 'Content Generation History - FTRAISE AI',
        user: req.user,
        contentHistory
      });
    } catch (err) {
      console.error('Error fetching content history:', err);
      req.flash('error_msg', 'Failed to load content history');
      res.redirect('/content-generator');
    }
  },

  deleteContentHistory: async (req, res) => {
    try {
      const { id } = req.params;

      // Find and delete the content
      const content = await GeneratedContent.findOne({ _id: id, user: req.user._id });

      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }

      await GeneratedContent.deleteOne({ _id: id, user: req.user._id });

      res.json({ success: true, message: 'Content deleted successfully' });
    } catch (err) {
      console.error('Error deleting content history:', err);
      res.status(500).json({ success: false, message: 'Failed to delete content' });
    }
  },

  // Admin controllers
  getAdminContentGeneratorPage: async (req, res) => {
    try {
      // Get usage statistics
      const totalGenerations = await GeneratedContent.countDocuments();
      const totalUsers = await GeneratedContent.distinct('user').countDocuments();

      // Get recent generations with more data for detailed analysis
      const recentGenerations = await GeneratedContent.find()
        .sort({ createdAt: -1 })
        .limit(50) // Increased limit for better analytics
        .populate('user', 'username email')
        .populate('template', 'name');

      // Get content types distribution
      const contentTypeStats = await GeneratedContent.aggregate([
        { $group: { _id: '$contentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Get user activity statistics
      const userStats = await GeneratedContent.aggregate([
        { $group: {
          _id: '$user',
          count: { $sum: 1 },
          contentTypes: { $addToSet: '$contentType' },
          lastGeneration: { $max: '$createdAt' }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Populate user details
      const userIds = userStats.map(stat => stat._id);
      const users = await User.find({ _id: { $in: userIds } }, 'username email');

      const userStatsWithDetails = userStats.map(stat => {
        const userDetails = users.find(u => u._id.toString() === stat._id.toString());
        return {
          ...stat,
          username: userDetails ? userDetails.username : 'Unknown',
          email: userDetails ? userDetails.email : 'Unknown'
        };
      });

      res.render('admin/content-generator/dashboard', {
        title: 'Content Generator Admin - FTRAISE AI',
        user: req.user,
        totalGenerations,
        totalUsers,
        recentGenerations,
        contentTypeStats,
        userStats: userStatsWithDetails,
        path: '/admin/content-generator'
      });
    } catch (err) {
      console.error('Error loading admin content generator page:', err);
      req.flash('error_msg', 'Failed to load content generator admin page');
      res.redirect('/admin');
    }
  },

  getContentGeneratorSettings: async (req, res) => {
    try {
      // Get current settings
      // In a real implementation, these would be stored in a database
      const settings = {
        defaultModel: 'gpt-3.5-turbo',
        maxTokens: 1000,
        defaultTone: 'professional',
        defaultLength: 'medium',
        enabledContentTypes: ['website', 'blog', 'social', 'email', 'product']
      };

      res.render('admin/content-generator/settings', {
        title: 'Content Generator Settings - FTRAISE AI',
        user: req.user,
        settings,
        path: '/admin/content-generator/settings'
      });
    } catch (err) {
      console.error('Error loading content generator settings:', err);
      req.flash('error_msg', 'Failed to load content generator settings');
      res.redirect('/admin/content-generator');
    }
  },

  updateContentGeneratorSettings: async (req, res) => {
    try {
      const { defaultModel, maxTokens, defaultTone, defaultLength, enabledContentTypes } = req.body;

      // In a real implementation, these would be saved to a database
      // For now, just return success

      req.flash('success_msg', 'Content generator settings updated successfully');
      res.redirect('/admin/content-generator/settings');
    } catch (err) {
      console.error('Error updating content generator settings:', err);
      req.flash('error_msg', 'Failed to update content generator settings');
      res.redirect('/admin/content-generator/settings');
    }
  },

  getContentGeneratorAnalytics: async (req, res) => {
    try {
      // Get usage statistics by day for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyStats = await GeneratedContent.aggregate([
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

      res.render('admin/content-generator/analytics', {
        title: 'Content Generator Analytics - FTRAISE AI',
        user: req.user,
        dailyStats: formattedDailyStats,
        path: '/admin/content-generator/analytics'
      });
    } catch (err) {
      console.error('Error loading content generator analytics:', err);
      req.flash('error_msg', 'Failed to load content generator analytics');
      res.redirect('/admin/content-generator');
    }
  },

  getContentTemplates: async (req, res) => {
    try {
      const templates = await ContentTemplate.find().sort({ name: 1 });

      res.render('admin/content-generator/templates', {
        title: 'Content Templates - FTRAISE AI',
        user: req.user,
        templates,
        path: '/admin/content-generator/templates'
      });
    } catch (err) {
      console.error('Error loading content templates:', err);
      req.flash('error_msg', 'Failed to load content templates');
      res.redirect('/admin/content-generator');
    }
  },

  createContentTemplate: async (req, res) => {
    try {
      const { name, description, contentType, promptPrefix, promptSuffix, active } = req.body;

      // Validate input
      if (!name || !contentType) {
        req.flash('error_msg', 'Please provide a name and content type');
        return res.redirect('/admin/content-generator/templates');
      }

      // Create new template
      const newTemplate = new ContentTemplate({
        name,
        description,
        contentType,
        promptPrefix: promptPrefix || '',
        promptSuffix: promptSuffix || '',
        active: active === 'on'
      });

      await newTemplate.save();

      req.flash('success_msg', 'Content template created successfully');
      res.redirect('/admin/content-generator/templates');
    } catch (err) {
      console.error('Error creating content template:', err);
      req.flash('error_msg', 'Failed to create content template');
      res.redirect('/admin/content-generator/templates');
    }
  },

  updateContentTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, contentType, promptPrefix, promptSuffix, active } = req.body;

      // Find and update the template
      const template = await ContentTemplate.findById(id);

      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }

      template.name = name;
      template.description = description;
      template.contentType = contentType;
      template.promptPrefix = promptPrefix || '';
      template.promptSuffix = promptSuffix || '';
      template.active = active === 'on';

      await template.save();

      res.json({ success: true, message: 'Template updated successfully' });
    } catch (err) {
      console.error('Error updating content template:', err);
      res.status(500).json({ success: false, message: 'Failed to update template' });
    }
  },

  deleteContentTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      // Find and delete the template
      const template = await ContentTemplate.findById(id);

      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }

      await ContentTemplate.deleteOne({ _id: id });

      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (err) {
      console.error('Error deleting content template:', err);
      res.status(500).json({ success: false, message: 'Failed to delete template' });
    }
  }
};
