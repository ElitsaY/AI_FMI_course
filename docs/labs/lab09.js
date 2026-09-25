/* ===== Lab 09 interactivity ===== */

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
  if (parent) parent.appendChild(e);
  return e;
}
function txt(parent, x, y, s, cls = 'tick', anchor = 'start', extra = {}) {
  const t = el('text', { x, y, class: cls, 'text-anchor': anchor, ...extra }, parent);
  t.textContent = s;
  return t;
}
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function gauss(r) { const u = Math.max(r(), 1e-9), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function svgPoint(svg, e) {
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
const f3 = (v) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3);
const pct = (v) => (v * 100).toFixed(1) + '%';

/* entropy of a list of class counts (0 · log 0 = 0) */
function entropy(counts) {
  const n = counts.reduce((s, c) => s + c, 0);
  return n ? -counts.reduce((s, c) => s + (c ? (c / n) * Math.log2(c / n) : 0), 0) : 0;
}

/* ---------- maths rendering ---------- */
function initMath() {
  if (!window.renderMathInElement) return;
  renderMathInElement(document.body, {
    delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
    throwOnError: false,
  });
}

/* ---------- hero: a small forest of binary trees ---------- */
function initHero() {
  const svg = document.getElementById('dt-hero-bg');
  const r = rng(9), lines = [], nodes = [];
  function grow(x, y, w, h, d) {
    if (d === 0 || (d < 3 && r() < 0.3)) { nodes.push(['leaf', x, y]); return; }
    nodes.push(['node', x, y]);
    [-1, 1].forEach(s => { const cx = x + s * w / 2, cy = y + h; lines.push([x, y, cx, cy]); grow(cx, cy, w / 2, h * 0.92, d - 1); });
  }
  [[90, 40, 150, 3], [330, 25, 230, 4], [620, 55, 170, 3], [880, 30, 230, 4], [1130, 50, 150, 3]].forEach(([x, y, w, d]) => grow(x, y, w, 58, d));
  lines.forEach(([x1, y1, x2, y2]) => el('line', { x1, y1, x2, y2, class: 'br' }, svg));
  nodes.forEach(([k, x, y]) => {
    if (k === 'node') el('circle', { cx: x, cy: y, r: 9, class: 'nd' }, svg);
    else el('rect', { x: x - 10, y: y - 8, width: 20, height: 16, rx: 5, class: r() < 0.5 ? 'lf0' : 'lf1' }, svg);
  });
}

/* ---------- generic tree drawing ----------
   node: { depth, children: [], edge (label of the branch into it), ... }
   opts.view(n) → null (hidden) or { kind: 'q' | 'leaf' | 'pending', label, sub, cls, on, current } */
function layoutTree(root, W, H, top = 34, bottom = 34) {
  const leaves = []; let maxD = 1;
  (function walk(n) { maxD = Math.max(maxD, n.depth); if (!n.children.length) leaves.push(n); else n.children.forEach(walk); })(root);
  leaves.forEach((n, i) => { n.x = (i + 0.5) * W / leaves.length; });
  (function post(n) { if (n.children.length) { n.children.forEach(post); n.x = (n.children[0].x + n.children[n.children.length - 1].x) / 2; } n.y = top + n.depth * (H - top - bottom) / maxD; })(root);
}
function drawTree(svg, root, opts) {
  svg.innerHTML = '';
  const gE = el('g', {}, svg), gL = el('g', {}, svg), gN = el('g', {}, svg);
  (function walk(n) {
    const v = opts.view(n);
    if (!v) return;
    const hh = v.sub ? 21 : 15;
    n.children.forEach(c => {
      const cv = opts.view(c);
      if (!cv) return;
      const chh = cv.sub ? 21 : 15;
      el('line', { x1: n.x, y1: n.y + hh, x2: c.x, y2: c.y - chh, class: 'edge' + (cv.on ? ' on' : '') + (cv.kind === 'pending' ? ' pending' : '') }, gE);
      const mx = (n.x + c.x) / 2, my = (n.y + hh + c.y - chh) / 2 + 4;
      txt(gL, mx, my, c.edge, 'elabel' + (cv.on ? ' on' : ''), 'middle');
      walk(c);
    });
    const w = Math.max(58, Math.max(v.label.length * 8.2, (v.sub || '').length * 6.4) + 20);
    const g = el('g', { class: `nd ${v.kind}${v.cls ? ' ' + v.cls : ''}${v.on ? ' on' : ''}${v.current ? ' current' : ''}` }, gN);
    el('rect', { x: n.x - w / 2, y: n.y - hh, width: w, height: 2 * hh, rx: v.kind === 'leaf' ? hh : 8 }, g);
    txt(g, n.x, v.sub ? n.y - 2 : n.y + 4.5, v.label, 't', 'middle');
    if (v.sub) txt(g, n.x, n.y + 13, v.sub, 'cnt', 'middle');
  })(root);
}

/* ---------- numeric CART (information gain on 2 features) ---------- */
function growCls(pts, depth, o) {
  const n1 = pts.filter(p => p[2]).length, n0 = pts.length - n1;
  const node = { n0, n1, n: pts.length, pred: n1 > n0 ? 1 : 0, depth };
  if (!n0 || !n1 || depth >= o.maxDepth || pts.length < 2 * o.minLeaf) return node;
  const h = entropy([n0, n1]); let best = null;
  for (const f of [0, 1]) {
    const s = pts.slice().sort((a, b) => a[f] - b[f]);
    let l1 = 0, l0 = 0;
    for (let i = 0; i < s.length - 1; i++) {
      s[i][2] ? l1++ : l0++;
      if (s[i][f] === s[i + 1][f]) continue;
      const nl = i + 1, nr = s.length - nl;
      if (nl < o.minLeaf || nr < o.minLeaf) continue;
      const g = h - nl / s.length * entropy([l0, l1]) - nr / s.length * entropy([n0 - l0, n1 - l1]);
      if (!best || g > best.g + 1e-12) best = { g, f, t: (s[i][f] + s[i + 1][f]) / 2 };
    }
  }
  if (!best || best.g <= 1e-12) return node;
  node.f = best.f; node.t = best.t; node.g = best.g;
  node.L = growCls(pts.filter(p => p[best.f] <= best.t), depth + 1, o);
  node.R = growCls(pts.filter(p => p[best.f] > best.t), depth + 1, o);
  return node;
}
/* regression tree on one feature: split that most reduces the squared error */
function growReg(pts, depth, maxDepth, minLeaf) {
  const n = pts.length, mean = pts.reduce((s, p) => s + p[1], 0) / n;
  const node = { n, pred: mean, depth };
  if (depth >= maxDepth || n < 2 * minLeaf) return node;
  const s = pts.slice().sort((a, b) => a[0] - b[0]);
  const sse = (arr) => { const m = arr.reduce((a, p) => a + p[1], 0) / arr.length; return arr.reduce((a, p) => a + (p[1] - m) ** 2, 0); };
  let best = null;
  for (let i = minLeaf; i <= n - minLeaf; i++) {
    if (s[i - 1][0] === s[i][0]) continue;
    const e = sse(s.slice(0, i)) + sse(s.slice(i));
    if (!best || e < best.e) best = { e, t: (s[i - 1][0] + s[i][0]) / 2 };
  }
  if (!best) return node;
  node.f = 0; node.t = best.t;
  node.L = growReg(s.filter(p => p[0] <= best.t), depth + 1, maxDepth, minLeaf);
  node.R = growReg(s.filter(p => p[0] > best.t), depth + 1, maxDepth, minLeaf);
  return node;
}
const leafOf = (t, p) => (t.L ? leafOf(p[t.f] <= t.t ? t.L : t.R, p) : t);
const accuracy = (t, pts) => pts.filter(p => leafOf(t, p).pred === p[2]).length / pts.length;
const nLeaves = (t) => (t.L ? nLeaves(t.L) + nLeaves(t.R) : 1);
const treeDepth = (t) => (t.L ? 1 + Math.max(treeDepth(t.L), treeDepth(t.R)) : 0);
/* leaf rectangles of a 2-feature tree, in data coordinates */
function leafBoxes(t, box, out = []) {
  if (!t.L) { out.push({ leaf: t, box }); return out; }
  const [x0, x1, y0, y1] = box;
  if (t.f === 0) { leafBoxes(t.L, [x0, t.t, y0, y1], out); leafBoxes(t.R, [t.t, x1, y0, y1], out); }
  else { leafBoxes(t.L, [x0, x1, y0, t.t], out); leafBoxes(t.R, [x0, x1, t.t, y1], out); }
  return out;
}
/* numeric tree → drawable tree (children = [yes, no]) */
function toDrawable(t, fmtQ, fmtLeaf, depth = 0, edge = null) {
  const d = { src: t, depth, edge, children: [] };
  if (t.L) { d.q = fmtQ(t); d.children = [toDrawable(t.L, fmtQ, fmtLeaf, depth + 1, 'yes'), toDrawable(t.R, fmtQ, fmtLeaf, depth + 1, 'no')]; }
  else d.leaf = fmtLeaf(t);
  return d;
}

/* ---------- 1. classification vs regression ---------- */
function initUses() {
  const plot = document.getElementById('uses-plot'), treeSvg = document.getElementById('uses-tree'), out = document.getElementById('uses-out');
  // classification: will a student pass? (hours studied, hours slept); one label flipped as noise
  const r = rng(21), cls = [];
  for (let i = 0; i < 40; i++) {
    const x = 0.4 + r() * 9.2, y = 0.4 + r() * 9.2;
    cls.push([x, y, x > 4.5 && y > 5 ? 0 : 1]);
  }
  cls[8][2] = 1 - cls[8][2];
  const clsTree = growCls(cls, 0, { maxDepth: 2, minLeaf: 1 });
  // regression: flat price (k€) from its size (m²)
  const r2 = rng(5), reg = [];
  for (let i = 0; i < 36; i++) { const x = 30 + r2() * 95; reg.push([x, 25 + 2.1 * x + 0.004 * (x - 30) ** 2 + gauss(r2) * 16]); }
  const regTree = growReg(reg, 0, 2, 3);
  const NAMES = ['Pass', 'Fail'];
  let mode = 'cls', qc = [7.2, 7.6], qr = 88;

  const X = (v) => 45 + v * 36, Y = (v) => 285 - v * 27;             // cls: [0,10]²
  const RX = (v) => 45 + (v - 25) * 3.6, RY = (v) => 285 - (v - 60) * 0.9; // reg: size [25,125], price [60,360]
  function axes(xl, yl, xt, yt, fx, fy) {
    el('line', { x1: 45, y1: 285, x2: 405, y2: 285, class: 'axis' }, plot);
    el('line', { x1: 45, y1: 285, x2: 45, y2: 15, class: 'axis' }, plot);
    xt.forEach(v => txt(plot, fx(v), 300, v, 'tick', 'middle'));
    yt.forEach(v => txt(plot, 39, fy(v) + 4, v, 'tick', 'end'));
    txt(plot, 225, 322, xl, 'tick', 'middle');
    txt(plot, 12, 150, yl, 'tick', 'middle', { transform: 'rotate(-90 12 150)' });
  }
  function render() {
    plot.innerHTML = '';
    const isC = mode === 'cls', tree = isC ? clsTree : regTree;
    const q = isC ? qc : [qr];
    const hit = leafOf(tree, q);
    const path = [];
    for (let t = tree; t.L; t = q[t.f] <= t.t ? t.L : t.R) path.push(t);
    if (isC) {
      leafBoxes(clsTree, [0, 10, 0, 10]).forEach(({ leaf, box: [x0, x1, y0, y1] }) =>
        el('rect', { x: X(x0), y: Y(y1), width: X(x1) - X(x0), height: Y(y0) - Y(y1), class: `rg${leaf.pred}${leaf === hit ? ' rg-on' : ''}` }, plot));
      axes('hours studied', 'hours slept', [0, 2, 4, 6, 8, 10], [0, 5, 10], X, Y);
      cls.forEach(([a, b, c]) => el('circle', { cx: X(a), cy: Y(b), r: 5, class: 'cls' + c }, plot));
      el('circle', { cx: X(qc[0]), cy: Y(qc[1]), r: 8, class: 'qpt' }, plot);
    } else {
      axes('size (m²)', 'price (k€)', [25, 50, 75, 100, 125], [100, 200, 300], RX, RY);
      reg.forEach(([a, b]) => el('circle', { cx: RX(a), cy: RY(b), r: 4.5, class: 'rpt' }, plot));
      const segs = []; (function walk(t, lo, hi) { if (!t.L) { segs.push([lo, hi, t]); return; } walk(t.L, lo, t.t); walk(t.R, t.t, hi); })(regTree, 25, 125);
      let d = '';
      segs.forEach(([lo, hi, t], i) => { d += `${i ? 'L' : 'M'}${RX(lo).toFixed(1)},${RY(t.pred).toFixed(1)} L${RX(hi).toFixed(1)},${RY(t.pred).toFixed(1)} `; });
      el('path', { d, class: 'step-fn' }, plot);
      el('line', { x1: RX(qr), y1: 15, x2: RX(qr), y2: 285, class: 'guide' }, plot);
      el('circle', { cx: RX(qr), cy: RY(hit.pred), r: 8, class: 'qpt' }, plot);
    }
    const fmtQ = isC ? (t) => `${t.f ? 'slept' : 'studied'} ≤ ${t.t.toFixed(1)}?` : (t) => `size ≤ ${t.t.toFixed(0)}?`;
    const fmtLeaf = isC ? (t) => NAMES[t.pred] : (t) => `${Math.round(t.pred)}k€`;
    const dr = toDrawable(tree, fmtQ, fmtLeaf);
    layoutTree(dr, 360, 250, 26, 26);
    const onPath = new Set(path.concat([hit]));
    drawTree(treeSvg, dr, {
      view: (n) => ({
        kind: n.leaf ? 'leaf' : 'q', label: n.leaf || n.q, on: onPath.has(n.src),
        cls: n.leaf && isC ? 'c' + n.src.pred : n.leaf ? 'c0' : '',
        sub: n.leaf ? (isC ? `[${n.src.n0}, ${n.src.n1}]` : `n = ${n.src.n}`) : null,
      }),
    });
    const steps = path.map(t => {
      const v = q[t.f], yes = v <= t.t;
      return `<li>${isC ? (t.f ? 'slept' : 'studied') : 'size'} = ${v.toFixed(1)} ${yes ? '≤' : '>'} ${t.t.toFixed(isC ? 1 : 0)} → <b>${yes ? 'yes' : 'no'}</b></li>`;
    }).join('');
    out.innerHTML = isC
      ? `<ol class="dt-path">${steps}<li class="res c${hit.pred}">Leaf: <b class="c${hit.pred}">${NAMES[hit.pred]}</b>, the majority of its ${hit.n} training students (${hit.n0} pass, ${hit.n1} fail)</li></ol>
         <p class="note">The leaf predicts a <b>class</b>. Each leaf is one rectangle of the plot; leaf counts are [Pass, Fail].</p>`
      : `<ol class="dt-path">${steps}<li class="res c0">Leaf: <b>${hit.pred.toFixed(1)} k€</b>, the mean price of its ${hit.n} training flats</li></ol>
         <p class="note">The leaf predicts a <b>number</b>. The prediction is a step function: flat within each leaf.</p>`;
  }
  plot.addEventListener('click', (e) => {
    const p = svgPoint(plot, e);
    if (mode === 'cls') qc = [Math.max(0, Math.min(10, (p.x - 45) / 36)), Math.max(0, Math.min(10, (285 - p.y) / 27))];
    else qr = Math.max(25, Math.min(125, (p.x - 45) / 3.6 + 25));
    render();
  });
  document.querySelectorAll('#uses-pick .strat-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#uses-pick .strat-btn').forEach(x => x.classList.toggle('active', x === b));
    mode = b.dataset.m; render();
  }));
  render();
}

/* ---------- Play Tennis data + ID3 ---------- */
const FEATS = ['Outlook', 'Temperature', 'Humidity', 'Wind'];
const VALUES = { Outlook: ['Sunny', 'Overcast', 'Rain'], Temperature: ['Hot', 'Mild', 'Cool'], Humidity: ['High', 'Normal'], Wind: ['Weak', 'Strong'] };
const TENNIS = `Sunny Hot High Weak No
Sunny Hot High Strong No
Overcast Hot High Weak Yes
Rain Mild High Weak Yes
Rain Cool Normal Weak Yes
Rain Cool Normal Strong No
Overcast Cool Normal Strong Yes
Sunny Mild High Weak No
Sunny Cool Normal Weak Yes
Rain Mild Normal Weak Yes
Sunny Mild Normal Strong Yes
Overcast Mild High Strong Yes
Overcast Hot Normal Weak Yes
Rain Mild High Strong No`.split('\n').map((l, i) => {
  const [Outlook, Temperature, Humidity, Wind, Play] = l.split(' ');
  return { i, Day: 'D' + (i + 1), Outlook, Temperature, Humidity, Wind, Play };
});
const countsOf = (rows) => [rows.filter(r => r.Play === 'Yes').length, rows.filter(r => r.Play === 'No').length];
function splitBy(rows, f) {
  const vals = f === 'Day' ? rows.map(r => r.Day) : VALUES[f];
  return vals.map(v => ({ v, rows: rows.filter(r => r[f] === v) })).filter(p => p.rows.length)
    .map(p => ({ ...p, cnt: countsOf(p.rows), h: entropy(countsOf(p.rows)) }));
}
function gainOf(rows, f) {
  const parts = splitBy(rows, f), n = rows.length;
  const w = parts.reduce((s, p) => s + p.rows.length / n * p.h, 0);
  return { g: entropy(countsOf(rows)) - w, w, parts };
}
function fillTable(tbody, onClick) {
  tbody.innerHTML = TENNIS.map(r => `<tr data-i="${r.i}"><td>${r.Day}</td><td>${r.Outlook}</td><td>${r.Temperature}</td><td>${r.Humidity}</td><td>${r.Wind}</td><td class="${r.Play.toLowerCase()}">${r.Play}</td></tr>`).join('');
  if (onClick) tbody.querySelectorAll('tr').forEach(tr => tr.addEventListener('click', () => onClick(TENNIS[+tr.dataset.i])));
  return [...tbody.querySelectorAll('tr')];
}
/* ID3 on Play Tennis; records one snapshot per step for the step-through */
function buildTennis() {
  let nid = 0;
  const steps = [], state = {}, stack = [];
  const mk = (rows, edge, depth, parent) => ({ id: nid++, rows, cnt: countsOf(rows), edge, depth, parent, children: [] });
  const cond = (n) => (n.parent ? (n.parent.parent ? cond(n.parent) + ', ' : '') + `${n.parent.feature} = ${n.edge}` : 'all 14 days');
  const short = (n) => (n.parent ? (n.parent.parent ? short(n.parent) + ' › ' : '') + n.edge : 'all');
  const snap = (cur, log) => steps.push({ cur, state: { ...state }, stack: stack.slice(), log });
  const root = mk(TENNIS, null, 0, null);
  function rec(node, feats) {
    stack.push(short(node));
    const [y, n] = node.cnt;
    if (!y || !n) {
      node.leaf = y ? 'Yes' : 'No'; state[node.id] = 'leaf';
      snap(node, `BuildTree(${cond(node)}) [${y}, ${n}]: pure → <b>Leaf(${node.leaf})</b>`);
      stack.pop(); return;
    }
    state[node.id] = 'exam';
    const gains = feats.map(f => [f, gainOf(node.rows, f).g]).sort((a, b) => b[1] - a[1]);
    snap(node, `BuildTree(${cond(node)}) [${y}, ${n}]: H = ${f3(entropy(node.cnt))}, not pure. Gains: ${gains.map(([f, g]) => `${f} ${f3(g)}`).join(', ')}`);
    const best = gains[0][0];
    node.feature = best;
    node.children = splitBy(node.rows, best).map(p => mk(p.rows, p.v, node.depth + 1, node));
    node.children.forEach(c => { state[c.id] = 'pending'; });
    state[node.id] = 'q';
    snap(node, `Split on <b>${best}</b> → ${node.children.map(c => `${c.edge} [${c.cnt.join(', ')}]`).join(', ')}. Recurse on each child.`);
    node.children.forEach(c => rec(c, feats.filter(f => f !== best)));
    stack.pop();
  }
  rec(root, FEATS);
  snap(null, '<b>Done</b>: the call stack is empty. 3 questions, 5 leaves, all 14 days classified correctly.');
  layoutTree(root, 640, 330, 40, 40);
  return { root, steps };
}
const TENNIS_TREE = buildTennis();

/* ---------- 2. classify a day ---------- */
function initClassify() {
  const picks = document.getElementById('cd-picks'), svg = document.getElementById('cd-tree'), out = document.getElementById('cd-out');
  const day = { Outlook: 'Sunny', Temperature: 'Cool', Humidity: 'High', Wind: 'Strong' };
  const rows = fillTable(document.querySelector('#tennis-table tbody'), (r) => { FEATS.forEach(f => { day[f] = r[f]; }); render(); });
  picks.innerHTML = FEATS.map(f => `<div class="dt-pick${f === 'Temperature' ? ' unused' : ''}"><span>${f}</span><div class="strategy-pick">${VALUES[f].map(v => `<button class="strat-btn" data-f="${f}" data-v="${v}">${v}</button>`).join('')}</div></div>`).join('');
  picks.querySelectorAll('.strat-btn').forEach(b => b.addEventListener('click', () => { day[b.dataset.f] = b.dataset.v; render(); }));
  function render() {
    picks.querySelectorAll('.strat-btn').forEach(b => b.classList.toggle('active', day[b.dataset.f] === b.dataset.v));
    const on = new Set(), steps = [];
    let n = TENNIS_TREE.root;
    on.add(n);
    while (!n.leaf) {
      const next = n.children.find(c => c.edge === day[n.feature]);
      steps.push(`<li>${n.feature} = <b>${day[n.feature]}</b> → ${next.leaf ? 'leaf' : `ask about ${next.feature}`}</li>`);
      n = next; on.add(n);
    }
    drawTree(svg, TENNIS_TREE.root, {
      view: (x) => ({ kind: x.leaf ? 'leaf' : 'q', label: x.leaf || x.feature + '?', sub: `[${x.cnt.join(', ')}]`, cls: x.leaf === 'Yes' ? 'c0' : x.leaf ? 'c1' : '', on: on.has(x) }),
    });
    const match = TENNIS.filter(r => FEATS.every(f => r[f] === day[f]));
    rows.forEach((tr, i) => tr.classList.toggle('hl', match.includes(TENNIS[i])));
    const c = n.leaf === 'Yes' ? 'c0' : 'c1';
    out.innerHTML = `
      <p class="big">Day: ${FEATS.map(f => `${f} = <b>${day[f]}</b>`).join(', ')}</p>
      <ol class="dt-path">${steps.join('')}<li class="res ${c}">Prediction: Play = <b class="${c}">${n.leaf}</b> <span class="note">(training days in this leaf: [${n.cnt.join(' Yes, ')} No])</span></li></ol>
      <p class="note">${match.length ? `This is training day ${match.map(r => `<b>${r.Day}</b> (Play = ${r.Play} ${r.Play === n.leaf ? '✓' : '✗'})`).join(', ')}.` : 'This combination is <b>not</b> in the training data. The tree still gives an answer: it generalises.'} Changing Temperature never changes the answer.</p>`;
  }
  render();
}

/* ---------- 3. build the tree step by step ---------- */
function initBuild() {
  const svg = document.getElementById('bs-tree'), stackBox = document.getElementById('bs-stack'), log = document.getElementById('bs-log');
  const stepLbl = document.getElementById('bs-step'), playBtn = document.getElementById('bs-play');
  const rows = fillTable(document.querySelector('#bs-table tbody'));
  const { root, steps } = TENNIS_TREE;
  let idx = 0, timer = null;
  function render() {
    const s = steps[idx];
    drawTree(svg, root, {
      view: (n) => {
        const st = s.state[n.id];
        if (!st) return null;
        const sub = `[${n.cnt.join(', ')}]`;
        if (st === 'leaf') return { kind: 'leaf', label: n.leaf, sub, cls: n.leaf === 'Yes' ? 'c0' : 'c1', current: n === s.cur };
        if (st === 'q') return { kind: 'q', label: n.feature + '?', sub, current: n === s.cur };
        return { kind: st === 'exam' ? 'q' : 'pending', label: '?', sub, current: n === s.cur };
      },
    });
    stackBox.innerHTML = s.stack.length ? s.stack.map((c, i) => `<span class="chip${i === s.stack.length - 1 ? ' cur' : ''}">BuildTree(${c})</span>`).join('') : '<span class="note">(empty)</span>';
    log.innerHTML = steps.slice(0, idx + 1).map((x, i) => `<p class="${i === idx ? (x.cur ? 'current' : 'win') : ''}">${x.log}</p>`).join('');
    log.scrollTop = log.scrollHeight;
    rows.forEach((tr, i) => { const inNode = s.cur && s.cur.rows.includes(TENNIS[i]); tr.classList.toggle('hl', !!inNode); tr.classList.toggle('dim', !!s.cur && !inNode); });
    stepLbl.textContent = `Step ${idx + 1} / ${steps.length}`;
  }
  const stop = () => { clearInterval(timer); timer = null; playBtn.textContent = '▶'; };
  document.getElementById('bs-next').addEventListener('click', () => { stop(); idx = Math.min(steps.length - 1, idx + 1); render(); });
  document.getElementById('bs-prev').addEventListener('click', () => { stop(); idx = Math.max(0, idx - 1); render(); });
  document.getElementById('bs-reset').addEventListener('click', () => { stop(); idx = 0; render(); });
  playBtn.addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (idx === steps.length - 1) idx = 0;
    playBtn.textContent = '⏸';
    timer = setInterval(() => { idx++; render(); if (idx === steps.length - 1) stop(); }, 1500);
    render();
  });
  render();
}

/* ---------- 4a. entropy of a bag of marbles ---------- */
function initEntropyBag() {
  const ids = ['en-a', 'en-b', 'en-c'], sliders = ids.map(id => document.getElementById(id));
  const bag = document.getElementById('en-bag'), svg = document.getElementById('en-plot'), out = document.getElementById('en-out');
  const NAMES = ['A', 'B', 'C'];
  const X = (p) => 50 + p * 370, Y = (b) => 260 - b * 48;
  function render() {
    const cnt = sliders.map(s => +s.value);
    ids.forEach((id, i) => { document.getElementById(id + '-val').textContent = cnt[i]; });
    const n = cnt.reduce((s, c) => s + c, 0);
    bag.innerHTML = cnt.map((c, i) => `<span class="dt-mb c${i}"></span>`.repeat(c)).join('');
    svg.innerHTML = '';
    el('line', { x1: 50, y1: 260, x2: 425, y2: 260, class: 'axis' }, svg);
    el('line', { x1: 50, y1: 260, x2: 50, y2: 15, class: 'axis' }, svg);
    [0, 0.25, 0.5, 0.75, 1].forEach(v => txt(svg, X(v), 276, v, 'tick', 'middle'));
    [0, 1, 2, 3, 4, 5].forEach(v => { txt(svg, 43, Y(v) + 4, v, 'tick', 'end'); if (v) el('line', { x1: 50, y1: Y(v), x2: 425, y2: Y(v), class: 'grid-line' }, svg); });
    txt(svg, 237, 295, 'probability p', 'tick', 'middle');
    txt(svg, 14, 140, 'bits', 'tick', 'middle', { transform: 'rotate(-90 14 140)' });
    el('path', { d: Array.from({ length: 200 }, (_, i) => { const p = 1 / 32 + (1 - 1 / 32) * i / 199; return `${i ? 'L' : 'M'}${X(p).toFixed(1)},${Y(-Math.log2(p)).toFixed(1)}`; }).join(''), class: 'sc-curve' }, svg);
    txt(svg, X(0.07), Y(4.3), 'surprise −log₂ p', 'lbl', 'start');
    if (!n) { out.innerHTML = '<p>The bag is empty. Add some marbles.</p>'; return; }
    const rowsHtml = [];
    let H = 0;
    cnt.forEach((c, i) => {
      if (!c) return;
      const p = c / n, s = -Math.log2(p), contrib = p * s;
      H += contrib;
      const bx = X(p) + (i - 1) * 13;
      el('rect', { x: bx - 6, y: Y(contrib), width: 12, height: Math.max(0.5, 260 - Y(contrib)), class: 'sc-bar c' + i }, svg);
      if (s > 0) el('line', { x1: X(p), y1: Y(s), x2: bx, y2: Y(contrib), class: 'guide' }, svg);
      el('circle', { cx: X(p), cy: Y(Math.min(s, 5)), r: 7, class: 'sc-dot c' + i }, svg);
      txt(svg, X(p) + 10, Y(Math.min(s, 5)) - 8, NAMES[i], 'lbl');
      rowsHtml.push(`<tr><td><span class="dt-key c${i}"></span> ${NAMES[i]}</td><td>${c}/${n} = ${p.toFixed(3)}</td><td>${f3(s)}</td><td>${f3(contrib)}</td></tr>`);
    });
    const k = cnt.filter(c => c).length;
    const maxH = Math.log2(Math.max(2, k));
    out.innerHTML = `
      <div class="table-wrap"><table class="summary en-table">
        <thead><tr><th>Class</th><th>\\(p\\)</th><th>surprise \\(-\\log_2 p\\)</th><th>\\(p \\cdot (-\\log_2 p)\\)</th></tr></thead>
        <tbody>${rowsHtml.join('')}</tbody>
        <tfoot><tr><td colspan="3">Entropy \\(H\\) = expected surprise</td><td>${f3(H)}</td></tr></tfoot>
      </table></div>
      <p class="big">H = <b>${f3(H)}</b> bits ${k <= 1 ? '→ <b>pure</b>: no surprise at all' : `(maximum for ${k} classes: log₂ ${k} = ${f3(maxH)})`}</p>
      <p class="note">${k > 1 && Math.abs(H - maxH) < 1e-9 ? 'All classes are equally likely: maximum uncertainty.' : k > 1 ? 'The rarer a class, the higher its dot on the curve (big surprise) but the smaller its weight p.' : 'Every marble has the same colour: we always know what we will draw.'}</p>`;
    if (window.renderMathInElement) renderMathInElement(out, { delimiters: [{ left: '\\(', right: '\\)', display: false }], throwOnError: false });
  }
  sliders.forEach(s => s.addEventListener('input', render));
  render();
}

/* ---------- 4b. two-class entropy curve ---------- */
function initBinaryCurve() {
  const svg = document.getElementById('bc-plot'), pS = document.getElementById('bc-p'), out = document.getElementById('bc-out');
  const X = (p) => 50 + p * 370, Y = (h) => 240 - h * 210;
  const H = (p) => entropy([p, 1 - p]), G = (p) => 1 - p * p - (1 - p) ** 2;
  function render() {
    const p = +pS.value;
    document.getElementById('bc-p-val').textContent = p.toFixed(3);
    svg.innerHTML = '';
    el('line', { x1: 50, y1: 240, x2: 425, y2: 240, class: 'axis' }, svg);
    el('line', { x1: 50, y1: 240, x2: 50, y2: 20, class: 'axis' }, svg);
    [0, 0.25, 0.5, 0.75, 1].forEach(v => txt(svg, X(v), 256, v, 'tick', 'middle'));
    [0, 0.5, 1].forEach(v => { txt(svg, 43, Y(v) + 4, v, 'tick', 'end'); if (v) el('line', { x1: 50, y1: Y(v), x2: 425, y2: Y(v), class: 'grid-line' }, svg); });
    txt(svg, 237, 274, 'p = fraction of Yes', 'tick', 'middle');
    const curve = (f, cls) => el('path', { d: Array.from({ length: 201 }, (_, i) => `${i ? 'L' : 'M'}${X(i / 200).toFixed(1)},${Y(f(i / 200)).toFixed(1)}`).join(''), class: cls }, svg);
    curve((x) => 2 * G(x), 'g-curve'); curve(H, 'h-curve');
    txt(svg, X(0.5), Y(1) - 6, 'H(p)', 'lbl', 'middle');
    txt(svg, X(0.5), Y(0.45), 'dashed: 2 × Gini', 'tick', 'middle');
    el('line', { x1: X(p), y1: 240, x2: X(p), y2: Y(H(p)), class: 'guide' }, svg);
    el('circle', { cx: X(p), cy: Y(H(p)), r: 7, class: 'h-dot' }, svg);
    const q = 1 - p, term = (v) => (v > 0 ? `${v.toFixed(3)}·log₂ ${v.toFixed(3)}` : '0');
    out.innerHTML = `
      <p class="big">H(${p.toFixed(3)}) = <b>${f3(H(p))}</b> bits</p>
      <p>= −${term(p)} − ${term(q)}</p>
      <p>Gini: G = 1 − ${p.toFixed(3)}² − ${q.toFixed(3)}² = <b>${f3(G(p))}</b></p>
      <p class="note">${p === 0 || p === 1 ? 'A pure node: entropy 0.' : Math.abs(p - 0.5) < 1e-9 ? 'A 50/50 node: the maximum, 1 bit.' : `For example ${Math.round(p * 14)} Yes out of 14. p = 9/14 ≈ 0.643 is the Play Tennis root (0.940 bits).`}</p>`;
  }
  pS.addEventListener('input', render);
  render();
}

/* ---------- 6. information gain: pick the split ---------- */
function initGain() {
  const split = document.getElementById('ig-split'), rank = document.getElementById('ig-rank'), formula = document.getElementById('ig-formula');
  const NODES = { root: { name: 'all 14 days', rows: TENNIS }, Sunny: { name: 'Outlook = Sunny', rows: TENNIS.filter(r => r.Outlook === 'Sunny') }, Rain: { name: 'Outlook = Rain', rows: TENNIS.filter(r => r.Outlook === 'Rain') } };
  const ATTRS = FEATS.concat(['Day']);
  let node = 'root', attr = 'Outlook';
  const marbles = (rows) => `<div class="ig-mbs">${rows.map(r => `<span class="dt-mb ${r.Play === 'Yes' ? 'c0' : 'c1'}" title="${r.Day}: ${r.Play}">${r.i + 1}</span>`).join('')}</div>`;
  function render() {
    document.querySelectorAll('#ig-node .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.n === node));
    document.querySelectorAll('#ig-attr .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.a === attr));
    const rows = NODES[node].rows, n = rows.length, cnt = countsOf(rows), H = entropy(cnt);
    const { g, w, parts } = gainOf(rows, attr);
    split.innerHTML = `
      <div class="ig-node parent"><h5>Node: ${NODES[node].name} <span>[${cnt.join(', ')}] · H = ${f3(H)}</span></h5>${marbles(rows)}</div>
      <div class="ig-arrow">split on ${attr} ↓</div>
      <div class="ig-kids">${parts.map(p => `<div class="ig-node"><h5>${p.v} <span>[${p.cnt.join(', ')}] · H = ${f3(p.h)} · weight ${p.rows.length}/${n}</span></h5>${marbles(p.rows)}</div>`).join('')}</div>`;
    const all = ATTRS.map(a => [a, gainOf(rows, a).g]);
    const best = Math.max(...all.filter(x => x[0] !== 'Day').map(x => x[1]));
    rank.innerHTML = `<p class="note" style="margin-bottom:0.4rem;">Gain of every feature at this node (click to select):</p>
      <div class="ig-rank">${all.map(([a, ga]) => `<div class="ig-row${a === 'Day' ? ' id' : ga > best - 1e-9 ? ' best' : ''}${a === attr ? ' sel' : ''}" data-a="${a}"><span>${a}</span><div class="ig-bar"><span style="width:${H ? (ga / H * 100).toFixed(1) : 0}%"></span></div><b>${f3(ga)}</b></div>`).join('')}</div>
      <p class="note">Bar length = gain / H(S): the fraction of the node's uncertainty removed. Green = the largest gain among the weather features; red = the ID-like feature Day.</p>`;
    rank.querySelectorAll('.ig-row').forEach(r => r.addEventListener('click', () => { attr = r.dataset.a; render(); }));
    const terms = parts.map(p => `${p.rows.length}/${n}·${f3(p.h)}`).join(' + ');
    let note = '';
    if (parts.length === 1) note = `Every example here has ${attr} = ${parts[0].v} (it was already asked above), so the split changes nothing: gain 0.`;
    else if (attr === 'Day') note = `Every child holds one day, so every child is pure and the gain is the maximum possible, H(S) = ${f3(H)}. But the tree would just memorise the training days: this question is useless for any new day.`;
    else if (g > best - 1e-9) note = `This is the best split among the weather features, so ID3 chooses ${attr}. (Day scores at least as high — see the note below the widget.)`;
    formula.innerHTML = `<p class="big">Gain(S, ${attr}) = H(S) − Σ |S<sub>v</sub>|/|S| · H(S<sub>v</sub>) = ${f3(H)} − (${terms}) = ${f3(H)} − ${f3(w)} = <b>${f3(g)}</b></p>${note ? `<p class="note">${note}</p>` : ''}`;
  }
  document.querySelectorAll('#ig-node .strat-btn').forEach(b => b.addEventListener('click', () => { node = b.dataset.n; render(); }));
  document.querySelectorAll('#ig-attr .strat-btn').forEach(b => b.addEventListener('click', () => { attr = b.dataset.a; render(); }));
  render();
}

/* ---------- shared noisy dataset for overfitting & pruning ---------- */
const OF = { seed: 1, listeners: [] };
function makeCircleData(seed, n, noise) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < n; i++) {
    const x = r() * 10, y = r() * 10;
    let c = (x - 5) ** 2 + (y - 5) ** 2 < 3.3 ** 2 ? 1 : 0;
    if (r() < noise) c = 1 - c;
    pts.push([x, y, c]);
  }
  return pts;
}
function loadOF() {
  OF.train = makeCircleData(OF.seed, 120, 0.12);
  OF.test = makeCircleData(OF.seed + 1000, 1000, 0.12);
  OF.listeners.forEach(f => f());
}
const PX = (v) => 30 + v * 35, PY = (v) => 380 - v * 35;
function drawRegions(svg, tree, pts) {
  svg.innerHTML = '';
  leafBoxes(tree, [0, 10, 0, 10]).forEach(({ leaf, box: [x0, x1, y0, y1] }) =>
    el('rect', { x: PX(x0), y: PY(y1), width: PX(x1) - PX(x0), height: PY(y0) - PY(y1), class: 'rg' + leaf.pred }, svg));
  el('circle', { cx: PX(5), cy: PY(5), r: 3.3 * 35, class: 'truth-c' }, svg);
  el('rect', { x: 30, y: 30, width: 350, height: 350, fill: 'none', class: 'axis' }, svg);
  [0, 5, 10].forEach(v => { txt(svg, PX(v), 395, v, 'tick', 'middle'); txt(svg, 24, PY(v) + 4, v, 'tick', 'end'); });
  txt(svg, 205, 20, 'dashed circle = true boundary', 'tick', 'middle');
  pts.forEach(([a, b, c]) => el('circle', { cx: PX(a), cy: PY(b), r: 4, class: 'cls' + c }, svg));
}

/* ---------- 8. overfitting: max depth ---------- */
function initOverfit() {
  const dS = document.getElementById('of-depth'), plot = document.getElementById('of-plot'), curve = document.getElementById('of-curve'), stats = document.getElementById('of-stats');
  let curveData = [];
  const CX = (d) => 45 + (d - 1) * 33, CY = (a) => 215 - (a - 0.5) * 380;
  function compute() {
    curveData = [];
    for (let d = 1; d <= 12; d++) { const t = growCls(OF.train, 0, { maxDepth: d, minLeaf: 1 }); curveData.push([accuracy(t, OF.train), accuracy(t, OF.test)]); }
    render();
  }
  function render() {
    const d = +dS.value;
    document.getElementById('of-depth-val').textContent = d;
    const tree = growCls(OF.train, 0, { maxDepth: d, minLeaf: 1 });
    drawRegions(plot, tree, OF.train);
    const [tr, te] = curveData[d - 1];
    stats.innerHTML = `<div class="stat"><span class="n">${treeDepth(tree)}</span><span class="l">depth</span></div><div class="stat"><span class="n">${nLeaves(tree)}</span><span class="l">leaves</span></div><div class="stat"><span class="n">${pct(tr)}</span><span class="l">train acc.</span></div><div class="stat"><span class="n">${pct(te)}</span><span class="l">test acc.</span></div>`;
    curve.innerHTML = '';
    el('line', { x1: 45, y1: 215, x2: 410, y2: 215, class: 'axis' }, curve);
    el('line', { x1: 45, y1: 215, x2: 45, y2: 15, class: 'axis' }, curve);
    [0.5, 0.6, 0.7, 0.8, 0.9, 1].forEach(a => { txt(curve, 39, CY(a) + 4, a * 100 + '%', 'tick', 'end'); if (a > 0.5) el('line', { x1: 45, y1: CY(a), x2: 410, y2: CY(a), class: 'grid-line' }, curve); });
    for (let k = 1; k <= 12; k++) txt(curve, CX(k), 231, k, 'tick', 'middle');
    txt(curve, 228, 252, 'max depth', 'tick', 'middle');
    el('line', { x1: CX(d), y1: 15, x2: CX(d), y2: 215, class: 'guide' }, curve);
    [0, 1].forEach(j => {
      el('path', { d: curveData.map((v, i) => `${i ? 'L' : 'M'}${CX(i + 1)},${CY(v[j]).toFixed(1)}`).join(''), class: j ? 'acc-te' : 'acc-tr' }, curve);
      el('circle', { cx: CX(d), cy: CY(curveData[d - 1][j]), r: 5.5, class: j ? 'acc-dot-te' : 'acc-dot-tr' }, curve);
    });
  }
  dS.addEventListener('input', render);
  document.getElementById('of-new').addEventListener('click', () => { OF.seed++; loadOF(); });
  OF.listeners.push(compute);
}

/* ---------- 9. pruning: min samples per leaf + cost-complexity ---------- */
function ccpPrune(tree, alpha, N) {
  const t = JSON.parse(JSON.stringify(tree));
  const err = (n) => Math.min(n.n0, n.n1);
  const sub = (n) => (n.L ? [sub(n.L), sub(n.R)].reduce((a, b) => [a[0] + b[0], a[1] + b[1]]) : [err(n), 1]);
  let pruned = 0;
  for (;;) {
    let best = null;
    (function walk(n) {
      if (!n.L) return;
      const [e, l] = sub(n), g = (err(n) - e) / N / (l - 1);
      if (!best || g < best.g) best = { g, n };
      walk(n.L); walk(n.R);
    })(t);
    if (!best || best.g > alpha + 1e-12) break;
    delete best.n.L; delete best.n.R; pruned++;
  }
  return { tree: t, pruned };
}
function initPruning() {
  const lS = document.getElementById('pr-leaf'), aS = document.getElementById('pr-alpha'), plot = document.getElementById('pr-plot'), out = document.getElementById('pr-out');
  function render() {
    const m = +lS.value, alpha = +aS.value;
    document.getElementById('pr-leaf-val').textContent = m;
    document.getElementById('pr-alpha-val').textContent = alpha.toFixed(3);
    const full = growCls(OF.train, 0, { maxDepth: 99, minLeaf: 1 });
    const grown = growCls(OF.train, 0, { maxDepth: 99, minLeaf: m });
    const { tree, pruned } = ccpPrune(grown, alpha, OF.train.length);
    drawRegions(plot, tree, OF.train);
    const row = (name, t, cls = '') => `<tr class="${cls}"><td>${name}</td><td>${nLeaves(t)}</td><td>${treeDepth(t)}</td><td>${pct(accuracy(t, OF.train))}</td><td>${pct(accuracy(t, OF.test))}</td></tr>`;
    const errs = OF.train.length - Math.round(accuracy(tree, OF.train) * OF.train.length);
    out.innerHTML = `
      <div class="table-wrap"><table class="summary pr-table">
        <thead><tr><th>Tree</th><th>Leaves</th><th>Depth</th><th>Train</th><th>Test</th></tr></thead>
        <tbody>${row('Full tree (no pruning)', full)}${row('After pre-pruning', grown)}${row('After post-pruning', tree, 'now')}</tbody>
      </table></div>
      <p>Pre-pruning: no leaf with fewer than <b>${m}</b> training point${m > 1 ? 's' : ''}. Post-pruning with α = <b>${alpha.toFixed(3)}</b> collapsed <b>${pruned}</b> subtree${pruned === 1 ? '' : 's'}.</p>
      <p>Cost of the final tree: R(T) + α·|leaves| = ${errs}/${OF.train.length} + ${alpha.toFixed(3)}·${nLeaves(tree)} = <b>${(errs / OF.train.length + alpha * nLeaves(tree)).toFixed(3)}</b></p>
      <p class="note">A subtree is collapsed when the training errors it saves are at most α · N per extra leaf (here N = ${OF.train.length}, so one error = ${(1 / OF.train.length).toFixed(4)}). Pruned trees make a few more training mistakes but have simpler regions, and usually a higher test accuracy.</p>`;
  }
  [lS, aS].forEach(s => s.addEventListener('input', render));
  OF.listeners.push(render);
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initMath();
  initHero();
  initUses();
  initClassify();
  initBuild();
  initEntropyBag();
  initBinaryCurve();
  initGain();
  initOverfit();
  initPruning();
  loadOF();
});
