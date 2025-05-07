/**
 * Precise Location Tracking
 * Uses the browser's Geolocation API to get highly accurate location data
 */

class PreciseLocationTracker {
  constructor() {
    this.locationData = null;
    this.watchId = null;
    this.isTracking = false;
    this.callbacks = {
      onLocationUpdate: null,
      onError: null
    };
    
    // Geolocation options for high accuracy
    this.geoOptions = {
      enableHighAccuracy: true, // Use GPS if available
      timeout: 10000,           // 10 second timeout
      maximumAge: 0             // Always get fresh location
    };
  }

  /**
   * Start tracking location with high precision
   * @param {Function} onLocationUpdate - Callback when location is updated
   * @param {Function} onError - Callback when error occurs
   */
  startTracking(onLocationUpdate, onError) {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      if (onError) onError(new Error('Geolocation is not supported by this browser'));
      return false;
    }
    
    this.callbacks.onLocationUpdate = onLocationUpdate;
    this.callbacks.onError = onError;
    
    try {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        position => this.handlePositionUpdate(position),
        error => this.handleError(error),
        this.geoOptions
      );
      
      // Start watching position for real-time updates
      this.watchId = navigator.geolocation.watchPosition(
        position => this.handlePositionUpdate(position),
        error => this.handleError(error),
        this.geoOptions
      );
      
      this.isTracking = true;
      return true;
    } catch (error) {
      if (onError) onError(error);
      return false;
    }
  }
  
  /**
   * Stop tracking location
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
      return true;
    }
    return false;
  }
  
  /**
   * Handle position update from geolocation API
   * @param {Position} position - Geolocation position object
   */
  handlePositionUpdate(position) {
    // Extract relevant data
    const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
    const timestamp = position.timestamp;
    
    // Create location data object
    this.locationData = {
      latitude,
      longitude,
      accuracy,           // Accuracy in meters
      altitude,           // Altitude in meters (if available)
      altitudeAccuracy,   // Altitude accuracy in meters (if available)
      heading,            // Direction of travel in degrees (if available)
      speed,              // Speed in meters/second (if available)
      timestamp,          // Timestamp of the location fix
      source: 'GPS'       // Source of the location data
    };
    
    // Call the update callback
    if (this.callbacks.onLocationUpdate) {
      this.callbacks.onLocationUpdate(this.locationData);
    }
    
    // Send location data to server
    this.sendLocationToServer(this.locationData);
  }
  
  /**
   * Handle geolocation errors
   * @param {Error} error - Geolocation error
   */
  handleError(error) {
    let errorMessage = 'Unknown error occurred while getting location';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'User denied the request for geolocation';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'The request to get user location timed out';
        break;
    }
    
    if (this.callbacks.onError) {
      this.callbacks.onError(new Error(errorMessage));
    }
  }
  
  /**
   * Send location data to server
   * @param {Object} locationData - Location data to send
   */
  sendLocationToServer(locationData) {
    fetch('/api/precise-location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        location: locationData,
        timestamp: new Date().toISOString()
      })
    })
    .then(response => response.json())
    .catch(error => console.error('Error sending location data:', error));
  }
  
  /**
   * Get the current location data
   * @returns {Object|null} Current location data or null if not available
   */
  getCurrentLocation() {
    return this.locationData;
  }
  
  /**
   * Check if location tracking is active
   * @returns {Boolean} True if tracking is active
   */
  isActive() {
    return this.isTracking;
  }
}

// Create global instance
const preciseLocationTracker = new PreciseLocationTracker();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = preciseLocationTracker;
}
