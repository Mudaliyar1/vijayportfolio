require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MemoryStore = session.MemoryStore;
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const useragent = require('useragent');

// Load maintenance middleware
const { maintenanceMiddleware } = require('./controllers/maintenanceController');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(cookieParser());
app.use(methodOverride('_method'));

// Set up EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.use(express.static(path.join(__dirname, 'public')));

// Create a session store with error handling
let sessionStore;
try {
  sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'native',
    touchAfter: 24 * 3600, // time period in seconds
    // Important: Use JSON.stringify for session serialization
    stringify: true,
    // Disable crypto to avoid issues
    crypto: false,
    // Set a collection name
    collectionName: 'sessions',
    // Ensure expires field is set
    autoCreate: true,
    // Clear invalid sessions
    autoRemoveInterval: 10, // Minutes
    // Error handling
    handleReconnectFailed: () => {
      console.error('Failed to reconnect to MongoDB for sessions');
      return false; // Don't retry
    }
  });

  // Handle session store errors
  sessionStore.on('error', function(error) {
    console.error('Session store error:', error);
    // Use memory store as fallback if MongoDB store fails
    if (sessionStore.client && sessionStore.client.isConnected && !sessionStore.client.isConnected()) {
      console.log('Falling back to memory store for sessions');
      sessionStore = new MemoryStore();
    }
  });
} catch (err) {
  console.error('Failed to create session store:', err);
  // Fallback to memory store
  sessionStore = new MemoryStore();
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key_for_development',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
    httpOnly: true,
    // Only use secure cookies if we're behind a proxy with HTTPS
    secure: process.env.NODE_ENV === 'production' && process.env.SECURE_COOKIES === 'true',
    // Add sameSite attribute for better security and compatibility
    sameSite: 'lax',
    // Ensure the cookie is always set
    expires: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)),
    // Set path to root to ensure cookie is available throughout the site
    path: '/',
    // Don't set domain in production - let the browser handle it
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
  },
  // Add error handling for session
  unset: 'destroy',
  rolling: true, // Reset the cookie expiration on each request
  // Ensure proper session serialization
  serialize: function(session) {
    return JSON.stringify(session);
  },
  // Ensure proper session deserialization
  unserialize: function(sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch (err) {
      console.error('Error deserializing session:', err);
      return {};
    }
  }
}));

// Add session error handling middleware
const sessionErrorHandler = require('./middleware/sessionErrorHandler');
app.use(sessionErrorHandler);

// Make session store available to routes
app.set('sessionStore', sessionStore);

// Add session redirect handler after session is initialized but before routes
const sessionRedirectHandler = require('./middleware/sessionRedirectHandler');
app.use(sessionRedirectHandler);

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Add enhanced authentication verification middleware
const authVerification = require('./middleware/authVerification');
app.use(authVerification);

// Flash messages
app.use(flash());

// Set up flash messages in res.locals
app.use((req, res, next) => {
  // Make sure flash object exists
  if (!req.session.flash) {
    req.session.flash = {};
  }

  // Get flash messages without consuming them
  const success_msg_debug = req.flash('success_msg');
  const error_msg_debug = req.flash('error_msg');
  const error_debug = req.flash('error');
  const warning_msg_debug = req.flash('warning_msg');

  // Only log flash messages in development mode if DEBUG_FLASH env variable is set
  if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_FLASH === 'true') {
    console.log('Flash messages in middleware (from session):');
    console.log('success_msg:', success_msg_debug);
    console.log('error_msg:', error_msg_debug);
    console.log('error:', error_debug);
  }

  // Filter out null values
  const filteredSuccessMsg = success_msg_debug.filter(msg => msg !== null && msg !== undefined);
  const filteredErrorMsg = error_msg_debug.filter(msg => msg !== null && msg !== undefined);
  const filteredError = error_debug.filter(msg => msg !== null && msg !== undefined);
  const filteredWarningMsg = warning_msg_debug.filter(msg => msg !== null && msg !== undefined);

  // Put them back since flash() consumes the messages
  filteredSuccessMsg.forEach(msg => req.flash('success_msg', msg));
  filteredErrorMsg.forEach(msg => req.flash('error_msg', msg));
  filteredError.forEach(msg => req.flash('error', msg));
  filteredWarningMsg.forEach(msg => req.flash('warning_msg', msg));

  // Set locals for all flash message types
  res.locals.success_msg = filteredSuccessMsg;
  res.locals.error_msg = filteredErrorMsg;
  res.locals.warning_msg = filteredWarningMsg;
  res.locals.error = filteredError;
  res.locals.errors = [];

  // Continue to the next middleware
  next();
});

// Database error handler middleware
const databaseErrorHandler = require('./middleware/databaseErrorHandler');
app.use(databaseErrorHandler);

// Flash messages middleware (for defaults)
const flashMessagesMiddleware = require('./middleware/flashMessages');
app.use(flashMessagesMiddleware);

// Health check routes (before other routes)
app.use('/health', require('./routes/health'));

// Robust health check API
app.use('/api/health-check', require('./routes/api/health-check'));

// Simple health check routes for backward compatibility
app.get('/health-checks', (req, res) => {
  res.json({ status: 'operational', timestamp: new Date().toISOString() });
});

app.get('/health-checks/details', (req, res) => {
  res.json({
    status: 'operational',
    database: { status: mongoose.connection.readyState },
    timestamp: new Date().toISOString()
  });
});

app.get('/health-checks/auth', (req, res) => {
  res.json({ status: 'operational', component: 'User Authentication' });
});

app.get('/health-checks/chat', (req, res) => {
  res.json({ status: 'operational', component: 'AI Chat Engine' });
});

app.get('/health-checks/admin', (req, res) => {
  res.json({ status: 'operational', component: 'Admin Dashboard' });
});

app.get('/health-checks/digital-twin', (req, res) => {
  res.json({ status: 'operational', component: 'Digital Twins' });
});

// Clear flash messages route
app.use('/clear-flash', require('./routes/clear-flash'));

// Session error route
app.use('/session-error', require('./routes/session-error'));

// General error route
app.use('/error', require('./routes/error'));

// Admin bypass maintenance middleware - must be before any other middleware
const adminBypassMaintenance = require('./middleware/adminBypassMaintenance');
app.use(adminBypassMaintenance);

// Admin status route - must be before maintenance middleware
app.use('/admin-status', require('./routes/admin-status')); // This is for admin authentication status checks

// View data middleware
const viewData = require('./middleware/viewData');

// Admin view data middleware
const adminViewData = require('./middleware/adminViewData');

// Admin routes - these should be before maintenance middleware
app.use('/admin', adminViewData);
app.use('/admin/templates', require('./routes/admin-templates')); // Admin templates routes - must be before general admin routes
app.use('/admin', require('./routes/admin'));
app.use('/admin/images', require('./routes/admin-images'));
app.use('/admin/rate-limits', require('./routes/admin-rate-limits'));
app.use('/admin/websites', require('./routes/admin-websites'));
app.use('/admin/package-inquiries', require('./routes/admin-package-inquiries'));
app.use('/admin/marketing-packages', require('./routes/admin-marketing-packages'));
app.use('/admin/ip-tracker', require('./routes/admin-ip-tracker')); // IP tracker routes
app.use('/admin/contact-messages', require('./routes/admin-contact-messages')); // Contact messages routes
app.use('/admin/system-status', require('./routes/admin-system-status')); // System status management routes
app.use('/admin/issues', require('./routes/admin-issues')); // Issue management routes
app.use('/admin/page-locks', require('./routes/admin-page-locks')); // Page lock management routes
app.use('/admin/ads', require('./routes/admin-ads')); // Ad management routes
app.use('/admin/settings', require('./routes/admin-settings')); // System settings routes


// Maintenance mode middleware - applied after admin routes
app.use(maintenanceMiddleware);

// Page lock middleware - applied after maintenance middleware
const pageLockMiddleware = require('./middleware/pageLockMiddleware');
app.use(pageLockMiddleware);

// Ads middleware - applied after page lock middleware
const adsMiddleware = require('./middleware/adsMiddleware');
app.use(adsMiddleware);

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/chat', require('./routes/chat'));
app.use('/status', require('./routes/status')); // System status page
app.use('/status-bridge', require('./routes/status-bridge')); // Status app session bridge
app.use('/issues', require('./routes/issues')); // Issue reporting and tracking routes
app.use('/report-issue', (req, res) => res.redirect('/issues/report')); // Redirect for convenience
app.use('/profile', require('./routes/profile'));
app.use('/reviews', require('./routes/reviews'));
app.use('/maintenance', require('./routes/maintenance'));
app.use('/images', require('./routes/images'));
app.use('/api/images', require('./routes/api-images'));
app.use('/rate-limits', require('./routes/rate-limits'));
app.use('/api/ai', require('./routes/ai-service')); // AI service route
app.use('/digital-twin', require('./routes/digital-twin')); // Digital Twin routes
app.use('/neural-dreamscape', require('./routes/neural-dreamscape')); // Neural Dreamscape routes
app.use('/tech-ads', require('./routes/tech-ads')); // Tech Ads showcase routes
app.use('/subscription', require('./routes/subscriptionRoutes')); // Subscription routes

app.use('/blog', require('./routes/blog')); // Blog routes
app.use('/community', require('./routes/community')); // Community routes
app.use('/website-builder', require('./routes/website-builder')); // Website builder routes
app.use('/user-site', require('./routes/user-site')); // User website routes
app.use('/website-builder/templates', require('./routes/templates')); // Website templates routes

// Package routes
app.use('/packages', require('./routes/packages'));
// Social routes removed as requested







// Policy pages routes
app.use('/policies', require('./routes/policies'));

// 404 handler
app.use((req, res) => {
  // Initialize empty ads object if not set
  if (!res.locals.ads) {
    res.locals.ads = {
      popup: [],
      top: [],
      bottom: [],
      sidebar: [],
      content: []
    };
  }

  res.status(404).render('404', {
    title: '404 - Page Not Found',
    user: req.user
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Initialize empty ads object if not set
  if (!res.locals.ads) {
    res.locals.ads = {
      popup: [],
      top: [],
      bottom: [],
      sidebar: [],
      content: []
    };
  }

  res.status(500).render('500', {
    title: '500 - Server Error',
    user: req.user
  });
});

// Initialize GeoIP database
const { initGeoIpDatabases } = require('./utils/geoIpUtils');
initGeoIpDatabases().then(success => {
  if (success) {
    console.log('GeoIP databases initialized successfully');
  } else {
    console.warn('GeoIP databases not found or failed to initialize');
    console.warn('IP geolocation will return default values');
    console.warn('Download the GeoLite2 databases from MaxMind and place them in the data directory');
  }
});

// Initialize internet ads service
const internetAdsService = require('./services/internetAdsService');
internetAdsService.initializeInternetAdsSettings().then(() => {
  console.log('Internet ads service initialized');

  // Check if internet ads are enabled and fetch them if needed
  internetAdsService.areInternetAdsEnabled().then(enabled => {
    if (enabled) {
      internetAdsService.fetchAndStoreInternetAds().then(count => {
        console.log(`Fetched ${count} internet ads`);
      });
    }
  });
});

// Initialize subscription settings
const subscriptionController = require('./controllers/subscriptionController');
subscriptionController.initializeSubscriptionSettings().then(() => {
  console.log('Subscription settings initialized');
});

// Initialize default subscription plans if needed
const SubscriptionPlan = require('./models/SubscriptionPlan');
SubscriptionPlan.countDocuments().then(count => {
  if (count === 0) {
    // Create default plans
    Promise.all([
      new SubscriptionPlan({
        name: 'Basic Monthly',
        description: 'Basic monthly subscription',
        amount: 99,
        duration: 1,
        durationUnit: 'months',
        active: true
      }).save(),
      new SubscriptionPlan({
        name: 'Premium Yearly',
        description: 'Premium yearly subscription with discount',
        amount: 999,
        duration: 1,
        durationUnit: 'years',
        active: true
      }).save(),
      new SubscriptionPlan({
        name: 'Trial',
        description: 'Short trial subscription',
        amount: 10,
        duration: 7,
        durationUnit: 'days',
        active: true
      }).save()
    ]).then(() => {
      console.log('Default subscription plans created');
    }).catch(err => {
      console.error('Error creating default subscription plans:', err);
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Log API key status
  if (process.env.BREVO_API_KEY) {
    console.log('Brevo API key is configured');
  } else {
    console.log('Brevo API key is not configured - email functionality will not work');
  }

  // Log Cohere API key status
  if (process.env.COHERE_API_KEY) {
    console.log(`Using Cohere API key: ${process.env.COHERE_API_KEY.substring(0, 5)}...`);
  } else {
    console.log('Cohere API key is not configured - AI functionality will not work');
  }
});
