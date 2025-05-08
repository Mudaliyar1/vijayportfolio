/**
 * Check if ad display CSS is loaded correctly
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Checking if ad display CSS is loaded correctly...');
  
  // Create a test element
  const testElement = document.createElement('div');
  testElement.className = 'ad-sidebar';
  testElement.style.position = 'absolute';
  testElement.style.left = '-9999px';
  testElement.style.top = '-9999px';
  document.body.appendChild(testElement);
  
  // Check computed styles
  const computedStyle = window.getComputedStyle(testElement);
  console.log('Ad sidebar computed styles:', {
    width: computedStyle.width,
    backgroundColor: computedStyle.backgroundColor,
    boxShadow: computedStyle.boxShadow,
    transition: computedStyle.transition
  });
  
  // Check if styles match what we expect
  const hasExpectedStyles = 
    computedStyle.width === '160px' && 
    computedStyle.backgroundColor.includes('26, 26, 26') &&
    computedStyle.transition.includes('transform');
  
  console.log('CSS loaded correctly:', hasExpectedStyles);
  
  // Clean up
  document.body.removeChild(testElement);
});
