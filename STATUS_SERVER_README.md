# FTRAISE AI Status Server

This is a separate server for the FTRAISE AI status page that runs independently from the main application. This ensures that the status page remains operational even if the main application crashes.

## Features

- **Independent Operation**: Runs in a separate Node.js process, ensuring it stays up even if the main server crashes
- **Real-time Monitoring**: Monitors the main server and updates the status page accordingly
- **Automatic Recovery**: Automatically detects when the main server is down and updates the status
- **Shared Database**: Uses the same MongoDB database as the main application for consistent status information
- **Resilient Design**: Multiple fallback mechanisms to ensure the status page always works

## How It Works

The status server is a separate Express application that:

1. Runs on a different port (default: 3001)
2. Connects to the same MongoDB database as the main application
3. Serves the status page with real-time information about system components
4. Monitors the main server's health and updates the status accordingly
5. Provides a dedicated API for status information

## Running the Status Server

### Running Both Servers Together

The easiest way to run both the main server and the status server is to use the provided start script:

```bash
npm run start:all
```

This will start both servers in separate processes and handle logging and automatic restarts.

### Running the Status Server Alone

If you want to run just the status server:

```bash
npm run start:status
```

### Development Mode

For development with automatic reloading:

```bash
npm run dev:all    # Run both servers with nodemon
npm run dev:status # Run just the status server with nodemon
```

## Configuration

The status server uses the following environment variables:

- `MONGODB_URI`: MongoDB connection string (same as main app)
- `STATUS_PORT`: Port for the status server (default: 3001)
- `SESSION_SECRET`: Secret for session encryption (same as main app)

## Testing Crash Functionality

The admin dashboard includes a "Website Crash Testing" panel that allows administrators to intentionally crash the main website for testing purposes. This is useful for verifying that the status page remains operational during outages.

Available crash test methods:

1. **Immediate Crash**: Shuts down the Node.js process immediately
2. **Exception Crash**: Throws an uncaught exception
3. **Memory Overload**: Consumes memory until the process crashes
4. **Infinite Loop**: Makes the server unresponsive with an infinite loop

When the main server crashes, the status server will:

1. Detect that the main server is down
2. Update the system status to reflect the outage
3. Continue to serve the status page with accurate information
4. Show a "Main Server Down" indicator in the header

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   Main Server   │     │  Status Server  │
│    (Port 3000)  │     │   (Port 3001)   │
│                 │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│                                         │
│             MongoDB Database            │
│                                         │
└─────────────────────────────────────────┘
```

## Logs

Both servers write logs to the `logs` directory:

- `logs/main-server.log`: Logs from the main server
- `logs/status-server.log`: Logs from the status server

## Troubleshooting

If you encounter issues:

1. Check that both servers are running (`npm run start:all`)
2. Verify that the MongoDB connection is working
3. Check the log files for error messages
4. Make sure the `STATUS_PORT` environment variable is set correctly

### Handling Port Conflicts

If you see an error like `EADDRINUSE: address already in use :::3001`, it means the status server port is already in use. You can resolve this in several ways:

1. **Kill processes using the port**:
   ```
   npm run kill-status-port
   ```
   This will find and terminate any process using port 3001.

2. **Use a different port**:
   Set a different port in your .env file:
   ```
   STATUS_PORT=3002
   ```

3. **Let the server find an available port**:
   The status server is designed to automatically try the next port if the default one is in use. You'll see a message like:
   ```
   Port 3001 is already in use, trying port 3002...
   ```
   The main server will automatically detect which port the status server is using.

## Production Deployment

For production deployment, you'll need to:

1. Set up process management (PM2, systemd, etc.) to keep both servers running
2. Configure a reverse proxy (Nginx, Apache) to route traffic appropriately
3. Set up proper environment variables for production
4. Configure proper logging and monitoring
