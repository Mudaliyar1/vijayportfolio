/**
 * Flash message handling
 */
document.addEventListener('DOMContentLoaded', function() {
  // Auto-dismiss flash messages after 8 seconds
  setTimeout(function() {
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(function(message) {
      message.style.opacity = '0';
      setTimeout(function() {
        message.remove();
      }, 500); // Wait for fade out animation
    });

    // Also hide the clear all button if all messages are gone
    const clearAllButton = document.querySelector('.flash-messages-clear-all');
    if (clearAllButton) {
      clearAllButton.style.opacity = '0';
      setTimeout(function() {
        clearAllButton.remove();
      }, 500);
    }
  }, 8000); // Increased from 5000 to 8000 to give users more time to read

  // Add click handlers to close buttons
  const closeButtons = document.querySelectorAll('.flash-message button');
  closeButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      const message = this.closest('.flash-message');
      message.style.opacity = '0';
      setTimeout(function() {
        message.remove();

        // Check if there are any remaining messages
        const remainingMessages = document.querySelectorAll('.flash-message');
        if (remainingMessages.length === 0) {
          // If no messages left, hide the clear all button
          const clearAllButton = document.querySelector('.flash-messages-clear-all');
          if (clearAllButton) {
            clearAllButton.style.opacity = '0';
            setTimeout(function() {
              clearAllButton.remove();
            }, 500);
          }
        }
      }, 500);
    });
  });
});
