/**
 * Kill Status Port Script
 * 
 * This script finds and kills any process using port 3001 (the default status server port).
 * It's useful when you get the EADDRINUSE error and need to free up the port.
 */

const { exec } = require('child_process');
const os = require('os');

// The port to free up
const PORT = process.env.STATUS_PORT || 3001;

console.log(`Attempting to kill processes using port ${PORT}...`);

// Different commands for different operating systems
if (process.platform === 'win32') {
  // Windows command
  const command = `powershell -Command "Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id (Get-Process | Where-Object {$_.Id -eq $_.OwningProcess}) -Force -ErrorAction SilentlyContinue }"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`Port ${PORT} has been freed.`);
  });
} else {
  // Unix/Linux/Mac command
  const command = `lsof -i :${PORT} -t | xargs -r kill -9`;
  
  exec(command, (error, stdout, stderr) => {
    if (error && error.code !== 1) {
      // Error code 1 just means no processes were found, which is fine
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`Port ${PORT} has been freed.`);
  });
}

// Also try to delete the port file if it exists
const fs = require('fs');
try {
  if (fs.existsSync('status-server-port.txt')) {
    fs.unlinkSync('status-server-port.txt');
    console.log('Removed status-server-port.txt file');
  }
} catch (err) {
  console.error('Error removing port file:', err);
}
