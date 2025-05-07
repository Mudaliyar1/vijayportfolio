# IP & Location Tracker

This document explains the IP & Location Tracker feature, which allows administrators to track user login locations and IP addresses.

## Overview

The IP & Location Tracker feature provides administrators with detailed information about user login attempts, including:

- IP address
- Geographic location (country, region, city)
- ISP information
- Device and browser details
- Login status (success, failed, blocked)
- Login time

This feature uses the MaxMind GeoIP databases to provide geolocation data without requiring an external API. It supports both the free GeoLite2 database and the commercial GeoIP2 database for higher accuracy.

## How It Works

1. **Login Tracking**: When a user attempts to log in (successfully or unsuccessfully), the system records their IP address, user agent, and other details.

2. **Geolocation**: The system uses the MaxMind GeoLite2 database to determine the geographic location of the IP address, including country, region, city, and coordinates.

3. **Device Detection**: The system parses the user agent string to determine the user's browser, operating system, and device type.

4. **Data Storage**: All this information is stored in the database for later analysis.

5. **Admin Interface**: Administrators can view, search, filter, and export this data through the admin dashboard.

## Setup Instructions

### 1. Install Required Packages

The feature requires the following packages:

```bash
npm install maxmind @maxmind/geoip2-node
```

### 2. Download GeoIP Databases

You have two options for the GeoIP databases:

#### Option A: Free GeoLite2 Databases (Lower Accuracy)

1. Create a free account at [MaxMind](https://www.maxmind.com/en/geolite2/signup)
2. Download the GeoLite2 City and GeoLite2 ASN databases in MMDB format
3. Place the database files in the `data` directory of your project:
   - `data/GeoLite2-City.mmdb`
   - `data/GeoLite2-ASN.mmdb`

#### Option B: Commercial GeoIP2 Databases (Higher Accuracy)

For more accurate geolocation (down to a few kilometers or less in many areas):

1. Purchase a subscription to [MaxMind GeoIP2](https://www.maxmind.com/en/geoip2-databases)
2. Download the GeoIP2 City and GeoIP2 ISP databases in MMDB format
3. Place the database files in the `data` directory of your project:
   - `data/GeoIP2-City.mmdb`
   - `data/GeoIP2-ISP.mmdb`

The system will automatically detect which database you're using and provide the appropriate level of detail.

### 3. Restart the Server

After placing the database files, restart the server to initialize the GeoIP databases.

## Usage

### Accessing the Feature

1. Log in as an administrator
2. Navigate to Admin > IP & Location Tracker

### Available Functions

- **View Login Records**: See a table of all login attempts with location data
- **Search & Filter**: Filter by username, IP address, country, login status, or date range
- **Export Data**: Export the filtered data as CSV or PDF
- **Map View**: Click on the map link to view the location on Google Maps

## Technical Details

### Models

- **UserLogin**: Stores login attempts with location data

### Utilities

- **geoIpUtils.js**: Provides functions for IP geolocation using MaxMind databases
- **ipUtils.js**: Provides functions for extracting the real IP address from requests
- **deviceUtils.js**: Provides functions for parsing user agent strings

### Controllers

- **ipTrackerController.js**: Handles requests for the IP tracker feature

### Routes

- **/admin/ip-tracker**: Main route for the IP tracker dashboard
- **/admin/ip-tracker/export/csv**: Route for exporting data as CSV
- **/admin/ip-tracker/export/pdf**: Route for exporting data as PDF

## Troubleshooting

### GeoIP Database Issues

If you see the message "GeoIP databases not found or failed to initialize" in the server logs:

1. Make sure you've downloaded the GeoLite2 databases from MaxMind
2. Ensure the database files are placed in the `data` directory
3. Check that the file names match: `GeoLite2-City.mmdb` and `GeoLite2-ASN.mmdb`
4. Restart the server after placing the database files

### No Location Data

If login records show "Unknown" for location data:

1. Check if the GeoIP databases are properly initialized
2. Verify that the IP address is valid and not a local/private IP
3. Update the GeoLite2 databases if they're outdated

## Updating the Databases

MaxMind updates their GeoLite2 databases regularly. To ensure accurate geolocation:

1. Download the latest versions from MaxMind
2. Replace the existing files in the `data` directory
3. Restart the server

## Privacy Considerations

This feature collects and stores IP addresses and location data, which may be considered personal information in some jurisdictions. Ensure your privacy policy covers this data collection and that you comply with relevant data protection regulations (e.g., GDPR, CCPA).
