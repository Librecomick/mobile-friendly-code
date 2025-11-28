(function(){
  const container = document.getElementById('image-container');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar');
  const reader = document.getElementById('reader');
  const direction = document.getElementById('page-direction');
  const fitW = document.getElementById('fit-width');
  const fitH = document.getElementById('fit-height');
  const prevTop = document.getElementById('prev-ch');
  const nextTop = document.getElementById('next-ch');
  const prevBottom = document.getElementById('prev-bottom');
  const nextBottom = document.getElementById('next-bottom');
  const commentsBox = document.getElementById('comments-box');
  const revealBtn = null; // legacy button removed
  const sidebarFab = document.getElementById('sidebar-fab');
  const endSentinel = document.getElementById('end-sentinel');
  const bottomControls = document.getElementById('bottom-controls');
  const commentsOverlay = document.getElementById('comments-overlay');
  const prevFab = document.getElementById('prev-fab');
  const nextFab = document.getElementById('next-fab');
  const commentsList = document.getElementById('comments-list');

  // Generate placeholder images
  const pages = Array.from({length: 18}, (_,i) => `https://picsum.photos/1000/1400?random=${i+1}`);

  function renderVertical(){
    container.innerHTML = '';
    container.style.flexDirection = 'column';
    pages.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'placeholder page';
      container.appendChild(img);
    });
  }

  // Add 40 placeholder comments
  if (commentsList) {
    const frag = document.createDocumentFragment();
    for (let i = 1; i < 40; i++) {
      const item = document.createElement('div');
      item.className = 'comment-item';
      item.innerHTML = `
        <div class="comment-header">
          <div class="comment-author"><i class="fa-regular fa-user"></i> user${i+1}</div>
          <div class="comment-date">${i+1}d ago</div>
        </div>
        <div class="comment-text">This is placeholder comment #${i+1}. Lorem ipsum text to fill the comments list for scroll testing.</div>
      `;
      frag.appendChild(item);
    }
    commentsList.appendChild(frag);
  }

  function renderHorizontal(){
    container.innerHTML = '';
    container.style.flexDirection = 'row';
    container.style.flexWrap = 'nowrap';
    container.style.overflowX = 'auto';
    container.style.gap = '8px';
    pages.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'placeholder page';
      img.style.width = 'auto';
      img.style.height = '90vh';
      container.appendChild(img);
    });
  }

  function applyFit(mode){
    const imgs = container.querySelectorAll('img');
    if (mode === 'width'){
      imgs.forEach(img => { img.style.width = '100%'; img.style.height = 'auto'; });
    } else if (mode === 'height'){
      imgs.forEach(img => { img.style.width = 'auto'; img.style.height = '95vh'; });
    }
  }

  // Sidebar toggle
  function toggleSidebar() {
    reader.classList.toggle('layout-side');
  }
  
  toggleSidebarBtn?.addEventListener('click', toggleSidebar);
  
  // Keyboard shortcut 's' to toggle sidebar
  document.addEventListener('keydown', (e) => {
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      toggleSidebar();
    }
  });
  sidebarFab?.addEventListener('click', () => {
    reader.classList.toggle('layout-side');
  });

  // Direction switch
  direction?.addEventListener('change', () => {
    if (direction.value === 'horizontal') renderHorizontal();
    else renderVertical();
    // reset bottom controls visibility until end reached again
    bottomControls?.classList.add('hidden');
  });

  fitW?.addEventListener('click', () => applyFit('width'));
  fitH?.addEventListener('click', () => applyFit('height'));

  // Prev/Next (demo)
  function gotoPrev(){ window.scrollTo({top: 0, behavior: 'smooth'}); }
  function gotoNext(){ window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'}); }
  prevTop?.addEventListener('click', gotoPrev);
  nextTop?.addEventListener('click', gotoNext);
  prevBottom?.addEventListener('click', gotoPrev);
  nextBottom?.addEventListener('click', gotoNext);
  prevFab?.addEventListener('click', gotoPrev);
  nextFab?.addEventListener('click', gotoNext);

  // Comments blur/unblur
  function unblurComments(){
    commentsBox?.classList.remove('blurred');
    revealBtn?.classList.add('hidden');
    commentsOverlay?.classList.add('hidden');
  }
  // overlay is the only trigger now
  commentsOverlay?.addEventListener('click', unblurComments);
  commentsBox?.addEventListener('click', () => {
    if (commentsBox.classList.contains('blurred')) unblurComments();
  });

  // Initial render
  renderVertical();
  // Defaults: show sidebar and fit images to height
  reader.classList.add('layout-side');
  applyFit('height');
  // Always show nav fabs
  prevFab?.classList.remove('hidden');
  nextFab?.classList.remove('hidden');

  // Show Prev/Next only at end
  if ('IntersectionObserver' in window && endSentinel && bottomControls){
    const io = new IntersectionObserver((entries) => {
      const onScreen = entries.some(e => e.isIntersecting);
      bottomControls.classList.toggle('hidden', !onScreen);
    }, { root: null, threshold: 0.1 });
    io.observe(endSentinel);
  }
})();
