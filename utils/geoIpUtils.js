/**
 * Utility functions for IP geolocation
 */
const path = require('path');
const fs = require('fs');
const maxmind = require('maxmind');

// Path to the GeoLite2 database files
const CITY_DB_PATH = path.join(__dirname, '../data/GeoLite2-City.mmdb');
const ASN_DB_PATH = path.join(__dirname, '../data/GeoLite2-ASN.mmdb');

// Initialize database readers
let cityLookup = null;
let asnLookup = null;

/**
 * Initialize the MaxMind databases
 * This function should be called at application startup
 */
async function initGeoIpDatabases() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Check if database files exist
    const cityDbExists = fs.existsSync(CITY_DB_PATH);
    const asnDbExists = fs.existsSync(ASN_DB_PATH);

    if (!cityDbExists || !asnDbExists) {
      console.warn('GeoIP database files not found. IP geolocation will return default values.');
      console.warn(`Expected files at: ${CITY_DB_PATH} and ${ASN_DB_PATH}`);
      console.warn('Please download the GeoLite2 databases from MaxMind and place them in the data directory.');
      return false;
    }

    // Initialize the databases
    cityLookup = await maxmind.open(CITY_DB_PATH);
    asnLookup = await maxmind.open(ASN_DB_PATH);
    
    console.log('GeoIP databases initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing GeoIP databases:', error);
    return false;
  }
}

/**
 * Get location information for an IP address
 * @param {String} ipAddress - The IP address to look up
 * @returns {Object} Location information
 */
function getIpLocation(ipAddress) {
  // Default location data
  const defaultLocation = {
    country: 'Unknown',
    countryCode: '',
    region: '',
    city: '',
    postalCode: '',
    latitude: 0,
    longitude: 0,
    timezone: '',
    isp: 'Unknown'
  };

  try {
    // Skip lookup for private or local IPs
    if (!ipAddress || 
        ipAddress === '127.0.0.1' || 
        ipAddress === 'localhost' || 
        ipAddress === '::1' ||
        ipAddress.startsWith('192.168.') || 
        ipAddress.startsWith('10.') || 
        ipAddress.startsWith('172.16.')) {
      return {
        ...defaultLocation,
        country: 'Local Network',
        city: 'Local',
        isp: 'Local Network'
      };
    }

    // Check if databases are initialized
    if (!cityLookup || !asnLookup) {
      console.warn('GeoIP databases not initialized. Returning default values.');
      return defaultLocation;
    }

    // Look up city information
    const cityData = cityLookup.get(ipAddress);
    const asnData = asnLookup.get(ipAddress);

    if (!cityData) {
      return {
        ...defaultLocation,
        isp: asnData?.autonomous_system_organization || 'Unknown'
      };
    }

    // Extract location data
    return {
      country: cityData.country?.names?.en || 'Unknown',
      countryCode: cityData.country?.iso_code || '',
      region: cityData.subdivisions?.[0]?.names?.en || '',
      city: cityData.city?.names?.en || '',
      postalCode: cityData.postal?.code || '',
      latitude: cityData.location?.latitude || 0,
      longitude: cityData.location?.longitude || 0,
      timezone: cityData.location?.time_zone || '',
      isp: asnData?.autonomous_system_organization || 'Unknown'
    };
  } catch (error) {
    console.error('Error getting IP location:', error);
    return defaultLocation;
  }
}

module.exports = {
  initGeoIpDatabases,
  getIpLocation
};
