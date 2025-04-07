document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const budgetSlider = document.getElementById('budget-slider');
  const budgetValue = document.getElementById('budget-value');
  const sliderProgress = document.getElementById('slider-progress');
  const websiteTypeButtons = document.querySelectorAll('.website-type-btn');
  const featureCheckboxes = document.querySelectorAll('.feature-checkbox input');
  const getRecommendationBtn = document.getElementById('get-recommendation-btn');
  const aiRecommendation = document.getElementById('ai-recommendation');
  const closeRecommendationBtn = document.getElementById('close-recommendation');
  const aiMessage = document.getElementById('ai-message');
  const recommendedPackageName = document.getElementById('recommended-package-name');
  const recommendedPackageDescription = document.getElementById('recommended-package-description');
  const recommendedPackagePrice = document.getElementById('recommended-package-price');

  // Get all packages from the page
  const packageCards = document.querySelectorAll('.package-card');
  const packages = [];

  // Extract package information
  packageCards.forEach(card => {
    const nameElement = card.querySelector('h2') || card.querySelector('h3');
    const priceElement = card.querySelector('.text-3xl.font-bold');
    const descriptionElement = card.querySelector('p.text-gray-300');

    if (nameElement && priceElement) {
      const name = nameElement.textContent.trim();
      let priceText = priceElement.textContent.trim();
      let price = 0;

      // Extract price value
      if (priceText.toLowerCase() === 'free') {
        price = 0;
      } else {
        // Extract numeric value from price (e.g., "₹999" -> 999)
        const priceMatch = priceText.match(/[\d,]+/);
        if (priceMatch) {
          price = parseInt(priceMatch[0].replace(/,/g, ''));
        }
      }

      const description = descriptionElement ? descriptionElement.textContent.trim() : '';
      const id = card.id;

      packages.push({
        name,
        price,
        description,
        id,
        element: card
      });
    }
  });

  // Sort packages by price
  packages.sort((a, b) => a.price - b.price);

  // Find the maximum price for the slider
  const maxPrice = packages.length > 0 ?
    Math.max(...packages.map(pkg => pkg.price)) :
    2000; // Default if no packages found

  // Set slider max value based on the highest package price
  // Round up to the nearest 1000 for a cleaner UI
  const sliderMax = Math.ceil(maxPrice / 1000) * 1000;

  // Update slider attributes
  if (budgetSlider) {
    budgetSlider.max = sliderMax;
    budgetSlider.step = Math.max(100, Math.floor(sliderMax / 20)); // Adjust step size based on max

    // Update the slider markers
    const sliderMarkers = document.getElementById('slider-markers');
    if (sliderMarkers) {
      sliderMarkers.innerHTML = '';

      // Create 5 evenly spaced markers
      for (let i = 0; i <= 4; i++) {
        const value = Math.floor(i * (sliderMax / 4));
        const marker = document.createElement('span');
        marker.textContent = '₹' + value.toLocaleString();
        marker.className = 'text-xs text-gray-400';
        sliderMarkers.appendChild(marker);
      }
    }
  }

  // State
  let selectedBudget = packages.length > 0 ? packages[0].price : 0;
  let selectedType = 'personal';
  let selectedFeatures = [];

  // Initialize budget value display
  if (budgetValue && selectedBudget !== undefined) {
    budgetValue.textContent = '₹' + selectedBudget.toLocaleString();
  }

  // Initialize slider value
  if (budgetSlider && selectedBudget !== undefined) {
    budgetSlider.value = selectedBudget;
    updateBudgetDisplay();
  }
  // Initialize slider
  if (budgetSlider) {
    // Update budget value and progress bar when slider changes
    budgetSlider.addEventListener('input', function() {
      selectedBudget = parseInt(this.value);
      updateBudgetDisplay();
    });
  }

  // Initialize website type buttons
  websiteTypeButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      websiteTypeButtons.forEach(btn => btn.classList.remove('active'));

      // Add active class to clicked button
      this.classList.add('active');

      // Update selected type
      selectedType = this.dataset.type;
    });
  });

  // Initialize feature checkboxes
  featureCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        selectedFeatures.push(this.value);
      } else {
        selectedFeatures = selectedFeatures.filter(feature => feature !== this.value);
      }
    });
  });

  // Get recommendation button
  if (getRecommendationBtn) {
    getRecommendationBtn.addEventListener('click', function() {
      // Show loading state
      this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Analyzing...';
      this.disabled = true;

      // Simulate AI processing
      setTimeout(() => {
        generateRecommendation();

        // Reset button
        this.innerHTML = '<i class="fas fa-magic mr-2"></i> Get AI Recommendation';
        this.disabled = false;

        // Show recommendation
        aiRecommendation.classList.remove('hidden');

        // Add animation
        aiRecommendation.classList.add('animate-fade-in');

        // Scroll to recommendation
        aiRecommendation.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add highlight to recommended package
        highlightRecommendedPackage();
      }, 1500);
    });
  }

  // Close recommendation button
  if (closeRecommendationBtn) {
    closeRecommendationBtn.addEventListener('click', function() {
      // Add fade-out animation
      aiRecommendation.classList.add('animate-fade-out');

      // Wait for animation to complete before hiding
      setTimeout(() => {
        aiRecommendation.classList.remove('animate-fade-out');
        aiRecommendation.classList.add('hidden');
        aiRecommendation.classList.remove('animate-fade-in');

        // Remove highlight from packages
        document.querySelectorAll('.package-card').forEach(card => {
          card.classList.remove('recommended-package');

          // Remove any recommendation badges
          const badge = card.querySelector('.absolute.top-0.right-0');
          if (badge && badge.innerHTML.includes('AI Recommended')) {
            badge.remove();
          }
        });
      }, 300);
    });
  }

  // Helper functions
  function updateBudgetDisplay() {
    if (budgetValue) {
      // Add animation effect to the budget value
      budgetValue.classList.add('budget-pulse');
      budgetValue.textContent = '₹' + selectedBudget.toLocaleString();

      // Remove animation class after animation completes
      setTimeout(() => {
        budgetValue.classList.remove('budget-pulse');
      }, 300);
    }

    // Update progress bar with animation
    if (sliderProgress) {
      const percentage = (selectedBudget / budgetSlider.max) * 100;

      // Add transition for smooth animation
      sliderProgress.style.transition = 'width 0.3s ease-out';
      sliderProgress.style.width = percentage + '%';

      // Change gradient colors based on percentage
      if (percentage < 25) {
        sliderProgress.style.background = 'linear-gradient(to right, #10b981, #34d399)';
      } else if (percentage < 50) {
        sliderProgress.style.background = 'linear-gradient(to right, #10b981, #3b82f6)';
      } else if (percentage < 75) {
        sliderProgress.style.background = 'linear-gradient(to right, #3b82f6, #8b5cf6)';
      } else {
        sliderProgress.style.background = 'linear-gradient(to right, #8b5cf6, #ec4899)';
      }
    }

    // Highlight packages that fit within the budget
    highlightAffordablePackages();
  }

  function highlightAffordablePackages() {
    // Find all packages that fit within the budget
    const affordablePackages = packages.filter(pkg => pkg.price <= selectedBudget);

    // Get all package cards
    document.querySelectorAll('.package-card').forEach(card => {
      // Remove any existing affordability indicators
      const indicator = card.querySelector('.affordability-indicator');
      if (indicator) indicator.remove();

      // Get the package price
      const priceElement = card.querySelector('.text-3xl.font-bold');
      if (!priceElement) return;

      let price = 0;
      const priceText = priceElement.textContent.trim();

      if (priceText.toLowerCase() === 'free') {
        price = 0;
      } else {
        const priceMatch = priceText.match(/[\d,]+/);
        if (priceMatch) {
          price = parseInt(priceMatch[0].replace(/,/g, ''));
        }
      }

      // Check if this package is affordable
      if (price <= selectedBudget) {
        // Add a subtle indicator
        const indicator = document.createElement('div');
        indicator.className = 'affordability-indicator absolute top-0 left-0 w-full h-full border-2 border-green-500/30 rounded-xl pointer-events-none';
        indicator.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.2)';
        card.style.position = 'relative';
        card.appendChild(indicator);
      } else {
        // Add a subtle indicator for packages outside budget
        const indicator = document.createElement('div');
        indicator.className = 'affordability-indicator absolute top-0 left-0 w-full h-full border-2 border-gray-500/20 rounded-xl pointer-events-none';
        card.style.position = 'relative';
        card.appendChild(indicator);

        // Add a badge showing how much more budget is needed
        const badge = document.createElement('div');
        badge.className = 'absolute top-0 right-0 bg-gray-700/80 text-gray-300 text-xs px-3 py-1 rounded-bl-lg font-medium z-10';
        badge.innerHTML = `<i class="fas fa-arrow-up mr-1"></i>₹${(price - selectedBudget).toLocaleString()} more`;
        card.appendChild(badge);
      }
    });
  }

  function generateRecommendation() {
    // Logic to determine the best package based on budget, type, and features
    let recommendedPackage = null;

    // Filter packages that fit within the budget
    const affordablePackages = packages.filter(pkg => pkg.price <= selectedBudget);

    if (affordablePackages.length === 0) {
      // If no packages fit the budget, recommend the cheapest package
      recommendedPackage = packages[0];
    } else {
      // Find the most expensive package within budget
      recommendedPackage = affordablePackages[affordablePackages.length - 1];

      // Adjust based on website type and features
      if (selectedType === 'ecommerce') {
        // For e-commerce, try to find a package with e-commerce features
        const ecommercePackages = affordablePackages.filter(pkg => {
          // Check if package name or description mentions e-commerce
          return pkg.name.toLowerCase().includes('commerce') ||
                 pkg.description.toLowerCase().includes('commerce') ||
                 pkg.name.toLowerCase().includes('store') ||
                 pkg.description.toLowerCase().includes('store');
        });

        if (ecommercePackages.length > 0) {
          // Get the most expensive e-commerce package within budget
          recommendedPackage = ecommercePackages[ecommercePackages.length - 1];
        }
      } else if (selectedType === 'business') {
        // For business, try to find a package with business features
        const businessPackages = affordablePackages.filter(pkg => {
          return pkg.name.toLowerCase().includes('business') ||
                 pkg.description.toLowerCase().includes('business') ||
                 pkg.name.toLowerCase().includes('professional') ||
                 pkg.description.toLowerCase().includes('professional');
        });

        if (businessPackages.length > 0) {
          recommendedPackage = businessPackages[businessPackages.length - 1];
        }
      } else if (selectedType === 'blog') {
        // For blog, try to find a package with blog features
        const blogPackages = affordablePackages.filter(pkg => {
          return pkg.name.toLowerCase().includes('blog') ||
                 pkg.description.toLowerCase().includes('blog');
        });

        if (blogPackages.length > 0) {
          recommendedPackage = blogPackages[blogPackages.length - 1];
        }
      }

      // Consider selected features
      if (selectedFeatures.length > 0) {
        // Calculate a score for each package based on how well it matches the selected features
        const scoredPackages = affordablePackages.map(pkg => {
          let score = 0;

          // Check if package description mentions any of the selected features
          selectedFeatures.forEach(feature => {
            if (pkg.description.toLowerCase().includes(feature.toLowerCase())) {
              score += 1;
            }
          });

          return { ...pkg, score };
        });

        // Sort by score (highest first) and then by price (highest first)
        scoredPackages.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.price - a.price;
        });

        // If we found packages with matching features, use the best match
        if (scoredPackages.length > 0 && scoredPackages[0].score > 0) {
          recommendedPackage = scoredPackages[0];
        }
      }
    }

    // If still no recommendation, use the most expensive affordable package
    if (!recommendedPackage && packages.length > 0) {
      recommendedPackage = packages[0]; // Fallback to the cheapest package
    }

    // Update the recommendation UI
    updateRecommendationUI(recommendedPackage);
  }

  function updateRecommendationUI(package) {
    // Create features string
    const featuresString = selectedFeatures.length > 0
      ? selectedFeatures.map(f => `<span class="text-white font-semibold">${capitalizeFirstLetter(f)}</span>`).join(', ')
      : '<span class="text-white font-semibold">no specific features</span>';

    // Get the recommendation container elements
    const recommendationCard = document.querySelector('#ai-recommendation .bg-dark-300.rounded-lg');
    const viewDetailsBtn = document.querySelector('#ai-recommendation a[href="#recommended-package"]').parentElement;

    // Check if we have a valid package
    if (!package || packages.length === 0) {
      // No matching package found - show a message
      aiMessage.innerHTML = `Based on your budget of <span class="text-white font-semibold">₹${selectedBudget.toLocaleString()}</span> and requirements for a <span class="text-white font-semibold">${capitalizeFirstLetter(selectedType)}</span> website with ${featuresString}, I couldn't find a perfect match.`;

      // Update the recommendation card with a message
      if (recommendationCard) {
        recommendationCard.innerHTML = `
          <div class="text-center py-4">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <i class="fas fa-exclamation-triangle text-yellow-500 text-xl"></i>
            </div>
            <h3 class="text-xl font-bold text-yellow-400 mb-2">No Exact Match Found</h3>
            <p class="text-gray-300 text-sm mb-3">We don't currently have a package that exactly matches your requirements.</p>
            <p class="text-gray-400 text-sm">Please adjust your budget or requirements, or contact us for a custom solution.</p>
          </div>
        `;
      }

      // Hide the view details button
      if (viewDetailsBtn) {
        viewDetailsBtn.style.display = 'none';
      }

      return;
    }

    // We have a valid package - show the recommendation
    // Update AI message
    aiMessage.innerHTML = `Based on your budget of <span class="text-white font-semibold">₹${selectedBudget.toLocaleString()}</span> and requirements for a <span class="text-white font-semibold">${capitalizeFirstLetter(selectedType)}</span> website with ${featuresString}, I recommend:`;

    // Update recommended package details
    recommendedPackageName.textContent = package.name;
    recommendedPackageDescription.textContent = package.description;
    recommendedPackagePrice.textContent = '₹' + package.price.toLocaleString();

    // Show the view details button
    if (viewDetailsBtn) {
      viewDetailsBtn.style.display = 'block';
    }

    // Set the recommended package ID for scrolling
    const recommendedPackageElement = document.getElementById('recommended-package');
    if (recommendedPackageElement) {
      recommendedPackageElement.removeAttribute('id');
    }

    // Set the new recommended package ID
    if (package.element) {
      package.element.id = 'recommended-package';

      // Update the href of the view details link
      const viewDetailsLinks = document.querySelectorAll('a[href="#recommended-package"]');
      viewDetailsLinks.forEach(link => {
        link.href = `#${package.element.id}`;
      });
    }
  }

  function highlightRecommendedPackage() {
    // Remove highlight from all packages
    document.querySelectorAll('.package-card').forEach(card => {
      card.classList.remove('recommended-package');

      // Remove any existing badges
      const existingBadge = card.querySelector('.absolute.top-0.right-0');
      if (existingBadge) {
        existingBadge.remove();
      }
    });

    // Get the recommended package element
    const recommendedPackageElement = document.getElementById('recommended-package');

    if (recommendedPackageElement) {
      // Add class to highlight
      recommendedPackageElement.classList.add('recommended-package');

      // Add a badge to the recommended package
      const badge = document.createElement('div');
      badge.className = 'absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1 rounded-bl-lg font-medium z-20';
      badge.innerHTML = '<i class="fas fa-thumbs-up mr-1"></i> AI Recommended';

      recommendedPackageElement.style.position = 'relative';
      recommendedPackageElement.appendChild(badge);

      // Scroll to the recommended package with a slight delay to ensure animations complete
      setTimeout(() => {
        recommendedPackageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Initialize
  updateBudgetDisplay();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
  }

  .recommended-package {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(79, 70, 229, 0.3) !important;
    border-color: rgba(79, 70, 229, 0.5) !important;
    z-index: 10;
    position: relative;
  }

  /* Custom slider styling */
  #budget-slider {
    -webkit-appearance: none;
    height: 12px;
    border-radius: 10px;
    outline: none;
  }

  #budget-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(to right, #10b981, #3b82f6);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 2;
  }

  #budget-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(to right, #10b981, #3b82f6);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 2;
  }

  .website-type-btn.active {
    background-color: rgba(79, 70, 229, 0.2) !important;
    border-color: rgba(79, 70, 229, 0.5) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
  }
`;
document.head.appendChild(style);
