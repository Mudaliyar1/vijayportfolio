# IP Address Detection Fix

This document explains the fixes applied to the IP address detection functionality, addressing the issue where the IP address was showing as "::1" instead of the real IP address in the Login Attempts During Maintenance section.

## The Issue

When users tried to log in during maintenance mode, their IP address was being recorded as "::1" (the IPv6 loopback address) instead of their actual IP address. This made it difficult to identify which users were attempting to access the site during maintenance.

## Root Cause

The application was using `req.connection.remoteAddress` to get the IP address, which returns "::1" when running locally or when behind a proxy server. This method doesn't account for proxy servers, load balancers, or other network infrastructure that might be in front of the application.

## Changes Made

1. **Created a Utility Function**:
   - Added a new utility file `utils/ipUtils.js` with a `getRealIpAddress` function
   - This function checks various headers that might contain the real IP address
   - It handles IPv6 addresses, including the loopback address and IPv4-mapped IPv6 addresses

2. **Updated IP Address Detection in Controllers**:
   - Modified the userController.js to use the new utility function
   - Updated all instances in maintenanceController.js to use the new utility function
   - This ensures consistent IP address detection across the application

## How It Works Now

1. **When a User Tries to Log In During Maintenance**:
   - The application checks various headers to find the real IP address
   - It looks for headers like `x-forwarded-for`, `x-real-ip`, etc., which are commonly set by proxies
   - If the IP is in IPv6 format, it's converted to a more readable format
   - The real IP address is recorded in the database

2. **When Viewing Login Attempts**:
   - The real IP address is displayed in the Login Attempts During Maintenance section
   - This makes it easier to identify which users are attempting to access the site during maintenance

## Technical Details

The `getRealIpAddress` function checks the following headers in order:

1. `x-forwarded-for` - Set by most proxy servers
2. `x-real-ip` - Set by Nginx and some other proxies
3. `cf-connecting-ip` - Set by Cloudflare
4. `true-client-ip` - Set by Akamai and Cloudflare
5. `x-client-ip` - Set by some load balancers
6. `forwarded` - Standard header for identifying the originating IP
7. `req.connection.remoteAddress` - Default method
8. `req.socket.remoteAddress` - Alternative method

It also handles special cases:

- If `x-forwarded-for` contains multiple IPs, it gets the first one (client IP)
- If the IP is "::1" or "::ffff:127.0.0.1", it's converted to "127.0.0.1"
- If the IP starts with "::ffff:", it removes this prefix to get the IPv4 address

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
   - The IP address should be the real IP address, not "::1"

## Troubleshooting

If the IP address is still not showing correctly:

1. **Check the Server Logs**:
   - Look for any error messages related to the IP address detection
   - Verify that the headers are being properly parsed

2. **Check Your Network Configuration**:
   - If you're using a proxy server, make sure it's setting the appropriate headers
   - If you're using a load balancer, make sure it's configured to pass the client IP

3. **Try Different Headers**:
   - If your specific setup uses different headers, you may need to update the `getRealIpAddress` function
   - Add the appropriate headers to the list in the function
