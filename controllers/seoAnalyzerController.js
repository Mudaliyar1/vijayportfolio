const SEOAnalysis = require('../models/SEOAnalysis');
const User = require('../models/User');
const Website = require('../models/Website');
const { cohere } = require('../config/cohere');
const axios = require('axios');
const cheerio = require('cheerio');

// Helper function to analyze SEO using Cohere
async function analyzeSEOWithAI(url, pageContent, keywords) {
  try {
    const prompt = `You are an expert SEO analyst. Analyze the provided webpage content and provide detailed SEO recommendations.
                   Focus on title tags, meta descriptions, headings, content quality, keyword usage, and overall SEO best practices.
                   Format your response as JSON with the following structure:
                   {
                     "score": (number between 0-100),
                     "title": {
                       "current": "current title",
                       "score": (number between 0-100),
                       "issues": ["issue 1", "issue 2"],
                       "recommendations": ["recommendation 1", "recommendation 2"]
                     },
                     "metaDescription": {
                       "current": "current meta description",
                       "score": (number between 0-100),
                       "issues": ["issue 1", "issue 2"],
                       "recommendations": ["recommendation 1", "recommendation 2"]
                     },
                     "headings": {
                       "score": (number between 0-100),
                       "issues": ["issue 1", "issue 2"],
                       "recommendations": ["recommendation 1", "recommendation 2"]
                     },
                     "content": {
                       "score": (number between 0-100),
                       "issues": ["issue 1", "issue 2"],
                       "recommendations": ["recommendation 1", "recommendation 2"]
                     },
                     "keywords": {
                       "score": (number between 0-100),
                       "issues": ["issue 1", "issue 2"],
                       "recommendations": ["recommendation 1", "recommendation 2"]
                     },
                     "overall": {
                       "strengths": ["strength 1", "strength 2"],
                       "weaknesses": ["weakness 1", "weakness 2"],
                       "recommendations": ["recommendation 1", "recommendation 2"]
                     }
                   }

                   URL: ${url}
                   Target Keywords: ${keywords}

                   Page Content:
                   ${pageContent}`;

    const response = await cohere.generate({
      prompt: prompt,
      max_tokens: 2000,
      temperature: 0.5,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    });

    // Parse the response as JSON
    const responseText = response.generations[0].text;

    // Check if the response contains an error message
    if (responseText.includes('Error:') || responseText.includes('I apologize')) {
      throw new Error('Failed to analyze SEO. ' + responseText);
    }

    // Clean the response text to ensure it's valid JSON
    const jsonStartIndex = responseText.indexOf('{');
    if (jsonStartIndex === -1) {
      throw new Error('Invalid response format. Could not find JSON data.');
    }

    const jsonEndIndex = responseText.lastIndexOf('}') + 1;
    const jsonText = responseText.substring(jsonStartIndex, jsonEndIndex);

    try {
      return JSON.parse(jsonText);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      throw new Error('Failed to parse SEO analysis results. Please try again.');
    }
  } catch (error) {
    console.error('Error analyzing SEO with AI:', error);
    throw new Error('Failed to analyze SEO. Please try again later.');
  }
}

// Helper function to optimize SEO content using Cohere
async function optimizeSEOWithAI(url, element, currentContent, keywords, recommendations) {
  try {
    const prompt = `You are an expert SEO content optimizer. Optimize the provided ${element} for better SEO performance.
                   Focus on incorporating the target keywords naturally while maintaining readability and relevance.
                   Follow the recommendations provided.

                   URL: ${url}
                   Element to optimize: ${element}
                   Current content: ${currentContent}
                   Target keywords: ${keywords}
                   Recommendations: ${recommendations.join(', ')}

                   Please provide an optimized version of the ${element} that addresses the recommendations and incorporates the keywords naturally.`;

    const response = await cohere.generate({
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.7,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    });

    const responseText = response.generations[0].text;

    // Check if the response contains an error message
    if (responseText.includes('Error:') || responseText.includes('I apologize')) {
      throw new Error('Failed to optimize content. ' + responseText);
    }

    return responseText;
  } catch (error) {
    console.error('Error optimizing SEO with AI:', error);
    throw new Error('Failed to optimize SEO content. Please try again later.');
  }
}

// Helper function to fetch webpage content
async function fetchWebpage(url) {
  try {
    // Add http:// if not present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract relevant SEO elements
    const title = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content') || '';

    // Extract headings
    const headings = {
      h1: $('h1').map((i, el) => $(el).text()).get(),
      h2: $('h2').map((i, el) => $(el).text()).get(),
      h3: $('h3').map((i, el) => $(el).text()).get(),
    };

    // Extract main content (remove scripts, styles, etc.)
    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('iframe').remove();

    const bodyContent = $('body').text().replace(/\\s+/g, ' ').trim();

    return {
      title,
      metaDescription,
      headings,
      bodyContent,
      fullHtml: html
    };
  } catch (error) {
    console.error('Error fetching webpage:', error);
    throw new Error('Failed to fetch webpage. Please check the URL and try again.');
  }
}

module.exports = {
  // User-facing controllers
  getSEOAnalyzerPage: async (req, res) => {
    try {
      // Get user's websites for the dropdown
      const websites = await Website.find({ user: req.user._id }).sort({ createdAt: -1 });

      res.render('seo-analyzer/index', {
        title: 'SEO Analyzer & Optimizer - FTRAISE AI',
        user: req.user,
        websites
      });
    } catch (err) {
      console.error('Error loading SEO analyzer page:', err);
      req.flash('error_msg', 'Failed to load SEO analyzer');
      res.redirect('/dashboard');
    }
  },

  analyzeSEO: async (req, res) => {
    try {
      const { url, keywords, websiteId } = req.body;

      // Validate input
      if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
      }

      try {
        // Fetch webpage content
        const pageData = await fetchWebpage(url);

        try {
          // Analyze SEO using AI
          const seoAnalysis = await analyzeSEOWithAI(url, pageData.bodyContent, keywords || '');

          // Save the analysis
          const newAnalysis = new SEOAnalysis({
            user: req.user._id,
            website: websiteId || null,
            url,
            keywords: keywords || '',
            pageTitle: pageData.title,
            metaDescription: pageData.metaDescription,
            analysis: seoAnalysis
          });

          await newAnalysis.save();

          // Return the analysis
          res.json({
            success: true,
            analysis: seoAnalysis,
            pageData: {
              title: pageData.title,
              metaDescription: pageData.metaDescription,
              headings: pageData.headings
            },
            analysisId: newAnalysis._id
          });
        } catch (aiError) {
          console.error('Error analyzing with AI:', aiError);
          res.status(500).json({ success: false, message: 'Error analyzing content with AI: ' + aiError.message });
        }
      } catch (fetchError) {
        console.error('Error fetching webpage:', fetchError);
        res.status(500).json({ success: false, message: 'Error fetching webpage: ' + fetchError.message });
      }
    } catch (err) {
      console.error('Error analyzing SEO:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  optimizeSEO: async (req, res) => {
    try {
      const { analysisId, element, currentContent, recommendations } = req.body;

      // Validate input
      if (!analysisId || !element || !currentContent) {
        return res.status(400).json({ success: false, message: 'Analysis ID, element, and current content are required' });
      }

      try {
        // Get the analysis
        const analysis = await SEOAnalysis.findOne({ _id: analysisId, user: req.user._id });

        if (!analysis) {
          return res.status(404).json({ success: false, message: 'Analysis not found' });
        }

        try {
          // Optimize the content
          const optimizedContent = await optimizeSEOWithAI(
            analysis.url,
            element,
            currentContent,
            analysis.keywords,
            recommendations || []
          );

          // Update the analysis with the optimized content
          if (element === 'title') {
            analysis.optimizedTitle = optimizedContent;
          } else if (element === 'metaDescription') {
            analysis.optimizedMetaDescription = optimizedContent;
          } else if (element === 'content') {
            analysis.optimizedContent = optimizedContent;
          }

          await analysis.save();

          // Return the optimized content
          res.json({
            success: true,
            element,
            optimizedContent
          });
        } catch (aiError) {
          console.error('Error optimizing with AI:', aiError);
          res.status(500).json({ success: false, message: 'Error optimizing content with AI: ' + aiError.message });
        }
      } catch (dbError) {
        console.error('Error accessing database:', dbError);
        res.status(500).json({ success: false, message: 'Error accessing database: ' + dbError.message });
      }
    } catch (err) {
      console.error('Error optimizing SEO:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getSEOHistory: async (req, res) => {
    try {
      const analyses = await SEOAnalysis.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .populate('website', 'title');

      res.render('seo-analyzer/history', {
        title: 'SEO Analysis History - FTRAISE AI',
        user: req.user,
        analyses
      });
    } catch (err) {
      console.error('Error fetching SEO history:', err);
      req.flash('error_msg', 'Failed to load SEO history');
      res.redirect('/seo-analyzer');
    }
  },

  deleteSEOHistory: async (req, res) => {
    try {
      const { id } = req.params;

      // Find and delete the analysis
      await SEOAnalysis.deleteOne({ _id: id, user: req.user._id });

      res.json({ success: true, message: 'Analysis deleted successfully' });
    } catch (err) {
      console.error('Error deleting SEO analysis:', err);
      res.status(500).json({ success: false, message: 'Failed to delete analysis' });
    }
  },

  // Admin controllers
  getAdminDashboard: async (req, res) => {
    try {
      // Get usage statistics
      const totalAnalyses = await SEOAnalysis.countDocuments();
      const totalUsers = await SEOAnalysis.distinct('user').countDocuments();
      const recentAnalyses = await SEOAnalysis.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'username email')
        .populate('website', 'title');

      res.render('admin/seo-analyzer/dashboard', {
        title: 'SEO Analyzer Admin - FTRAISE AI',
        user: req.user,
        totalAnalyses,
        totalUsers,
        recentAnalyses,
        path: '/admin/seo-analyzer'
      });
    } catch (err) {
      console.error('Error loading admin SEO analyzer dashboard:', err);
      req.flash('error_msg', 'Failed to load SEO analyzer admin dashboard');
      res.redirect('/admin');
    }
  },

  getAdminSettings: async (req, res) => {
    try {
      // Get current settings
      // In a real implementation, these would be stored in a database
      const settings = {
        defaultModel: 'gpt-3.5-turbo',
        maxTokens: 2000,
        enabledForFreeUsers: true,
        maxAnalysesPerDay: 5
      };

      res.render('admin/seo-analyzer/settings', {
        title: 'SEO Analyzer Settings - FTRAISE AI',
        user: req.user,
        settings,
        path: '/admin/seo-analyzer/settings'
      });
    } catch (err) {
      console.error('Error loading SEO analyzer settings:', err);
      req.flash('error_msg', 'Failed to load SEO analyzer settings');
      res.redirect('/admin/seo-analyzer');
    }
  },

  updateAdminSettings: async (req, res) => {
    try {
      const { defaultModel, maxTokens, enabledForFreeUsers, maxAnalysesPerDay } = req.body;

      // In a real implementation, these would be saved to a database
      // For now, just return success

      req.flash('success_msg', 'SEO analyzer settings updated successfully');
      res.redirect('/admin/seo-analyzer/settings');
    } catch (err) {
      console.error('Error updating SEO analyzer settings:', err);
      req.flash('error_msg', 'Failed to update SEO analyzer settings');
      res.redirect('/admin/seo-analyzer/settings');
    }
  },

  getAdminAnalytics: async (req, res) => {
    try {
      // Get usage statistics by day for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyStats = await SEOAnalysis.aggregate([
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

      res.render('admin/seo-analyzer/analytics', {
        title: 'SEO Analyzer Analytics - FTRAISE AI',
        user: req.user,
        dailyStats: formattedDailyStats,
        path: '/admin/seo-analyzer/analytics'
      });
    } catch (err) {
      console.error('Error loading SEO analyzer analytics:', err);
      req.flash('error_msg', 'Failed to load SEO analyzer analytics');
      res.redirect('/admin/seo-analyzer');
    }
  }
};
