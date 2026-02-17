/* main.js — interactive widgets for index.html
   - Like system (localStorage)
   - Calculator (basic expression evaluation)
   - Worm (simple snake-like game)
   - Bills & Net-worth calculator (persistent)
*/

document.addEventListener('DOMContentLoaded', () => {
  initLikes();
  initCalculator();
  initWorm();
  initBills();
});

/* ---------- LIKE SYSTEM ---------- */
function initLikes() {
  const likeBtn = document.getElementById('like-btn');
  const likeCountEl = document.getElementById('like-count');

  let likeCount = parseInt(localStorage.getItem('spectrom_like_count') || '128', 10);
  let liked = localStorage.getItem('spectrom_liked') === 'true';

  function updateLikeUI() {
    likeCountEl.textContent = String(likeCount);
    likeBtn.classList.toggle('liked', liked);
    likeBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');
  }

  function animateHeart() {
    likeBtn.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.25)' },
      { transform: 'scale(1)' }
    ], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }

  likeBtn.addEventListener('click', () => {
    if (!liked) {
      likeCount = Math.max(0, likeCount) + 1;
      liked = true;
    } else {
      likeCount = Math.max(0, likeCount - 1);
      liked = false;
    }
    localStorage.setItem('spectrom_like_count', String(likeCount));
    localStorage.setItem('spectrom_liked', String(liked));
    updateLikeUI();
    if (liked) animateHeart();
  });

  updateLikeUI();
}

/* ---------- CALCULATOR ---------- */
function initCalculator() {
  const display = document.getElementById('calc-display');
  const keys = Array.from(document.querySelectorAll('.calc-key'));
  let expr = '';

  function render() {
    display.textContent = expr === '' ? '0' : expr;
  }

  function safeEval(input) {
    // only allow digits, parentheses, spaces, and + - * /
    if (!/^[0-9+\-*/().\s]+$/.test(input)) return null;
    try {
      // eslint-disable-next-line no-new-func
      const val = Function('return (' + input + ')')();
      if (typeof val === 'number' && Number.isFinite(val)) return String(val);
      return null;
    } catch (e) {
      return null;
    }
  }

  keys.forEach(k => {
    k.addEventListener('click', () => {
      const v = k.dataset.value;
      if (!v) return;
      if (v === 'AC') { expr = ''; render(); return; }
      if (v === 'DEL') { expr = expr.slice(0, -1); render(); return; }
      if (v === '=') {
        const out = safeEval(expr);
        expr = out === null ? 'Err' : out;
        render();
        return;
      }
      // append
      if (expr === 'Err') expr = '';
      expr += v;
      render();
    });
  });

  render();
}

/* ---------- WORM (SNAKE-LIKE) ---------- */
function initWorm() {
  const canvas = document.getElementById('worm-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('worm-score');
  const startBtn = document.getElementById('worm-start');
  const pauseBtn = document.getElementById('worm-pause');
  const resetBtn = document.getElementById('worm-reset');

  const COLS = 20;
  const ROWS = 20;
  const CELL = Math.floor(canvas.width / COLS);
  let snake = [];
  let dir = { x: 1, y: 0 };
  let food = null;
  let timer = null;
  let speed = 110; // ms
  let running = false;
  let score = 0;

  function placeFood() {
    while (true) {
      const fx = Math.floor(Math.random() * COLS);
      const fy = Math.floor(Math.random() * ROWS);
      if (!snake.some(s => s.x === fx && s.y === fy)) {
        food = { x: fx, y: fy };
        return;
      }
    }
  }

  function resetGame() {
    snake = [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }];
    dir = { x: 1, y: 0 };
    score = 0;
    placeFood();
    updateScore();
    running = false;
    clearInterval(timer);
    timer = null;
    draw();
  }

  function updateScore() { scoreEl.textContent = `Score: ${score}`; }

  function tick() {
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    // collision with walls
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      return gameOver();
    }
    // self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();

    snake.unshift(head);
    if (food && head.x === food.x && head.y === food.y) {
      score += 1;
      placeFood();
      updateScore();
    } else {
      snake.pop();
    }
    draw();
  }

  function gameOver() {
    running = false;
    clearInterval(timer);
    timer = null;
    // flash canvas
    canvas.animate([
      { filter: 'brightness(1)' },
      { filter: 'brightness(0.3)' },
      { filter: 'brightness(1)' }
    ], { duration: 500 });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background grid subtle
    ctx.fillStyle = '#07071a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw food
    if (food) {
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc((food.x + 0.5) * CELL, (food.y + 0.5) * CELL, CELL * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw snake
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      const t = i / Math.max(1, snake.length - 1);
      ctx.fillStyle = `rgba(${34 + t * 120}, ${99 + t * 80}, ${255 - t * 80}, 1)`;
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    }
  }

  function startGame() {
    if (running) return;
    running = true;
    timer = setInterval(tick, speed);
  }

  function pauseGame() {
    running = false;
    clearInterval(timer);
    timer = null;
  }

  // keyboard
  let lastDir = { x: 1, y: 0 };
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const mapping = {
      'arrowup': { x: 0, y: -1 }, 'w': { x: 0, y: -1 },
      'arrowdown': { x: 0, y: 1 }, 's': { x: 0, y: 1 },
      'arrowleft': { x: -1, y: 0 }, 'a': { x: -1, y: 0 },
      'arrowright': { x: 1, y: 0 }, 'd': { x: 1, y: 0 }
    };
    if (mapping[key]) {
      const nd = mapping[key];
      // prevent immediate reverse
      if (nd.x === -lastDir.x && nd.y === -lastDir.y) return;
      dir = nd;
      lastDir = nd;
    }
  });

  startBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', pauseGame);
  resetBtn.addEventListener('click', resetGame);

  resetGame();
}

/* ---------- BILLS & NET-WORTH ---------- */
function initBills() {
  const billsListEl = document.getElementById('bills-list');
  const addBtn = document.getElementById('add-bill');
  const billNameInput = document.getElementById('bill-name');
  const billAmountInput = document.getElementById('bill-amount');
  const totalBillsEl = document.getElementById('total-bills');
  const disposableEl = document.getElementById('disposable');
  const disposableYearEl = document.getElementById('disposable-year');
  const monthlySalaryInput = document.getElementById('monthly-salary');
  const clearBtn = document.getElementById('clear-bills');
  const sampleBtn = document.getElementById('sample-bills');

  let bills = JSON.parse(localStorage.getItem('spectrom_bills') || '[]');
  let salary = parseFloat(localStorage.getItem('spectrom_salary') || '0');
  monthlySalaryInput.value = salary ? String(salary) : '';

  function save() {
    localStorage.setItem('spectrom_bills', JSON.stringify(bills));
  }

  function render() {
    billsListEl.innerHTML = '';
    bills.forEach((b, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHtml(b.name)}</span><span>$${Number(b.amount).toFixed(2)}</span>`;
      const rem = document.createElement('button');
      rem.className = 'bill-remove';
      rem.textContent = '✕';
      rem.title = 'Remove bill';
      rem.dataset.index = String(i);
      li.appendChild(rem);
      billsListEl.appendChild(li);
    });
    recalc();
  }

  function recalc() {
    const total = bills.reduce((s, b) => s + Number(b.amount || 0), 0);
    totalBillsEl.textContent = Number(total).toFixed(2);
    const sal = Number(monthlySalaryInput.value || 0);
    const disposable = sal - total;
    disposableEl.textContent = Number(disposable).toFixed(2);
    disposableYearEl.textContent = Number(disposable * 12).toFixed(2);
    localStorage.setItem('spectrom_salary', String(sal));
  }

  billsListEl.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('bill-remove')) {
      const idx = Number(e.target.dataset.index);
      bills.splice(idx, 1);
      save();
      render();
    }
  });

  addBtn.addEventListener('click', () => {
    const name = (billNameInput.value || '').trim() || 'Bill';
    const amt = Number(billAmountInput.value || 0);
    if (isNaN(amt) || amt <= 0) {
      billAmountInput.focus();
      return;
    }
    bills.push({ name, amount: amt });
    billNameInput.value = '';
    billAmountInput.value = '';
    save();
    render();
  });

  monthlySalaryInput.addEventListener('input', () => { recalc(); });

  clearBtn.addEventListener('click', () => { bills = []; save(); render(); });

  sampleBtn.addEventListener('click', () => {
    bills.push({ name: 'Rent', amount: 760 });
    bills.push({ name: 'Internet', amount: 40 });
    bills.push({ name: 'Electric', amount: 65 });
    save();
    render();
  });

  render();
}

/* ---------- Utilities ---------- */
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
