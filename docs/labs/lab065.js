/* ===== Lab 6.5 interactivity ===== */

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
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d).replace('-', '−') : '∞');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// animate a set of sliders to target values (timer based, so it also works in background tabs)
function animateSliders(pairs, onFrame, ms = 700) {
  const start = pairs.map(([s]) => +s.value), t0 = performance.now();
  const id = setInterval(() => {
    const k = reduceMotion ? 1 : Math.min(1, (performance.now() - t0) / ms), e = 1 - (1 - k) ** 3;
    pairs.forEach(([s, target], i) => { s.value = start[i] + (target - start[i]) * e; });
    onFrame();
    if (k >= 1) clearInterval(id);
  }, 16);
  return id;
}

/* ---------- maths rendering ---------- */
function initMath() {
  if (!window.renderMathInElement) return; // CDN unavailable: the TeX source stays readable
  renderMathInElement(document.body, {
    delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
    throwOnError: false,
  });
}

/* ---------- hero backdrop: scatter, fitted line and a sigmoid ---------- */
function initHero() {
  const svg = document.getElementById('reg-hero-bg');
  const r = rng(21);
  for (let i = 0; i < 60; i++) {
    const x = r() * 560, y = 250 - x * 0.3 + gauss(r) * 22;
    el('circle', { cx: x.toFixed(0), cy: y.toFixed(0), r: 4, class: 'pt' }, svg);
  }
  el('line', { x1: 0, y1: 250, x2: 560, y2: 82, class: 'reg' }, svg);
  const d = Array.from({ length: 121 }, (_, i) => { const x = 640 + i * 4.6; return `${i ? 'L' : 'M'}${x.toFixed(0)},${(250 - 190 * sigmoid((i - 60) / 9)).toFixed(1)}`; }).join('');
  el('path', { d, class: 'sig' }, svg);
  for (let i = 0; i < 30; i++) {
    const x = 640 + r() * 552, cls = x > 916 + gauss(r) * 50;
    el('circle', { cx: x.toFixed(0), cy: cls ? 60 : 250, r: 4, class: cls ? 'c1' : 'c0' }, svg);
  }
}

/* ---------- TV advertising data (simulated, same shape as the slide figure) ---------- */
const TV = (() => {
  const r = rng(2024), pts = [];
  for (let i = 0; i < 70; i++) {
    const x = r() * 295 + 1;
    const y = Math.max(1.5, 7.03 + 0.0475 * x + gauss(r) * (0.8 + 0.011 * x));
    pts.push([x, y]);
  }
  return pts;
})();
function closedForm(pts) {
  const n = pts.length, mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  const b1 = pts.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / pts.reduce((s, [x]) => s + (x - mx) ** 2, 0);
  return { b0: my - b1 * mx, b1, mx, my };
}
const mseOf = (pts, b0, b1) => pts.reduce((s, [x, y]) => s + (b0 + b1 * x - y) ** 2, 0) / pts.length;

/* ---------- residual playground ---------- */
function initResiduals() {
  const svg = document.getElementById('res-plot');
  const s0 = document.getElementById('res-b0'), s1 = document.getElementById('res-b1');
  const { b0: B0, b1: B1, my } = closedForm(TV);
  const sst = TV.reduce((s, [, y]) => s + (y - my) ** 2, 0);
  const X = (x) => 50 + x * 1.6, Y = (y) => 300 - y * 10;

  function render() {
    const b0 = +s0.value, b1 = +s1.value;
    document.getElementById('res-b0-val').textContent = b0.toFixed(2);
    document.getElementById('res-b1-val').textContent = b1.toFixed(3);
    svg.innerHTML = '';
    el('line', { x1: 50, y1: 300, x2: 530, y2: 300, class: 'axis' }, svg);
    el('line', { x1: 50, y1: 300, x2: 50, y2: 15, class: 'axis' }, svg);
    [0, 100, 200, 300].forEach(v => txt(svg, X(v), 316, v, 'tick', 'middle'));
    [5, 15, 25].forEach(v => txt(svg, 44, Y(v) + 4, v, 'tick', 'end'));
    txt(svg, 290, 334, 'TV', 'tick', 'middle');
    txt(svg, 14, 160, 'Sales', 'tick', 'middle', { transform: 'rotate(-90 14 160)' });
    const clip = el('clipPath', { id: 'res-clip' }, el('defs', {}, svg));
    el('rect', { x: 50, y: 10, width: 485, height: 290 }, clip);
    const g = el('g', { 'clip-path': 'url(#res-clip)' }, svg);
    TV.forEach(([x, y]) => el('line', { x1: X(x), y1: Y(y), x2: X(x), y2: Y(b0 + b1 * x), class: 'resid-grey' }, g));
    el('line', { x1: X(-10), y1: Y(b0 - 10 * b1), x2: X(310), y2: Y(b0 + 310 * b1), class: 'reg-blue' }, g);
    TV.forEach(([x, y]) => el('circle', { cx: X(x), cy: Y(y), r: 4, class: 'tv-pt' }, g));
    const mse = mseOf(TV, b0, b1), sse = mse * TV.length;
    document.getElementById('res-mse').textContent = mse.toFixed(2);
    document.getElementById('res-rmse').textContent = Math.sqrt(mse).toFixed(2);
    document.getElementById('res-r2').textContent = fmt(1 - sse / sst, 3);
    const best = mseOf(TV, B0, B1);
    document.getElementById('res-eq').innerHTML = `ŷ = ${b0.toFixed(2)} + ${b1.toFixed(4)} · x<br><span>${mse - best < best * 0.002 ? '✅ This is the least-squares line (the closed-form solution).' : `The minimum MSE is ${best.toFixed(2)} at β₀ = ${B0.toFixed(2)}, β₁ = ${B1.toFixed(4)}.`}</span>`;
  }
  let anim;
  document.getElementById('res-fit').addEventListener('click', () => { clearInterval(anim); anim = animateSliders([[s0, B0], [s1, B1]], render); });
  [s0, s1].forEach(s => s.addEventListener('input', () => { clearInterval(anim); render(); }));
  render();
}

/* ---------- gradient descent on the cost surface ---------- */
function initGradientDescent() {
  const cont = document.getElementById('gd-contour'), fit = document.getElementById('gd-fit');
  const lrS = document.getElementById('gd-lr'), playBtn = document.getElementById('gd-play');
  const pts = TV.map(([x, y]) => [x / 100, y]);        // TV in hundreds: a simple feature scaling
  const n = pts.length;
  const { b0: B0, b1: B1 } = closedForm(pts);
  const Jstar = mseOf(pts, B0, B1);
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, mxx = pts.reduce((s, p) => s + p[0] ** 2, 0) / n;
  // J(β) = J* + (β − β*)ᵀ A (β − β*),  A = [[1, x̄], [x̄, mean(x²)]]
  const tr = 1 + mxx, det = mxx - mx * mx, disc = Math.sqrt(tr * tr / 4 - det);
  const lam = [tr / 2 + disc, tr / 2 - disc];
  const vec = lam.map(l => { const v = [mx, l - 1]; const len = Math.hypot(...v); return [v[0] / len, v[1] / len]; });
  const R0 = [-2, 16], R1 = [-3, 10];
  const PX = (b0) => 40 + (b0 - R0[0]) / (R0[1] - R0[0]) * 370, PY = (b1) => 310 - (b1 - R1[0]) / (R1[1] - R1[0]) * 295;
  const START = [14, -2];
  let beta, path, iter, timer = null, status = '';

  function reset() { stop(); beta = [...START]; path = [[...START]]; iter = 0; status = ''; render(); }
  function step() {
    const [b0, b1] = beta;
    let g0 = 0, g1 = 0;
    pts.forEach(([x, y]) => { const e = b0 + b1 * x - y; g0 += e; g1 += e * x; });
    g0 *= 2 / n; g1 *= 2 / n;
    const lr = +lrS.value;
    beta = [b0 - lr * g0, b1 - lr * g1];
    path.push([...beta]); iter++;
    const J = mseOf(pts, ...beta);
    if (!Number.isFinite(J) || J > 1e6) status = 'diverged';
    else if (Math.hypot(g0, g1) < 2e-3) status = 'converged';
    return !status;
  }
  function render() {
    cont.innerHTML = '';
    el('line', { x1: 40, y1: 310, x2: 410, y2: 310, class: 'axis' }, cont);
    el('line', { x1: 40, y1: 310, x2: 40, y2: 15, class: 'axis' }, cont);
    txt(cont, 225, 332, 'β₀ (intercept)', 'tick', 'middle');
    txt(cont, 14, 165, 'β₁ (slope)', 'tick', 'middle', { transform: 'rotate(-90 14 165)' });
    [0, 5, 10, 15].forEach(v => txt(cont, PX(v), 324, v, 'tick', 'middle'));
    [0, 5, 10].forEach(v => txt(cont, 34, PY(v) + 4, v, 'tick', 'end'));
    const clip = el('clipPath', { id: 'gd-clip' }, el('defs', {}, cont));
    el('rect', { x: 40, y: 15, width: 370, height: 295 }, clip);
    const g = el('g', { 'clip-path': 'url(#gd-clip)' }, cont);
    [0.05, 0.2, 0.5, 1, 2, 4, 8, 16, 32].forEach((m, i) => {
      const c = Jstar * m;
      const d = Array.from({ length: 73 }, (_, k) => {
        const t = (k / 72) * 2 * Math.PI, a = Math.sqrt(c / lam[0]) * Math.cos(t), b = Math.sqrt(c / lam[1]) * Math.sin(t);
        return `${k ? 'L' : 'M'}${PX(B0 + a * vec[0][0] + b * vec[1][0]).toFixed(1)},${PY(B1 + a * vec[0][1] + b * vec[1][1]).toFixed(1)}`;
      }).join('') + 'Z';
      el('path', { d, class: 'contour', style: `opacity:${0.85 - i * 0.07}` }, g);
    });
    el('polyline', { points: path.map(([a, b]) => `${PX(a).toFixed(1)},${PY(b).toFixed(1)}`).join(' '), class: 'gd-path' }, g);
    path.slice(-40).forEach(([a, b]) => el('circle', { cx: PX(a), cy: PY(b), r: 2.5, class: 'gd-dot' }, g));
    el('circle', { cx: PX(beta[0]), cy: PY(beta[1]), r: 6, class: 'gd-now' }, g);
    el('path', { d: `M${PX(B0)},${PY(B1) - 9} l2.6,5.8 6.3,.7 -4.7,4.2 1.4,6.2 -5.6,-3.2 -5.6,3.2 1.4,-6.2 -4.7,-4.2 6.3,-.7z`, class: 'gd-star' }, g);

    fit.innerHTML = '';
    const FX = (x) => 30 + x * 88, FY = (y) => 180 - y * 6;
    el('line', { x1: 30, y1: 180, x2: 295, y2: 180, class: 'axis' }, fit);
    el('line', { x1: 30, y1: 180, x2: 30, y2: 8, class: 'axis' }, fit);
    txt(fit, 160, 196, 'TV (hundreds)', 'tick', 'middle');
    const fc = el('clipPath', { id: 'gd-fclip' }, el('defs', {}, fit));
    el('rect', { x: 30, y: 5, width: 270, height: 175 }, fc);
    const fg = el('g', { 'clip-path': 'url(#gd-fclip)' }, fit);
    pts.forEach(([x, y]) => el('circle', { cx: FX(x), cy: FY(y), r: 2.6, class: 'tv-pt' }, fg));
    el('line', { x1: FX(0), y1: FY(beta[0]), x2: FX(3.1), y2: FY(beta[0] + 3.1 * beta[1]), class: 'reg-blue' }, fg);

    const J = mseOf(pts, ...beta);
    document.getElementById('gd-iter').textContent = iter;
    document.getElementById('gd-cost').textContent = Number.isFinite(J) && J < 1e6 ? J.toFixed(2) : '∞';
    document.getElementById('gd-lr-val').textContent = (+lrS.value).toFixed(2);
    const msg = document.getElementById('gd-msg');
    if (status === 'diverged') { msg.innerHTML = '💥 <b>Diverging</b> — the learning rate is too large, each step overshoots the valley and the cost explodes.'; msg.className = 'bv-verdict over'; }
    else if (status === 'converged') { msg.innerHTML = `✅ <b>Converged</b> after ${iter} steps to β₀ = ${beta[0].toFixed(2)}, β₁ = ${beta[1].toFixed(2)} — the same point as the closed form ★.`; msg.className = 'bv-verdict ok'; }
    else { msg.innerHTML = `β₀ = ${beta[0].toFixed(2)}, β₁ = ${beta[1].toFixed(2)}<br><span>Closed form ★: β₀ = ${B0.toFixed(2)}, β₁ = ${B1.toFixed(2)}</span>`; msg.className = 'bv-verdict'; }
    playBtn.textContent = timer ? '⏸' : '▶';
    document.getElementById('gd-step').disabled = !!status;
  }
  function stop() { clearInterval(timer); timer = null; }
  document.getElementById('gd-step').addEventListener('click', () => { stop(); if (!status) step(); render(); });
  document.getElementById('gd-reset').addEventListener('click', reset);
  lrS.addEventListener('input', reset);
  playBtn.addEventListener('click', () => {
    if (timer) { stop(); render(); return; }
    if (status) reset();
    timer = setInterval(() => { const more = step() && iter < 600; if (!more) stop(); render(); }, 35);
    render();
  });
  reset();
}

/* ---------- exam-score example ---------- */
function initExample() {
  const s = document.getElementById('ex-h'), out = document.getElementById('ex-out');
  const render = () => {
    const h = +s.value;
    document.getElementById('ex-h-val').textContent = h;
    out.innerHTML = `ŷ = 40 + 5 · ${h} = <b>${40 + 5 * h}</b> points`;
  };
  s.addEventListener('input', render);
  render();
}

/* ---------- linear vs logistic regression on 0/1 labels ---------- */
const CMP = (() => {
  const r = rng(77), pts = [];
  for (let i = 0; i < 26; i++) {
    const x = 0.3 + r() * 9.4;
    pts.push([x, r() < sigmoid((x - 5) * 0.75) ? 1 : 0]);
  }
  return pts;
})();
function fitLogistic1D(pts) {
  let w = 0, b = 0;
  for (let it = 0; it < 4000; it++) {
    let gw = 0, gb = 0;
    pts.forEach(([x, y]) => { const e = sigmoid(w * x + b) - y; gw += e * x; gb += e; });
    w -= 0.05 * gw / pts.length; b -= 0.05 * gb / pts.length * 4;
  }
  return { w, b };
}
function initCompare() {
  const svg = document.getElementById('cmp-plot'), msg = document.getElementById('cmp-msg');
  const lin = closedForm(CMP), lg = fitLogistic1D(CMP);
  const X = (x) => 50 + x * 57, Y = (y) => 235 - y * 170;
  let mode = 'lin';
  function render() {
    svg.innerHTML = '';
    el('rect', { x: 50, y: Y(1.35), width: 570, height: Y(1) - Y(1.35), class: 'oob' }, svg);
    el('rect', { x: 50, y: Y(0), width: 570, height: Y(-0.35) - Y(0), class: 'oob' }, svg);
    txt(svg, 612, Y(1.2), 'not a probability (> 1)', 'tick oob-l', 'end');
    txt(svg, 612, Y(-0.22), 'not a probability (< 0)', 'tick oob-l', 'end');
    el('line', { x1: 50, y1: Y(0), x2: 620, y2: Y(0), class: 'axis' }, svg);
    el('line', { x1: 50, y1: Y(1), x2: 620, y2: Y(1), class: 'grid-line' }, svg);
    el('line', { x1: 50, y1: Y(0.5), x2: 620, y2: Y(0.5), class: 'grid-line dashed' }, svg);
    [0, 0.5, 1].forEach(v => txt(svg, 44, Y(v) + 4, v, 'tick', 'end'));
    txt(svg, 335, 292, 'hours studied  →  passed (1) / failed (0)', 'tick', 'middle');
    const f = mode === 'lin' ? (x) => lin.b0 + lin.b1 * x : (x) => sigmoid(lg.w * x + lg.b);
    const d = Array.from({ length: 101 }, (_, i) => { const x = i / 10; return `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(Math.max(-0.35, Math.min(1.35, f(x)))).toFixed(1)}`; }).join('');
    el('path', { d, class: mode === 'lin' ? 'reg-blue thick' : 'sig-red' }, svg);
    CMP.forEach(([x, y]) => el('circle', { cx: X(x), cy: Y(y), r: 6, class: y ? 'cls1' : 'cls0' }, svg));
    if (mode === 'lin') {
      msg.innerHTML = `The least-squares line gives <b>${f(0).toFixed(2)}</b> at 0 hours and <b>${f(10).toFixed(2)}</b> at 10 hours — membership values outside [0, 1], so they <b>cannot be read as probabilities</b>.`;
      msg.className = 'bv-verdict over';
    } else {
      msg.innerHTML = `The sigmoid stays between 0 and 1 everywhere: P(pass) = <b>${f(0).toFixed(3)}</b> at 0 hours and <b>${f(10).toFixed(3)}</b> at 10 hours. The decision boundary p = 0.5 is at ${(-lg.b / lg.w).toFixed(1)} hours.`;
      msg.className = 'bv-verdict ok';
    }
  }
  document.querySelectorAll('.cmp-mode').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.cmp-mode').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); mode = b.dataset.mode; render();
  }));
  render();
}

/* ---------- sigmoid, odds and log-odds ---------- */
function initSigmoid() {
  const svg = document.getElementById('sg-plot'), s = document.getElementById('sg-z'), chain = document.getElementById('sg-chain');
  const X = (z) => 40 + (z + 10) * 19, Y = (p) => 260 - p * 230;
  function render() {
    const z = +s.value, p = sigmoid(z);
    document.getElementById('sg-z-val').textContent = z.toFixed(1);
    svg.innerHTML = '';
    el('line', { x1: 40, y1: Y(0), x2: 420, y2: Y(0), class: 'axis' }, svg);
    el('line', { x1: X(0), y1: Y(0), x2: X(0), y2: Y(1.05), class: 'grid-line' }, svg);
    el('line', { x1: 40, y1: Y(1), x2: 420, y2: Y(1), class: 'grid-line dashed' }, svg);
    el('line', { x1: 40, y1: Y(0.5), x2: 420, y2: Y(0.5), class: 'grid-line dashed' }, svg);
    [-10, -5, 0, 5, 10].forEach(v => txt(svg, X(v), 278, v, 'tick', 'middle'));
    [0, 0.5, 1].forEach(v => txt(svg, 34, Y(v) + 4, v, 'tick', 'end'));
    txt(svg, 230, 296, 'z', 'tick', 'middle');
    const d = Array.from({ length: 201 }, (_, i) => { const zz = -10 + i / 10; return `${i ? 'L' : 'M'}${X(zz).toFixed(1)},${Y(sigmoid(zz)).toFixed(1)}`; }).join('');
    el('path', { d, class: 'sig-red' }, svg);
    el('line', { x1: X(z), y1: Y(0), x2: X(z), y2: Y(p), class: 'guide' }, svg);
    el('line', { x1: 40, y1: Y(p), x2: X(z), y2: Y(p), class: 'guide' }, svg);
    el('circle', { cx: X(z), cy: Y(p), r: 7, class: p >= 0.5 ? 'cls1' : 'cls0' }, svg);
    const odds = Math.exp(z);
    chain.innerHTML = `
      <div class="sg-row"><span>linear score</span><b>z = ${fmt(z, 1)}</b></div>
      <div class="sg-row"><span>probability</span><b>p = σ(z) = ${p.toFixed(3)}</b></div>
      <div class="sg-row"><span>odds</span><b>p / (1 − p) = ${odds < 1e4 ? odds.toFixed(3) : odds.toExponential(2)}</b></div>
      <div class="sg-row"><span>log-odds (logit)</span><b>log(odds) = ${fmt(z, 1)} = z</b></div>
      <div class="sg-row pred ${p >= 0.5 ? 'c1' : 'c0'}"><span>prediction</span><b>ŷ = ${p >= 0.5 ? 1 : 0}</b> (p ${p >= 0.5 ? '≥' : '<'} 0.5)</div>`;
  }
  s.addEventListener('input', render);
  render();
}

/* ---------- binary cross-entropy curves ---------- */
function initCrossEntropy() {
  const svg = document.getElementById('ce-plot'), s = document.getElementById('ce-p');
  const X = (p) => 40 + p * 380, Y = (l) => 250 - Math.min(l, 5) * 46;
  function render() {
    const p = +s.value;
    document.getElementById('ce-p-val').textContent = p.toFixed(2);
    svg.innerHTML = '';
    el('line', { x1: 40, y1: 250, x2: 420, y2: 250, class: 'axis' }, svg);
    el('line', { x1: 40, y1: 250, x2: 40, y2: 12, class: 'axis' }, svg);
    [0, 0.5, 1].forEach(v => txt(svg, X(v), 266, v, 'tick', 'middle'));
    [0, 1, 2, 3, 4, 5].forEach(v => txt(svg, 34, Y(v) + 4, v, 'tick', 'end'));
    txt(svg, 230, 278, 'predicted p̂', 'tick', 'middle');
    const curve = (f) => Array.from({ length: 99 }, (_, i) => { const q = (i + 1) / 100; return `${i ? 'L' : 'M'}${X(q).toFixed(1)},${Y(f(q)).toFixed(1)}`; }).join('');
    el('path', { d: curve(q => -Math.log(q)), class: 'ce1' }, svg);
    el('path', { d: curve(q => -Math.log(1 - q)), class: 'ce0' }, svg);
    txt(svg, X(0.06), Y(4.3), 'y = 1:  −log(p̂)', 'tick ce1-l');
    txt(svg, X(0.94), Y(4.3), 'y = 0:  −log(1 − p̂)', 'tick ce0-l', 'end');
    const l1 = -Math.log(p), l0 = -Math.log(1 - p);
    el('line', { x1: X(p), y1: 250, x2: X(p), y2: 12, class: 'guide' }, svg);
    el('circle', { cx: X(p), cy: Y(l1), r: 6, class: 'cls1' }, svg);
    el('circle', { cx: X(p), cy: Y(l0), r: 6, class: 'cls0' }, svg);
    document.getElementById('ce-l1').textContent = l1.toFixed(3);
    document.getElementById('ce-l0').textContent = l0.toFixed(3);
  }
  s.addEventListener('input', render);
  render();
}

/* ---------- 2-D logistic regression with gradient descent ---------- */
function makeLogData(kind) {
  const r = rng(kind === 'overlap' ? 5 : 9), pts = [];
  const [c0, c1, sd] = kind === 'overlap' ? [[-0.7, -0.5], [0.7, 0.6], 0.8] : [[-1.3, -1.0], [1.3, 1.0], 0.55];
  while (pts.length < 70) {
    const y = pts.length % 2, c = y ? c1 : c0;
    const x1 = c[0] + gauss(r) * sd, x2 = c[1] + gauss(r) * sd;
    if (Math.abs(x1) > 2.9 || Math.abs(x2) > 2.9) continue;
    if (kind === 'separable' && (y ? x1 + x2 < 0.5 : x1 + x2 > -0.5)) continue; // keep a clear margin
    pts.push([x1, x2, y]);
  }
  return pts;
}
function initLogisticGD() {
  const svg = document.getElementById('lg-plot'), curve = document.getElementById('lg-curve');
  const lrS = document.getElementById('lg-lr'), playBtn = document.getElementById('lg-play');
  let kind = 'overlap', data = makeLogData(kind), w, b, iter, losses, timer = null;
  const S = (v) => 200 + v * 66.7, Sy = (v) => 200 - v * 66.7;

  const loss = () => data.reduce((s, [x1, x2, y]) => {
    const p = Math.min(1 - 1e-12, Math.max(1e-12, sigmoid(w[0] * x1 + w[1] * x2 + b)));
    return s - (y * Math.log(p) + (1 - y) * Math.log(1 - p));
  }, 0) / data.length;

  function reset() { stop(); w = [0, 0]; b = 0; iter = 0; losses = [loss()]; render(); }
  function step(k = 1) {
    const eta = +lrS.value;
    for (let t = 0; t < k; t++) {
      let g0 = 0, g1 = 0, gb = 0;
      data.forEach(([x1, x2, y]) => { const e = sigmoid(w[0] * x1 + w[1] * x2 + b) - y; g0 += e * x1; g1 += e * x2; gb += e; });
      const n = data.length;
      w = [w[0] - eta * g0 / n, w[1] - eta * g1 / n]; b -= eta * gb / n; iter++;
    }
    losses.push(loss());
  }
  function render() {
    svg.innerHTML = '';
    const N = 25, cell = 400 / N;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x1 = -3 + (i + 0.5) * 6 / N, x2 = 3 - (j + 0.5) * 6 / N;
      const p = sigmoid(w[0] * x1 + w[1] * x2 + b);
      el('rect', { x: i * cell, y: j * cell, width: cell + 0.5, height: cell + 0.5, class: p >= 0.5 ? 'shade1' : 'shade0', style: `opacity:${(Math.abs(p - 0.5) * 0.9).toFixed(3)}` }, svg);
    }
    if (Math.hypot(...w) > 1e-6) {
      // boundary w1 x1 + w2 x2 + b = 0
      const ends = [];
      if (Math.abs(w[1]) > 1e-9) [-3, 3].forEach(x1 => ends.push([x1, -(w[0] * x1 + b) / w[1]]));
      else [-3, 3].forEach(x2 => ends.push([-b / w[0], x2]));
      el('line', { x1: S(ends[0][0]), y1: Sy(ends[0][1]), x2: S(ends[1][0]), y2: Sy(ends[1][1]), class: 'boundary' }, svg);
    }
    data.forEach(([x1, x2, y]) => el('circle', { cx: S(x1), cy: Sy(x2), r: 5.5, class: y ? 'cls1' : 'cls0' }, svg));

    curve.innerHTML = '';
    const maxL = Math.max(...losses, 0.7), shown = losses.slice(-300);
    el('line', { x1: 10, y1: 110, x2: 295, y2: 110, class: 'axis' }, curve);
    el('polyline', { points: shown.map((l, i) => `${(10 + i / Math.max(1, shown.length - 1) * 285).toFixed(1)},${(110 - l / maxL * 100).toFixed(1)}`).join(' '), class: 'loss-line' }, curve);

    const L = losses[losses.length - 1], wn = Math.hypot(...w);
    document.getElementById('lg-iter').textContent = iter;
    document.getElementById('lg-loss').textContent = L.toFixed(3);
    document.getElementById('lg-w').textContent = wn.toFixed(2);
    document.getElementById('lg-lr-val').textContent = (+lrS.value).toFixed(1);
    const msg = document.getElementById('lg-msg');
    if (iter === 0) { msg.textContent = 'All weights start at 0, so p̂ = 0.5 everywhere. Press play.'; msg.className = 'bv-verdict'; }
    else if (kind === 'separable') { msg.innerHTML = `The classes are perfectly separable: the loss keeps falling towards 0 and ‖w‖ keeps growing (${wn.toFixed(1)}) — the model just becomes more and more confident.`; msg.className = 'bv-verdict over'; }
    else { msg.innerHTML = 'The classes overlap, so no line gets every point right: the loss levels off and the weights settle to finite values.'; msg.className = 'bv-verdict ok'; }
    playBtn.textContent = timer ? '⏸' : '▶';
  }
  function stop() { clearInterval(timer); timer = null; }

  document.querySelectorAll('.lg-data').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.lg-data').forEach(x => x.classList.remove('active'));
    btn.classList.add('active'); kind = btn.dataset.d; data = makeLogData(kind); reset();
  }));
  lrS.addEventListener('input', () => { document.getElementById('lg-lr-val').textContent = (+lrS.value).toFixed(1); });
  document.getElementById('lg-step').addEventListener('click', () => { stop(); step(10); render(); });
  document.getElementById('lg-reset').addEventListener('click', reset);
  playBtn.addEventListener('click', () => {
    if (timer) { stop(); render(); return; }
    timer = setInterval(() => { step(5); if (iter >= 5000) stop(); render(); }, 40);
    render();
  });
  reset();
}

/* ---------- softmax calculator ---------- */
function initSoftmax() {
  const names = ['🍎 Apple', '🍌 Banana', '🍊 Orange'], colors = ['#d9546e', 'var(--ucs)', '#e89a3c'];
  const sliders = [0, 1, 2].map(i => document.getElementById(`sm-z${i}`));
  const out = document.getElementById('sm-out');
  let truth = 2;
  function render() {
    const z = sliders.map(s => +s.value);
    sliders.forEach((s, i) => { document.getElementById(`sm-z${i}-val`).textContent = z[i].toFixed(1); });
    const ex = z.map(Math.exp), sum = ex.reduce((a, b) => a + b, 0), p = ex.map(e => e / sum);
    const pred = p.indexOf(Math.max(...p));
    out.innerHTML = `
      <div class="table-wrap"><table class="summary sm-table">
        <thead><tr><th>Class</th><th>Logit z</th><th>e<sup>z</sup></th><th>Probability</th><th></th></tr></thead>
        <tbody>${z.map((zi, i) => `<tr${i === pred ? ' class="sm-pred"' : ''}><td>${names[i]}${i === truth ? ' <span class="sm-true-tag">true</span>' : ''}</td><td>${zi.toFixed(1)}</td><td>${ex[i].toFixed(2)}</td><td><b>${p[i].toFixed(3)}</b></td>
          <td class="sm-barcell"><div class="sm-bar"><span style="width:${(p[i] * 100).toFixed(1)}%; background:${colors[i]}"></span></div></td></tr>`).join('')}
        </tbody></table></div>
      <p class="sm-line">Sum of exponentials: ${ex.map(e => e.toFixed(2)).join(' + ')} = <b>${sum.toFixed(2)}</b></p>
      <p class="sm-line">Prediction: ŷ = argmax<sub>k</sub> P(y = k | x) = <b>${names[pred]}</b>${pred === truth ? ' ✅' : ' ❌'}</p>
      <p class="sm-line">Cross-entropy loss: −log P(true class) = −log(${p[truth].toFixed(3)}) = <b class="sm-loss">${(-Math.log(p[truth])).toFixed(3)}</b></p>`;
  }
  sliders.forEach(s => s.addEventListener('input', render));
  document.querySelectorAll('.sm-true').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.sm-true').forEach(x => x.classList.remove('active'));
    btn.classList.add('active'); truth = +btn.dataset.k; render();
  }));
  render();
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initMath();
  initHero();
  initResiduals();
  initGradientDescent();
  initExample();
  initCompare();
  initSigmoid();
  initCrossEntropy();
  initLogisticGD();
  initSoftmax();
});
