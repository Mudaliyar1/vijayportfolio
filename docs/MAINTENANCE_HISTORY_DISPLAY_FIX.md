# Maintenance History Display Fix

This document explains the fixes applied to the maintenance history and login attempts display functionality, addressing the issues where new maintenance records weren't showing up and only one login attempt was visible at a time.

## The Issues

1. **Maintenance History Records Not Showing**:
   - New maintenance history records weren't appearing in the Recent Maintenance History section
   - Only 3 records were being displayed, which might not include the most recent ones

2. **Login Attempts Limited Display**:
   - Only 5 login attempts were being displayed
   - The system was filtering login attempts to only show those from the current maintenance period
   - When a new login attempt was recorded, older ones would disappear from the view

## Root Causes

1. **For Maintenance History**:
   - The controller was limiting the display to only 3 records
   - The page wasn't automatically refreshing after new records were created

2. **For Login Attempts**:
   - The controller was limiting the display to only 5 records
   - The query was filtering login attempts to only show those from the current maintenance period
   - This meant that when maintenance mode was disabled and re-enabled, older login attempts would no longer be visible

## Changes Made

1. **Increased Maintenance History Display Limit**:
   - Changed the limit from 3 to 5 records in the getMaintenanceManagement function
   - This ensures more history records are visible on the main page

2. **Removed Login Attempts Period Filtering**:
   - Removed the default filtering that only showed login attempts from the current maintenance period
   - Now all recent login attempts are shown, regardless of which maintenance period they belong to
   - Increased the limit from 5 to 10 records to show more login attempts

3. **Updated UI to Always Show View All Link**:
   - Modified the template to always show the "View All" link for login attempts
   - This makes it clearer to users that they can see all login attempts, not just the ones displayed

## How It Works Now

1. **Maintenance History Display**:
   - The 5 most recent maintenance history records are displayed on the main page
   - All maintenance history records can be viewed on the dedicated history page

2. **Login Attempts Display**:
   - The 10 most recent login attempts are displayed on the main page, regardless of which maintenance period they belong to
   - All login attempts can be viewed on the dedicated login attempts page
   - The "View All" link is always visible, making it clear that more records are available

## Testing

To test the fix:

1. **For Maintenance History**:
   - Enable and disable maintenance mode multiple times
   - Verify that the most recent maintenance history records appear in the Recent Maintenance History section
   - Verify that you can see up to 5 records

2. **For Login Attempts**:
   - Enable maintenance mode
   - Attempt to log in with non-admin accounts multiple times
   - Verify that all login attempts appear in the Login Attempts During Maintenance section
   - Verify that you can see up to 10 records
   - Verify that older login attempts remain visible even after new ones are recorded

## Troubleshooting

If display issues persist:

1. **Check the Server Logs**:
   - Look for any error messages related to querying the database
   - Verify that the correct number of records are being retrieved

2. **Clear Browser Cache**:
   - Clear your browser cache and reload the page
   - This ensures you're seeing the latest data

3. **Check the Database**:
   - Verify that the records exist in the database
   - Check that the timestamps are correct
