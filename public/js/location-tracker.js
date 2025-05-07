/**
 * Location Tracker
 * This script collects precise location data from the user's device
 * and sends it to the server for tracking purposes.
 */

(function() {
  // Only run this script if the user is logged in
  if (!document.body.classList.contains('user-logged-in')) {
    return;
  }
  
  // Configuration
  const config = {
    trackingEnabled: true,           // Whether tracking is enabled
    trackingInterval: 5 * 60 * 1000, // How often to track location (5 minutes)
    highAccuracy: true,              // Whether to use high accuracy mode
    sendToServer: true,              // Whether to send data to server
    retryTimeout: 10000,             // How long to wait before retrying if geolocation fails
    maxRetries: 3                    // Maximum number of retries
  };
  
  // State
  let state = {
    watchId: null,
    lastPosition: null,
    retries: 0,
    tracking: false
  };
  
  // Start tracking
  function startTracking() {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser');
      return;
    }
    
    if (state.tracking) {
      return;
    }
    
    state.tracking = true;
    
    // Options for geolocation
    const options = {
      enableHighAccuracy: config.highAccuracy,
      timeout: 10000,
      maximumAge: 0
    };
    
    // Get current position
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    );
    
    // Set up interval for periodic tracking
    setInterval(() => {
      if (config.trackingEnabled && state.tracking) {
        navigator.geolocation.getCurrentPosition(
          handlePositionSuccess,
          handlePositionError,
          options
        );
      }
    }, config.trackingInterval);
  }
  
  // Handle successful position acquisition
  function handlePositionSuccess(position) {
    // Reset retry counter
    state.retries = 0;
    
    // Extract position data
    const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
    const timestamp = position.timestamp;
    
    // Create location data object
    const locationData = {
      latitude,
      longitude,
      accuracy,
      altitude: altitude || null,
      altitudeAccuracy: altitudeAccuracy || null,
      heading: heading || null,
      speed: speed || null,
      timestamp,
      source: 'GPS'
    };
    
    // Save last position
    state.lastPosition = locationData;
    
    // Send to server
    if (config.sendToServer) {
      sendLocationToServer(locationData);
    }
  }
  
  // Handle position error
  function handlePositionError(error) {
    console.log('Error getting location:', error.message);
    
    // Retry if we haven't exceeded max retries
    if (state.retries < config.maxRetries) {
      state.retries++;
      
      setTimeout(() => {
        if (config.trackingEnabled && state.tracking) {
          navigator.geolocation.getCurrentPosition(
            handlePositionSuccess,
            handlePositionError,
            {
              enableHighAccuracy: config.highAccuracy,
              timeout: 10000,
              maximumAge: 0
            }
          );
        }
      }, config.retryTimeout);
    }
  }
  
  // Send location data to server
  function sendLocationToServer(locationData) {
    fetch('/api/precise-location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        location: locationData,
        timestamp: new Date().toISOString()
      }),
      credentials: 'same-origin' // Include cookies
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Location data sent successfully');
      } else {
        console.error('Error sending location data:', data.message);
      }
    })
    .catch(error => {
      console.error('Error sending location data:', error);
    });
  }
  
  // Stop tracking
  function stopTracking() {
    if (state.watchId !== null) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
    }
    
    state.tracking = false;
  }
  
  // Initialize tracking when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    // Check if user has opted in to location tracking
    const hasOptedIn = localStorage.getItem('locationTrackingOptIn') === 'true';
    
    if (hasOptedIn) {
      // Start tracking immediately if user has opted in
      startTracking();
    } else {
      // Otherwise, show opt-in prompt
      showOptInPrompt();
    }
  });
  
  // Show opt-in prompt
  function showOptInPrompt() {
    // Create prompt element
    const promptEl = document.createElement('div');
    promptEl.className = 'location-tracking-prompt';
    promptEl.innerHTML = `
      <div class="location-tracking-prompt-content">
        <h3>Enable Precise Location?</h3>
        <p>This site would like to use your precise location to provide better services. Your location data will be securely stored and only used to enhance your experience.</p>
        <div class="location-tracking-prompt-buttons">
          <button class="location-tracking-prompt-deny">No Thanks</button>
          <button class="location-tracking-prompt-allow">Allow</button>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .location-tracking-prompt {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 15px;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .location-tracking-prompt-content h3 {
        margin: 0 0 10px;
        color: #fff;
        font-size: 16px;
      }
      
      .location-tracking-prompt-content p {
        margin: 0 0 15px;
        color: #ccc;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .location-tracking-prompt-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      
      .location-tracking-prompt-deny {
        background: transparent;
        border: 1px solid #666;
        color: #ccc;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .location-tracking-prompt-allow {
        background: #4285F4;
        border: none;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
    `;
    
    // Add to document
    document.head.appendChild(style);
    document.body.appendChild(promptEl);
    
    // Add event listeners
    promptEl.querySelector('.location-tracking-prompt-allow').addEventListener('click', () => {
      // Save opt-in preference
      localStorage.setItem('locationTrackingOptIn', 'true');
      
      // Start tracking
      startTracking();
      
      // Remove prompt
      promptEl.remove();
    });
    
    promptEl.querySelector('.location-tracking-prompt-deny').addEventListener('click', () => {
      // Save opt-out preference
      localStorage.setItem('locationTrackingOptIn', 'false');
      
      // Remove prompt
      promptEl.remove();
    });
  }
  
  // Export functions for external use
  window.locationTracker = {
    start: startTracking,
    stop: stopTracking,
    getLastPosition: () => state.lastPosition,
    isTracking: () => state.tracking
  };
})();
