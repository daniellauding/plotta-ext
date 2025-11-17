import { supabase } from './supabase.js';

// Create context menu for right-click capture
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-plotta',
    title: 'Save to Plotta',
    contexts: ['selection', 'page', 'link', 'image'],
  });

  chrome.contextMenus.create({
    id: 'save-selection-to-plotta',
    title: 'Save selection to Plotta',
    contexts: ['selection'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-plotta' || info.menuItemId === 'save-selection-to-plotta') {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Show popup to login
      chrome.action.openPopup();
      return;
    }

    // Prepare sticky data
    let content = '';
    let title = '';

    if (info.selectionText) {
      content = info.selectionText;
      title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    } else if (info.linkUrl) {
      content = `[${info.linkUrl}](${info.linkUrl})`;
      title = 'Saved Link';
    } else if (info.srcUrl) {
      content = `![Image](${info.srcUrl})`;
      title = 'Saved Image';
    } else {
      title = tab.title;
      content = `# ${tab.title}\n\n${tab.url}`;
    }

    // Get user's default project
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!projects || projects.length === 0) {
      console.error('No projects found');
      return;
    }

    const projectId = projects[0].id;

    // Create sticky
    try {
      await supabase
        .from('stickies')
        .insert({
          title: title,
          content: content,
          color: '#fef08a',
          x: Math.random() * 200 + 100,
          y: Math.random() * 200 + 100,
          width: 300,
          height: 250,
          z_index: 0,
          is_locked: false,
          is_hidden: false,
          is_pinned: false,
          priority: 'medium',
          project_id: projectId,
          user_id: session.user.id,
        });

      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Saved to Plotta',
        message: 'Your note has been saved successfully!',
      });
    } catch (error) {
      console.error('Error creating sticky:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Error',
        message: 'Failed to save note: ' + error.message,
      });
    }
  }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session);
});
