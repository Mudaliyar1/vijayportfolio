/**
 * Utility to classify errors and generate appropriate incident details
 */

// Function to classify errors and generate incident details
function classifyError(componentName, status, statusCode, errorMessage, responseTime) {
  let title = '';
  let description = '';
  let severity = 'minor';
  
  // Determine severity based on status
  if (status === 'major_outage') {
    severity = 'critical';
  } else if (status === 'partial_outage') {
    severity = 'major';
  } else if (status === 'degraded_performance') {
    severity = 'minor';
  }
  
  // Generate title and description based on status code and component
  if (statusCode >= 500) {
    title = `${componentName} Server Error (${statusCode})`;
    description = `The ${componentName} is experiencing a server error with status code ${statusCode}. ${errorMessage || ''}`;
    severity = 'critical';
  } else if (statusCode === 408 || errorMessage?.includes('timed out')) {
    title = `${componentName} Timeout`;
    description = `The ${componentName} is taking too long to respond (${responseTime}ms). This may indicate high server load or a connectivity issue.`;
    severity = 'major';
  } else if (statusCode === 503 || errorMessage?.includes('refused')) {
    title = `${componentName} Unavailable`;
    description = `The ${componentName} is currently unavailable. The service may be down or restarting.`;
    severity = 'critical';
  } else if (statusCode >= 400) {
    title = `${componentName} Client Error (${statusCode})`;
    description = `The ${componentName} is returning a client error with status code ${statusCode}. ${errorMessage || ''}`;
    severity = 'major';
  } else if (responseTime > 5000) {
    title = `${componentName} Slow Response`;
    description = `The ${componentName} is responding slowly (${responseTime}ms). This may affect user experience.`;
    severity = 'minor';
  } else {
    title = `${componentName} Issue`;
    description = `The ${componentName} is experiencing an issue. ${errorMessage || ''}`;
  }
  
  // Special case for database
  if (componentName === 'Database' && errorMessage?.includes('not connected')) {
    title = 'Database Connection Issue';
    description = `The database is not properly connected. ${errorMessage || ''}`;
    severity = 'critical';
  }
  
  return {
    title,
    description,
    severity
  };
}

module.exports = {
  classifyError
};
