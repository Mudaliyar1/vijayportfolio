/**
 * Script to install dependencies required for AI website generator
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing dependencies for AI website generator...');

// Function to safely install a package
function safeInstall(packageName, version = '') {
  const fullPackageName = version ? `${packageName}@${version}` : packageName;

  try {
    // First try to require the package
    try {
      require(packageName);
      console.log(`✅ ${packageName} is already installed`);
      return true;
    } catch (e) {
      // Package is not installed, proceed with installation
      console.log(`Installing ${fullPackageName}...`);

      try {
        execSync(`npm install ${fullPackageName}`, { stdio: 'inherit' });
        console.log(`✅ ${packageName} installed successfully`);
        return true;
      } catch (installErr) {
        console.error(`❌ Failed to install ${packageName} using npm:`, installErr.message);

        // Try with yarn as fallback
        try {
          console.log(`Trying with yarn...`);
          execSync(`yarn add ${fullPackageName}`, { stdio: 'inherit' });
          console.log(`✅ ${packageName} installed successfully using yarn`);
          return true;
        } catch (yarnErr) {
          console.error(`❌ Failed to install ${packageName} using yarn:`, yarnErr.message);

          // Last resort: try to install globally
          try {
            console.log(`Trying global installation...`);
            execSync(`npm install -g ${fullPackageName}`, { stdio: 'inherit' });
            console.log(`✅ ${packageName} installed globally`);
            return true;
          } catch (globalErr) {
            console.error(`❌ Failed to install ${packageName} globally:`, globalErr.message);
            return false;
          }
        }
      }
    }
  } catch (e) {
    console.error(`❌ Unexpected error installing ${packageName}:`, e.message);
    return false;
  }
}

// Install required packages
const nodeFetchInstalled = safeInstall('node-fetch', '2');
const cheerioInstalled = safeInstall('cheerio');

// Create a message for the user
if (nodeFetchInstalled && cheerioInstalled) {
  console.log('\n✅ All dependencies installed successfully!');
  console.log('The AI website generator is ready to use.');
} else {
  console.log('\n⚠️ Some dependencies could not be installed.');
  console.log('The AI website generator will work with limited functionality.');
  console.log('You can try installing the missing dependencies manually:');
  if (!nodeFetchInstalled) {
    console.log('  npm install node-fetch@2');
  }
  if (!cheerioInstalled) {
    console.log('  npm install cheerio');
  }
}

// Create a flag file to indicate that we've attempted installation
fs.writeFileSync(
  path.join(__dirname, '..', '.ai-deps-attempted'),
  `Installation attempted at ${new Date().toISOString()}\n` +
  `node-fetch: ${nodeFetchInstalled ? 'installed' : 'failed'}\n` +
  `cheerio: ${cheerioInstalled ? 'installed' : 'failed'}\n`
);

console.log('\nYou can now restart your server to use the AI website generator.');
console.log('If you encounter any issues, please check the error messages above.');

