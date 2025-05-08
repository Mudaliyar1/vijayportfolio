/**
 * Health Check Routes
 * 
 * Add these routes to your main application to provide health check endpoints
 * for the status page to monitor.
 * 
 * Usage:
 * 1. Copy this file to your main application
 * 2. Add the following line to your server.js or app.js file:
 *    require('./health-check-routes')(app, mongoose);
 */

module.exports = function(app, mongoose) {
  // General health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });
  
  // Detailed health check endpoint
  app.get('/health/details', (req, res) => {
    const health = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: mongoose.connection.readyState,
        statusText: getConnectionStatusText(mongoose.connection.readyState)
      },
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external
      }
    };
    
    res.json(health);
  });
  
  // Session health check endpoint
  app.get('/health/session', (req, res) => {
    res.json({
      status: 'ok',
      session: req.session ? 'active' : 'inactive',
      timestamp: new Date().toISOString()
    });
  });
  
  // AI health check endpoint
  app.get('/api/ai/health', (req, res) => {
    res.json({
      status: 'ok',
      aiService: 'operational',
      timestamp: new Date().toISOString()
    });
  });
  
  // Admin status endpoint
  app.get('/admin-status', (req, res) => {
    res.json({
      status: 'ok',
      adminService: 'operational',
      timestamp: new Date().toISOString()
    });
  });
  
  // Helper function to get connection status text
  function getConnectionStatusText(status) {
    switch (status) {
      case 0: return 'disconnected';
      case 1: return 'connected';
      case 2: return 'connecting';
      case 3: return 'disconnecting';
      default: return 'unknown';
    }
  }
};
