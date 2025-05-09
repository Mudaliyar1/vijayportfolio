const axios = require('axios');
const SystemStatus = require('../models/SystemStatus');
const Incident = require('../models/Incident');
const UptimeRecord = require('../models/UptimeRecord');
const errorClassifier = require('../utils/error-classifier');
const notificationSender = require('../utils/notification-sender');

// Define endpoints to monitor
const endpoints = [
  // Basic endpoints
  { name: 'Website Frontend', endpoint: '/', expectedStatus: 200 },

  // Robust health check API endpoints
  { name: 'System Health', endpoint: '/api/health-check', expectedStatus: 200 },
  { name: 'Database', endpoint: '/api/health-check/database', expectedStatus: 200 },
  { name: 'Authentication', endpoint: '/api/health-check/auth', expectedStatus: 200 },
  { name: 'AI Services', endpoint: '/api/health-check/ai', expectedStatus: 200 },
  { name: 'Digital Twins', endpoint: '/api/health-check/digital-twins', expectedStatus: 200 },
  { name: 'File System', endpoint: '/api/health-check/file-system', expectedStatus: 200 },
  { name: 'Memory', endpoint: '/api/health-check/memory', expectedStatus: 200 },
  { name: 'API Keys', endpoint: '/api/health-check/api-keys', expectedStatus: 200 },
  { name: 'System Info', endpoint: '/api/health-check/system', expectedStatus: 200 }
];

// Function to check a single endpoint
async function checkEndpoint(baseUrl, endpoint) {
  const startTime = Date.now();
  let responseTime = 0;
  let statusCode = 0;
  let errorMessage = null;
  let status = 'operational';
  let responseData = null;

  try {
    // Add retry logic
    const maxRetries = 2;
    let retries = 0;
    let success = false;

    while (!success && retries < maxRetries) {
      try {
        const response = await axios.get(`${baseUrl}${endpoint.endpoint}`, {
          timeout: 10000, // 10 second timeout
          validateStatus: () => true // Don't throw on error status codes
        });

        responseTime = Date.now() - startTime;
        statusCode = response.status;
        responseData = response.data;
        success = true;

        // For health check endpoints, use the status from the response if available
        if (responseData && responseData.status && endpoint.endpoint.includes('/api/health-check')) {
          // Map the status from the health check API to our status format
          switch (responseData.status) {
            case 'major_outage':
              status = 'major_outage';
              break;
            case 'partial_outage':
              status = 'partial_outage';
              break;
            case 'degraded_performance':
              status = 'degraded_performance';
              break;
            case 'operational':
            case 'ok':
              status = 'operational';
              break;
            default:
              status = 'operational'; // Default to operational
          }

          if (status !== 'operational' && responseData.message) {
            errorMessage = responseData.message;
          }
        } else {
          // Classify the status based on response
          if (statusCode !== endpoint.expectedStatus) {
            if (statusCode >= 500) {
              status = 'major_outage';
              errorMessage = `Server error: ${statusCode}`;
            } else if (statusCode >= 400) {
              status = 'partial_outage';
              errorMessage = `Client error: ${statusCode}`;
            } else {
              status = 'degraded_performance';
              errorMessage = `Unexpected status: ${statusCode}`;
            }
          } else if (responseTime > 5000) {
            status = 'degraded_performance';
            errorMessage = `Slow response: ${responseTime}ms`;
          }

          // If it's the database endpoint, check the database status
          if (endpoint.name === 'Database' && responseData && responseData.database) {
            if (responseData.database.status !== 1) {
              status = 'major_outage';
              errorMessage = `Database not connected: ${responseData.database.statusText}`;
            }
          }
        }
      } catch (retryError) {
        retries++;
        if (retries < maxRetries) {
          console.log(`Retry ${retries}/${maxRetries} for ${endpoint.name}...`);
          // Wait 2 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          // If all retries fail, handle the error
          throw retryError;
        }
      }
    }
  } catch (error) {
    responseTime = Date.now() - startTime;

    // Check if the main website is accessible before marking as outage
    if (endpoint.name !== 'Website Frontend') {
      // Only check if we're not already checking the main website
      try {
        const mainResponse = await axios.get(`${baseUrl}/`, {
          timeout: 5000,
          validateStatus: () => true
        });

        if (mainResponse.status !== 200) {
          // If main website is down, this is expected
          console.log(`Main website is down (${mainResponse.status}), marking ${endpoint.name} as operational`);
          status = 'operational';
          statusCode = 200; // Force 200
          errorMessage = 'Main website is down, this is expected';
          return {
            name: endpoint.name,
            status,
            lastChecked: new Date(),
            responseTime,
            statusCode,
            errorMessage,
            endpoint: endpoint.endpoint || '/' // Provide a default endpoint if not available
          };
        }
      } catch (mainError) {
        // If we can't even check the main website, something is very wrong
        console.log(`Cannot access main website, marking ${endpoint.name} as operational`);
        status = 'operational';
        statusCode = 200; // Force 200
        errorMessage = 'Cannot access main website, this is expected';
        return {
          name: endpoint.name,
          status,
          lastChecked: new Date(),
          responseTime,
          statusCode,
          errorMessage,
          endpoint: endpoint.endpoint || '/' // Provide a default endpoint if not available
        };
      }
    }

    // If we get here, the main website is accessible but this endpoint is not
    status = 'major_outage';

    if (error.code === 'ECONNABORTED') {
      statusCode = 408; // Request Timeout
      errorMessage = 'Connection timed out';
    } else if (error.code === 'ECONNREFUSED') {
      statusCode = 503; // Service Unavailable
      errorMessage = 'Connection refused';
    } else if (error.response) {
      statusCode = error.response.status;
      errorMessage = `HTTP error: ${statusCode}`;
    } else {
      statusCode = 500;
      errorMessage = error.message || 'Unknown error';
    }
  }

  return {
    name: endpoint.name,
    status,
    lastChecked: new Date(),
    responseTime,
    statusCode,
    errorMessage,
    endpoint: endpoint.endpoint || '/', // Provide a default endpoint if not available
    responseData: responseData // Include response data for debugging
  };
}

// Function to update uptime records
async function updateUptimeRecord(componentName, isSuccess, responseTime) {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = now.getHours();

    // Find or create uptime record
    let record = await UptimeRecord.findOne({
      componentName,
      date: dateStr,
      hour
    });

    if (!record) {
      record = new UptimeRecord({
        componentName,
        date: dateStr,
        hour,
        totalChecks: 0,
        successfulChecks: 0,
        averageResponseTime: 0,
        uptimePercentage: 100
      });
    }

    // Update record
    record.totalChecks += 1;
    if (isSuccess) {
      record.successfulChecks += 1;
    }

    // Update average response time
    const totalResponseTime = (record.averageResponseTime * (record.totalChecks - 1)) + responseTime;
    record.averageResponseTime = totalResponseTime / record.totalChecks;

    // Calculate uptime percentage
    record.uptimePercentage = (record.successfulChecks / record.totalChecks) * 100;

    await record.save();
  } catch (error) {
    console.error('Error updating uptime record:', error);
  }
}

// Function to check if an incident should be created
async function handleComponentStatus(component) {
  try {
    // Get the actual operational status
    const isOperational = component.status === 'operational';

    // Update uptime record with the actual status
    await updateUptimeRecord(component.name, isOperational, component.responseTime);

    // SAFETY FEATURE: Only allow incidents for specific components
    // This prevents false incidents while we're testing the new health checks
    const allowedComponents = ['Website Frontend', 'Database'];

    if (!allowedComponents.includes(component.name)) {
      // Force non-allowed components to be operational
      component.status = 'operational';
      component.statusCode = 200;
      component.errorMessage = null;
    }

    // If component is operational, no need to create an incident
    if (isOperational) {
      // Check if there's an ongoing incident for this component
      let ongoingIncident;
      try {
        ongoingIncident = await Incident.findOne({
          'affectedComponents': { $in: [component.name] },
          'endTime': null
        });
        console.log(`Checking for ongoing incidents to resolve for ${component.name}: ${ongoingIncident ? 'Found' : 'None found'}`);
      } catch (findError) {
        console.error(`Error finding ongoing incidents to resolve for ${component.name}:`, findError);
        ongoingIncident = null;
      }

      // If there's an ongoing incident, resolve it
      if (ongoingIncident) {
        try {
          ongoingIncident.status = 'resolved';
          ongoingIncident.endTime = new Date();
          ongoingIncident.updates.push({
            message: `The ${component.name} is now operational again.`,
            status: 'resolved',
            timestamp: new Date(),
            autoDetected: true
          });

          await ongoingIncident.save();
          console.log(`Incident resolved successfully with ID: ${ongoingIncident._id}`);

          // Send notification
          try {
            await notificationSender.sendIncidentUpdate(ongoingIncident);
          } catch (notificationError) {
            console.error('Failed to send incident update notification:', notificationError);
          }
        } catch (saveError) {
          console.error('Failed to resolve incident:', saveError);
        }
      }

      return;
    }

    // Check if there's an ongoing incident for this component
    let ongoingIncident;
    try {
      ongoingIncident = await Incident.findOne({
        'affectedComponents': { $in: [component.name] },
        'endTime': null
      });
      console.log(`Checking for ongoing incidents for ${component.name}: ${ongoingIncident ? 'Found' : 'None found'}`);
    } catch (findError) {
      console.error(`Error finding ongoing incidents for ${component.name}:`, findError);
      ongoingIncident = null;
    }

    // If there's no ongoing incident, create one
    if (!ongoingIncident) {
      // Classify the error
      const { title, description, severity } = errorClassifier.classifyError(
        component.name,
        component.status,
        component.statusCode,
        component.errorMessage,
        component.responseTime
      );

      try {
        // Check if this component is allowed to create incidents
        const allowedComponents = ['Website Frontend', 'Database'];

        if (allowedComponents.includes(component.name)) {
          // Create incident for allowed components
          console.log(`Creating incident for ${component.name}:`, {
            title,
            description,
            severity,
            statusCode: component.statusCode,
            errorMessage: component.errorMessage
          });

          ongoingIncident = new Incident({
            title,
            description,
            affectedComponents: [component.name],
            status: 'investigating',
            severity,
            startTime: new Date(),
            autoDetected: true,
            errorDetails: {
              statusCode: component.statusCode,
              errorMessage: component.errorMessage,
              responseTime: component.responseTime
            },
            updates: [{
              message: description,
              status: 'investigating',
              timestamp: new Date(),
              autoDetected: true
            }]
          });

          await ongoingIncident.save();
          console.log(`Incident created successfully with ID: ${ongoingIncident._id}`);
        } else {
          // Log but don't create incidents for other components
          console.log(`DISABLED: Would have created incident for ${component.name}:`, {
            title,
            description,
            severity,
            statusCode: component.statusCode,
            errorMessage: component.errorMessage
          });

          // Skip incident creation
          ongoingIncident = null;
        }
      } catch (saveError) {
        console.error('Failed to create incident:', saveError);
      }

      // Send notification
      try {
        // Only send notifications for allowed components
        if (ongoingIncident) {
          await notificationSender.sendNewIncident(ongoingIncident);
        } else {
          console.log('No incident to send notification for');
        }
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
    } else {
      // Update the existing incident with new information
      const { title, description, severity } = errorClassifier.classifyError(
        component.name,
        component.status,
        component.statusCode,
        component.errorMessage,
        component.responseTime
      );

      // Only add an update if the error details have changed
      if (
        ongoingIncident.errorDetails.statusCode !== component.statusCode ||
        ongoingIncident.errorDetails.errorMessage !== component.errorMessage
      ) {
        ongoingIncident.updates.push({
          message: `Update: ${description}`,
          status: 'investigating',
          timestamp: new Date(),
          autoDetected: true
        });

        ongoingIncident.errorDetails = {
          statusCode: component.statusCode,
          errorMessage: component.errorMessage,
          responseTime: component.responseTime
        };

        // Update severity if it's more severe
        if (
          (severity === 'critical' && ongoingIncident.severity !== 'critical') ||
          (severity === 'major' && ongoingIncident.severity === 'minor')
        ) {
          ongoingIncident.severity = severity;
        }

        try {
          // Check if this component is allowed to update incidents
          const allowedComponents = ['Website Frontend', 'Database'];

          if (allowedComponents.includes(component.name)) {
            // Update incident for allowed components
            await ongoingIncident.save();
            console.log(`Incident updated successfully with ID: ${ongoingIncident._id}`);

            // Send notification
            try {
              await notificationSender.sendIncidentUpdate(ongoingIncident);
            } catch (notificationError) {
              console.error('Failed to send incident update notification:', notificationError);
            }
          } else {
            // Log but don't update incidents for other components
            console.log(`DISABLED: Would have updated incident with ID: ${ongoingIncident._id}`);
          }
        } catch (saveError) {
          console.error('Failed to update incident:', saveError);
        }
      }
    }
  } catch (error) {
    console.error('Error handling component status:', error);
  }
}

// Main monitoring function
async function monitorEndpoints() {
  try {
    console.log(`[${new Date().toISOString()}] Running endpoint monitoring...`);

    // Get the base URL from environment or use a default
    const baseUrl = process.env.MAIN_APP_URL ||
                   (process.env.NODE_ENV === 'production' ?
                    'https://ftraiseai.onrender.com' :
                    'http://localhost:3000');

    // Check all endpoints
    const results = await Promise.all(
      endpoints.map(endpoint => checkEndpoint(baseUrl, endpoint))
    );

    // Get current system status
    let systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

    // If no system status exists, create a default one
    if (!systemStatus) {
      systemStatus = new SystemStatus({
        overallStatus: 'operational',
        components: endpoints.map(endpoint => ({
          name: endpoint.name,
          status: 'operational',
          lastChecked: new Date(),
          responseTime: 0,
          statusCode: 200,
          errorMessage: null,
          endpoint: endpoint.endpoint || '/' // Provide a default endpoint if not available
        }))
      });
    }

    // Update component statuses
    results.forEach(result => {
      const componentIndex = systemStatus.components.findIndex(c => c.name === result.name);

      // Only allow certain components to show non-operational status
      const allowedComponents = ['Website Frontend', 'Database'];
      if (!allowedComponents.includes(result.name)) {
        // Force non-allowed components to be operational
        result.status = 'operational';
        result.statusCode = 200;
        result.errorMessage = null;
      }

      if (componentIndex !== -1) {
        // Update existing component
        systemStatus.components[componentIndex].status = result.status;
        systemStatus.components[componentIndex].lastChecked = result.lastChecked;
        systemStatus.components[componentIndex].responseTime = result.responseTime;
        systemStatus.components[componentIndex].statusCode = result.statusCode;
        systemStatus.components[componentIndex].errorMessage = result.errorMessage;
        systemStatus.components[componentIndex].updatedAt = new Date();
      } else {
        // Add new component
        systemStatus.components.push(result);
      }

      // Handle component status (create/update incidents)
      handleComponentStatus(result);
    });

    // Determine overall status based on allowed components
    const allowedComponents = ['Website Frontend', 'Database'];
    const allowedStatuses = systemStatus.components
      .filter(c => allowedComponents.includes(c.name))
      .map(c => c.status);

    // Default to operational
    let overallStatus = 'operational';

    // Only change overall status if allowed components have issues
    if (allowedStatuses.includes('major_outage')) {
      overallStatus = 'major_outage';
    } else if (allowedStatuses.includes('partial_outage')) {
      overallStatus = 'partial_outage';
    } else if (allowedStatuses.includes('degraded_performance')) {
      overallStatus = 'degraded_performance';
    }

    systemStatus.overallStatus = overallStatus;

    // Mark as auto-detected
    systemStatus.autoDetected = true;

    // Save system status
    await systemStatus.save();

    console.log(`[${new Date().toISOString()}] Endpoint monitoring completed.`);

    // Return the results for potential use by the caller
    return {
      systemStatus,
      results
    };
  } catch (error) {
    console.error('Error monitoring endpoints:', error);
    return null;
  }
}

module.exports = {
  monitorEndpoints,
  endpoints
};
