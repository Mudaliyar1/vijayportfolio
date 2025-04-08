/**
 * Admin Maintenance Mode Helper
 * This script ensures admin users can access admin pages during maintenance mode
 * and updates the UI to show the correct maintenance status
 */

document.addEventListener('DOMContentLoaded', function() {
  // Only run this script if we're in the admin area
  if (window.location.pathname.startsWith('/admin')) {
    // Check admin status and maintenance mode
    fetch('/admin-status/check')
      .then(response => response.json())
      .then(data => {
        console.log('Admin status check:', data);

        // Update the maintenance mode indicator in the UI
        updateMaintenanceIndicator(data.isMaintenanceActive);

        // If user is admin and maintenance mode is active, ensure session flags are set
        if (data.isAuthenticated && data.isAdmin && data.isMaintenanceActive) {
          // If session flags are not set, set them
          if (!data.sessionFlags.maintenanceBypass || !data.sessionFlags.isAdminSession) {
            console.log('Setting admin session flags...');

            // Set admin session flags
            fetch('/admin-status/set-admin-flags', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            })
              .then(response => response.json())
              .then(data => {
                console.log('Admin flags set:', data);

                // If flags were set successfully, reload the page
                if (data.status === 'success') {
                  window.location.reload();
                }
              })
              .catch(error => {
                console.error('Error setting admin flags:', error);
              });
          }
        } else if (data.isAuthenticated && data.isAdmin && !data.isMaintenanceActive) {
          // If maintenance mode is not active but the indicator is showing, hide it
          // This ensures the indicator is always in sync with the actual maintenance status
          const maintenanceIndicators = document.querySelectorAll('.maintenance-indicator');
          if (maintenanceIndicators.length > 0) {
            maintenanceIndicators.forEach(indicator => {
              indicator.style.display = 'none';
            });
          }
        }
      })
      .catch(error => {
        console.error('Error checking admin status:', error);
      });
  }
});

/**
 * Updates the maintenance mode indicator in the UI
 * @param {boolean} isActive - Whether maintenance mode is active
 */
function updateMaintenanceIndicator(isActive) {
  // Find all maintenance indicators
  const maintenanceIndicators = document.querySelectorAll('.maintenance-indicator');

  if (maintenanceIndicators.length === 0) {
    // If no indicators exist but maintenance is active, create them
    if (isActive) {
      // Create indicators for desktop and mobile sidebars
      createMaintenanceIndicator('.p-6.border-b.border-gray-800.bg-gradient-to-r');
      createMaintenanceIndicator('.p-4.border-b.border-gray-800.flex.justify-between.items-center div:first-child');
    }
  } else {
    // Update existing indicators
    maintenanceIndicators.forEach(indicator => {
      if (isActive) {
        indicator.style.display = 'block';
      } else {
        indicator.style.display = 'none';
      }
    });
  }
}

/**
 * Creates a maintenance mode indicator in the specified parent element
 * @param {string} parentSelector - CSS selector for the parent element
 */
function createMaintenanceIndicator(parentSelector) {
  const parent = document.querySelector(parentSelector);
  if (parent) {
    const indicator = document.createElement('div');
    indicator.className = 'maintenance-indicator mt-3 bg-red-900/50 border border-red-500/30 text-white text-center py-2 px-3 text-xs font-bold rounded-md';
    indicator.innerHTML = '<i class="fas fa-tools mr-1"></i> Maintenance Mode Active';
    parent.appendChild(indicator);
  }
}
