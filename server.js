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
    // Disable encryption to avoid decryption issues
    crypto: false,
    stringify: false,
    // Fallback to in-memory session if MongoDB is unavailable
    fallbackMemory: true,
    // Clear invalid sessions
    autoRemoveInterval: 10 // Minutes
  });

  // Handle session store errors
  sessionStore.on('error', function(error) {
    console.error('Session store error:', error);
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
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Flash messages
app.use(flash());

// Set up flash messages in res.locals
app.use((req, res, next) => {
  // Only set flash messages if they exist and are not empty
  const success_msg = req.flash('success_msg');
  const error_msg = req.flash('error_msg');
  const warning_msg = req.flash('warning_msg');
  const error = req.flash('error');
  const errors = req.flash('errors');

  // Only set non-empty flash messages
  if (success_msg && success_msg.length > 0 && success_msg[0] !== '') {
    res.locals.success_msg = success_msg;
  } else {
    res.locals.success_msg = '';
  }

  if (error_msg && error_msg.length > 0 && error_msg[0] !== '') {
    res.locals.error_msg = error_msg;
  } else {
    res.locals.error_msg = '';
  }

  if (warning_msg && warning_msg.length > 0 && warning_msg[0] !== '') {
    res.locals.warning_msg = warning_msg;
  } else {
    res.locals.warning_msg = '';
  }

  if (error && error.length > 0 && error[0] !== '') {
    res.locals.error = error;
  } else {
    res.locals.error = '';
  }

  if (errors && errors.length > 0) {
    res.locals.errors = errors;
  } else {
    res.locals.errors = [];
  }

  next();
});

// Database error handler middleware
const databaseErrorHandler = require('./middleware/databaseErrorHandler');
app.use(databaseErrorHandler);

// Flash messages middleware (for defaults)
const flashMessagesMiddleware = require('./middleware/flashMessages');
app.use(flashMessagesMiddleware);

// Maintenance mode middleware
app.use(maintenanceMiddleware);

// Health check routes (before other routes)
app.use('/health', require('./routes/health'));

// Clear flash messages route
app.use('/clear-flash', require('./routes/clear-flash'));

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/chat', require('./routes/chat'));
app.use('/admin', require('./routes/admin'));
app.use('/profile', require('./routes/profile'));
app.use('/reviews', require('./routes/reviews'));
app.use('/maintenance', require('./routes/maintenance'));
app.use('/images', require('./routes/images'));
app.use('/api/images', require('./routes/api-images'));
app.use('/admin/images', require('./routes/admin-images'));
app.use('/rate-limits', require('./routes/rate-limits'));
app.use('/admin/rate-limits', require('./routes/admin-rate-limits'));
app.use('/api/ai', require('./routes/ai-service')); // AI service route
app.use('/blog', require('./routes/blog')); // Blog routes
app.use('/community', require('./routes/community')); // Community routes
// Social routes removed as requested

// Website builder routes
app.use('/', require('./routes/website-builder'));
app.use('/', require('./routes/packages'));
app.use('/', require('./routes/payments'));
app.use('/admin', require('./routes/admin-websites'));
app.use('/admin', require('./routes/admin-payments'));

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
});
