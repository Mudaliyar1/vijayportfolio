const NeuralDreamscape = require('../models/NeuralDreamscape');
const NeuralConnection = require('../models/NeuralConnection');
const User = require('../models/User');
const cohere = require('cohere-ai');

// Initialize Cohere client
cohere.init(process.env.COHERE_API_KEY);

/**
 * Neural Dreamscape Controller
 * Handles all operations related to creating, viewing, and connecting neural dreamscapes
 */
const neuralDreamscapeController = {
  // Render the dreamscape dashboard
  dashboard: async (req, res) => {
    try {
      // Get user's dreamscapes
      const dreamscapes = await NeuralDreamscape.find({ userId: req.user._id })
        .sort({ updatedAt: -1 });

      // Get stats
      const totalDreamscapes = await NeuralDreamscape.countDocuments({ isPublic: true });
      const totalConnections = await NeuralConnection.countDocuments();
      
      res.render('neural-dreamscape/dashboard', {
        title: 'Neural Dreamscape Dashboard',
        user: req.user,
        dreamscapes,
        stats: {
          totalDreamscapes,
          totalConnections,
          userDreamscapes: dreamscapes.length
        }
      });
    } catch (error) {
      console.error('Error loading dreamscape dashboard:', error);
      req.flash('error_msg', 'Failed to load dreamscape dashboard');
      res.redirect('/profile');
    }
  },

  // Render the create dreamscape page
  createPage: async (req, res) => {
    try {
      res.render('neural-dreamscape/create', {
        title: 'Create Neural Dreamscape',
        user: req.user
      });
    } catch (error) {
      console.error('Error loading create dreamscape page:', error);
      req.flash('error_msg', 'Failed to load create dreamscape page');
      res.redirect('/neural-dreamscape/dashboard');
    }
  },

  // Create a new dreamscape
  create: async (req, res) => {
    try {
      const { title, description, canvasData, themes, isPublic } = req.body;

      // Convert themes from comma-separated string to array
      const themesArray = themes ? themes.split(',').map(theme => theme.trim()) : [];

      // Create the dreamscape
      const dreamscape = new NeuralDreamscape({
        userId: req.user._id,
        title,
        description,
        canvasData: JSON.parse(canvasData),
        themes: themesArray,
        isPublic: isPublic === 'on' || isPublic === true
      });

      // Generate AI insights if description is provided
      if (description && description.length > 10) {
        try {
          const aiResponse = await cohere.generate({
            model: 'command',
            prompt: `Analyze this dreamscape description and provide insightful observations about what it might reveal about the creator's mindset, creativity, or thought patterns. Be poetic and thoughtful. Description: "${description}"`,
            max_tokens: 150,
            temperature: 0.8,
          });
          
          if (aiResponse.body.generations && aiResponse.body.generations.length > 0) {
            dreamscape.aiInsights = aiResponse.body.generations[0].text.trim();
          }
        } catch (aiError) {
          console.error('Error generating AI insights:', aiError);
          // Continue without AI insights if there's an error
        }
      }

      await dreamscape.save();

      req.flash('success_msg', 'Neural Dreamscape created successfully');
      res.redirect(`/neural-dreamscape/view/${dreamscape._id}`);
    } catch (error) {
      console.error('Error creating dreamscape:', error);
      req.flash('error_msg', 'Failed to create dreamscape');
      res.redirect('/neural-dreamscape/create');
    }
  },

  // Render the edit dreamscape page
  editPage: async (req, res) => {
    try {
      const dreamscape = await NeuralDreamscape.findById(req.params.id);
      
      if (!dreamscape) {
        req.flash('error_msg', 'Dreamscape not found');
        return res.redirect('/neural-dreamscape/dashboard');
      }

      // Check if user owns the dreamscape
      if (dreamscape.userId.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Not authorized');
        return res.redirect('/neural-dreamscape/dashboard');
      }

      res.render('neural-dreamscape/edit', {
        title: 'Edit Neural Dreamscape',
        user: req.user,
        dreamscape
      });
    } catch (error) {
      console.error('Error loading edit dreamscape page:', error);
      req.flash('error_msg', 'Failed to load edit dreamscape page');
      res.redirect('/neural-dreamscape/dashboard');
    }
  },

  // Update an existing dreamscape
  update: async (req, res) => {
    try {
      const { title, description, canvasData, themes, isPublic } = req.body;
      
      // Find the dreamscape
      const dreamscape = await NeuralDreamscape.findById(req.params.id);
      
      if (!dreamscape) {
        req.flash('error_msg', 'Dreamscape not found');
        return res.redirect('/neural-dreamscape/dashboard');
      }

      // Check if user owns the dreamscape
      if (dreamscape.userId.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Not authorized');
        return res.redirect('/neural-dreamscape/dashboard');
      }

      // Convert themes from comma-separated string to array
      const themesArray = themes ? themes.split(',').map(theme => theme.trim()) : [];

      // Update the dreamscape
      dreamscape.title = title;
      dreamscape.description = description;
      dreamscape.canvasData = JSON.parse(canvasData);
      dreamscape.themes = themesArray;
      dreamscape.isPublic = isPublic === 'on' || isPublic === true;

      // Generate new AI insights if description changed significantly
      if (description && description.length > 10) {
        try {
          const aiResponse = await cohere.generate({
            model: 'command',
            prompt: `Analyze this dreamscape description and provide insightful observations about what it might reveal about the creator's mindset, creativity, or thought patterns. Be poetic and thoughtful. Description: "${description}"`,
            max_tokens: 150,
            temperature: 0.8,
          });
          
          if (aiResponse.body.generations && aiResponse.body.generations.length > 0) {
            dreamscape.aiInsights = aiResponse.body.generations[0].text.trim();
          }
        } catch (aiError) {
          console.error('Error generating AI insights:', aiError);
          // Continue without updating AI insights if there's an error
        }
      }

      await dreamscape.save();

      req.flash('success_msg', 'Neural Dreamscape updated successfully');
      res.redirect(`/neural-dreamscape/view/${dreamscape._id}`);
    } catch (error) {
      console.error('Error updating dreamscape:', error);
      req.flash('error_msg', 'Failed to update dreamscape');
      res.redirect(`/neural-dreamscape/edit/${req.params.id}`);
    }
  },

  // View a single dreamscape
  view: async (req, res) => {
    try {
      const dreamscape = await NeuralDreamscape.findById(req.params.id)
        .populate('userId', 'username profilePicture');
      
      if (!dreamscape) {
        req.flash('error_msg', 'Dreamscape not found');
        return res.redirect('/neural-dreamscape/browse');
      }

      // Check if dreamscape is public or owned by the user
      const isOwner = req.user && dreamscape.userId._id.toString() === req.user._id.toString();
      if (!dreamscape.isPublic && !isOwner) {
        req.flash('error_msg', 'This dreamscape is private');
        return res.redirect('/neural-dreamscape/browse');
      }

      // Increment view count if not the owner
      if (!isOwner) {
        dreamscape.stats.views += 1;
        dreamscape.stats.lastViewed = new Date();
        await dreamscape.save();
      }

      // Get connections for this dreamscape
      const connections = await NeuralConnection.find({
        $or: [
          { sourceDreamscapeId: dreamscape._id },
          { targetDreamscapeId: dreamscape._id }
        ]
      }).populate({
        path: 'sourceDreamscapeId targetDreamscapeId',
        select: 'title userId',
        populate: {
          path: 'userId',
          select: 'username'
        }
      });

      res.render('neural-dreamscape/view', {
        title: `${dreamscape.title} - Neural Dreamscape`,
        user: req.user,
        dreamscape,
        connections,
        isOwner
      });
    } catch (error) {
      console.error('Error viewing dreamscape:', error);
      req.flash('error_msg', 'Failed to load dreamscape');
      res.redirect('/neural-dreamscape/browse');
    }
  },

  // Browse all public dreamscapes
  browse: async (req, res) => {
    try {
      // Get query parameters for filtering
      const { theme, sort } = req.query;
      
      // Build query
      const query = { isPublic: true };
      if (theme) {
        query.themes = theme;
      }
      
      // Build sort options
      let sortOption = { createdAt: -1 }; // Default: newest first
      if (sort === 'popular') {
        sortOption = { 'stats.views': -1 };
      } else if (sort === 'connected') {
        sortOption = { 'stats.connections': -1 };
      }
      
      // Get all public dreamscapes
      const dreamscapes = await NeuralDreamscape.find(query)
        .sort(sortOption)
        .populate('userId', 'username profilePicture')
        .limit(50);
      
      // Get all unique themes for filter dropdown
      const allThemes = await NeuralDreamscape.distinct('themes', { isPublic: true });
      
      res.render('neural-dreamscape/browse', {
        title: 'Browse Neural Dreamscapes',
        user: req.user,
        dreamscapes,
        filters: {
          theme,
          sort: sort || 'newest',
          allThemes
        }
      });
    } catch (error) {
      console.error('Error browsing dreamscapes:', error);
      req.flash('error_msg', 'Failed to load dreamscapes');
      res.redirect('/');
    }
  },

  // Network visualization of dreamscape connections
  network: async (req, res) => {
    try {
      // Get all public dreamscapes and their connections
      const dreamscapes = await NeuralDreamscape.find({ isPublic: true })
        .select('_id title userId themes stats.connections')
        .populate('userId', 'username');
      
      const connections = await NeuralConnection.find({ isConfirmed: true })
        .select('sourceDreamscapeId targetDreamscapeId strength type');
      
      res.render('neural-dreamscape/network', {
        title: 'Neural Network Visualization',
        user: req.user,
        networkData: {
          nodes: dreamscapes,
          edges: connections
        }
      });
    } catch (error) {
      console.error('Error loading network visualization:', error);
      req.flash('error_msg', 'Failed to load network visualization');
      res.redirect('/neural-dreamscape/browse');
    }
  },

  // Create a connection between dreamscapes
  createConnection: async (req, res) => {
    try {
      const { sourceDreamscapeId, targetDreamscapeId, strength, type, description } = req.body;
      
      // Validate the dreamscapes exist and are public or owned by the user
      const sourceDreamscape = await NeuralDreamscape.findById(sourceDreamscapeId);
      const targetDreamscape = await NeuralDreamscape.findById(targetDreamscapeId);
      
      if (!sourceDreamscape || !targetDreamscape) {
        return res.status(404).json({
          success: false,
          message: 'One or both dreamscapes not found'
        });
      }
      
      // Check if user can create this connection
      const canConnectSource = sourceDreamscape.isPublic || 
        (req.user && sourceDreamscape.userId.toString() === req.user._id.toString());
      const canConnectTarget = targetDreamscape.isPublic || 
        (req.user && targetDreamscape.userId.toString() === req.user._id.toString());
      
      if (!canConnectSource || !canConnectTarget) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to connect these dreamscapes'
        });
      }
      
      // Check if connection already exists
      const existingConnection = await NeuralConnection.findOne({
        sourceDreamscapeId,
        targetDreamscapeId
      });
      
      if (existingConnection) {
        // Update existing connection
        existingConnection.strength = strength;
        existingConnection.type = type;
        existingConnection.description = description;
        existingConnection.isConfirmed = true;
        
        await existingConnection.save();
        
        return res.json({
          success: true,
          message: 'Connection updated successfully',
          connection: existingConnection
        });
      }
      
      // Create new connection
      const connection = new NeuralConnection({
        sourceDreamscapeId,
        targetDreamscapeId,
        strength,
        type,
        description,
        isConfirmed: true
      });
      
      await connection.save();
      
      // Update connection stats for both dreamscapes
      sourceDreamscape.stats.connections += 1;
      targetDreamscape.stats.connections += 1;
      
      await sourceDreamscape.save();
      await targetDreamscape.save();
      
      res.json({
        success: true,
        message: 'Connection created successfully',
        connection
      });
    } catch (error) {
      console.error('Error creating connection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create connection',
        error: error.message
      });
    }
  },

  // Get AI-suggested connections for a dreamscape
  getSuggestedConnections: async (req, res) => {
    try {
      const dreamscapeId = req.params.id;
      
      // Get the dreamscape
      const dreamscape = await NeuralDreamscape.findById(dreamscapeId);
      if (!dreamscape) {
        return res.status(404).json({
          success: false,
          message: 'Dreamscape not found'
        });
      }
      
      // Check if user can view this dreamscape
      const canView = dreamscape.isPublic || 
        (req.user && dreamscape.userId.toString() === req.user._id.toString());
      
      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this dreamscape'
        });
      }
      
      // Get other public dreamscapes to compare with
      const otherDreamscapes = await NeuralDreamscape.find({
        _id: { $ne: dreamscapeId },
        isPublic: true
      }).limit(20);
      
      // Use Cohere to find similarities
      const suggestions = [];
      
      for (const otherDreamscape of otherDreamscapes) {
        try {
          // Skip if already connected
          const existingConnection = await NeuralConnection.findOne({
            $or: [
              { sourceDreamscapeId: dreamscapeId, targetDreamscapeId: otherDreamscape._id },
              { sourceDreamscapeId: otherDreamscape._id, targetDreamscapeId: dreamscapeId }
            ]
          });
          
          if (existingConnection) continue;
          
          // Compare descriptions and themes
          const sourceText = `${dreamscape.title}. ${dreamscape.description}. Themes: ${dreamscape.themes.join(', ')}`;
          const targetText = `${otherDreamscape.title}. ${otherDreamscape.description}. Themes: ${otherDreamscape.themes.join(', ')}`;
          
          const aiResponse = await cohere.generate({
            model: 'command',
            prompt: `Compare these two dreamscapes and determine their relationship and connection strength on a scale of 0-100:
            
            Dreamscape 1: "${sourceText}"
            
            Dreamscape 2: "${targetText}"
            
            Provide your response in JSON format with the following fields:
            - strength: a number from 0-100 indicating how strongly these dreamscapes are connected
            - type: one of "similarity", "contrast", "inspiration", "evolution", or "custom"
            - description: a brief description of how these dreamscapes are connected
            
            JSON response:`,
            max_tokens: 200,
            temperature: 0.7,
          });
          
          if (aiResponse.body.generations && aiResponse.body.generations.length > 0) {
            const responseText = aiResponse.body.generations[0].text.trim();
            
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const connectionData = JSON.parse(jsonMatch[0]);
              
              // Only suggest if strength is above threshold
              if (connectionData.strength >= 50) {
                suggestions.push({
                  dreamscape: otherDreamscape,
                  connection: {
                    strength: connectionData.strength,
                    type: connectionData.type,
                    description: connectionData.description
                  }
                });
              }
            }
          }
        } catch (aiError) {
          console.error('Error generating suggestion:', aiError);
          // Continue with next dreamscape
        }
      }
      
      // Sort by strength
      suggestions.sort((a, b) => b.connection.strength - a.connection.strength);
      
      res.json({
        success: true,
        suggestions: suggestions.slice(0, 5) // Return top 5 suggestions
      });
    } catch (error) {
      console.error('Error getting suggested connections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get suggested connections',
        error: error.message
      });
    }
  },

  // Delete a dreamscape
  delete: async (req, res) => {
    try {
      const dreamscape = await NeuralDreamscape.findById(req.params.id);
      
      if (!dreamscape) {
        req.flash('error_msg', 'Dreamscape not found');
        return res.redirect('/neural-dreamscape/dashboard');
      }

      // Check if user owns the dreamscape
      if (dreamscape.userId.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Not authorized');
        return res.redirect('/neural-dreamscape/dashboard');
      }

      // Delete all connections involving this dreamscape
      await NeuralConnection.deleteMany({
        $or: [
          { sourceDreamscapeId: dreamscape._id },
          { targetDreamscapeId: dreamscape._id }
        ]
      });

      // Delete the dreamscape
      await dreamscape.remove();

      req.flash('success_msg', 'Neural Dreamscape deleted successfully');
      res.redirect('/neural-dreamscape/dashboard');
    } catch (error) {
      console.error('Error deleting dreamscape:', error);
      req.flash('error_msg', 'Failed to delete dreamscape');
      res.redirect('/neural-dreamscape/dashboard');
    }
  }
};

module.exports = neuralDreamscapeController;
