/**
 * Install Status App as a Windows Service
 * 
 * This script installs the status app as a Windows service using node-windows.
 * 
 * Prerequisites:
 * 1. Install node-windows: npm install -g node-windows
 * 2. Run this script with administrator privileges
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'FTRAISE AI Status Page',
  description: 'Independent status page for FTRAISE AI',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [],
  workingDirectory: __dirname,
  allowServiceLogon: true
});

// Listen for service install events
svc.on('install', () => {
  console.log('Service installed successfully!');
  svc.start();
});

svc.on('start', () => {
  console.log('Service started successfully!');
  console.log('The status page is now running as a Windows service.');
  console.log('It will automatically start when the computer boots up.');
});

svc.on('error', (err) => {
  console.error('Error installing service:', err);
});

// Install the service
console.log('Installing FTRAISE AI Status Page as a Windows service...');
svc.install();
