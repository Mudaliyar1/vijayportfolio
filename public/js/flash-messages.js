/**
 * Flash message handling
 */
document.addEventListener('DOMContentLoaded', function() {
  // Auto-dismiss flash messages after 5 seconds
  setTimeout(function() {
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(function(message) {
      message.style.opacity = '0';
      setTimeout(function() {
        message.remove();
      }, 500); // Wait for fade out animation
    });
  }, 5000);

  // Add click handlers to close buttons
  const closeButtons = document.querySelectorAll('.flash-message button');
  closeButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      const message = this.closest('.flash-message');
      message.style.opacity = '0';
      setTimeout(function() {
        message.remove();
      }, 500);
    });
  });
});
