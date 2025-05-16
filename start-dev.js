/**
 * Start Development Server
 * 
 * This script starts the development server using nodemon.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting development server...');

// Get the path to server.js
const serverPath = path.join(__dirname, 'server.js');

// Start nodemon with server.js
const nodemon = spawn('nodemon', [serverPath], {
  stdio: 'inherit',
  shell: true
});

// Handle process exit
nodemon.on('close', (code) => {
  console.log(`Development server exited with code ${code}`);
});

// Handle errors
nodemon.on('error', (err) => {
  console.error('Failed to start development server:', err);
});
