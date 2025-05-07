# Maintenance Mode Fix

This document explains the fixes applied to the maintenance mode functionality, specifically addressing the issue with maintenance history records.

## The Issue

The application was encountering the following error when trying to create maintenance history records:

```
Error creating maintenance history record: Error: MaintenanceHistory validation failed: adminId: Path `adminId` is required., durationValue: Path `durationValue` is required., durationUnit: Path `durationUnit` is required., endTime: Path `endTime` is required., startTime: Path `startTime` is required., message: Path `message` is required., reason: Path `reason` is required.
```

This error occurred because the code was attempting to create maintenance history records without providing all the required fields defined in the MaintenanceHistory model.

## Changes Made

1. **Updated the `isMaintenanceMode` function in maintenanceController.js**:
   - Modified the code to properly handle the creation of maintenance history records when maintenance mode is automatically disabled
   - Added logic to either update an existing history record or create a new one with all required fields

2. **Updated the sample history record creation in the `getMaintenanceManagement` function**:
   - Ensured that a valid admin ID is always provided
   - Added fallback values for all required fields

3. **Added mongoose import and fixed ObjectId creation**:
   - Added the mongoose import at the top of the maintenanceController.js file
   - Fixed ObjectId creation by using `new mongoose.Types.ObjectId()` instead of `mongoose.Types.ObjectId()`

4. **Created a fix script**:
   - Added a script (scripts/fix-maintenance-history.js) to fix any existing invalid maintenance history records
   - The script adds missing required fields to existing records or removes records that cannot be fixed

## How to Apply the Fix

1. **Restart Your Application**:
   - The code changes will take effect after you restart your application

2. **Run the Fix Script** (if needed):
   - If you have existing invalid maintenance history records, run the fix script:
   ```
   node scripts/fix-maintenance-history.js
   ```

## Maintenance History Model Requirements

The MaintenanceHistory model requires the following fields:

- `reason` (String): The reason for the maintenance
- `message` (String): The message displayed to users during maintenance
- `startTime` (Date): When the maintenance started
- `endTime` (Date): When the maintenance is scheduled to end
- `durationUnit` (String): The unit of time for the duration (seconds, minutes, hours, days, months)
- `durationValue` (Number): The value of the duration
- `adminId` (ObjectId): The ID of the admin who initiated the maintenance

Optional fields:
- `actualEndTime` (Date): When the maintenance actually ended
- `status` (String): The status of the maintenance (completed, cancelled, extended)
- `loginAttempts` (Number): The number of login attempts during maintenance
- `notes` (String): Additional notes about the maintenance
- `createdAt` (Date): When the record was created

## Troubleshooting

If you continue to see errors related to maintenance history records:

1. **Check the Server Logs**:
   - Look for any errors related to MaintenanceHistory validation

2. **Run the Fix Script**:
   - Run the fix-maintenance-history.js script to repair any invalid records

3. **Check Database Directly**:
   - Use MongoDB Compass or another tool to inspect the maintenancehistories collection
   - Verify that all records have the required fields

4. **Clear Invalid Records**:
   - If necessary, you can clear all maintenance history records and start fresh:
   ```
   db.maintenancehistories.deleteMany({})
   ```
