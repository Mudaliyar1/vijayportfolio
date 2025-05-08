const PageLock = require('../models/PageLock');

module.exports = async (req, res, next) => {
  try {
    // Skip for admin routes and static files
    if (req.path.startsWith('/admin') || 
        req.path.startsWith('/css') || 
        req.path.startsWith('/js') || 
        req.path.startsWith('/images') ||
        req.path === '/favicon.ico') {
      return next();
    }

    // Get the current path (remove trailing slash if present)
    const currentPath = req.path.endsWith('/') && req.path !== '/' 
      ? req.path.slice(0, -1) 
      : req.path;

    // Check if the page is locked
    const pageLock = await PageLock.findOne({ page: currentPath });

    // If page is not locked or user is admin, proceed normally
    if (!pageLock || !pageLock.isLocked || (req.isAuthenticated() && req.user.role === 'admin')) {
      return next();
    }

    // Render the locked page view
    res.render('locked-page', {
      title: 'Page Locked - FTRAISE AI',
      pageLock,
      originalPath: currentPath,
      user: req.user
    });
  } catch (err) {
    console.error('Error in page lock middleware:', err);
    next();
  }
};
