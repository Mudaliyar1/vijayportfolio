/**
 * Environment Variable Checker
 * 
 * This script checks for required environment variables and provides warnings
 * for missing or potentially problematic configurations.
 */

// Function to check environment variables
function checkEnvironmentVariables() {
  console.log('Checking environment variables...');
  
  const requiredVars = [
    { name: 'MONGODB_URI', critical: true, description: 'MongoDB connection string' },
    { name: 'SESSION_SECRET', critical: true, description: 'Secret for session encryption' },
    { name: 'COHERE_API_KEY', critical: false, description: 'API key for Cohere AI services' },
    { name: 'BREVO_API_KEY', critical: false, description: 'API key for Brevo email services' },
    { name: 'RAZORPAY_KEY_ID', critical: false, description: 'Razorpay Key ID for payment processing' },
    { name: 'RAZORPAY_KEY_SECRET', critical: false, description: 'Razorpay Key Secret for payment processing' }
  ];
  
  let criticalMissing = false;
  let warningCount = 0;
  
  // Check each variable
  for (const variable of requiredVars) {
    if (!process.env[variable.name] || process.env[variable.name].trim() === '') {
      if (variable.critical) {
        console.error(`❌ CRITICAL: Missing required environment variable: ${variable.name} - ${variable.description}`);
        criticalMissing = true;
      } else {
        console.warn(`⚠️ WARNING: Missing optional environment variable: ${variable.name} - ${variable.description}`);
        console.warn(`   Some functionality related to ${variable.description} may not work correctly.`);
        warningCount++;
      }
    }
  }
  
  // Special check for Razorpay keys
  if ((!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.trim() === '') && 
      (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.trim() === '')) {
    console.warn('⚠️ Both Razorpay API keys are missing. Payment functionality will be limited to mock mode.');
    console.warn('   This may cause errors when users attempt to make payments.');
  }
  
  // Summary
  if (criticalMissing) {
    console.error('❌ Critical environment variables are missing. The application may not function correctly.');
  } else if (warningCount > 0) {
    console.warn(`⚠️ ${warningCount} optional environment variables are missing. Some features may be limited.`);
  } else {
    console.log('✅ All required environment variables are present.');
  }
  
  console.log('Environment variable check completed.');
}

// Run the check
checkEnvironmentVariables();

module.exports = { checkEnvironmentVariables };
