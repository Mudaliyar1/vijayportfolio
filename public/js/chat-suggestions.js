// Get random suggestions from our suggestion pools
function getRandomSuggestions() {
  // Define suggestion pools by category
  const suggestionPools = {
    general: [
      { text: 'What can you help me with?', icon: 'fa-lightbulb', iconColor: 'text-yellow-500' },
      { text: 'Tell me about FTRAISE AI', icon: 'fa-robot', iconColor: 'text-blue-500' },
      { text: 'What are your capabilities?', icon: 'fa-cogs', iconColor: 'text-gray-400' },
      { text: 'How do I use this chat?', icon: 'fa-question-circle', iconColor: 'text-green-500' },
      { text: 'What languages do you speak?', icon: 'fa-language', iconColor: 'text-purple-500' }
    ],
    coding: [
      { text: 'Write a Python function to sort a list', icon: 'fa-code', iconColor: 'text-blue-500' },
      { text: 'Create a JavaScript countdown timer', icon: 'fa-code', iconColor: 'text-blue-500' },
      { text: 'How to use async/await in JavaScript?', icon: 'fa-code', iconColor: 'text-blue-500' },
      { text: 'Explain React hooks with examples', icon: 'fa-code', iconColor: 'text-blue-500' },
      { text: 'Write a SQL query to join two tables', icon: 'fa-database', iconColor: 'text-blue-500' }
    ],
    knowledge: [
      { text: 'What are the latest tech trends?', icon: 'fa-newspaper', iconColor: 'text-green-500' },
      { text: 'Explain quantum computing', icon: 'fa-brain', iconColor: 'text-purple-500' },
      { text: 'How does blockchain work?', icon: 'fa-link', iconColor: 'text-yellow-500' },
      { text: 'What is machine learning?', icon: 'fa-robot', iconColor: 'text-blue-500' },
      { text: 'Explain NFTs in simple terms', icon: 'fa-image', iconColor: 'text-pink-500' }
    ],
    creative: [
      { text: 'Write a short story about time travel', icon: 'fa-book', iconColor: 'text-orange-500' },
      { text: 'Create a poem about nature', icon: 'fa-feather', iconColor: 'text-green-500' },
      { text: 'Generate a creative business name for a coffee shop', icon: 'fa-coffee', iconColor: 'text-yellow-500' },
      { text: 'Write a funny joke', icon: 'fa-laugh', iconColor: 'text-yellow-500' },
      { text: 'Create a riddle for me to solve', icon: 'fa-puzzle-piece', iconColor: 'text-purple-500' }
    ]
  };
  
  // Select one random suggestion from each category
  const selectedSuggestions = [];
  for (const category in suggestionPools) {
    const pool = suggestionPools[category];
    const randomIndex = Math.floor(Math.random() * pool.length);
    selectedSuggestions.push(pool[randomIndex]);
  }
  
  return selectedSuggestions;
}

// Update suggestions based on input
function updateSuggestions() {
  const autoSuggestions = document.getElementById('auto-suggestions');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const chatMessages = document.getElementById('chat-messages');
  const messageInput = document.getElementById('message-input');
  
  // Show suggestions if no chat messages yet
  if (chatMessages.children.length === 0) {
    // Clear previous suggestions
    suggestionsContainer.innerHTML = '';
    
    // Generate random suggestions from our suggestion pools
    const selectedSuggestions = getRandomSuggestions();
    
    // Add suggestions to the container
    selectedSuggestions.forEach(suggestion => {
      const button = document.createElement('button');
      button.className = 'suggestion-btn bg-dark-100 hover:bg-dark-300 text-gray-300 hover:text-white px-3 py-1.5 rounded-full text-sm transition-colors border border-gray-700 hover:border-gray-500';
      button.innerHTML = `<i class="fas ${suggestion.icon} ${suggestion.iconColor} mr-1.5"></i> ${suggestion.text}`;
      
      // Add click event to set the suggestion as the message
      button.addEventListener('click', () => {
        messageInput.value = suggestion.text;
        messageInput.focus();
        document.getElementById('improve-prompt-container').classList.remove('hidden');
      });
      
      suggestionsContainer.appendChild(button);
    });
    
    autoSuggestions.classList.remove('hidden');
  } else {
    autoSuggestions.classList.add('hidden');
  }
}

// Initialize suggestions when the page loads
document.addEventListener('DOMContentLoaded', () => {
  updateSuggestions();
});
