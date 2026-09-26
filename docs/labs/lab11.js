/* ===== Lab 11 interactivity ===== */

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
const f1 = (v) => v.toFixed(1), f2 = (v) => v.toFixed(2), f3 = (v) => v.toFixed(3), f4 = (v) => sgn(v, 4);
const sgn = (v, d = 2) => (v < 0 ? '−' + Math.abs(v).toFixed(d) : v.toFixed(d));   // typographic minus
const par = (v, d = 2) => (v < 0 ? `(${sgn(v, d)})` : v.toFixed(d));

/* ---------- activations ---------- */
const sigm = (z) => 1 / (1 + Math.exp(-z));
const ACT = {
  step: { f: (z) => (z > 0 ? 1 : 0), d: () => 0, name: 'step' },
  sigmoid: { f: sigm, d: (z) => sigm(z) * (1 - sigm(z)), name: 'σ' },
  tanh: { f: Math.tanh, d: (z) => 1 - Math.tanh(z) ** 2, name: 'tanh' },
  relu: { f: (z) => Math.max(0, z), d: (z) => (z > 0 ? 1 : 0), name: 'ReLU' },
  linear: { f: (z) => z, d: () => 1, name: 'linear' },
};

/* ---------- a small multilayer perceptron (hidden activation + sigmoid output, cross-entropy) ---------- */
function makeNet(sizes, r) {
  return sizes.slice(1).map((n, l) => ({
    W: Array.from({ length: n }, () => Array.from({ length: sizes[l] }, () => r() - 0.5)),
    b: Array.from({ length: n }, () => r() - 0.5),
  }));
}
function netForward(net, x, hid) {
  const as = [x], zs = [];
  net.forEach((L, l) => {
    const a = as[l], z = L.W.map((w, i) => w.reduce((s, wij, j) => s + wij * a[j], L.b[i]));
    zs.push(z);
    as.push(z.map(v => (l === net.length - 1 ? sigm(v) : ACT[hid].f(v))));
  });
  return { as, zs };
}
function trainEpoch(net, X, Y, lr, hid) {
  const G = net.map(L => ({ W: L.W.map(r => r.map(() => 0)), b: L.b.map(() => 0) }));
  let loss = 0;
  X.forEach((x, n) => {
    const { as, zs } = netForward(net, x, hid), p = as[as.length - 1][0], y = Y[n];
    loss -= y * Math.log(p + 1e-12) + (1 - y) * Math.log(1 - p + 1e-12);
    let delta = [p - y];                                   // sigmoid + cross-entropy: output delta = ŷ − y
    for (let l = net.length - 1; l >= 0; l--) {
      const a = as[l];
      delta.forEach((d, i) => { G[l].b[i] += d; a.forEach((aj, j) => { G[l].W[i][j] += d * aj; }); });
      if (l > 0) delta = a.map((_, j) => net[l].W.reduce((s, w, i) => s + w[j] * delta[i], 0) * ACT[hid].d(zs[l - 1][j]));
    }
  });
  const N = X.length;
  net.forEach((L, l) => {
    L.W.forEach((w, i) => w.forEach((_, j) => { w[j] -= lr * G[l].W[i][j] / N; }));
    L.b.forEach((_, i) => { L.b[i] -= lr * G[l].b[i] / N; });
  });
  return loss / N;
}

/* ---------- playground datasets (display coordinates, bounds, labels) ---------- */
const MP_DATA = (() => {
  const r = rng(11), xor = [], circle = [], moons = [];
  [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]].forEach(([a, b, c]) => { for (let i = 0; i < 10; i++) xor.push([a + gauss(r) * 0.12, b + gauss(r) * 0.12, c]); });
  for (let i = 0; i < 90; i++) { const x = r() * 2 - 1, y = r() * 2 - 1; circle.push([x, y, Math.hypot(x, y) < 0.55 ? 1 : 0]); }
  for (let i = 0; i < 90; i++) {
    const t = r() * Math.PI, c = i % 2;
    moons.push(c ? [1 - Math.cos(t) + gauss(r) * 0.1, 0.5 - Math.sin(t) + gauss(r) * 0.1, 1] : [Math.cos(t) + gauss(r) * 0.1, Math.sin(t) + gauss(r) * 0.1, 0]);
  }
  return {
    golf: { P: [[0, 0, 0], [3, 0, 0], [0, 3, 0], [3, 3, 0], [1, 1, 1], [2, 1, 1], [1, 2, 1], [2, 2, 1]], lo: [-0.5, -0.5], hi: [3.5, 3.5], names: ['temperature', 'humidity'], cls: ['no golf', 'golf'] },
    xor: { P: xor, lo: [-0.5, -0.5], hi: [1.5, 1.5], names: ['x₁', 'x₂'], cls: ['0', '1'] },
    circle: { P: circle, lo: [-1.1, -1.1], hi: [1.1, 1.1], names: ['x₁', 'x₂'], cls: ['outside', 'inside'] },
    moons: { P: moons, lo: [-1.3, -0.9], hi: [2.3, 1.4], names: ['x₁', 'x₂'], cls: ['upper moon', 'lower moon'] },
  };
})();
/* the network sees inputs rescaled to [−1, 1] */
const normIn = (D, p) => [0, 1].map(j => ((p[j] - D.lo[j]) / (D.hi[j] - D.lo[j])) * 2 - 1);

/* ---------- back-propagation example (the slides' 5-unit network) ---------- */
const BP_W0 = { '13': 0.4, '23': -0.6, '14': 0.7, '24': 0.2, '35': 0.5, '45': -0.3, b3: 0.1, b4: -0.2, b5: 0.3 };
const BP_X = [1.0, 0.5], BP_Y = 1.0, BP_ALPHA = 0.5;
function bpCompute(W) {
  const [a1, a2] = BP_X;
  const in3 = W['13'] * a1 + W['23'] * a2 + W.b3, a3 = sigm(in3);
  const in4 = W['14'] * a1 + W['24'] * a2 + W.b4, a4 = sigm(in4);
  const in5 = W['35'] * a3 + W['45'] * a4 + W.b5, a5 = sigm(in5);
  const err = BP_Y - a5, E = 0.5 * err * err;
  const d5 = err * a5 * (1 - a5), d3 = a3 * (1 - a3) * W['35'] * d5, d4 = a4 * (1 - a4) * W['45'] * d5;
  const act = { 1: a1, 2: a2, 3: a3, 4: a4 };
  const next = { ...W };
  ['13', '23', '14', '24', '35', '45'].forEach(k => { next[k] = W[k] + BP_ALPHA * act[k[0]] * { 3: d3, 4: d4, 5: d5 }[k[1]]; });
  next.b3 = W.b3 + BP_ALPHA * d3; next.b4 = W.b4 + BP_ALPHA * d4; next.b5 = W.b5 + BP_ALPHA * d5;
  return { a1, a2, in3, a3, in4, a4, in5, a5, err, E, d5, d3, d4, next };
}

/* ---------- maths rendering ---------- */
function initMath() {
  if (!window.renderMathInElement) return;
  renderMathInElement(document.body, {
    delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
    throwOnError: false,
  });
}

/* ---------- plotting helpers ---------- */
/* shade a plot by a value in [0, 1] (blue = 1, red = 0) or signed (blue > 0, red < 0) */
function shade(svg, f, box, N, mode = 'prob', scale = 1) {
  const [x0, y0, w, h] = box, cw = w / N, ch = h / N;
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    const v = f((a + 0.5) / N, 1 - (b + 0.5) / N);
    let cls, op;
    if (mode === 'prob') { cls = v >= 0.5 ? 'nn-hi' : 'nn-lo'; op = Math.min(1, Math.abs(v - 0.5) * 1.3); }
    else if (mode === 'mono') { cls = 'nn-hi'; op = Math.min(1, Math.max(0, v)) * 0.75; }
    else { cls = v >= 0 ? 'nn-hi' : 'nn-lo'; op = Math.min(1, Math.abs(v) / scale) * 0.7; }
    el('rect', { x: x0 + a * cw, y: y0 + b * ch, width: cw + 0.4, height: ch + 0.4, class: cls, 'fill-opacity': op.toFixed(3) }, svg);
  }
}
let CLIP_N = 0;
function axesBox(svg, box, lo, hi, names, ticks) {
  const [x0, y0, w, h] = box, id = 'nnclip' + (++CLIP_N);
  el('rect', { x: x0, y: y0, width: w, height: h }, el('clipPath', { id }, el('defs', {}, svg)));
  el('rect', { x: x0, y: y0, width: w, height: h, class: 'nn-frame' }, svg);
  const X = (v) => x0 + (v - lo[0]) / (hi[0] - lo[0]) * w, Y = (v) => y0 + h - (v - lo[1]) / (hi[1] - lo[1]) * h;
  (ticks || [[lo[0], hi[0]], [lo[1], hi[1]]])[0].forEach(v => txt(svg, X(v), y0 + h + 14, +v.toFixed(2), 'tick', 'middle'));
  (ticks || [[lo[0], hi[0]], [lo[1], hi[1]]])[1].forEach(v => txt(svg, x0 - 6, Y(v) + 4, +v.toFixed(2), 'tick', 'end'));
  if (names) {
    txt(svg, x0 + w / 2, y0 + h + 30, names[0], 'tick', 'middle');
    txt(svg, x0 - 26, y0 + h / 2, names[1], 'tick', 'middle', { transform: `rotate(-90 ${x0 - 26} ${y0 + h / 2})` });
  }
  return { X, Y, clip: `url(#${id})` };
}
function curve(svg, fn, x0, x1, X, Y, cls, n = 240) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = fn(x); if (Number.isFinite(y)) pts.push(`${pts.length ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`); }
  return el('path', { d: pts.join(''), class: cls }, svg);
}

/* ---------- hero: a faint fully connected network ---------- */
function initHero() {
  const svg = document.getElementById('nn-hero-bg');
  const layers = [4, 6, 6, 5, 3, 6, 6, 4], xs = layers.map((_, i) => 70 + i * 152);
  const pos = layers.map((n, i) => Array.from({ length: n }, (_, j) => [xs[i], 150 + (j - (n - 1) / 2) * 42]));
  const r = rng(4);
  for (let i = 0; i < layers.length - 1; i++) pos[i].forEach(p => pos[i + 1].forEach(q => { if (r() < 0.7) el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: r() < 0.5 ? 'e0' : 'e1' }, svg); }));
  pos.flat().forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 9, class: r() < 0.35 ? 'n on' : 'n' }, svg));
}

/* ---------- one neuron ---------- */
function initNeuron() {
  const plot = document.getElementById('nu-plot'), diag = document.getElementById('nu-diagram'), out = document.getElementById('nu-out');
  const S = ['w1', 'w2', 'b'].map(k => document.getElementById('nu-' + k));
  let act = 'sigmoid', probe = [0.5, -1];
  const box = [40, 15, 320, 320], lo = [-3, -3], hi = [3, 3];
  function render() {
    const [w1, w2, b] = S.map(s => +s.value);
    ['w1', 'w2', 'b'].forEach((k, i) => { document.getElementById(`nu-${k}-val`).textContent = f1(+S[i].value); });
    document.querySelectorAll('#nu-act .strat-btn').forEach(x => x.classList.toggle('active', x.dataset.a === act));
    const g = ACT[act].f, fz = (x1, x2) => w1 * x1 + w2 * x2 + b;
    plot.innerHTML = '';
    const bounded = act === 'step' || act === 'sigmoid';
    const maxAbs = Math.max(...[[-3, -3], [3, -3], [-3, 3], [3, 3]].map(([p, q]) => Math.abs(g(fz(p, q)))), 1e-6);
    shade(plot, (u, v) => g(fz(lo[0] + u * 6, lo[1] + v * 6)), box, 36, bounded ? 'prob' : 'signed', maxAbs);
    const { X, Y, clip } = axesBox(plot, box, lo, hi, ['x₁', 'x₂'], [[-3, 0, 3], [-3, 0, 3]]);
    // boundary in = 0
    if (Math.abs(w2) > 1e-6) el('line', { x1: X(-3), y1: Y((-b - w1 * -3) / w2), x2: X(3), y2: Y((-b - w1 * 3) / w2), class: 'nn-boundary', 'clip-path': clip }, plot);
    else if (Math.abs(w1) > 1e-6) el('line', { x1: X(-b / w1), y1: Y(-3), x2: X(-b / w1), y2: Y(3), class: 'nn-boundary', 'clip-path': clip }, plot);
    const cp = plot.querySelector('rect.nn-frame'); plot.appendChild(cp);
    // weight vector arrow from origin
    el('line', { x1: X(0), y1: Y(0), x2: X(Math.max(-3, Math.min(3, w1))), y2: Y(Math.max(-3, Math.min(3, w2))), class: 'nn-wvec' }, plot);
    el('circle', { cx: X(probe[0]), cy: Y(probe[1]), r: 7, class: 'nn-probe' }, plot);
    const z = fz(...probe), a = g(z);
    // diagram
    diag.innerHTML = '';
    const nodeIn = (y, label, v) => { el('circle', { cx: 40, cy: y, r: 20, class: 'nd-in' }, diag); txt(diag, 40, y - 2, label, 'nd-t', 'middle'); txt(diag, 40, y + 12, f2(v), 'nd-v', 'middle'); };
    nodeIn(45, 'x₁', probe[0]); nodeIn(145, 'x₂', probe[1]);
    el('line', { x1: 60, y1: 45, x2: 170, y2: 88, class: 'nd-e ' + (w1 >= 0 ? 'pos' : 'neg'), 'stroke-width': 1 + Math.abs(w1) * 1.5 }, diag);
    el('line', { x1: 60, y1: 145, x2: 170, y2: 102, class: 'nd-e ' + (w2 >= 0 ? 'pos' : 'neg'), 'stroke-width': 1 + Math.abs(w2) * 1.5 }, diag);
    txt(diag, 112, 55, 'w₁ = ' + sgn(w1, 1), 'nd-w', 'middle'); txt(diag, 112, 142, 'w₂ = ' + sgn(w2, 1), 'nd-w', 'middle');
    el('line', { x1: 195, y1: 20, x2: 195, y2: 70, class: 'nd-e pos' }, diag); txt(diag, 200, 30, 'b = ' + sgn(b, 1), 'nd-w');
    el('circle', { cx: 195, cy: 95, r: 26, class: 'nd-sum' }, diag);
    txt(diag, 195, 92, 'Σ → ' + ACT[act].name, 'nd-t', 'middle'); txt(diag, 195, 108, 'z = ' + sgn(z), 'nd-v', 'middle');
    el('line', { x1: 221, y1: 95, x2: 290, y2: 95, class: 'nd-e pos' }, diag);
    el('circle', { cx: 318, cy: 95, r: 26, class: 'nd-out' }, diag);
    txt(diag, 318, 92, 'a', 'nd-t', 'middle'); txt(diag, 318, 108, sgn(a, 3), 'nd-v', 'middle');
    out.innerHTML = `
      <p>z = w₁x₁ + w₂x₂ + b = ${sgn(w1, 1)}·${par(probe[0])} + ${sgn(w2, 1)}·${par(probe[1])} + ${par(b, 1)} = <b>${sgn(z)}</b></p>
      <p class="big">a = ${ACT[act].name}(${sgn(z)}) = <b>${sgn(a, 3)}</b></p>
      <p class="note">The dashed line is where z = 0; the arrow is the weight vector (w₁, w₂), perpendicular to it and pointing to where the unit is active. ${act === 'step' ? 'A step unit is a binary linear classifier.' : act === 'sigmoid' ? 'Sigmoid = logistic regression: a soft cliff. Larger weights make it steeper.' : act === 'relu' ? 'ReLU is 0 on one side of the line and grows linearly on the other.' : 'A linear unit is linear regression: no cliff at all, just a tilted plane.'}</p>`;
  }
  S.forEach(s => s.addEventListener('input', render));
  document.querySelectorAll('#nu-act .strat-btn').forEach(x => x.addEventListener('click', () => { act = x.dataset.a; render(); }));
  plot.addEventListener('click', (e) => { const p = svgPoint(plot, e); probe = [Math.max(-3, Math.min(3, -3 + (p.x - box[0]) / box[2] * 6)), Math.max(-3, Math.min(3, 3 - (p.y - box[1]) / box[3] * 6))]; render(); });
  render();
}

/* ---------- activation functions ---------- */
function initActivation() {
  const svg = document.getElementById('af-plot'), out = document.getElementById('af-out'), kS = document.getElementById('af-k'), sS = document.getElementById('af-s');
  let act = 'sigmoid';
  function render() {
    const k = +kS.value, s = +sS.value, A = ACT[act];
    document.getElementById('af-k-val').textContent = f1(k);
    document.getElementById('af-s-val').textContent = f1(s);
    document.querySelectorAll('#af-act .strat-btn').forEach(x => x.classList.toggle('active', x.dataset.a === act));
    svg.innerHTML = '';
    const X = (z) => 40 + (z + 5) / 10 * 370, Y = (v) => 235 - (v + 1.2) / 3.4 * 220;
    el('line', { x1: 40, y1: Y(0), x2: 410, y2: Y(0), class: 'axis' }, svg);
    el('line', { x1: X(0), y1: 15, x2: X(0), y2: 235, class: 'axis' }, svg);
    [-4, -2, 2, 4].forEach(v => txt(svg, X(v), Y(0) + 14, v, 'tick', 'middle'));
    [-1, 1, 2].forEach(v => { txt(svg, X(0) - 5, Y(v) + 4, v, 'tick', 'end'); el('line', { x1: 40, y1: Y(v), x2: 410, y2: Y(v), class: 'grid-line' }, svg); });
    txt(svg, 405, Y(0) - 6, 'z', 'tick', 'end');
    const g = (z) => A.f(k * z - s), dg = (z) => k * A.d(k * z - s);
    const clipY = (v) => Math.max(-1.2, Math.min(2.2, v));
    if (act === 'step') {
      const zc = s / k;
      el('path', { d: `M${X(-5)},${Y(0)} L${X(zc)},${Y(0)} M${X(zc)},${Y(1)} L${X(5)},${Y(1)}`, class: 'af-f' }, svg);
      el('line', { x1: X(zc), y1: Y(0), x2: X(zc), y2: Y(1), class: 'af-jump' }, svg);
      el('line', { x1: X(-5), y1: Y(0) - 2, x2: X(5), y2: Y(0) - 2, class: 'af-d' }, svg);
    } else {
      curve(svg, (z) => clipY(dg(z)), -5, 5, X, Y, 'af-d', 400);
      curve(svg, (z) => clipY(g(z)), -5, 5, X, Y, 'af-f', 400);
    }
    const maxD = act === 'sigmoid' ? k / 4 : act === 'tanh' ? k : act === 'relu' ? k : 0;
    out.innerHTML = `
      <p class="bt-legend"><span class="k ln af-fk"></span> g(kz − s) &nbsp; <span class="k ln af-dk"></span> derivative</p>
      <p class="big">${{ step: 'Step: g = 1 if kz − s &gt; 0', sigmoid: 'g = σ(kz − s) = 1 / (1 + e<sup>−(kz − s)</sup>)', tanh: 'g = tanh(kz − s)', relu: 'g = max(0, kz − s)' }[act]}</p>
      <p>The threshold sits at z = s / k = <b>${f2(s / k)}</b>. ${act === 'step' ? 'The derivative is <b>0 everywhere</b> (and undefined at the jump): gradient descent gets no signal.' : `Largest slope: <b>${f2(maxD)}</b>${act === 'sigmoid' ? ' (= k/4, at the threshold)' : ''}.`}</p>
      <p class="note">${act === 'sigmoid' ? (k >= 8 ? 'At this steepness the sigmoid is almost a step, but it still has a usable derivative near the threshold.' : 'Raise k: σ(kz) approaches the step function. Far from the threshold the slope is almost 0 (saturation).') : act === 'relu' ? 'ReLU never saturates for z &gt; 0, which is why deep networks train faster with it; for z &lt; 0 its slope is 0 ("dead" units).' : act === 'tanh' ? 'tanh = 2σ(2z) − 1: a rescaled sigmoid with outputs in (−1, 1).' : 'Changing the shift s (the bias) moves the threshold location.'}</p>`;
  }
  [kS, sS].forEach(x => x.addEventListener('input', render));
  document.querySelectorAll('#af-act .strat-btn').forEach(x => x.addEventListener('click', () => { act = x.dataset.a; render(); }));
  render();
}

/* ---------- logic gates with one threshold unit ---------- */
const GATES = {
  AND: { t: [0, 0, 0, 1], w: [1.5, 1, 1] }, OR: { t: [0, 1, 1, 1], w: [0.5, 1, 1] },
  NAND: { t: [1, 1, 1, 0], w: [-1.5, -1, -1] }, XOR: { t: [0, 1, 1, 0], w: [0.5, 1, 1] },
};
const PTS4 = [[0, 0], [0, 1], [1, 0], [1, 1]];
function initLogic() {
  const svg = document.getElementById('lg-plot'), out = document.getElementById('lg-out');
  const S = ['w0', 'w1', 'w2'].map(k => document.getElementById('lg-' + k));
  let gate = 'AND';
  const load = () => { GATES[gate].w.forEach((v, i) => { S[i].value = v; }); };
  function render() {
    const [W0, W1, W2] = S.map(s => +s.value);
    ['w0', 'w1', 'w2'].forEach((k, i) => { document.getElementById(`lg-${k}-val`).textContent = f1(+S[i].value); });
    document.querySelectorAll('#lg-gate .strat-btn').forEach(x => x.classList.toggle('active', x.dataset.g === gate));
    const T = GATES[gate].t, fire = (p) => (W1 * p[0] + W2 * p[1] - W0 > 0 ? 1 : 0);
    svg.innerHTML = '';
    const box = [45, 15, 280, 280], lo = [-0.25, -0.25], hi = [1.25, 1.25];
    shade(svg, (u, v) => fire([lo[0] + u * 1.5, lo[1] + v * 1.5]) * 0.55, box, 30, 'mono');
    const { X, Y, clip } = axesBox(svg, box, lo, hi, ['x₁', 'x₂'], [[0, 1], [0, 1]]);
    if (Math.abs(W2) > 1e-6) el('line', { x1: X(-0.25), y1: Y((W0 - W1 * -0.25) / W2), x2: X(1.25), y2: Y((W0 - W1 * 1.25) / W2), class: 'nn-boundary', 'clip-path': clip }, svg);
    else if (Math.abs(W1) > 1e-6) el('line', { x1: X(W0 / W1), y1: Y(-0.25), x2: X(W0 / W1), y2: Y(1.25), class: 'nn-boundary', 'clip-path': clip }, svg);
    svg.appendChild(svg.querySelector('rect.nn-frame'));
    let correct = 0;
    PTS4.forEach((p, i) => {
      const ok = fire(p) === T[i]; if (ok) correct++;
      el('circle', { cx: X(p[0]), cy: Y(p[1]), r: 11, class: 'lg-pt ' + (T[i] ? 't1' : 't0') + (ok ? '' : ' bad') }, svg);
      txt(svg, X(p[0]), Y(p[1]) + 4, T[i], 'lg-pt-t', 'middle');
    });
    out.innerHTML = `
      <div class="table-wrap"><table class="summary nn-table"><thead><tr><th>x₁</th><th>x₂</th><th>in</th><th>output</th><th>${gate}</th><th></th></tr></thead><tbody>
      ${PTS4.map((p, i) => { const z = W1 * p[0] + W2 * p[1] - W0; return `<tr><td>${p[0]}</td><td>${p[1]}</td><td>${sgn(z, 1)}</td><td>${fire(p)}</td><td>${T[i]}</td><td>${fire(p) === T[i] ? '✅' : '❌'}</td></tr>`; }).join('')}
      </tbody></table></div>
      <p class="note">in = W₁x₁ + W₂x₂ − W₀; the unit outputs 1 when in &gt; 0.</p>
      <p class="big">${correct} / 4 correct</p>
      <p class="note">${gate === 'XOR' ? (correct === 4 ? '?!' : 'The best any line can do is 3 / 4: the two 1s sit on opposite corners. One unit cannot compute XOR; two layers can (see below).') : correct === 4 ? `These weights implement ${gate}.` : 'Move the line so that the shaded side contains exactly the 1s.'}</p>`;
  }
  S.forEach(s => s.addEventListener('input', render));
  document.querySelectorAll('#lg-gate .strat-btn').forEach(x => x.addEventListener('click', () => { gate = x.dataset.g; load(); render(); }));
  render();
}

/* ---------- the XOR network ---------- */
function initXor() {
  const net = document.getElementById('xr-net'), space = document.getElementById('xr-space'), out = document.getElementById('xr-out');
  let x = [0, 1];
  const step = (z) => (z > 0 ? 1 : 0);
  const comp = (p) => { const z1 = p[0] + p[1] - 0.5, z2 = p[0] + p[1] - 1.5, h1 = step(z1), h2 = step(z2), zy = h1 - h2 - 0.5; return { z1, z2, h1, h2, zy, y: step(zy) }; };
  function render() {
    document.querySelectorAll('#xr-in .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.x === x.join(',')));
    const c = comp(x);
    net.innerHTML = '';
    const P = { x1: [70, 250], x2: [310, 250], h1: [110, 150], h2: [270, 150], y: [190, 45] };
    const edge = (a, b, w, on, t) => {
      el('line', { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], class: 'xr-e' + (on ? ' on' : '') + (w < 0 ? ' neg' : '') }, net);
      txt(net, P[a][0] + (P[b][0] - P[a][0]) * t, P[a][1] + (P[b][1] - P[a][1]) * t + 4, sgn(w, 0), 'xr-w', 'middle');
    };
    edge('x1', 'h1', 1, x[0], 0.45); edge('x2', 'h1', 1, x[1], 0.22); edge('x1', 'h2', 1, x[0], 0.22); edge('x2', 'h2', 1, x[1], 0.45);
    edge('h1', 'y', 1, c.h1, 0.5); edge('h2', 'y', -1, c.h2, 0.5);
    const node = (k, label, v, bias) => {
      el('circle', { cx: P[k][0], cy: P[k][1], r: 24, class: 'xr-n' + (v ? ' on' : '') }, net);
      txt(net, P[k][0], P[k][1] - 2, label, 'nd-t', 'middle'); txt(net, P[k][0], P[k][1] + 13, String(v), 'nd-v', 'middle');
      if (bias !== undefined) txt(net, P[k][0] + (k === 'h1' ? -34 : 34), P[k][1] - 16, 'b = ' + sgn(bias, 1), 'xr-w', k === 'h1' ? 'end' : 'start');
    };
    node('x1', 'x₁', x[0]); node('x2', 'x₂', x[1]); node('h1', 'h₁ OR', c.h1, -0.5); node('h2', 'h₂ AND', c.h2, -1.5); node('y', 'y', c.y, -0.5);
    txt(net, 190, 290, 'all units: step at 0', 'tick', 'middle');
    // hidden space
    space.innerHTML = '';
    const box = [45, 15, 230, 210], lo = [-0.3, -0.3], hi = [1.3, 1.3];
    const { X, Y, clip } = axesBox(space, box, lo, hi, ['h₁', 'h₂'], [[0, 1], [0, 1]]);
    el('line', { x1: X(0.2), y1: Y(-0.3), x2: X(1.3), y2: Y(0.8), class: 'nn-boundary', 'clip-path': clip }, space);
    txt(space, X(0.62), Y(-0.2), 'h₁ − h₂ = 0.5', 'tick', 'end');
    const groups = {};
    PTS4.forEach(p => { const q = comp(p); const k = q.h1 + ',' + q.h2; (groups[k] = groups[k] || []).push(p); });
    Object.entries(groups).forEach(([k, ps]) => {
      const [h1, h2] = k.split(',').map(Number), t = ps[0][0] ^ ps[0][1], cur = ps.some(p => p.join() === x.join());
      el('circle', { cx: X(h1), cy: Y(h2), r: cur ? 12 : 9, class: 'lg-pt ' + (t ? 't1' : 't0') + (cur ? ' cur' : '') }, space);
      txt(space, X(h1) + 14, Y(h2) - 10, ps.map(p => `(${p.join(',')})`).join(' '), 'xr-lab', h1 > 0.5 ? 'end' : 'start');
    });
    out.innerHTML = `
      <p>h₁ = step(x₁ + x₂ − 0.5) = step(${sgn(c.z1, 1)}) = <b>${c.h1}</b> · h₂ = step(x₁ + x₂ − 1.5) = step(${sgn(c.z2, 1)}) = <b>${c.h2}</b></p>
      <p class="big">y = step(h₁ − h₂ − 0.5) = step(${sgn(c.zy, 1)}) = <b>${c.y}</b> ${c.y === (x[0] ^ x[1]) ? '✅' : '❌'}</p>`;
  }
  document.querySelectorAll('#xr-in .strat-btn').forEach(b => b.addEventListener('click', () => { x = b.dataset.x.split(',').map(Number); render(); }));
  render();
}

/* ---------- universality: ridges, bumps, curve fitting ---------- */
function initUniversal() {
  const svg = document.getElementById('un-plot'), out = document.getElementById('un-out'), kS = document.getElementById('un-k'), nS = document.getElementById('un-n');
  let mode = 'ridge';
  const target = (x) => 0.5 + 0.28 * Math.sin(1.1 * x) + 0.14 * Math.sin(2.9 * x + 1);
  function render() {
    const k = +kS.value, N = +nS.value;
    document.getElementById('un-k-val').textContent = f1(k);
    document.getElementById('un-n-val').textContent = N;
    document.getElementById('un-n-wrap').style.display = mode === 'fit' ? '' : 'none';
    document.querySelectorAll('#un-mode .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.m === mode));
    svg.innerHTML = '';
    if (mode !== 'fit') {
      const ridge = (t) => sigm(k * (t + 1)) - sigm(k * (t - 1));
      const f = mode === 'ridge' ? (a) => ridge(a) : (a, b) => sigm(2 * k * (ridge(a) + ridge(b) - 1.5));
      const box = [45, 15, 300, 280];
      shade(svg, (u, v) => f(-4 + u * 8, -4 + v * 8), box, 40, 'mono');
      axesBox(svg, box, [-4, -4], [4, 4], ['x₁', 'x₂'], [[-4, 0, 4], [-4, 0, 4]]);
      const peak = mode === 'ridge' ? ridge(0) : f(0, 0), side = mode === 'ridge' ? ridge(3) : f(0, 3);
      out.innerHTML = mode === 'ridge'
        ? `<p class="big">ridge(x₁) = σ(k(x₁ + 1)) − σ(k(x₁ − 1))</p><p>Two <b>opposite-facing</b> soft thresholds: one switches on at x₁ = −1, the other subtracts it again at x₁ = +1. Height in the middle: <b>${f3(peak)}</b>, at x₁ = 3: ${f3(side)}.</p><p class="note">It does not depend on x₂ at all: a ridge along the x₂ axis. 2 hidden units.</p>`
        : `<p class="big">bump = σ(2k (ridge(x₁) + ridge(x₂) − 1.5))</p><p>Add a ridge in x₁ and a perpendicular ridge in x₂: the sum is ≈ 2 only where they cross, ≈ 1 along each ridge. One more threshold at 1.5 keeps only the crossing. Height at (0, 0): <b>${f3(peak)}</b>, on a ridge at (0, 3): ${f3(side)}.</p><p class="note">4 hidden units + 1 unit that combines them. Bumps of various sizes and locations can be added to fit any surface.</p>`;
    } else {
      const X = (x) => 40 + x / 10 * 330, Y = (y) => 300 - y * 270, w = 10 / N;
      const heights = Array.from({ length: N }, (_, i) => target((i + 0.5) * w)), kk = k / w;
      const bump = (x, i) => heights[i] * (sigm(kk * (x - i * w)) - sigm(kk * (x - (i + 1) * w)));
      const fhat = (x) => heights.reduce((s, _, i) => s + bump(x, i), 0);
      el('line', { x1: 40, y1: 300, x2: 370, y2: 300, class: 'axis' }, svg);
      el('line', { x1: 40, y1: 300, x2: 40, y2: 20, class: 'axis' }, svg);
      [0, 5, 10].forEach(v => txt(svg, X(v), 316, v, 'tick', 'middle'));
      [0, 0.5, 1].forEach(v => txt(svg, 34, Y(v) + 4, v, 'tick', 'end'));
      if (N <= 12) heights.forEach((_, i) => curve(svg, (x) => bump(x, i), 0, 10, X, Y, 'un-bump', 160));
      curve(svg, target, 0, 10, X, Y, 'un-target');
      curve(svg, fhat, 0, 10, X, Y, 'un-fit', 400);
      let mse = 0; for (let i = 0; i <= 400; i++) { const x = i / 40; mse += (fhat(x) - target(x)) ** 2; } mse /= 401;
      out.innerHTML = `<p class="bt-legend"><span class="k ln un-tk"></span> target &nbsp; <span class="k ln un-fk"></span> network &nbsp; <span class="k ln un-bk"></span> single bumps</p>
        <p class="big">${N} bumps = <b>${2 * N}</b> hidden units, mean squared error <b>${mse.toExponential(2)}</b></p>
        <p>f̂(x) = Σ<sub>i</sub> h<sub>i</sub> [σ(k′(x − l<sub>i</sub>)) − σ(k′(x − r<sub>i</sub>))], one bump per interval [l<sub>i</sub>, r<sub>i</sub>] of width ${f2(w)}, output unit linear.</p>
        <p class="note">More hidden units, closer fit: this is universality. For a function of D inputs the number of bumps grows exponentially with D, which is why this construction is not how networks are built in practice.</p>`;
    }
  }
  [kS, nS].forEach(s => s.addEventListener('input', render));
  document.querySelectorAll('#un-mode .strat-btn').forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; render(); }));
  render();
}

/* ---------- gradient descent in 1-D ---------- */
function initGD() {
  const svg = document.getElementById('gd-plot'), out = document.getElementById('gd-out'), lrS = document.getElementById('gd-lr');
  const J = (w) => (w - 2) ** 2 + 1, dJ = (w) => 2 * (w - 2);
  let path = [5.5];
  function render() {
    const lr = +lrS.value;
    document.getElementById('gd-lr-val').textContent = f2(lr);
    document.querySelectorAll('#gd-pre .strat-btn').forEach(b => b.classList.toggle('active', Math.abs(+b.dataset.lr - lr) < 1e-9));
    svg.innerHTML = '';
    const X = (w) => 40 + (w + 4) / 12 * 370, Y = (j) => 260 - j / 40 * 240;
    el('line', { x1: 40, y1: 260, x2: 410, y2: 260, class: 'axis' }, svg);
    el('line', { x1: X(0), y1: 260, x2: X(0), y2: 15, class: 'axis' }, svg);
    [-4, -2, 2, 4, 6, 8].forEach(v => txt(svg, X(v), 276, v, 'tick', 'middle'));
    [10, 20, 30].forEach(v => txt(svg, X(0) - 5, Y(v) + 4, v, 'tick', 'end'));
    txt(svg, 405, 254, 'w', 'tick', 'end'); txt(svg, X(0) + 6, 22, 'J(w)', 'tick');
    curve(svg, (w) => Math.min(J(w), 41), -4, 8, X, Y, 'gd-cost');
    el('line', { x1: X(2), y1: Y(1), x2: X(2), y2: 260, class: 'guide' }, svg);
    txt(svg, X(2), 290, 'minimum', 'tick', 'middle');
    const vis = path.filter(w => w > -4 && w < 8);
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i];
      if (a > -4 && a < 8 && b > -4 && b < 8) el('line', { x1: X(a), y1: Y(J(a)), x2: X(b), y2: Y(J(b)), class: 'gd-step' }, svg);
    }
    vis.forEach((w, i) => el('circle', { cx: X(w), cy: Y(J(w)), r: i === vis.length - 1 ? 7 : 4, class: 'gd-dot' }, svg));
    const w = path[path.length - 1], diverging = Math.abs(w - 2) > Math.abs(path[0] - 2) + 1e-9;
    // tangent at the current point
    if (w > -4 && w < 8) el('line', { x1: X(w - 1), y1: Y(J(w) - dJ(w)), x2: X(w + 1), y2: Y(J(w) + dJ(w)), class: 'gd-tan' }, svg);
    out.innerHTML = `
      <p>Step ${path.length - 1}: w = <b>${f3(w)}</b>, gradient J′(w) = 2(w − 2) = <b>${sgn(dJ(w), 3)}</b>, J(w) = ${f3(J(w))}</p>
      <p>Next: w ← w − α·J′(w) = ${f3(w)} − ${f2(lr)}·${par(dJ(w), 3)} = <b>${f3(w - lr * dJ(w))}</b></p>
      <p class="note">${diverging ? '⚠️ <b>Diverging</b>: every step overshoots the minimum by more than the last one.' : Math.abs(w - 2) < 0.01 ? '✅ At the minimum: the gradient is (almost) 0, so the steps stop.' : lr < 0.1 ? 'Too low: tiny steps, many updates needed.' : lr > 0.5 ? 'Large steps overshoot the minimum and zig-zag across it.' : 'Just right: a few big steps, then smaller ones as the slope flattens.'} Each step multiplies the distance to the minimum by |1 − 2α| = ${f2(Math.abs(1 - 2 * lr))}.</p>`;
  }
  const stepN = (n) => { const lr = +lrS.value; for (let i = 0; i < n; i++) { const w = path[path.length - 1]; path.push(w - lr * dJ(w)); } render(); };
  document.getElementById('gd-step').addEventListener('click', () => stepN(1));
  document.getElementById('gd-run').addEventListener('click', () => stepN(10));
  document.getElementById('gd-reset').addEventListener('click', () => { path = [5.5]; render(); });
  lrS.addEventListener('input', () => { path = [5.5]; render(); });
  document.querySelectorAll('#gd-pre .strat-btn').forEach(b => b.addEventListener('click', () => { lrS.value = b.dataset.lr; path = [5.5]; stepN(10); }));
  render();
}

/* ---------- perceptron learning (one sigmoid unit, squared error) ---------- */
function initPerceptron() {
  const svg = document.getElementById('pl-plot'), curveSvg = document.getElementById('pl-curve'), out = document.getElementById('pl-out'), lrS = document.getElementById('pl-lr');
  const playBtn = document.getElementById('pl-play');
  let gate = 'AND', W, hist, timer = null;
  const reset = () => { W = [0.2, -0.3, 0.4]; hist = [totalE()]; };           // [W0, W1, W2], input x0 = −1
  const out1 = (p, w = W) => sigm(-w[0] + w[1] * p[0] + w[2] * p[1]);
  function totalE() { const T = GATES[gate].t; return PTS4.reduce((s, p, i) => s + 0.5 * (T[i] - out1(p)) ** 2, 0); }
  function epoch() {
    const T = GATES[gate].t, a = +lrS.value;
    PTS4.forEach((p, i) => {
      const inp = -W[0] + W[1] * p[0] + W[2] * p[1], g = sigm(inp), err = T[i] - g, gp = g * (1 - g);
      [-1, p[0], p[1]].forEach((xj, j) => { W[j] += a * err * gp * xj; });
    });
    hist.push(totalE());
  }
  function render() {
    document.getElementById('pl-lr-val').textContent = f1(+lrS.value);
    document.querySelectorAll('#pl-data .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.g === gate));
    const T = GATES[gate].t;
    svg.innerHTML = '';
    const box = [45, 15, 280, 280], lo = [-0.25, -0.25], hi = [1.25, 1.25];
    shade(svg, (u, v) => out1([lo[0] + u * 1.5, lo[1] + v * 1.5]), box, 30, 'prob');
    const { X, Y, clip } = axesBox(svg, box, lo, hi, ['x₁', 'x₂'], [[0, 1], [0, 1]]);
    if (Math.abs(W[2]) > 1e-6) el('line', { x1: X(-0.25), y1: Y((W[0] - W[1] * -0.25) / W[2]), x2: X(1.25), y2: Y((W[0] - W[1] * 1.25) / W[2]), class: 'nn-boundary', 'clip-path': clip }, svg);
    svg.appendChild(svg.querySelector('rect.nn-frame'));
    let correct = 0;
    PTS4.forEach((p, i) => { const ok = (out1(p) > 0.5 ? 1 : 0) === T[i]; if (ok) correct++; el('circle', { cx: X(p[0]), cy: Y(p[1]), r: 11, class: 'lg-pt ' + (T[i] ? 't1' : 't0') + (ok ? '' : ' bad') }, svg); txt(svg, X(p[0]), Y(p[1]) + 4, T[i], 'lg-pt-t', 'middle'); });
    // error curve
    curveSvg.innerHTML = '';
    const n = hist.length, mx = Math.max(...hist, 0.6), CX = (i) => 40 + i / Math.max(1, n - 1) * 330, CY = (e) => 140 - e / mx * 125;
    el('line', { x1: 40, y1: 140, x2: 370, y2: 140, class: 'axis' }, curveSvg);
    el('line', { x1: 40, y1: 140, x2: 40, y2: 12, class: 'axis' }, curveSvg);
    txt(curveSvg, 34, CY(mx) + 4, f2(mx), 'tick', 'end'); txt(curveSvg, 34, 144, '0', 'tick', 'end');
    txt(curveSvg, 205, 158, `epoch (0 … ${n - 1})`, 'tick', 'middle');
    const step = Math.max(1, Math.floor(n / 300));
    el('path', { d: hist.filter((_, i) => i % step === 0 || i === n - 1).map((e, i, arr) => `${i ? 'L' : 'M'}${CX(hist.indexOf(e) >= 0 ? (i === arr.length - 1 ? n - 1 : i * step) : 0).toFixed(1)},${CY(e).toFixed(1)}`).join(''), class: 'pl-line' }, curveSvg);
    out.innerHTML = `
      <p>Epoch <b>${n - 1}</b> · total error E = Σ ½ Err² = <b>${f4(hist[n - 1])}</b> · ${correct} / 4 correct (output &gt; 0.5)</p>
      <p>W₀ = ${sgn(W[0])}, W₁ = ${sgn(W[1])}, W₂ = ${sgn(W[2])}</p>
      <p>Outputs: ${PTS4.map((p, i) => `(${p.join(',')}) → ${f2(out1(p))} <span class="${(out1(p) > 0.5 ? 1 : 0) === T[i] ? 'ok' : 'bad'}">[${T[i]}]</span>`).join(' · ')}</p>
      <p class="note">${gate === 'XOR' ? (n > 50 ? 'Stuck: the best a single unit can do is put the line so that the outputs hover around 0.5, never getting all four right.' : 'Train for a while and watch the error stop decreasing.') : n > 50 && correct === 4 ? 'Linearly separable: the rule converges, and with more epochs the outputs approach 0 and 1.' : 'Press ▶ to train.'}</p>`;
  }
  const stop = () => { clearInterval(timer); timer = null; playBtn.textContent = '▶'; };
  playBtn.addEventListener('click', () => {
    if (timer) { stop(); return; }
    playBtn.textContent = '⏸';
    timer = setInterval(() => { for (let i = 0; i < 5; i++) epoch(); render(); if (hist.length > 1500) stop(); }, 40);
  });
  document.getElementById('pl-step').addEventListener('click', () => { stop(); epoch(); render(); });
  document.getElementById('pl-reset').addEventListener('click', () => { stop(); reset(); render(); });
  lrS.addEventListener('input', render);
  document.querySelectorAll('#pl-data .strat-btn').forEach(b => b.addEventListener('click', () => { stop(); gate = b.dataset.g; reset(); render(); }));
  reset(); render();
}

/* ---------- back-propagation by hand ---------- */
function initBackprop() {
  const svg = document.getElementById('bp-net'), out = document.getElementById('bp-out'), stepLbl = document.getElementById('bp-step');
  const STEPS = ['Initial weights', 'Forward: hidden layer', 'Forward: output', 'Error', 'Output delta', 'Hidden deltas', 'Weight updates'];
  let W = { ...BP_W0 }, step = 0, iter = 1, Ehist = [];
  function render() {
    const c = bpCompute(W);
    if (!Ehist.length) Ehist.push(c.E);
    stepLbl.textContent = `Update ${iter} · step ${step + 1} / ${STEPS.length}: ${STEPS[step]}`;
    svg.innerHTML = '';
    const P = { 1: [55, 80], 2: [55, 220], 3: [200, 80], 4: [200, 220], 5: [340, 150] };
    const fwdOn = { 1: ['13', '23', '14', '24'], 2: ['35', '45'] }[step] || [];
    const bwdOn = { 4: [], 5: ['35', '45'], 6: ['13', '23', '14', '24', '35', '45'] }[step] || [];
    const upd = step === 6;
    [['13', 1, 3], ['23', 2, 3], ['14', 1, 4], ['24', 2, 4], ['35', 3, 5], ['45', 4, 5]].forEach(([k, a, b]) => {
      const cls = 'bp-e' + (fwdOn.includes(k) ? ' fwd' : '') + (bwdOn.includes(k) ? ' bwd' : '');
      el('line', { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], class: cls }, svg);
      const t = k === '23' || k === '14' ? 0.33 : 0.5;
      const mx = P[a][0] + (P[b][0] - P[a][0]) * t, my = P[a][1] + (P[b][1] - P[a][1]) * t;
      txt(svg, mx, my - 6, upd ? `${sgn(W[k])}→${sgn(c.next[k], 3)}` : `W${k[0]},${k[1]} = ${sgn(W[k], 2)}`, 'bp-w' + (upd ? ' upd' : ''), 'middle');
    });
    const shown = { 1: step >= 1, 2: step >= 1, 3: step >= 1, 4: step >= 1, 5: step >= 2 };
    const val = { 1: c.a1, 2: c.a2, 3: c.a3, 4: c.a4, 5: c.a5 }, del = { 3: step >= 5 ? c.d3 : null, 4: step >= 5 ? c.d4 : null, 5: step >= 4 ? c.d5 : null };
    const bias = { 3: 'b3', 4: 'b4', 5: 'b5' };
    [1, 2, 3, 4, 5].forEach(n => {
      const [x, y] = P[n], inp = n <= 2;
      if (inp) el('rect', { x: x - 24, y: y - 24, width: 48, height: 48, rx: 8, class: 'bp-n in' }, svg);
      else el('circle', { cx: x, cy: y, r: 27, class: 'bp-n' + (step === 5 && n < 5 ? ' cur' : step === 4 && n === 5 ? ' cur' : '') }, svg);
      txt(svg, x, y - 6, String(n), 'nd-t', 'middle');
      txt(svg, x, y + 10, n <= 2 ? `a${n} = ${val[n]}` : shown[n] ? `a = ${f3(val[n])}` : 'a = ?', 'nd-v', 'middle');
      if (del[n] !== null && del[n] !== undefined) txt(svg, x, y + 44, `Δ${n} = ${sgn(del[n], 4)}`, 'bp-d', 'middle');
      if (bias[n]) txt(svg, x, y - 34, upd ? `b: ${sgn(W[bias[n]])}→${sgn(c.next[bias[n]], 3)}` : `b = ${sgn(W[bias[n]], 1)}`, 'bp-w' + (upd ? ' upd' : ''), 'middle');
    });
    if (step >= 3) txt(svg, 340, 240, `y = ${BP_Y}, E = ${f4(c.E)}`, 'bp-d', 'middle');
    const [a1, a2] = BP_X;
    const body = [
      `<p>Input x = (${a1}, ${a2}), target y = ${BP_Y}, learning rate α = ${BP_ALPHA}. Hidden and output units: sigmoid, g′(in) = g(in)(1 − g(in)).</p>`,
      `<p>in₃ = W₁,₃a₁ + W₂,₃a₂ + b₃ = ${sgn(W['13'])}·${a1} + ${par(W['23'])}·${a2} + ${par(W.b3)} = <b>${f4(c.in3)}</b> → a₃ = σ(${f4(c.in3)}) = <b>${f4(c.a3)}</b></p>
       <p>in₄ = W₁,₄a₁ + W₂,₄a₂ + b₄ = ${sgn(W['14'])}·${a1} + ${par(W['24'])}·${a2} + ${par(W.b4)} = <b>${f4(c.in4)}</b> → a₄ = σ(${f4(c.in4)}) = <b>${f4(c.a4)}</b></p>`,
      `<p>in₅ = W₃,₅a₃ + W₄,₅a₄ + b₅ = ${sgn(W['35'])}·${f4(c.a3)} + ${par(W['45'])}·${f4(c.a4)} + ${par(W.b5)} = <b>${f4(c.in5)}</b></p><p>a₅ = σ(${f4(c.in5)}) = <b>${f4(c.a5)}</b>: the network's prediction.</p>`,
      `<p>Err = y − a₅ = ${BP_Y} − ${f4(c.a5)} = <b>${f4(c.err)}</b></p><p>E = ½ Err² = <b>${f(c.E)}</b></p>`,
      `<p>Δ₅ = Err × g′(in₅) = ${f4(c.err)} × ${f4(c.a5)}(1 − ${f4(c.a5)}) = <b>${f(c.d5)}</b></p><p class="note">Positive: the output should go up.</p>`,
      `<p>Δ₃ = g′(in₃) · W₃,₅ · Δ₅ = ${f4(c.a3)}(1 − ${f4(c.a3)}) · ${sgn(W['35'])} · ${f(c.d5)} = <b>${f(c.d3)}</b></p>
       <p>Δ₄ = g′(in₄) · W₄,₅ · Δ₅ = ${f4(c.a4)}(1 − ${f4(c.a4)}) · ${par(W['45'])} · ${f(c.d5)} = <b>${f(c.d4)}</b></p>
       <p class="note">Unit 4 feeds the output with a <b>negative</b> weight, so to raise the output it must go <b>down</b>: its delta is negative.</p>`,
      `<p>W₃,₅ ← ${sgn(W['35'])} + ${BP_ALPHA}·${f4(c.a3)}·${f(c.d5)} = <b>${f4(c.next['35'])}</b> · W₄,₅ ← <b>${f4(c.next['45'])}</b> · b₅ ← <b>${f4(c.next.b5)}</b></p>
       <p>W₁,₃ ← ${sgn(W['13'])} + ${BP_ALPHA}·${a1}·${f(c.d3)} = <b>${f4(c.next['13'])}</b> · W₂,₃ ← <b>${f4(c.next['23'])}</b> · b₃ ← <b>${f4(c.next.b3)}</b></p>
       <p>W₁,₄ ← <b>${f4(c.next['14'])}</b> · W₂,₄ ← <b>${f4(c.next['24'])}</b> · b₄ ← <b>${f4(c.next.b4)}</b></p>
       <p class="big">With the new weights: a₅ = <b>${f4(bpCompute(c.next).a5)}</b>, E = <b>${f(bpCompute(c.next).E)}</b> (was ${f(c.E)})</p>`,
    ];
    out.innerHTML = `<h5 class="bp-h">${STEPS[step]}</h5>${body[step]}${Ehist.length > 1 ? `<p class="note">Error after each update: ${Ehist.map(e => f(e)).join(' → ')}</p>` : ''}`;
    document.getElementById('bp-again').disabled = step !== 6;
  }
  const f = (v) => sgn(v, 5);
  document.getElementById('bp-next').addEventListener('click', () => { step = Math.min(STEPS.length - 1, step + 1); render(); });
  document.getElementById('bp-prev').addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
  document.getElementById('bp-reset').addEventListener('click', () => { W = { ...BP_W0 }; step = 0; iter = 1; Ehist = []; render(); });
  document.getElementById('bp-again').addEventListener('click', () => { W = bpCompute(W).next; iter++; Ehist.push(bpCompute(W).E); step = 3; render(); });
  render();
}

/* ---------- MLP playground ---------- */
function initPlayground() {
  const plot = document.getElementById('mp-plot'), curveSvg = document.getElementById('mp-curve'), netSvg = document.getElementById('mp-net'), stats = document.getElementById('mp-stats');
  const lrS = document.getElementById('mp-lr'), playBtn = document.getElementById('mp-play'), msg = document.getElementById('mp-msg');
  let data = 'golf', arch = [3, 2], net, hist, epoch, seed = 47, timer = null;
  const D = () => MP_DATA[data];
  function reset() { net = makeNet([2, ...arch, 1], rng(seed)); hist = []; epoch = 0; }
  const XY = () => { const d = D(); return [d.P.map(p => normIn(d, p)), d.P.map(p => p[2])]; };
  function train(n) { const [X, Y] = XY(); for (let i = 0; i < n; i++) { hist.push(trainEpoch(net, X, Y, +lrS.value, 'relu')); epoch++; } }
  function render() {
    document.getElementById('mp-lr-val').textContent = f2(+lrS.value);
    document.querySelectorAll('#mp-data .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.d === data));
    document.querySelectorAll('#mp-arch .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.a === arch.join(',')));
    const d = D(), [X, Y] = XY();
    const pred = (x) => netForward(net, x, 'relu').as.slice(-1)[0][0];
    plot.innerHTML = '';
    const box = [45, 15, 320, 320];
    shade(plot, (u, v) => pred([u * 2 - 1, v * 2 - 1]), box, 40, 'prob');
    const ticks = [[d.lo[0], d.hi[0]], [d.lo[1], d.hi[1]]];
    const { X: PXf, Y: PYf } = axesBox(plot, box, d.lo, d.hi, d.names, data === 'golf' ? [[0, 1, 2, 3], [0, 1, 2, 3]] : ticks);
    d.P.forEach(p => el('circle', { cx: PXf(p[0]), cy: PYf(p[1]), r: data === 'golf' ? 9 : 5, class: 'mp-pt c' + p[2] }, plot));
    const loss = hist.length ? hist[hist.length - 1] : null;
    const acc = X.filter((x, i) => (pred(x) > 0.5 ? 1 : 0) === Y[i]).length / X.length;
    const nW = [2, ...arch, 1].slice(1).reduce((s, n, l) => s + n * [2, ...arch, 1][l], 0), nB = arch.reduce((a, b) => a + b, 0) + 1;
    stats.innerHTML = `<div class="stat"><span class="n">${epoch}</span><span class="l">epoch</span></div><div class="stat"><span class="n">${loss === null ? '—' : f3(loss)}</span><span class="l">loss</span></div><div class="stat"><span class="n">${(acc * 100).toFixed(0)}%</span><span class="l">accuracy</span></div><div class="stat"><span class="n">${nW}+${nB}</span><span class="l">w + b</span></div>`;
    // loss curve
    curveSvg.innerHTML = '';
    el('line', { x1: 40, y1: 135, x2: 370, y2: 135, class: 'axis' }, curveSvg);
    el('line', { x1: 40, y1: 135, x2: 40, y2: 10, class: 'axis' }, curveSvg);
    if (hist.length > 1) {
      const mx = Math.max(...hist), n = hist.length, stp = Math.max(1, Math.floor(n / 250));
      const pts = []; for (let i = 0; i < n; i += stp) pts.push([i, hist[i]]); pts.push([n - 1, hist[n - 1]]);
      el('path', { d: pts.map(([i, v], k) => `${k ? 'L' : 'M'}${(40 + i / (n - 1) * 330).toFixed(1)},${(135 - v / mx * 120).toFixed(1)}`).join(''), class: 'mp-loss' }, curveSvg);
      txt(curveSvg, 34, 19, f2(mx), 'tick', 'end');
    }
    txt(curveSvg, 34, 139, '0', 'tick', 'end'); txt(curveSvg, 205, 153, 'epoch', 'tick', 'middle');
    // network weights
    netSvg.innerHTML = '';
    const sizes = [2, ...arch, 1], LX = (l) => 40 + l * (300 / (sizes.length - 1)), NY = (n, i) => 100 + (i - (n - 1) / 2) * Math.min(22, 170 / n);
    const mxW = Math.max(...net.flatMap(L => L.W.flat().map(Math.abs)), 0.5);
    net.forEach((L, l) => L.W.forEach((row, i) => row.forEach((w, j) => el('line', { x1: LX(l), y1: NY(sizes[l], j), x2: LX(l + 1), y2: NY(sizes[l + 1], i), class: 'mp-w ' + (w >= 0 ? 'pos' : 'neg'), 'stroke-width': (0.5 + 4 * Math.abs(w) / mxW).toFixed(2) }, netSvg))));
    sizes.forEach((n, l) => { for (let i = 0; i < n; i++) el('circle', { cx: LX(l), cy: NY(n, i), r: 7, class: 'mp-n' }, netSvg); });
    txt(netSvg, LX(0), 192, 'input', 'tick', 'middle'); txt(netSvg, LX(sizes.length - 1), 192, 'output', 'tick', 'middle');
    const dead = arch.length && net[net.length - 1].W[0].length && X.every(x => { const hs = netForward(net, x, 'relu').as; return hs[hs.length - 2].every(v => v === 0); });
    msg.innerHTML = epoch < 200 ? 'Press ▶ to train.' : !arch.length && acc < 1 ? 'With no hidden layer the network is a single sigmoid unit (logistic regression): one straight boundary, which cannot separate these classes.' : dead || (loss > 0.68 && acc < 1) ? '⚠️ Stuck: the loss is stuck at ln 2 ≈ 0.693, i.e. the output is 0.5 everywhere. The ReLU units of a layer output 0 for every example ("dead" units), so no gradient flows back. Press ↺ for new random weights.' : acc === 1 ? '✅ Every training point is classified correctly.' : 'Still learning, or stuck in a local minimum: keep training, or press ↺ for new random weights.';
  }
  const stop = () => { clearInterval(timer); timer = null; playBtn.textContent = '▶'; };
  playBtn.addEventListener('click', () => {
    if (timer) { stop(); return; }
    playBtn.textContent = '⏸';
    timer = setInterval(() => { train(data === 'golf' || data === 'xor' ? 20 : 8); render(); if (epoch >= 6000) stop(); }, 30);
  });
  document.getElementById('mp-step').addEventListener('click', () => { stop(); train(10); render(); });
  document.getElementById('mp-reset').addEventListener('click', () => { stop(); seed++; reset(); render(); });
  lrS.addEventListener('input', () => { document.getElementById('mp-lr-val').textContent = f2(+lrS.value); });
  document.querySelectorAll('#mp-data .strat-btn').forEach(b => b.addEventListener('click', () => { stop(); data = b.dataset.d; reset(); render(); }));
  document.querySelectorAll('#mp-arch .strat-btn').forEach(b => b.addEventListener('click', () => { stop(); arch = b.dataset.a ? b.dataset.a.split(',').map(Number) : []; reset(); render(); }));
  reset(); render();
}

/* ---------- handwritten digits ---------- */
function initDigits() {
  const cv = document.getElementById('dg-canvas'), ctx = cv.getContext('2d'), small = document.getElementById('dg-8'), sctx = small.getContext('2d');
  const unitsBox = document.getElementById('dg-units'), probsBox = document.getElementById('dg-probs'), msg = document.getElementById('dg-msg');
  const NET = DIGIT_NET, G = 32, cell = cv.width / G;
  document.getElementById('dg-acc').textContent = (NET.acc * 100).toFixed(0) + '%';
  let grid = new Array(G * G).fill(0), sample = null, sampleIdx = 0, drawing = false, last = null;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#000';
  // hidden-unit weight images
  const maxW = Math.max(...NET.W1.flat().map(Math.abs));
  unitsBox.innerHTML = '';
  const unitEls = NET.b1.map((_, j) => {
    const wrap = document.createElement('div'); wrap.className = 'dg-unit';
    const c = document.createElement('canvas'); c.width = 8; c.height = 8; const cx = c.getContext('2d');
    for (let p = 0; p < 64; p++) {
      const w = NET.W1[p][j] / maxW, a = Math.min(1, Math.abs(w) * 1.6);
      cx.fillStyle = w >= 0 ? `rgba(77,126,168,${a})` : `rgba(217,84,110,${a})`;
      cx.fillRect(p % 8, Math.floor(p / 8), 1, 1);
    }
    const bar = document.createElement('div'); bar.className = 'dg-act'; bar.innerHTML = '<i></i>';
    wrap.append(c, bar); unitsBox.appendChild(wrap);
    return bar.firstChild;
  });
  function toInputs() {
    if (sample) return sample.slice();
    const on = []; grid.forEach((v, i) => { if (v) on.push([i % G, Math.floor(i / G)]); });
    if (!on.length) return new Array(64).fill(0);
    // size-normalise: fit the bounding box into the 32 × 32 frame, keep the aspect ratio, centre it
    const xs = on.map(p => p[0]), ys = on.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = (G - 2) / Math.max(x1 - x0 + 1, y1 - y0 + 1), ox = (G - (x1 - x0 + 1) * s) / 2, oy = (G - (y1 - y0 + 1) * s) / 2;
    const norm = new Array(G * G).fill(0);
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
      const sx = Math.floor((x - ox) / s) + x0, sy = Math.floor((y - oy) / s) + y0;
      if (sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1 && grid[sy * G + sx]) norm[y * G + x] = 1;
    }
    // count ink pixels in each 4 × 4 block → 0..16, like the UCI optdigits preprocessing
    const out = new Array(64).fill(0);
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) if (norm[y * G + x]) out[Math.floor(y / 4) * 8 + Math.floor(x / 4)]++;
    return out;
  }
  function classify(x) {
    const h = NET.b1.map((b, j) => sigm(x.reduce((s, v, p) => s + (v / 16) * NET.W1[p][j], b)));
    const z = NET.b2.map((b, k) => h.reduce((s, v, j) => s + v * NET.W2[j][k], b)), m = Math.max(...z), e = z.map(v => Math.exp(v - m)), S = e.reduce((a, b) => a + b, 0);
    return { h, p: e.map(v => v / S) };
  }
  function render() {
    const ink = css('--ink'), bg = css('--surface');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
    const x = toInputs();
    if (sample) { for (let p = 0; p < 64; p++) { ctx.fillStyle = `rgba(20,23,27,${x[p] / 16})`; if (ink.startsWith('#f')) ctx.fillStyle = `rgba(243,240,250,${x[p] / 16})`; ctx.fillRect((p % 8) * 32, Math.floor(p / 8) * 32, 32, 32); } }
    else { ctx.fillStyle = ink; grid.forEach((v, i) => { if (v) ctx.fillRect((i % G) * cell, Math.floor(i / G) * cell, cell, cell); }); }
    sctx.fillStyle = bg; sctx.fillRect(0, 0, 80, 80);
    for (let p = 0; p < 64; p++) { sctx.fillStyle = ink.startsWith('#f') ? `rgba(243,240,250,${x[p] / 16})` : `rgba(20,23,27,${x[p] / 16})`; sctx.fillRect((p % 8) * 10, Math.floor(p / 8) * 10, 10, 10); }
    const empty = x.every(v => v === 0);
    const { h, p } = classify(x), best = p.indexOf(Math.max(...p));
    h.forEach((v, j) => { unitEls[j].style.width = (v * 100).toFixed(0) + '%'; });
    probsBox.innerHTML = p.map((v, k) => `<div class="dg-row${!empty && k === best ? ' best' : ''}"><span>${k}</span><div class="dg-bar"><i style="width:${(v * 100).toFixed(1)}%"></i></div><b>${(v * 100).toFixed(1)}%</b></div>`).join('');
    msg.innerHTML = empty ? 'Draw a digit with the mouse or your finger.' : sample ? `Test digit: ${sample.y === 8 ? 'an' : 'a'} <b>${sample.y}</b>. The network says <b>${best}</b> (${(p[best] * 100).toFixed(1)}%).` : `The network says <b>${best}</b> (${(p[best] * 100).toFixed(1)}%). Real handwriting is messier than this dataset: if it guesses wrong, try writing larger and centred.`;
  }
  const cellAt = (e) => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * G), Math.floor((e.clientY - r.top) / r.height * G)]; };
  const paint = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < G && Y < G && Math.abs(dx) + Math.abs(dy) < 2) grid[Y * G + X] = 1; } };
  const line = (a, b) => { const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1); for (let i = 0; i <= n; i++) paint(Math.round(a[0] + (b[0] - a[0]) * i / n), Math.round(a[1] + (b[1] - a[1]) * i / n)); };
  cv.addEventListener('pointerdown', (e) => { if (sample) { sample = null; grid.fill(0); } drawing = true; try { cv.setPointerCapture(e.pointerId); } catch (_) { /* synthetic event */ } last = cellAt(e); paint(...last); render(); });
  cv.addEventListener('pointermove', (e) => { if (!drawing) return; const c = cellAt(e); line(last, c); last = c; render(); });
  cv.addEventListener('pointerup', () => { drawing = false; });
  document.getElementById('dg-clear').addEventListener('click', () => { sample = null; grid.fill(0); render(); });
  document.getElementById('dg-sample').addEventListener('click', () => { const ex = NET.ex[sampleIdx % NET.ex.length]; sampleIdx += 3; sample = ex.x.slice(); sample.y = ex.y; sample.p = ex.p; render(); });
  render();
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initMath();
  initHero();
  initNeuron();
  initActivation();
  initLogic();
  initXor();
  initUniversal();
  initGD();
  initPerceptron();
  initBackprop();
  initPlayground();
  initDigits();
});

/* ---------- trained digit network (scikit-learn MLPClassifier, 64–16–10, logistic hidden units; exported weights) ---------- */
const DIGIT_NET = {"W1":[[-0.0,0.0,-0.0,-0.0,0.0,0.0,0.0,-0.0,-0.0,-0.0,-0.0,-0.0,-0.0,-0.0,0.0,0.0],[-1.5813,0.2457,0.019,0.1526,-1.8278,-0.011,-2.5987,-0.0905,1.8554,-0.7376,1.9148,1.3469,0.7254,0.6674,-0.7955,-1.491],[0.1319,0.5717,0.1329,-1.0868,0.1216,0.4629,-1.0386,0.7991,1.0995,-0.4998,0.0428,0.8096,0.9868,1.0252,-1.1946,0.7184],[-1.4232,-0.5394,-0.1566,0.2317,-0.1164,-0.4463,-1.7816,-0.8135,0.1825,0.2809,0.2639,0.6249,-0.9543,-0.2076,-0.2614,0.2894],[-1.2358,-1.6,1.1301,-0.288,-1.0979,0.3333,-1.532,0.2442,0.0356,0.5033,0.5657,1.1078,-0.0558,0.132,-0.2849,-0.3907],[0.0769,0.3528,-0.9607,-0.2769,0.3406,1.7006,-0.1549,0.8448,1.4259,-2.0834,1.0967,1.1329,0.783,0.4356,-1.6305,-0.8816],[-2.3743,-0.0595,-0.9005,-0.3737,-0.6627,2.1722,-1.3448,-1.5798,2.2714,-1.4261,0.4488,2.2436,1.3474,2.1072,-1.5504,0.6138],[0.5996,0.1714,-0.3797,-0.5339,-0.5128,0.123,-0.4007,-0.5504,-0.633,1.5988,0.3831,-1.0016,-0.0836,0.6184,0.7308,0.141],[0.715,-0.1001,0.3413,-0.0947,0.0092,0.3204,1.1344,0.0834,-0.9918,0.4352,0.1865,-0.0826,0.0152,-0.0273,-0.0046,-0.0354],[-1.7565,-0.3538,0.3955,-0.791,-0.6194,-1.0498,-1.1781,0.5421,0.1006,0.7436,0.5323,1.8649,-1.4993,0.2638,-0.8146,0.1956],[-0.6395,-0.732,0.869,-1.009,-0.8577,0.1045,-0.8879,1.1718,0.1833,1.1607,0.0356,1.0801,0.1685,0.2321,-1.049,1.0815],[-0.9024,-0.4901,0.043,-0.5261,-0.9424,-0.2317,-1.1485,-0.2071,0.9707,0.3056,0.3832,0.9957,0.7541,0.1564,0.371,0.4603],[-1.6722,1.1392,-1.2772,-0.677,-0.0963,-0.2219,-1.695,0.1378,-0.2816,-1.3194,0.6382,2.2671,-0.597,0.1653,-0.2691,-1.0767],[0.2737,-0.7214,0.2732,0.9203,0.063,0.0381,0.3517,0.3435,-1.6442,0.4264,0.3118,0.8397,-0.4011,-1.1911,-0.8295,-0.6191],[-1.537,-1.1946,0.7546,1.8632,-0.7849,1.0095,0.2739,0.7897,0.1119,1.5163,1.1612,1.1315,-0.198,-0.5872,-0.1841,0.4968],[-0.5503,0.0226,-0.5307,-0.4213,-0.3155,0.2532,-0.5138,-0.2111,-0.1669,1.381,1.376,-0.4626,-0.3933,0.98,0.1329,0.17],[0.2579,-0.0257,0.0898,-0.0175,0.0212,0.122,0.5155,0.0049,-0.4921,0.1778,0.0275,-0.0264,-0.0047,-0.0174,-0.0009,-0.0115],[0.1134,-0.2228,1.1675,-0.1404,0.6258,0.9624,0.9486,1.2042,-0.7902,-0.2775,-1.4488,0.721,-0.2858,-0.1685,-1.088,-0.3397],[0.8625,-0.6531,0.2248,-1.4696,1.4127,-0.5171,1.5576,-0.5202,-0.6457,-0.1188,-1.5326,-0.7125,1.2136,0.6553,-0.2285,1.6627],[1.2989,0.9014,-0.7851,0.3424,1.4934,1.0209,1.8573,-1.5575,-0.9207,-1.4874,-2.5517,-0.627,0.1906,-0.1526,0.3839,-0.1252],[-0.3501,1.4007,-1.0813,1.2877,0.9024,1.2452,0.5019,-0.2264,-1.2281,-0.6294,-0.5759,0.3641,-2.3828,-1.3713,-1.6516,-1.7469],[-1.2157,-0.5801,1.2574,1.3135,1.2293,0.3168,0.2742,-1.2597,-2.5867,2.1157,-1.3917,1.7521,-1.702,-0.3941,-0.6801,0.9293],[-0.6472,0.701,-0.8843,0.5112,0.8319,-0.2057,1.3457,0.1009,-2.2347,1.6575,0.9199,0.2375,-2.7998,-1.4624,1.0717,0.1603],[1.133,0.5443,0.4931,-0.5306,-0.7548,-0.0088,0.33,-0.0392,-0.1074,0.1209,-0.6013,-1.2683,-0.0594,0.1285,0.364,0.259],[-0.0,0.0,-0.0,0.0,-0.0,-0.0,-0.0,-0.0,-0.0,0.0,0.0,-0.0,-0.0,-0.0,0.0,-0.0],[0.9134,-0.594,1.7941,-1.3065,-0.1339,0.1026,-0.2852,-1.2472,-0.09,-0.2368,-2.2237,-1.0805,0.4024,0.3054,1.3441,0.3935],[1.138,0.2166,0.976,-0.7864,0.4875,1.1144,0.7584,-1.8827,-0.9772,-0.5778,-2.1057,-1.0496,1.0323,1.3646,0.4161,0.9153],[1.6528,-1.8472,1.6562,1.427,1.0415,1.996,1.9335,-0.1975,-0.9378,0.1996,-1.0171,-1.5671,-0.6524,0.3021,-1.439,0.4069],[-0.2151,-0.0554,0.4628,1.2751,0.5463,1.7853,-0.3845,0.228,0.8876,-0.6076,-0.2743,-0.9235,-1.0811,1.5796,-1.739,-0.6397],[-0.7723,1.1409,-0.6521,0.2597,1.7805,-0.3353,0.1999,-0.9582,-1.5787,0.1957,-0.5708,1.2062,-0.6607,1.4094,-0.1385,1.1814],[-0.7613,2.5602,-0.5893,-1.1939,-0.4361,-0.8593,-0.3698,-1.575,-2.5041,1.8217,-1.3782,-0.3799,-1.196,1.5639,2.0931,0.7192],[0.4629,0.0407,0.1282,-0.0069,-0.0808,-0.0021,0.0364,-0.0,0.0,-0.0006,-0.3102,-0.3994,0.0014,-0.0001,0.0481,0.005],[-0.0,0.0,0.0,0.0,0.0,-0.0,0.0,-0.0,-0.0,-0.0,0.0,-0.0,0.0,0.0,0.0,-0.0],[0.0828,1.0352,-0.1797,-2.6498,-1.1884,-1.535,-0.7209,-1.7321,0.2287,-0.1248,-0.3947,-0.8162,1.3243,-0.0599,1.2621,-0.6635],[0.6067,0.0938,0.0472,-0.6481,-0.3046,0.1779,0.7147,-1.7039,-0.4422,-0.4852,-0.2045,-1.1452,0.3822,0.575,1.0722,-0.8273],[0.4289,-0.9282,-0.1675,0.8127,0.6935,1.507,1.0023,0.7234,-0.6165,0.5859,1.4784,-0.2064,-1.5161,0.0605,-1.2505,0.3479],[0.6124,1.7714,-0.9161,-0.2427,-1.5843,1.1827,0.6185,0.7854,0.3625,0.9583,1.5171,-1.6136,-1.0188,0.0406,-0.1139,-1.0067],[0.2621,1.116,0.0379,0.4912,-1.4622,0.4497,0.1615,-1.1142,-0.2305,0.1988,-0.4423,-0.043,0.9886,1.0996,1.5248,-1.2215],[-1.4079,1.0401,0.7073,-0.036,-1.7173,-0.3872,-2.5839,-1.8374,0.0206,0.1893,-1.5131,0.4192,1.6539,1.9808,1.9521,-1.2938],[-0.0,0.0,0.0,0.0,-0.0,-0.0,-0.0,0.0,-0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],[0.0013,0.0281,0.0347,-0.0004,-0.0208,0.0574,0.0017,0.0036,-0.177,0.0154,-0.0645,-0.0091,-0.0425,0.3813,-0.0,-0.0788],[0.2797,1.5045,2.4555,-1.9297,-1.3162,-0.7153,1.1844,0.3608,-1.5609,1.9069,-2.0858,-1.7618,-0.5643,0.5218,1.7891,-1.1974],[0.9511,-0.9442,-0.5361,-1.6342,-0.2336,-2.2246,1.5177,-0.1825,-0.9037,0.7481,1.4322,-0.0364,1.4288,-1.5559,1.6127,0.2923],[1.9115,2.0163,-2.0856,-2.4495,0.4575,-1.5486,2.2087,0.3533,-0.7361,0.3494,1.758,-1.6138,-0.113,0.3008,0.5731,-0.1648],[1.6421,1.3219,0.3864,0.1431,-1.678,1.1632,1.3977,-0.3618,-0.5002,0.8043,0.5062,-1.2925,1.0628,0.3661,1.7854,-1.4364],[0.9435,-1.2881,1.3071,0.5576,-2.0736,0.497,0.397,0.3376,0.1472,0.8033,-0.3395,0.0756,1.6307,-0.6615,1.1692,-0.9711],[0.7858,-2.0599,1.0045,1.4076,-1.9092,-0.4977,-0.3356,-0.6906,0.6322,0.9525,0.1455,-0.4042,1.0116,-0.4424,1.6347,-1.0307],[-0.2437,-0.8165,-0.4882,0.1563,-0.0295,-1.5631,-0.0128,-0.0692,0.5757,0.6584,0.8234,-0.1325,0.8275,-0.6768,1.0702,1.2188],[-0.6871,0.0367,-0.1342,-0.0701,0.0099,-0.473,-0.5919,0.0913,0.6693,-0.1065,0.059,0.1349,-0.031,-0.0261,0.0611,0.6308],[-0.6295,1.2668,1.0884,0.1377,0.5164,-0.1094,0.6365,0.9782,-0.97,1.2054,-1.3234,-1.4711,-1.7072,0.8885,0.2206,0.0116],[0.1727,-0.8379,-0.4197,-0.7528,0.4317,-1.0259,0.0818,1.1988,-0.2428,0.9543,1.0595,0.4659,0.4905,-1.2352,0.0308,-0.0373],[-1.1142,1.4501,-1.6657,-0.927,0.2798,-1.9528,-1.0525,-0.7529,1.1156,-0.5612,0.9015,-0.3661,0.3054,-0.4571,0.9355,0.2985],[-0.3615,0.7708,0.1301,0.0025,0.6478,-1.0696,-0.8299,0.7746,1.9034,-1.8188,-0.869,0.4825,-0.4528,-1.489,0.1824,0.3911],[0.6933,-1.2949,-0.6322,0.6459,0.9824,-1.8484,0.0032,1.8937,1.8449,-1.3201,0.8353,0.7903,-0.3154,-1.8118,-0.6398,0.5778],[-0.4469,-0.4445,-0.9207,1.6442,-0.3836,-0.0359,-0.5197,-0.2238,0.9448,0.8488,1.3518,0.2457,-0.8244,-1.0585,0.4969,-0.1394],[-0.3436,2.4482,-0.4174,0.3879,2.1773,0.9621,0.8213,-1.4088,-0.077,-1.1459,-0.9645,-0.559,-1.3515,1.1281,-1.2182,-0.451],[-0.2169,0.0104,-0.0392,-0.0203,0.0045,-0.1275,-0.1846,0.029,0.2186,-0.0296,0.0205,0.039,-0.0061,-0.0253,0.0191,0.1792],[-1.0742,0.0751,0.0727,-0.342,-1.0428,-0.6263,-1.249,0.7144,0.8485,-0.3853,2.4102,1.8977,0.1705,0.3981,-1.0939,-0.4898],[-0.9505,0.1121,0.0544,-0.5686,-0.6506,0.2792,-1.7081,0.4731,1.3232,-0.6316,0.0579,1.0638,0.5054,0.8357,-1.5174,0.3775],[0.2671,-1.2394,0.8996,-0.0837,0.24,-0.1309,-0.9724,0.5003,0.6258,-0.6131,0.0179,-0.1175,0.1315,-0.7566,-0.5683,0.8422],[0.9853,-0.8178,1.0191,0.7664,0.8222,-0.394,0.6243,0.7136,0.2099,-0.3239,-0.1153,-0.5067,-0.3041,-0.4246,-1.0089,0.4834],[-0.1438,0.1979,-1.5326,0.866,0.7406,-0.8944,0.4145,0.7066,1.2215,-0.3955,0.5222,-0.1323,0.0679,-0.8239,-0.407,0.6552],[-1.1613,1.5019,-1.0088,-0.3421,0.2816,-0.4658,-0.5037,0.6536,1.2158,-0.3945,0.0781,1.1249,-0.228,-0.1953,-0.0756,0.841],[0.4986,2.7438,-1.8549,-0.458,1.6581,0.7645,1.2034,-0.9042,1.2547,-1.2528,0.5712,-0.9451,-1.613,-0.3222,-0.9514,-0.6027]],"b1":[-0.3638,-0.1849,0.3367,-0.3539,-0.522,0.2551,-0.3654,-0.402,-0.0787,0.5208,-0.0531,0.3292,0.0192,-0.1956,0.462,0.1841],"W2":[[-1.0785,1.7025,-2.2084,-1.5267,1.37,0.4672,1.5272,-2.3058,2.0356,-2.1468],[-1.3237,2.94,1.3973,-1.8962,2.6342,-1.6575,-2.19,1.8124,-2.7472,-2.2964],[1.1854,-2.3004,-2.5758,1.6486,0.2653,1.0343,-0.8759,-1.3129,0.7051,1.2538],[-1.8986,1.5187,-1.828,2.2997,-1.0603,-1.6776,0.583,-1.8218,-0.4203,2.1445],[-0.6657,2.341,1.6446,-2.4354,-2.0746,-0.7607,-0.5996,-2.0345,0.0688,1.7378],[-2.0001,1.3666,-2.836,1.2837,0.4495,1.1325,-2.0584,1.7276,0.8454,0.7472],[-1.2243,1.7963,-1.5151,-2.7633,1.754,-2.4083,1.2618,-1.8653,2.4741,-1.1884],[-1.5874,-1.0369,1.7519,1.586,-1.3719,0.365,-1.9159,-1.6944,1.6066,-0.9521],[-2.0594,-1.177,1.8775,2.4208,-1.8175,2.1369,1.9611,-2.063,-2.2852,-1.9908],[1.0176,-2.6256,-0.9916,0.1507,1.2372,-2.6434,0.6559,1.9036,1.2111,0.8911],[-1.9549,0.2681,1.7358,1.247,-2.2186,-0.8397,1.4451,1.7948,1.387,-2.9978],[2.1291,-1.6289,1.7084,0.6526,-2.6229,0.0048,-2.3459,1.6579,0.2397,1.0591],[1.6703,-1.0944,-2.125,-1.5138,-0.1731,2.4567,1.6109,0.0594,-1.4759,-2.9041],[-2.1541,-0.6595,-2.1018,-2.3592,1.3953,2.1795,-0.8934,2.1565,-1.7223,1.4031],[2.0789,-2.3079,-0.4859,-0.7613,1.7709,-1.8509,2.0014,0.33,-2.2845,-2.0621],[1.4995,-1.8743,1.277,-2.1847,-0.6548,1.2198,0.5842,-1.635,0.0001,1.5708]],"b2":[0.6413,0.3596,0.6559,0.1534,-0.41,-0.225,-0.4408,0.5494,-0.6072,0.2264],"acc":0.98,"ex":[{"x":[0,0,2,14,13,3,0,0,0,0,13,13,9,11,0,0,0,0,16,7,0,12,0,0,0,3,16,5,0,10,5,0,0,5,16,1,0,8,5,0,0,3,16,1,0,10,5,0,0,0,16,8,5,14,3,0,0,0,4,16,16,9,1,0],"y":0,"p":[0.9973,0.0,0.0,0.0,0.0001,0.0003,0.0019,0.0001,0.0002,0.0002]},{"x":[0,0,0,12,11,0,0,0,0,0,12,12,9,10,0,0,0,2,16,2,1,11,1,0,0,1,15,0,0,5,8,0,0,2,14,0,0,5,10,0,0,0,13,2,0,2,13,0,0,0,7,9,0,7,11,0,0,0,0,11,13,16,2,0],"y":0,"p":[0.9972,0.0,0.0,0.0,0.0001,0.0002,0.0014,0.0009,0.0,0.0002]},{"x":[0,0,0,0,11,14,3,0,0,0,0,2,16,16,2,0,0,0,0,11,16,14,0,0,0,0,3,16,16,15,0,0,0,1,13,16,16,13,0,0,0,6,16,9,15,13,0,0,0,0,0,0,12,16,1,0,0,0,0,0,9,14,1,0],"y":1,"p":[0.0,0.9803,0.0,0.0,0.0001,0.0,0.0,0.0001,0.0194,0.0]},{"x":[0,0,0,0,12,5,0,0,0,0,0,2,16,12,0,0,0,0,1,12,16,11,0,0,0,2,12,16,16,10,0,0,0,6,11,5,15,6,0,0,0,0,0,1,16,9,0,0,0,0,0,2,16,11,0,0,0,0,0,3,16,8,0,0],"y":1,"p":[0.0,0.9951,0.0,0.0,0.0018,0.0,0.0,0.0,0.0025,0.0005]},{"x":[0,0,7,16,14,3,0,0,0,0,9,14,11,15,0,0,0,0,1,5,0,15,5,0,0,0,0,0,0,16,5,0,0,0,0,0,3,16,4,0,0,0,0,1,12,14,1,0,0,0,5,12,16,16,14,1,0,0,8,16,14,10,13,3],"y":2,"p":[0.0034,0.0001,0.8726,0.1126,0.0,0.0003,0.0063,0.004,0.0002,0.0007]},{"x":[0,0,5,15,15,2,0,0,0,3,16,9,16,5,0,0,0,5,9,1,16,1,0,0,0,0,0,10,9,0,0,0,0,0,1,16,3,0,0,0,0,0,9,9,0,0,0,0,0,0,11,14,7,6,2,0,0,0,6,16,16,15,2,0],"y":2,"p":[0.0,0.0,0.9975,0.0013,0.0,0.0004,0.0,0.0,0.0006,0.0001]},{"x":[0,0,9,16,10,1,0,0,0,0,8,3,16,4,0,0,0,0,0,5,14,2,0,0,0,0,2,16,15,7,0,0,0,0,0,0,3,15,2,0,0,4,6,0,0,13,7,0,0,6,13,1,5,16,3,0,0,0,10,16,15,5,0,0],"y":3,"p":[0.0,0.0001,0.0003,0.9875,0.0,0.0029,0.0,0.0,0.0029,0.0063]},{"x":[0,0,3,12,16,14,0,0,0,3,15,16,15,14,0,0,0,3,12,1,15,8,0,0,0,0,0,9,16,8,0,0,0,0,0,10,16,16,8,0,0,0,0,2,5,13,8,0,0,0,2,11,11,15,5,0,0,0,3,16,16,9,0,0],"y":3,"p":[0.0,0.0,0.0001,0.9993,0.0,0.0003,0.0,0.0,0.0002,0.0001]},{"x":[0,0,0,10,9,0,0,0,0,0,5,15,0,0,9,5,0,0,14,10,0,7,16,4,0,5,16,7,5,16,6,0,0,11,16,16,16,14,0,0,0,3,4,11,16,8,0,0,0,0,0,7,16,2,0,0,0,0,0,12,12,0,0,0],"y":4,"p":[0.0001,0.0001,0.0,0.0,0.999,0.0,0.0002,0.0004,0.0002,0.0]},{"x":[0,0,1,10,15,2,0,0,0,0,7,16,7,3,5,0,0,3,16,7,3,16,11,0,0,9,14,1,10,14,2,0,0,11,16,16,16,10,0,0,0,2,4,8,16,3,0,0,0,0,0,9,13,0,0,0,0,0,0,12,9,0,0,0],"y":4,"p":[0.0005,0.0002,0.0,0.0,0.9929,0.0,0.0002,0.0053,0.0005,0.0004]},{"x":[0,0,5,16,16,3,0,0,0,0,9,16,7,0,0,0,0,0,12,15,2,0,0,0,0,1,15,16,15,4,0,0,0,0,9,13,16,9,0,0,0,0,0,0,14,12,0,0,0,0,5,12,16,8,0,0,0,0,3,15,15,1,0,0],"y":5,"p":[0.0001,0.0025,0.0,0.0014,0.0039,0.9731,0.0134,0.0,0.004,0.0017]},{"x":[0,0,13,10,8,8,7,0,0,4,16,16,16,16,15,2,0,0,10,16,5,0,0,0,0,0,0,13,12,0,0,0,0,0,0,6,15,0,0,0,0,0,0,8,15,0,0,0,0,1,6,10,12,0,0,0,0,1,13,16,5,0,0,0],"y":5,"p":[0.0001,0.0004,0.1022,0.275,0.0,0.5336,0.0001,0.0848,0.0031,0.0007]},{"x":[0,0,3,11,0,0,0,0,0,0,12,11,0,0,0,0,0,1,14,1,0,0,0,0,0,2,15,0,0,0,0,0,0,4,15,15,16,15,2,0,0,1,16,8,4,8,11,0,0,1,16,11,7,10,12,0,0,0,5,10,12,15,7,0],"y":6,"p":[0.0001,0.0,0.0,0.0,0.0002,0.0,0.9994,0.0,0.0002,0.0]},{"x":[0,0,2,14,5,0,0,0,0,0,9,12,0,0,0,0,0,1,15,1,0,0,0,0,0,3,15,0,0,0,0,0,0,6,16,16,16,13,1,0,0,2,16,8,4,7,11,0,0,0,12,11,1,8,11,0,0,0,3,12,16,15,4,0],"y":6,"p":[0.0002,0.0,0.0,0.0,0.0002,0.0,0.9994,0.0,0.0002,0.0]},{"x":[0,0,2,13,16,9,0,0,0,0,12,12,7,16,3,0,0,1,14,3,0,16,4,0,0,0,0,4,10,16,6,0,0,0,0,13,16,16,9,0,0,0,0,5,13,1,0,0,0,0,0,11,9,0,0,0,0,0,1,16,4,0,0,0],"y":7,"p":[0.0004,0.0,0.0,0.0006,0.0016,0.0003,0.0,0.9742,0.0002,0.0226]},{"x":[0,0,2,14,16,8,0,0,0,0,4,12,16,11,0,0,0,0,0,0,16,12,0,0,0,0,0,3,16,9,0,0,0,2,5,10,16,12,2,0,0,16,16,16,16,14,3,0,0,4,4,14,12,0,0,0,0,0,2,16,7,0,0,0],"y":7,"p":[0.0025,0.001,0.0014,0.0053,0.0887,0.0,0.0011,0.8863,0.0137,0.0]},{"x":[0,0,0,3,12,10,0,0,0,0,1,14,6,15,0,0,0,0,0,16,6,10,0,0,0,0,0,14,16,2,0,0,0,0,3,14,15,3,0,0,0,1,16,4,9,9,0,0,0,0,4,13,4,7,8,0,0,0,0,3,10,11,15,2],"y":8,"p":[0.0,0.5578,0.002,0.009,0.0001,0.0,0.0024,0.0003,0.4281,0.0002]},{"x":[0,0,5,13,13,8,0,0,0,0,16,11,13,16,6,0,0,1,16,5,2,14,9,0,0,0,9,16,16,15,0,0,0,0,10,16,14,14,0,0,0,5,15,4,0,16,6,0,0,6,14,7,6,16,4,0,0,0,7,15,16,10,0,0],"y":8,"p":[0.0,0.0001,0.0,0.0004,0.0,0.0,0.0,0.0,0.9945,0.0049]},{"x":[0,0,8,16,10,2,0,0,0,0,12,13,14,11,0,0,0,0,10,13,8,16,2,0,0,0,4,15,15,16,8,0,0,0,0,3,8,11,13,0,0,0,0,0,0,5,16,4,0,0,1,2,2,7,16,5,0,0,3,14,16,16,11,1],"y":9,"p":[0.0001,0.0,0.0,0.0002,0.0,0.0001,0.0,0.0005,0.0001,0.999]},{"x":[0,0,5,12,13,12,0,0,0,7,13,5,8,15,0,0,0,4,14,4,13,16,3,0,0,0,6,12,8,9,4,0,0,0,0,0,0,8,8,0,0,0,0,0,0,6,8,0,0,0,1,3,2,13,6,0,0,0,6,16,16,8,1,0],"y":9,"p":[0.0004,0.0,0.0,0.0019,0.0,0.0002,0.0,0.0,0.0015,0.9959]}]};
