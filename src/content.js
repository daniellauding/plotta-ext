// Content script for page interaction
// This script runs on every page and can interact with the DOM

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelection') {
    const selection = window.getSelection().toString();
    sendResponse({ selection });
  }

  if (request.action === 'getPageInfo') {
    const pageInfo = {
      title: document.title,
      url: window.location.href,
      description: document.querySelector('meta[name="description"]')?.content || '',
      selectedText: window.getSelection().toString(),
    };
    sendResponse({ pageInfo });
  }

  return true; // Keep message channel open for async response
});

// Add keyboard shortcut listener (Cmd+Shift+S or Ctrl+Shift+S)
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 's') {
    e.preventDefault();

    const selection = window.getSelection().toString();

    // Send message to background to open popup with selection
    chrome.runtime.sendMessage({
      action: 'quickSave',
      data: {
        title: document.title,
        url: window.location.href,
        selection: selection,
      }
    });
  }
});

console.log('Plotta extension content script loaded');
