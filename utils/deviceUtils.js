/**
 * Utility functions for device and browser detection
 */

/**
 * Parse user agent string to get device information
 * @param {String} userAgentString - The user agent string from the request
 * @returns {Object} Device information including browser, OS, and device type
 */
function parseUserAgent(userAgentString) {
  if (!userAgentString) {
    return {
      browser: 'Unknown',
      browserVersion: '',
      operatingSystem: 'Unknown',
      osVersion: '',
      deviceType: 'Unknown',
      deviceBrand: '',
      deviceModel: ''
    };
  }

  // Initialize with default values
  let result = {
    browser: 'Unknown',
    browserVersion: '',
    operatingSystem: 'Unknown',
    osVersion: '',
    deviceType: 'Desktop', // Default to Desktop
    deviceBrand: '',
    deviceModel: ''
  };

  // Browser detection
  if (userAgentString.includes('Chrome') && !userAgentString.includes('Edg') && !userAgentString.includes('OPR') && !userAgentString.includes('Safari/')) {
    result.browser = 'Chrome';
    const match = userAgentString.match(/Chrome\/([\d.]+)/);
    if (match) result.browserVersion = match[1];
  } else if (userAgentString.includes('Firefox') && !userAgentString.includes('Seamonkey')) {
    result.browser = 'Firefox';
    const match = userAgentString.match(/Firefox\/([\d.]+)/);
    if (match) result.browserVersion = match[1];
  } else if (userAgentString.includes('Safari') && !userAgentString.includes('Chrome') && !userAgentString.includes('Chromium')) {
    result.browser = 'Safari';
    const match = userAgentString.match(/Version\/([\d.]+)/);
    if (match) result.browserVersion = match[1];
  } else if (userAgentString.includes('Edg')) {
    result.browser = 'Edge';
    const match = userAgentString.match(/Edg\/([\d.]+)/);
    if (match) result.browserVersion = match[1];
  } else if (userAgentString.includes('OPR') || userAgentString.includes('Opera')) {
    result.browser = 'Opera';
    const match = userAgentString.match(/OPR\/([\d.]+)/) || userAgentString.match(/Opera\/([\d.]+)/);
    if (match) result.browserVersion = match[1];
  } else if (userAgentString.includes('MSIE') || userAgentString.includes('Trident/')) {
    result.browser = 'Internet Explorer';
    const match = userAgentString.match(/MSIE ([\d.]+)/) || userAgentString.match(/rv:([\d.]+)/);
    if (match) result.browserVersion = match[1];
  }

  // OS detection
  if (userAgentString.includes('Windows')) {
    result.operatingSystem = 'Windows';
    if (userAgentString.includes('Windows NT 10.0')) result.osVersion = '10';
    else if (userAgentString.includes('Windows NT 6.3')) result.osVersion = '8.1';
    else if (userAgentString.includes('Windows NT 6.2')) result.osVersion = '8';
    else if (userAgentString.includes('Windows NT 6.1')) result.osVersion = '7';
    else if (userAgentString.includes('Windows NT 6.0')) result.osVersion = 'Vista';
    else if (userAgentString.includes('Windows NT 5.1')) result.osVersion = 'XP';
    else if (userAgentString.includes('Windows NT 5.0')) result.osVersion = '2000';
  } else if (userAgentString.includes('Macintosh') || userAgentString.includes('Mac OS X')) {
    result.operatingSystem = 'macOS';
    const match = userAgentString.match(/Mac OS X ([\d_]+)/) || userAgentString.match(/Mac OS X ([\d.]+)/);
    if (match) {
      result.osVersion = match[1].replace(/_/g, '.');
    }
  } else if (userAgentString.includes('Linux')) {
    result.operatingSystem = 'Linux';
    if (userAgentString.includes('Ubuntu')) result.osVersion = 'Ubuntu';
    else if (userAgentString.includes('Fedora')) result.osVersion = 'Fedora';
    else if (userAgentString.includes('Debian')) result.osVersion = 'Debian';
  } else if (userAgentString.includes('Android')) {
    result.operatingSystem = 'Android';
    const match = userAgentString.match(/Android ([\d.]+)/);
    if (match) result.osVersion = match[1];
    result.deviceType = 'Mobile';
    
    // Try to extract device brand and model for Android
    const brandModelMatch = userAgentString.match(/Android.*?; ([^;)]+)/);
    if (brandModelMatch) {
      const brandModel = brandModelMatch[1].trim();
      // Extract brand (usually the first word)
      const brandMatch = brandModel.match(/^([a-zA-Z0-9]+)/);
      if (brandMatch) result.deviceBrand = brandMatch[0];
      
      // The rest is likely the model
      result.deviceModel = brandModel.replace(result.deviceBrand, '').trim();
    }
  } else if (userAgentString.includes('iPhone')) {
    result.operatingSystem = 'iOS';
    result.deviceType = 'Mobile';
    result.deviceBrand = 'Apple';
    result.deviceModel = 'iPhone';
    const match = userAgentString.match(/OS ([\d_]+)/);
    if (match) result.osVersion = match[1].replace(/_/g, '.');
  } else if (userAgentString.includes('iPad')) {
    result.operatingSystem = 'iOS';
    result.deviceType = 'Tablet';
    result.deviceBrand = 'Apple';
    result.deviceModel = 'iPad';
    const match = userAgentString.match(/OS ([\d_]+)/);
    if (match) result.osVersion = match[1].replace(/_/g, '.');
  }

  // Device type detection (if not already set)
  if (result.deviceType === 'Desktop') {
    if (userAgentString.includes('Mobile') || userAgentString.includes('Android') || userAgentString.includes('iPhone')) {
      result.deviceType = 'Mobile';
    } else if (userAgentString.includes('Tablet') || userAgentString.includes('iPad')) {
      result.deviceType = 'Tablet';
    }
  }

  return result;
}

module.exports = {
  parseUserAgent
};
