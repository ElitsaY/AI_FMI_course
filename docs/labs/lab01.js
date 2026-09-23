/* ===== Lab 01 interactivity ===== */

/* ---------- Tree data (matches the lecture's S/A/B/C/D/E/F/G1/G2 example) ---------- */
const TREE = {
  S:  { children: ['A', 'B', 'C'], x: 320, y: 40 },
  A:  { children: ['D', 'E'],      x: 140, y: 160, parent: 'S', cost: 1 },
  B:  { children: [],              x: 320, y: 160, parent: 'S', cost: 4 },
  C:  { children: ['F', 'G2'],     x: 500, y: 160, parent: 'S', cost: 2 },
  D:  { children: ['G1'],          x: 80,  y: 280, parent: 'A', cost: 2 },
  E:  { children: [],              x: 220, y: 280, parent: 'A', cost: 3 },
  F:  { children: [],              x: 440, y: 280, parent: 'C', cost: 1 },
  G2: { children: [],              x: 580, y: 280, parent: 'C', cost: 5, goal: true },
  G1: { children: [],              x: 80,  y: 400, parent: 'D', cost: 1, goal: true },
};
const ROOT = 'S';

function depthOf(id) {
  let d = 0, n = id;
  while (TREE[n].parent) { n = TREE[n].parent; d++; }
  return d;
}
function pathOf(id) {
  const p = [id];
  let n = id;
  while (TREE[n].parent) { n = TREE[n].parent; p.unshift(n); }
  return p;
}
function costOf(id) {
  return pathOf(id).reduce((sum, n) => sum + (TREE[n].cost || 0), 0);
}

/* ---------- SVG rendering ---------- */
function renderTreeSVG(svgEl, { showBdm = false } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  svgEl.innerHTML = '';

  // edges first (so nodes draw on top)
  Object.entries(TREE).forEach(([id, node]) => {
    if (!node.parent) return;
    const p = TREE[node.parent];
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('class', 'edge');
    line.setAttribute('x1', p.x); line.setAttribute('y1', p.y + 22);
    line.setAttribute('x2', node.x); line.setAttribute('y2', node.y - 22);
    line.setAttribute('data-edge', `${node.parent}-${id}`);
    svgEl.appendChild(line);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('class', 'edge-label');
    label.setAttribute('x', (p.x + node.x) / 2 + 8);
    label.setAttribute('y', (p.y + node.y) / 2);
    label.textContent = showBdm ? '' : node.cost;
    svgEl.appendChild(label);
  });

  // depth guide lines + labels when showing b/d/m
  if (showBdm) {
    const depths = [...new Set(Object.values(TREE).map(n => n.y))].sort((a, b) => a - b);
    depths.forEach((y, i) => {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', 10); line.setAttribute('x2', 630);
      line.setAttribute('y1', y); line.setAttribute('y2', y);
      line.setAttribute('stroke', '#e3ccff');
      line.setAttribute('stroke-dasharray', '3 4');
      svgEl.appendChild(line);
      const t = document.createElementNS(ns, 'text');
      t.setAttribute('x', 14); t.setAttribute('y', y - 8);
      t.setAttribute('font-size', '11'); t.setAttribute('font-weight', '800');
      t.setAttribute('fill', '#8a5cf6');
      t.textContent = `depth ${i}` + (i === 2 ? '  ← d (shallowest goal, G2)' : i === 3 ? '  ← m (max depth)' : '');
      svgEl.appendChild(t);
    });
  }

  Object.entries(TREE).forEach(([id, node]) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'node' + (node.goal ? ' goal' : ''));
    g.setAttribute('data-id', id);

    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', node.x); circle.setAttribute('cy', node.y); circle.setAttribute('r', 22);
    circle.setAttribute('fill', '#fff');
    circle.setAttribute('stroke', node.goal ? '#12a894' : '#4b3f97');
    g.appendChild(circle);

    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', node.x); text.setAttribute('y', node.y + 5);
    text.setAttribute('text-anchor', 'middle');
    text.textContent = id;
    g.appendChild(text);

    if (showBdm && node.children.length) {
      const bLabel = document.createElementNS(ns, 'text');
      bLabel.setAttribute('x', node.x); bLabel.setAttribute('y', node.y + 40);
      bLabel.setAttribute('text-anchor', 'middle');
      bLabel.setAttribute('font-size', '10'); bLabel.setAttribute('font-weight', '800');
      bLabel.setAttribute('fill', '#f2a71b');
      bLabel.textContent = `b=${node.children.length}`;
      g.appendChild(bLabel);
    }

    svgEl.appendChild(g);
  });
}

/* ---------- Tree explorer (click for info) ---------- */
function initExplorer() {
  const svg = document.getElementById('tree-explore');
  const info = document.getElementById('node-info');
  let bdm = false;

  function draw() { renderTreeSVG(svg, { showBdm: bdm }); }
  draw();

  svg.addEventListener('click', (e) => {
    const g = e.target.closest('.node');
    if (!g) return;
    const id = g.getAttribute('data-id');
    const node = TREE[id];
    const path = pathOf(id);
    info.innerHTML = `
      <dl>
        <dt>Node</dt><dd>${id}${node.goal ? ' — 🎯 goal state' : id === ROOT ? ' — initial state' : ''}</dd>
        <dt>Depth</dt><dd>${depthOf(id)}</dd>
        <dt>Path from root</dt><dd>${path.join(' → ')}</dd>
        <dt>Path cost so far</dt><dd>${costOf(id)}</dd>
        <dt>Branching factor here</dt><dd>${node.children.length} child${node.children.length === 1 ? '' : 'ren'} (${node.children.join(', ') || 'none — leaf node'})</dd>
      </dl>`;
  });

  document.querySelectorAll('#tree .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tree .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      bdm = btn.dataset.view === 'bdm';
      draw();
    });
  });
}

/* ---------- Complexity simulator ---------- */
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n > 999999) return n.toExponential(2);
  return Math.round(n).toLocaleString();
}
function sumPow(b, upto) {
  let s = 0;
  for (let i = 0; i <= upto; i++) s += Math.pow(b, i);
  return s;
}
function bfsTime(b, d) { return sumPow(b, d) + b * (Math.pow(b, d) - 1); }
function idsTime(b, d) {
  let s = 0;
  for (let i = 0; i <= d; i++) s += (d + 1 - i) * Math.pow(b, i);
  return s;
}
function dfsTime(b, m) { return sumPow(b, m); }
function ucsTime(b, d) { return bfsTime(b, d); } // using d as stand-in for ceil(C*/eps)

function initSimulator() {
  const bEl = document.getElementById('b-slider');
  const dEl = document.getElementById('d-slider');
  const mEl = document.getElementById('m-slider');
  const bVal = document.getElementById('b-val');
  const dVal = document.getElementById('d-val');
  const mVal = document.getElementById('m-val');
  const timeBars = document.getElementById('time-bars');
  const spaceBars = document.getElementById('space-bars');

  const rows = [
    { key: 'dfs', label: 'DFS', color: 'var(--dfs)' },
    { key: 'bfs', label: 'BFS', color: 'var(--bfs)' },
    { key: 'ucs', label: 'UCS', color: 'var(--ucs)' },
    { key: 'ids', label: 'IDS', color: 'var(--ids)' },
  ];

  function makeRows(container) {
    container.innerHTML = '';
    rows.forEach(r => {
      const row = document.createElement('div');
      row.className = 'bar-row';
      row.innerHTML = `<div class="label" style="color:${r.color}">${r.label}</div>
        <div class="bar-track"><div class="bar-fill" id="${container.id}-${r.key}" style="background:${r.color}; width:0%"></div></div>
        <div class="num" id="${container.id}-${r.key}-num">0</div>`;
      container.appendChild(row);
    });
  }
  makeRows(timeBars);
  makeRows(spaceBars);

  function update() {
    const b = +bEl.value, d = Math.min(+dEl.value, +mEl.value), m = +mEl.value;
    bVal.textContent = b; dVal.textContent = d; mVal.textContent = m;
    if (+dEl.value > m) { dEl.value = m; }

    const time = {
      dfs: dfsTime(b, m),
      bfs: bfsTime(b, d),
      ucs: ucsTime(b, d),
      ids: idsTime(b, d),
    };
    const space = {
      dfs: b * m,
      bfs: bfsTime(b, d),
      ucs: bfsTime(b, d),
      ids: b * d,
    };

    [['time-bars', time], ['space-bars', space]].forEach(([containerId, data]) => {
      const max = Math.max(...Object.values(data), 1);
      rows.forEach(r => {
        const pct = Math.max(4, (Math.log(data[r.key] + 1) / Math.log(max + 1)) * 100);
        document.getElementById(`${containerId}-${r.key}`).style.width = pct + '%';
        document.getElementById(`${containerId}-${r.key}-num`).textContent = fmt(data[r.key]);
      });
    });
  }

  [bEl, dEl, mEl].forEach(el => el.addEventListener('input', update));
  update();
}

/* ---------- Algorithm playground ---------- */
function buildSteps(strategy) {
  const steps = [];
  let frontier; // array of node ids, order matters per structure

  if (strategy === 'dfs') frontier = [ROOT];
  if (strategy === 'bfs') frontier = [ROOT];
  if (strategy === 'ucs') frontier = [ROOT];

  steps.push({
    frontier: [...frontier],
    current: null,
    message: `Start: place root ${ROOT} in the frontier.`,
  });

  const expanded = new Set();

  while (frontier.length) {
    let current;
    if (strategy === 'dfs') current = frontier.pop();
    else if (strategy === 'bfs') current = frontier.shift();
    else { // ucs: pick lowest path cost, stable on insertion order for ties
      let bestIdx = 0;
      for (let i = 1; i < frontier.length; i++) {
        if (costOf(frontier[i]) < costOf(frontier[bestIdx])) bestIdx = i;
      }
      current = frontier.splice(bestIdx, 1)[0];
    }

    expanded.add(current);
    const isGoal = !!TREE[current].goal;

    if (isGoal) {
      steps.push({
        frontier: [...frontier],
        current,
        expandedSet: new Set(expanded),
        message: `Expand ${current} → 🎯 goal test passes! Solution found (cost ${costOf(current)}, depth ${depthOf(current)}).`,
        win: true,
      });
      break;
    }

    const kids = TREE[current].children;
    if (strategy === 'dfs') {
      [...kids].reverse().forEach(k => frontier.push(k));
    } else if (strategy === 'bfs') {
      kids.forEach(k => frontier.push(k));
    } else {
      kids.forEach(k => frontier.push(k));
    }

    steps.push({
      frontier: [...frontier],
      current,
      expandedSet: new Set(expanded),
      message: kids.length
        ? `Expand ${current} → generate ${kids.join(', ')}.`
        : `Expand ${current} → leaf node, nothing to generate.`,
      win: false,
    });
  }

  return steps;
}

/* ---------- IDS: iterative deepening over DLS ---------- */
function buildIDSSteps() {
  const steps = [];
  const MAX_L = 3; // deepest real node (G1) sits at depth 3

  for (let l = 0; l <= MAX_L; l++) {
    steps.push({ iter: true, l, frontier: [], current: null, expandedSet: new Set(), message: `── Iteration l = ${l} ──` });

    let stack = [{ id: ROOT, depth: 0 }];
    const expanded = new Set();
    let found = false;

    while (stack.length) {
      const cur = stack.pop();
      expanded.add(cur.id);
      const isGoal = !!TREE[cur.id].goal;

      if (isGoal) {
        steps.push({
          l, frontier: stack.map(s => s.id), current: cur.id, expandedSet: new Set(expanded),
          message: `Expand ${cur.id} (depth ${cur.depth}) → 🎯 goal test passes! Found at l = ${l}.`,
          win: true,
        });
        found = true;
        break;
      }

      if (cur.depth >= l) {
        steps.push({
          l, frontier: stack.map(s => s.id), current: cur.id, expandedSet: new Set(expanded),
          message: `Expand ${cur.id} (depth ${cur.depth}) → depth limit reached, no successors generated.`,
        });
        continue;
      }

      const kids = TREE[cur.id].children;
      [...kids].reverse().forEach(k => stack.push({ id: k, depth: cur.depth + 1 }));
      steps.push({
        l, frontier: stack.map(s => s.id), current: cur.id, expandedSet: new Set(expanded),
        message: kids.length
          ? `Expand ${cur.id} (depth ${cur.depth}) → generate ${kids.join(', ')}.`
          : `Expand ${cur.id} (depth ${cur.depth}) → leaf, nothing to generate.`,
      });
    }

    if (found) break;
    steps.push({ l, frontier: [], current: null, expandedSet: new Set(), message: `l = ${l}: goal not found — increase the limit and restart from the root.` });
  }

  return steps;
}

function initIDSDemo() {
  const svg = document.getElementById('ids-tree');
  const chips = document.getElementById('ids-stack-chips');
  const log = document.getElementById('ids-log');
  const lVal = document.getElementById('ids-l-val');
  const playBtn = document.getElementById('ids-play');

  const steps = buildIDSSteps();
  let idx = 0;
  let timer = null;

  const DEPTH_Y = [40, 160, 280, 400]; // matches TREE's y per depth level

  function drawLimitLine(l) {
    if (l == null || l >= DEPTH_Y.length - 1) return; // nothing deeper to cut off
    const ns = 'http://www.w3.org/2000/svg';
    const y = (DEPTH_Y[l] + DEPTH_Y[l + 1]) / 2;

    const line = document.createElementNS(ns, 'line');
    line.setAttribute('class', 'limit-line');
    line.setAttribute('x1', 10); line.setAttribute('y1', y);
    line.setAttribute('x2', 630); line.setAttribute('y2', y);
    svg.appendChild(line);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('class', 'limit-label');
    label.setAttribute('x', 560); label.setAttribute('y', y - 8);
    label.textContent = `l = ${l}`;
    svg.appendChild(label);
  }

  function render() {
    renderTreeSVG(svg, { showBdm: false });
    const step = steps[idx];
    const expandedSet = step.expandedSet || new Set();
    drawLimitLine(step.l);

    svg.querySelectorAll('.node').forEach(g => {
      const id = g.getAttribute('data-id');
      g.classList.remove('visited', 'current', 'frontier', 'found');
      if (step.win && id === step.current) g.classList.add('found');
      else if (id === step.current) g.classList.add('current');
      else if (expandedSet.has(id)) g.classList.add('visited');
      else if (step.frontier.includes(id)) g.classList.add('frontier');
    });

    lVal.textContent = step.l;

    chips.innerHTML = step.frontier.length
      ? step.frontier.map(id => `<span class="chip">${id}</span>`).join('')
      : '<span style="color:var(--ink-soft); font-size:0.85rem;">empty</span>';

    log.innerHTML = steps.slice(0, idx + 1).map((s, i) => {
      const cls = i === idx ? (s.win ? 'win' : s.iter ? 'iter' : 'current') : (s.iter ? 'iter' : '');
      return `<p class="${cls}">${s.iter ? s.message : `${i}. ${s.message}`}</p>`;
    }).join('');
    log.scrollTop = log.scrollHeight;

    playBtn.textContent = idx >= steps.length - 1 ? '↺' : (timer ? '⏸' : '▶');
    document.getElementById('ids-prev').disabled = idx === 0;
    document.getElementById('ids-next').disabled = idx >= steps.length - 1;
  }

  function stop() { clearInterval(timer); timer = null; }

  document.getElementById('ids-next').addEventListener('click', () => { if (idx < steps.length - 1) { idx++; render(); } });
  document.getElementById('ids-prev').addEventListener('click', () => { stop(); if (idx > 0) { idx--; render(); } });
  document.getElementById('ids-reset').addEventListener('click', () => { stop(); idx = 0; render(); });
  playBtn.addEventListener('click', () => {
    if (idx >= steps.length - 1) { stop(); idx = 0; render(); return; }
    if (timer) { stop(); render(); return; }
    timer = setInterval(() => {
      if (idx >= steps.length - 1) { stop(); render(); return; }
      idx++; render();
    }, 950);
    render();
  });

  render();
}

/* ---------- Single-strategy demo (reused by DFS, BFS, ...) ---------- */
function initStrategyDemo(strategy, idPrefix) {
  const svg = document.getElementById(`${idPrefix}-tree`);
  const chips = document.getElementById(`${idPrefix}-queue-chips`) || document.getElementById(`${idPrefix}-stack-chips`) || document.getElementById(`${idPrefix}-pq-chips`);
  const log = document.getElementById(`${idPrefix}-log`);
  const playBtn = document.getElementById(`${idPrefix}-play`);

  const steps = buildSteps(strategy);
  let idx = 0;
  let timer = null;

  function render() {
    renderTreeSVG(svg, { showBdm: false });
    const step = steps[idx];
    const expandedSet = step.expandedSet || new Set();

    svg.querySelectorAll('.node').forEach(g => {
      const id = g.getAttribute('data-id');
      g.classList.remove('visited', 'current', 'frontier', 'found');
      if (step.win && id === step.current) g.classList.add('found');
      else if (id === step.current) g.classList.add('current');
      else if (expandedSet.has(id)) g.classList.add('visited');
      else if (step.frontier.includes(id)) g.classList.add('frontier');
    });

    chips.innerHTML = step.frontier.length
      ? step.frontier.map(id => `<span class="chip">${id}${strategy === 'ucs' ? ` (cost ${costOf(id)})` : ''}</span>`).join('')
      : '<span style="color:var(--ink-soft); font-size:0.85rem;">empty</span>';

    log.innerHTML = steps.slice(0, idx + 1).map((s, i) => {
      const cls = i === idx ? (s.win ? 'win' : 'current') : '';
      return `<p class="${cls}">${i}. ${s.message}</p>`;
    }).join('');
    log.scrollTop = log.scrollHeight;

    playBtn.textContent = idx >= steps.length - 1 ? '↺' : (timer ? '⏸' : '▶');
    document.getElementById(`${idPrefix}-prev`).disabled = idx === 0;
    document.getElementById(`${idPrefix}-next`).disabled = idx >= steps.length - 1;
  }

  function stop() { clearInterval(timer); timer = null; }

  document.getElementById(`${idPrefix}-next`).addEventListener('click', () => { if (idx < steps.length - 1) { idx++; render(); } });
  document.getElementById(`${idPrefix}-prev`).addEventListener('click', () => { stop(); if (idx > 0) { idx--; render(); } });
  document.getElementById(`${idPrefix}-reset`).addEventListener('click', () => { stop(); idx = 0; render(); });
  playBtn.addEventListener('click', () => {
    if (idx >= steps.length - 1) { stop(); idx = 0; render(); return; }
    if (timer) { stop(); render(); return; }
    timer = setInterval(() => {
      if (idx >= steps.length - 1) { stop(); render(); return; }
      idx++; render();
    }, 1100);
    render();
  });

  render();
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initExplorer();
  initStrategyDemo('dfs', 'dfs');
  initStrategyDemo('bfs', 'bfs');
  initStrategyDemo('ucs', 'ucs');
  initIDSDemo();
  initSimulator();
});
