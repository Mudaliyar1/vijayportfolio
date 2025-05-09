/**
 * Start Servers Script
 *
 * This script starts both the main application server and the status server
 * in separate processes, ensuring that the status page remains operational
 * even if the main application crashes.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const MAIN_SERVER_FILE = 'server.js';
const STATUS_SERVER_FILE = 'status-server.js';
const LOG_DIR = 'logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Create log streams
const mainServerLogStream = fs.createWriteStream(path.join(LOG_DIR, 'main-server.log'), { flags: 'a' });
const statusServerLogStream = fs.createWriteStream(path.join(LOG_DIR, 'status-server.log'), { flags: 'a' });

// Helper function to log with timestamp
function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${message}`;
}

// Start the main server
function startMainServer() {
  console.log('Starting main server...');

  // Pass environment variables to the main server
  const env = { ...process.env };

  const mainServer = spawn('node', [MAIN_SERVER_FILE], {
    stdio: 'pipe',
    detached: false,
    env: env
  });

  mainServer.stdout.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`[Main] ${message}`);
    mainServerLogStream.write(logWithTimestamp(`[Main] ${message}\n`));
  });

  mainServer.stderr.on('data', (data) => {
    const message = data.toString().trim();
    console.error(`[Main] ${message}`);
    mainServerLogStream.write(logWithTimestamp(`[Main][ERROR] ${message}\n`));
  });

  mainServer.on('close', (code) => {
    const message = `Main server process exited with code ${code}`;
    console.log(message);
    mainServerLogStream.write(logWithTimestamp(`${message}\n`));

    // Restart the main server if it crashes
    if (code !== 0) {
      console.log('Main server crashed. Restarting in 5 seconds...');
      setTimeout(startMainServer, 5000);
    }
  });

  return mainServer;
}

// Start the status server
function startStatusServer() {
  console.log('Starting status server...');

  // Kill any existing processes on the status port
  try {
    // Try to find and kill any process using the status port
    if (process.platform === 'win32') {
      // Windows command to find and kill process using the port
      const findPortCmd = spawn('powershell', [
        '-Command',
        `Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id (Get-Process | Where-Object {$_.Id -eq $_.OwningProcess}) -Force -ErrorAction SilentlyContinue }`
      ]);

      findPortCmd.on('error', (err) => {
        console.error('Error trying to free port:', err);
      });
    } else {
      // Unix command to find and kill process using the port
      const findPortCmd = spawn('sh', [
        '-c',
        `lsof -i :3001 -t | xargs -r kill -9`
      ]);

      findPortCmd.on('error', (err) => {
        console.error('Error trying to free port:', err);
      });
    }
  } catch (err) {
    console.error('Error trying to free port:', err);
  }

  // Create a variable to store the server process
  let statusServerProcess = null;

  // Wait a moment for the port to be freed
  setTimeout(() => {
    // Pass environment variables to the status server
    const env = { ...process.env };

    // If STATUS_PORT is not set, use a different port than the main server
    if (!env.STATUS_PORT) {
      const mainPort = parseInt(env.PORT || '3000');
      env.STATUS_PORT = (mainPort + 1).toString();
      console.log(`STATUS_PORT not set, using port ${env.STATUS_PORT}`);
    }

    statusServerProcess = spawn('node', [STATUS_SERVER_FILE], {
      stdio: 'pipe',
      detached: false,
      env: env
    });

    statusServerProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      console.log(`[Status] ${message}`);
      statusServerLogStream.write(logWithTimestamp(`[Status] ${message}\n`));
    });

    statusServerProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      console.error(`[Status] ${message}`);
      statusServerLogStream.write(logWithTimestamp(`[Status][ERROR] ${message}\n`));
    });

    statusServerProcess.on('close', (code) => {
      const message = `Status server process exited with code ${code}`;
      console.log(message);
      statusServerLogStream.write(logWithTimestamp(`${message}\n`));

      // Always restart the status server if it exits
      console.log('Status server exited. Restarting in 5 seconds...');
      setTimeout(startStatusServer, 5000);
    });
  }, 1000); // Wait 1 second for the port to be freed

  return statusServerProcess;
}

// Start both servers
const mainServer = startMainServer();
const statusServer = startStatusServer();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down servers...');

  // Kill both servers
  if (mainServer && !mainServer.killed) {
    mainServer.kill();
  }

  if (statusServer && !statusServer.killed) {
    statusServer.kill();
  }

  // Close log streams
  mainServerLogStream.end();
  statusServerLogStream.end();

  // Exit the process
  process.exit(0);
});

console.log('Both servers started. Press Ctrl+C to stop.');
