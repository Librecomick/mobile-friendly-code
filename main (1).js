import { supabase, BUCKET_NAME, getStorageBaseUrl, isConfigured } from './supabase-client.js';

let baseUrl = '';

// Initialize
async function init() {
  if (!isConfigured()) {
    document.getElementById('notice').classList.remove('hidden');
    showError('Please configure Supabase in supabase-client.js');
    return;
  }

  baseUrl = getStorageBaseUrl();
  await loadAllContent();
}

// Show error message
function showError(message) {
  document.querySelectorAll('.status-message').forEach(el => {
    el.textContent = message;
  });
}

// Find cover image for a series
async function findCoverImage(seriesPath) {
  try {
    const coverPath = `${seriesPath}/cover`;
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list(coverPath, {
      limit: 1,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (error || !data || data.length === 0) {
      return 'https://placehold.co/160x220/1a202c/94a3b8?text=No+Cover';
    }
    
    // Properly encode the URI to handle special characters
    const imagePath = `${coverPath}/${data[0].name}`;
    return baseUrl + encodeURI(imagePath).replace(/#/g, '%23');
  } catch (error) {
    console.error('Error finding cover:', error);
    return 'https://placehold.co/160x220/1a202c/94a3b8?text=Error';
  }
}

// Sanitize text for display (XSS prevention)
function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load all content
async function loadAllContent() {
  try {
    const { data: topLevel, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 100 });

    if (error) {
      console.error('Error loading content:', error);
      showError('Error loading content from Supabase');
      return;
    }

    // Filter only folders (directories have id === null)
    const seriesFolders = topLevel.filter(item => item.id === null);

    if (seriesFolders.length === 0) {
      showError('No series found in bucket');
      return;
    }

    // Load all sections
    await Promise.all([
      loadMainGrid(seriesFolders),
      loadFollowedCards(seriesFolders.slice(0, 15)),
      loadTrendingCards(seriesFolders.slice(0, 15)),
      loadMostFollowedCards(seriesFolders.slice(0, 15)),
      loadTrendingSidebarList(seriesFolders.slice(0, 5)),
      loadRecentList(seriesFolders.slice(0, 5)),
      loadPopularList(seriesFolders.slice(0, 10))
    ]);
  } catch (error) {
    console.error('Error in loadAllContent:', error);
    showError('An error occurred while loading content');
  }
}

// Load main grid
async function loadMainGrid(series) {
  const grid = document.getElementById('updates-all');
  grid.innerHTML = '';

  const displaySeries = series.slice(0, 12);
  
  for (const s of displaySeries) {
    const coverUrl = await findCoverImage(s.name);
    const safeName = sanitizeText(s.name);
    
    const card = document.createElement('a');
    card.href = `/details?series=${encodeURIComponent(s.name)}`;
    card.className = 'grid-card';

    card.innerHTML = `
      <img src="${coverUrl}" alt="${safeName}" loading="lazy" onerror="this.src='https://placehold.co/160x220/1a202c/94a3b8?text=Error'" />
      <div class="meta">
        <div class="title">${safeName.replace(/[-_]/g, ' ')}</div>
        <div class="line muted">Updated recently</div>
      </div>
    `;

    grid.appendChild(card);
  }
}

// Load followed cards
async function loadFollowedCards(series) {
  const container = document.getElementById('followed-cards');
  container.innerHTML = '';

  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    const coverUrl = await findCoverImage(s.name);
    const safeName = sanitizeText(s.name);
    
    const card = document.createElement('a');
    card.href = `/details?series=${encodeURIComponent(s.name)}`;
    card.className = 'card';

    card.innerHTML = `
      <span class="rank">${i + 1}</span>
      <img src="${coverUrl}" alt="${safeName}" loading="lazy" onerror="this.src='https://placehold.co/160x220/1a202c/94a3b8?text=Error'" />
      <div class="meta">
        <div class="title">${safeName.replace(/[-_]/g, ' ')}</div>
      </div>
    `;

    container.appendChild(card);
  }
  
  const arrow = document.querySelector('[data-target="followed-cards"]');
  if (arrow) arrow.classList.remove('hidden');
}

// Load trending cards
async function loadTrendingCards(series) {
  const container = document.getElementById('trending-cards');
  container.innerHTML = '';

  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    const coverUrl = await findCoverImage(s.name);
    const safeName = sanitizeText(s.name);
    
    const card = document.createElement('a');
    card.href = `/details?series=${encodeURIComponent(s.name)}`;
    card.className = 'card';

    card.innerHTML = `
      <span class="rank">${i + 1}</span>
      <img src="${coverUrl}" alt="${safeName}" loading="lazy" onerror="this.src='https://placehold.co/160x220/1a202c/94a3b8?text=Error'" />
      <div class="meta">
        <div class="title">${safeName.replace(/[-_]/g, ' ')}</div>
        <div class="line muted">Updated • ${Math.floor(Math.random() * 24)}h</div>
      </div>
    `;

    container.appendChild(card);
  }
  
  const arrow = document.querySelector('[data-target="trending-cards"]');
  if (arrow) arrow.classList.remove('hidden');
}

// Load most followed cards
async function loadMostFollowedCards(series) {
  const container = document.getElementById('most-followed-cards');
  container.innerHTML = '';

  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    const coverUrl = await findCoverImage(s.name);
    const safeName = sanitizeText(s.name);
    
    const card = document.createElement('a');
    card.href = `/details?series=${encodeURIComponent(s.name)}`;
    card.className = 'card';

    card.innerHTML = `
      <span class="rank">${i + 1}</span>
      <img src="${coverUrl}" alt="${safeName}" loading="lazy" onerror="this.src='https://placehold.co/160x220/1a202c/94a3b8?text=Error'" />
      <div class="meta">
        <div class="title">${safeName.replace(/[-_]/g, ' ')}</div>
      </div>
    `;

    container.appendChild(card);
  }
  
  const arrow = document.querySelector('[data-target="most-followed-cards"]');
  if (arrow) arrow.classList.remove('hidden');
}

// Load recent list (sidebar)
async function loadRecentList(series) {
  const list = document.getElementById('recent-list');
  list.innerHTML = '';

  for (const s of series) {
    const coverUrl = await findCoverImage(s.name);
    const safeName = sanitizeText(s.name);
    
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="/details?series=${encodeURIComponent(s.name)}">
        <img src="${coverUrl}" alt="${safeName}" onerror="this.src='https://placehold.co/40x56/1a202c/94a3b8?text=No+Cover'" />
        <span>${safeName.replace(/[-_]/g, ' ')}</span>
      </a>
    `;
    
    list.appendChild(li);
  }
}

// Load trending sidebar list
async function loadTrendingSidebarList(series) {
  const list = document.getElementById('trending-sidebar-list');
  if (!list) return;
  
  list.innerHTML = '';

  for (const s of series) {
    const coverUrl = await findCoverImage(s.name);
    const safeName = sanitizeText(s.name);
    
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="/details?series=${encodeURIComponent(s.name)}">
        <img src="${coverUrl}" alt="${safeName}" onerror="this.src='https://placehold.co/40x56/1a202c/94a3b8?text=No+Cover'" />
        <span>${safeName.replace(/[-_]/g, ' ')}</span>
      </a>
    `;
    
    list.appendChild(li);
  }
}

// Load popular list (sidebar)
async function loadPopularList(series) {
  const list = document.getElementById('popular-list');
  list.innerHTML = '';

  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    const safeName = sanitizeText(s.name);
    
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="/details?series=${encodeURIComponent(s.name)}">
        ${i + 1}. ${safeName.replace(/[-_]/g, ' ')}
      </a>
    `;
    
    list.appendChild(li);
  }
}

// Scroll arrows functionality
function setupScrollArrows() {
  document.querySelectorAll('.scroller-arrow').forEach(arrow => {
    arrow.addEventListener('click', () => {
      const targetId = arrow.dataset.target;
      const container = document.getElementById(targetId);
      if (!container) return;
      
      const scrollAmount = 400;
      
      if (arrow.classList.contains('right')) {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    });
  });
}

// Dropdown menu
function setupDropdown() {
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

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!catToggle.contains(e.target) && !catPanel.contains(e.target)) {
        catPanel.setAttribute('hidden', '');
        catToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// Dismiss notice
function setupNotice() {
  const dismissNotice = document.getElementById('dismiss-notice');
  const notice = document.getElementById('notice');
  
  if (dismissNotice && notice) {
    dismissNotice.addEventListener('click', () => {
      notice.classList.add('hidden');
    });
  }
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById('global-search');
  
  if (searchInput) {
    // Ctrl+K shortcut
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });

    // Search on enter
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
      }
    });
  }
}

// Mobile menu toggle
function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-active');
      const isActive = navLinks.classList.contains('mobile-active');
      mobileMenuBtn.setAttribute('aria-expanded', isActive);
    });
  }
}

// Initialize all event listeners
function setupEventListeners() {
  setupScrollArrows();
  setupDropdown();
  setupNotice();
  setupSearch();
  setupMobileMenu();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  init();
});
