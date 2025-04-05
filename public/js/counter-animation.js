/**
 * Counter Animation for FTRAISE AI
 * Animates number counters on the homepage
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get all elements with the 'counter' class
  const counters = document.querySelectorAll('.counter');
  
  // Check if there are any counters on the page
  if (counters.length === 0) return;
  
  // Function to check if an element is in viewport
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  // Function to animate counter
  function animateCounter(counter) {
    // Get the target number from the data-target attribute
    const target = parseInt(counter.getAttribute('data-target'));
    
    // Set the increment based on the target value
    const increment = target > 100 ? Math.ceil(target / 100) : 1;
    
    // Get the current value
    let currentValue = parseInt(counter.textContent);
    
    // If the current value is less than the target, increment it
    if (currentValue < target) {
      counter.textContent = currentValue + increment;
      
      // Call the function again after a short delay
      setTimeout(() => animateCounter(counter), 20);
    } else {
      counter.textContent = target; // Ensure the final value is exactly the target
    }
  }
  
  // Function to start animation when element is in viewport
  function startCounterAnimations() {
    counters.forEach(counter => {
      if (isInViewport(counter) && !counter.classList.contains('animated')) {
        counter.classList.add('animated');
        animateCounter(counter);
      }
    });
  }
  
  // Start animations when scrolling
  window.addEventListener('scroll', startCounterAnimations);
  
  // Start animations that are already in viewport
  startCounterAnimations();
});
