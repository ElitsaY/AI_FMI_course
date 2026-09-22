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

  renderPuzzleBoard(goalEl, PUZZLE_GOAL, false);

  let showWork = false;

  function render() {
    renderPuzzleBoard(startEl, PUZZLE_START, showWork);
    let h1 = 0, h2 = 0;
    tbody.innerHTML = '';
    for (let tile = 1; tile <= 8; tile++) {
      const s = posOf(PUZZLE_START, tile);
      const g = posOf(PUZZLE_GOAL, tile);
      const misplaced = (s.row !== g.row || s.col !== g.col);
      const manhattan = Math.abs(s.row - g.row) + Math.abs(s.col - g.col);
      h1 += misplaced ? 1 : 0;
      h2 += manhattan;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${tile}</td><td>${misplaced ? '1' : '0'}</td><td>${manhattan}</td>`;
      tbody.appendChild(tr);
    }
    h1Out.textContent = h1;
    h2Out.textContent = h2;
  }

  document.getElementById('puzzle-toggle').addEventListener('click', (e) => {
    showWork = !showWork;
    e.target.textContent = showWork ? 'Hide per-tile breakdown' : 'Show per-tile breakdown';
    document.getElementById('puzzle-table-wrap').style.display = showWork ? 'block' : 'none';
    render();
  });

  render();
}

/* ---------- admissibility / consistency example (S-A-B-C) ---------- */
const AC_NODES = { S: { h: 4 }, A: { h: 3 }, B: { h: 0 }, C: { h: 0 } };
const AC_EDGES = [['S', 'A', 1], ['A', 'B', 1], ['B', 'C', 2]];
// true cost-to-goal (C) from each node, along the only path
const AC_TRUE = { C: 0, B: 2, A: 3, S: 4 };

function initAdmissibility() {
  const admissGrid = document.getElementById('admiss-grid');
  const consistGrid = document.getElementById('consist-grid');

  Object.keys(AC_NODES).forEach(id => {
    const h = AC_NODES[id].h;
    const hstar = AC_TRUE[id];
    const pass = h <= hstar;
    const card = document.createElement('div');
    card.className = 'check-card ' + (pass ? 'pass' : 'fail');
    card.innerHTML = `<div class="node-id">${id}</div>
      <div class="ineq">h(${id})=${h} ${pass ? '≤' : '>'} h*(${id})=${hstar}</div>
      <div class="verdict">${pass ? 'admissible' : 'violates admissibility'}</div>`;
    admissGrid.appendChild(card);
  });

  AC_EDGES.forEach(([n, np, cost]) => {
    const hn = AC_NODES[n].h, hnp = AC_NODES[np].h;
    const pass = hn <= cost + hnp;
    const card = document.createElement('div');
    card.className = 'check-card ' + (pass ? 'pass' : 'fail');
    card.innerHTML = `<div class="node-id">${n} → ${np}</div>
      <div class="ineq">h(${n})=${hn} ${pass ? '≤' : '>'} ${cost}+h(${np})=${cost + hnp}</div>
      <div class="verdict">${pass ? 'consistent' : 'inconsistent here'}</div>`;
    consistGrid.appendChild(card);
  });
}

/* ---------- main search graph (Greedy / Beam / Hill Climbing / A*) ---------- */
const GRAPH = {
  S: { h: 7, x: 330, y: 34 },
  A: { h: 8, x: 120, y: 130 },
  B: { h: 6, x: 330, y: 130 },
  C: { h: 5, x: 540, y: 130 },
  D: { h: 5, x: 150, y: 230 },
  F: { h: 3, x: 400, y: 230 },
  E: { h: 3, x: 580, y: 230 },
  H: { h: 7, x: 60, y: 330 },
  I: { h: 4, x: 250, y: 330 },
  J: { h: 5, x: 60, y: 430 },
  K: { h: 3, x: 240, y: 430 },
  G: { h: 0, x: 500, y: 430, goal: true },
};
const GRAPH_EDGES = [
  ['S', 'A', 4], ['S', 'B', 10], ['S', 'C', 11],
  ['A', 'B', 8], ['A', 'D', 5],
  ['B', 'D', 15],
  ['C', 'D', 8], ['C', 'E', 2],
  ['D', 'H', 16], ['D', 'I', 20], ['D', 'F', 1],
  ['H', 'I', 1], ['H', 'J', 2],
  ['I', 'K', 13], ['I', 'G', 5],
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
    const x1 = a.x + ux * 24, y1 = a.y + uy * 24;
    const x2 = b.x - ux * 26, y2 = b.y - uy * 26;

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
    circle.setAttribute('cx', node.x); circle.setAttribute('cy', node.y); circle.setAttribute('r', 22);
    circle.setAttribute('fill', '#fff');
    circle.setAttribute('stroke', node.goal ? '#12a894' : 'var(--indigo)');
    g.appendChild(circle);

    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', node.x); text.setAttribute('y', node.y + 4);
    text.setAttribute('text-anchor', 'middle');
    text.textContent = id;
    g.appendChild(text);

    const hLabel = document.createElementNS(ns, 'text');
    hLabel.setAttribute('x', node.x); hLabel.setAttribute('y', node.y + 36);
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
      frontier.length = cap;
      capNote = ` Frontier capped to the best ${cap}.`;
    }

    steps.push({
      frontier: [...frontier], current, expandedStates: new Set(expandedStates),
      message: outs.length
        ? `Expand ${current.state} (g=${current.g}) → generate ${outs.map(o => o[0]).join(', ')}.${capNote}`
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

function initSearchPlayground() {
  const svg = document.getElementById('graph-playground');
  const frontierChips = document.getElementById('sp-frontier-chips');
  const frontierTitle = document.getElementById('sp-frontier-title');
  const log = document.getElementById('sp-log');
  const playBtn = document.getElementById('sp-play');
  const beamControl = document.getElementById('sp-beam-control');
  const beamSlider = document.getElementById('sp-beam-slider');
  const beamVal = document.getElementById('sp-beam-val');

  let strategy = 'greedy';
  let beamWidth = +beamSlider.value;
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
    document.getElementById('sp-prev').disabled = idx === 0;
    document.getElementById('sp-next').disabled = idx >= steps.length - 1;
  }

  function stop() { clearInterval(timer); timer = null; }

  function reset() {
    stop();
    steps = buildSearchSteps(strategy, beamWidth);
    idx = 0;
    render();
  }

  document.querySelectorAll('.sp-strat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sp-strat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      strategy = btn.dataset.s;
      beamControl.classList.toggle('show', strategy === 'beam');
      reset();
    });
  });

  beamSlider.addEventListener('input', () => {
    beamWidth = +beamSlider.value;
    beamVal.textContent = beamWidth;
    titles.beam = `Frontier (priority queue, ranked by h(n) — capped at ${beamWidth})`;
    reset();
  });

  document.getElementById('sp-next').addEventListener('click', () => { if (idx < steps.length - 1) { idx++; render(); } });
  document.getElementById('sp-prev').addEventListener('click', () => { stop(); if (idx > 0) { idx--; render(); } });
  document.getElementById('sp-reset').addEventListener('click', reset);
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
  initAdmissibility();
  initSearchPlayground();
  initSA();
  initQuiz();
});
