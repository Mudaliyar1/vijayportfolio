/**
 * Cookie Consent Manager
 * Handles displaying and managing cookie consent preferences
 */

(function() {
  // Configuration
  const config = {
    cookieName: 'cookie_consent',
    consentDuration: 365, // days
    essentialOnly: 'essential_only',
    fullConsent: 'full_consent'
  };

  // Helper function to get a cookie by name
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  // Helper function to set a cookie
  function setCookie(name, value, days) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    const cookieValue = encodeURIComponent(value) +
      '; expires=' + expirationDate.toUTCString() +
      '; path=/' +
      '; SameSite=Lax';

    // Add secure flag if using HTTPS
    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = name + '=' + cookieValue + secureFlag;
  }

  // Check if consent has already been given
  function hasConsent() {
    return getCookie(config.cookieName) !== null;
  }

  // Set consent in cookie
  function setConsent(type) {
    setCookie(config.cookieName, type, config.consentDuration);

    // Dispatch event for other scripts to react to consent change
    document.dispatchEvent(new CustomEvent('cookieConsentChange', {
      detail: { type: type }
    }));
  }

  // Get current consent type
  function getConsentType() {
    return getCookie(config.cookieName);
  }

  // Check if consent has expired
  function isConsentExpired() {
    // If the cookie exists, it's not expired (expiration is handled by the browser)
    return !hasConsent();
  }

  // Create and show the consent banner
  function showConsentBanner() {
    // Check if banner is already visible
    if (document.querySelector('.cookie-consent-banner')) {
      return; // Don't show multiple banners
    }

    // Create banner element
    const banner = document.createElement('div');
    banner.className = 'cookie-consent-banner';
    banner.innerHTML = `
      <div class="cookie-consent-content">
        <div class="cookie-consent-header">
          <h3>Cookie Consent</h3>
          <button class="cookie-consent-close" aria-label="Close" title="Close (will ask again later)">×</button>
        </div>
        <p>
          We use cookies to enhance your experience, analyze traffic, and serve relevant content.
          Some cookies are essential for the website to function properly, while others help us
          understand how you interact with the site so we can improve it. You can choose to accept
          or decline the use of non-essential cookies. By clicking 'Accept', you agree to our use
          of cookies as described in our <a href="/policies/privacy" class="cookie-consent-link">Privacy Policy</a>.
        </p>
        <div class="cookie-consent-buttons">
          <button class="cookie-consent-decline">Decline</button>
          <button class="cookie-consent-accept">Accept</button>
          <a href="/policies/cookies" class="cookie-consent-learn-more">Learn More</a>
        </div>
        <div class="cookie-consent-note">
          <small>Note: This banner will appear until you accept cookies. If you decline, it will reappear on future visits.</small>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .cookie-consent-banner {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        max-width: 500px;
        margin: 0 auto;
        background: rgba(33, 33, 33, 0.95);
        color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        animation: slideUp 0.5s ease-out;
      }

      @keyframes slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .cookie-consent-content {
        padding: 20px;
      }

      .cookie-consent-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .cookie-consent-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .cookie-consent-close {
        background: none;
        border: none;
        color: #aaa;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }

      .cookie-consent-banner p {
        margin: 0 0 20px;
        line-height: 1.5;
        font-size: 14px;
        color: #ddd;
      }

      .cookie-consent-link {
        color: #4285F4;
        text-decoration: underline;
      }

      .cookie-consent-buttons {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }

      .cookie-consent-accept {
        background: #4285F4;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
      }

      .cookie-consent-accept:hover {
        background: #3367d6;
      }

      .cookie-consent-decline {
        background: transparent;
        color: #ddd;
        border: 1px solid #555;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
      }

      .cookie-consent-decline:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .cookie-consent-learn-more {
        color: #aaa;
        text-decoration: none;
        margin-left: auto;
        font-size: 14px;
      }

      .cookie-consent-learn-more:hover {
        text-decoration: underline;
      }

      .cookie-consent-note {
        margin-top: 10px;
        text-align: center;
        font-size: 12px;
        color: #999;
      }

      @media (max-width: 600px) {
        .cookie-consent-banner {
          bottom: 0;
          left: 0;
          right: 0;
          max-width: 100%;
          border-radius: 8px 8px 0 0;
        }

        .cookie-consent-buttons {
          flex-direction: column;
          align-items: stretch;
        }

        .cookie-consent-learn-more {
          margin: 10px auto 0;
          text-align: center;
        }
      }
    `;

    // Add to document
    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Add event listeners
    banner.querySelector('.cookie-consent-accept').addEventListener('click', () => {
      setConsent(config.fullConsent);
      hideBanner(banner);
    });

    banner.querySelector('.cookie-consent-decline').addEventListener('click', () => {
      setConsent(config.essentialOnly);
      hideBanner(banner);
    });

    banner.querySelector('.cookie-consent-close').addEventListener('click', () => {
      // Just hide the banner without setting consent
      // This will make the banner appear again on the next page load
      hideBanner(banner);
    });
  }

  // Hide and remove the banner
  function hideBanner(banner) {
    banner.style.animation = 'slideDown 0.5s ease-out forwards';

    // Add the slideDown animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    // Remove after animation completes
    setTimeout(() => {
      if (banner && banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 500);
  }

  // Initialize
  function init() {
    // Check if consent is needed
    if (!hasConsent() || isConsentExpired() || getConsentType() === config.essentialOnly) {
      // Wait a moment before showing the banner
      setTimeout(showConsentBanner, 1000);
    }

    // Also check on window load (in case DOM is already loaded)
    window.addEventListener('load', function() {
      if (!hasConsent() || isConsentExpired() || getConsentType() === config.essentialOnly) {
        showConsentBanner();
      }
    });
  }

  // Function to clear consent
  function clearConsent() {
    // Set cookie expiration to a past date to delete it
    document.cookie = config.cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';

    // Dispatch event for other scripts
    document.dispatchEvent(new CustomEvent('cookieConsentChange', {
      detail: { type: null }
    }));
  }

  // Public API
  window.cookieConsent = {
    hasConsent: hasConsent,
    getConsentType: getConsentType,
    setConsent: setConsent,
    clearConsent: clearConsent,
    showBanner: showConsentBanner,
    isEssentialOnly: function() {
      return getConsentType() === config.essentialOnly;
    },
    isFullConsent: function() {
      return getConsentType() === config.fullConsent;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
