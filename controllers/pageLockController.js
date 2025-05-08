const PageLock = require('../models/PageLock');
const express = require('express');

// Function to get all available routes
const getAllRoutes = (app) => {
  const routes = [];
  const stack = app._router.stack;

  // Helper function to extract routes from a layer
  const extractRoutes = (layer, basePath = '') => {
    if (layer.route) {
      // It's a route, add it to our list
      const path = basePath + (layer.route.path === '/' ? '' : layer.route.path);
      if (!routes.includes(path) && !path.startsWith('/admin') && !path.startsWith('/api')) {
        routes.push(path);
      }
    } else if (layer.name === 'router' && layer.handle.stack) {
      // It's a router middleware, recursively extract routes
      const routerPath = layer.regexp.toString().includes('\\/?(?=\\/|$)') ? '' :
                        layer.regexp.toString().replace(/^\^\\\//,'').replace(/\\\/.*/,'');
      layer.handle.stack.forEach((stackItem) => {
        extractRoutes(stackItem, '/' + routerPath);
      });
    }
  };

  // Process all middleware in the stack
  stack.forEach(extractRoutes);

  // Sort routes alphabetically and filter out duplicates
  return [...new Set(routes)].sort();
};

module.exports = {
  // Get page lock management page
  getPageLockManagement: async (req, res) => {
    try {
      // Get all page locks
      const pageLocks = await PageLock.find().sort({ updatedAt: -1 });

      // Define common routes manually since we can't extract them dynamically without the app instance
      const commonRoutes = [
        '/',
        '/about',
        '/chat',
        '/profile',
        '/reviews',
        '/blog',
        '/community',
        '/digital-twin',
        '/neural-dreamscape',
        '/website-builder',
        '/packages',
        '/status',
        '/issues',
        '/issues/report',
        '/contact',
        '/policies/privacy',
        '/policies/terms',
        '/policies/cookies'
      ];

      // Get any additional routes from existing page locks that aren't in commonRoutes
      const lockRoutes = pageLocks.map(lock => lock.page);
      const allRoutes = [...new Set([...commonRoutes, ...lockRoutes])].sort();

      res.render('admin/page-locks', {
        title: 'Page Lock Management - FTRAISE AI Admin',
        pageLocks,
        availableRoutes: allRoutes,
        user: req.user
      });
    } catch (err) {
      console.error('Error loading page lock management:', err);
      req.flash('error_msg', 'Failed to load page lock management');
      res.redirect('/admin');
    }
  },

  // Toggle page lock status
  togglePageLock: async (req, res) => {
    try {
      const { page, isLocked, reason } = req.body;

      // Find existing page lock or create a new one
      let pageLock = await PageLock.findOne({ page });

      if (pageLock) {
        // Update existing page lock
        pageLock.isLocked = isLocked === 'true';
        pageLock.reason = reason || 'Under Maintenance';
        pageLock.updatedBy = req.user._id;
      } else {
        // Create new page lock
        pageLock = new PageLock({
          page,
          isLocked: isLocked === 'true',
          reason: reason || 'Under Maintenance',
          updatedBy: req.user._id
        });
      }

      await pageLock.save();

      req.flash('success_msg', `Page ${pageLock.isLocked ? 'locked' : 'unlocked'} successfully`);
      res.redirect('/admin/page-locks');
    } catch (err) {
      console.error('Error toggling page lock:', err);
      req.flash('error_msg', 'Failed to update page lock status');
      res.redirect('/admin/page-locks');
    }
  },

  // Delete page lock
  deletePageLock: async (req, res) => {
    try {
      await PageLock.findByIdAndDelete(req.params.id);
      req.flash('success_msg', 'Page lock deleted successfully');
      res.redirect('/admin/page-locks');
    } catch (err) {
      console.error('Error deleting page lock:', err);
      req.flash('error_msg', 'Failed to delete page lock');
      res.redirect('/admin/page-locks');
    }
  }
};
