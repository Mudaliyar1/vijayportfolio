/**
 * Interactive Demo for FTRAISE AI
 * Provides an interactive chat demo on the homepage
 */

document.addEventListener('DOMContentLoaded', function() {
  const demoContainer = document.getElementById('interactive-demo');
  if (!demoContainer) return;

  const demoMessages = [
    { role: 'user', content: 'What can FTRAISE AI do?' },
    { role: 'ai', content: 'I can help with a wide range of tasks! I can answer questions, generate creative content, assist with coding, provide information, and even generate images. Just ask me anything!' },
    { role: 'user', content: 'Can you speak multiple languages?' },
    { role: 'ai', content: 'Yes! I can detect and respond in multiple languages including English, Hindi, Tamil, and more. I maintain consistency in the language you choose to communicate with me.' },
    { role: 'user', content: 'Generate an image of a futuristic city' },
    { role: 'ai', content: 'I\'d be happy to help you generate an image of a futuristic city! With our image generation feature, you can create stunning visuals like cyberpunk cityscapes, flying cars, and neon-lit skyscrapers. Just head over to the Image Generation section to create this!' }
  ];

  const demoInput = demoContainer.querySelector('.demo-input');
  const demoSend = demoContainer.querySelector('.demo-send');
  const demoChat = demoContainer.querySelector('.demo-chat');
  const demoSuggestions = demoContainer.querySelector('.demo-suggestions');

  // Predefined suggestions
  const suggestions = [
    'What can FTRAISE AI do?',
    'Can you speak multiple languages?',
    'Generate an image of a futuristic city',
    'How does your memory system work?',
    'Tell me about your image generation'
  ];

  // Add suggestion buttons
  suggestions.forEach(suggestion => {
    const button = document.createElement('button');
    button.className = 'px-3 py-1 text-sm bg-dark-200 rounded-full hover:bg-dark-300 transition-colors whitespace-nowrap';
    button.textContent = suggestion;
    button.addEventListener('click', () => {
      demoInput.value = suggestion;
      demoInput.focus();
    });
    demoSuggestions.appendChild(button);
  });

  // Initialize with first two messages
  let currentMessageIndex = 0;
  
  function addMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`;
    
    const bubble = document.createElement('div');
    bubble.className = message.role === 'user' 
      ? 'bg-neon-blue/20 text-white rounded-lg py-2 px-4 max-w-[80%] border border-neon-blue/30' 
      : 'bg-dark-200 text-white rounded-lg py-2 px-4 max-w-[80%] border border-gray-700';
    
    // For AI messages, add typing effect
    if (message.role === 'ai') {
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'typing-indicator';
      typingIndicator.innerHTML = '<span></span><span></span><span></span>';
      bubble.appendChild(typingIndicator);
      
      messageElement.appendChild(bubble);
      demoChat.appendChild(messageElement);
      demoChat.scrollTop = demoChat.scrollHeight;
      
      // Simulate typing
      setTimeout(() => {
        bubble.removeChild(typingIndicator);
        bubble.textContent = message.content;
        demoChat.scrollTop = demoChat.scrollHeight;
      }, 1500);
    } else {
      bubble.textContent = message.content;
      messageElement.appendChild(bubble);
      demoChat.appendChild(messageElement);
      demoChat.scrollTop = demoChat.scrollHeight;
    }
  }

  // Add initial messages with delay
  addMessage(demoMessages[0]);
  
  setTimeout(() => {
    addMessage(demoMessages[1]);
    currentMessageIndex = 2;
  }, 1000);

  // Handle send button click
  demoSend.addEventListener('click', () => {
    const message = demoInput.value.trim();
    if (!message) return;
    
    // Clear input
    demoInput.value = '';
    
    // If we have predefined messages left, use the next one
    if (currentMessageIndex < demoMessages.length) {
      addMessage(demoMessages[currentMessageIndex]);
      currentMessageIndex++;
      
      // Add AI response after delay
      if (currentMessageIndex < demoMessages.length) {
        setTimeout(() => {
          addMessage(demoMessages[currentMessageIndex]);
          currentMessageIndex++;
        }, 1500);
      }
    } else {
      // Add user message
      addMessage({ role: 'user', content: message });
      
      // Generate a generic response
      setTimeout(() => {
        addMessage({ 
          role: 'ai', 
          content: 'That\'s a great question! To explore this further and get a complete response, please sign in and chat with me directly. I\'d be happy to help you with this and much more!'
        });
      }, 1500);
    }
  });

  // Handle enter key in input
  demoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      demoSend.click();
    }
  });

  // Make the demo chat scrollable horizontally for suggestions
  const suggestionContainer = demoContainer.querySelector('.demo-suggestions-container');
  if (suggestionContainer) {
    let isDown = false;
    let startX;
    let scrollLeft;

    suggestionContainer.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - suggestionContainer.offsetLeft;
      scrollLeft = suggestionContainer.scrollLeft;
    });

    suggestionContainer.addEventListener('mouseleave', () => {
      isDown = false;
    });

    suggestionContainer.addEventListener('mouseup', () => {
      isDown = false;
    });

    suggestionContainer.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - suggestionContainer.offsetLeft;
      const walk = (x - startX) * 2;
      suggestionContainer.scrollLeft = scrollLeft - walk;
    });
  }
});
