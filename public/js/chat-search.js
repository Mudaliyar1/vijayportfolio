// Chat History Search Functionality
document.addEventListener('DOMContentLoaded', function() {
  const historySearch = document.getElementById('history-search');
  const historyList = document.getElementById('history-list');
  
  if (!historySearch || !historyList) return;
  
  // Store all chat items for filtering
  let allChatItems = [];
  
  // Initialize after history is loaded
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Store all chat items after they're loaded
        allChatItems = Array.from(historyList.querySelectorAll('.chat-history-item'));
        
        // Initialize search functionality
        initSearch();
      }
    });
  });
  
  // Start observing the history list for changes
  observer.observe(historyList, { childList: true });
  
  // Initialize search functionality
  function initSearch() {
    historySearch.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase().trim();
      
      if (searchTerm === '') {
        // Show all items if search is empty
        allChatItems.forEach(item => {
          item.style.display = '';
        });
        return;
      }
      
      // Filter items based on search term
      allChatItems.forEach(item => {
        const title = item.querySelector('.chat-title').textContent.toLowerCase();
        const date = item.querySelector('.chat-date').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || date.includes(searchTerm)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
      
      // Show message if no results
      const visibleItems = allChatItems.filter(item => item.style.display !== 'none');
      
      if (visibleItems.length === 0) {
        // Add "no results" message if it doesn't exist
        let noResults = historyList.querySelector('.no-results');
        
        if (!noResults) {
          noResults = document.createElement('div');
          noResults.className = 'no-results flex justify-center items-center py-8 text-gray-500';
          noResults.innerHTML = `
            <div class="text-center">
              <i class="fas fa-search text-2xl mb-2"></i>
              <p>No chats found matching "${searchTerm}"</p>
            </div>
          `;
          historyList.appendChild(noResults);
        }
      } else {
        // Remove "no results" message if it exists
        const noResults = historyList.querySelector('.no-results');
        if (noResults) {
          noResults.remove();
        }
      }
    });
  }
});
