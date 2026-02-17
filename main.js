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
    if (id === 'worm') { /* focus canvas for controls */ }
    if (id !== 'worm') stopWorm();
  }));

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
  const billsList = document.getElementById('bills-list');
  const billsTotalEl = document.getElementById('bills-total');
  const monthlySalaryEl = document.getElementById('monthly-salary');
  const monthlyRemainderEl = document.getElementById('monthly-remainder');
  const yearlySavingsEl = document.getElementById('yearly-savings');

  function renderBills() {
    billsList.innerHTML = bills.map((amt, idx) => `
      <div class="bill-item"><span>$${Number(amt).toFixed(2)}</span><button data-idx="${idx}" class="btn btn-ghost bill-remove">Remove</button></div>
    `).join('') || '<div class="empty">No bills yet</div>';
    billsList.querySelectorAll('.bill-remove').forEach(btn => btn.addEventListener('click', () => { bills.splice(parseInt(btn.dataset.idx, 10), 1); saveBills(); renderBills(); }));
    const total = bills.reduce((s, n) => s + Number(n), 0);
    billsTotalEl.textContent = `$${total.toFixed(2)}`;
    const salary = Number(monthlySalaryEl.value || localStorage.getItem(SALARY_KEY) || 0);
    const remainder = salary - total;
    monthlyRemainderEl.textContent = `$${remainder.toFixed(2)}`;
    yearlySavingsEl.textContent = `$${Math.max(0, remainder * 12).toFixed(2)}`;
  }
  function saveBills() { localStorage.setItem(BILLS_KEY, JSON.stringify(bills)); }

  document.getElementById('add-bill').addEventListener('click', () => {
    const v = Number(document.getElementById('bill-amount').value || 0);
    if (!v || v <= 0) return;
    bills.push(v);
    saveBills();
    renderBills();
    document.getElementById('bill-amount').value = '';
  });

  document.getElementById('sample-bills').addEventListener('click', () => {
    bills = bills.concat([1200, 150, 60, 40]);
    saveBills();
    renderBills();
  });

  monthlySalaryEl.addEventListener('input', () => { localStorage.setItem(SALARY_KEY, monthlySalaryEl.value); renderBills(); });
  document.getElementById('save-bills').addEventListener('click', () => { localStorage.setItem(SALARY_KEY, monthlySalaryEl.value || '0'); saveBills(); });
  document.getElementById('clear-bills').addEventListener('click', () => { bills = []; localStorage.removeItem(BILLS_KEY); monthlySalaryEl.value = ''; localStorage.removeItem(SALARY_KEY); renderBills(); });

  monthlySalaryEl.value = localStorage.getItem(SALARY_KEY) || '';
  renderBills();

  /* ---- Basic Worm (snake) game ---- */
  const canvas = document.getElementById('worm-canvas');
  const ctx = canvas.getContext('2d');
  const tile = 20;
  const cols = Math.floor(canvas.width / tile);
  const rows = Math.floor(canvas.height / tile);
  let snake, dir, food, gameInterval, score, running;

  function resetWorm() {
    snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
    dir = { x: 1, y: 0 };
    for (let i = 1; i < 4; i++) snake.push({ x: snake[0].x - i, y: snake[0].y });
    placeFood();
    score = 0;
    document.getElementById('worm-score').textContent = score;
    draw();
  }
  function placeFood() {
    do { food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; }
    while (snake.some(s => s.x === food.x && s.y === food.y));
  }
  function draw() {
    ctx.fillStyle = '#050518';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(food.x * tile + 2, food.y * tile + 2, tile - 4, tile - 4);
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#c084fc' : '#60a5fa';
      ctx.fillRect(s.x * tile + 1, s.y * tile + 1, tile - 2, tile - 2);
    });
  }
  function step() {
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows || snake.some(s => s.x === head.x && s.y === head.y)) {
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
  function resetAndStart() { resetWorm(); startWorm(); }

  resetWorm();
  document.getElementById('worm-start').addEventListener('click', startWorm);
  document.getElementById('worm-pause').addEventListener('click', () => { if (running) stopWorm(); else startWorm(); });
  document.getElementById('worm-reset').addEventListener('click', () => { resetWorm(); stopWorm(); });

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

  /* pause worm when modal closes */
  const observer = new MutationObserver(() => { if (modal.classList.contains('hidden')) stopWorm(); });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
});