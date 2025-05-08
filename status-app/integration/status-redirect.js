/**
 * Status Page Redirect Script
 * 
 * This script can be added to the main application to redirect users to the status page
 * when the main application is down or experiencing issues.
 * 
 * Usage:
 * 1. Add this script to your main application's HTML
 * 2. Update the STATUS_PAGE_URL constant to point to your status page
 */

(function() {
  // Configuration
  const STATUS_PAGE_URL = 'https://status.ftraiseai.onrender.com'; // Update this URL
  const CHECK_INTERVAL = 10000; // 10 seconds
  const MAX_RETRIES = 3;
  
  // Variables
  let retryCount = 0;
  let isRedirecting = false;
  
  // Function to check if the main app is responsive
  function checkAppStatus() {
    // Only check if we're not already redirecting
    if (isRedirecting) return;
    
    fetch('/health', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      // Short timeout to detect unresponsive server
      signal: AbortSignal.timeout(5000)
    })
    .then(response => {
      if (!response.ok) {
        handleError(`Server responded with status: ${response.status}`);
      } else {
        // Reset retry count on success
        retryCount = 0;
        return response.json();
      }
    })
    .then(data => {
      if (data && data.status !== 'ok') {
        handleError(`Server reported unhealthy status: ${data.status}`);
      }
    })
    .catch(error => {
      handleError(`Failed to connect to server: ${error.message}`);
    });
  }
  
  // Function to handle errors
  function handleError(errorMessage) {
    console.warn(`Status check failed: ${errorMessage}`);
    retryCount++;
    
    if (retryCount >= MAX_RETRIES) {
      redirectToStatusPage();
    }
  }
  
  // Function to redirect to status page
  function redirectToStatusPage() {
    if (isRedirecting) return;
    isRedirecting = true;
    
    console.log(`Redirecting to status page after ${MAX_RETRIES} failed attempts`);
    
    // Show a message to the user
    const redirectMessage = document.createElement('div');
    redirectMessage.style.position = 'fixed';
    redirectMessage.style.top = '0';
    redirectMessage.style.left = '0';
    redirectMessage.style.width = '100%';
    redirectMessage.style.padding = '20px';
    redirectMessage.style.backgroundColor = '#f44336';
    redirectMessage.style.color = 'white';
    redirectMessage.style.textAlign = 'center';
    redirectMessage.style.zIndex = '9999';
    redirectMessage.innerHTML = `
      <p>We're experiencing technical difficulties. Redirecting you to our status page...</p>
    `;
    
    document.body.appendChild(redirectMessage);
    
    // Redirect after a short delay
    setTimeout(() => {
      window.location.href = STATUS_PAGE_URL;
    }, 2000);
  }
  
  // Start periodic checks
  setInterval(checkAppStatus, CHECK_INTERVAL);
  
  // Also check immediately
  checkAppStatus();
})();
