require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
const flash = require('connect-flash');
const session = require('express-session');
const security = require('./utils/security');

// Import models
const SystemStatus = require('./models/SystemStatus');
const Incident = require('./models/Incident');
const StatusSubscription = require('./models/StatusSubscription');
const UptimeRecord = require('./models/UptimeRecord');

// Import monitors
const endpointMonitor = require('./monitors/endpoint-monitor');

// Import utilities
const uptimeCalculator = require('./utils/uptime-calculator');
const notificationSender = require('./utils/notification-sender');

// Initialize Express app
const app = express();
const PORT = process.env.STATUS_PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log('MongoDB Connected');

    // Check for existing SystemStatus documents
    try {
      const existingSystemStatus = await SystemStatus.findOne();
      if (!existingSystemStatus) {
        console.log('No existing SystemStatus found, creating a new one...');
        // Create a fresh system status with only the active endpoints
        const freshSystemStatus = new SystemStatus({
          overallStatus: 'operational',
          components: endpointMonitor.endpoints.map(endpoint => ({
            name: endpoint.name,
            status: 'operational',
            lastChecked: new Date(),
            responseTime: 0,
            statusCode: 200,
            errorMessage: null,
            endpoint: endpoint.endpoint
          }))
        });

        await freshSystemStatus.save();
        console.log('Created fresh system status with active endpoints.');
      } else {
        console.log('Existing SystemStatus found, no need to create a new one.');
      }
    } catch (cleanupErr) {
      console.error('Error checking SystemStatus documents:', cleanupErr);
    }

    // System status is already created in the previous step if needed

    // Run initial monitoring
    await endpointMonitor.monitorEndpoints();
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Configure Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Add security headers
app.use(security.securityHeadersMiddleware);

// Add rate limiting to prevent abuse
app.use(security.rateLimitMiddleware(100, 15 * 60 * 1000));

// Add CORS support
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000', process.env.MAIN_APP_URL],
  credentials: true
}));

// Set up EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key_for_development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    httpOnly: true,
    secure: false, // Set to false for local development
    sameSite: 'lax',
    // Important: Use the same domain for both apps
    domain: 'localhost',
    path: '/'
  }
}));

// Flash messages
app.use(flash());

// Set up flash messages in res.locals
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.warning_msg = req.flash('warning_msg');
  res.locals.info_msg = req.flash('info_msg');
  next();
});

// Session Bridge Middleware
const sessionBridge = require('./middleware/session-bridge');
app.use(sessionBridge.checkSessionToken);

// Make user available to all templates
app.use((req, res, next) => {
  // Check if the session has user data from the main app
  if (req.session && req.session.passport && req.session.passport.user) {
    // Try to get user data from the main app's session
    try {
      // Find the user in the database
      mongoose.connection.db.collection('users')
        .findOne({ _id: mongoose.Types.ObjectId(req.session.passport.user) })
        .then(user => {
          if (user) {
            res.locals.user = user;
            res.locals.isAuthenticated = true;
            res.locals.isAdmin = user.isAdmin || user.role === 'admin';
          } else {
            res.locals.user = null;
            res.locals.isAuthenticated = false;
            res.locals.isAdmin = false;
          }
          next();
        })
        .catch(err => {
          console.error('Error finding user:', err);
          res.locals.user = null;
          res.locals.isAuthenticated = false;
          res.locals.isAdmin = false;
          next();
        });
    } catch (err) {
      console.error('Error processing user session:', err);
      res.locals.user = null;
      res.locals.isAuthenticated = false;
      res.locals.isAdmin = false;
      next();
    }
  } else {
    res.locals.user = null;
    res.locals.isAuthenticated = false;
    res.locals.isAdmin = false;
    next();
  }
});

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

// Helper function to get incident status text and color
function getIncidentStatusInfo(status) {
  switch (status) {
    case 'investigating':
      return { text: 'Investigating', color: 'yellow', icon: '🔍' };
    case 'identified':
      return { text: 'Identified', color: 'orange', icon: '🔎' };
    case 'monitoring':
      return { text: 'Monitoring', color: 'blue', icon: '👀' };
    case 'resolved':
      return { text: 'Resolved', color: 'green', icon: '✅' };
    default:
      return { text: 'Unknown', color: 'gray', icon: '❓' };
  }
}

// Routes
app.get('/', async (req, res) => {
  try {
    // Get the current system status
    let systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

    // If no system status exists, create a default one
    if (!systemStatus) {
      systemStatus = await SystemStatus.create({
        overallStatus: 'operational',
        components: endpointMonitor.endpoints.map(endpoint => ({
          name: endpoint.name,
          status: 'operational',
          lastChecked: new Date(),
          responseTime: 0,
          statusCode: 200,
          errorMessage: null,
          endpoint: endpoint.endpoint || '/' // Provide a default endpoint if not available
        }))
      });
    }

    // Get incidents with time filter from query parameter or default to 30 days
    const timeFilter = req.query.timeFilter || '30days';
    let dateFilter = {};

    if (timeFilter !== 'all') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      switch(timeFilter) {
        case '30days':
          dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
          break;
        case '90days':
          dateFilter = { createdAt: { $gte: ninetyDaysAgo } };
          break;
        case '6months':
          dateFilter = { createdAt: { $gte: sixMonthsAgo } };
          break;
        case '1year':
          dateFilter = { createdAt: { $gte: oneYearAgo } };
          break;
        default:
          dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
      }
    }

    const incidents = await Incident.find(dateFilter).sort({ createdAt: -1 });

    // Get uptime data
    const uptimeData = await uptimeCalculator.getUptimeData(30);

    // Format incidents for display
    const formattedIncidents = incidents.map(incident => {
      return {
        ...incident.toObject(),
        statusInfo: getIncidentStatusInfo(incident.status),
        duration: incident.duration,
        isOngoing: incident.isOngoing
      };
    });

    // Get status info for display
    const overallStatusInfo = getStatusInfo(systemStatus.overallStatus);
    const componentsWithInfo = systemStatus.components.map(component => {
      return {
        ...component.toObject(),
        statusInfo: getStatusInfo(component.status),
        uptime: uptimeData[component.name]?.uptime || 100
      };
    });

    res.render('index', {
      title: 'System Status - FTRAISE AI',
      systemStatus,
      overallStatusInfo,
      components: componentsWithInfo,
      incidents: formattedIncidents,
      uptimeData,
      timeFilter: req.query.timeFilter || '30days'
    });
  } catch (err) {
    console.error('Error rendering status page:', err);
    res.status(500).render('error', {
      title: 'Error - FTRAISE AI Status',
      message: 'An error occurred while loading the status page.'
    });
  }
});

// API route to get current status
app.get('/api/status', async (req, res) => {
  try {
    // Get the current system status
    const systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

    if (!systemStatus) {
      return res.status(404).json({ error: 'System status not found' });
    }

    res.json({
      overallStatus: systemStatus.overallStatus,
      components: systemStatus.components,
      updatedAt: systemStatus.updatedAt
    });
  } catch (err) {
    console.error('Error getting system status:', err);
    res.status(500).json({ error: 'An error occurred while getting the system status.' });
  }
});

// API route to get incidents
app.get('/api/incidents', async (req, res) => {
  try {
    // Get incidents with time filter from query parameter
    const timeFilter = req.query.timeFilter || req.query.days ? `${req.query.days}days` : '30days';
    let dateFilter = {};

    if (timeFilter !== 'all') {
      // Support both new timeFilter parameter and legacy days parameter
      if (timeFilter.endsWith('days') && !isNaN(parseInt(timeFilter))) {
        const days = parseInt(timeFilter);
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);
        dateFilter = { createdAt: { $gte: daysAgo } };
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        switch(timeFilter) {
          case '30days':
            dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
            break;
          case '90days':
            dateFilter = { createdAt: { $gte: ninetyDaysAgo } };
            break;
          case '6months':
            dateFilter = { createdAt: { $gte: sixMonthsAgo } };
            break;
          case '1year':
            dateFilter = { createdAt: { $gte: oneYearAgo } };
            break;
          default:
            dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
        }
      }
    }

    const incidents = await Incident.find(dateFilter).sort({ createdAt: -1 });

    res.json(incidents);
  } catch (err) {
    console.error('Error getting incidents:', err);
    res.status(500).json({ error: 'An error occurred while getting incidents.' });
  }
});

// API route to get uptime data
app.get('/api/uptime', async (req, res) => {
  try {
    // Get uptime data
    const days = parseInt(req.query.days) || 30;
    const uptimeData = await uptimeCalculator.getUptimeData(days);

    res.json(uptimeData);
  } catch (err) {
    console.error('Error getting uptime data:', err);
    res.status(500).json({ error: 'An error occurred while getting uptime data.' });
  }
});

// API route to get hourly uptime data for a component
app.get('/api/uptime/:component/hourly', async (req, res) => {
  try {
    const { component } = req.params;
    const days = parseInt(req.query.days) || 1;

    const hourlyData = await uptimeCalculator.getHourlyUptimeData(component, days);

    res.json(hourlyData);
  } catch (err) {
    console.error('Error getting hourly uptime data:', err);
    res.status(500).json({ error: 'An error occurred while getting hourly uptime data.' });
  }
});

// API route to get daily uptime data for a component
app.get('/api/uptime/:component/daily', async (req, res) => {
  try {
    const { component } = req.params;
    const days = parseInt(req.query.days) || 30;

    const dailyData = await uptimeCalculator.getDailyUptimeData(component, days);

    res.json(dailyData);
  } catch (err) {
    console.error('Error getting daily uptime data:', err);
    res.status(500).json({ error: 'An error occurred while getting daily uptime data.' });
  }
});

// Subscribe to status updates
app.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    // Sanitize and validate email
    const sanitizedEmail = security.sanitizeInput(email);

    // Check if email is valid
    if (!sanitizedEmail || !security.isValidEmail(sanitizedEmail)) {
      req.flash('error_msg', 'Please enter a valid email address.');
      return res.redirect('/#subscribe');
    }

    // Check if email is already subscribed
    const existingSubscription = await StatusSubscription.findOne({ email });

    if (existingSubscription) {
      if (existingSubscription.isVerified) {
        req.flash('error_msg', 'This email is already subscribed to status updates.');
      } else {
        req.flash('info_msg', 'This email is already subscribed but not verified. Please check your inbox for the verification email.');
      }
      return res.redirect('/#subscribe');
    }

    // Generate secure tokens
    const verificationToken = security.generateSecureToken(16);
    const unsubscribeToken = security.generateSecureToken(16);

    // Create subscription
    const subscription = new StatusSubscription({
      email,
      verificationToken,
      unsubscribeToken
    });

    await subscription.save();

    // Import email sender
    const emailSender = require('./utils/email-sender');

    // Send verification email
    const emailSent = await emailSender.sendVerificationEmail(email, verificationToken);

    if (emailSent) {
      console.log(`Verification email sent to ${email}`);
      req.flash('success_msg', 'Thank you for subscribing! Please check your email to verify your subscription.');
    } else {
      console.log(`Failed to send verification email to ${email}`);
      console.log(`Verification link for ${email}: /verify/${verificationToken}`);
      req.flash('warning_msg', 'Your subscription was created, but we could not send a verification email. Please contact support.');
    }

    res.redirect('/#subscribe');
  } catch (err) {
    console.error('Error subscribing to status updates:', err);
    req.flash('error_msg', 'An error occurred while subscribing. Please try again.');
    res.redirect('/#subscribe');
  }
});

// Verify subscription
app.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find subscription with this verification token
    const subscription = await StatusSubscription.findOne({ verificationToken: token });

    if (!subscription) {
      req.flash('error_msg', 'Invalid or expired verification token.');
      return res.redirect('/#subscribe');
    }

    // Mark as verified
    subscription.isVerified = true;
    subscription.verificationToken = null;
    await subscription.save();

    req.flash('success_msg', 'Your subscription has been verified. You will now receive status updates.');
    res.redirect('/#subscribe');
  } catch (err) {
    console.error('Error verifying subscription:', err);
    req.flash('error_msg', 'An error occurred while verifying your subscription. Please try again.');
    res.redirect('/#subscribe');
  }
});

// Unsubscribe
app.get('/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find subscription with this unsubscribe token
    const subscription = await StatusSubscription.findOne({ unsubscribeToken: token });

    if (!subscription) {
      req.flash('error_msg', 'Invalid or expired unsubscribe token.');
      return res.redirect('/#subscribe');
    }

    // Delete subscription
    await subscription.deleteOne();

    req.flash('success_msg', 'You have been unsubscribed from status updates.');
    res.redirect('/#subscribe');
  } catch (err) {
    console.error('Error unsubscribing:', err);
    req.flash('error_msg', 'An error occurred while unsubscribing. Please try again.');
    res.redirect('/#subscribe');
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Send current status on connection
  SystemStatus.findOne().sort({ updatedAt: -1 })
    .then(systemStatus => {
      if (systemStatus) {
        socket.emit('statusUpdate', {
          overallStatus: systemStatus.overallStatus,
          components: systemStatus.components,
          updatedAt: systemStatus.updatedAt
        });
      }
    })
    .catch(err => console.error('Error sending initial status:', err));

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Schedule monitoring
const monitorInterval = parseInt(process.env.MONITOR_INTERVAL) || 60000; // Default: 1 minute

// Schedule monitoring using node-cron (every minute by default)
cron.schedule('* * * * *', async () => {
  try {
    const result = await endpointMonitor.monitorEndpoints();

    if (result) {
      // Emit status update to all connected clients
      io.emit('statusUpdate', {
        overallStatus: result.systemStatus.overallStatus,
        components: result.systemStatus.components,
        updatedAt: result.systemStatus.updatedAt
      });
    }
  } catch (error) {
    console.error('Error in scheduled monitoring:', error);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: '500 - Server Error',
    message: 'An error occurred on the server.'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Status app running on port ${PORT}`);
});
