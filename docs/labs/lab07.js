/* ===== Lab 07 interactivity ===== */

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

/* ---------- maths rendering ---------- */
function initMath() {
  if (!window.renderMathInElement) return;
  renderMathInElement(document.body, {
    delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
    throwOnError: false,
  });
}

/* ---------- hero: labelled points and one query with its neighbourhood ---------- */
function initHero() {
  const svg = document.getElementById('knn-hero-bg');
  const r = rng(31);
  const centres = [[180, 90, 'c0'], [420, 220, 'c1'], [760, 100, 'c2'], [1020, 210, 'c0'], [560, 70, 'c1']];
  const pts = [];
  centres.forEach(([cx, cy, c]) => { for (let i = 0; i < 18; i++) pts.push([cx + gauss(r) * 70, cy + gauss(r) * 45, c]); });
  const q = [640, 160];
  const near = pts.map(p => [Math.hypot(p[0] - q[0], p[1] - q[1]), p]).sort((a, b) => a[0] - b[0]).slice(0, 5);
  el('circle', { cx: q[0], cy: q[1], r: near[4][0] + 8, class: 'ring' }, svg);
  near.forEach(([, p]) => el('line', { x1: q[0], y1: q[1], x2: p[0], y2: p[1], class: 'link' }, svg));
  pts.forEach(([x, y, c]) => el('circle', { cx: x.toFixed(0), cy: y.toFixed(0), r: 5, class: c }, svg));
  el('circle', { cx: q[0], cy: q[1], r: 8, class: 'q' }, svg);
}

/* ---------- KNN helpers ---------- */
function kNearest(points, q, k, dist) {
  return points.map((p, i) => ({ i, d: dist(p, q) })).sort((a, b) => a.d - b.d).slice(0, k);
}
const euclid = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* ---------- global (linear regression) vs local (KNN regression) ---------- */
function initGlobalLocal() {
  const svg = document.getElementById('gl-plot'), kS = document.getElementById('gl-k');
  const truth = (x) => 2 + 1.6 * Math.sin(0.75 * x) + 0.12 * x;
  const r = rng(12);
  const train = Array.from({ length: 60 }, () => { const x = r() * 10; return [x, truth(x) + gauss(r) * 0.45]; });
  const test = Array.from({ length: 300 }, () => { const x = r() * 10; return [x, truth(x) + gauss(r) * 0.45]; });
  const n = train.length, mx = train.reduce((s, p) => s + p[0], 0) / n, my = train.reduce((s, p) => s + p[1], 0) / n;
  const b1 = train.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / train.reduce((s, [x]) => s + (x - mx) ** 2, 0), b0 = my - b1 * mx;
  const lin = (x) => b0 + b1 * x;
  const knnReg = (x, k) => kNearest(train, [x, 0], k, (p, q) => Math.abs(p[0] - q[0])).reduce((s, { i }) => s + train[i][1], 0) / k;
  const X = (x) => 40 + x * 58, Y = (y) => 270 - y * 55;
  let mode = 'both', hoverX = 6.2;

  function render() {
    const k = +kS.value;
    document.getElementById('gl-k-val').textContent = k;
    svg.innerHTML = '';
    el('line', { x1: 40, y1: 270, x2: 625, y2: 270, class: 'axis' }, svg);
    el('line', { x1: 40, y1: 270, x2: 40, y2: 10, class: 'axis' }, svg);
    txt(svg, 332, 292, 'x', 'tick', 'middle');
    const showG = mode !== 'local', showL = mode !== 'global';
    const nb = kNearest(train, [hoverX, 0], k, (p, q) => Math.abs(p[0] - q[0]));
    if (showL) {
      const xs = nb.map(({ i }) => train[i][0]);
      el('rect', { x: X(Math.min(...xs)), y: 10, width: Math.max(2, X(Math.max(...xs)) - X(Math.min(...xs))), height: 260, class: 'gl-window' }, svg);
    }
    train.forEach(([x, y], i) => el('circle', { cx: X(x), cy: Y(y), r: 4.5, class: 'gl-pt' + (showL && nb.some(n2 => n2.i === i) ? ' nb' : '') }, svg));
    if (showG) el('line', { x1: X(0), y1: Y(lin(0)), x2: X(10), y2: Y(lin(10)), class: 'gl-lin' }, svg);
    if (showL) {
      const d = Array.from({ length: 201 }, (_, i) => { const x = i / 20; return `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(knnReg(x, k)).toFixed(1)}`; }).join('');
      el('path', { d, class: 'gl-knn' }, svg);
      el('line', { x1: X(hoverX), y1: 10, x2: X(hoverX), y2: 270, class: 'guide' }, svg);
      el('circle', { cx: X(hoverX), cy: Y(knnReg(hoverX, k)), r: 6.5, class: 'gl-q' }, svg);
    }
    const mse = (f) => test.reduce((s, [x, y]) => s + (f(x) - y) ** 2, 0) / test.length;
    const mLin = mse(lin), mKnn = mse((x) => knnReg(x, k));
    const msg = document.getElementById('gl-msg');
    const note = k === 1 ? 'With K = 1 the curve jumps to every noisy point (overfitting).' : k >= 30 ? `With K = ${k} each prediction averages half the dataset — the curve flattens out (underfitting).` : `Each point on the KNN curve is the average of the ${k} closest training points (highlighted for the dashed position).`;
    msg.innerHTML = `Test error (MSE): <b>linear regression ${mLin.toFixed(3)}</b> · <b>KNN ${mKnn.toFixed(3)}</b><br><span>${note}</span>`;
    msg.className = 'bv-verdict';
  }
  const move = (e) => { const p = svgPoint(svg, e); hoverX = Math.max(0, Math.min(10, (p.x - 40) / 58)); render(); };
  svg.addEventListener('mousemove', move);
  svg.addEventListener('click', move);
  kS.addEventListener('input', render);
  document.querySelectorAll('.gl-mode').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.gl-mode').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); mode = b.dataset.mode; render();
  }));
  render();
}

/* ---------- worked example: [4, 5] with K = 3 ---------- */
function initExample() {
  const svg = document.getElementById('ex-plot'), box = document.getElementById('ex-table');
  const data = [[1, 2, 'A'], [2, 3, 'A'], [3, 4, 'A'], [6, 7, 'B'], [7, 8, 'B']];
  const q = [4, 5], K = 3;
  const X = (x) => 40 + x * 35, Y = (y) => 300 - y * 32;
  const rows = data.map(([x, y, l]) => ({ x, y, l, d: Math.hypot(x - q[0], y - q[1]) }));
  const sorted = [...rows].sort((a, b) => a.d - b.d);
  const kth = sorted[K - 1].d;
  el('line', { x1: 40, y1: 300, x2: 350, y2: 300, class: 'axis' }, svg);
  el('line', { x1: 40, y1: 300, x2: 40, y2: 10, class: 'axis' }, svg);
  for (let v = 0; v <= 8; v += 2) { txt(svg, X(v), 316, v, 'tick', 'middle'); txt(svg, 34, Y(v) + 4, v, 'tick', 'end'); }
  el('ellipse', { cx: X(q[0]), cy: Y(q[1]), rx: kth * 35 + 10, ry: kth * 32 + 10, class: 'ex-ring' }, svg);
  rows.forEach(r => { if (r.d <= kth + 1e-9) el('line', { x1: X(q[0]), y1: Y(q[1]), x2: X(r.x), y2: Y(r.y), class: 'ex-link' }, svg); });
  rows.forEach(r => {
    el('circle', { cx: X(r.x), cy: Y(r.y), r: 9, class: r.l === 'A' ? 'cls0' : 'cls1' }, svg);
    txt(svg, X(r.x) + 12, Y(r.y) + 4, `${r.l} [${r.x},${r.y}]`, 'tick ex-lbl');
  });
  el('circle', { cx: X(q[0]), cy: Y(q[1]), r: 9, class: 'ex-q' }, svg);
  txt(svg, X(q[0]) + 12, Y(q[1]) - 8, '? [4,5]', 'tick ex-lbl');

  box.innerHTML = `<div class="table-wrap"><table class="summary ex-table">
    <thead><tr><th>Point</th><th>Label</th><th>Distance to [4, 5]</th><th>In K = 3?</th></tr></thead>
    <tbody>${sorted.map(r => `<tr${r.d <= kth + 1e-9 ? ' class="in-k"' : ''}><td>[${r.x}, ${r.y}]</td><td><b>${r.l}</b></td><td>√((4−${r.x})² + (5−${r.y})²) = ${r.d.toFixed(2)}</td><td>${r.d <= kth + 1e-9 ? '✓' : ''}</td></tr>`).join('')}</tbody>
  </table></div>
  <p class="ex-note">The 3 nearest neighbours are labelled <b>A, A, B</b> → majority vote: <b>A</b>. (Two points are tied at 2.83 — with K = 3 both of them are among the neighbours.)</p>`;
}

/* ---------- distance explorer ---------- */
function initDistances() {
  const svg = document.getElementById('ds-plot'), pS = document.getElementById('ds-p');
  const S = (v) => 170 + v * 30, Sy = (v) => 170 - v * 30;
  let Yp = [3, 2];
  const minkowski = (a, b, p) => (Math.abs(a[0] - b[0]) ** p + Math.abs(a[1] - b[1]) ** p) ** (1 / p);

  function render() {
    const p = +pS.value;
    document.getElementById('ds-p-val').textContent = p.toFixed(1);
    document.querySelectorAll('.ds-preset').forEach(b => b.classList.toggle('active', Math.abs(+b.dataset.p - p) < 1e-9));
    svg.innerHTML = '';
    for (let v = -5; v <= 5; v++) {
      el('line', { x1: S(v), y1: Sy(-5.5), x2: S(v), y2: Sy(5.5), class: v ? 'ds-grid' : 'axis' }, svg);
      el('line', { x1: S(-5.5), y1: Sy(v), x2: S(5.5), y2: Sy(v), class: v ? 'ds-grid' : 'axis' }, svg);
    }
    const O = [0, 0], dp = minkowski(O, Yp, p);
    // the Minkowski "circle" |x|^p + |y|^p = d^p through Y
    const d = Array.from({ length: 241 }, (_, i) => {
      const t = (i / 240) * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t);
      const x = dp * Math.sign(c) * Math.abs(c) ** (2 / p), y = dp * Math.sign(s) * Math.abs(s) ** (2 / p);
      return `${i ? 'L' : 'M'}${S(x).toFixed(1)},${Sy(y).toFixed(1)}`;
    }).join('') + 'Z';
    el('path', { d, class: 'ds-ball' }, svg);
    el('path', { d: `M${S(0)},${Sy(0)} H${S(Yp[0])} V${Sy(Yp[1])}`, class: 'ds-manh' }, svg);
    el('line', { x1: S(0), y1: Sy(0), x2: S(Yp[0]), y2: Sy(Yp[1]), class: 'ds-eucl' }, svg);
    el('circle', { cx: S(0), cy: Sy(0), r: 7, class: 'cls0' }, svg);
    el('circle', { cx: S(Yp[0]), cy: Sy(Yp[1]), r: 7, class: 'cls1' }, svg);
    txt(svg, S(0) - 10, Sy(0) + 18, 'X', 'tick ds-lbl', 'end');
    txt(svg, S(Yp[0]) + 10, Sy(Yp[1]) - 8, `Y (${Yp[0]}, ${Yp[1]})`, 'tick ds-lbl');
    const e = Math.hypot(...Yp), m = Math.abs(Yp[0]) + Math.abs(Yp[1]);
    document.getElementById('ds-e').textContent = e.toFixed(2);
    document.getElementById('ds-m').textContent = m.toFixed(2);
    document.getElementById('ds-k').textContent = dp.toFixed(2);
    document.getElementById('ds-k-l').textContent = `Minkowski p = ${p.toFixed(1)}`;
    const msg = document.getElementById('ds-msg');
    msg.innerHTML = p === 1 ? 'p = 1: the "circle" is a <b>diamond</b> — Manhattan distance (the dashed path along the grid).'
      : p === 2 ? 'p = 2: an ordinary <b>circle</b> — Euclidean distance (the straight line).'
      : p >= 7.5 ? `Large p: the shape approaches a <b>square</b> and the distance approaches the largest single coordinate difference, max(|Δx|, |Δy|) = ${Math.max(Math.abs(Yp[0]), Math.abs(Yp[1]))}.`
      : `p = ${p.toFixed(1)}: between the shapes above. Every point on the outline is at Minkowski distance ${dp.toFixed(2)} from X.`;
  }
  svg.addEventListener('click', (e) => {
    const pt = svgPoint(svg, e);
    Yp = [Math.round((pt.x - 170) / 30), Math.round((170 - pt.y) / 30)].map(v => Math.max(-5, Math.min(5, v)));
    if (!Yp[0] && !Yp[1]) Yp = [1, 0];
    render();
  });
  pS.addEventListener('input', render);
  document.querySelectorAll('.ds-preset').forEach(b => b.addEventListener('click', () => { pS.value = b.dataset.p; render(); }));
  render();
}

/* ---------- KNN classifier with decision regions and an elbow chart ---------- */
function makeMoons(seed) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < 180; i++) {
    const c = i % 2, t = r() * Math.PI;
    const x = c ? 1 - Math.cos(t) : Math.cos(t), y = c ? 0.45 - Math.sin(t) : Math.sin(t);
    pts.push([x + gauss(r) * 0.16, y + gauss(r) * 0.16, c]);
  }
  // shuffle, then hold out a third for validation
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  return { train: pts.slice(0, 120), val: pts.slice(120) };
}
function vote(neigh, train) {
  const c1 = neigh.filter(({ i }) => train[i][2] === 1).length, c0 = neigh.length - c1;
  if (c1 !== c0) return c1 > c0 ? 1 : 0;
  return train[neigh[0].i][2]; // tie: the single nearest neighbour decides
}
function initClassifier() {
  const svg = document.getElementById('kc-plot'), elbow = document.getElementById('kc-elbow'), kS = document.getElementById('kc-k');
  let seed = 3, data, errCurve, query = null;
  const S = (v) => 50 + (v + 1.6) * 75, Sy = (v) => 330 - (v + 1.1) * 110;   // x ∈ [-1.6, 3.2], y ∈ [-1.1, 2.1]
  const invX = (px) => (px - 50) / 75 - 1.6, invY = (py) => (330 - py) / 110 - 1.1;

  function errorsForAllK(points, excludeSelf) {
    // sort neighbours once per point, then read off the vote for every K
    const sortedLists = points.map(p => data.train.map((t, i) => ({ i, d: euclid(t, p) })).sort((a, b) => a.d - b.d));
    return Array.from({ length: 51 }, (_, k0) => {
      const k = k0 + 1;
      let wrong = 0;
      points.forEach((p, j) => { if (vote(sortedLists[j].slice(0, k), data.train) !== p[2]) wrong++; });
      return wrong / points.length;
    });
  }
  function load() {
    data = makeMoons(seed);
    errCurve = { train: errorsForAllK(data.train), val: errorsForAllK(data.val) };
    query = null;
    render();
  }
  function render() {
    const k = +kS.value;
    document.getElementById('kc-k-val').textContent = k;
    svg.innerHTML = '';
    const N = 40, cw = 400 / N;
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
      const p = [invX((a + 0.5) * cw), invY((b + 0.5) * cw)];
      const nb = kNearest(data.train, p, k, euclid);
      const share = nb.filter(({ i }) => data.train[i][2] === 1).length / k;
      const cls = vote(nb, data.train);
      el('rect', { x: a * cw, y: b * cw, width: cw + 0.5, height: cw + 0.5, class: cls ? 'shade1' : 'shade0', style: `opacity:${(0.18 + Math.abs(share - 0.5) * 0.5).toFixed(3)}` }, svg);
    }
    data.train.forEach(([x, y, c]) => el('circle', { cx: S(x), cy: Sy(y), r: 4.5, class: c ? 'cls1' : 'cls0' }, svg));
    data.val.forEach(([x, y, c]) => el('rect', { x: S(x) - 4, y: Sy(y) - 4, width: 8, height: 8, transform: `rotate(45 ${S(x)} ${Sy(y)})`, class: (c ? 'cls1' : 'cls0') + ' val-pt' }, svg));
    const q = document.getElementById('kc-query');
    if (query) {
      const nb = kNearest(data.train, query, k, euclid);
      const rad = nb[nb.length - 1].d;
      el('ellipse', { cx: S(query[0]), cy: Sy(query[1]), rx: rad * 75, ry: rad * 110, class: 'kc-ring' }, svg);
      nb.forEach(({ i }) => el('line', { x1: S(query[0]), y1: Sy(query[1]), x2: S(data.train[i][0]), y2: Sy(data.train[i][1]), class: 'ex-link' }, svg));
      const cls = vote(nb, data.train), ones = nb.filter(({ i }) => data.train[i][2] === 1).length;
      el('circle', { cx: S(query[0]), cy: Sy(query[1]), r: 8, class: 'kc-q ' + (cls ? 'c1' : 'c0') }, svg);
      q.innerHTML = `New point: <b>${ones}</b> red and <b>${k - ones}</b> blue neighbours → predicted <b class="${cls ? 'red' : 'blue'}">${cls ? 'red' : 'blue'}</b>${ones === k - ones ? ' (tie — broken by the single nearest neighbour)' : ''}.`;
    } else q.textContent = 'Click the plot to classify a new point.';

    const tr = errCurve.train[k - 1], va = errCurve.val[k - 1];
    document.getElementById('kc-train').textContent = `${(tr * 100).toFixed(0)}%`;
    document.getElementById('kc-val').textContent = `${(va * 100).toFixed(0)}%`;
    const best = errCurve.val.reduce((bi, e, i) => (e < errCurve.val[bi] ? i : bi), 0) + 1;
    const msg = document.getElementById('kc-msg');
    if (k <= 2) { msg.innerHTML = `⬆️ <b>Overfitting</b> — with K = ${k} the training error is almost 0 (each point is its own neighbour), but the boundary is jagged and the validation error is higher.`; msg.className = 'bv-verdict over'; }
    else if (va > errCurve.val[best - 1] + 0.05 && k > best) { msg.innerHTML = `⬇️ <b>Underfitting</b> — K = ${k} averages over too many points; the boundary is too smooth to follow the moons.`; msg.className = 'bv-verdict under'; }
    else { msg.innerHTML = `✅ Good range — the lowest validation error on this data is at K = ${best}.`; msg.className = 'bv-verdict ok'; }

    elbow.innerHTML = '';
    const ex = (kk) => 22 + (kk - 1) * 5.4, ey = (e) => 128 - Math.min(e, 0.3) / 0.3 * 118;
    el('line', { x1: 22, y1: 128, x2: 295, y2: 128, class: 'axis' }, elbow);
    el('line', { x1: ex(k), y1: 8, x2: ex(k), y2: 128, class: 'deg-mark' }, elbow);
    el('polyline', { points: errCurve.train.map((e, i) => `${ex(i + 1).toFixed(1)},${ey(e).toFixed(1)}`).join(' '), class: 'err-train' }, elbow);
    el('polyline', { points: errCurve.val.map((e, i) => `${ex(i + 1).toFixed(1)},${ey(e).toFixed(1)}`).join(' '), class: 'err-test' }, elbow);
    txt(elbow, 22, 144, 'K = 1', 'tick'); txt(elbow, 295, 144, 'K = 51', 'tick', 'end');
    txt(elbow, 18, 14, '30%', 'tick', 'end'); txt(elbow, 18, 131, '0', 'tick', 'end');
  }
  svg.addEventListener('click', (e) => { const p = svgPoint(svg, e); query = [invX(p.x), invY(p.y)]; render(); });
  kS.addEventListener('input', render);
  document.getElementById('kc-new').addEventListener('click', () => { seed++; load(); });
  load();
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initMath();
  initHero();
  initGlobalLocal();
  initExample();
  initDistances();
  initClassifier();
});
