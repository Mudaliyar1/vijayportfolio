/**
 * Dependency Check Script
 * 
 * This script checks if all required dependencies are installed
 * and installs any missing ones. It's useful for deployment environments
 * where dependencies might be missing.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of critical dependencies that must be present
const criticalDependencies = [
  'razorpay',
  'axios',
  'cohere-ai',
  'mongoose',
  'express',
  'dotenv'
];

console.log('Checking for critical dependencies...');

// Read the package.json file
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const installedDependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

// Check if each critical dependency is installed
const missingDependencies = [];

criticalDependencies.forEach(dependency => {
  try {
    // Try to require the dependency
    require.resolve(dependency);
    console.log(`✅ ${dependency} is installed and available`);
  } catch (error) {
    // If it fails, add to missing dependencies
    console.log(`❌ ${dependency} is missing or not available`);
    missingDependencies.push(dependency);
  }
});

// Install missing dependencies
if (missingDependencies.length > 0) {
  console.log(`\nInstalling ${missingDependencies.length} missing dependencies...`);
  
  try {
    // Install all missing dependencies
    execSync(`npm install ${missingDependencies.join(' ')}`, { stdio: 'inherit' });
    console.log('\nAll missing dependencies have been installed successfully!');
  } catch (error) {
    console.error('\nFailed to install missing dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('\nAll critical dependencies are installed and available!');
}

// Verify Razorpay specifically since it's causing the deployment issue
try {
  const Razorpay = require('razorpay');
  console.log('✅ Razorpay module loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Razorpay module:', error.message);
  
  // Try to reinstall Razorpay specifically
  try {
    console.log('Attempting to reinstall Razorpay...');
    execSync('npm uninstall razorpay && npm install razorpay@2.9.2', { stdio: 'inherit' });
    console.log('Razorpay reinstalled successfully!');
  } catch (reinstallError) {
    console.error('Failed to reinstall Razorpay:', reinstallError.message);
  }
}

console.log('\nDependency check completed.');
