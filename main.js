document.addEventListener('DOMContentLoaded', () => {
  /* ---- Like system (persisted locally) ---- */
  const likeBtn = document.getElementById('like-btn');
  const likeCountEl = document.getElementById('like-count');
  const LIKES_KEY = 'spectrom_likes_count';
  const LIKED_KEY = 'spectrom_liked';

  if (!localStorage.getItem(LIKES_KEY)) localStorage.setItem(LIKES_KEY, '0');

  function refreshLikes() {
    const cnt = parseInt(localStorage.getItem(LIKES_KEY), 10) || 0;
    const liked = localStorage.getItem(LIKED_KEY) === 'true';
    likeCountEl.textContent = cnt;
    likeBtn.classList.toggle('liked', liked);
    likeBtn.setAttribute('aria-pressed', String(liked));
  }

  function escapeHtml(s) { return String(s).replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"&#39;"}[m])); }

  likeBtn.addEventListener('click', () => {
    let cnt = parseInt(localStorage.getItem(LIKES_KEY), 10) || 0;
    const liked = localStorage.getItem(LIKED_KEY) === 'true';
    if (!liked) {
      cnt++;
      localStorage.setItem(LIKED_KEY, 'true');
      likeBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 240 });
    } else {
      cnt = Math.max(0, cnt - 1);
      localStorage.setItem(LIKED_KEY, 'false');
    }
    localStorage.setItem(LIKES_KEY, String(cnt));
    refreshLikes();
  });

  refreshLikes();

  /* ---- Modal / Tabs for widgets ---- */
  const modal = document.getElementById('widgets-modal');
  const openBtn = document.getElementById('widgets-open-btn');
  const overlay = document.getElementById('widgets-overlay');
  const closeBtn = document.getElementById('widgets-close');

  function openModal() {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Defensive: ensure an active tab/widget is visible when modal opens
    const activeTab = document.querySelector('.widget-tab.active') || document.querySelector('.widget-tab');
    if (activeTab) {
      document.querySelectorAll('.widget-tab').forEach(t => t.classList.remove('active'));
      activeTab.classList.add('active');
      document.querySelectorAll('.widget').forEach(w => w.classList.add('hidden'));
      const el = document.getElementById('widget-' + activeTab.dataset.widget);
      if (el) el.classList.remove('hidden');

      // if the worm tab is active, start the demo (deferred because startAutoDemo is declared later)
      setTimeout(() => {
        if (activeTab.dataset.widget === 'worm' && typeof startAutoDemo === 'function' && !running && !demoRunning) startAutoDemo();
      }, 0);
    }
  }
  function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopWorm();
  }

  openBtn.addEventListener('click', openModal);
  overlay.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });

  const tabs = document.querySelectorAll('.widget-tab');
  const widgets = document.querySelectorAll('.widget');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const id = t.dataset.widget;
    widgets.forEach(w => w.classList.add('hidden'));
    document.getElementById('widget-' + id).classList.remove('hidden');
    if (id === 'worm') {
      // start preview/demo when worm tab is selected (if not already running)
      if (typeof startAutoDemo === 'function' && !running && !demoRunning) startAutoDemo();
    } else {
      if (typeof stopAutoDemo === 'function') stopAutoDemo();
      stopWorm();
    }
  }));

  // ensure initial active widget is visible on load
  (function ensureInitialWidget(){
    const initial = document.querySelector('.widget-tab.active') || document.querySelector('.widget-tab');
    if (initial) initial.click();
    else console.warn('Widgets: no tabs found');
  })();

  /* ---- Simple calculator ---- */
  const display = document.getElementById('calc-display');
  const calcResult = document.getElementById('calc-result');

  document.querySelectorAll('[data-insert]').forEach(btn => btn.addEventListener('click', () => {
    display.value += btn.dataset.insert;
  }));

  document.querySelector('[data-action="clear"]').addEventListener('click', () => { display.value = ''; });

  document.getElementById('calc-eval').addEventListener('click', () => {
    const expr = display.value.trim();
    if (!expr) return calcResult.textContent = 'Enter expression';
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) return calcResult.textContent = 'Invalid characters';
    try {
      const v = Function('"use strict"; return (' + expr + ')')();
      calcResult.textContent = String(v);
    } catch (err) { calcResult.textContent = 'Error'; }
  });

  document.getElementById('calc-clear').addEventListener('click', () => { display.value = ''; calcResult.textContent = ''; });

  /* ---- Bills & Net calculator ---- */
  const BILLS_KEY = 'spectrom_bills';
  const SALARY_KEY = 'spectrom_salary';
  let bills = JSON.parse(localStorage.getItem(BILLS_KEY) || '[]');
  if (!Array.isArray(bills)) bills = [];
  // migrate old-number-only format to objects {name,amount}
  bills = bills.map(b => (typeof b === 'number' ? { name: 'Bill', amount: Number(b) } : (b && typeof b.amount !== 'undefined' ? { name: b.name || 'Bill', amount: Number(b.amount) } : { name: 'Bill', amount: 0 })));
  const billsList = document.getElementById('bills-list');
  const billsTotalEl = document.getElementById('bills-total');
  const monthlySalaryEl = document.getElementById('monthly-salary');
  const monthlyRemainderEl = document.getElementById('monthly-remainder');
  const yearlySavingsEl = document.getElementById('yearly-savings');

  function renderBills() {
    billsList.innerHTML = bills.length ? bills.map((bill, idx) => `
      <div class="bill-item">
        <div style="flex:1"><strong>${escapeHtml(bill.name)}</strong></div>
        <div style="min-width:96px; text-align:right;">$${Number(bill.amount).toFixed(2)}</div>
        <button data-idx="${idx}" class="btn btn-ghost bill-remove">Remove</button>
      </div>
    `).join('') : '<div class="empty">No bills yet</div>';
    billsList.querySelectorAll('.bill-remove').forEach(btn => btn.addEventListener('click', () => { bills.splice(parseInt(btn.dataset.idx, 10), 1); saveBills(); renderBills(); }));
    const total = bills.reduce((s, n) => s + Number(n.amount), 0);
    billsTotalEl.textContent = `$${total.toFixed(2)}`;
    const salary = Number(monthlySalaryEl.value || localStorage.getItem(SALARY_KEY) || 0);
    const remainder = salary - total;
    monthlyRemainderEl.textContent = `$${remainder.toFixed(2)}`;
    yearlySavingsEl.textContent = `$${Math.max(0, remainder * 12).toFixed(2)}`;
  }
  function saveBills() { localStorage.setItem(BILLS_KEY, JSON.stringify(bills)); }

  document.getElementById('add-bill').addEventListener('click', () => {
    const nameInput = document.getElementById('bill-name');
    const name = (nameInput && nameInput.value.trim()) || 'Bill';
    const v = Number(document.getElementById('bill-amount').value || 0);
    if (!v || v <= 0) return;
    bills.push({ name, amount: v });
    saveBills();
    renderBills();
    document.getElementById('bill-amount').value = '';
    if (nameInput) nameInput.value = '';
  });

  document.getElementById('sample-bills').addEventListener('click', () => {
    bills = bills.concat([{ name: 'Rent', amount: 1200 }, { name: 'Internet', amount: 150 }, { name: 'Electric', amount: 60 }, { name: 'Phone', amount: 40 }]);
    saveBills();
    renderBills();
  });

  monthlySalaryEl.addEventListener('input', () => { localStorage.setItem(SALARY_KEY, monthlySalaryEl.value); renderBills(); });
  document.getElementById('save-bills').addEventListener('click', () => { localStorage.setItem(SALARY_KEY, monthlySalaryEl.value || '0'); saveBills(); });
  document.getElementById('clear-bills').addEventListener('click', () => { bills = []; localStorage.removeItem(BILLS_KEY); monthlySalaryEl.value = ''; localStorage.removeItem(SALARY_KEY); renderBills(); });

  monthlySalaryEl.value = localStorage.getItem(SALARY_KEY) || '';
  renderBills();

  /* ---- Gallery widget (auto-load from images/manifest.json) ---- */
  const GALLERY_KEY = 'spectrom_gallery';
  let gallery = [];
  const galleryGrid = document.getElementById('gallery-grid');

  function renderGallery() {
    galleryGrid.innerHTML = gallery.length ? gallery.map((src, idx) => `
      <div class="gallery-item">
        <img src="${src}" alt="image-${idx}" data-idx="${idx}" />
        <button class="remove" data-idx="${idx}">×</button>
      </div>
    `).join('') : '<div class="empty">No images</div>';

    galleryGrid.querySelectorAll('img').forEach(img => img.addEventListener('click', () => {
      document.getElementById('gallery-lightbox-img').src = img.src;
      document.getElementById('gallery-lightbox').classList.remove('hidden');
    }));

    galleryGrid.querySelectorAll('.remove').forEach(btn => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      gallery.splice(parseInt(btn.dataset.idx, 10), 1);
      localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
      renderGallery();
    }));
  }

  // try to load a manifest from /images/manifest.json; fall back to localStorage or the bundled default
  function loadGalleryFromManifest() {
    return fetch('images/manifest.json', { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error('no-manifest'); return r.json(); })
      .then(list => {
        if (!Array.isArray(list)) throw new Error('bad-manifest');
        gallery = list.map(s => (s.startsWith('/') ? s.slice(1) : s));
        localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
        renderGallery();
        return true;
      })
      .catch(() => false);
  }

  function initGallery() {
    const stored = JSON.parse(localStorage.getItem(GALLERY_KEY) || 'null');
    if (stored && stored.length) {
      gallery = stored.slice();
      renderGallery();
      // update from manifest in background if available
      loadGalleryFromManifest().then(found => { if (found) { /* manifest overrides stored */ } });
    } else {
      loadGalleryFromManifest().then(found => {
        if (!found) {
          gallery = ['images/ICOn.png'];
          localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
          renderGallery();
        }
      });
    }
  }

  document.getElementById('gallery-add-btn').addEventListener('click', () => {
    let v = document.getElementById('gallery-input').value.trim();
    if (!v) return;
    if (!/^(https?:\/\/|\/)/.test(v)) v = 'images/' + v;
    gallery.push(v);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
    renderGallery();
    document.getElementById('gallery-input').value = '';
  });

  document.getElementById('gallery-reset-btn').addEventListener('click', () => { gallery = ['images/ICOn.png']; localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery)); renderGallery(); });
  document.getElementById('gallery-lightbox').addEventListener('click', () => { document.getElementById('gallery-lightbox').classList.add('hidden'); });

  // initialize (manifest preferred)
  initGallery();

  monthlySalaryEl.value = localStorage.getItem(SALARY_KEY) || '';
  renderBills();

  /* ---- Basic Worm (snake) game (responsive + touch) ---- */
  const canvas = document.getElementById('worm-canvas');
  const ctx = canvas.getContext('2d');
  const tile = 20; // logical grid tile (CSS pixels)
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let tilePx = tile * dpr;
  let cols = 0, rows = 0;
  let snake, dir, food, gameInterval, score, running;
  let demoRunning = false, demoInterval = null, demoProgress = 0;

  function resizeCanvas() {
    const wrap = canvas.parentElement || document.body;
    // allow a much larger canvas on modern phones while keeping sensible minimums
    const avail = Math.min(520, Math.max(160, Math.floor((wrap.clientWidth || window.innerWidth) * 0.92)));
    canvas.style.width = avail + 'px';
    canvas.style.height = avail + 'px';
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(avail * dpr);
    canvas.height = Math.floor(avail * dpr);
    tilePx = tile * dpr;
    cols = Math.max(4, Math.floor(canvas.width / tilePx));
    rows = Math.max(4, Math.floor(canvas.height / tilePx));
  }

  function resetWorm() {
    resizeCanvas();
    snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
    dir = { x: 1, y: 0 };
    for (let i = 1; i < 4; i++) snake.push({ x: snake[0].x - i, y: snake[0].y });
    placeFood();
    score = 0;
    document.getElementById('worm-score').textContent = score;
    draw();
  }
  function placeFood() {
    if (cols <= 0 || rows <= 0) { food = { x: 0, y: 0 }; return; }
    do { food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; }
    while (snake.some(s => s.x === food.x && s.y === food.y));
  }
  function draw() {
    // draw in CSS pixel coordinates; canvas is scaled by DPR internally
    ctx.save();
    ctx.scale(dpr, dpr);
    const size = canvas.width / dpr;
    ctx.fillStyle = '#050518';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(food.x * tile + 2, food.y * tile + 2, tile - 4, tile - 4);
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#c084fc' : '#60a5fa';
      ctx.fillRect(s.x * tile + 1, s.y * tile + 1, tile - 2, tile - 2);
    });
    ctx.restore();
  }
  function step() {
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows || snake.some(s => s.x === head.x && s.y === head.y)) {
      if (demoRunning) { resetWorm(); return; }
      stopWorm();
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) { score++; document.getElementById('worm-score').textContent = score; placeFood(); }
    else snake.pop();
    draw();
  }
  function startWorm() { if (running) return; running = true; gameInterval = setInterval(step, 120); }
  function stopWorm() { running = false; clearInterval(gameInterval); }

  function updateDemoUI() {
    const bar = document.getElementById('worm-demo-progress');
    const pct = document.getElementById('worm-demo-percent');
    const wrap = document.getElementById('worm-demo');
    if (!bar || !pct || !wrap) return;
    bar.style.width = Math.floor(demoProgress) + '%';
    pct.textContent = Math.floor(demoProgress) + '%';
    wrap.style.display = demoRunning ? 'flex' : 'none';
  }

  function startAutoDemo() {
    if (demoRunning) return;
    demoRunning = true;
    demoProgress = 0;
    updateDemoUI();
    demoInterval = setInterval(() => {
      const hx = snake[0].x, hy = snake[0].y;
      const dx = Math.sign(food.x - hx), dy = Math.sign(food.y - hy);
      const tryDirs = [];
      if (dx !== 0) tryDirs.push({ x: dx, y: 0 });
      if (dy !== 0) tryDirs.push({ x: 0, y: dy });
      tryDirs.push({ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 });
      for (const nd of tryDirs) {
        const nx = hx + nd.x, ny = hy + nd.y;
        const collides = snake.some(s => s.x === nx && s.y === ny);
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !collides) { dir = nd; break; }
      }
      step();
      demoProgress += Math.random() * 6 + 2;
      if (demoProgress > 100) demoProgress = 100;
      updateDemoUI();
      if (demoProgress >= 100) demoProgress = 0;
    }, 120);
  }

  function stopAutoDemo() {
    demoRunning = false;
    clearInterval(demoInterval);
    demoInterval = null;
    demoProgress = 0;
    updateDemoUI();
  }

  // responsive init
  resizeCanvas();
  resetWorm();
  updateDemoUI();

  // touch/swipe support for mobile
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => { const t = e.touches[0]; touchStart = { x: t.clientX, y: t.clientY }; }, { passive: true });
  canvas.addEventListener('touchend', (e) => {
    if (!touchStart) return; const t = e.changedTouches[0]; const dx = t.clientX - touchStart.x; const dy = t.clientY - touchStart.y; const absX = Math.abs(dx); const absY = Math.abs(dy); const threshold = 20; if (Math.max(absX, absY) < threshold) { touchStart = null; return; } if (absX > absY) dir = { x: dx > 0 ? 1 : -1, y: 0 }; else dir = { x: 0, y: dy > 0 ? 1 : -1 }; touchStart = null; }, { passive: true });

  // controls
  document.getElementById('worm-start').addEventListener('click', () => { stopAutoDemo(); startWorm(); });
  document.getElementById('worm-pause').addEventListener('click', () => { if (running) stopWorm(); else { stopAutoDemo(); startWorm(); } });
  document.getElementById('worm-reset').addEventListener('click', () => { stopAutoDemo(); resetWorm(); stopWorm(); });

  // keyboard controls remain
  document.addEventListener('keydown', (e) => {
    const keyMap = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    const k = e.key;
    if (k in keyMap) {
      const [x, y] = keyMap[k];
      if (snake.length > 1 && snake[0].x + x === snake[1].x && snake[0].y + y === snake[1].y) return;
      dir = { x, y };
      e.preventDefault();
    }
  });

  // responsive resize handler — preserve running/demo state
  window.addEventListener('resize', () => {
    const wasRunning = running;
    const wasDemo = demoRunning;
    stopWorm();
    stopAutoDemo();
    resizeCanvas();
    resetWorm();
    if (wasRunning) startWorm();
    else if (wasDemo) startAutoDemo();
  });

  // pause/cleanup when modal closes
  const observer = new MutationObserver(() => { if (modal.classList.contains('hidden')) { stopWorm(); stopAutoDemo(); } });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
});