/**
 * WordPress-like Elements Frontend Functionality
 * This script ensures that elements added in the editor work properly in the published site
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all elements
  initCountdownTimers();
  initAccordions();
  initTabs();
  initFaqSections();
  initSocialShare();
  initHamburgerMenus();
  initDarkModeToggles();
  initYouTubeVideos();
});

// Initialize countdown timers
function initCountdownTimers() {
  const countdownTimers = document.querySelectorAll('.countdown-timer');
  
  countdownTimers.forEach(timer => {
    const endDateStr = timer.getAttribute('data-end');
    if (!endDateStr) return;
    
    const endDate = new Date(endDateStr);
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = endDate - now;
      
      if (diff <= 0) {
        timer.innerHTML = '<div class="countdown-expired">Offer Expired</div>';
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      const daysEl = timer.querySelector('.days');
      const hoursEl = timer.querySelector('.hours');
      const minutesEl = timer.querySelector('.minutes');
      const secondsEl = timer.querySelector('.seconds');
      
      if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
      if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
      if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
      if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
  });
}

// Initialize accordions
function initAccordions() {
  const accordionItems = document.querySelectorAll('.accordion-item');
  
  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    const content = item.querySelector('.accordion-content');
    
    if (!header || !content) return;
    
    header.addEventListener('click', () => {
      // Toggle active class
      item.classList.toggle('active');
      
      // Toggle content visibility
      if (item.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = '0';
      }
    });
    
    // Initialize state
    if (item.classList.contains('active')) {
      content.style.maxHeight = content.scrollHeight + 'px';
    } else {
      content.style.maxHeight = '0';
    }
  });
}

// Initialize tabs
function initTabs() {
  const tabsContainers = document.querySelectorAll('.tabs-container');
  
  tabsContainers.forEach(container => {
    const tabNavItems = container.querySelectorAll('.tab-nav-item');
    const tabContents = container.querySelectorAll('.tab-content');
    
    tabNavItems.forEach((navItem, index) => {
      navItem.addEventListener('click', () => {
        // Remove active class from all nav items and contents
        tabNavItems.forEach(item => item.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked nav item and corresponding content
        navItem.classList.add('active');
        if (tabContents[index]) {
          tabContents[index].classList.add('active');
        }
      });
    });
  });
}

// Initialize FAQ sections
function initFaqSections() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    if (!question || !answer) return;
    
    question.addEventListener('click', () => {
      // Toggle active class
      item.classList.toggle('active');
      
      // Toggle answer visibility
      if (item.classList.contains('active')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = '0';
      }
    });
    
    // Initialize state
    if (item.classList.contains('active')) {
      answer.style.maxHeight = answer.scrollHeight + 'px';
    } else {
      answer.style.maxHeight = '0';
    }
  });
}

// Initialize social share buttons
function initSocialShare() {
  const socialIcons = document.querySelectorAll('.social-icon');
  
  socialIcons.forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      
      const platform = Array.from(icon.classList)
        .find(cls => ['facebook', 'twitter', 'linkedin', 'pinterest', 'whatsapp'].includes(cls));
      
      if (!platform) return;
      
      // Get the current page URL
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);
      
      // Open the share dialog
      let shareUrl = '';
      
      switch (platform) {
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
          break;
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
          break;
        case 'pinterest':
          shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`;
          break;
        case 'whatsapp':
          shareUrl = `https://api.whatsapp.com/send?text=${title} ${url}`;
          break;
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    });
  });
}

// Initialize hamburger menus
function initHamburgerMenus() {
  const hamburgerMenus = document.querySelectorAll('.hamburger-menu');
  
  hamburgerMenus.forEach(menu => {
    const hamburgerBtn = menu.querySelector('.hamburger-btn');
    const menuContent = menu.querySelector('.menu-content');
    
    if (!hamburgerBtn || !menuContent) return;
    
    hamburgerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle active class
      menu.classList.toggle('active');
      
      // Toggle menu visibility
      if (menu.classList.contains('active')) {
        menuContent.style.maxHeight = menuContent.scrollHeight + 'px';
        menuContent.style.opacity = '1';
      } else {
        menuContent.style.maxHeight = '0';
        menuContent.style.opacity = '0';
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && menu.classList.contains('active')) {
        menu.classList.remove('active');
        menuContent.style.maxHeight = '0';
        menuContent.style.opacity = '0';
      }
    });
  });
}

// Initialize dark mode toggles
function initDarkModeToggles() {
  const darkModeToggles = document.querySelectorAll('.dark-mode-toggle');
  
  darkModeToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      
      // Save preference to localStorage
      if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
      } else {
        localStorage.setItem('darkMode', 'disabled');
      }
    });
  });
  
  // Check for saved preference
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
  }
}

// Initialize YouTube videos
function initYouTubeVideos() {
  const youtubeContainers = document.querySelectorAll('.youtube-container');
  
  youtubeContainers.forEach(container => {
    const placeholder = container.querySelector('.youtube-placeholder');
    const embed = container.querySelector('.youtube-embed');
    const iframe = embed?.querySelector('iframe');
    
    if (!placeholder || !embed || !iframe) return;
    
    // If the placeholder is visible, it means we need to set up the video
    if (placeholder.style.display !== 'none') {
      placeholder.addEventListener('click', () => {
        // Get the YouTube URL from the placeholder text
        const text = placeholder.textContent.trim();
        
        // Try to extract a YouTube ID from the text
        const youtubeId = extractYoutubeId(text);
        
        if (youtubeId) {
          // Set the iframe src
          iframe.src = `https://www.youtube.com/embed/${youtubeId}`;
          
          // Hide placeholder, show embed
          placeholder.style.display = 'none';
          embed.style.display = 'block';
        }
      });
    }
  });
}

// Helper function to extract YouTube ID from various URL formats
function extractYoutubeId(url) {
  if (!url) return null;
  
  // Try to match various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
}
