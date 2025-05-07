/**
 * Script to update environment variables for production
 * This script will:
 * 1. Check if SECURE_COOKIES is set
 * 2. Set it to 'false' if not set and we're in production
 * 
 * Run with: node scripts/update-env.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Check if SECURE_COOKIES is set
const secureCoookiesSet = process.env.SECURE_COOKIES !== undefined;

// If we're in production and SECURE_COOKIES is not set, set it to 'false'
if (isProduction && !secureCoookiesSet) {
  console.log('Setting SECURE_COOKIES=false for production environment');
  
  // Path to .env file
  const envPath = path.join(__dirname, '..', '.env');
  
  // Check if .env file exists
  if (fs.existsSync(envPath)) {
    // Read .env file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if SECURE_COOKIES is already in the file
    if (envContent.includes('SECURE_COOKIES=')) {
      // Replace existing value
      envContent = envContent.replace(/SECURE_COOKIES=.*/, 'SECURE_COOKIES=false');
    } else {
      // Add new line
      envContent += '\n# Set to true only if you have HTTPS configured\nSECURE_COOKIES=false\n';
    }
    
    // Write updated content back to .env file
    fs.writeFileSync(envPath, envContent);
    console.log('.env file updated successfully');
  } else {
    // Create new .env file
    fs.writeFileSync(envPath, 'SECURE_COOKIES=false\n');
    console.log('Created new .env file with SECURE_COOKIES=false');
  }
  
  // Update process.env for current execution
  process.env.SECURE_COOKIES = 'false';
} else if (secureCoookiesSet) {
  console.log(`SECURE_COOKIES is already set to: ${process.env.SECURE_COOKIES}`);
} else {
  console.log('Not in production environment, no changes needed');
}

console.log('Environment check complete');
