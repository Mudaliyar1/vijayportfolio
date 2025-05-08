const { exec } = require('child_process');

// Find the process using port 3000
exec('netstat -ano | findstr :3000', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error finding process: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Error: ${stderr}`);
    return;
  }
  
  // Parse the output to find the PID
  const lines = stdout.trim().split('\n');
  if (lines.length === 0) {
    console.log('No process found using port 3000');
    return;
  }
  
  // Extract PID from the first line
  const match = lines[0].match(/\s+(\d+)$/);
  if (!match) {
    console.log('Could not extract PID from output');
    return;
  }
  
  const pid = match[1];
  console.log(`Found process with PID ${pid} using port 3000`);
  
  // Kill the process
  exec(`taskkill /F /PID ${pid}`, (killError, killStdout, killStderr) => {
    if (killError) {
      console.error(`Error killing process: ${killError.message}`);
      return;
    }
    
    if (killStderr) {
      console.error(`Error: ${killStderr}`);
      return;
    }
    
    console.log(`Successfully killed process with PID ${pid}`);
    console.log(killStdout);
  });
});
