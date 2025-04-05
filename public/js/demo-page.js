/**
 * Demo Page Interactions
 * Handles interactive elements on the demo page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Chat Demo Functionality
  initChatDemo();

  // Image Generation Demo Functionality
  initImageDemo();

  // Toggle switch functionality
  initToggleSwitches();

  // Style button selection
  initStyleButtons();

  // Initialize suggestion clicks
  initSuggestionClicks();

  // Initialize rate limit countdown
  initRateLimitCountdown();
});

/**
 * Initialize rate limit countdown
 */
function initRateLimitCountdown() {
  const countdownElement = document.getElementById('rate-limit-countdown');
  if (!countdownElement) return;

  // Set initial time (1 minute and 45 seconds)
  let minutes = 1;
  let seconds = 45;

  // Update countdown every second
  const countdownInterval = setInterval(() => {
    // Decrease seconds
    seconds--;

    // If seconds reach 0, decrease minutes and reset seconds
    if (seconds < 0) {
      minutes--;
      seconds = 59;
    }

    // If both minutes and seconds reach 0, reset the countdown
    if (minutes < 0) {
      minutes = 1;
      seconds = 45;
    }

    // Update the countdown display
    countdownElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, 1000);
}

/**
 * Initialize suggestion clicks
 */
function initSuggestionClicks() {
  // Chat demo suggestions
  document.querySelectorAll('.demo-suggestion').forEach(suggestion => {
    suggestion.addEventListener('click', function() {
      const chatInput = document.getElementById('chat-demo-input');
      if (chatInput) {
        // Set the input value based on the suggestion
        if (this.textContent === 'AI capabilities') {
          chatInput.value = 'What can FTRAISE AI do?';
        } else if (this.textContent === 'image generation') {
          chatInput.value = 'Tell me about image generation';
        } else if (this.textContent === 'supported languages') {
          chatInput.value = 'What languages do you support?';
        } else {
          chatInput.value = this.textContent;
        }

        // Focus the input
        chatInput.focus();

        // Trigger the send button after a short delay
        setTimeout(() => {
          const sendButton = document.getElementById('chat-demo-send');
          if (sendButton) {
            sendButton.click();
          }
        }, 500);
      }
    });
  });

  // Image demo suggestions
  document.querySelectorAll('.image-demo-suggestion').forEach(suggestion => {
    suggestion.addEventListener('click', function() {
      const imagePrompt = document.getElementById('image-demo-prompt');
      if (imagePrompt) {
        // Set the prompt value to the suggestion text (without quotes)
        imagePrompt.value = this.textContent.replace(/"/g, '');

        // Focus the prompt
        imagePrompt.focus();
      }
    });
  });

  // Make feature cards clickable
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', function() {
      // Add hover effect
      this.classList.add('transform', 'translateY(-5px)');
      this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';

      // Highlight the icon
      const icon = this.querySelector('.feature-icon');
      if (icon) {
        icon.classList.add('transform', 'scale-1.1');
      }

      // Reset after delay
      setTimeout(() => {
        this.classList.remove('transform', 'translateY(-5px)');
        this.style.boxShadow = '';

        if (icon) {
          icon.classList.remove('transform', 'scale-1.1');
        }
      }, 1500);
    });
  });

  // Initialize Advanced Search Demo
  initAdvancedSearchDemo();
}

/**
 * Initialize Advanced Search Demo
 */
function initAdvancedSearchDemo() {
  const searchInput = document.querySelector('.advanced-search-demo input[type="text"]');
  const searchButton = document.querySelector('.advanced-search-demo button');
  const searchResults = document.querySelector('.advanced-search-demo .search-results');
  const contentTypeSelect = document.querySelector('.advanced-search-demo select');
  const dateRangeSelect = document.querySelector('.advanced-search-demo select:nth-of-type(2)');
  const checkboxes = document.querySelectorAll('.advanced-search-demo input[type="checkbox"]');

  if (!searchInput || !searchButton) return;

  // Sample search results
  const sampleResults = {
    chat: [
      { type: 'chat', title: 'Conversation about AI capabilities', date: 'Yesterday' },
      { type: 'chat', title: 'Discussion about machine learning algorithms', date: 'Last week' },
      { type: 'chat', title: 'Chat about natural language processing', date: '2 weeks ago' },
      { type: 'chat', title: 'Conversation about AI ethics', date: 'Last month' }
    ],
    image: [
      { type: 'image', title: 'Generated image: "cyberpunk city at night"', date: '3 days ago' },
      { type: 'image', title: 'Generated image: "fantasy dragon in mountains"', date: 'Last week' },
      { type: 'image', title: 'Generated image: "futuristic space station"', date: '2 weeks ago' },
      { type: 'image', title: 'Generated image: "anime character with blue hair"', date: 'Last month' }
    ],
    user: [
      { type: 'user', title: 'User profile: john_doe', date: '1 week ago' },
      { type: 'user', title: 'User profile: ai_enthusiast', date: '2 weeks ago' },
      { type: 'user', title: 'User profile: tech_explorer', date: 'Last month' }
    ]
  };

  // Handle search button click
  if (searchButton) {
    searchButton.addEventListener('click', function() {
      performSearch();
    });
  }

  // Handle enter key in search input
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  // Handle checkbox clicks
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      // Toggle the visibility of the checkmark
      const checkmark = this.parentElement.querySelector('.w-2.h-2');
      if (checkmark) {
        if (this.checked) {
          checkmark.classList.remove('hidden');
          this.parentElement.querySelector('.w-4.h-4').classList.add('border-neon-purple');
          this.parentElement.querySelector('.w-4.h-4').classList.remove('border-gray-500');
        } else {
          checkmark.classList.add('hidden');
          this.parentElement.querySelector('.w-4.h-4').classList.remove('border-neon-purple');
          this.parentElement.querySelector('.w-4.h-4').classList.add('border-gray-500');
        }
      }
    });
  });

  // Function to perform search
  function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      alert('Please enter a search term');
      return;
    }

    // Show loading state
    if (searchButton) {
      const originalText = searchButton.innerHTML;
      searchButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Searching...';
      searchButton.disabled = true;

      // Simulate search delay
      setTimeout(() => {
        // Reset button
        searchButton.innerHTML = originalText;
        searchButton.disabled = false;

        // Get content type
        let contentType = 'all';
        if (contentTypeSelect) {
          contentType = contentTypeSelect.value.toLowerCase();
        }

        // Filter results based on content type
        let results = [];
        if (contentType === 'all content') {
          results = [...sampleResults.chat, ...sampleResults.image, ...sampleResults.user];
        } else if (contentType === 'chat history') {
          results = sampleResults.chat;
        } else if (contentType === 'generated images') {
          results = sampleResults.image;
        } else if (contentType === 'user profiles') {
          results = sampleResults.user;
        }

        // Filter results based on date range
        if (dateRangeSelect) {
          const dateRange = dateRangeSelect.value.toLowerCase();
          if (dateRange === 'last 24 hours') {
            results = results.filter(result => result.date === 'Yesterday' || result.date.includes('hours') || result.date.includes('hour'));
          } else if (dateRange === 'last 7 days') {
            results = results.filter(result => !result.date.includes('month') && !result.date.includes('weeks'));
          } else if (dateRange === 'last 30 days') {
            results = results.filter(result => !result.date.includes('month'));
          }
        }

        // Display results
        if (searchResults) {
          // Clear previous results
          searchResults.innerHTML = '';

          // Add result count
          const resultCount = document.createElement('div');
          resultCount.className = 'flex justify-between items-center mb-2';
          resultCount.innerHTML = `
            <h5 class="font-medium">Search Results</h5>
            <span class="text-sm text-gray-400">${results.length} results found</span>
          `;
          searchResults.appendChild(resultCount);

          // Add results
          const resultsList = document.createElement('div');
          resultsList.className = 'space-y-2';

          if (results.length === 0) {
            resultsList.innerHTML = '<div class="text-center text-gray-400 py-4">No results found</div>';
          } else {
            results.forEach(result => {
              const resultItem = document.createElement('div');
              resultItem.className = 'bg-dark-300 p-3 rounded-md hover:bg-dark-400 transition-colors cursor-pointer';

              let icon = 'comments';
              let iconColor = 'text-neon-purple';

              if (result.type === 'image') {
                icon = 'image';
                iconColor = 'text-neon-pink';
              } else if (result.type === 'user') {
                icon = 'user';
                iconColor = 'text-neon-blue';
              }

              resultItem.innerHTML = `
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <i class="fas fa-${icon} ${iconColor} mr-2"></i>
                    <span>${result.title}</span>
                  </div>
                  <span class="text-xs text-gray-400">${result.date}</span>
                </div>
              `;

              resultsList.appendChild(resultItem);
            });
          }

          searchResults.appendChild(resultsList);
        }
      }, 1500);
    }
  }
}

/**
 * Initialize the Chat Demo
 */
function initChatDemo() {
  const chatInput = document.getElementById('chat-demo-input');
  const chatSend = document.getElementById('chat-demo-send');
  const chatMessages = document.getElementById('chat-demo-messages');

  if (!chatInput || !chatSend || !chatMessages) return;

  // Sample responses for demo with more specific content
  const sampleResponses = {
    default: [
      "I'd be happy to help with that! Could you provide more details about what you're looking for?",
      "That's an interesting question. Based on my knowledge, there are several perspectives to consider...",
      "I understand what you're asking. Here's what I can tell you about that topic...",
      "Great question! The answer involves several factors that we should explore...",
      "I can definitely assist with that. Let me provide some information that might be helpful..."
    ],
    greeting: [
      "Hello! It's great to meet you. How can I assist you today?",
      "Hi there! I'm FTRAISE AI, your intelligent assistant. What can I help you with?",
      "Welcome to FTRAISE AI! I'm here to answer your questions and assist with various tasks."
    ],
    ai: [
      "Artificial Intelligence refers to computer systems designed to perform tasks that typically require human intelligence. These include learning, reasoning, problem-solving, perception, and language understanding. AI systems can be narrow (designed for specific tasks) or general (designed to perform any intellectual task a human can). At FTRAISE AI, we use advanced neural networks and machine learning to provide intelligent responses and generate creative content.",
      "AI or Artificial Intelligence is the simulation of human intelligence in machines. Modern AI systems like me use deep learning and neural networks to process vast amounts of data and learn patterns. This allows me to understand natural language, generate responses, and even create images based on text descriptions. The field is rapidly evolving, with new capabilities being developed regularly."
    ],
    image: [
      "FTRAISE AI can generate stunning images based on your text descriptions. You can specify styles like anime, cyberpunk, or photorealistic, and our AI will create images that match your vision. You can also upload reference images to guide the generation process. To try this feature, head over to the Image Generation section or create an account to access the full functionality.",
      "Our image generation system uses advanced AI models to create images from text prompts. You can describe anything from fantasy landscapes to futuristic cities, and the AI will visualize it for you. The system also supports various artistic styles and can enhance your prompts automatically for better results. This demo gives you a preview, but the full version offers even more capabilities."
    ],
    languages: [
      "Yes, I can communicate in multiple languages including English, Hindi, Tamil, and more! I can detect the language you're using and respond accordingly. For example: नमस्ते, आप कैसे हैं? (Hello, how are you in Hindi) or வணக்கம், எப்படி இருக்கிறீர்கள்? (Hello, how are you in Tamil). Feel free to chat with me in your preferred language!",
      "FTRAISE AI supports multiple languages including English, Hindi, Tamil, and several others. Our system automatically detects the language you're using and maintains consistency throughout the conversation. This makes our AI accessible to users worldwide and helps bridge language barriers."
    ],
    features: [
      "FTRAISE AI offers numerous features including: 1) Advanced AI chat with context memory, 2) Image generation in various styles, 3) Multilingual support, 4) User profiles with customization options, 5) Chat history with search functionality, 6) Smart rate limiting for fair usage, and 7) Responsive design for all devices. You can explore these features through our interactive demos or by creating an account.",
      "Some of our key features include intelligent conversations with memory of context, stunning image generation capabilities, support for multiple languages, personalized user profiles, searchable chat history, and a responsive design that works on all devices. The platform is constantly evolving with new features being added regularly."
    ]
  };

  // Automated demo messages to show after page load
  const automatedDemo = [
    { role: 'user', content: 'Hello! What can you do?', delay: 1000 },
    { role: 'ai', content: sampleResponses.greeting[0], delay: 2500 },
    { role: 'user', content: 'Tell me about AI', delay: 2000 },
    { role: 'ai', content: sampleResponses.ai[0], delay: 3000 }
  ];

  // Start automated demo
  let demoIndex = 0;
  function playNextDemoMessage() {
    if (demoIndex < automatedDemo.length) {
      const message = automatedDemo[demoIndex];

      if (message.role === 'user') {
        // Show user message
        addChatMessage('user', message.content);
        demoIndex++;
        setTimeout(playNextDemoMessage, message.delay);
      } else {
        // Show typing indicator for AI
        showTypingIndicator();

        // Show AI message after delay
        setTimeout(() => {
          // Remove typing indicator
          const typingIndicator = chatMessages.querySelector('.typing-indicator-container');
          if (typingIndicator) {
            chatMessages.removeChild(typingIndicator);
          }

          // Add AI response
          addChatMessage('ai', message.content);
          demoIndex++;
          setTimeout(playNextDemoMessage, 500);
        }, message.delay);
      }
    }
  }

  // Start automated demo after a short delay
  setTimeout(playNextDemoMessage, 1000);

  // Handle send button click
  chatSend.addEventListener('click', function() {
    sendChatMessage();
  });

  // Handle enter key in input
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });

  // Function to send a message
  function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addChatMessage('user', message);

    // Clear input
    chatInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Determine response based on message content
    let responseCategory = 'default';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      responseCategory = 'greeting';
    } else if (lowerMessage.includes('artificial intelligence') || lowerMessage.includes(' ai ') || lowerMessage === 'ai' || lowerMessage.includes('what is ai')) {
      responseCategory = 'ai';
    } else if (lowerMessage.includes('image') || lowerMessage.includes('picture') || lowerMessage.includes('generate image')) {
      responseCategory = 'image';
    } else if (lowerMessage.includes('language') || lowerMessage.includes('hindi') || lowerMessage.includes('tamil') || lowerMessage.includes('speak')) {
      responseCategory = 'languages';
    } else if (lowerMessage.includes('feature') || lowerMessage.includes('what can you do') || lowerMessage.includes('capabilities')) {
      responseCategory = 'features';
    }

    // Simulate AI response after delay
    setTimeout(function() {
      // Remove typing indicator
      const typingIndicator = chatMessages.querySelector('.typing-indicator-container');
      if (typingIndicator) {
        chatMessages.removeChild(typingIndicator);
      }

      // Get appropriate response
      const responses = sampleResponses[responseCategory];
      const response = responses[Math.floor(Math.random() * responses.length)];

      // Add AI response
      addChatMessage('ai', response);
    }, 1500);
  }

  // Function to add a message to the chat
  function addChatMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = role === 'user' ? 'flex justify-end mb-4' : 'flex mb-4';

    const bubble = document.createElement('div');
    bubble.className = role === 'user'
      ? 'bg-neon-blue/20 text-white rounded-lg py-2 px-4 max-w-[80%] border border-neon-blue/30'
      : 'bg-dark-200 text-white rounded-lg py-2 px-4 max-w-[80%] border border-gray-700';
    bubble.textContent = content;

    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Function to show typing indicator
  function showTypingIndicator() {
    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'flex mb-4 typing-indicator-container';

    const bubble = document.createElement('div');
    bubble.className = 'bg-dark-200 text-white rounded-lg py-2 px-4 border border-gray-700';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';

    bubble.appendChild(typingIndicator);
    indicatorDiv.appendChild(bubble);
    chatMessages.appendChild(indicatorDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

/**
 * Initialize the Image Generation Demo
 */
function initImageDemo() {
  const imagePrompt = document.getElementById('image-demo-prompt');
  const imageGenerate = document.getElementById('image-demo-generate');
  const enhanceToggle = document.getElementById('image-demo-enhance');
  const imageGallery = document.querySelector('.image-demo-gallery');

  if (!imagePrompt || !imageGenerate) return;

  // Sample prompts for the demo
  const samplePrompts = [
    "A futuristic cyberpunk city with neon lights and flying cars",
    "A majestic dragon soaring over a fantasy landscape",
    "An anime-style character with blue hair and futuristic outfit",
    "A space station orbiting a distant planet with stars in the background"
  ];

  // Automated demo - fill in a prompt after a delay
  setTimeout(() => {
    if (imagePrompt) {
      // Select a random prompt
      const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];

      // Type the prompt character by character
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < randomPrompt.length) {
          imagePrompt.value += randomPrompt.charAt(i);
          i++;
        } else {
          clearInterval(typeInterval);

          // Activate a style button after typing is complete
          setTimeout(() => {
            const styleButtons = document.querySelectorAll('.style-btn');
            if (styleButtons.length > 0) {
              // Choose a random style button
              const randomStyle = styleButtons[Math.floor(Math.random() * styleButtons.length)];
              randomStyle.click();

              // Toggle enhance prompt after style selection
              setTimeout(() => {
                if (enhanceToggle) {
                  enhanceToggle.checked = true;
                  const changeEvent = new Event('change');
                  enhanceToggle.dispatchEvent(changeEvent);

                  // Click generate button after all preparations
                  setTimeout(() => {
                    if (imageGenerate) {
                      imageGenerate.click();
                    }
                  }, 1000);
                }
              }, 800);
            }
          }, 500);
        }
      }, 50);
    }
  }, 2000);

  // Handle generate button click
  imageGenerate.addEventListener('click', function() {
    const prompt = imagePrompt.value.trim();
    if (!prompt) {
      alert('Please enter a description of the image you want to generate.');
      return;
    }

    // Show generating state
    const originalText = imageGenerate.innerHTML;
    imageGenerate.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
    imageGenerate.disabled = true;

    // Create progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'w-full bg-dark-200 rounded-full h-2.5 mb-4 mt-4';
    progressContainer.innerHTML = '<div class="progress-bar bg-gradient-to-r from-neon-purple to-neon-pink h-2.5 rounded-full" style="width: 0%"></div>';

    // Add progress bar to the page
    const progressArea = document.querySelector('.image-demo-progress');
    if (progressArea) {
      progressArea.innerHTML = '';
      progressArea.appendChild(progressContainer);

      // Animate progress bar
      const progressBar = progressContainer.querySelector('.progress-bar');
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progress <= 100) {
          progressBar.style.width = `${progress}%`;
        } else {
          clearInterval(progressInterval);
        }
      }, 100);
    }

    // Simulate generation delay
    setTimeout(function() {
      // Reset button
      imageGenerate.innerHTML = originalText;
      imageGenerate.disabled = false;

      // Remove progress bar
      if (progressArea) {
        progressArea.innerHTML = '<div class="text-center text-green-500 mb-4"><i class="fas fa-check-circle mr-2"></i>Image generated successfully!</div>';
      }

      // Show the "generated" image
      if (imageGallery) {
        // Create a new image element
        const newImage = document.createElement('div');
        newImage.className = 'image-demo-item';

        // Determine which image to show based on prompt
        let imageSrc = 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=500&auto=format&fit=crop&q=60';
        let imageAlt = 'Cyberpunk city';
        let imageDesc = 'Cyberpunk city with neon lights and flying cars';

        if (prompt.toLowerCase().includes('dragon') || prompt.toLowerCase().includes('fantasy')) {
          imageSrc = 'https://images.unsplash.com/photo-1577493340887-b7bfff550145?w=500&auto=format&fit=crop&q=60';
          imageAlt = 'Fantasy dragon';
          imageDesc = 'Majestic dragon soaring over a fantasy landscape';
        } else if (prompt.toLowerCase().includes('anime') || prompt.toLowerCase().includes('character')) {
          imageSrc = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60';
          imageAlt = 'Anime character';
          imageDesc = 'Anime-style character with blue hair and futuristic outfit';
        } else if (prompt.toLowerCase().includes('space') || prompt.toLowerCase().includes('station') || prompt.toLowerCase().includes('planet')) {
          imageSrc = 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=500&auto=format&fit=crop&q=60';
          imageAlt = 'Space station';
          imageDesc = 'Futuristic space station orbiting a distant planet';
        }

        // Set the image content
        newImage.innerHTML = `
          <div class="h-48 rounded-lg border border-neon-blue/30 hover:border-neon-blue transition-all duration-300 overflow-hidden">
            <img src="${imageSrc}" alt="${imageAlt}" class="w-full h-full object-cover">
          </div>
          <div class="mt-2 text-sm text-center text-gray-300">${imageDesc}</div>
        `;

        // Add animation to the image
        const img = newImage.querySelector('img');
        if (img) {
          // Add initial animation
          img.style.transform = 'scale(0)';
          img.style.opacity = '0';

          // Animate image appearance
          setTimeout(() => {
            img.style.transition = 'all 0.5s ease-out';
            img.style.transform = 'scale(1.05)';
            img.style.opacity = '1';

            // Scale back to normal size
            setTimeout(() => {
              img.style.transform = 'scale(1)';
            }, 300);
          }, 100);
        }

        // Add the new image to the beginning of the gallery
        imageGallery.insertBefore(newImage, imageGallery.firstChild);

        // Highlight the new image
        newImage.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.7)';
        setTimeout(() => {
          newImage.style.boxShadow = '';
        }, 2000);
      }

      // Clear the prompt after a delay
      setTimeout(() => {
        imagePrompt.value = '';

        // Reset style buttons
        document.querySelectorAll('.style-btn').forEach(btn => {
          btn.classList.remove('bg-neon-purple', 'text-white');
          btn.classList.add('bg-dark-200');
        });

        // Reset enhance toggle
        if (enhanceToggle && enhanceToggle.checked) {
          enhanceToggle.checked = false;
          const changeEvent = new Event('change');
          enhanceToggle.dispatchEvent(changeEvent);
        }

        // Remove success message after a delay
        setTimeout(() => {
          if (progressArea) {
            progressArea.innerHTML = '';
          }
        }, 3000);
      }, 1000);
    }, 4000); // Longer delay to simulate image generation
  });

  // Handle enhance toggle
  if (enhanceToggle) {
    enhanceToggle.addEventListener('change', function() {
      const dot = enhanceToggle.parentElement.querySelector('.dot');
      if (enhanceToggle.checked) {
        dot.classList.add('transform', 'translate-x-5', 'bg-neon-green');
        dot.classList.remove('bg-gray-400');
      } else {
        dot.classList.remove('transform', 'translate-x-5', 'bg-neon-green');
        dot.classList.add('bg-gray-400');
      }
    });
  }
}

/**
 * Initialize toggle switches
 */
function initToggleSwitches() {
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    if (!checkbox.id.includes('enhance')) return;

    checkbox.addEventListener('change', function() {
      const dot = this.parentElement.querySelector('.dot');
      if (this.checked) {
        dot.classList.add('transform', 'translate-x-5', 'bg-neon-green');
        dot.classList.remove('bg-gray-400');
      } else {
        dot.classList.remove('transform', 'translate-x-5', 'bg-neon-green');
        dot.classList.add('bg-gray-400');
      }
    });
  });

  // Initialize profile demo automation
  initProfileDemo();
}

/**
 * Initialize the Profile Demo
 */
function initProfileDemo() {
  // Get profile form elements
  const displayNameInput = document.querySelector('.profile-demo-container input[type="text"]');
  const emailInput = document.querySelector('.profile-demo-container input[type="email"]');
  const languageSelect = document.querySelector('.profile-demo-container select');
  const saveButton = document.querySelector('.profile-demo-save');

  // Get dashboard elements
  const dashboardItems = document.querySelectorAll('.bg-dark-200/50.p-2');
  const dashboardImages = document.querySelectorAll('.aspect-square');

  if (!displayNameInput || !emailInput || !languageSelect || !saveButton) return;

  // Automated demo sequence
  setTimeout(() => {
    // Animate changing the display name
    if (displayNameInput) {
      displayNameInput.focus();
      displayNameInput.value = '';

      // Type new name character by character
      const newName = 'John Doe';
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < newName.length) {
          displayNameInput.value += newName.charAt(i);
          i++;
        } else {
          clearInterval(typeInterval);
          displayNameInput.blur();

          // Move to language selection after name change
          setTimeout(() => {
            if (languageSelect) {
              languageSelect.focus();
              languageSelect.selectedIndex = 2; // Select Tamil

              // Trigger change event
              const changeEvent = new Event('change');
              languageSelect.dispatchEvent(changeEvent);

              // Move to save button after language selection
              setTimeout(() => {
                languageSelect.blur();

                if (saveButton) {
                  // Highlight save button
                  saveButton.classList.add('animate-pulse');

                  // Click save button
                  setTimeout(() => {
                    saveButton.click();
                    saveButton.classList.remove('animate-pulse');

                    // Show success message
                    const successMessage = document.createElement('div');
                    successMessage.className = 'text-center text-green-500 mt-4';
                    successMessage.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Profile updated successfully!';

                    // Add success message after save button
                    saveButton.parentNode.appendChild(successMessage);

                    // Remove success message after delay
                    setTimeout(() => {
                      if (successMessage.parentNode) {
                        successMessage.parentNode.removeChild(successMessage);
                      }
                    }, 3000);

                    // Highlight dashboard items
                    setTimeout(() => {
                      // Highlight dashboard items one by one
                      dashboardItems.forEach((item, index) => {
                        setTimeout(() => {
                          item.classList.add('bg-dark-200');
                          setTimeout(() => {
                            item.classList.remove('bg-dark-200');
                          }, 800);
                        }, index * 1000);
                      });

                      // Highlight dashboard images one by one
                      dashboardImages.forEach((image, index) => {
                        setTimeout(() => {
                          image.style.transform = 'scale(1.1)';
                          setTimeout(() => {
                            image.style.transform = '';
                          }, 800);
                        }, index * 1000 + 500);
                      });
                    }, 1000);
                  }, 1000);
                }
              }, 1000);
            }
          }, 1000);
        }
      }, 100);
    }
  }, 3000);

  // Handle save button click
  if (saveButton) {
    saveButton.addEventListener('click', function(e) {
      e.preventDefault();

      // Show saving state
      const originalText = this.textContent;
      this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
      this.disabled = true;

      // Simulate saving delay
      setTimeout(() => {
        // Reset button
        this.innerHTML = '<i class="fas fa-check mr-2"></i>Saved!';

        // Reset button after delay
        setTimeout(() => {
          this.innerHTML = originalText;
          this.disabled = false;
        }, 1500);
      }, 1500);
    });
  }
}

/**
 * Initialize style buttons
 */
function initStyleButtons() {
  const styleButtons = document.querySelectorAll('.style-btn');

  styleButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Toggle active state
      styleButtons.forEach(btn => {
        btn.classList.remove('bg-neon-purple', 'text-white');
        btn.classList.add('bg-dark-200');
      });

      this.classList.remove('bg-dark-200');
      this.classList.add('bg-neon-purple', 'text-white');

      // Get the prompt input
      const promptInput = document.getElementById('image-demo-prompt');
      if (promptInput) {
        // Add style to prompt if not empty
        const currentPrompt = promptInput.value.trim();
        if (currentPrompt) {
          // Check if a style is already mentioned
          const styleRegex = /in (ghibli|pixar|anime|cyberpunk|fantasy|photorealistic|oil painting|watercolor) style/i;
          if (styleRegex.test(currentPrompt)) {
            // Replace existing style
            promptInput.value = currentPrompt.replace(styleRegex, `in ${this.textContent.trim()} style`);
          } else {
            // Add style to the end
            promptInput.value = `${currentPrompt} in ${this.textContent.trim()} style`;
          }
        }
      }
    });
  });

  // Initialize other features demo
  initFeaturesDemo();
}

/**
 * Initialize the Other Features Demo
 */
function initFeaturesDemo() {
  // Get multilingual demo elements
  const multilingualTryButtons = document.querySelectorAll('.bg-dark-200/50 button');

  // Get memory system demo elements
  const memoryDemoItems = document.querySelectorAll('.bg-dark-200/50.p-4 .space-y-3.text-sm > div');

  // Get feature cards
  const featureCards = document.querySelectorAll('.feature-card');

  // Animate multilingual examples
  if (multilingualTryButtons && multilingualTryButtons.length > 0) {
    // Highlight each language example one by one
    setTimeout(() => {
      multilingualTryButtons.forEach((button, index) => {
        setTimeout(() => {
          // Highlight the button
          button.classList.add('text-neon-blue');

          // Highlight the parent container
          const container = button.closest('.bg-dark-200/50');
          if (container) {
            container.style.borderColor = 'rgba(0, 242, 255, 0.3)';
            container.style.boxShadow = '0 0 10px rgba(0, 242, 255, 0.2)';

            // Reset after delay
            setTimeout(() => {
              button.classList.remove('text-neon-blue');
              container.style.borderColor = '';
              container.style.boxShadow = '';
            }, 1500);
          }
        }, index * 2000);
      });
    }, 2000);
  }

  // Animate memory system example
  if (memoryDemoItems && memoryDemoItems.length > 0) {
    setTimeout(() => {
      // Highlight each conversation line one by one
      memoryDemoItems.forEach((item, index) => {
        setTimeout(() => {
          // Highlight the item
          item.style.backgroundColor = 'rgba(0, 242, 255, 0.1)';
          item.style.borderLeft = '2px solid rgba(0, 242, 255, 0.5)';
          item.style.paddingLeft = '8px';

          // Reset after delay
          setTimeout(() => {
            item.style.backgroundColor = '';
            item.style.borderLeft = '';
            item.style.paddingLeft = '';
          }, 1500);
        }, index * 1500);
      });
    }, 8000); // Start after multilingual demo
  }

  // Animate feature cards
  if (featureCards && featureCards.length > 0) {
    setTimeout(() => {
      // Highlight each feature card one by one
      featureCards.forEach((card, index) => {
        setTimeout(() => {
          // Add hover effect
          card.classList.add('transform', 'translateY(-5px)');
          card.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';

          // Highlight the icon
          const icon = card.querySelector('.feature-icon');
          if (icon) {
            icon.classList.add('transform', 'scale-1.1');
          }

          // Reset after delay
          setTimeout(() => {
            card.classList.remove('transform', 'translateY(-5px)');
            card.style.boxShadow = '';

            if (icon) {
              icon.classList.remove('transform', 'scale-1.1');
            }
          }, 1500);
        }, index * 1000);
      });
    }, 18000); // Start after memory system demo
  }
}
