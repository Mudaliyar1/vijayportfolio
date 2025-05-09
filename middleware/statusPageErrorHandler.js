/**
 * Status Page Error Handler Middleware
 * 
 * This middleware provides a special error handler for the status page routes
 * to ensure they remain operational even if other parts of the system fail.
 */

module.exports = function(err, req, res, next) {
  // Only handle errors for status page routes
  if (!req.path.startsWith('/status')) {
    return next(err);
  }

  console.error('Status page error:', err);

  // Create fallback data for the status page
  const fallbackSystemStatus = {
    overallStatus: 'operational',
    components: [
      { name: 'AI Chat Engine', status: 'operational' },
      { name: 'Database (MongoDB)', status: 'operational' },
      { name: 'User Login/Auth', status: 'operational' },
      { name: 'Admin Dashboard', status: 'operational' },
      { name: 'Website Frontend', status: 'operational' }
    ],
    updatedAt: new Date()
  };

  // Default uptime data
  const uptimeData = {};
  fallbackSystemStatus.components.forEach(component => {
    uptimeData[component.name] = 100;
  });

  // For API routes, return JSON
  if (req.path.startsWith('/status/api') || req.xhr || req.headers.accept.includes('application/json')) {
    return res.json({
      status: 'error',
      message: 'An error occurred while processing your request',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      systemStatus: fallbackSystemStatus
    });
  }

  // For health check routes, return a simple response
  if (req.path.startsWith('/status/health')) {
    return res.json({
      status: 'error',
      component: 'Status Page',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      timestamp: new Date().toISOString()
    });
  }

  // For HTML routes, render the status page with fallback data
  try {
    // Helper function to get status text and color
    function getStatusInfo(status) {
      switch (status) {
        case 'operational':
          return { text: 'Operational', color: 'green', icon: '🟢' };
        case 'degraded_performance':
          return { text: 'Degraded Performance', color: 'yellow', icon: '🟡' };
        case 'partial_outage':
          return { text: 'Partial Outage', color: 'orange', icon: '🟠' };
        case 'major_outage':
          return { text: 'Major Outage', color: 'red', icon: '🔴' };
        default:
          return { text: 'Unknown', color: 'gray', icon: '⚪' };
      }
    }

    // Helper function to get overall status text and color
    function getOverallStatusInfo(status) {
      switch (status) {
        case 'operational':
          return { text: 'All Systems Operational', color: 'green', icon: '✅' };
        case 'partial_outage':
          return { text: 'Partial System Outage', color: 'orange', icon: '⚠️' };
        case 'major_outage':
          return { text: 'Major System Outage', color: 'red', icon: '🔴' };
        default:
          return { text: 'System Status Unknown', color: 'gray', icon: '❓' };
      }
    }

    const overallStatusInfo = getOverallStatusInfo(fallbackSystemStatus.overallStatus);
    const componentsWithInfo = fallbackSystemStatus.components.map(component => {
      return {
        name: component.name,
        status: component.status,
        statusInfo: getStatusInfo(component.status)
      };
    });

    return res.render('status/index', {
      title: 'System Status - FTRAISE AI',
      systemStatus: fallbackSystemStatus,
      overallStatusInfo,
      components: componentsWithInfo,
      incidents: [],
      uptimeData,
      user: req.user,
      timeFilter: '30days',
      error: 'There was an issue loading the latest status data. Showing default values.'
    });
  } catch (renderErr) {
    console.error('Error rendering status page fallback:', renderErr);
    
    // If rendering fails, return a simple HTML response
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>System Status - FTRAISE AI</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #11111B; color: #fff; margin: 0; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { color: #00F2FF; }
          .status { background-color: #1E1E2E; border: 1px solid #2D2D3A; padding: 20px; border-radius: 8px; }
          .component { margin-bottom: 10px; padding: 10px; background-color: #181825; border-radius: 4px; }
          .operational { color: #32CD32; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>System Status - FTRAISE AI</h1>
          <p>Current operational status of FTRAISE AI services</p>
          
          <div class="status">
            <h2>✅ All Systems Operational</h2>
            <p>Last updated: ${new Date().toLocaleString()}</p>
            
            <div class="components">
              <div class="component">
                <span class="operational">🟢 Operational</span> - AI Chat Engine
              </div>
              <div class="component">
                <span class="operational">🟢 Operational</span> - Database (MongoDB)
              </div>
              <div class="component">
                <span class="operational">🟢 Operational</span> - User Login/Auth
              </div>
              <div class="component">
                <span class="operational">🟢 Operational</span> - Admin Dashboard
              </div>
              <div class="component">
                <span class="operational">🟢 Operational</span> - Website Frontend
              </div>
            </div>
          </div>
          
          <p style="color: #FF6B6B; margin-top: 20px;">
            There was an issue loading the latest status data. Showing default values.
          </p>
          
          <p style="margin-top: 20px;">
            <a href="/" style="color: #00F2FF;">Back to Home</a>
          </p>
        </div>
      </body>
      </html>
    `);
  }
};
