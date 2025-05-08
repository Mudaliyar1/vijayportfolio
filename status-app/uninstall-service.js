/**
 * Uninstall Status App Windows Service
 * 
 * This script uninstalls the status app Windows service created by install-service.js.
 * 
 * Prerequisites:
 * 1. Run this script with administrator privileges
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'FTRAISE AI Status Page',
  script: path.join(__dirname, 'server.js')
});

// Listen for uninstall events
svc.on('uninstall', () => {
  console.log('Service uninstalled successfully!');
  console.log('The FTRAISE AI Status Page service has been removed.');
});

svc.on('error', (err) => {
  console.error('Error uninstalling service:', err);
});

// Uninstall the service
console.log('Uninstalling FTRAISE AI Status Page service...');
svc.uninstall();
