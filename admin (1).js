import { supabase } from './supabase-client.js';

const form = document.getElementById('admin-form');
const messageEl = document.getElementById('message');
const submitBtn = document.getElementById('submit-btn');

// Check authentication - redirect if not logged in
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    window.location.href = 'auth.html';
  }
}

// Show message helper
function showMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.className = isError ? 'message error' : 'message success';
  messageEl.style.display = 'block';
}

// Clear message helper
function clearMessage() {
  messageEl.textContent = '';
  messageEl.style.display = 'none';
}

// Set loading state
function setLoading(isLoading) {
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = submitBtn.dataset.originalHtml;
  }
}

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(true);
  clearMessage();

  const mangaData = {
    folder_name: document.getElementById('folder-name').value.trim(),
    author: document.getElementById('author').value.trim(),
    status: document.getElementById('status').value,
    genre: document.getElementById('genre').value.trim() || null,
    description: document.getElementById('description').value.trim(),
    created_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from('manga_details')
      .insert([mangaData]);

    if (error) throw error;

    showMessage('✓ Successfully added manga! Redirecting...', false);
    form.reset();
    
    setTimeout(() => {
      window.location.href = `/detail?series=${encodeURIComponent(mangaData.folder_name)}`;
    }, 2000);
  } catch (error) {
    console.error('Error:', error);
    showMessage(`Error: ${error.message}`, true);
  } finally {
    setLoading(false);
  }
});

// Dropdown menu
const catToggle = document.getElementById('cat-toggle');
const catPanel = document.getElementById('cat-panel');

if (catToggle && catPanel) {
  catToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = catPanel.hasAttribute('hidden');
    if (isHidden) {
      catPanel.removeAttribute('hidden');
      catToggle.setAttribute('aria-expanded', 'true');
    } else {
      catPanel.setAttribute('hidden', '');
      catToggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('click', (e) => {
    if (!catToggle.contains(e.target) && !catPanel.contains(e.target)) {
      catPanel.setAttribute('hidden', '');
      catToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Search functionality
const searchInput = document.getElementById('global-search');
if (searchInput) {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

// Initialize
checkAuth();