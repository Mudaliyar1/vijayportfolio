# Flash Messages Configuration

This document explains how to configure and manage flash messages in the application.

## Overview

Flash messages are temporary messages displayed to users after certain actions (e.g., successful login, error messages). By default, these messages are not logged to the console in production environments to reduce console clutter.

## Configuration

### Environment Variables

The following environment variables control flash message behavior:

- `DEBUG_FLASH`: Set to `true` to enable logging flash messages to the console (default: `false`)

Example in `.env` file:
```
DEBUG_FLASH=false
```

## Clearing Flash Messages

### In the Browser

Users can clear flash messages by:
1. Clicking the "X" button on individual messages
2. Clicking the "Clear All Messages" link (if multiple messages are present)
3. Messages automatically disappear after 8 seconds

### From the Database

To clear all flash messages from the database (useful if you're seeing too many flash messages in the console):

1. Run the clear-flash-messages script:
   ```
   node scripts/clear-flash-messages.js
   ```

This script will:
- Connect to MongoDB
- Find all sessions
- Remove flash data from each session
- Remove any corrupted sessions

## Troubleshooting

If you're seeing too many flash messages in the console:

1. Make sure `DEBUG_FLASH` is set to `false` in your `.env` file
2. Restart the application
3. Run the clear-flash-messages script to clear existing flash messages

## Implementation Details

Flash messages are implemented using:
- `connect-flash` middleware for storing messages in the session
- Custom middleware in `server.js` for processing messages
- EJS templates in `views/partials/messages.ejs` for displaying messages
- JavaScript in `public/js/flash-messages.js` for client-side handling
