# Device and Browser Detection Fix

This document explains the fixes applied to the device and browser detection functionality, addressing the issue where the device and browser information was showing as "Unknown" in the Login Attempts During Maintenance section.

## The Issue

When users tried to log in during maintenance mode, their device and browser information was being recorded as "Unknown" instead of showing the actual device type and browser name. This made it difficult to identify which devices and browsers were being used to access the site during maintenance.

## Root Cause

The application was using a simplified approach to device and browser detection, setting these values to "Unknown" instead of properly parsing the user agent string to extract the actual device and browser information.

## Changes Made

1. **Created a Device Utility Function**:
   - Added a new utility file `utils/deviceUtils.js` with a `parseUserAgent` function
   - This function parses the user agent string to extract detailed information about the device, browser, and operating system
   - It handles various browsers, operating systems, and device types

2. **Updated Device Detection in Controllers**:
   - Modified the userController.js to use the new utility function
   - Updated all instances in maintenanceController.js to use the new utility function
   - This ensures consistent device and browser detection across the application

## How It Works Now

1. **When a User Tries to Log In During Maintenance**:
   - The application parses the user agent string to extract detailed device information
   - It identifies the browser name and version
   - It identifies the operating system name and version
   - It identifies the device type (Desktop, Mobile, Tablet)
   - It attempts to identify the device brand and model when possible
   - All this information is recorded in the database

2. **When Viewing Login Attempts**:
   - The detailed device and browser information is displayed in the Login Attempts During Maintenance section
   - This makes it easier to identify which devices and browsers are being used to access the site during maintenance

## Technical Details

The `parseUserAgent` function detects the following:

1. **Browsers**:
   - Chrome
   - Firefox
   - Safari
   - Edge
   - Opera
   - Internet Explorer

2. **Operating Systems**:
   - Windows (with version detection)
   - macOS (with version detection)
   - Linux (with distribution detection)
   - Android (with version detection)
   - iOS (with version detection)

3. **Device Types**:
   - Desktop
   - Mobile
   - Tablet

4. **Device Brands and Models**:
   - For Android devices, attempts to extract brand and model
   - For Apple devices, identifies iPhone and iPad

## Testing

To test the fix:

1. **Enable Maintenance Mode**:
   - Go to Admin > Maintenance Management
   - Set Maintenance Mode to "Enabled"
   - Save the settings

2. **Try to Log In**:
   - Open a new browser or incognito window
   - Try to log in with a non-admin account
   - You should be redirected to the maintenance page with a message

3. **Check the Login Attempts**:
   - Log in with an admin account
   - Go to Admin > Maintenance Management
   - The login attempt should appear in the "Login Attempts During Maintenance" section
   - The device and browser information should be correctly displayed

## Troubleshooting

If the device and browser information is still not showing correctly:

1. **Check the Server Logs**:
   - Look for any error messages related to the device detection
   - Verify that the user agent string is being properly parsed

2. **Test with Different Browsers**:
   - Try logging in with different browsers to see if the detection works for all of them
   - If a specific browser is not being detected correctly, you may need to update the `parseUserAgent` function

3. **Test with Different Devices**:
   - Try logging in with different devices (desktop, mobile, tablet) to see if the detection works for all of them
   - If a specific device is not being detected correctly, you may need to update the `parseUserAgent` function
