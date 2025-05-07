/**
 * Analytics Loader
 * Conditionally loads analytics scripts based on cookie consent
 */

(function() {
  // Configuration
  const config = {
    googleAnalyticsId: 'G-XXXXXXXXXX', // Replace with your actual GA ID
    loadAnalytics: function() {
      // Only load analytics if user has given full consent
      if (window.cookieConsent && window.cookieConsent.isFullConsent()) {
        loadGoogleAnalytics();
      }
    }
  };
  
  // Load Google Analytics
  function loadGoogleAnalytics() {
    // Check if already loaded
    if (window.ga || window.gtag) return;
    
    // Create script element for Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`;
    document.head.appendChild(script);
    
    // Initialize Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', config.googleAnalyticsId);
    
    // Make gtag available globally
    window.gtag = gtag;
    
    console.log('Google Analytics loaded');
  }
  
  // Initialize
  function init() {
    // Check if cookie consent is available
    if (window.cookieConsent) {
      // Load analytics if consent already given
      config.loadAnalytics();
      
      // Listen for consent changes
      document.addEventListener('cookieConsentChange', function(event) {
        if (event.detail.type === 'full_consent') {
          config.loadAnalytics();
        }
      });
    } else {
      // If cookie consent script not loaded yet, wait for it
      window.addEventListener('load', function() {
        if (window.cookieConsent) {
          config.loadAnalytics();
        }
      });
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
