import { supabase, BUCKET_NAME, getStorageBaseUrl, isConfigured } from './supabase-client.js';

let baseUrl = '';
let allChapters = []; // Store all chapters for filtering
let sortAscending = true; // Track sort order

// Get series name from URL
const urlParams = new URLSearchParams(window.location.search);
const seriesName = urlParams.get('series');

// Sanitize text for display (XSS prevention)
function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Enhanced sanitization for URLs
function sanitizeUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '#';
    }
    return url;
  } catch {
    return '#';
  }
}

async function loadMangaDetails() {
  if (!isConfigured()) {
    document.getElementById('manga-title').textContent = 'Please configure Supabase first';
    document.getElementById('manga-description').textContent = 'Configure your credentials in supabase-client.js';
    return;
  }

  if (!seriesName) {
    document.getElementById('manga-title').textContent = 'No series selected';
    return;
  }

  baseUrl = getStorageBaseUrl();

  // Set title
  const safeName = sanitizeText(seriesName);
  document.getElementById('manga-title').textContent = safeName.replace(/[-_]/g, ' ');
  document.title = `${safeName.replace(/[-_]/g, ' ')} - Unicomick`;

  // Load manga details from database
  await loadMangaInfo();

  // Load cover
  await loadCover();

  // Load chapters
  await loadChapters();

  // Load related series
  await loadRelatedSeries();
}

async function loadMangaInfo() {
  try {
    const { data, error } = await supabase
      .from('manga_details')
      .select('*')
      .eq('folder_name', seriesName)
      .single();

    if (!error && data) {
      // Update author with sanitization
      document.getElementById('manga-author').textContent = sanitizeText(data.author || 'Unknown');
      
      // Update genre with sanitization
      document.getElementById('manga-genre').textContent = sanitizeText(data.genre || 'Unknown');
      
      // Update status with sanitization
      document.getElementById('manga-status').textContent = sanitizeText(data.status || 'Ongoing');
      
      // Update description with sanitization
      document.getElementById('manga-description').textContent = sanitizeText(data.description || 'No description available.');
    } else {
      // If no database entry, set defaults
      console.log('No manga details found in database, using defaults');
      document.getElementById('manga-author').textContent = 'Unknown';
      document.getElementById('manga-genre').textContent = 'Unknown';
      document.getElementById('manga-description').textContent = 'No description available.';
    }
  } catch (error) {
    console.error('Error loading manga details:', error);
    // Set defaults on error
    document.getElementById('manga-author').textContent = 'Unknown';
    document.getElementById('manga-genre').textContent = 'Unknown';
    document.getElementById('manga-description').textContent = 'No description available.';
  }
}

async function loadCover() {
  try {
    const coverPath = `${seriesName}/cover`;
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list(coverPath, {
      limit: 10,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (!error && data && data.length > 0) {
      const imagePath = `${coverPath}/${data[0].name}`;
      const coverUrl = baseUrl + encodeURI(imagePath).replace(/#/g, '%23');
      document.getElementById('manga-cover').src = sanitizeUrl(coverUrl);
    }
  } catch (error) {
    console.error('Error loading cover:', error);
  }
}

async function loadChapters() {
  try {
    const { data: chapters, error } = await supabase.storage.from(BUCKET_NAME).list(seriesName, {
      limit: 10000, // Increased limit to ensure all chapters are loaded
      sortBy: { column: 'name', order: 'asc' }
    });

    if (error) {
      console.error('Error loading chapters:', error);
      document.getElementById('chapter-list').innerHTML = '<li class="status-message">Error loading chapters</li>';
      return;
    }

    // Filter for chapter folders more carefully
    const chapterFolders = chapters.filter(item => {
      const isCoverFolder = item.name.toLowerCase() === 'cover';
      const isFolder = item.id === null;
      const looksLikeChapter = /chapter|ch\d+|\d+/i.test(item.name) || !isNaN(item.name);
      
      return isFolder && !isCoverFolder && looksLikeChapter;
    });

    console.log('Total items found:', chapters.length);
    console.log('Chapter folders found:', chapterFolders.length);
    console.log('Chapter folder names:', chapterFolders.map(c => c.name));

    if (chapterFolders.length === 0) {
      document.getElementById('chapter-list').innerHTML = '<li class="status-message">No chapters found</li>';
      return;
    }

    // Store all chapters globally for filtering
    allChapters = chapterFolders;

    // Update chapter count
    document.getElementById('chapter-count').textContent = chapterFolders.length;

    // Render all chapters initially
    renderChapters(chapterFolders);
  } catch (error) {
    console.error('Error in loadChapters:', error);
    document.getElementById('chapter-list').innerHTML = '<li class="status-message">Error loading chapters</li>';
  }
}

function renderChapters(chapters) {
  const chapterList = document.getElementById('chapter-list');
  chapterList.innerHTML = '';

  if (chapters.length === 0) {
    chapterList.innerHTML = '<li class="status-message">No chapters match your search</li>';
    return;
  }

  chapters.forEach((chapter) => {
    const li = document.createElement('li');
    li.className = 'chapter-item';
    
    // Extract chapter number more carefully
    const chapterNum = chapter.name.replace(/chapter[-_]?/i, '').trim();
    const safeChapterNum = sanitizeText(chapterNum);
    const safeChapterName = sanitizeText(chapter.name);
    
    li.innerHTML = `
      <a href="/reader?series=${encodeURIComponent(seriesName)}&chapter=${encodeURIComponent(chapter.name)}" class="chapter-link">
        <div class="chapter-info">
          <span class="chapter-title">Chapter ${safeChapterNum}</span>
          <span class="chapter-date muted">Updated recently</span>
        </div>
        <i class="fa-solid fa-chevron-right"></i>
      </a>
    `;
    
    chapterList.appendChild(li);
  });
}

function filterChapters(searchTerm) {
  if (!searchTerm.trim()) {
    // Show all chapters if search is empty
    renderChapters(allChapters);
    document.getElementById('search-results-info').textContent = `Showing all ${allChapters.length} chapters`;
    return;
  }

  const filtered = allChapters.filter(chapter => {
    const chapterNum = chapter.name.replace(/chapter[-_]?/i, '').trim();
    const searchLower = searchTerm.toLowerCase();
    
    // Match chapter number or name
    return chapterNum.toLowerCase().includes(searchLower) || 
           chapter.name.toLowerCase().includes(searchLower);
  });

  renderChapters(filtered);
  
  // Update search info
  const infoEl = document.getElementById('search-results-info');
  if (filtered.length === 0) {
    infoEl.textContent = 'No chapters found';
  } else if (filtered.length === allChapters.length) {
    infoEl.textContent = `Showing all ${filtered.length} chapters`;
  } else {
    infoEl.textContent = `Found ${filtered.length} of ${allChapters.length} chapters`;
  }
}

function sortChapters() {
  sortAscending = !sortAscending;
  
  const sorted = [...allChapters].sort((a, b) => {
    const numA = parseFloat(a.name.replace(/chapter[-_]?/i, '').trim()) || 0;
    const numB = parseFloat(b.name.replace(/chapter[-_]?/i, '').trim()) || 0;
    
    return sortAscending ? numA - numB : numB - numA;
  });

  allChapters = sorted;
  
  // Re-apply current search
  const searchInput = document.getElementById('chapter-search');
  if (searchInput.value.trim()) {
    filterChapters(searchInput.value);
  } else {
    renderChapters(allChapters);
  }

  // Update sort button icon
  const sortBtn = document.getElementById('sort-btn');
  sortBtn.innerHTML = sortAscending 
    ? '<i class="fa-solid fa-arrow-down-short-wide"></i> Oldest First'
    : '<i class="fa-solid fa-arrow-up-short-wide"></i> Newest First';
}

async function loadRelatedSeries() {
  try {
    const { data: topLevel, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 20 }); // Increased limit for more options

    if (error) {
      document.getElementById('related-list').innerHTML = '<li class="status-message">No related series</li>';
      return;
    }

    const seriesFolders = topLevel.filter(item => item.id === null && item.name !== seriesName);
    const list = document.getElementById('related-list');
    list.innerHTML = '';

    if (seriesFolders.length === 0) {
      list.innerHTML = '<li class="status-message">No related series</li>';
      return;
    }

    for (const s of seriesFolders.slice(0, 5)) {
      const coverPath = `${s.name}/cover`;
      const { data: coverData } = await supabase.storage.from(BUCKET_NAME).list(coverPath, { limit: 1 });
      
      let coverUrl = 'https://placehold.co/40x56/1a202c/94a3b8?text=No+Cover';
      if (coverData && coverData.length > 0) {
        const imagePath = `${coverPath}/${coverData[0].name}`;
        coverUrl = sanitizeUrl(baseUrl + encodeURI(imagePath).replace(/#/g, '%23'));
      }

      const safeName = sanitizeText(s.name);
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="/details?series=${encodeURIComponent(s.name)}">
          <img src="${coverUrl}" alt="${safeName}" onerror="this.src='https://placehold.co/40x56/1a202c/94a3b8?text=Error'" />
          <span>${safeName.replace(/[-_]/g, ' ')}</span>
        </a>
      `;
      
      list.appendChild(li);
    }
  } catch (error) {
    console.error('Error loading related series:', error);
    document.getElementById('related-list').innerHTML = '<li class="status-message">Error loading series</li>';
  }
}

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

// Search shortcut
const searchInput = document.getElementById('global-search');
if (searchInput) {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

// Chapter search functionality
const chapterSearchInput = document.getElementById('chapter-search');
const searchChapterBtn = document.getElementById('search-chapter-btn');

if (chapterSearchInput) {
  // Search on button click
  searchChapterBtn.addEventListener('click', () => {
    filterChapters(chapterSearchInput.value);
  });

  // Search on Enter key
  chapterSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      filterChapters(chapterSearchInput.value);
    }
  });

  // Live search as user types (with debouncing)
  let searchTimeout;
  chapterSearchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filterChapters(e.target.value);
    }, 300);
  });
}

// Sort button functionality
const sortBtn = document.getElementById('sort-btn');
if (sortBtn) {
  sortBtn.addEventListener('click', sortChapters);
}

// Follow button with improved security
const followBtn = document.getElementById('follow-btn');
if (followBtn) {
  followBtn.addEventListener('click', () => {
    if (followBtn.classList.contains('active')) {
      followBtn.classList.remove('active');
      followBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Follow';
    } else {
      followBtn.classList.add('active');
      followBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Following';
    }
  });
}

// Initialize
loadMangaDetails();