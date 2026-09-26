/* ===== Lab 10 interactivity ===== */

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
const f1 = (v) => v.toFixed(1), f2 = (v) => v.toFixed(2), f3 = (v) => v.toFixed(3);

/* ---------- data ---------- */
const clip = (v) => Math.max(0.15, Math.min(9.85, v));
function blob(r, n, cx, cy, sx, sy, rotDeg, label) {
  const a = rotDeg * Math.PI / 180, out = [];
  for (let i = 0; i < n; i++) {
    const u = gauss(r) * sx, v = gauss(r) * sy;
    out.push([clip(cx + u * Math.cos(a) - v * Math.sin(a)), clip(cy + u * Math.sin(a) + v * Math.cos(a)), label]);
  }
  return out;
}
function band(r, n, x1, y1, x2, y2, w, label) {
  const len = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / len, ny = (x2 - x1) / len, out = [];
  for (let i = 0; i < n; i++) { const t = r(), o = gauss(r) * w; out.push([clip(x1 + t * (x2 - x1) + o * nx), clip(y1 + t * (y2 - y1) + o * ny), label]); }
  return out;
}
const DATA = (() => {
  const r = rng(7);
  return {
    ex: [...blob(r, 80, 1.8, 8.2, 0.55, 0.55, 0, 0), ...blob(r, 60, 1.6, 4.7, 0.4, 0.85, 15, 1), ...blob(r, 80, 7.3, 5.0, 1.0, 0.45, -15, 2)],
    wc: [...blob(r, 110, 2.8, 3.0, 1.6, 0.6, 0, 0), ...blob(r, 70, 6.9, 8.0, 0.55, 0.55, 0, 1), ...band(r, 70, 8.1, 8.0, 9.4, 3.2, 0.15, 2), ...blob(r, 50, 7.2, 3.0, 0.4, 0.6, 0, 3)],
    blobs: [...blob(r, 45, 2.5, 2.5, 0.7, 0.7, 0, 0), ...blob(r, 45, 2.5, 7.5, 0.7, 0.7, 0, 1), ...blob(r, 45, 7.5, 7.5, 0.7, 0.7, 0, 2), ...blob(r, 45, 7.5, 2.5, 0.7, 0.7, 0, 3)],
    shapes: [...blob(r, 50, 1.5, 1.8, 0.7, 0.7, 0, 0), ...band(r, 80, 2.3, 6.3, 4.6, 4.0, 0.07, 1), ...band(r, 150, 4.4, 6.8, 9.3, 4.6, 0.35, 2), ...blob(r, 120, 7.2, 8.1, 1.2, 0.9, 0, 3)],
    three: [...blob(r, 60, 2.5, 7.5, 0.8, 0.8, 0, 0), ...blob(r, 60, 2.5, 2.5, 0.8, 0.8, 0, 1), ...blob(r, 60, 8, 5, 0.8, 0.8, 0, 2)],
    five: [[2, 2], [2, 8], [5, 5], [8, 2], [8, 8]].flatMap(([x, y], k) => blob(r, 35, x, y, 0.6, 0.6, 0, k)),
    soft: [...blob(r, 45, 3, 6.6, 1.1, 1.1, 0, 0), ...blob(r, 45, 6.8, 7, 1.1, 1.1, 0, 1), ...blob(r, 45, 5, 3.3, 1.1, 1.1, 0, 2)],
  };
})();

/* ---------- K-means core ---------- */
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const dist = (a, b) => Math.sqrt(d2(a, b));
function assignPts(P, C) {
  return P.map(p => { let b = 0, bd = Infinity; C.forEach((c, k) => { const d = d2(p, c); if (d < bd - 1e-12) { bd = d; b = k; } }); return b; });
}
function updateC(P, A, C) {
  return C.map((c, k) => {
    let sx = 0, sy = 0, n = 0;
    P.forEach((p, i) => { if (A[i] === k) { sx += p[0]; sy += p[1]; n++; } });
    return n ? [sx / n, sy / n] : c.slice();
  });
}
const costJ = (P, A, C) => P.reduce((s, p, i) => s + d2(p, C[A[i]]), 0);
function lloyd(P, C0, maxIt = 100) {
  let C = C0.map(c => c.slice()), A = assignPts(P, C), it = 0;
  while (it < maxIt) {
    C = updateC(P, A, C); it++;
    const B = assignPts(P, C);
    const same = B.every((v, i) => v === A[i]);
    A = B;
    if (same) break;
  }
  return { C, A, J: costJ(P, A, C), it };
}
function initRandom(P, K, r) {
  const idx = [];
  while (idx.length < K) { const i = Math.floor(r() * P.length); if (!idx.includes(i)) idx.push(i); }
  return idx.map(i => [P[i][0], P[i][1]]);
}
function ppProbs(P, C) {
  const d = P.map(p => (C.length ? Math.min(...C.map(c => d2(p, c))) : 1));
  const tot = d.reduce((a, b) => a + b, 0);
  return d.map(v => v / tot);
}
function samplePP(P, C, r) {
  const pr = ppProbs(P, C);
  let u = r(), i = 0;
  while (i < P.length - 1 && (u -= pr[i]) > 0) i++;
  return i;
}
function initPlusPlus(P, K, r) {
  const C = [];
  while (C.length < K) { const i = samplePP(P, C, r); C.push([P[i][0], P[i][1]]); }
  return C;
}
function bestOf(P, K, n, seed) {
  const r = rng(seed); let best = null;
  for (let t = 0; t < n; t++) { const res = lloyd(P, initRandom(P, K, r)); if (!best || res.J < best.J - 1e-9) best = res; }
  return best;
}
/* centres of a labelled partition, and its cost */
function partitionCost(P, A, K) { const C = updateC(P, A, Array.from({ length: K }, () => [0, 0])); return { C, J: costJ(P, A, C) }; }

/* ---------- evaluation metrics ---------- */
function silhouette(P, A, K) {
  return P.map((p, i) => {
    const sum = new Array(K).fill(0), cnt = new Array(K).fill(0);
    P.forEach((q, j) => { if (j !== i) { sum[A[j]] += dist(p, q); cnt[A[j]]++; } });
    const own = A[i];
    if (!cnt[own]) return 0;                          // singleton cluster: s = 0
    const a = sum[own] / cnt[own];
    let b = Infinity;
    for (let k = 0; k < K; k++) if (k !== own && cnt[k]) b = Math.min(b, sum[k] / cnt[k]);
    return b === Infinity ? 0 : (b - a) / Math.max(a, b);
  });
}
function daviesBouldin(P, A, C) {
  const K = C.length, S = C.map((c, k) => { const m = P.filter((_, i) => A[i] === k); return m.length ? m.reduce((s, p) => s + dist(p, c), 0) / m.length : 0; });
  let tot = 0;
  for (let j = 0; j < K; j++) { let mx = 0; for (let k = 0; k < K; k++) if (k !== j) mx = Math.max(mx, (S[j] + S[k]) / dist(C[j], C[k])); tot += mx; }
  return tot / K;
}
function dunn(P, A) {
  let inter = Infinity, intra = 0;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const d = dist(P[i], P[j]);
    if (A[i] === A[j]) intra = Math.max(intra, d); else inter = Math.min(inter, d);
  }
  return intra ? inter / intra : Infinity;
}
function contingency(T, A) {
  const tv = [...new Set(T)], av = [...new Set(A)];
  return av.map(a => tv.map(t => T.filter((x, i) => x === t && A[i] === a).length));
}
function purity(T, A) { return contingency(T, A).reduce((s, row) => s + Math.max(...row), 0) / T.length; }
function ari(T, A) {
  const M = contingency(T, A), c2 = (n) => n * (n - 1) / 2, n = T.length;
  const sij = M.flat().reduce((s, v) => s + c2(v), 0);
  const sa = M.reduce((s, row) => s + c2(row.reduce((a, b) => a + b, 0)), 0);
  const sb = M[0].map((_, j) => M.reduce((s, row) => s + row[j], 0)).reduce((s, v) => s + c2(v), 0);
  const exp = sa * sb / c2(n), mx = (sa + sb) / 2;
  return mx === exp ? 1 : (sij - exp) / (mx - exp);
}
function nmi(T, A) {
  const M = contingency(T, A), n = T.length;
  const ra = M.map(row => row.reduce((a, b) => a + b, 0)), cb = M[0].map((_, j) => M.reduce((s, row) => s + row[j], 0));
  const H = (v) => -v.reduce((s, c) => s + (c ? c / n * Math.log(c / n) : 0), 0);
  let mi = 0;
  M.forEach((row, i) => row.forEach((v, j) => { if (v) mi += v / n * Math.log(n * v / (ra[i] * cb[j])); }));
  const h = (H(ra) + H(cb)) / 2;
  return h ? mi / h : 1;
}

/* ---------- plotting helpers ---------- */
const PX = (v) => 30 + v * 37, PY = (v) => 350 - v * 33;            // [0,10]² → 420×380
const IPX = (px) => (px - 30) / 37, IPY = (py) => (350 - py) / 33;
function frame(svg) { el('rect', { x: 30, y: 20, width: 370, height: 330, class: 'km-frame' }, svg); }
function shadeVoronoi(svg, C, N = 40) {
  const cw = 370 / N, ch = 330 / N;
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    const p = [IPX(30 + (a + 0.5) * cw), IPY(20 + (b + 0.5) * ch)];
    let k = 0, bd = Infinity; C.forEach((c, j) => { const d = d2(p, c); if (d < bd) { bd = d; k = j; } });
    el('rect', { x: 30 + a * cw, y: 20 + b * ch, width: cw + 0.4, height: ch + 0.4, class: 'kv' + (k % 8) }, svg);
  }
}
function dots(svg, P, A, r = 3.6) { P.forEach((p, i) => el('circle', { cx: PX(p[0]), cy: PY(p[1]), r, class: A ? 'kp k' + (A[i] % 8) : 'kp kgrey' }, svg)); }
function centreMark(svg, c, k, label) {
  const g = el('g', { class: 'kc k' + (k % 8), transform: `translate(${PX(c[0]).toFixed(1)} ${PY(c[1]).toFixed(1)})` }, svg);
  el('circle', { r: 9 }, g);
  el('path', { d: 'M-5,-5 L5,5 M-5,5 L5,-5', class: 'kx' }, g);
  if (label) txt(g, 12, -9, label, 'kc-l');
  return g;
}

/* ---------- maths rendering ---------- */
function initMath() {
  if (!window.renderMathInElement) return;
  renderMathInElement(document.body, {
    delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
    throwOnError: false,
  });
}

/* ---------- hero: clusters with their centres ---------- */
function initHero() {
  const svg = document.getElementById('km-hero-bg');
  const r = rng(10);
  [[110, 90], [330, 210], [560, 70], [800, 200], [1060, 100]].forEach(([cx, cy], k) => {
    for (let i = 0; i < 26; i++) el('circle', { cx: (cx + gauss(r) * 42).toFixed(0), cy: (cy + gauss(r) * 30).toFixed(0), r: 4 + r() * 2.5, class: 'h' + (k % 4) }, svg);
    el('path', { d: `M${cx - 11},${cy - 11} L${cx + 11},${cy + 11} M${cx - 11},${cy + 11} L${cx + 11},${cy - 11}`, class: 'hx' }, svg);
  });
}

/* ---------- where are the clusters? ---------- */
function initWhere() {
  const svg = document.getElementById('wc-plot'), out = document.getElementById('wc-out'), P = DATA.wc;
  const T = P.map(p => p[2]), km = bestOf(P, 4, 10, 3);
  let view = 'raw';
  function render() {
    document.querySelectorAll('#wc-view .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.v === view));
    svg.innerHTML = '';
    if (view === 'km') shadeVoronoi(svg, km.C);
    frame(svg);
    dots(svg, P, view === 'raw' ? null : view === 'true' ? T : km.A);
    if (view === 'km') km.C.forEach((c, k) => centreMark(svg, c, k));
    out.innerHTML = view === 'raw'
      ? '<p class="big">What is the shape of each cluster? How many clusters?</p><p class="note">Humans see the groups at a glance. An algorithm needs a definition of "similar" and, for K-means, the number of clusters K.</p>'
      : view === 'true'
        ? '<p class="big">4 clusters generated the data:</p><ul class="concept-list"><li>a wide, flat one (left)</li><li>a round one (top)</li><li>a thin diagonal one (right)</li><li>a small one (bottom right)</li></ul><p class="note">They differ in shape, size and number of points.</p>'
        : `<p class="big">K-means with K = 4 (best of 10 restarts), cost J = ${f1(km.J)}</p><p>Agreement with the true clusters (ARI, see <a href="#evaluation">evaluation</a>): <b>${f2(ari(T, km.A))}</b></p><p class="note">K-means draws straight borders halfway between centres (the shaded regions) and prefers round clusters of similar size. So it cuts the wide cluster into two and merges the others where they are close. Keep this picture in mind for <a href="#always">Does it always work?</a></p>`;
  }
  document.querySelectorAll('#wc-view .strat-btn').forEach(b => b.addEventListener('click', () => { view = b.dataset.v; render(); }));
  render();
}

/* ---------- K-means step by step ---------- */
function initStepper() {
  const svg = document.getElementById('km-plot'), costSvg = document.getElementById('km-cost'), stats = document.getElementById('km-stats');
  const log = document.getElementById('km-log'), stepLbl = document.getElementById('km-step'), kS = document.getElementById('km-k'), playBtn = document.getElementById('km-play');
  const P = DATA.ex, T = P.map(p => p[2]);
  const nearest = (q) => P.reduce((b, p, i) => (d2(p, q) < d2(P[b], q) ? i : b), 0);
  const slideInit = () => [[2.0, 9.0], [1.4, 7.5], [7.3, 5.0]].map(q => { const p = P[nearest(q)]; return [p[0], p[1]]; });
  let K = 3, C0 = slideInit(), steps = [], idx = 0, timer = null, seed = 1, placing = [], showTrue = false, initName = 'from the slide: 3 data points, two of them in the top-left cluster';

  function build() {
    steps = [{ phase: 'init', C: C0.map(c => c.slice()), A: null, log: `Initialise ${K} centres ${initName}.` }];
    let C = C0.map(c => c.slice()), A = null, it = 0;
    for (let guard = 0; guard < 60; guard++) {
      const B = assignPts(P, C);
      const changed = A ? B.filter((v, i) => v !== A[i]).length : P.length;
      if (A && !changed) { steps.push({ phase: 'done', C, A, J: costJ(P, A, C), log: `<b>Converged</b> after ${it} iterations: no point changed its cluster, so the means will not move again.` }); break; }
      A = B;
      steps.push({ phase: 'assign', C, A, J: costJ(P, A, C), log: `Assign: ${A ? changed : P.length} point${changed === 1 ? '' : 's'} ${steps.length === 1 ? 'assigned' : 'changed cluster'} · J = ${f1(costJ(P, A, C))}` });
      C = updateC(P, A, C); it++;
      steps.push({ phase: 'update', C, A, J: costJ(P, A, C), it, log: `Update ${it}: centres moved to the means · J = ${f1(costJ(P, A, C))}` });
    }
    idx = 0;
  }
  function render() {
    const s = steps[idx];
    kS.value = K; document.getElementById('km-k-val').textContent = K;
    svg.innerHTML = '';
    if (!placing.length) shadeVoronoi(svg, s.C);
    frame(svg);
    dots(svg, P, showTrue ? T : s.A);
    if (placing.length) placing.forEach((c, k) => centreMark(svg, c, k));
    else {
      // centre paths up to this step
      for (let k = 0; k < K; k++) {
        const pts = steps.slice(0, idx + 1).filter(x => x.phase !== 'assign').map(x => x.C[k]);
        if (pts.length > 1) el('path', { d: pts.map((c, i) => `${i ? 'L' : 'M'}${PX(c[0]).toFixed(1)},${PY(c[1]).toFixed(1)}`).join(''), class: 'km-trail' }, svg);
      }
      s.C.forEach((c, k) => centreMark(svg, c, k));
    }
    const iter = steps.slice(0, idx + 1).filter(x => x.phase === 'update').length;
    const phaseName = { init: 'Initialise', assign: 'Assign', update: 'Update', done: 'Converged' }[s.phase];
    stats.innerHTML = `<div class="stat"><span class="n">${iter}</span><span class="l">iteration</span></div><div class="stat"><span class="n km-phase">${placing.length ? 'Placing' : phaseName}</span><span class="l">step</span></div><div class="stat"><span class="n">${s.J !== undefined ? f1(s.J) : '—'}</span><span class="l">cost J</span></div>`;
    // cost curve
    costSvg.innerHTML = '';
    const pts = steps.filter(x => x.J !== undefined && x.phase !== 'done'), maxJ = Math.max(...pts.map(x => x.J)), minJ = Math.min(...pts.map(x => x.J));
    const CX = (i) => 50 + i * (355 / Math.max(1, pts.length - 1)), CY = (j) => 165 - (j - minJ * 0.9) / (maxJ - minJ * 0.9 || 1) * 145;
    el('line', { x1: 50, y1: 165, x2: 410, y2: 165, class: 'axis' }, costSvg);
    el('line', { x1: 50, y1: 165, x2: 50, y2: 15, class: 'axis' }, costSvg);
    txt(costSvg, 44, CY(maxJ) + 4, f1(maxJ), 'tick', 'end'); txt(costSvg, 44, CY(minJ) + 4, f1(minJ), 'tick', 'end');
    txt(costSvg, 230, 190, 'step (assign / update)', 'tick', 'middle');
    txt(costSvg, 12, 95, 'J', 'tick', 'middle');
    el('path', { d: pts.map((x, i) => `${i ? 'L' : 'M'}${CX(i).toFixed(1)},${CY(x.J).toFixed(1)}`).join(''), class: 'km-costline' }, costSvg);
    pts.forEach((x, i) => { if (steps.indexOf(x) <= idx) el('circle', { cx: CX(i), cy: CY(x.J), r: 4, class: 'km-costdot ' + x.phase }, costSvg); });
    log.innerHTML = placing.length ? `<p class="current">Placed ${placing.length} / ${K} centres. Keep clicking.</p>` : steps.slice(0, idx + 1).map((x, i) => `<p class="${i === idx ? (x.phase === 'done' ? 'win' : 'current') : ''}">${x.log}</p>`).join('');
    log.scrollTop = log.scrollHeight;
    stepLbl.textContent = `Step ${idx + 1} / ${steps.length}`;
    document.getElementById('km-true').classList.toggle('active', showTrue);
  }
  const stop = () => { clearInterval(timer); timer = null; playBtn.textContent = '▶'; };
  const restart = (C, name) => { stop(); C0 = C; initName = name; placing = []; build(); render(); };
  document.getElementById('km-next').addEventListener('click', () => { stop(); idx = Math.min(steps.length - 1, idx + 1); render(); });
  document.getElementById('km-prev').addEventListener('click', () => { stop(); idx = Math.max(0, idx - 1); render(); });
  document.getElementById('km-reset').addEventListener('click', () => { stop(); idx = 0; placing = []; render(); });
  playBtn.addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (idx === steps.length - 1) idx = 0;
    playBtn.textContent = '⏸';
    timer = setInterval(() => { idx++; render(); if (idx === steps.length - 1) stop(); }, 900);
    render();
  });
  document.getElementById('km-slide').addEventListener('click', () => { K = 3; restart(slideInit(), 'from the slide: 3 data points, two of them in the top-left cluster'); });
  document.getElementById('km-rand').addEventListener('click', () => { seed++; restart(initRandom(P, K, rng(seed * 97)), `at ${K} random data points`); });
  document.getElementById('km-true').addEventListener('click', () => { showTrue = !showTrue; render(); });
  kS.addEventListener('input', () => { K = +kS.value; seed++; restart(initRandom(P, K, rng(seed * 97)), `at ${K} random data points`); });
  svg.addEventListener('click', (e) => {
    stop();
    const p = svgPoint(svg, e);
    placing.push([Math.max(0, Math.min(10, IPX(p.x))), Math.max(0, Math.min(10, IPY(p.y)))]);
    if (placing.length === K) { C0 = placing; placing = []; initName = 'at the points you clicked'; build(); }
    render();
  });
  build(); render();
}

/* ---------- the mean minimises the squared distances ---------- */
function initMeanMin() {
  const svg = document.getElementById('mn-plot'), out = document.getElementById('mn-out');
  const r = rng(31), P = blob(r, 8, 4.6, 4.4, 1.3, 1.1, 20, 0);
  const m = [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
  let c = [8, 8], drag = false;
  function render() {
    svg.innerHTML = '';
    frame(svg);
    P.forEach(p => el('line', { x1: PX(p[0]), y1: PY(p[1]), x2: PX(c[0]), y2: PY(c[1]), class: 'mn-line' }, svg));
    dots(svg, P, P.map(() => 0), 5);
    const g = el('g', { transform: `translate(${PX(m[0])} ${PY(m[1])})` }, svg);
    el('path', { d: 'M-8,-8 L8,8 M-8,8 L8,-8', class: 'mn-mean' }, g);
    el('circle', { cx: PX(c[0]), cy: PY(c[1]), r: 9, class: 'mn-c' }, svg);
    const Jc = P.reduce((s, p) => s + d2(p, c), 0), Jm = P.reduce((s, p) => s + d2(p, m), 0), extra = P.length * d2(c, m);
    out.innerHTML = `
      <p class="big">J(c) = Σ ‖x<sub>i</sub> − c‖² = <b>${f2(Jc)}</b></p>
      <p>= Σ ‖x<sub>i</sub> − x̄‖² + N‖c − x̄‖² = ${f2(Jm)} + ${P.length} × ${f2(d2(c, m))} = ${f2(Jm)} + ${f2(extra)}</p>
      <p>Candidate c = (${f2(c[0])}, ${f2(c[1])}) · mean x̄ = (${f2(m[0])}, ${f2(m[1])})</p>
      <p class="note">${extra < 0.01 ? '✅ c is at the mean: the extra term is 0 and the cost is as small as it can be.' : 'The first part does not depend on c. Only the extra term N‖c − x̄‖² changes, and it is 0 only at the mean. Move c onto the cross.'}</p>`;
  }
  const move = (e) => { const p = svgPoint(svg, e); c = [Math.max(0, Math.min(10, IPX(p.x))), Math.max(0, Math.min(10, IPY(p.y)))]; render(); };
  svg.addEventListener('pointerdown', (e) => { drag = true; svg.setPointerCapture(e.pointerId); move(e); });
  svg.addEventListener('pointermove', (e) => { if (drag) move(e); });
  svg.addEventListener('pointerup', () => { drag = false; });
  render();
}

/* ---------- local optima and restarts ---------- */
function initLocal() {
  const svg = document.getElementById('lo-plot'), out = document.getElementById('lo-out'), runsBox = document.getElementById('lo-runs');
  let data = 'blobs', runs = [], cur = null, seed = 100, truth = false;
  const P = () => DATA[data], K = 4;
  function runOnce() { seed++; const res = lloyd(P(), initRandom(P(), K, rng(seed * 131))); runs.push({ no: runs.length + 1, ...res }); return runs[runs.length - 1]; }
  function render() {
    document.querySelectorAll('#lo-data .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.d === data));
    document.getElementById('lo-truth').classList.toggle('active', truth);
    const pts = P(), T = pts.map(p => p[2]), tc = partitionCost(pts, T, K);
    svg.innerHTML = '';
    if (cur && !truth) shadeVoronoi(svg, cur.C);
    frame(svg);
    dots(svg, pts, truth ? T : cur ? cur.A : null);
    if (truth) tc.C.forEach((c, k) => centreMark(svg, c, k));
    else if (cur) cur.C.forEach((c, k) => centreMark(svg, c, k));
    const best = runs.reduce((b, x) => (!b || x.J < b.J - 1e-9 ? x : b), null);
    const stuck = cur && best && cur.J > best.J * 1.02;
    out.innerHTML = truth
      ? `<p class="big">True clusters: J = <b>${f1(tc.J)}</b></p><p class="note">${best && best.J < tc.J - 1 ? `The best K-means run has a <b>lower</b> cost (${f1(best.J)}) than the true clustering. K-means optimises J, and here J does not describe the true clusters: they are not round.` : 'Compare this cost with the best run.'}</p>`
      : cur
        ? `<p class="big">Run #${cur.no}: J = <b>${f1(cur.J)}</b> after ${cur.it} iteration${cur.it === 1 ? '' : 's'}</p><p>Best so far: run #${best.no}, J = <b>${f1(best.J)}</b></p><p class="note">${stuck ? '⚠️ This run is stuck in a <b>local optimum</b>: its cost is higher than the best one, but no single assign or update step can improve it.' : data === 'blobs' ? 'This run found the best solution seen so far.' : 'Lowest cost so far, but compare it with the true clusters.'}</p>`
        : '<p>Click <b>Run once</b>.</p>';
    runsBox.innerHTML = runs.length ? `<h5>Runs (click to show)</h5><div class="chip-row">${runs.map(x => `<button class="chip lo-chip${x === cur ? ' cur' : ''}${x === best ? ' best' : ''}" data-no="${x.no}">#${x.no} · ${f1(x.J)}${x === best ? ' ★' : ''}</button>`).join('')}</div>` : '';
    runsBox.querySelectorAll('.lo-chip').forEach(b => b.addEventListener('click', () => { cur = runs[+b.dataset.no - 1]; truth = false; render(); }));
  }
  document.getElementById('lo-run').addEventListener('click', () => { truth = false; cur = runOnce(); render(); });
  document.getElementById('lo-ten').addEventListener('click', () => {
    truth = false; const batch = Array.from({ length: 10 }, runOnce);
    cur = batch.reduce((b, x) => (x.J < b.J - 1e-9 ? x : b)); render();
  });
  document.getElementById('lo-truth').addEventListener('click', () => { truth = !truth; render(); });
  document.getElementById('lo-clear').addEventListener('click', () => { runs = []; cur = null; truth = false; render(); });
  document.querySelectorAll('#lo-data .strat-btn').forEach(b => b.addEventListener('click', () => { data = b.dataset.d; runs = []; cur = null; truth = false; render(); }));
  render();
}

/* ---------- elbow + silhouette ---------- */
const THREE_BEST = {};
function threeBest(K) {
  if (!THREE_BEST[K]) {
    const P = DATA.three, res = bestOf(P, K, 10, 500 + K);
    THREE_BEST[K] = { ...res, S: K > 1 ? silhouette(P, res.A, K) : null };
  }
  return THREE_BEST[K];
}
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
function initElbow() {
  const pick = document.getElementById('ek-k'), plot = document.getElementById('ek-plot'), curves = document.getElementById('ek-curves');
  const silSvg = document.getElementById('ek-sil'), out = document.getElementById('ek-out'), P = DATA.three;
  const Ks = [1, 2, 3, 4, 5, 6, 7, 8];
  let K = 3;
  pick.innerHTML = Ks.map(k => `<button class="strat-btn" data-k="${k}">K = ${k}</button>`).join('');
  pick.querySelectorAll('.strat-btn').forEach(b => b.addEventListener('click', () => { K = +b.dataset.k; render(); }));
  function render() {
    pick.querySelectorAll('.strat-btn').forEach(b => b.classList.toggle('active', +b.dataset.k === K));
    const res = threeBest(K);
    plot.innerHTML = '';
    shadeVoronoi(plot, res.C); frame(plot); dots(plot, P, res.A); res.C.forEach((c, k) => centreMark(plot, c, k));
    // curves
    curves.innerHTML = '';
    const Js = Ks.map(k => threeBest(k).J), maxJ = Math.max(...Js);
    const CX = (k) => 55 + (k - 1) * 45, CY = (j) => 205 - j / maxJ * 185, SY = (s) => 205 - s * 185;
    el('line', { x1: 55, y1: 205, x2: 370, y2: 205, class: 'axis' }, curves);
    el('line', { x1: 55, y1: 205, x2: 55, y2: 20, class: 'axis' }, curves);
    el('line', { x1: 370, y1: 205, x2: 370, y2: 20, class: 'axis' }, curves);
    Ks.forEach(k => txt(curves, CX(k), 221, k, 'tick', 'middle'));
    txt(curves, 212, 242, 'K', 'tick', 'middle');
    [0, 0.5, 1].forEach(f => { txt(curves, 49, CY(f * maxJ) + 4, Math.round(f * maxJ), 'tick', 'end'); txt(curves, 376, SY(f) + 4, f, 'tick'); });
    el('line', { x1: CX(K), y1: 20, x2: CX(K), y2: 205, class: 'guide' }, curves);
    el('path', { d: Ks.map((k, i) => `${i ? 'L' : 'M'}${CX(k)},${CY(Js[i]).toFixed(1)}`).join(''), class: 'ek-cost' }, curves);
    Ks.forEach((k, i) => el('circle', { cx: CX(k), cy: CY(Js[i]), r: k === K ? 6 : 3.5, class: 'ek-cost-dot' }, curves));
    const Ss = Ks.slice(1).map(k => mean(threeBest(k).S));
    el('path', { d: Ks.slice(1).map((k, i) => `${i ? 'L' : 'M'}${CX(k)},${SY(Ss[i]).toFixed(1)}`).join(''), class: 'ek-sil' }, curves);
    Ks.slice(1).forEach((k, i) => el('circle', { cx: CX(k), cy: SY(Ss[i]), r: k === K ? 6 : 3.5, class: 'ek-sil-dot' }, curves));
    // silhouette plot
    silSvg.innerHTML = '';
    const SX = (s) => 60 + (s + 0.2) / 1.2 * 340;
    el('line', { x1: SX(0), y1: 10, x2: SX(0), y2: 272, class: 'axis' }, silSvg);
    [-0.2, 0, 0.2, 0.4, 0.6, 0.8, 1].forEach(v => txt(silSvg, SX(v), 288, v, 'tick', 'middle'));
    txt(silSvg, 230, 300, 'silhouette coefficient s(i)', 'tick', 'middle');
    if (res.S) {
      const gap = 8, bh = (262 - gap * (K - 1)) / P.length;
      let y = 10;
      for (let k = 0; k < K; k++) {
        const s = res.S.filter((_, i) => res.A[i] === k).sort((a, b) => b - a);
        const y0 = y;
        s.forEach(v => { el('rect', { x: Math.min(SX(0), SX(v)), y, width: Math.abs(SX(v) - SX(0)), height: bh + 0.3, class: 'kbar k' + (k % 8) }, silSvg); y += bh; });
        txt(silSvg, 50, (y0 + y) / 2 + 4, 'C' + (k + 1), 'tick', 'end');
        y += gap;
      }
      const ms = mean(res.S);
      el('line', { x1: SX(ms), y1: 6, x2: SX(ms), y2: 276, class: 'ek-mean' }, silSvg);
      const neg = res.S.filter(v => v < 0).length;
      const best = Ks.slice(1).reduce((b, k) => (mean(threeBest(k).S) > mean(threeBest(b).S) ? k : b), 2);
      out.innerHTML = `
        <p class="big">K = ${K}: J = <b>${f1(res.J)}</b>, mean silhouette = <b>${f3(ms)}</b></p>
        <p>Per cluster: ${Array.from({ length: K }, (_, k) => `C${k + 1} ${f2(mean(res.S.filter((_, i) => res.A[i] === k)))}`).join(' · ')}</p>
        <p>Points with s &lt; 0: <b>${neg}</b></p>
        <p class="note">${K === best ? `✅ The highest mean silhouette is at K = ${best}, which is also the elbow of the cost curve.` : K < best ? 'Too few clusters: two true clusters are merged, so their points are far from part of their own cluster (large a).' : 'Too many clusters: a true cluster is cut in two, so its points are close to the neighbouring piece (small b), and the silhouettes shrink.'}</p>`;
    } else {
      txt(silSvg, 230, 140, 'with K = 1 there is no other cluster: silhouette undefined', 'tick', 'middle');
      out.innerHTML = `<p class="big">K = 1: J = <b>${f1(res.J)}</b></p><p class="note">One centre at the overall mean. This is the total scatter of the data; every other K explains part of it.</p>`;
    }
  }
  render();
}

/* ---------- mean vs median vs medoid ---------- */
function initMedoid() {
  const svg = document.getElementById('md-plot'), out = document.getElementById('md-out');
  const r = rng(12), P = blob(r, 9, 3.5, 4.2, 0.8, 0.8, 0, 0).map(p => [p[0], p[1]]);
  let o = [8.8, 8.6], drag = false;
  const median = (v) => { const s = v.slice().sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  function render() {
    const all = P.concat([o]);
    const mn = [mean(all.map(p => p[0])), mean(all.map(p => p[1]))];
    const md = [median(all.map(p => p[0])), median(all.map(p => p[1]))];
    const mo = all.reduce((b, p) => (all.reduce((s, q) => s + dist(p, q), 0) < all.reduce((s, q) => s + dist(b, q), 0) ? p : b));
    const mn0 = [mean(P.map(p => p[0])), mean(P.map(p => p[1]))];
    svg.innerHTML = '';
    frame(svg);
    dots(svg, P, P.map(() => 0), 5);
    el('circle', { cx: PX(o[0]), cy: PY(o[1]), r: 8, class: 'md-out' }, svg);
    txt(svg, PX(o[0]) + 12, PY(o[1]) + 4, 'outlier', 'kc-l');
    el('circle', { cx: PX(mo[0]), cy: PY(mo[1]), r: 12, class: 'md-medoid' }, svg);
    el('rect', { x: PX(md[0]) - 7, y: PY(md[1]) - 7, width: 14, height: 14, transform: `rotate(45 ${PX(md[0])} ${PY(md[1])})`, class: 'md-median' }, svg);
    const g = el('g', { transform: `translate(${PX(mn[0])} ${PY(mn[1])})` }, svg);
    el('path', { d: 'M-8,-8 L8,8 M-8,8 L8,-8', class: 'md-mean' }, g);
    const pt = (p) => `(${f2(p[0])}, ${f2(p[1])})`;
    out.innerHTML = `
      <p class="bt-legend"><span class="k mdk mean"></span> mean &nbsp; <span class="k mdk median"></span> median &nbsp; <span class="k mdk medoid"></span> medoid</p>
      <p><b>Mean</b> (K-means): ${pt(mn)}, moved <b>${f2(dist(mn, mn0))}</b> away from the mean without the outlier</p>
      <p><b>Median</b> (K-medians), per coordinate: ${pt(md)}</p>
      <p><b>Medoid</b> (K-medoids), a real data point: ${pt(mo)}</p>
      <p class="note">One outlier out of ${all.length} points shifts the mean by 1/${all.length} of its distance. The median and the medoid only care about the order of the values, not how far the outlier is.</p>`;
  }
  const move = (e) => { const p = svgPoint(svg, e); o = [Math.max(0.2, Math.min(9.8, IPX(p.x))), Math.max(0.2, Math.min(9.8, IPY(p.y)))]; render(); };
  svg.addEventListener('pointerdown', (e) => { drag = true; svg.setPointerCapture(e.pointerId); move(e); });
  svg.addEventListener('pointermove', (e) => { if (drag) move(e); });
  svg.addEventListener('pointerup', () => { drag = false; });
  render();
}

/* ---------- K-means++ seeding ---------- */
function initPP() {
  const svg = document.getElementById('pp-plot'), out = document.getElementById('pp-out'), cmp = document.getElementById('pp-cmp');
  const P = DATA.five, K = 5;
  let C = [], seed = 3, r = rng(seed * 71), res = null, lastP = null;
  function render() {
    const pr = ppProbs(P, C), mx = Math.max(...pr);
    svg.innerHTML = '';
    if (res) shadeVoronoi(svg, res.C);
    frame(svg);
    if (res) dots(svg, P, res.A);
    else P.forEach((p, i) => el('circle', { cx: PX(p[0]), cy: PY(p[1]), r: C.length ? 1.2 + 7 * Math.sqrt(pr[i] / mx) : 3.6, class: 'kp kgrey' }, svg));
    (res ? res.C : C).forEach((c, k) => centreMark(svg, c, k, res ? '' : String(k + 1)));
    out.innerHTML = res
      ? `<p class="big">K-means from this start: J = <b>${f1(res.J)}</b> after ${res.it} iteration${res.it === 1 ? '' : 's'}</p><p class="note">${res.J <= PP_STATS.best * 1.01 ? '✅ The best clustering: one centre per cluster.' : '⚠️ A local optimum. K-means++ makes this rarer, not impossible.'}</p>`
      : C.length === 0
        ? '<p class="big">No centroids yet.</p><p>The first one is picked <b>uniformly</b> at random: every point has probability 1/' + P.length + '.</p>'
        : `<p class="big">${C.length} / ${K} centroids chosen.</p>${lastP !== null ? `<p>Centroid ${C.length} was picked with probability <b>${(lastP * 100).toFixed(2)}%</b>.</p>` : ''}<p class="note">${C.length < K ? 'Points near a chosen centroid have d ≈ 0 and almost vanish. Big points, in clusters without a centroid yet, are the likely next picks.' : 'All centroids chosen. Now run K-means.'}</p>`;
    document.getElementById('pp-next').disabled = C.length >= K || !!res;
    document.getElementById('pp-run').disabled = C.length < K || !!res;
  }
  document.getElementById('pp-next').addEventListener('click', () => { const pr = ppProbs(P, C), i = samplePP(P, C, r); lastP = pr[i]; C.push([P[i][0], P[i][1]]); render(); });
  document.getElementById('pp-run').addEventListener('click', () => { res = lloyd(P, C); render(); });
  document.getElementById('pp-reset').addEventListener('click', () => { seed++; r = rng(seed * 71); C = []; res = null; lastP = null; render(); });
  cmp.innerHTML = `<div class="table-wrap"><table class="summary pp-table"><thead><tr><th>Initialisation (${PP_STATS.n} runs each)</th><th>Mean J</th><th>Runs reaching the best J</th></tr></thead><tbody>
    <tr data-s="dfs"><td>Random data points</td><td>${f1(PP_STATS.rand.mean)}</td><td>${PP_STATS.rand.hit}%</td></tr>
    <tr data-s="bfs"><td>K-means++</td><td>${f1(PP_STATS.pp.mean)}</td><td>${PP_STATS.pp.hit}%</td></tr></tbody></table></div>
    <p class="note">Best J found in all runs: ${f1(PP_STATS.best)}. "Reaching" = within 1% of it.</p>`;
  render();
}
const PP_STATS = (() => {
  const P = DATA.five, K = 5, n = 200, rr = rng(2024), runs = { rand: [], pp: [] };
  for (let t = 0; t < n; t++) { runs.rand.push(lloyd(P, initRandom(P, K, rr)).J); runs.pp.push(lloyd(P, initPlusPlus(P, K, rr)).J); }
  const best = Math.min(...runs.rand, ...runs.pp);
  const sum = (v) => ({ mean: mean(v), hit: Math.round(v.filter(j => j <= best * 1.01).length / v.length * 100) });
  return { n, best, rand: sum(runs.rand), pp: sum(runs.pp) };
})();

/* ---------- soft K-means ---------- */
const MIX = [[217, 84, 110], [92, 144, 136], [209, 171, 104]];   // red, sage, gold: their blends stay out of purple
function initSoft() {
  const svg = document.getElementById('sk-plot'), out = document.getElementById('sk-out'), bS = document.getElementById('sk-b');
  const P = DATA.soft, C0 = [[2, 8], [8, 8], [5, 1.5]];
  let sel = 0;
  function soft(beta) {
    let C = C0.map(c => c.slice()), R;
    for (let it = 0; it < 150; it++) {
      R = P.map(p => { const w = C.map(c => -beta * d2(p, c)), mx = Math.max(...w), e = w.map(v => Math.exp(v - mx)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); });
      C = C.map((_, k) => { const s = R.reduce((a, r) => a + r[k], 0); return [R.reduce((a, r, i) => a + r[k] * P[i][0], 0) / s, R.reduce((a, r, i) => a + r[k] * P[i][1], 0) / s]; });
    }
    return { C, R };
  }
  function render() {
    const beta = 10 ** +bS.value;
    document.getElementById('sk-b-val').textContent = beta < 0.1 ? beta.toFixed(3) : f2(beta);
    const { C, R } = soft(beta);
    svg.innerHTML = '';
    frame(svg);
    P.forEach((p, i) => {
      const rgb = [0, 1, 2].map(j => Math.round(R[i].reduce((s, w, k) => s + w * MIX[k][j], 0)));
      el('circle', { cx: PX(p[0]), cy: PY(p[1]), r: i === sel ? 7 : 4.5, fill: `rgb(${rgb.join(',')})`, class: 'sk-pt' + (i === sel ? ' sel' : ''), 'data-i': i }, svg);
    });
    C.forEach((c, k) => centreMark(svg, c, k + 1));
    const cert = mean(R.map(r => Math.max(...r)));
    const spread = Math.max(...C.map(a => Math.max(...C.map(b => dist(a, b)))));
    out.innerHTML = `
      <p class="big">β = ${beta < 0.1 ? beta.toFixed(3) : f2(beta)}</p>
      <p>Selected point: ${R[sel].map((v, k) => `<span class="sk-r k${k + 1}"><i style="width:${(v * 100).toFixed(1)}%"></i></span> r<sub>${k + 1}</sub> = ${f3(v)}`).join('<br>')}</p>
      <p>Average of the largest responsibility per point: <b>${f3(cert)}</b> (1 = hard assignments, ${f3(1 / 3)} = no preference)</p>
      <p class="note">${spread < 0.05 ? 'The stiffness is so low that every point belongs equally to every cluster: all centres collapsed into the overall mean.' : cert > 0.97 ? 'Almost hard assignments: this is ordinary K-means.' : 'Points between clusters are shared; the centres are weighted means of all the points.'}</p>`;
  }
  bS.addEventListener('input', render);
  svg.addEventListener('click', (e) => { const i = e.target.getAttribute('data-i'); if (i !== null) { sel = +i; render(); } });
  render();
}

/* ---------- agglomerative vs divisive: two static diagrams ---------- */
function initHierDiagrams() {
  function draw(svg, rows, title, down) {
    txt(svg, 150, 18, title, 'lbl', 'middle');
    const Y = [55, 120, 185], pos = rows.map((row, i) => row.map((_, j) => [((j + 0.5) * 300) / row.length, Y[i]]));
    for (let i = 0; i < rows.length - 1; i++) {
      const [a, b] = rows[i].length > rows[i + 1].length ? [i, i + 1] : [i + 1, i];
      rows[a].forEach((_, j) => { const p = pos[a][j], q = pos[b][Math.floor(j / (rows[a].length / rows[b].length))]; el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: 'hm-edge' }, svg); });
    }
    rows.forEach((row, i) => row.forEach((s, j) => { const [x, y] = pos[i][j]; el('circle', { cx: x, cy: y, r: 13 + s.length * 3, class: 'hm-node' }, svg); txt(svg, x, y + 4, s, 'hm-t', 'middle'); }));
    txt(svg, 8, 60, 'start', 'tick'); txt(svg, 8, 190, 'end', 'tick');
    el('path', { d: 'M14,72 L14,170 M9,162 L14,172 L19,162', class: 'hm-arrow' }, svg);
    void down;
  }
  draw(document.getElementById('hm-agg'), [['A', 'B', 'C', 'D'], ['AB', 'CD'], ['ABCD']], 'Agglomerative: merge (bottom up)');
  draw(document.getElementById('hm-div'), [['ABCD'], ['AB', 'CD'], ['A', 'B', 'C', 'D']], 'Divisive: split (top down)');
}

/* ---------- hierarchical (bisecting) K-means ---------- */
const HK_PIX = [[482, 325], [530, 325], [482, 347], [510, 365], [625, 304], [658, 325], [636, 347], [658, 347], [682, 347], [815, 274], [797, 304], [835, 304], [797, 325], [815, 325], [852, 347], [913, 263],
  [555, 465], [542, 484], [555, 484], [587, 493], [520, 509], [555, 509], [587, 523], [555, 538], [825, 465], [752, 484], [773, 484], [773, 509], [797, 509], [815, 538]];
function initHierKmeans() {
  const svg = document.getElementById('hk-plot'), tree = document.getElementById('hk-tree'), out = document.getElementById('hk-out');
  const P = HK_PIX.map(([x, y]) => [(x - 415) / 53, (665 - y) / 53]);
  const X = (v) => 15 + v * 39, Y = (v) => 325 - v * 39;
  let root, leaves, counters, lastMsg;
  const centre = (idx) => [mean(idx.map(i => P[i][0])), mean(idx.map(i => P[i][1]))];
  const sse = (idx, c) => idx.reduce((s, i) => s + d2(P[i], c), 0);
  function node(idx, level, name) { const c = centre(idx); return { idx, level, name, c, J: sse(idx, c), children: [] }; }
  function reset() { root = node(P.map((_, i) => i), 0, 'All the data'); leaves = [root]; counters = {}; lastMsg = 'All 30 points in one cluster.'; }
  function split() {
    const cand = leaves.filter(l => l.idx.length > 1);
    if (!cand.length) return;
    const n = cand.reduce((b, l) => (l.J > b.J ? l : b));
    const sub = n.idx.map(i => P[i]);
    const res = bestOf(sub, 2, 8, 40 + n.idx.length);
    const lvl = n.level + 1;
    counters[lvl] = counters[lvl] || 0;
    n.children = [0, 1].map(k => node(n.idx.filter((_, j) => res.A[j] === k), lvl, `C${lvl}${++counters[lvl]}`));
    leaves.splice(leaves.indexOf(n), 1, ...n.children);
    lastMsg = `Split <b>${n.name}</b> (${n.idx.length} points, J = ${f1(n.J)}) into <b>${n.children[0].name}</b> and <b>${n.children[1].name}</b> with 2-means.`;
  }
  function render() {
    svg.innerHTML = '';
    el('rect', { x: 10, y: 10, width: 400, height: 320, class: 'km-frame' }, svg);
    const A = new Array(P.length);
    leaves.forEach((l, k) => l.idx.forEach(i => { A[i] = k; }));
    (function lines(n) { n.children.forEach(ch => { el('line', { x1: X(n.c[0]), y1: Y(n.c[1]), x2: X(ch.c[0]), y2: Y(ch.c[1]), class: 'hk-link' }, svg); lines(ch); }); })(root);
    P.forEach((p, i) => el('circle', { cx: X(p[0]), cy: Y(p[1]), r: 5, class: 'kp k' + (A[i] % 8) }, svg));
    (function cs(n) { if (n.children.length) { el('circle', { cx: X(n.c[0]), cy: Y(n.c[1]), r: 5, class: 'hk-inner' }, svg); n.children.forEach(cs); } })(root);
    leaves.forEach((l, k) => { el('circle', { cx: X(l.c[0]), cy: Y(l.c[1]), r: 8, class: 'kc-dot k' + (k % 8) }, svg); });
    // tree
    tree.innerHTML = '';
    let order = 0, maxL = 0;
    (function walk(n) { maxL = Math.max(maxL, n.level); if (!n.children.length) n.tx = order++; else { n.children.forEach(walk); n.tx = (n.children[0].tx + n.children[1].tx) / 2; } })(root);
    const TX = (v) => (v + 0.5) * 360 / order, TY = (l) => 25 + l * (190 / Math.max(1, maxL));
    (function edges(n) { n.children.forEach(ch => { el('line', { x1: TX(n.tx), y1: TY(n.level) + 8, x2: TX(ch.tx), y2: TY(ch.level) - 10, class: 'hm-edge' }, tree); edges(ch); }); })(root);
    (function labels(n) {
      const leafK = leaves.indexOf(n);
      txt(tree, TX(n.tx), TY(n.level) + 4, n.name, 'hk-t' + (leafK >= 0 ? ' leaf k' + (leafK % 8) : ''), 'middle');
      n.children.forEach(labels);
    })(root);
    out.innerHTML = `<p>${lastMsg}</p><p>Clusters: <b>${leaves.length}</b> · total J = <b>${f2(leaves.reduce((s, l) => s + l.J, 0))}</b></p>`;
    document.getElementById('hk-split').disabled = !leaves.some(l => l.idx.length > 1);
  }
  document.getElementById('hk-split').addEventListener('click', () => { split(); render(); });
  document.getElementById('hk-reset').addEventListener('click', () => { reset(); render(); });
  reset(); render();
}

/* ---------- agglomerative clustering ---------- */
const AG_DATA = (() => {
  const d8 = [[1, 3], [2, 3], [3.5, 3], [4.5, 3], [1, 1], [2, 1], [3.5, 1], [4.5, 1]];
  const r = rng(77), chain = [];
  for (let i = 0; i < 6; i++) chain.push([1.4 + gauss(r) * 0.35, 4 + gauss(r) * 0.35]);
  for (let x = 2.5; x <= 7.4; x += 0.7) chain.push([x, 4 + gauss(r) * 0.08]);
  for (let i = 0; i < 6; i++) chain.push([8.5 + gauss(r) * 0.35, 4 + gauss(r) * 0.35]);
  for (let i = 0; i < 6; i++) chain.push([5 + gauss(r) * 0.4, 7.4 + gauss(r) * 0.35]);
  return { d8: { P: d8, names: d8.map((_, i) => 'd' + (i + 1)) }, chain: { P: chain, names: chain.map((_, i) => 'p' + (i + 1)) } };
})();
function agglomerate(P, link) {
  let clusters = P.map((_, i) => ({ id: i, m: [i], h: 0 }));
  const merges = [], snaps = [clusters.map(c => c.m.slice())];
  const dl = (a, b) => {
    if (link === 'centroid') return dist(centre(a.m), centre(b.m));
    const ds = []; a.m.forEach(i => b.m.forEach(j => ds.push(dist(P[i], P[j]))));
    return link === 'single' ? Math.min(...ds) : link === 'complete' ? Math.max(...ds) : mean(ds);
  };
  const centre = (m) => [mean(m.map(i => P[i][0])), mean(m.map(i => P[i][1]))];
  let next = P.length;
  while (clusters.length > 1) {
    let best = null;
    for (let i = 0; i < clusters.length; i++) for (let j = i + 1; j < clusters.length; j++) {
      const d = dl(clusters[i], clusters[j]);
      if (!best || d < best.d - 1e-9) best = { i, j, d };
    }
    const a = clusters[best.i], b = clusters[best.j], nc = { id: next++, m: a.m.concat(b.m), h: best.d, a, b };
    merges.push({ a, b, h: best.d, nc });
    clusters = clusters.filter((_, k) => k !== best.i && k !== best.j).concat([nc]);
    snaps.push(clusters.map(c => c.m.slice()));
  }
  return { merges, snaps, root: clusters[0] };
}
function initAgglomerative() {
  const svg = document.getElementById('ag-plot'), den = document.getElementById('ag-dendro'), log = document.getElementById('ag-log'), stepLbl = document.getElementById('ag-step');
  let link = 'single', data = 'd8', res, step = 0;
  function rebuild() { res = agglomerate(AG_DATA[data].P, link); step = 0; }
  function render() {
    document.querySelectorAll('#ag-link .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.l === link));
    document.querySelectorAll('#ag-data .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.d === data));
    const { P, names } = AG_DATA[data], N = P.length;
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    const x0 = Math.min(...xs) - 0.6, x1 = Math.max(...xs) + 0.6, y0 = Math.min(...ys) - 0.6, y1 = Math.max(...ys) + 0.6;
    const sc = Math.min(380 / (x1 - x0), 260 / (y1 - y0));
    const X = (v) => 20 + (v - x0) * sc + (380 - (x1 - x0) * sc) / 2, Y = (v) => 280 - (v - y0) * sc - (260 - (y1 - y0) * sc) / 2;
    svg.innerHTML = '';
    const groups = res.snaps[step].slice().sort((a, b) => Math.min(...a) - Math.min(...b));
    groups.forEach((m, k) => {
      if (m.length < 2) return;
      const hull = convexHull(m.map(i => [X(P[i][0]), Y(P[i][1])]));
      el('polygon', { points: hull.map(p => p.join(',')).join(' '), class: 'ag-hull k' + (k % 8) }, svg);
    });
    groups.forEach((m, k) => m.forEach(i => {
      el('circle', { cx: X(P[i][0]), cy: Y(P[i][1]), r: 5, class: 'kp k' + (k % 8) }, svg);
      if (data === 'd8') txt(svg, X(P[i][0]), Y(P[i][1]) - 11, names[i], 'ag-name', 'middle');
    }));
    const nm = (c) => (c.m.length === 1 ? names[c.m[0]] : c.m.length <= 4 ? '{' + c.m.map(i => names[i]).join(', ') + '}' : `{${c.m.length} points}`);
    log.innerHTML = res.merges.slice(0, step).map((m, i) => `<p class="${i === step - 1 ? 'current' : ''}">${i + 1}. ${nm(m.a)} + ${nm(m.b)} at <b>${f2(m.h)}</b></p>`).join('') || '<p>Every point is its own cluster.</p>';
    log.scrollTop = log.scrollHeight;
    stepLbl.textContent = `${N - step} cluster${N - step === 1 ? '' : 's'} · merge ${step} / ${N - 1}`;
    // dendrogram
    den.innerHTML = '';
    const order = []; (function walk(c) { if (c.m.length === 1 && !c.a) order.push(c.m[0]); else { walk(c.a); walk(c.b); } })(res.root);
    const maxH = Math.max(...res.merges.map(m => m.h)) * 1.08;
    const DX = (pos) => 55 + (pos + 0.5) * 575 / N, DY = (h) => 200 - h / maxH * 185;
    const xOf = new Map(order.map((i, pos) => [i, DX(pos)]));
    el('line', { x1: 50, y1: 200, x2: 50, y2: 12, class: 'axis' }, den);
    [0, 0.5, 1].forEach(f => txt(den, 44, DY(f * maxH / 1.08) + 4, f2(f * maxH / 1.08), 'tick', 'end'));
    txt(den, 14, 105, 'height', 'tick', 'middle', { transform: 'rotate(-90 14 105)' });
    const nodeX = (c) => (c.a ? (nodeX(c.a) + nodeX(c.b)) / 2 : xOf.get(c.m[0]));
    res.merges.slice(0, step).forEach((m, i) => {
      const xa = nodeX(m.a), xb = nodeX(m.b), cls = 'ag-den' + (i === step - 1 ? ' cur' : '');
      el('path', { d: `M${xa},${DY(m.a.h)} V${DY(m.h)} H${xb} V${DY(m.b.h)}`, class: cls }, den);
    });
    order.forEach((i, pos) => { if (N <= 12) txt(den, DX(pos), 216, names[i], 'tick', 'middle'); else el('line', { x1: DX(pos), y1: 200, x2: DX(pos), y2: 205, class: 'axis' }, den); });
    if (step > 0 && step < N - 1) {
      const hc = (res.merges[step - 1].h + res.merges[step].h) / 2;
      el('line', { x1: 50, y1: DY(hc), x2: 630, y2: DY(hc), class: 'ag-cut' }, den);
      txt(den, 628, DY(hc) - 5, `cut here → ${N - step} clusters`, 'tick', 'end');
    }
  }
  const go = (s) => { step = Math.max(0, Math.min(res.merges.length, s)); render(); };
  document.getElementById('ag-next').addEventListener('click', () => go(step + 1));
  document.getElementById('ag-prev').addEventListener('click', () => go(step - 1));
  document.getElementById('ag-end').addEventListener('click', () => go(res.merges.length - 1));
  document.getElementById('ag-reset').addEventListener('click', () => go(0));
  document.querySelectorAll('#ag-link .strat-btn').forEach(b => b.addEventListener('click', () => { link = b.dataset.l; const s = step; rebuild(); go(s); }));
  document.querySelectorAll('#ag-data .strat-btn').forEach(b => b.addEventListener('click', () => { data = b.dataset.d; rebuild(); render(); }));
  rebuild(); render();
}
function convexHull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  p.forEach(q => { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
  p.slice().reverse().forEach(q => { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/* ---------- evaluation metrics ---------- */
function initEval() {
  const pick = document.getElementById('ev-k'), svg = document.getElementById('ev-plot'), out = document.getElementById('ev-out'), P = DATA.three, T = P.map(p => p[2]);
  let K = 3, mode = 'best', seed = 7;
  pick.innerHTML = [2, 3, 4, 5, 6].map(k => `<button class="strat-btn" data-k="${k}">K = ${k}</button>`).join('');
  pick.querySelectorAll('.strat-btn').forEach(b => b.addEventListener('click', () => { K = +b.dataset.k; render(); }));
  const SH = ['circle', 'square', 'triangle'];
  function shape(g, x, y, t, k) {
    const c = 'kp k' + (k % 8);
    if (t === 0) el('circle', { cx: x, cy: y, r: 4.2, class: c }, g);
    else if (t === 1) el('rect', { x: x - 3.8, y: y - 3.8, width: 7.6, height: 7.6, class: c }, g);
    else el('path', { d: `M${x},${y - 5} L${x + 4.6},${y + 3.6} L${x - 4.6},${y + 3.6} Z`, class: c }, g);
  }
  function render() {
    pick.querySelectorAll('.strat-btn').forEach(b => b.classList.toggle('active', +b.dataset.k === K));
    document.getElementById('ev-best').classList.toggle('active', mode === 'best');
    document.getElementById('ev-one').classList.toggle('active', mode === 'one');
    const res = mode === 'best' ? threeBest(K) : lloyd(P, initRandom(P, K, rng(seed * 53)));
    svg.innerHTML = '';
    shadeVoronoi(svg, res.C); frame(svg);
    P.forEach((p, i) => shape(svg, PX(p[0]), PY(p[1]), T[i], res.A[i]));
    res.C.forEach((c, k) => centreMark(svg, c, k));
    const S = mean(silhouette(P, res.A, K)), A3 = ari(T, res.A);
    const rows = [
      ['WCSS (cost J)', f1(res.J), 'lower', 'no'],
      ['Silhouette', f3(S), 'higher (max 1)', 'no'],
      ['Davies–Bouldin', f3(daviesBouldin(P, res.A, res.C)), 'lower', 'no'],
      ['Dunn', f3(dunn(P, res.A)), 'higher', 'no'],
      ['Purity', f3(purity(T, res.A)), 'higher (max 1)', 'yes'],
      ['ARI', f3(ari(T, res.A)), 'higher (max 1)', 'yes'],
      ['NMI', f3(nmi(T, res.A)), 'higher (max 1)', 'yes'],
    ];
    out.innerHTML = `
      <p class="bt-legend">colour = cluster found · shape = true cluster (${SH.join(', ')})</p>
      <div class="table-wrap"><table class="summary ev-table"><thead><tr><th>Metric</th><th>Value</th><th>Better</th><th>Labels?</th></tr></thead>
      <tbody>${rows.map(([a, b, c, d]) => `<tr data-s="${d === 'yes' ? 'dfs' : 'ids'}"><td>${a}</td><td><b>${b}</b></td><td>${c}</td><td>${d}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">${K === 3 && mode === 'best' ? 'The true clustering is recovered: purity, ARI and NMI are 1.' : K > 3 ? 'Purity stays high (every cluster is still pure), but ARI and NMI drop: a true cluster was split.' : K < 3 ? 'Two true clusters share a cluster: purity, ARI and NMI all drop.' : A3 > 0.999 ? 'This single run also found the true clustering. Click <i>One random run</i> again: on this data about 1 run in 8 gets stuck.' : 'This run is stuck in a local optimum: the internal metrics (silhouette, Davies–Bouldin) already show it, without any labels.'}</p>`;
  }
  document.getElementById('ev-best').addEventListener('click', () => { mode = 'best'; render(); });
  document.getElementById('ev-one').addEventListener('click', () => { mode = 'one'; seed++; render(); });
  render();
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initMath();
  initHero();
  initWhere();
  initStepper();
  initMeanMin();
  initLocal();
  initElbow();
  initMedoid();
  initPP();
  initSoft();
  initHierDiagrams();
  initHierKmeans();
  initAgglomerative();
  initEval();
});
