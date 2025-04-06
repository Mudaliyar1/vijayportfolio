/**
 * Date formatter utility
 * Provides consistent date and time formatting across the application
 */

/**
 * Format a date to a human-readable string
 * @param {Date|string} dateString - Date object or date string
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string
 */
function formatDate(dateString, includeTime = false) {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // Format date as MM/DD/YYYY
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  
  let formattedDate = `${month}/${day}/${year}`;
  
  // Add time if requested
  if (includeTime) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    formattedDate += ` ${hours}:${minutes} ${ampm}`;
  }
  
  return formattedDate;
}

/**
 * Format a date to a relative time string (e.g., "2 days ago")
 * @param {Date|string} dateString - Date object or date string
 * @returns {string} Relative time string
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Recently';
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    // Format as MM/DD/YYYY
    return formatDate(date);
  }
}

module.exports = {
  formatDate,
  formatRelativeTime
};
