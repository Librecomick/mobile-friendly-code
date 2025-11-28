import { supabase } from './supabase-client.js';

const notLoggedIn = document.getElementById('not-logged-in');
const loggedIn = document.getElementById('logged-in');
const userEmail = document.getElementById('user-email');
const memberSince = document.getElementById('member-since');
const logoutBtn = document.getElementById('logout-btn');

// Check authentication status
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // User is logged in
    notLoggedIn.style.display = 'none';
    loggedIn.style.display = 'block';
    
    userEmail.textContent = user.email;
    
    // Format member since date
    const createdAt = new Date(user.created_at);
    memberSince.textContent = createdAt.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  } else {
    // User is not logged in
    notLoggedIn.style.display = 'flex';
    loggedIn.style.display = 'none';
  }
}

// Logout handler
logoutBtn.addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    window.location.href = '/';
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