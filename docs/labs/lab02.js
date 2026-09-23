/* ===== Lab 02 interactivity ===== */

/* ---------- 8-puzzle heuristic calculator ---------- */
const PUZZLE_START = [7, 2, 4, 5, 0, 6, 8, 3, 1]; // 0 = blank
const PUZZLE_GOAL   = [1, 2, 3, 4, 5, 6, 7, 8, 0];

function posOf(board, tile) {
  const i = board.indexOf(tile);
  return { row: Math.floor(i / 3), col: i % 3 };
}

function renderPuzzleBoard(el, board, highlightMisplaced) {
  el.innerHTML = '';
  board.forEach((tile, i) => {
    const div = document.createElement('div');
    div.className = 'puzzle-tile' + (tile === 0 ? ' blank' : '');
    if (tile !== 0 && highlightMisplaced && tile !== PUZZLE_GOAL[i]) div.classList.add('hl-misplaced');
    div.textContent = tile === 0 ? '' : tile;
    el.appendChild(div);
  });
}

function initPuzzle() {
  const startEl = document.getElementById('puzzle-start');
  const goalEl = document.getElementById('puzzle-goal');
  const tbody = document.getElementById('puzzle-table-body');
  const h1Out = document.getElementById('puzzle-h1');
  const h2Out = document.getElementById('puzzle-h2');
  const movesOut = document.getElementById('puzzle-moves');
  const deltaOut = document.getElementById('puzzle-delta');

  renderPuzzleBoard(goalEl, PUZZLE_GOAL, false);

  let board = [...PUZZLE_START];
  let moves = 0;
  let showWork = false;

  function heuristics(b) {
    let h1 = 0, h2 = 0;
    const rows = [];
    for (let tile = 1; tile <= 8; tile++) {
      const s = posOf(b, tile);
      const g = posOf(PUZZLE_GOAL, tile);
      const misplaced = (s.row !== g.row || s.col !== g.col);
      const manhattan = Math.abs(s.row - g.row) + Math.abs(s.col - g.col);
      h1 += misplaced ? 1 : 0;
      h2 += manhattan;
      rows.push([tile, misplaced ? 1 : 0, manhattan]);
    }
    return { h1, h2, rows };
  }

  function isAdjacentToBlank(i) {
    const b = board.indexOf(0);
    return Math.abs(Math.floor(i / 3) - Math.floor(b / 3)) + Math.abs(i % 3 - b % 3) === 1;
  }

  function render() {
    renderPuzzleBoard(startEl, board, showWork);
    [...startEl.children].forEach((tileEl, i) => {
      if (isAdjacentToBlank(i)) { tileEl.style.cursor = 'pointer'; tileEl.title = 'Slide this tile'; }
    });
    const { h1, h2, rows } = heuristics(board);
    tbody.innerHTML = rows.map(([t, m, d]) => `<tr><td>${t}</td><td>${m}</td><td>${d}</td></tr>`).join('');
    h1Out.textContent = h1;
    h2Out.textContent = h2;
    movesOut.textContent = moves;
  }

  startEl.addEventListener('click', (e) => {
    const i = [...startEl.children].indexOf(e.target);
    if (i < 0 || board[i] === 0 || !isAdjacentToBlank(i)) return;
    const before = heuristics(board);
    const tile = board[i];
    const blank = board.indexOf(0);
    board[blank] = tile; board[i] = 0;
    moves++;
    const after = heuristics(board);
    const d2 = after.h2 - before.h2, d1 = after.h1 - before.h1;
    const sign = (d) => (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d);
    deltaOut.innerHTML = `Moved tile <b>${tile}</b> (cost 1): Δh₂ = <b>${sign(d2)}</b>, Δh₁ = <b>${sign(d1)}</b> — ` +
      `h₂(n) − h₂(n′) = ${-d2 < 0 ? '−' + d2 : -d2} ≤ 1 = cost(n, n′) ✓` +
      (after.h2 === 0 ? ' — 🎯 goal reached!' : '');
    render();
  });

  document.getElementById('puzzle-toggle').addEventListener('click', (e) => {
    showWork = !showWork;
    e.target.textContent = showWork ? 'Hide per-tile breakdown' : 'Show per-tile breakdown';
    document.getElementById('puzzle-table-wrap').style.display = showWork ? 'block' : 'none';
    render();
  });

  document.getElementById('puzzle-reset').addEventListener('click', () => {
    board = [...PUZZLE_START];
    moves = 0;
    deltaOut.textContent = 'No move yet.';
    render();
  });

  render();
}

/* ---------- main search graph (Greedy / Beam / Hill Climbing / A*) ---------- */
const GRAPH = {
  S: { h: 7, x: 290, y: 40 },
  A: { h: 8, x: 110, y: 130 },
  B: { h: 6, x: 265, y: 205 },
  C: { h: 5, x: 410, y: 175 },
  D: { h: 5, x: 200, y: 310 },
  E: { h: 3, x: 465, y: 280 },
  F: { h: 3, x: 365, y: 370 },
  H: { h: 7, x: 90, y: 370 },
  I: { h: 4, x: 240, y: 425 },
  G: { h: 0, x: 510, y: 455, goal: true },
  J: { h: 5, x: 185, y: 545 },
  K: { h: 3, x: 345, y: 545 },
};
const GRAPH_EDGES = [
  ['S', 'A', 4], ['S', 'B', 10], ['S', 'C', 11],
  ['A', 'B', 8], ['A', 'D', 5],
  ['B', 'D', 15],
  ['C', 'D', 8], ['C', 'F', 2], ['C', 'E', 20],
  ['D', 'H', 16], ['D', 'I', 20], ['D', 'F', 1],
  ['H', 'I', 1], ['H', 'J', 2],
  ['I', 'J', 5], ['I', 'K', 13], ['I', 'G', 5],
  ['E', 'G', 19],
  ['F', 'G', 13],
  ['J', 'K', 7],
  ['K', 'G', 16],
];
const GRAPH_ADJ = {};
GRAPH_EDGES.forEach(([from, to, cost]) => {
  (GRAPH_ADJ[from] = GRAPH_ADJ[from] || []).push([to, cost]);
});

function renderGraphSVG(svgEl) {
  const ns = 'http://www.w3.org/2000/svg';
  svgEl.innerHTML = '';

  const defs = document.createElementNS(ns, 'defs');
  defs.innerHTML = `<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#c9c1da"></path></marker>`;
  svgEl.appendChild(defs);

  GRAPH_EDGES.forEach(([from, to, cost]) => {
    const a = GRAPH[from], b = GRAPH[to];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len, uy = dy / len;
    const x1 = a.x + ux * 28, y1 = a.y + uy * 28;
    const x2 = b.x - ux * 30, y2 = b.y - uy * 30;

    const line = document.createElementNS(ns, 'line');
    line.setAttribute('class', 'edge');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('marker-end', 'url(#arrow)');
    svgEl.appendChild(line);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('class', 'edge-label');
    label.setAttribute('x', (x1 + x2) / 2 + 6);
    label.setAttribute('y', (y1 + y2) / 2 - 4);
    label.textContent = cost;
    svgEl.appendChild(label);
  });

  Object.entries(GRAPH).forEach(([id, node]) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'node' + (node.goal ? ' goal' : ''));
    g.setAttribute('data-id', id);

    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', node.x); circle.setAttribute('cy', node.y); circle.setAttribute('r', 26);
    circle.setAttribute('fill', '#fff');
    circle.setAttribute('stroke', node.goal ? '#12a894' : 'var(--indigo)');
    g.appendChild(circle);

    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', node.x); text.setAttribute('y', node.y + 1);
    text.setAttribute('text-anchor', 'middle');
    text.textContent = id;
    g.appendChild(text);

    const hLabel = document.createElementNS(ns, 'text');
    hLabel.setAttribute('x', node.x); hLabel.setAttribute('y', node.y + 15);
    hLabel.setAttribute('text-anchor', 'middle');
    hLabel.setAttribute('font-size', '10'); hLabel.setAttribute('font-weight', '800');
    hLabel.setAttribute('fill', 'var(--ucs)');
    hLabel.textContent = `h=${node.h}`;
    g.appendChild(hLabel);

    svgEl.appendChild(g);
  });
}

function buildSearchSteps(strategy, beamWidth) {
  const priority = (e) => strategy === 'astar' ? e.g + GRAPH[e.state].h : GRAPH[e.state].h;
  const cap = strategy === 'beam' ? beamWidth : strategy === 'hillclimbing' ? 1 : Infinity;

  let frontier = [{ state: 'S', g: 0 }];
  const steps = [{ frontier: [...frontier], current: null, expandedStates: new Set(), message: 'Start: place S in the frontier.' }];
  const expandedStates = new Set();
  let guard = 0;

  while (frontier.length && guard++ < 100) {
    let bestIdx = 0;
    for (let i = 1; i < frontier.length; i++) {
      if (priority(frontier[i]) < priority(frontier[bestIdx])) bestIdx = i;
    }
    const current = frontier.splice(bestIdx, 1)[0];
    expandedStates.add(current.state);
    const isGoal = !!GRAPH[current.state].goal;

    if (isGoal) {
      steps.push({
        frontier: [...frontier], current, expandedStates: new Set(expandedStates),
        message: `Expand ${current.state} → goal test passes! Reached the goal with total cost ${current.g}.`,
        win: true,
      });
      break;
    }

    const outs = GRAPH_ADJ[current.state] || [];
    outs.forEach(([to, cost]) => frontier.push({ state: to, g: current.g + cost }));

    let capNote = '';
    if (isFinite(cap) && frontier.length > cap) {
      frontier.sort((a, b) => priority(a) - priority(b));
      const pruned = frontier.splice(cap).map(e => e.state);
      capNote = ` Frontier capped to the best ${cap} — pruned ${pruned.join(', ')}.`;
    }

    steps.push({
      frontier: [...frontier], current, expandedStates: new Set(expandedStates),
      message: outs.length
        ? `Expand ${current.state} (g=${current.g}${strategy === 'astar' ? `, f=${current.g + GRAPH[current.state].h}` : ''}) → generate ${outs.map(o => o[0]).join(', ')}.${capNote}`
        : `Expand ${current.state} → dead end, nothing to generate.`,
      win: false,
    });
  }

  const last = steps[steps.length - 1];
  if (!last.win && frontier.length === 0) {
    steps.push({
      frontier: [], current: null, expandedStates: new Set(expandedStates),
      message: 'Frontier empty — search failed to reach the goal. This is exactly how a limited frontier (small beam, or hill climbing) can fail.',
      win: false, fail: true,
    });
  }
  return steps;
}

// prefix: id prefix of the playground's controls; strategy: the algorithm it starts on
function initSearchPlayground(prefix, svgId, strategy = 'greedy') {
  const $ = (id) => document.getElementById(`${prefix}-${id}`);
  const svg = document.getElementById(svgId);
  const frontierChips = $('frontier-chips');
  const frontierTitle = $('frontier-title');
  const log = $('log');
  const playBtn = $('play');
  const beamControl = $('beam-control');
  const beamSlider = $('beam-slider');
  const beamVal = $('beam-val');

  let beamWidth = beamSlider ? +beamSlider.value : 2;
  let steps = buildSearchSteps(strategy, beamWidth);
  let idx = 0;
  let timer = null;

  const titles = {
    greedy: 'Frontier (priority queue, ranked by h(n) — no limit)',
    beam: `Frontier (priority queue, ranked by h(n) — capped at ${beamWidth})`,
    hillclimbing: 'Frontier (only the single best child is kept)',
    astar: 'Frontier (priority queue, ranked by f(n) = g(n) + h(n))',
  };

  function priorityLabel(entry) {
    const h = GRAPH[entry.state].h;
    return strategy === 'astar'
      ? `${entry.state}  g=${entry.g} h=${h} f=${entry.g + h}`
      : `${entry.state}  h=${h}`;
  }

  function render() {
    renderGraphSVG(svg);
    const step = steps[idx];
    const expandedStates = step.expandedStates || new Set();

    svg.querySelectorAll('.node').forEach(g => {
      const id = g.getAttribute('data-id');
      g.classList.remove('visited', 'current', 'frontier', 'found');
      if (step.win && step.current && id === step.current.state) g.classList.add('found');
      else if (step.current && id === step.current.state) g.classList.add('current');
      else if (expandedStates.has(id)) g.classList.add('visited');
      else if (step.frontier.some(e => e.state === id)) g.classList.add('frontier');
    });

    frontierTitle.textContent = titles[strategy];
    frontierChips.innerHTML = step.frontier.length
      ? step.frontier.map(e => `<span class="chip">${priorityLabel(e)}</span>`).join('')
      : '<span style="color:var(--ink-soft); font-size:0.85rem;">empty</span>';

    log.innerHTML = steps.slice(0, idx + 1).map((s, i) => {
      const cls = i === idx ? (s.win ? 'win' : s.fail ? 'wrong' : 'current') : '';
      return `<p class="${cls}">${i}. ${s.message}</p>`;
    }).join('');
    log.scrollTop = log.scrollHeight;

    playBtn.textContent = idx >= steps.length - 1 ? '↺' : (timer ? '⏸' : '▶');
    $('prev').disabled = idx === 0;
    $('next').disabled = idx >= steps.length - 1;
  }

  function stop() { clearInterval(timer); timer = null; }

  function reset() {
    stop();
    steps = buildSearchSteps(strategy, beamWidth);
    idx = 0;
    render();
  }

  const stratBtns = document.querySelectorAll(`.${prefix}-strat-btn`);
  stratBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      stratBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      strategy = btn.dataset.s;
      beamControl.classList.toggle('show', strategy === 'beam');
      reset();
    });
  });

  if (beamSlider) beamSlider.addEventListener('input', () => {
    beamWidth = +beamSlider.value;
    beamVal.textContent = beamWidth;
    titles.beam = `Frontier (priority queue, ranked by h(n) — capped at ${beamWidth})`;
    reset();
  });

  $('next').addEventListener('click', () => { if (idx < steps.length - 1) { idx++; render(); } });
  $('prev').addEventListener('click', () => { stop(); if (idx > 0) { idx--; render(); } });
  $('reset').addEventListener('click', reset);
  playBtn.addEventListener('click', () => {
    if (idx >= steps.length - 1) { reset(); return; }
    if (timer) { stop(); render(); return; }
    timer = setInterval(() => {
      if (idx >= steps.length - 1) { stop(); render(); return; }
      idx++; render();
    }, 1100);
    render();
  });

  render();
}

/* ---------- hill climbing landscape (local maxima + random restart) ---------- */
const HC_LAND = [3, 5, 8, 6, 4, 7, 10, 9, 6, 5, 8, 12, 15, 17, 14, 11, 9, 12, 13, 10, 7, 4, 6, 5];

function climbFrom(i) {
  const path = [i];
  while (true) {
    const nbrs = [i - 1, i + 1].filter(j => j >= 0 && j < HC_LAND.length);
    const best = nbrs.reduce((a, b) => HC_LAND[b] > HC_LAND[a] ? b : a);
    if (HC_LAND[best] <= HC_LAND[i]) return path;
    i = best;
    path.push(i);
  }
}

function initHillLandscape() {
  const svg = document.getElementById('hcl-svg');
  const ns = 'http://www.w3.org/2000/svg';
  const W = 640, H = 240, pad = 20;
  const maxV = Math.max(...HC_LAND);
  const globalIdx = HC_LAND.indexOf(maxV);
  const step = (W - 2 * pad) / (HC_LAND.length - 1);
  const X = (i) => pad + i * step;
  const Y = (v) => H - pad - (v / maxV) * (H - 2 * pad - 10);

  let climbs = 0, best = null, timer = null;

  function el(tag, attrs) {
    const e = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    svg.appendChild(e);
    return e;
  }

  function drawBase() {
    svg.innerHTML = '';
    const pts = HC_LAND.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
    el('polygon', { points: `${X(0)},${H - pad} ${pts} ${X(HC_LAND.length - 1)},${H - pad}`, fill: 'color-mix(in srgb, var(--bfs) 14%, transparent)' });
    el('polyline', { points: pts, fill: 'none', stroke: 'var(--bfs)', 'stroke-width': 2.5 });
    el('line', { x1: pad, x2: W - pad, y1: Y(maxV), y2: Y(maxV), stroke: 'var(--ink-soft)', 'stroke-dasharray': '4 4', 'stroke-width': 1 });
    const t = el('text', { x: W - pad, y: Y(maxV) - 6, 'text-anchor': 'end', 'font-size': 11, 'font-weight': 700, fill: 'var(--ink-soft)' });
    t.textContent = 'global maximum';
    HC_LAND.forEach((v, i) => el('circle', { cx: X(i), cy: Y(v), r: 3, fill: 'var(--surface)', stroke: 'var(--bfs)', 'stroke-width': 1.5 }));
  }

  function drawPath(path, upto) {
    drawBase();
    const shown = path.slice(0, upto + 1);
    if (shown.length > 1) {
      el('polyline', { points: shown.map(i => `${X(i)},${Y(HC_LAND[i]) - 8}`).join(' '), fill: 'none', stroke: 'var(--dfs)', 'stroke-width': 2.5 });
    }
    el('circle', { cx: X(path[0]), cy: Y(HC_LAND[path[0]]), r: 6, fill: 'var(--surface)', stroke: 'var(--dfs)', 'stroke-width': 2.5 });
    const cur = shown[shown.length - 1];
    el('circle', { cx: X(cur), cy: Y(HC_LAND[cur]), r: 7, fill: 'var(--dfs)' });
  }

  function render(msg) {
    document.getElementById('hcl-restarts').textContent = climbs;
    document.getElementById('hcl-best').textContent = best === null ? '–' : HC_LAND[best];
    if (msg) document.getElementById('hcl-msg').textContent = msg;
  }

  document.getElementById('hcl-climb').addEventListener('click', () => {
    clearInterval(timer);
    const start = Math.floor(Math.random() * HC_LAND.length);
    const path = climbFrom(start);
    let k = 0;
    drawPath(path, 0);
    timer = setInterval(() => {
      if (++k >= path.length) {
        clearInterval(timer);
        const end = path[path.length - 1];
        climbs++;
        if (best === null || HC_LAND[end] > HC_LAND[best]) best = end;
        document.getElementById('hcl-last').textContent = HC_LAND[end];
        render(end === globalIdx
          ? `Reached the global maximum (${maxV}) after ${climbs} climb${climbs === 1 ? '' : 's'}.`
          : `Stuck on a local maximum (${HC_LAND[end]}) — no neighbour is better. Try a random restart.`);
        return;
      }
      drawPath(path, k);
    }, 250);
  });

  document.getElementById('hcl-reset').addEventListener('click', () => {
    clearInterval(timer);
    climbs = 0; best = null;
    document.getElementById('hcl-last').textContent = '–';
    drawBase();
    render('Click “Random start & climb”. The global maximum is marked with a dashed line.');
  });

  drawBase();
  render();
}

/* ---------- IDA* example tree (f-values in heap order; children of i are 2i+1, 2i+2) ---------- */
const IDA_F = [2, 4, 5, 5, 4, 6, 6, 7, 8, 8, 7, 6, 8, 7, 9, 12, 14, 16, 15, 12, 9, 13, 8, 13, 7, 15, 16, 8, 14, 16, 10];
const IDA_GOAL = 25;

function idaKids(i) {
  return [2 * i + 1, 2 * i + 2].filter(k => k < IDA_F.length);
}

// mode 'generate': goal reported when generated (as in the worked example)
// mode 'expand': goal reported only when visited with f <= threshold (textbook IDA*)
function buildIDAStarSteps(mode) {
  const steps = [];
  let T = IDA_F[0];
  for (let iter = 1; iter <= 20; iter++) {
    const visited = new Set(), pruned = [];
    let found = false;
    const snap = (current, message, extra = {}) => steps.push({
      iter, T, current, visited: new Set(visited), pruned: [...pruned], message, ...extra,
    });
    snap(null, `── Iteration ${iter}: threshold = ${T} ──`, { header: true });

    const dfs = (i) => {
      if (found) return;
      visited.add(i);
      const f = IDA_F[i];
      if (f > T) {
        pruned.push(i);
        snap(i, `Visit ${f}: f = ${f} > ${T} → prune.`);
        return;
      }
      if (mode === 'expand' && i === IDA_GOAL) {
        found = true;
        snap(i, `Visit ${f}: f = ${f} ≤ ${T} and it is the goal → 🎯 found!`, { win: true });
        return;
      }
      const kids = idaKids(i);
      snap(i, kids.length
        ? `Visit ${f}: f = ${f} ≤ ${T} → explore its children ${kids.map(k => IDA_F[k]).join(' & ')}.`
        : `Visit ${f}: f = ${f} ≤ ${T}, but it has no children.`);
      for (const k of kids) {
        if (found) return;
        if (mode === 'generate' && k === IDA_GOAL) {
          visited.add(k);
          found = true;
          snap(k, `Generate ${IDA_F[k]}: it is the goal → 🎯 found!`, { win: true });
          return;
        }
        dfs(k);
      }
    };
    dfs(0);
    if (found) break;
    const next = Math.min(...pruned.map(i => IDA_F[i]));
    snap(null, `Iteration over. Pruned: ${pruned.map(i => IDA_F[i]).join(', ')} → next threshold = min = ${next}.`, { end: true });
    T = next;
  }
  return steps;
}

function initIDAStar() {
  const svg = document.getElementById('ida-tree');
  const ns = 'http://www.w3.org/2000/svg';
  const log = document.getElementById('ida-log');
  const chips = document.getElementById('ida-pruned-chips');
  const tVal = document.getElementById('ida-t-val');
  const playBtn = document.getElementById('ida-play');

  const level = (i) => Math.floor(Math.log2(i + 1));
  const X = [], Y = (i) => 48 + level(i) * 62;
  for (let j = 0; j < 16; j++) X[15 + j] = 22 + j * 45;
  for (let i = 14; i >= 0; i--) X[i] = (X[2 * i + 1] + X[2 * i + 2]) / 2;

  let mode = 'generate';
  let steps = buildIDAStarSteps(mode);
  let idx = 0, timer = null;

  function draw(step) {
    svg.innerHTML = '';
    for (let i = 1; i < IDA_F.length; i++) {
      const p = (i - 1) >> 1;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('class', 'ida-edge');
      line.setAttribute('x1', X[p]); line.setAttribute('y1', Y(p));
      line.setAttribute('x2', X[i]); line.setAttribute('y2', Y(i));
      svg.appendChild(line);
    }
    IDA_F.forEach((f, i) => {
      const g = document.createElementNS(ns, 'g');
      const cls = ['ida-node'];
      if (i === IDA_GOAL) cls.push('goal');
      else if (step.visited.has(i)) cls.push('visited');
      if (step.pruned.includes(i)) cls.push('pruned');
      if (step.current === i) cls.push('current');
      g.setAttribute('class', cls.join(' '));
      g.innerHTML = `<circle cx="${X[i]}" cy="${Y(i)}" r="15"></circle><text x="${X[i]}" y="${Y(i)}">${f}</text>`;
      svg.appendChild(g);
    });
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('class', 'ida-label');
    label.setAttribute('x', X[IDA_GOAL]); label.setAttribute('y', Y(IDA_GOAL) + 30);
    label.setAttribute('text-anchor', 'middle');
    label.textContent = step.win ? 'found' : 'Goal';
    svg.appendChild(label);
  }

  function render() {
    const step = steps[idx];
    draw(step);
    tVal.textContent = step.T;
    chips.innerHTML = step.pruned.length
      ? step.pruned.map(i => `<span class="chip">${IDA_F[i]}</span>`).join('')
      : '<span style="color:var(--ink-soft); font-size:0.85rem;">none yet</span>';
    log.innerHTML = steps.slice(0, idx + 1).map((s, i) => {
      if (s.header) return `<p class="iter">${s.message}</p>`;
      const cls = i === idx ? (s.win ? 'win' : 'current') : '';
      return `<p class="${cls}">${s.message}</p>`;
    }).join('');
    log.scrollTop = log.scrollHeight;
    playBtn.textContent = idx >= steps.length - 1 ? '↺' : (timer ? '⏸' : '▶');
    document.getElementById('ida-prev').disabled = idx === 0;
    document.getElementById('ida-next').disabled = idx >= steps.length - 1;
    document.getElementById('ida-iter').disabled = idx >= steps.length - 1;
  }

  function stop() { clearInterval(timer); timer = null; }
  function reset() { stop(); steps = buildIDAStarSteps(mode); idx = 0; render(); }

  document.querySelectorAll('.ida-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ida-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
      reset();
    });
  });
  document.getElementById('ida-next').addEventListener('click', () => { if (idx < steps.length - 1) { idx++; render(); } });
  document.getElementById('ida-prev').addEventListener('click', () => { stop(); if (idx > 0) { idx--; render(); } });
  document.getElementById('ida-iter').addEventListener('click', () => {
    stop();
    while (idx < steps.length - 1) { idx++; if (steps[idx].end || steps[idx].win) break; }
    render();
  });
  document.getElementById('ida-reset').addEventListener('click', reset);
  playBtn.addEventListener('click', () => {
    if (idx >= steps.length - 1) { reset(); return; }
    if (timer) { stop(); render(); return; }
    timer = setInterval(() => {
      if (idx >= steps.length - 1) { stop(); render(); return; }
      idx++; render();
    }, 700);
    render();
  });

  render();
}

/* ---------- simulated annealing acceptance widget ---------- */
function initSA() {
  const tSlider = document.getElementById('sa-t-slider');
  const dSlider = document.getElementById('sa-d-slider');
  const tVal = document.getElementById('sa-t-val');
  const dVal = document.getElementById('sa-d-val');
  const pOut = document.getElementById('sa-p-val');
  const bar = document.getElementById('sa-bar-fill');

  function update() {
    const T = +tSlider.value, D = +dSlider.value;
    tVal.textContent = T;
    dVal.textContent = D;
    const p = Math.exp(-D / T);
    pOut.textContent = (p * 100).toFixed(1) + '%';
    bar.style.width = Math.max(2, p * 100) + '%';
  }
  [tSlider, dSlider].forEach(el => el.addEventListener('input', update));
  update();
}

/* ---------- quiz ---------- */
const QUIZ2 = [
  {
    q: 'An admissible heuristic must satisfy which condition?',
    opts: ['h(n) ≥ h*(n) for all n', 'h(n) ≤ h*(n) for all n', 'h(n) = h*(n) for all n', 'h(n) is always 0'],
    correct: 1,
  },
  {
    q: 'Beam search with queue limit l = 1 is the same as...',
    opts: ['Breadth-First Search', 'A*', 'Hill Climbing', 'Uniform-Cost Search'],
    correct: 2,
  },
  {
    q: 'Why is greedy best-first search not optimal?',
    opts: [
      'It ignores h(n) completely',
      'It ranks the frontier only by h(n), ignoring the cost already paid to reach n',
      'It can only run on trees, not graphs',
      'It never terminates',
    ],
    correct: 1,
  },
  {
    q: 'For A* with GRAPH-SEARCH to be guaranteed optimal, the heuristic must be...',
    opts: ['Admissible only', 'Consistent', 'Equal to 0 everywhere', 'Larger than the true cost'],
    correct: 1,
  },
  {
    q: 'Given two admissible heuristics h_a and h_b, is h(n) = max(h_a(n), h_b(n)) admissible?',
    opts: ['No, taking the max breaks admissibility', 'Yes, and it dominates both h_a and h_b', 'Only if h_a = h_b', 'Only for consistent heuristics'],
    correct: 1,
  },
];

function initQuiz() {
  const container = document.getElementById('quiz-container');
  let score = 0;

  const scoreBar = document.createElement('div');
  scoreBar.className = 'quiz-score';
  scoreBar.innerHTML = `<span>Score</span><span id="quiz-score-val">0 / ${QUIZ2.length}</span>`;

  QUIZ2.forEach((item, qi) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `<p class="q">${qi + 1}. ${item.q}</p>
      <div class="quiz-opts">
        ${item.opts.map((o, oi) => `<button class="quiz-opt" data-oi="${oi}">${o}</button>`).join('')}
      </div>`;
    card.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const oi = +btn.dataset.oi;
        card.querySelectorAll('.quiz-opt').forEach(b => b.disabled = true);
        if (oi === item.correct) { btn.classList.add('correct'); score++; }
        else {
          btn.classList.add('wrong');
          card.querySelector(`[data-oi="${item.correct}"]`).classList.add('correct');
        }
        document.getElementById('quiz-score-val').textContent = `${score} / ${QUIZ2.length}`;
      });
    });
    container.appendChild(card);
  });
  container.appendChild(scoreBar);
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initPuzzle();
  initSearchPlayground('greedy', 'greedy-graph', 'greedy');
  initSearchPlayground('beam', 'beam-graph', 'beam');
  initSearchPlayground('hc', 'hc-graph', 'hillclimbing');
  initSearchPlayground('astar', 'astar-graph', 'astar');
  initHillLandscape();
  initIDAStar();
  initSA();
  initQuiz();
});
