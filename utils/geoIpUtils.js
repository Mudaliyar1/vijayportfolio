/**
 * Utility functions for IP geolocation
 */
const path = require('path');
const fs = require('fs');
const maxmind = require('maxmind');

// Path to the GeoIP database files
// Support both free and commercial databases
const CITY_DB_PATHS = [
  path.join(__dirname, '../data/GeoIP2-City.mmdb'),      // Commercial database (higher accuracy)
  path.join(__dirname, '../data/GeoLite2-City.mmdb')     // Free database (lower accuracy)
];
const ASN_DB_PATHS = [
  path.join(__dirname, '../data/GeoIP2-ISP.mmdb'),       // Commercial database (higher accuracy)
  path.join(__dirname, '../data/GeoLite2-ASN.mmdb')      // Free database (lower accuracy)
];

// Track which database we're using
let usingCommercialDb = false;

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

    // Try to initialize city database (try commercial first, then free)
    let cityDbPath = null;
    for (const dbPath of CITY_DB_PATHS) {
      if (fs.existsSync(dbPath)) {
        cityDbPath = dbPath;
        break;
      }
    }

    // Try to initialize ASN database (try commercial first, then free)
    let asnDbPath = null;
    for (const dbPath of ASN_DB_PATHS) {
      if (fs.existsSync(dbPath)) {
        asnDbPath = dbPath;
        break;
      }
    }

    // Check if we found any databases
    if (!cityDbPath || !asnDbPath) {
      console.warn('GeoIP database files not found. IP geolocation will return default values.');
      console.warn(`Expected files in the data directory:`);
      console.warn(`  Commercial: GeoIP2-City.mmdb and GeoIP2-ISP.mmdb (higher accuracy)`);
      console.warn(`  Free: GeoLite2-City.mmdb and GeoLite2-ASN.mmdb (lower accuracy)`);
      console.warn('Please download the databases from MaxMind and place them in the data directory.');
      return false;
    }

    // Initialize the databases
    cityLookup = await maxmind.open(cityDbPath);
    asnLookup = await maxmind.open(asnDbPath);

    // Check if we're using commercial databases
    usingCommercialDb = cityDbPath.includes('GeoIP2');

    console.log(`GeoIP databases initialized successfully using ${usingCommercialDb ? 'commercial' : 'free'} database`);
    console.log(`City database: ${path.basename(cityDbPath)}`);
    console.log(`ASN database: ${path.basename(asnDbPath)}`);

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
    regionCode: '',
    city: '',
    postalCode: '',
    latitude: 0,
    longitude: 0,
    accuracyRadius: 1000, // Default accuracy radius in km
    timezone: '',
    isp: 'Unknown',
    organization: '',
    asn: '',
    userType: '',
    connectionType: '',
    databaseType: 'None'
  };

  try {
    // Skip lookup for private or local IPs
    if (!ipAddress ||
        ipAddress === '127.0.0.1' ||
        ipAddress === 'localhost' ||
        ipAddress === '::1' ||
        ipAddress.startsWith('192.168.') ||
        ipAddress.startsWith('10.') ||
        ipAddress.startsWith('172.16.') ||
        ipAddress.startsWith('169.254.')) {
      return {
        ...defaultLocation,
        country: 'Local Network',
        city: 'Local',
        isp: 'Local Network',
        organization: 'Local Network',
        connectionType: 'Local',
        databaseType: 'None'
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
        isp: asnData?.autonomous_system_organization || asnData?.isp || 'Unknown',
        organization: asnData?.organization || '',
        asn: asnData?.autonomous_system_number ? `AS${asnData.autonomous_system_number}` : '',
        databaseType: usingCommercialDb ? 'Commercial' : 'Free'
      };
    }

    // Extract location data - handle both commercial and free database formats
    const result = {
      country: cityData.country?.names?.en || 'Unknown',
      countryCode: cityData.country?.iso_code || '',
      region: cityData.subdivisions?.[0]?.names?.en || '',
      regionCode: cityData.subdivisions?.[0]?.iso_code || '',
      city: cityData.city?.names?.en || '',
      postalCode: cityData.postal?.code || '',
      latitude: cityData.location?.latitude || 0,
      longitude: cityData.location?.longitude || 0,
      accuracyRadius: cityData.location?.accuracy_radius || 1000,
      timezone: cityData.location?.time_zone || '',
      databaseType: usingCommercialDb ? 'Commercial' : 'Free'
    };

    // Add ISP information - handle both commercial and free database formats
    if (usingCommercialDb) {
      // Commercial database has more detailed ISP information
      result.isp = asnData?.isp || 'Unknown';
      result.organization = asnData?.organization || '';
      result.asn = asnData?.autonomous_system_number ? `AS${asnData.autonomous_system_number}` : '';
      result.userType = asnData?.user_type || '';
      result.connectionType = asnData?.connection_type || '';
    } else {
      // Free database has less detailed ISP information
      result.isp = asnData?.autonomous_system_organization || 'Unknown';
      result.asn = asnData?.autonomous_system_number ? `AS${asnData.autonomous_system_number}` : '';
    }

    return result;
  } catch (error) {
    console.error('Error getting IP location:', error);
    return defaultLocation;
  }
}

module.exports = {
  initGeoIpDatabases,
  getIpLocation
};
