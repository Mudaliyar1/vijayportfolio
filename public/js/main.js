// Handle profile picture errors
document.addEventListener('DOMContentLoaded', function() {
  const profileImages = document.querySelectorAll('img[src^="/uploads/"], img[src^="/images/"]');
  
  profileImages.forEach(img => {
    img.onerror = function() {
      this.src = '/images/default-avatar.png';
      this.classList.add('profile-pic-error');
    };
  });
  
  // Auto-dismiss flash messages after 5 seconds
  setTimeout(() => {
    const flashMessages = document.querySelectorAll('.bg-red-900/50, .bg-green-900/50');
    flashMessages.forEach(message => {
      message.classList.add('animate-fade-out');
      setTimeout(() => {
        message.remove();
      }, 500);
    });
  }, 5000);
  
  // Add close button functionality to flash messages
  const closeButtons = document.querySelectorAll('.flash-message .close-btn');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const message = this.closest('.flash-message');
      message.classList.add('animate-fade-out');
      setTimeout(() => {
        message.remove();
      }, 500);
    });
  });
});
