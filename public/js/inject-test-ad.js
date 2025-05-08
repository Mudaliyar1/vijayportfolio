/**
 * Manually inject a test ad
 */
document.addEventListener('DOMContentLoaded', function() {
  // Add a button to inject a test ad
  const injectButton = document.createElement('button');
  injectButton.textContent = 'Inject Test Ad';
  injectButton.style.background = 'green';
  injectButton.style.color = 'white';
  injectButton.style.padding = '5px 10px';
  injectButton.style.borderRadius = '3px';
  injectButton.style.marginLeft = '10px';
  
  // Add the button to the debug controls
  const debugControls = document.getElementById('ad-debug-controls');
  if (debugControls) {
    debugControls.appendChild(injectButton);
  }
  
  // Add click event to inject a test ad
  injectButton.addEventListener('click', function() {
    console.log('Injecting test ad...');
    
    // Create a test ad
    const testAd = {
      _id: 'test-ad-' + Date.now(),
      title: 'Injected Test Ad',
      description: 'This is a test ad injected via JavaScript',
      imageUrl: 'https://via.placeholder.com/300x250/00FF00/000000?text=TEST+AD',
      link: 'https://example.com',
      positions: ['sidebar', 'popup', 'top', 'bottom', 'content'],
      active: true,
      overlayText: 'TEST AD'
    };
    
    // Add the test ad to all positions
    if (!window.pageAds) {
      window.pageAds = {
        popup: [],
        top: [],
        bottom: [],
        sidebar: [],
        content: []
      };
    }
    
    window.pageAds.popup.push(testAd);
    window.pageAds.top.push(testAd);
    window.pageAds.bottom.push(testAd);
    window.pageAds.sidebar.push(testAd);
    window.pageAds.content.push(testAd);
    
    // Initialize ads
    if (typeof initializeAds === 'function') {
      initializeAds();
      alert('Test ad injected. Check the page for the ad.');
    } else {
      console.error('initializeAds function not found');
      alert('Error: initializeAds function not found');
    }
  });
});
