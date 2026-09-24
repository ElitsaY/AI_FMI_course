/* ===== Lab 03 interactivity ===== */

const SVG_NS = 'http://www.w3.org/2000/svg';

/* ---------- map colouring data ---------- */
const COLORS = { r: '#d9546e', g: '#5c9a6a', b: '#4d7ea8' };
const COLOR_NAMES = { r: 'red', g: 'green', b: 'blue' };
const VALUE_ORDER = ['r', 'g', 'b'];

const REGIONS = ['WA', 'NT', 'Q', 'NSW', 'V', 'SA', 'T'];
const REGION_NAMES = {
  WA: 'Western Australia', NT: 'Northern Territory', Q: 'Queensland', NSW: 'New South Wales',
  V: 'Victoria', SA: 'South Australia', T: 'Tasmania',
};
const CSP_EDGES = [
  ['WA', 'NT'], ['WA', 'SA'], ['NT', 'SA'], ['NT', 'Q'], ['SA', 'Q'],
  ['SA', 'NSW'], ['SA', 'V'], ['Q', 'NSW'], ['NSW', 'V'],
];
const NEIGHBOURS = {};
REGIONS.forEach(r => { NEIGHBOURS[r] = []; });
CSP_EDGES.forEach(([a, b]) => { NEIGHBOURS[a].push(b); NEIGHBOURS[b].push(a); });

const SOLUTION = { WA: 'r', NT: 'g', Q: 'r', NSW: 'g', V: 'r', SA: 'b', T: 'g' };

// simplified state outlines as [longitude, latitude] — a schematic, not a survey map
const OUTLINES = {
  WA: [[129, -14.9], [127.5, -14], [125, -14.5], [122.5, -16.8], [121, -19.5], [117, -20.6], [114, -22], [113.4, -24.5], [114, -27], [115, -30], [115.1, -33.6], [116.5, -35], [118.5, -34.9], [121.5, -33.8], [124, -33], [126.5, -32.3], [129, -31.7]],
  NT: [[129, -14.9], [129.8, -13.3], [130.3, -12.4], [131.5, -12.2], [133, -11.4], [134.8, -12], [136.6, -12], [136, -13.4], [135.5, -14.8], [136.8, -15.9], [138, -16.6], [138, -26], [129, -26]],
  Q: [[138, -16.6], [139.3, -17.4], [140.8, -17.5], [141.6, -15], [141.6, -12.5], [142.5, -10.7], [143.5, -12.8], [144.3, -14.3], [145.4, -15], [146, -18.9], [148.5, -20.3], [150.2, -22.3], [151.8, -24.2], [153.2, -25.9], [153.5, -28.2], [150.5, -28.6], [141, -29], [141, -26], [138, -26]],
  NSW: [[141, -29], [150.5, -28.6], [153.5, -28.2], [153.1, -30.5], [152.5, -32.3], [151.2, -33.9], [150.7, -35.2], [150, -37.5], [148.2, -36.8], [146, -36], [144, -35.8], [142.3, -34.4], [141, -34]],
  V: [[141, -34], [142.3, -34.4], [144, -35.8], [146, -36], [148.2, -36.8], [150, -37.5], [147.5, -37.9], [146.3, -39.1], [144.9, -38.3], [143.5, -38.8], [141, -38.1]],
  SA: [[129, -26], [138, -26], [141, -26], [141, -29], [141, -34], [141, -38.1], [140, -37.9], [139.6, -37], [138.9, -35.6], [138.1, -35.1], [138.5, -34.5], [137.7, -33.3], [137.6, -35.1], [136.4, -35], [135.6, -34.8], [135.2, -33.6], [134.1, -32.7], [133, -32], [131.2, -31.5], [129, -31.7]],
  T: [[144.6, -40.7], [146.5, -41.1], [148.3, -40.9], [148.3, -42.2], [147.9, -43.1], [146.9, -43.6], [146, -43.5], [145.2, -42.2], [144.7, -41.4]],
};
const LABEL_AT = { WA: [121, -25], NT: [133.5, -19.5], Q: [145, -22], NSW: [146.5, -32], V: [144.6, -37.1], SA: [135, -29.5], T: [146.5, -42.2] };
const proj = ([lon, lat]) => [(lon - 112) * 16, (-lat - 9) * 16];

const GRAPH_POS = { WA: [60, 140], NT: [170, 55], Q: [295, 85], SA: [180, 195], NSW: [320, 195], V: [275, 280], T: [280, 350] };

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (parent) parent.appendChild(e);
  return e;
}

function conflictEdges(assign) {
  return CSP_EDGES.filter(([a, b]) => assign[a] && assign[a] === assign[b]);
}

/* draw the constraint graph with the given assignment; returns the svg for extra decorations */
function drawConstraintGraph(svg, assign, { current = null, onClick = null } = {}) {
  svg.innerHTML = '';
  const bad = conflictEdges(assign);
  CSP_EDGES.forEach(([a, b]) => {
    const isBad = bad.some(([x, y]) => x === a && y === b);
    el('line', {
      x1: GRAPH_POS[a][0], y1: GRAPH_POS[a][1], x2: GRAPH_POS[b][0], y2: GRAPH_POS[b][1],
      class: 'csp-edge' + (isBad ? ' bad' : ''),
    }, svg);
  });
  REGIONS.forEach(r => {
    const [x, y] = GRAPH_POS[r];
    const g = el('g', { class: 'csp-node' + (current === r ? ' current' : '') + (onClick ? ' clickable' : ''), 'data-id': r }, svg);
    el('circle', { cx: x, cy: y, r: 30, style: assign[r] ? `fill:${COLORS[assign[r]]}; stroke:${COLORS[assign[r]]}` : '' }, g);
    const t = el('text', { x, y, class: assign[r] ? 'filled' : '' }, g);
    t.textContent = r;
    if (onClick) g.addEventListener('click', () => onClick(r));
  });
}

/* ---------- linked map + constraint graph ---------- */
function initMapColouring() {
  const mapSvg = document.getElementById('map-svg');
  const graphSvg = document.getElementById('map-graph');
  const status = document.getElementById('map-status');
  let assign = { ...SOLUTION };

  const cycle = (r) => {
    const i = assign[r] ? VALUE_ORDER.indexOf(assign[r]) + 1 : 0;
    if (i < VALUE_ORDER.length) assign[r] = VALUE_ORDER[i]; else delete assign[r];
    render();
  };

  function drawMap() {
    mapSvg.innerHTML = '';
    const bad = conflictEdges(assign);
    const inConflict = new Set(bad.flat());
    REGIONS.forEach(r => {
      const pts = OUTLINES[r].map(p => proj(p).join(',')).join(' ');
      const poly = el('polygon', {
        points: pts, class: 'csp-region' + (inConflict.has(r) ? ' bad' : ''), 'data-id': r,
        style: assign[r] ? `fill:${COLORS[assign[r]]}` : '',
      }, mapSvg);
      poly.addEventListener('click', () => cycle(r));
      const title = el('title', {}, poly);
      title.textContent = REGION_NAMES[r];
    });
    REGIONS.forEach(r => {
      const [x, y] = proj(LABEL_AT[r]);
      const t = el('text', { x, y, class: 'csp-region-label' + (assign[r] ? ' filled' : '') }, mapSvg);
      t.textContent = r;
      t.addEventListener('click', () => cycle(r));
    });
  }

  function render() {
    drawMap();
    drawConstraintGraph(graphSvg, assign, { onClick: cycle });
    const bad = conflictEdges(assign);
    const assigned = REGIONS.filter(r => assign[r]).length;
    if (bad.length) {
      status.innerHTML = `❌ ${bad.length} violated constraint${bad.length === 1 ? '' : 's'}: ${bad.map(([a, b]) => `${a} ≠ ${b}`).join(', ')}`;
      status.className = 'csp-status bad';
    } else if (assigned === REGIONS.length) {
      status.innerHTML = '✅ All 7 variables assigned and every constraint satisfied — this is a solution.';
      status.className = 'csp-status ok';
    } else {
      status.innerHTML = `${assigned} / 7 variables assigned, no violated constraints so far.`;
      status.className = 'csp-status';
    }
  }

  document.getElementById('map-solution').addEventListener('click', () => { assign = { ...SOLUTION }; render(); });
  document.getElementById('map-clear').addEventListener('click', () => { assign = {}; render(); });
  render();
}

/* ---------- backtracking with optional forward checking, MRV and LCV ---------- */
const BT_ORDER = ['WA', 'NSW', 'NT', 'Q', 'SA', 'V', 'T'];

function buildBacktrackingSteps({ fc, mrv, lcv }) {
  const steps = [];
  const assign = {};
  let domains = Object.fromEntries(REGIONS.map(r => [r, [...VALUE_ORDER]]));
  let assigns = 0, backtracks = 0;
  const cn = (c) => COLOR_NAMES[c];

  const snap = (message, current = null, kind = '') => steps.push({
    assign: { ...assign }, domains: JSON.parse(JSON.stringify(domains)), current, message, kind, assigns, backtracks,
  });

  // values still possible for v given the current assignment (and pruned domains when FC is on)
  const legal = (v) => domains[v].filter(c => NEIGHBOURS[v].every(n => assign[n] !== c));

  const selectVar = () => {
    const un = BT_ORDER.filter(v => !assign[v]);
    if (!mrv) return un[0];
    return un.reduce((best, v) => (legal(v).length < legal(best).length ? v : best));
  };

  const orderValues = (v) => {
    const vals = fc ? [...domains[v]] : [...VALUE_ORDER];
    if (!lcv) return vals;
    const ruled = (c) => NEIGHBOURS[v].filter(n => !assign[n] && legal(n).includes(c)).length;
    return vals.sort((a, b) => ruled(a) - ruled(b));
  };

  snap(`Start: variable order ${mrv ? 'chosen by MRV' : BT_ORDER.join(', ')}; values ${lcv ? 'ordered by LCV' : 'red, green, blue'}.`);

  const bt = () => {
    if (REGIONS.every(r => assign[r])) {
      snap('All variables assigned — 🎯 solution found!', null, 'win');
      return true;
    }
    const v = selectVar();
    const vals = orderValues(v);
    snap(mrv
      ? `MRV picks ${v} (${legal(v).length} value${legal(v).length === 1 ? '' : 's'} left)${lcv ? `; LCV order: ${vals.map(cn).join(', ')}` : ''}.`
      : `Next variable: ${v}${lcv ? ` — LCV order: ${vals.map(cn).join(', ')}` : ''}.`, v);

    for (const c of vals) {
      if (!fc) {
        const clash = NEIGHBOURS[v].find(n => assign[n] === c);
        if (clash) { snap(`${v} = ${cn(c)} conflicts with ${clash} = ${cn(c)} → try the next value.`, v, 'reject'); continue; }
      }
      assign[v] = c; assigns++;
      const saved = JSON.parse(JSON.stringify(domains));
      if (fc) {
        const touched = NEIGHBOURS[v].filter(n => !assign[n] && domains[n].includes(c));
        touched.forEach(n => { domains[n] = domains[n].filter(x => x !== c); });
        const empty = NEIGHBOURS[v].find(n => !assign[n] && domains[n].length === 0);
        if (empty) {
          snap(`Assign ${v} = ${cn(c)}. Forward checking: domain of ${empty} is now empty → undo.`, v, 'reject');
          domains = saved; delete assign[v];
          continue;
        }
        snap(`Assign ${v} = ${cn(c)}.${touched.length ? ` Forward checking removes ${cn(c)} from ${touched.join(', ')}.` : ''}`, v);
      } else {
        snap(`Assign ${v} = ${cn(c)}.`, v);
      }
      if (bt()) return true;
      domains = saved; delete assign[v];
      snap(`Undo ${v} = ${cn(c)}.`, v, 'undo');
    }
    backtracks++;
    snap(`No value left for ${v} → backtrack.`, v, 'fail');
    return false;
  };

  bt();
  return steps;
}

function initBacktracking() {
  const svg = document.getElementById('bt-graph');
  const domainsEl = document.getElementById('bt-domains');
  const log = document.getElementById('bt-log');
  const playBtn = document.getElementById('bt-play');
  const opts = { fc: false, mrv: false, lcv: false };
  let steps = buildBacktrackingSteps(opts);
  let idx = 0, timer = null;

  function render() {
    const step = steps[idx];
    drawConstraintGraph(svg, step.assign, { current: step.current });
    domainsEl.innerHTML = BT_ORDER.map(v => {
      const sw = VALUE_ORDER.map(c => {
        const on = step.domains[v].includes(c);
        const chosen = step.assign[v] === c;
        return `<span class="dom-swatch${on ? '' : ' pruned'}${chosen ? ' chosen' : ''}" style="background:${COLORS[c]}" title="${COLOR_NAMES[c]}${on ? '' : ' (pruned)'}"></span>`;
      }).join('');
      return `<div class="dom-row${step.current === v ? ' current' : ''}"><span class="dom-var">${v}</span>${sw}</div>`;
    }).join('');
    document.getElementById('bt-assigns').textContent = step.assigns;
    document.getElementById('bt-backtracks').textContent = step.backtracks;
    log.innerHTML = steps.slice(0, idx + 1).map((s, i) => {
      const cls = i === idx ? (s.kind === 'win' ? 'win' : 'current') : '';
      return `<p class="${cls}${s.kind === 'fail' || s.kind === 'reject' ? ' bt-bad' : ''}">${i}. ${s.message}</p>`;
    }).join('');
    log.scrollTop = log.scrollHeight;
    playBtn.textContent = idx >= steps.length - 1 ? '↺' : (timer ? '⏸' : '▶');
    document.getElementById('bt-prev').disabled = idx === 0;
    document.getElementById('bt-next').disabled = idx >= steps.length - 1;
  }

  function stop() { clearInterval(timer); timer = null; }
  function reset() { stop(); steps = buildBacktrackingSteps(opts); idx = 0; render(); }

  document.querySelectorAll('.bt-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      opts[btn.dataset.opt] = !opts[btn.dataset.opt];
      btn.classList.toggle('active', opts[btn.dataset.opt]);
      reset();
    });
  });
  document.getElementById('bt-next').addEventListener('click', () => { if (idx < steps.length - 1) { idx++; render(); } });
  document.getElementById('bt-prev').addEventListener('click', () => { stop(); if (idx > 0) { idx--; render(); } });
  document.getElementById('bt-reset').addEventListener('click', reset);
  playBtn.addEventListener('click', () => {
    if (idx >= steps.length - 1) { reset(); return; }
    if (timer) { stop(); render(); return; }
    timer = setInterval(() => {
      if (idx >= steps.length - 1) { stop(); render(); return; }
      idx++; render();
    }, 900);
    render();
  });
  render();
}

/* ---------- N-queens with min-conflicts ---------- */
function initNQueens() {
  const boardEl = document.getElementById('nq-board');
  const arraysEl = document.getElementById('nq-arrays');
  const log = document.getElementById('nq-log');
  const slider = document.getElementById('nq-n');
  const playBtn = document.getElementById('nq-play');

  let n, queenPosition, conflictRows, conflictPositiveDiagonals, conflictNegativeDiagonals;
  let moves = 0, timer = null, logLines = [];
  let picked = null;      // column of the queen chosen in the "pick" half-step
  let rowCosts = null;    // conflicts she would have in each row of her column

  const rand = (k) => Math.floor(Math.random() * k);
  const posD = (row, col) => row + col;
  const negD = (row, col) => n - 1 - row + col;

  function place(col, row, delta) {
    conflictRows[row] += delta;
    conflictPositiveDiagonals[posD(row, col)] += delta;
    conflictNegativeDiagonals[negD(row, col)] += delta;
  }

  // conflicts a queen at (row, col) has with the queens currently on the board
  const cost = (row, col) => conflictRows[row] + conflictPositiveDiagonals[posD(row, col)] + conflictNegativeDiagonals[negD(row, col)];

  const pairs = (k) => (k * (k - 1)) / 2;
  const totalH = () => [...conflictRows, ...conflictPositiveDiagonals, ...conflictNegativeDiagonals].reduce((s, k) => s + pairs(k), 0);

  const queenConflicts = (col) => cost(queenPosition[col], col) - 3; // minus herself in row + both diagonals

  function newBoard() {
    stop();
    n = +slider.value;
    queenPosition = Array.from({ length: n }, () => rand(n));
    conflictRows = Array(n).fill(0);
    conflictPositiveDiagonals = Array(2 * n - 1).fill(0);
    conflictNegativeDiagonals = Array(2 * n - 1).fill(0);
    queenPosition.forEach((row, col) => place(col, row, +1));
    moves = 0; picked = null; rowCosts = null;
    logLines = [`New random board, n = ${n}, h = ${totalH()}.`];
    render();
  }

  // h of the whole board, counting the picked queen at her old row while she is lifted off
  const boardH = () => totalH() + (picked === null ? 0 : rowCosts[queenPosition[picked]]);

  function step() {
    if (picked === null && totalH() === 0) return false;
    if (picked === null) {
      const conflicted = queenPosition.map((_, c) => c).filter(c => queenConflicts(c) > 0);
      picked = conflicted[rand(conflicted.length)];
      place(picked, queenPosition[picked], -1); // remove her from the current row
      rowCosts = Array.from({ length: n }, (_, r) => cost(r, picked));
      logLines.push(`Pick conflicted queen in column ${picked} (row ${queenPosition[picked]}, ${rowCosts[queenPosition[picked]]} conflict${rowCosts[queenPosition[picked]] === 1 ? '' : 's'}).`);
    } else {
      const min = Math.min(...rowCosts);
      const best = rowCosts.map((k, r) => r).filter(r => rowCosts[r] === min);
      const row = best[rand(best.length)];
      const from = queenPosition[picked];
      queenPosition[picked] = row;
      place(picked, row, +1);
      moves++;
      logLines.push(`Move it ${row === from ? 'back to' : 'to'} row ${row} (${min} conflict${min === 1 ? '' : 's'}${best.length > 1 ? `, random among rows ${best.join(', ')}` : ''}) → h = ${totalH()}.`);
      picked = null; rowCosts = null;
      if (totalH() === 0) logLines.push(`🎯 Solved in ${moves} moves.`);
    }
    return true;
  }

  function render() {
    const cell = Math.max(22, Math.min(52, Math.floor(420 / n)));
    boardEl.style.gridTemplateColumns = `repeat(${n}, ${cell}px)`;
    boardEl.style.fontSize = `${Math.round(cell * 0.62)}px`;
    let html = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const dark = (r + c) % 2 === 1;
        const hasQ = picked !== c && queenPosition[c] === r;
        let inner = '', cls = 'nq-cell' + (dark ? ' dark' : '');
        if (hasQ) {
          inner = '♛';
          if (queenConflicts(c) > 0) cls += ' conflict';
        } else if (picked === c) {
          const min = Math.min(...rowCosts);
          inner = `<span class="nq-cost${rowCosts[r] === min ? ' min' : ''}">${rowCosts[r]}</span>`;
          cls += ' picked-col';
          if (r === queenPosition[c]) cls += ' was-here';
        }
        html += `<div class="${cls}" style="height:${cell}px">${inner}</div>`;
      }
    }
    boardEl.innerHTML = html;

    const h = boardH();
    document.getElementById('nq-h').textContent = h;
    document.getElementById('nq-steps').textContent = moves;
    const fmt = (arr) => `[${arr.join(', ')}]`;
    arraysEl.innerHTML = `
      <div><b>queenPosition</b> = ${fmt(queenPosition.map((r, c) => (picked === c ? '·' : r)))}</div>
      <div><b>conflictRows</b> = ${fmt(conflictRows)}</div>
      <div><b>conflictPositiveDiagonals</b> = ${fmt(conflictPositiveDiagonals)}</div>
      <div><b>conflictNegativeDiagonals</b> = ${fmt(conflictNegativeDiagonals)}</div>`;

    log.innerHTML = logLines.map((l, i) => `<p class="${i === logLines.length - 1 ? (h === 0 && picked === null ? 'win' : 'current') : ''}">${l}</p>`).join('');
    log.scrollTop = log.scrollHeight;

    const done = h === 0 && picked === null;
    playBtn.textContent = timer ? '⏸' : '▶';
    playBtn.disabled = done;
    document.getElementById('nq-next').disabled = done;
  }

  function stop() { clearInterval(timer); timer = null; }

  document.getElementById('nq-next').addEventListener('click', () => { stop(); step(); render(); });
  document.getElementById('nq-reset').addEventListener('click', newBoard);
  slider.addEventListener('input', () => { document.getElementById('nq-n-val').textContent = slider.value; newBoard(); });
  playBtn.addEventListener('click', () => {
    if (timer) { stop(); render(); return; }
    timer = setInterval(() => {
      if (!step()) { stop(); }
      render();
    }, 350);
    render();
  });

  newBoard();
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initMapColouring();
  initBacktracking();
  initNQueens();
});
