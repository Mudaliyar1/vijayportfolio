/**
 * Status Updater - Client-side JavaScript for real-time status updates
 */

// Initialize Socket.IO connection
const socket = io();

// Listen for status updates
socket.on('statusUpdate', (data) => {
  console.log('Status update received:', data);
  updateStatusUI(data);
});

// Function to update the UI with new status data
function updateStatusUI(data) {
  // Update overall status
  const overallStatusElement = document.getElementById('overall-status');
  if (overallStatusElement) {
    const statusInfo = getStatusInfo(data.overallStatus);
    overallStatusElement.innerHTML = `${statusInfo.icon} ${statusInfo.text}`;
    overallStatusElement.classList.add('updated');
    setTimeout(() => {
      overallStatusElement.classList.remove('updated');
    }, 2000);
  }
  
  // Update last updated time
  const lastUpdatedElement = document.getElementById('last-updated');
  if (lastUpdatedElement) {
    lastUpdatedElement.textContent = new Date(data.updatedAt).toLocaleString();
  }
  
  // Update component statuses
  data.components.forEach(component => {
    const componentStatusElement = document.getElementById(`component-status-${component.name.replace(/\s+/g, '-').toLowerCase()}`);
    if (componentStatusElement) {
      const statusInfo = getStatusInfo(component.status);
      componentStatusElement.innerHTML = `<span class="text-lg mr-2">${statusInfo.icon}</span><span>${statusInfo.text}</span>`;
      
      // Add error message if present
      if (component.errorMessage) {
        const errorElement = document.createElement('div');
        errorElement.className = 'text-xs text-red-400 mt-1';
        errorElement.textContent = component.errorMessage;
        
        // Remove existing error message if any
        const existingError = componentStatusElement.nextElementSibling;
        if (existingError && existingError.classList.contains('text-red-400')) {
          existingError.remove();
        }
        
        componentStatusElement.parentNode.appendChild(errorElement);
      } else {
        // Remove error message if no longer present
        const existingError = componentStatusElement.nextElementSibling;
        if (existingError && existingError.classList.contains('text-red-400')) {
          existingError.remove();
        }
      }
      
      componentStatusElement.classList.add('updated');
      setTimeout(() => {
        componentStatusElement.classList.remove('updated');
      }, 2000);
    }
    
    const componentLastCheckedElement = document.getElementById(`component-last-checked-${component.name.replace(/\s+/g, '-').toLowerCase()}`);
    if (componentLastCheckedElement) {
      componentLastCheckedElement.textContent = new Date(component.lastChecked || component.updatedAt).toLocaleString();
    }
    
    const componentResponseTimeElement = document.getElementById(`component-response-time-${component.name.replace(/\s+/g, '-').toLowerCase()}`);
    if (componentResponseTimeElement) {
      if (component.responseTime) {
        componentResponseTimeElement.innerHTML = `${component.responseTime} ms`;
        if (component.responseTime > 1000) {
          componentResponseTimeElement.innerHTML += ` <span class="text-yellow-400 ml-1"><i class="fas fa-exclamation-triangle"></i></span>`;
        }
      } else {
        componentResponseTimeElement.textContent = 'N/A';
      }
    }
  });
  
  // Check if we need to reload the page to show new incidents
  // This is a fallback for when new incidents are created
  if (data.reloadRequired) {
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
}

// Helper function to get status info
function getStatusInfo(status) {
  switch (status) {
    case 'operational':
      return { text: 'Operational', color: 'green', icon: '🟢' };
    case 'degraded_performance':
      return { text: 'Degraded Performance', color: 'yellow', icon: '🟡' };
    case 'partial_outage':
      return { text: 'Partial Outage', color: 'orange', icon: '🟠' };
    case 'major_outage':
      return { text: 'Major Outage', color: 'red', icon: '🔴' };
    default:
      return { text: 'Unknown', color: 'gray', icon: '⚪' };
  }
}
