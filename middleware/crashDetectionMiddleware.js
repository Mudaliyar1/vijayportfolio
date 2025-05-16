/**
 * Crash Detection Middleware
 *
 * This middleware monitors for crashes and logs them to the console.
 * Status-related functionality has been removed.
 */

// Flag to track if crash handlers have been set up
let crashHandlersInitialized = false;

// Handle process termination
function setupCrashHandlers() {
  // Only set up handlers once to prevent memory leaks
  if (crashHandlersInitialized) {
    return;
  }

  // Increase the max listeners to prevent warnings
  process.setMaxListeners(15);

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);

    // Exit with error code after a delay to allow logging
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');

    // Exit gracefully
    process.exit(0);
  });

  // Mark as initialized
  crashHandlersInitialized = true;
  console.log('Crash handlers initialized');
}

// Flag to track if middleware has been initialized
let middlewareInitialized = false;

// Initialize the crash detection system
function initialize() {
  if (middlewareInitialized) {
    return;
  }

  // Set up crash handlers
  setupCrashHandlers();

  // Mark as initialized
  middlewareInitialized = true;
  console.log('Crash detection middleware initialized');
}

// Initialize on module load
initialize();

// Middleware function
module.exports = function(req, res, next) {
  // Continue to the next middleware
  next();
};
