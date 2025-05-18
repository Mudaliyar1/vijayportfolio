const ApiKey = require('../models/ApiKey');
const StaticApiKey = require('../models/StaticApiKey');
const DynamicApiKey = require('../models/DynamicApiKey');
const User = require('../models/User');

/**
 * API Key Controller
 * Handles API key management
 */
module.exports = {
  // Get developer portal page
  getDeveloperPortal: async (req, res) => {
    try {
      // Get user's API keys
      const apiKeys = await ApiKey.find({ userId: req.user._id }).sort({ createdAt: -1 });
      
      res.render('api/developer-portal', {
        title: 'Developer Portal - FTRAISE AI',
        user: req.user,
        apiKeys
      });
    } catch (error) {
      console.error('Error loading developer portal:', error);
      req.flash('error_msg', 'An error occurred while loading the developer portal');
      res.redirect('/');
    }
  },
  
  // Get API documentation page
  getApiDocs: async (req, res) => {
    try {
      res.render('api/docs', {
        title: 'API Documentation - FTRAISE AI',
        user: req.user
      });
    } catch (error) {
      console.error('Error loading API documentation:', error);
      req.flash('error_msg', 'An error occurred while loading the API documentation');
      res.redirect('/');
    }
  },
  
  // Create a new API key
  createApiKey: async (req, res) => {
    try {
      const { name, type, domains, ipAddresses } = req.body;
      
      // Validate input
      if (!name || !type) {
        req.flash('error_msg', 'Name and type are required');
        return res.redirect('/api/developer-portal');
      }
      
      // Check if type is valid
      if (type !== 'static' && type !== 'dynamic') {
        req.flash('error_msg', 'Invalid API key type');
        return res.redirect('/api/developer-portal');
      }
      
      // Generate API key
      const key = ApiKey.generateKey();
      
      // Create API key based on type
      let apiKey;
      
      if (type === 'static') {
        // Parse domains and IP addresses
        const parsedDomains = domains ? domains.split(',').map(d => d.trim()).filter(d => d) : [];
        const parsedIpAddresses = ipAddresses ? ipAddresses.split(',').map(ip => ip.trim()).filter(ip => ip) : [];
        
        apiKey = new StaticApiKey({
          userId: req.user._id,
          name,
          key,
          type,
          domains: parsedDomains,
          ipAddresses: parsedIpAddresses
        });
      } else {
        apiKey = new DynamicApiKey({
          userId: req.user._id,
          name,
          key,
          type
        });
      }
      
      // Save API key
      await apiKey.save();
      
      req.flash('success_msg', `${type.charAt(0).toUpperCase() + type.slice(1)} API key created successfully`);
      res.redirect('/api/developer-portal');
    } catch (error) {
      console.error('Error creating API key:', error);
      req.flash('error_msg', 'An error occurred while creating the API key');
      res.redirect('/api/developer-portal');
    }
  },
  
  // Update an API key
  updateApiKey: async (req, res) => {
    try {
      const { id, name, domains, ipAddresses, status } = req.body;
      
      // Find API key
      const apiKey = await ApiKey.findOne({ _id: id, userId: req.user._id });
      
      if (!apiKey) {
        req.flash('error_msg', 'API key not found');
        return res.redirect('/api/developer-portal');
      }
      
      // Update name and status
      apiKey.name = name || apiKey.name;
      apiKey.status = status || apiKey.status;
      
      // Update type-specific fields
      if (apiKey.type === 'static') {
        const staticKey = await StaticApiKey.findById(apiKey._id);
        
        if (staticKey) {
          // Parse domains and IP addresses
          if (domains) {
            staticKey.domains = domains.split(',').map(d => d.trim()).filter(d => d);
          }
          
          if (ipAddresses) {
            staticKey.ipAddresses = ipAddresses.split(',').map(ip => ip.trim()).filter(ip => ip);
          }
          
          await staticKey.save();
        }
      }
      
      // Save API key
      await apiKey.save();
      
      req.flash('success_msg', 'API key updated successfully');
      res.redirect('/api/developer-portal');
    } catch (error) {
      console.error('Error updating API key:', error);
      req.flash('error_msg', 'An error occurred while updating the API key');
      res.redirect('/api/developer-portal');
    }
  },
  
  // Regenerate an API key
  regenerateApiKey: async (req, res) => {
    try {
      const { id } = req.body;
      
      // Find API key
      const apiKey = await ApiKey.findOne({ _id: id, userId: req.user._id });
      
      if (!apiKey) {
        req.flash('error_msg', 'API key not found');
        return res.redirect('/api/developer-portal');
      }
      
      // Generate new key
      apiKey.key = ApiKey.generateKey();
      
      // Save API key
      await apiKey.save();
      
      req.flash('success_msg', 'API key regenerated successfully');
      res.redirect('/api/developer-portal');
    } catch (error) {
      console.error('Error regenerating API key:', error);
      req.flash('error_msg', 'An error occurred while regenerating the API key');
      res.redirect('/api/developer-portal');
    }
  },
  
  // Delete an API key
  deleteApiKey: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find and delete API key
      const result = await ApiKey.deleteOne({ _id: id, userId: req.user._id });
      
      if (result.deletedCount === 0) {
        req.flash('error_msg', 'API key not found');
        return res.redirect('/api/developer-portal');
      }
      
      req.flash('success_msg', 'API key deleted successfully');
      res.redirect('/api/developer-portal');
    } catch (error) {
      console.error('Error deleting API key:', error);
      req.flash('error_msg', 'An error occurred while deleting the API key');
      res.redirect('/api/developer-portal');
    }
  },
  
  // Admin: Get API key management page
  getApiKeyManagement: async (req, res) => {
    try {
      // Get all API keys
      const apiKeys = await ApiKey.find().populate('userId', 'username email').sort({ createdAt: -1 });
      
      res.render('admin/api-keys', {
        title: 'API Key Management - FTRAISE AI Admin',
        user: req.user,
        apiKeys
      });
    } catch (error) {
      console.error('Error loading API key management:', error);
      req.flash('error_msg', 'An error occurred while loading the API key management page');
      res.redirect('/admin');
    }
  },
  
  // Admin: Update an API key
  adminUpdateApiKey: async (req, res) => {
    try {
      const { id, status } = req.body;
      
      // Find API key
      const apiKey = await ApiKey.findById(id);
      
      if (!apiKey) {
        req.flash('error_msg', 'API key not found');
        return res.redirect('/admin/api-keys');
      }
      
      // Update status
      apiKey.status = status || apiKey.status;
      
      // Save API key
      await apiKey.save();
      
      req.flash('success_msg', 'API key updated successfully');
      res.redirect('/admin/api-keys');
    } catch (error) {
      console.error('Error updating API key:', error);
      req.flash('error_msg', 'An error occurred while updating the API key');
      res.redirect('/admin/api-keys');
    }
  },
  
  // Admin: Delete an API key
  adminDeleteApiKey: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find and delete API key
      const result = await ApiKey.deleteOne({ _id: id });
      
      if (result.deletedCount === 0) {
        req.flash('error_msg', 'API key not found');
        return res.redirect('/admin/api-keys');
      }
      
      req.flash('success_msg', 'API key deleted successfully');
      res.redirect('/admin/api-keys');
    } catch (error) {
      console.error('Error deleting API key:', error);
      req.flash('error_msg', 'An error occurred while deleting the API key');
      res.redirect('/admin/api-keys');
    }
  }
};
