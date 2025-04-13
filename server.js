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
    secure: process.env.NODE_ENV === 'production',
    // Ensure the cookie is always set
    expires: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000))
  },
  // Add error handling for session
  unset: 'destroy',
  rolling: true // Reset the cookie expiration on each request
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

// Flash messages
app.use(flash());

// Set up flash messages in res.locals
app.use((req, res, next) => {
  // Make sure flash object exists
  if (!req.session.flash) {
    req.session.flash = {};
  }

  // Get flash messages without consuming them for debugging
  const success_msg_debug = req.flash('success_msg');
  const error_msg_debug = req.flash('error_msg');
  const error_debug = req.flash('error');
  const warning_msg_debug = req.flash('warning_msg');

  // Debug flash messages
  console.log('Flash messages in middleware (from session):');
  console.log('success_msg:', success_msg_debug);
  console.log('error_msg:', error_msg_debug);
  console.log('error:', error_debug);

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

// Clear flash messages route
app.use('/clear-flash', require('./routes/clear-flash'));

// Session error route
app.use('/session-error', require('./routes/session-error'));

// Admin bypass maintenance middleware - must be before any other middleware
const adminBypassMaintenance = require('./middleware/adminBypassMaintenance');
app.use(adminBypassMaintenance);

// Admin status route - must be before maintenance middleware
app.use('/admin-status', require('./routes/admin-status'));

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








// Maintenance mode middleware - applied after admin routes
app.use(maintenanceMiddleware);

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/chat', require('./routes/chat'));
app.use('/profile', require('./routes/profile'));
app.use('/reviews', require('./routes/reviews'));
app.use('/maintenance', require('./routes/maintenance'));
app.use('/images', require('./routes/images'));
app.use('/api/images', require('./routes/api-images'));
app.use('/rate-limits', require('./routes/rate-limits'));
app.use('/api/ai', require('./routes/ai-service')); // AI service route

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
  res.status(404).render('404', {
    title: '404 - Page Not Found',
    user: req.user
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', {
    title: '500 - Server Error',
    user: req.user
  });
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
