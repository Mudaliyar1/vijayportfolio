# GeoLite2 Database Directory

This directory is used to store the MaxMind GeoLite2 databases for IP geolocation.

## Required Files

Place the following files in this directory:

1. `GeoLite2-City.mmdb` - For city-level geolocation
2. `GeoLite2-ASN.mmdb` - For ISP/organization information

## How to Get the Databases

1. Create a free account at [MaxMind](https://www.maxmind.com/en/geolite2/signup)
2. Download the GeoLite2 City and GeoLite2 ASN databases in MMDB format
3. Place the database files in this directory

## Note

Without these database files, the IP & Location Tracker feature will still work, but it will show "Unknown" for location data.

The system will automatically detect and use the databases when they are placed in this directory. You don't need to restart the server after adding the files.
