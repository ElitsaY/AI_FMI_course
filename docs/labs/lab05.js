/* ===== Lab 05 interactivity ===== */

const SVG_NS = 'http://www.w3.org/2000/svg';
const fmt = (v) => (v === Infinity ? '∞' : v === -Infinity ? '−∞' : String(v).replace('-', '−'));

/* ---------- minimax figure stages ---------- */
function initStages() {
  const btns = document.querySelectorAll('.mm-stage');
  btns.forEach(btn => btn.addEventListener('click', () => {
    btns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.mm-stage-fig').forEach(f => { f.hidden = f.dataset.stage !== btn.dataset.stage; });
  }));
}

/* ---------- the lab's 2-2-2 game tree ---------- */
const LAB_LEAVES = [-1, 3, 5, 1, -6, -4, 0, 9];
const KIDS = { r: ['a', 'b'], a: ['a1', 'a2'], b: ['b1', 'b2'], a1: ['l0', 'l1'], a2: ['l2', 'l3'], b1: ['l4', 'l5'], b2: ['l6', 'l7'] };
const IS_MAX = { r: true, a: false, b: false, a1: true, a2: true, b1: true, b2: true };
const NAME = { r: 'root (MAX)', a: 'left MIN', b: 'right MIN', a1: 'MAX node 1', a2: 'MAX node 2', b1: 'MAX node 3', b2: 'MAX node 4' };

const LX = Array.from({ length: 8 }, (_, i) => 60 + i * 80);
const POS = { l0: 0, l1: 1, l2: 2, l3: 3, l4: 4, l5: 5, l6: 6, l7: 7 };
Object.keys(POS).forEach(k => { POS[k] = [LX[POS[k]], 340]; });
['a1', 'a2', 'b1', 'b2'].forEach((n, i) => { POS[n] = [(LX[2 * i] + LX[2 * i + 1]) / 2, 250]; });
POS.a = [(POS.a1[0] + POS.a2[0]) / 2, 160];
POS.b = [(POS.b1[0] + POS.b2[0]) / 2, 160];
POS.r = [(POS.a[0] + POS.b[0]) / 2, 70];

const subtree = (id) => [id, ...(KIDS[id] || []).flatMap(subtree)];

function exactValue(id, leaves) {
  if (id[0] === 'l') return leaves[+id.slice(1)];
  const vals = KIDS[id].map(k => exactValue(k, leaves));
  return IS_MAX[id] ? Math.max(...vals) : Math.min(...vals);
}

// reorder the leaves so each node's children come best-first (or worst-first) for the player to move
function orderedLeaves(leaves, best) {
  const build = (id) => {
    if (id[0] === 'l') return [leaves[+id.slice(1)]];
    const kids = [...KIDS[id]].sort((x, y) => {
      const d = exactValue(x, leaves) - exactValue(y, leaves);
      return (IS_MAX[id] === best) ? -d : d;
    });
    return kids.flatMap(build);
  };
  return build('r');
}

function buildABSteps(leaves, useAB) {
  const steps = [];
  const text = {}, abBox = {}, visited = new Set(), pruned = new Set(), cuts = new Set();
  let evaluated = 0;
  const snap = (current, msg, kind = '') => steps.push({
    text: { ...text }, abBox: JSON.parse(JSON.stringify(abBox)), visited: new Set(visited),
    pruned: new Set(pruned), cuts: new Set(cuts), current, msg, kind, evaluated,
  });

  const search = (id, a, b) => {
    visited.add(id);
    if (id[0] === 'l') {
      const v = leaves[+id.slice(1)];
      text[id] = String(v);
      evaluated++;
      snap(id, `Leaf evaluated → ${fmt(v)}.`);
      return v;
    }
    const isMax = IS_MAX[id];
    if (useAB) abBox[id] = { a, b };
    snap(id, useAB ? `Enter ${NAME[id]} with α = ${fmt(a)}, β = ${fmt(b)}.` : `Enter ${NAME[id]}.`);
    let best = isMax ? -Infinity : Infinity;
    const kids = KIDS[id];
    for (let i = 0; i < kids.length; i++) {
      const r = search(kids[i], a, b);
      best = isMax ? Math.max(best, r) : Math.min(best, r);
      if (useAB) {
        if (isMax) a = Math.max(a, best); else b = Math.min(b, best);
        abBox[id] = { a, b };
      }
      const last = i === kids.length - 1;
      text[id] = last ? String(best) : `${isMax ? '≥' : '≤'}${best}`;
      snap(id, `${NAME[id]}: ${isMax ? 'max' : 'min'} so far = ${fmt(best)}${useAB ? (isMax ? `, α = ${fmt(a)}` : `, β = ${fmt(b)}`) : ''}.`);
      if (useAB && b <= a && !last) {
        const rest = kids.slice(i + 1);
        rest.forEach(k => { cuts.add(`${id}>${k}`); subtree(k).forEach(n => pruned.add(n)); });
        snap(id, `β ≤ α (${fmt(b)} ≤ ${fmt(a)}) → prune the rest of ${NAME[id]}: ${isMax ? 'MIN' : 'MAX'} already has a better option elsewhere.`, 'cut');
        break;
      }
    }
    return best;
  };

  snap(null, useAB ? 'Start: call alpha-beta on the root (MAX) with α = −∞, β = ∞.' : 'Start: call minimax on the root (MAX).');
  const v = search('r', -Infinity, Infinity);
  snap(null, `Done: the root value is ${fmt(v)} — ${evaluated} of 8 leaves evaluated.`, 'win');
  return { steps, value: v };
}

function drawABTree(svg, step, leaves) {
  svg.innerHTML = '';
  const el = (tag, attrs, parent = svg) => {
    const e = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    parent.appendChild(e);
    return e;
  };
  [115, 205, 295].forEach(y => el('line', { x1: 20, y1: y, x2: 660, y2: y, class: 'mm-sep' }));
  [['MAX', 70], ['MIN', 160], ['MAX', 250], ['MIN', 340]].forEach(([t, y]) => { el('text', { x: 700, y: y + 5, class: 'mm-level' }).textContent = t; });

  Object.entries(KIDS).forEach(([p, kids]) => kids.forEach(c => {
    const [x1, y1] = POS[p], [x2, y2] = POS[c];
    el('line', { x1, y1: y1 + 22, x2, y2: y2 - 22, class: 'mm-edge' + (step.pruned.has(c) ? ' pruned' : '') });
    if (step.cuts.has(`${p}>${c}`)) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      el('line', { x1: mx - 18, y1: my + 8, x2: mx + 18, y2: my - 8, class: 'mm-cut' });
      el('line', { x1: mx - 16, y1: my + 13, x2: mx + 20, y2: my - 3, class: 'mm-cut' });
    }
  }));

  Object.entries(POS).forEach(([id, [x, y]]) => {
    const isLeaf = id[0] === 'l';
    const cls = ['mm-node', isLeaf || !IS_MAX[id] ? 'min' : 'max'];
    if (step.pruned.has(id)) cls.push('pruned');
    if (step.visited.has(id)) cls.push('visited');
    if (step.current === id) cls.push('current');
    const g = el('g', { class: cls.join(' ') });
    const label = step.text[id] ?? (isLeaf && !step.pruned.has(id) ? '' : '');
    const t = label.length > 2 ? 30 : 22;
    el('ellipse', { cx: x, cy: y, rx: t, ry: 22 }, g);
    const txt = el('text', { x, y }, g);
    txt.textContent = step.pruned.has(id) && isLeaf ? '?' : label.replace('-', '−');
    if (isLeaf && !step.visited.has(id) && !step.pruned.has(id)) {
      const ghost = el('text', { x, y, class: 'ghost' }, g);
      ghost.textContent = String(leaves[+id.slice(1)]).replace('-', '−');
    }

    const box = step.abBox[id];
    if (box) {
      const bx = x - (id === 'r' ? 96 : 84), by = y - 19;
      const bg = el('g', { class: 'ab-box ' + (IS_MAX[id] ? 'max' : 'min') + (step.current === id ? ' live' : '') });
      el('rect', { x: bx, y: by, width: 58, height: 38, rx: 6 }, bg);
      el('text', { x: bx + 6, y: by + 15 }, bg).textContent = `α=${fmt(box.a)}`;
      el('text', { x: bx + 6, y: by + 31 }, bg).textContent = `β=${fmt(box.b)}`;
    }
  });
}

function initAlphaBeta() {
  const svg = document.getElementById('ab-tree');
  const log = document.getElementById('ab-log');
  const playBtn = document.getElementById('ab-play');
  let leaves = [...LAB_LEAVES], mode = 'ab', run, idx = 0, timer = null;

  function render() {
    const step = run.steps[idx];
    drawABTree(svg, step, leaves);
    document.getElementById('ab-leaves').textContent = `${step.evaluated} / 8`;
    document.getElementById('ab-value').textContent = step.kind === 'win' ? fmt(run.value) : '–';
    log.innerHTML = run.steps.slice(0, idx + 1).map((s, i) =>
      `<p class="${i === idx ? (s.kind === 'win' ? 'win' : 'current') : ''}${s.kind === 'cut' ? ' ab-cut' : ''}">${i}. ${s.msg}</p>`).join('');
    log.scrollTop = log.scrollHeight;
    playBtn.textContent = idx >= run.steps.length - 1 ? '↺' : (timer ? '⏸' : '▶');
    document.getElementById('ab-prev').disabled = idx === 0;
    document.getElementById('ab-next').disabled = idx >= run.steps.length - 1;
  }
  function stop() { clearInterval(timer); timer = null; }
  function reset() { stop(); run = buildABSteps(leaves, mode === 'ab'); idx = 0; render(); }

  document.querySelectorAll('.ab-mode').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.ab-mode').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
    reset();
  }));
  document.getElementById('ab-lab').addEventListener('click', () => { leaves = [...LAB_LEAVES]; reset(); });
  document.getElementById('ab-best').addEventListener('click', () => { leaves = orderedLeaves(leaves, true); reset(); });
  document.getElementById('ab-worst').addEventListener('click', () => { leaves = orderedLeaves(leaves, false); reset(); });
  document.getElementById('ab-random').addEventListener('click', () => { leaves = leaves.map(() => Math.floor(Math.random() * 19) - 9); reset(); });
  document.getElementById('ab-next').addEventListener('click', () => { if (idx < run.steps.length - 1) { idx++; render(); } });
  document.getElementById('ab-prev').addEventListener('click', () => { stop(); if (idx > 0) { idx--; render(); } });
  document.getElementById('ab-reset').addEventListener('click', reset);
  playBtn.addEventListener('click', () => {
    if (idx >= run.steps.length - 1) { reset(); return; }
    if (timer) { stop(); render(); return; }
    timer = setInterval(() => {
      if (idx >= run.steps.length - 1) { stop(); render(); return; }
      idx++; render();
    }, 900);
    render();
  });
  reset();
}

/* ---------- tic-tac-toe against minimax ---------- */
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const winner = (b) => { for (const [x, y, z] of LINES) if (b[x] && b[x] === b[y] && b[y] === b[z]) return { p: b[x], line: [x, y, z] }; return null; };
const full = (b) => b.every(c => c);

// evaluation function from the lab: X wins +1, O wins −1, draw 0
function minimaxTTT(b, xToMove, counter) {
  counter.n++;
  const w = winner(b);
  if (w) return w.p === 'X' ? 1 : -1;
  if (full(b)) return 0;
  let best = xToMove ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = xToMove ? 'X' : 'O';
    const v = minimaxTTT(b, !xToMove, counter);
    b[i] = '';
    best = xToMove ? Math.max(best, v) : Math.min(best, v);
  }
  return best;
}

function alphaBetaTTT(b, xToMove, alpha, beta, counter) {
  counter.n++;
  const w = winner(b);
  if (w) return w.p === 'X' ? 1 : -1;
  if (full(b)) return 0;
  let best = xToMove ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = xToMove ? 'X' : 'O';
    const v = alphaBetaTTT(b, !xToMove, alpha, beta, counter);
    b[i] = '';
    if (xToMove) { best = Math.max(best, v); alpha = Math.max(alpha, best); } else { best = Math.min(best, v); beta = Math.min(beta, best); }
    if (beta <= alpha) break;
  }
  return best;
}

function initTicTacToe() {
  const boardEl = document.getElementById('ttt-board');
  const status = document.getElementById('ttt-status');
  const hintBtn = document.querySelector('.ttt-hint');
  let board, over, hints = false, thinking = false, winLine = null;

  function scoresFor(xToMove) {
    // value of every empty cell for the player to move, via full minimax
    const out = {};
    board.forEach((c, i) => {
      if (c) return;
      board[i] = xToMove ? 'X' : 'O';
      out[i] = minimaxTTT(board, !xToMove, { n: 0 });
      board[i] = '';
    });
    return out;
  }

  function render() {
    const hintVals = hints && !over && !thinking ? scoresFor(true) : {};
    boardEl.innerHTML = board.map((c, i) => {
      const inLine = winLine && winLine.includes(i);
      const h = hintVals[i];
      const hint = h === undefined ? '' : `<span class="ttt-hintval ${h > 0 ? 'good' : h < 0 ? 'bad' : 'even'}">${h > 0 ? '+1' : h < 0 ? '−1' : '0'}</span>`;
      return `<button class="ttt-cell${c ? ' ' + c.toLowerCase() : ''}${inLine ? ' win' : ''}" data-i="${i}" ${c || over || thinking ? 'disabled' : ''} aria-label="cell ${i + 1}${c ? ' ' + c : ''}">${c === 'X' ? '✕' : c === 'O' ? '◯' : hint}</button>`;
    }).join('');
  }

  function finish() {
    const w = winner(board);
    if (w) { over = true; winLine = w.line; status.innerHTML = w.p === 'X' ? '🎉 You win! (+1)' : '🤖 The computer wins (−1).'; return true; }
    if (full(board)) { over = true; status.innerHTML = '🤝 Draw (0) — the best anyone can do against minimax.'; return true; }
    return false;
  }

  function computerMove() {
    thinking = true;
    status.textContent = 'Computer (O, MIN) is searching the game tree…';
    render();
    setTimeout(() => {
      const mm = { n: 0 }, ab = { n: 0 };
      const vals = {};
      board.forEach((c, i) => {
        if (c) return;
        board[i] = 'O';
        vals[i] = minimaxTTT(board, true, mm);
        alphaBetaTTT(board, true, -Infinity, Infinity, ab);
        board[i] = '';
      });
      const best = Math.min(...Object.values(vals));
      const options = Object.keys(vals).filter(i => vals[i] === best).map(Number);
      const immediate = options.find(i => { board[i] = 'O'; const w = winner(board); board[i] = ''; return w; });
      const move = immediate ?? options[Math.floor(Math.random() * options.length)];
      board[move] = 'O';
      document.getElementById('ttt-mm').textContent = mm.n.toLocaleString();
      document.getElementById('ttt-ab').textContent = ab.n.toLocaleString();
      thinking = false;
      if (!finish()) status.innerHTML = `Computer played cell ${move + 1} (minimax value ${fmt(best)}). Your move — you are <b>X</b>.`;
      render();
    }, 350);
  }

  boardEl.addEventListener('click', (e) => {
    const cell = e.target.closest('.ttt-cell');
    if (!cell || cell.disabled) return;
    board[+cell.dataset.i] = 'X';
    if (finish()) { render(); return; }
    computerMove();
  });

  function newGame(computerFirst = false, start = null) {
    board = start ? [...start] : Array(9).fill('');
    over = false; winLine = null;
    document.getElementById('ttt-mm').textContent = '–';
    document.getElementById('ttt-ab').textContent = '–';
    if (computerFirst) computerMove();
    else { status.innerHTML = 'Your move — you are <b>X</b> (MAX).'; render(); }
  }

  hintBtn.addEventListener('click', () => { hints = !hints; hintBtn.classList.toggle('active', hints); render(); });
  document.getElementById('ttt-new').addEventListener('click', () => newGame(false));
  document.getElementById('ttt-ofirst').addEventListener('click', () => newGame(true));
  // the position at the root of the lecture's game tree, O (MIN) to move
  document.getElementById('ttt-lecture').addEventListener('click', () => newGame(true, ['O', 'X', 'O', 'X', '', 'X', '', 'O', '']));
  newGame(false);
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initStages();
  initAlphaBeta();
  initTicTacToe();
});
