# GeoIP Database Directory

This directory is used to store the MaxMind GeoIP databases for IP geolocation.

## Database Options

You can use either the free or commercial databases:

### Option 1: Free GeoLite2 Databases (Lower Accuracy)

Place the following files in this directory:

1. `GeoLite2-City.mmdb` - For city-level geolocation (accuracy ~25-50km)
2. `GeoLite2-ASN.mmdb` - For ISP/organization information

#### How to Get the Free Databases

1. Create a free account at [MaxMind](https://www.maxmind.com/en/geolite2/signup)
2. Download the GeoLite2 City and GeoLite2 ASN databases in MMDB format
3. Place the database files in this directory

### Option 2: Commercial GeoIP2 Databases (Higher Accuracy)

For more precise geolocation (accuracy ~5-10km or better in many areas), use:

1. `GeoIP2-City.mmdb` - For high-accuracy city-level geolocation
2. `GeoIP2-ISP.mmdb` - For detailed ISP/organization information

#### How to Get the Commercial Databases

1. Purchase a subscription to [MaxMind GeoIP2](https://www.maxmind.com/en/geoip2-databases)
2. Download the GeoIP2 City and GeoIP2 ISP databases in MMDB format
3. Place the database files in this directory

The system will automatically detect which database you're using and provide the appropriate level of detail.

## Note

Without these database files, the IP & Location Tracker feature will still work, but it will show "Unknown" for location data.

The system will automatically detect and use the databases when they are placed in this directory. You don't need to restart the server after adding the files.
