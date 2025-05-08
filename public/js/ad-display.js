/**
 * Ad Display System
 * Handles the display of ads from free internet sources without using third-party APIs
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize ad display
  initializeAds();

  // Handle window resize events (for orientation changes on mobile)
  window.addEventListener('resize', function() {
    const wasMobile = window.isMobile;
    window.isMobile = window.innerWidth < 768;

    // If mobile state changed, update sidebar container classes
    if (wasMobile !== window.isMobile) {
      // Update left sidebar container
      const leftSidebarContainer = document.querySelector('.ad-sidebar-container.left-side');
      if (leftSidebarContainer) {
        if (window.isMobile) {
          leftSidebarContainer.classList.add('mobile-sidebar');
        } else {
          leftSidebarContainer.classList.remove('mobile-sidebar');
        }
      }

      // Update right sidebar container
      const rightSidebarContainer = document.querySelector('.ad-sidebar-container.right-side');
      if (rightSidebarContainer) {
        if (window.isMobile) {
          rightSidebarContainer.classList.add('mobile-sidebar');
        } else {
          rightSidebarContainer.classList.remove('mobile-sidebar');
        }
      }
    }
  });
});

/**
 * Initialize all ad components
 */
function initializeAds() {
  // Check if all ads are disabled
  if (typeof window.allAdsDisabled !== 'undefined' && window.allAdsDisabled === true) {
    // Skip initialization if ads are disabled
    return;
  }

  // Check if ads are available in the page
  if (typeof window.pageAds === 'undefined') {
    window.pageAds = {
      popup: [],
      top: [],
      bottom: [],
      sidebar: [],
      content: []
    };
  }

  // Check if we're on a mobile device
  window.isMobile = window.innerWidth < 768;

  // Display ads based on their position
  try {
    displayPopupAds();
  } catch (e) {
    // Silent error handling
  }

  try {
    displayBannerAds('top');
  } catch (e) {
    // Silent error handling
  }

  try {
    displayBannerAds('bottom');
  } catch (e) {
    // Silent error handling
  }

  try {
    displaySidebarAds();
  } catch (e) {
    // Silent error handling
  }

  try {
    displayContentAds();
  } catch (e) {
    // Silent error handling
  }
}

/**
 * Display popup ads
 */
function displayPopupAds() {
  const popupAds = window.pageAds.popup || [];
  if (popupAds.length === 0) return;

  // Select a random ad if multiple are available
  const adToShow = selectRandomAd(popupAds);
  if (!adToShow) return;

  // Check if this popup has already been shown to the user
  const popupShownCount = getPopupShownCount(adToShow._id);
  if (popupShownCount >= adToShow.displayFrequency) return;

  // Create popup element
  const popupElement = createPopupElement(adToShow);

  // Add to document
  document.body.appendChild(popupElement);

  // Show popup after delay
  setTimeout(() => {
    popupElement.classList.add('ad-popup-visible');

    // Increment shown count
    incrementPopupShownCount(adToShow._id);
  }, adToShow.delay || 3000);
}

/**
 * Display banner ads (top or bottom)
 * @param {string} position - 'top' or 'bottom'
 */
function displayBannerAds(position) {
  const bannerAds = window.pageAds[position] || [];
  if (bannerAds.length === 0) return;

  // Select a random ad if multiple are available
  const adToShow = selectRandomAd(bannerAds);
  if (!adToShow) return;

  // Create banner element
  const bannerElement = createBannerElement(adToShow, position);

  // Add to document
  if (position === 'top') {
    document.body.insertBefore(bannerElement, document.body.firstChild);
  } else {
    document.body.appendChild(bannerElement);
  }

  // Show banner
  setTimeout(() => {
    bannerElement.classList.add('ad-banner-visible');
  }, 500);
}

/**
 * Display sidebar ads
 */
function displaySidebarAds() {
  const sidebarAds = window.pageAds.sidebar || [];
  if (sidebarAds.length === 0) return;

  // Track available ads
  if (!window.availableSidebarAds) {
    window.availableSidebarAds = [...sidebarAds];
    window.displayedSidebarAds = [];
  }

  // Create or get left sidebar container
  let leftSidebarContainer = document.querySelector('.ad-sidebar-container.left-side');
  if (!leftSidebarContainer) {
    leftSidebarContainer = document.createElement('div');
    leftSidebarContainer.className = 'ad-sidebar-container left-side';

    // Add mobile class if on mobile
    if (window.isMobile) {
      leftSidebarContainer.classList.add('mobile-sidebar');
    }

    document.body.appendChild(leftSidebarContainer);
  }

  // Create or get right sidebar container
  let rightSidebarContainer = document.querySelector('.ad-sidebar-container.right-side');
  if (!rightSidebarContainer) {
    rightSidebarContainer = document.createElement('div');
    rightSidebarContainer.className = 'ad-sidebar-container right-side';

    // Add mobile class if on mobile
    if (window.isMobile) {
      rightSidebarContainer.classList.add('mobile-sidebar');
    }

    document.body.appendChild(rightSidebarContainer);
  }

  // Display ads on both sides if available
  if (window.availableSidebarAds.length > 0) {
    // Left side ad
    displayNextSidebarAd(leftSidebarContainer);

    // Right side ad (if we have more than one ad available)
    if (window.availableSidebarAds.length > 0) {
      displayNextSidebarAd(rightSidebarContainer);
    }
  }
}

/**
 * Display the next available sidebar ad in the specified container
 * @param {HTMLElement} container - The sidebar container element
 */
function displayNextSidebarAd(container) {
  if (!window.availableSidebarAds || window.availableSidebarAds.length === 0) return;

  // Select a random ad from available ads
  const randomIndex = Math.floor(Math.random() * window.availableSidebarAds.length);
  const adToShow = window.availableSidebarAds.splice(randomIndex, 1)[0];

  // Add to displayed ads list
  window.displayedSidebarAds.push(adToShow);

  // Create sidebar ad element
  const sidebarElement = createSidebarElement(adToShow, container);

  // Add to sidebar container
  container.appendChild(sidebarElement);

  // Show sidebar ad
  setTimeout(() => {
    sidebarElement.classList.add('ad-sidebar-visible');

    // Double-check if the class was added
    setTimeout(() => {
      if (!sidebarElement.classList.contains('ad-sidebar-visible')) {
        sidebarElement.classList.add('ad-sidebar-visible');
        sidebarElement.style.transform = 'translateX(0)';
      }
    }, 100);
  }, 800);
}

/**
 * Display in-content ads
 */
function displayContentAds() {
  const contentAds = window.pageAds.content || [];
  if (contentAds.length === 0) return;

  // Select a random ad if multiple are available
  const adToShow = selectRandomAd(contentAds);
  if (!adToShow) return;

  // Find suitable container for content ad
  const contentContainers = [
    document.querySelector('.container'),
    document.querySelector('main'),
    document.querySelector('article'),
    document.querySelector('.content')
  ].filter(el => el !== null);

  if (contentContainers.length === 0) return;

  const container = contentContainers[0];
  const paragraphs = container.querySelectorAll('p');

  // Insert after the second paragraph if available
  if (paragraphs.length >= 2) {
    const contentElement = createContentElement(adToShow);
    paragraphs[1].parentNode.insertBefore(contentElement, paragraphs[1].nextSibling);

    // Show content ad
    setTimeout(() => {
      contentElement.classList.add('ad-content-visible');
    }, 1000);
  }
}

/**
 * Create popup ad element
 * @param {Object} ad - Ad data
 * @returns {HTMLElement} Popup element
 */
function createPopupElement(ad) {
  const popup = document.createElement('div');
  popup.className = 'ad-popup';
  popup.innerHTML = `
    <div class="ad-popup-content">
      <button class="ad-popup-close" aria-label="Close">&times;</button>
      <a href="${ad.link}" target="_blank" rel="noopener noreferrer" class="ad-link">
        <img src="${ad.imageUrl || '/images/default-avatar.png'}" alt="${ad.title}" class="ad-image" onerror="this.onerror=null; this.src='/images/default-avatar.png';">
        ${ad.overlayText ? `<div class="ad-overlay-text">${ad.overlayText}</div>` : ''}
      </a>
    </div>
  `;

  // Add close button functionality
  popup.querySelector('.ad-popup-close').addEventListener('click', function() {
    popup.classList.remove('ad-popup-visible');
    setTimeout(() => {
      popup.remove();
    }, 500);
  });

  return popup;
}

/**
 * Create banner ad element
 * @param {Object} ad - Ad data
 * @param {string} position - 'top' or 'bottom'
 * @returns {HTMLElement} Banner element
 */
function createBannerElement(ad, position) {
  const banner = document.createElement('div');
  banner.className = `ad-banner ad-banner-${position}`;
  banner.innerHTML = `
    <div class="ad-banner-content">
      <button class="ad-banner-close" aria-label="Close">&times;</button>
      <a href="${ad.link}" target="_blank" rel="noopener noreferrer" class="ad-link">
        <img src="${ad.imageUrl || '/images/default-avatar.png'}" alt="${ad.title}" class="ad-image" onerror="this.onerror=null; this.src='/images/default-avatar.png';">
        ${ad.overlayText ? `<div class="ad-overlay-text">${ad.overlayText}</div>` : ''}
      </a>
    </div>
  `;

  // Add close button functionality
  banner.querySelector('.ad-banner-close').addEventListener('click', function() {
    banner.classList.remove('ad-banner-visible');
    setTimeout(() => {
      banner.remove();
    }, 500);
  });

  return banner;
}

/**
 * Create sidebar ad element
 * @param {Object} ad - Ad data
 * @param {HTMLElement} container - The container element
 * @returns {HTMLElement} Sidebar element
 */
function createSidebarElement(ad, container) {
  const sidebar = document.createElement('div');
  sidebar.className = 'ad-sidebar';
  sidebar.dataset.adId = ad._id; // Store ad ID for reference
  sidebar.innerHTML = `
    <div class="ad-sidebar-content">
      <button class="ad-sidebar-close" aria-label="Close">&times;</button>
      <a href="${ad.link}" target="_blank" rel="noopener noreferrer" class="ad-link">
        <img src="${ad.imageUrl || '/images/default-avatar.png'}" alt="${ad.title}" class="ad-image" onerror="this.onerror=null; this.src='/images/default-avatar.png';">
        ${ad.overlayText ? `<div class="ad-overlay-text">${ad.overlayText}</div>` : ''}
      </a>
    </div>
  `;

  // Add close button functionality
  sidebar.querySelector('.ad-sidebar-close').addEventListener('click', function() {
    sidebar.classList.remove('ad-sidebar-visible');
    setTimeout(() => {
      sidebar.remove();

      // Show next ad if available
      if (window.displayedSidebarAds && window.displayedSidebarAds.length > 0) {
        // Move all displayed ads back to available
        window.availableSidebarAds = [...window.availableSidebarAds, ...window.displayedSidebarAds];
        window.displayedSidebarAds = [];

        // If we have ads in the pool, show the next one
        if (window.availableSidebarAds.length > 0) {
          // Wait a bit before showing the next ad
          setTimeout(() => {
            displayNextSidebarAd(container);
          }, 1000);
        }
      }
    }, 500);
  });

  return sidebar;
}

/**
 * Create in-content ad element
 * @param {Object} ad - Ad data
 * @returns {HTMLElement} Content element
 */
function createContentElement(ad) {
  const content = document.createElement('div');
  content.className = 'ad-content';
  content.innerHTML = `
    <div class="ad-content-inner">
      <a href="${ad.link}" target="_blank" rel="noopener noreferrer" class="ad-link">
        <img src="${ad.imageUrl || '/images/default-avatar.png'}" alt="${ad.title}" class="ad-image" onerror="this.onerror=null; this.src='/images/default-avatar.png';">
        ${ad.overlayText ? `<div class="ad-overlay-text">${ad.overlayText}</div>` : ''}
      </a>
    </div>
  `;

  return content;
}

/**
 * Select a random ad from an array of ads
 * @param {Array} ads - Array of ad objects
 * @returns {Object|null} Selected ad or null
 */
function selectRandomAd(ads) {
  if (!ads || ads.length === 0) return null;
  return ads[Math.floor(Math.random() * ads.length)];
}

/**
 * Get the number of times a popup has been shown
 * @param {string} adId - Ad ID
 * @returns {number} Number of times shown
 */
function getPopupShownCount(adId) {
  try {
    const popupShown = JSON.parse(localStorage.getItem('adPopupShown') || '{}');
    return popupShown[adId] || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Increment the number of times a popup has been shown
 * @param {string} adId - Ad ID
 */
function incrementPopupShownCount(adId) {
  try {
    const popupShown = JSON.parse(localStorage.getItem('adPopupShown') || '{}');
    popupShown[adId] = (popupShown[adId] || 0) + 1;
    localStorage.setItem('adPopupShown', JSON.stringify(popupShown));
  } catch (e) {
    console.error('Error incrementing popup shown count:', e);
  }
}
