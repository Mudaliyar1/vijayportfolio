# Maintenance Login Attempts Fix

This document explains the fixes applied to the maintenance login attempts functionality, addressing the issue where login attempts weren't showing up in the maintenance page.

## The Issue

The maintenance page was not showing recent login attempts when users tried to log in during maintenance mode. Instead, it was showing old login attempts from previous maintenance periods.

## Root Cause

The issue was that the login attempts query in the `getMaintenanceManagement` and `getLoginAttempts` functions wasn't filtering by the current maintenance period. It was retrieving all login attempts ever recorded, regardless of when they occurred.

## Changes Made

1. **Updated the `getMaintenanceManagement` function**:
   - Added filtering to only show login attempts from the current maintenance period
   - Updated the total count to match the filtered results

2. **Updated the `getLoginAttempts` function**:
   - Added filtering by current maintenance period by default
   - Added support for date range filtering
   - Added an "all=true" parameter to show all login attempts if needed

3. **Updated the login-attempts.ejs template**:
   - Added date range filter inputs
   - Added an "Apply" button to apply the date filter
   - Updated the reset filters functionality
   - Added client-side date filtering for better user experience

4. **Updated the maintenance.ejs template**:
   - Added a "Current Period" link to view login attempts for the current maintenance period
   - Updated the "View All" link to include the all=true parameter

## How It Works Now

1. **On the Maintenance Management Page**:
   - When maintenance mode is active, only login attempts from the current period are shown
   - The count reflects only the login attempts from the current period

2. **On the Login Attempts Page**:
   - By default, it shows login attempts from the current maintenance period
   - Users can filter by date range using the date inputs
   - Users can view all login attempts by clicking the "View All" link
   - Client-side filtering allows for quick filtering without page reloads

## Testing

To test the fix:

1. **Enable Maintenance Mode**:
   - Go to Admin > Maintenance Management
   - Set Maintenance Mode to "Enabled"
   - Save the settings

2. **Try to Log In**:
   - Open a new browser or incognito window
   - Try to log in with any account
   - The login attempt should be recorded

3. **Check the Maintenance Page**:
   - Go back to Admin > Maintenance Management
   - The login attempt should appear in the "Login Attempts During Maintenance" section

4. **View All Login Attempts**:
   - Click "View All" to see all login attempts
   - Use the date filters to narrow down the results

## Troubleshooting

If login attempts still don't appear:

1. **Check the Server Logs**:
   - Look for "Filtering login attempts since:" messages
   - Verify that the timestamp filter is being applied correctly

2. **Check the Database**:
   - Verify that login attempts are being recorded in the MaintenanceLoginAttempt collection
   - Check that the timestamps are correct

3. **Clear Browser Cache**:
   - Clear your browser cache and reload the page
   - This ensures you're seeing the latest version of the templates
