import { supabase } from './supabase.js';

// State
let currentUser = null;
let selectedColor = '#fef08a';
let selectedPriority = 'medium';
let selectedTags = [];
let projects = [];
let defaultProjectId = null;

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const colorBtns = document.querySelectorAll('.color-btn');
const priorityBtns = document.querySelectorAll('[data-priority]');
const tagInput = document.getElementById('tag-input');
const selectedTagsContainer = document.getElementById('selected-tags');
const projectSelect = document.getElementById('project-select');
const capturePageBtn = document.getElementById('capture-page');
const captureSelectionBtn = document.getElementById('capture-selection');
const createBtn = document.getElementById('create-btn');
const messageEl = document.getElementById('message');

// Initialize
async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    currentUser = session.user;
    await loadProjects();
    showMainScreen();
  } else {
    showAuthScreen();
  }

  setupEventListeners();
}

function setupEventListeners() {
  // Auth
  loginBtn.addEventListener('click', handleLogin);
  signupBtn.addEventListener('click', handleSignup);
  logoutBtn.addEventListener('click', handleLogout);

  // Color selection
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedColor = btn.dataset.color;
    });
  });

  // Priority selection
  priorityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      priorityBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPriority = btn.dataset.priority;
    });
  });

  // Tags
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && tagInput.value.trim()) {
      e.preventDefault();
      addTag(tagInput.value.trim());
      tagInput.value = '';
    }
  });

  // Capture buttons
  capturePageBtn.addEventListener('click', captureCurrentPage);
  captureSelectionBtn.addEventListener('click', captureSelection);

  // Create sticky
  createBtn.addEventListener('click', createSticky);
}

// Auth functions
async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage('Please enter email and password', 'error');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    currentUser = data.user;
    await loadProjects();
    showMainScreen();
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

async function handleSignup() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage('Please enter email and password', 'error');
    return;
  }

  signupBtn.disabled = true;
  signupBtn.textContent = 'Signing up...';

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    showMessage('Check your email to confirm your account!', 'success');
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    signupBtn.disabled = false;
    signupBtn.textContent = 'Sign Up';
  }
}

async function handleLogout() {
  await supabase.auth.signOut();
  currentUser = null;
  projects = [];
  showAuthScreen();
}

// Projects
async function loadProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    projects = data || [];

    // Find or create default "Drafts" project
    let draftsProject = projects.find(p => p.name === 'Drafts');

    if (!draftsProject && projects.length === 0) {
      // Create default Drafts project
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
          name: 'Drafts',
          user_id: currentUser.id,
        })
        .select()
        .single();

      if (!createError && newProject) {
        draftsProject = newProject;
        projects.push(newProject);
      }
    }

    defaultProjectId = draftsProject ? draftsProject.id : (projects[0]?.id || null);

    // Populate select
    projectSelect.innerHTML = '';
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      if (project.id === defaultProjectId) {
        option.selected = true;
      }
      projectSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    showMessage('Failed to load projects', 'error');
  }
}

// Tags
function addTag(tagName) {
  if (selectedTags.includes(tagName)) return;

  selectedTags.push(tagName);
  renderTags();
}

function removeTag(tagName) {
  selectedTags = selectedTags.filter(t => t !== tagName);
  renderTags();
}

function renderTags() {
  selectedTagsContainer.innerHTML = selectedTags.map(tag => `
    <div class="tag">
      ${tag}
      <button onclick="window.removeTag('${tag}')">×</button>
    </div>
  `).join('');
}

// Make removeTag available globally for onclick
window.removeTag = removeTag;

// Capture functions
async function captureCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showMessage('Could not access current tab', 'error');
      return;
    }

    if (!titleInput.value) {
      titleInput.value = tab.title;
    }

    if (!contentInput.value) {
      contentInput.value = `# ${tab.title}\n\n${tab.url}\n\n`;
    }

    showMessage('Page info captured!', 'success');
  } catch (error) {
    showMessage('Failed to capture page: ' + error.message, 'error');
  }
}

async function captureSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showMessage('Could not access current tab', 'error');
      return;
    }

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString(),
    });

    if (result) {
      if (!contentInput.value) {
        contentInput.value = result;
      } else {
        contentInput.value += '\n\n' + result;
      }
      showMessage('Selection captured!', 'success');
    } else {
      showMessage('No text selected', 'error');
    }
  } catch (error) {
    showMessage('Failed to capture selection: ' + error.message, 'error');
  }
}

// Create sticky
async function createSticky() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const projectId = projectSelect.value;

  if (!title && !content) {
    showMessage('Please add a title or content', 'error');
    return;
  }

  if (!projectId) {
    showMessage('Please select a project', 'error');
    return;
  }

  createBtn.disabled = true;
  createBtn.textContent = 'Creating...';

  try {
    // Create sticky
    const { data: sticky, error: stickyError } = await supabase
      .from('stickies')
      .insert({
        title: title || 'Untitled',
        content: content,
        color: selectedColor,
        x: Math.random() * 200 + 100,
        y: Math.random() * 200 + 100,
        width: 300,
        height: 250,
        z_index: 0,
        is_locked: false,
        is_hidden: false,
        is_pinned: false,
        priority: selectedPriority,
        project_id: projectId,
        user_id: currentUser.id,
      })
      .select()
      .single();

    if (stickyError) throw stickyError;

    // Handle tags if any
    if (selectedTags.length > 0 && sticky) {
      // Get or create tags
      for (const tagName of selectedTags) {
        // Check if tag exists
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .eq('user_id', currentUser.id)
          .single();

        let tagId;

        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // Create new tag
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({
              name: tagName,
              user_id: currentUser.id,
            })
            .select()
            .single();

          if (tagError) {
            console.error('Error creating tag:', tagError);
            continue;
          }
          tagId = newTag.id;
        }

        // Link tag to sticky
        await supabase
          .from('sticky_tags')
          .insert({
            sticky_id: sticky.id,
            tag_id: tagId,
          });
      }
    }

    showMessage('Sticky note created successfully!', 'success');

    // Reset form
    setTimeout(() => {
      titleInput.value = '';
      contentInput.value = '';
      selectedTags = [];
      renderTags();
      messageEl.classList.add('hidden');
    }, 2000);

  } catch (error) {
    console.error('Error creating sticky:', error);
    showMessage('Failed to create sticky: ' + error.message, 'error');
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = 'Create Sticky Note';
  }
}

// UI functions
function showAuthScreen() {
  authScreen.classList.remove('hidden');
  mainScreen.classList.add('hidden');
}

function showMainScreen() {
  authScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
}

function showMessage(message, type = 'success') {
  messageEl.textContent = message;
  messageEl.className = `message ${type}`;

  setTimeout(() => {
    messageEl.classList.add('hidden');
  }, 3000);
}

// Start
init();
