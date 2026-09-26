/* ===== Lab 14 interactivity ===== */

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
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const f2 = (v) => v.toFixed(2), f3 = (v) => v.toFixed(3), pc = (v, d = 1) => (v * 100).toFixed(d) + '%';
const sigm = (z) => 1 / (1 + Math.exp(-z));
function erf(x) { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)); }
const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
const fmtN = (n) => n.toLocaleString('en-US');

/* ---------- metrics ---------- */
function clsMetrics(TP, FP, FN, TN) {
  const n = TP + FP + FN + TN, acc = n ? (TP + TN) / n : 0;
  const prec = TP + FP ? TP / (TP + FP) : NaN, rec = TP + FN ? TP / (TP + FN) : NaN;
  const f1 = prec + rec > 0 ? 2 * prec * rec / (prec + rec) : (TP === 0 && (TP + FP) > 0 ? 0 : NaN);
  return { n, acc, prec, rec, f1 };
}
const CM_PRESETS = {
  disease: { name: 'Disease screening', v: [80, 20, 40, 860] },
  fraud: { name: 'Fraud detector (Ex. 2)', v: [45, 15, 55, 885] },
  rare: { name: 'Rare disease, "always negative"', v: [0, 0, 100, 9900] },
};

/* threshold explorer: 100 positives, 900 negatives, Gaussian scores */
const TH = { nPos: 100, nNeg: 900, muP: 0.66, sdP: 0.13, muN: 0.36, sdN: 0.12 };
function thCounts(t) {
  const TP = TH.nPos * (1 - Phi((t - TH.muP) / TH.sdP)), FP = TH.nNeg * (1 - Phi((t - TH.muN) / TH.sdN));
  const r = (v) => Math.round(v);
  return { TP: r(TP), FN: TH.nPos - r(TP), FP: r(FP), TN: TH.nNeg - r(FP) };
}

/* plot 1: four models on 1000 cases, 100 of them the (safety-critical) minority class */
const P1 = [
  { name: 'A', TP: 45, FP: 2 }, { name: 'B', TP: 60, FP: 20 },
  { name: 'C', TP: 85, FP: 90 }, { name: 'D', TP: 72, FP: 45 },
].map(m => ({ ...m, FN: 100 - m.TP, TN: 900 - m.FP, ...clsMetrics(m.TP, m.FP, 100 - m.TP, 900 - m.FP) }));
const p1Cost = (m, c) => m.FN * c + m.FP;

/* ---------- BLEU / ROUGE-L ---------- */
const tok = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, ' ').split(/\s+/).filter(Boolean);
function ngrams(t, n) { const m = new Map(); for (let i = 0; i + n <= t.length; i++) { const k = t.slice(i, i + n).join(' '); m.set(k, (m.get(k) || 0) + 1); } return m; }
function bleu(cand, ref) {
  const c = tok(cand), r = tok(ref), ps = [], raw = [];
  for (let n = 1; n <= 4; n++) {
    const cn = ngrams(c, n), rn = ngrams(r, n);
    let match = 0, total = 0;
    cn.forEach((v, k) => { match += Math.min(v, rn.get(k) || 0); total += v; });
    raw.push([match, total]);
    ps.push(total ? match / total : 0);
  }
  const bp = c.length === 0 ? 0 : c.length >= r.length ? 1 : Math.exp(1 - r.length / c.length);
  const geo = (p) => (p.some(v => v === 0) ? 0 : Math.exp(p.reduce((s, v) => s + Math.log(v), 0) / 4));
  const psS = raw.map(([m, t], i) => (i === 0 ? (t ? m / t : 0) : (m + 1) / (t + 1)));
  return { ps, raw, bp, bleu: bp * geo(ps), bleu1: bp * geo(psS), c: c.length, r: r.length };
}
function lcs(a, b) {
  const D = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) D[i][j] = a[i - 1] === b[j - 1] ? D[i - 1][j - 1] + 1 : Math.max(D[i - 1][j], D[i][j - 1]);
  const ia = new Set(), ib = new Set();
  for (let i = a.length, j = b.length; i > 0 && j > 0;) {
    if (a[i - 1] === b[j - 1]) { ia.add(i - 1); ib.add(j - 1); i--; j--; } else if (D[i - 1][j] >= D[i][j - 1]) i--; else j--;
  }
  return { len: D[a.length][b.length], ia, ib };
}
function rougeL(cand, ref) {
  const c = tok(cand), r = tok(ref), L = lcs(c, r);
  const P = c.length ? L.len / c.length : 0, R = r.length ? L.len / r.length : 0;
  return { ...L, P, R, F: P + R ? 2 * P * R / (P + R) : 0, c, r };
}
const OV_SETS = {
  cat: { name: 'Ex. 4 · the cat', ref: 'the cat is sitting on the mat', cands: ['the cat is sitting on the mat', 'the cat sits on the mat', 'mat the on sitting is cat the'] },
  overfit: { name: 'Ex. 5 · overfit', ref: 'machine learning models can overfit training data', cands: ['machine learning models may overfit the training data', 'training data can overfit machine learning models'] },
  committee: { name: 'Ex. 6 · committee', ref: 'The committee rejected the proposal.', cands: ['The proposal was rejected by the committee.', 'The committee accepted the proposal.'] },
  noise: { name: 'Paraphrase', ref: 'The experiment failed because the training data contained label noise.', cands: ['Incorrect labels in the dataset caused the experiment to fail.', 'The experiment failed because the training data contained no noise.'] },
};

/* ---------- LLM judge: verbosity (illustrative, simulated) ---------- */
function judgeData() {
  const r = rng(7), bins = [];
  for (let x = -300; x <= 300; x += 50) {
    const row = { x };
    [['first', 0.35], ['second', -0.35]].forEach(([k, b]) => {
      const p = sigm(0.0055 * x + b); let w = 0;
      for (let i = 0; i < 60; i++) if (r() < p) w++;
      row[k] = w / 60;
    });
    let h = 0; for (let i = 0; i < 120; i++) if (r() < 0.5) h++;
    row.human = h / 120; row.pooled = (row.first + row.second) / 2;
    bins.push(row);
  }
  return bins;
}

/* ---------- metric disagreement (illustrative) ---------- */
const MD_METRICS = ['BLEU', 'ROUGE-L', 'COMET', 'Human'];
const MD_SYS = [
  { name: 'System 1', v: [34.1, 0.47, 0.81, 4.1] },
  { name: 'System 2', v: [36.8, 0.49, 0.77, 3.6] },
  { name: 'System 3', v: [31.2, 0.44, 0.84, 4.4] },
  { name: 'System 4', v: [29.5, 0.41, 0.80, 3.9] },
  { name: 'System 5', v: [33.0, 0.48, 0.79, 3.7] },
];
const MD_FMT = [(v) => v.toFixed(1), (v) => v.toFixed(2), (v) => v.toFixed(2), (v) => v.toFixed(1)];
function mdRanks() { return MD_METRICS.map((_, j) => { const order = MD_SYS.map((s, i) => i).sort((a, b) => MD_SYS[b].v[j] - MD_SYS[a].v[j]); const rk = []; order.forEach((i, r) => (rk[i] = r + 1)); return rk; }); }

/* ---------- training curves (illustrative) ---------- */
const TC_SETUPS = {
  base: { name: 'Baseline', tr: (e) => 0.08 + 1.2 * Math.exp(-e / 5), va: (e) => 0.30 + 1.05 * Math.exp(-e / 5.5) + 0.0009 * e * e },
  wd: { name: '+ weight decay', tr: (e) => 0.20 + 1.1 * Math.exp(-e / 5.5), va: (e) => 0.31 + 1.0 * Math.exp(-e / 6) + 0.00022 * e * e },
  data: { name: '× 5 more data', tr: (e) => 0.22 + 1.1 * Math.exp(-e / 6), va: (e) => 0.26 + 1.05 * Math.exp(-e / 6) + 0.00012 * e * e },
};
const TC_E = 40;
function tcCurves(key) {
  const s = TC_SETUPS[key], r = rng(21), tr = [], va = [];
  for (let e = 1; e <= TC_E; e++) { tr.push(s.tr(e)); va.push(s.va(e) + (r() - 0.5) * 0.03); }
  const best = va.reduce((b, v, i) => (v < va[b] ? i : b), 0) + 1;
  return { tr, va, best };
}

/* ---------- subgroups: pooled F1 hides Group 3 ---------- */
const SG_MODELS = [
  { name: 'Model X', rec: [0.84, 0.82, 0.80], fpr: [0.06, 0.07, 0.08] },
  { name: 'Model Y', rec: [0.91, 0.89, 0.35], fpr: [0.04, 0.05, 0.12] },
];
const SG_POS = 0.3, SG_N = 10000;
function sgStats(m, share3) {
  const sizes = [(1 - share3) * 0.6, (1 - share3) * 0.4, share3].map(s => s * SG_N);
  let T = { TP: 0, FP: 0, FN: 0 };
  const groups = sizes.map((n, g) => {
    const pos = n * SG_POS, neg = n - pos, TP = m.rec[g] * pos, FN = pos - TP, FP = m.fpr[g] * neg;
    T.TP += TP; T.FP += FP; T.FN += FN;
    return { n, f1: 2 * TP / (2 * TP + FP + FN) };
  });
  return { groups, f1: 2 * T.TP / (2 * T.TP + T.FP + T.FN) };
}

/* ---------- distribution shift ---------- */
const SH_DOM = [['News', 0.94, 70], ['Wikipedia', 0.92, 20], ['Social media', 0.71, 10]];

/* ---------- contamination (illustrative) ---------- */
const CT_OVER = 0.15;
const CT_MODELS = [['Model 1', 70.0, 96.0], ['Model 2', 71.0, 74.0], ['Model 3', 79.0, 92.0], ['Model 4', 58.0, 59.0]]
  .map(([name, clean, over]) => ({ name, clean, over, before: (1 - CT_OVER) * clean + CT_OVER * over }));

/* ---------- uncertainty ---------- */
function wilson(p, n, z = 1.96) { const d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [c - h, c + h]; }
function twoProp(pA, pB, n) { const p = (pA + pB) / 2, se = Math.sqrt(p * (1 - p) * 2 / n), z = (pB - pA) / se; return { z, p: 2 * (1 - Phi(Math.abs(z))) }; }

/* ---------- Cohen's kappa ---------- */
function kappa(a, b, c, d) { const n = a + b + c + d, po = (a + d) / n, pe = ((a + b) / n) * ((a + c) / n) + ((c + d) / n) * ((b + d) / n); return { n, po, pe, k: pe < 1 ? (po - pe) / (1 - pe) : 1 }; }
const KA_PRESETS = { balanced: { name: 'Balanced labels', v: [40, 5, 5, 50] }, skewed: { name: 'Mostly "acceptable"', v: [85, 5, 5, 5] }, chance: { name: 'Coin-flipping annotators', v: [25, 25, 25, 25] } };

/* ---------- shared plotting helpers ---------- */
function frame(svg, o) {
  // o: {L, R, T, B, yMin, yMax, yTicks, yFmt, yLabel}
  const Y = (v) => o.B - (v - o.yMin) / (o.yMax - o.yMin) * (o.B - o.T);
  o.yTicks.forEach(v => { el('line', { x1: o.L, y1: Y(v), x2: o.R, y2: Y(v), class: 'grid-line' }, svg); txt(svg, o.L - 6, Y(v) + 4, o.yFmt ? o.yFmt(v) : v, 'tick', 'end'); });
  el('line', { x1: o.L, y1: o.B, x2: o.R, y2: o.B, class: 'axis' }, svg);
  el('line', { x1: o.L, y1: o.B, x2: o.L, y2: o.T, class: 'axis' }, svg);
  if (o.yLabel) txt(svg, 12, (o.T + o.B) / 2, o.yLabel, 'tick', 'middle', { transform: `rotate(-90 12 ${(o.T + o.B) / 2})` });
  return Y;
}
const polyline = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
function pills(box, items, cur, onPick) {
  box.innerHTML = items.map(([k, label]) => `<button class="strat-btn${k === cur ? ' active' : ''}" data-k="${k}">${label}</button>`).join('');
  box.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; box.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b)); onPick(b.dataset.k); };
}
const nz = (v, d = 3) => (Number.isFinite(v) ? v.toFixed(d) : 'undefined');

/* ---------- maths rendering ---------- */
function initMath() {
  if (!window.renderMathInElement) return;
  renderMathInElement(document.body, {
    delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
    throwOnError: false,
  });
}

/* ---------- hero: small bar charts, confusion grids and a PR curve ---------- */
function initHero() {
  const svg = document.getElementById('ev-hero-bg'), r = rng(14);
  for (let i = 0; i < 8; i++) {
    const x = 40 + i * 150 + r() * 40, y = 30 + r() * 40, g = el('g', { transform: `translate(${x.toFixed(0)} ${y.toFixed(0)})` }, svg);
    if (i % 3 === 1) {
      [[0, 0, 'ok'], [34, 0, 'bad'], [0, 34, 'bad'], [34, 34, 'ok']].forEach(([dx, dy, c]) => el('rect', { x: dx, y: dy, width: 30, height: 30, rx: 4, class: 'cm ' + c }, g));
    } else {
      for (let j = 0; j < 5; j++) { const h = 20 + r() * 60; el('rect', { x: j * 16, y: 90 - h, width: 11, height: h, rx: 2, class: 'bar b' + (j % 2) }, g); }
    }
  }
  const X = (t) => 60 + t * 1080, Y = (t) => 280 - 70 * Math.sqrt(1 - t * t);
  el('path', { d: polyline(Array.from({ length: 81 }, (_, i) => [X(i / 80), Y(i / 80)])), class: 'pr' }, svg);
}

/* ---------- 2. confusion matrix calculator ---------- */
function initCM() {
  const ids = ['tp', 'fp', 'fn', 'tn'], inp = ids.map(k => document.getElementById('cm-' + k)), out = document.getElementById('cm-out');
  function render() {
    const [TP, FP, FN, TN] = inp.map(i => Math.max(0, Math.round(+i.value || 0))), m = clsMetrics(TP, FP, FN, TN);
    const pos = TP + FN;
    out.innerHTML = `
      <p>Accuracy = (TP + TN) / all = (${TP} + ${TN}) / ${fmtN(m.n)} = <b>${nz(m.acc)}</b></p>
      <p>Precision = TP / (TP + FP) = ${TP} / ${TP + FP} = <b>${nz(m.prec)}</b></p>
      <p>Recall = TP / (TP + FN) = ${TP} / ${pos} = <b>${nz(m.rec)}</b></p>
      <p>F1 = 2·P·R / (P + R) = <b>${nz(m.f1)}</b></p>
      <p class="note">${pos ? `The model finds ${TP} of ${pos} actual positives and misses <b>${FN}</b>. ` : ''}${TP + FP === 0 ? 'It never predicts positive, so precision is undefined (0 / 0) and F1 is usually reported as 0. ' : ''}${pos && m.n ? `Always answering "negative" would already score accuracy ${nz((FP + TN) / m.n)}.` : ''}</p>`;
  }
  pills(document.getElementById('cm-presets'), Object.entries(CM_PRESETS).map(([k, p]) => [k, p.name]), 'disease', (k) => { CM_PRESETS[k].v.forEach((v, i) => (inp[i].value = v)); render(); });
  inp.forEach(i => i.addEventListener('input', render));
  render();
}

/* ---------- 3. threshold explorer ---------- */
function initThreshold() {
  const tS = document.getElementById('th-t'), svg = document.getElementById('th-plot'), pr = document.getElementById('th-pr'), out = document.getElementById('th-out');
  let scale = 'counts';
  const pdf = (x, mu, sd) => Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
  const curve = Array.from({ length: 101 }, (_, i) => { const t = i / 100, c = thCounts(t), m = clsMetrics(c.TP, c.FP, c.FN, c.TN); return { t, P: Number.isFinite(m.prec) ? m.prec : 1, R: m.rec }; });
  function render() {
    const t = +tS.value, c = thCounts(t), m = clsMetrics(c.TP, c.FP, c.FN, c.TN);
    document.getElementById('th-t-val').textContent = f2(t);
    svg.innerHTML = '';
    const L = 40, R = 445, T = 14, B = 200, X = (v) => L + v * (R - L);
    const wP = scale === 'counts' ? TH.nPos : 1, wN = scale === 'counts' ? TH.nNeg : 1;
    const yMax = Math.max(wN * pdf(TH.muN, TH.muN, TH.sdN), wP * pdf(TH.muP, TH.muP, TH.sdP)) * 1.08, Y = (v) => B - v / yMax * (B - T);
    el('rect', { x: X(t), y: T, width: R - X(t), height: B - T, class: 'th-zone' }, svg);
    const xs = Array.from({ length: 201 }, (_, i) => i / 200);
    const area = (w, mu, sd, cls) => el('path', { d: polyline(xs.map(x => [X(x), Y(w * pdf(x, mu, sd))])) + `L${X(1)},${B}L${X(0)},${B}Z`, class: cls }, svg);
    area(wN, TH.muN, TH.sdN, 'th-neg'); area(wP, TH.muP, TH.sdP, 'th-pos');
    el('line', { x1: L, y1: B, x2: R, y2: B, class: 'axis' }, svg);
    [0, 0.25, 0.5, 0.75, 1].forEach(v => txt(svg, X(v), B + 15, v, 'tick', 'middle'));
    txt(svg, (L + R) / 2, B + 32, 'model score', 'tick', 'middle');
    el('line', { x1: X(t), y1: T - 4, x2: X(t), y2: B, class: 'th-line' }, svg);
    txt(svg, X(t) + 5, T + 8, 'predict positive →', 'tick');
    txt(svg, L + 4, T + 8, scale === 'counts' ? 'number of cases' : 'density per class', 'tick');
    // PR curve
    pr.innerHTML = '';
    const pL = 40, pR = 230, pT = 12, pB = 170, PX = (v) => pL + v * (pR - pL), PY = frame(pr, { L: pL, R: pR, T: pT, B: pB, yMin: 0, yMax: 1, yTicks: [0, 0.5, 1], yLabel: 'precision' });
    [0, 0.5, 1].forEach(v => txt(pr, PX(v), pB + 14, v, 'tick', 'middle'));
    txt(pr, (pL + pR) / 2, pB + 30, 'recall', 'tick', 'middle');
    el('path', { d: polyline(curve.map(p => [PX(p.R), PY(p.P)])), class: 'th-prc' }, pr);
    el('circle', { cx: PX(m.rec), cy: PY(Number.isFinite(m.prec) ? m.prec : 1), r: 6, class: 'th-dot' }, pr);
    out.innerHTML = `
      <div class="ev-mini"><span>TP <b>${c.TP}</b></span><span>FN <b>${c.FN}</b></span><span>FP <b>${c.FP}</b></span><span>TN <b>${c.TN}</b></span></div>
      <p>Precision <b>${nz(m.prec, 2)}</b> · Recall <b>${nz(m.rec, 2)}</b> · F1 <b>${nz(m.f1, 2)}</b> · Accuracy <b>${f2(m.acc)}</b></p>
      <p class="note">${m.rec > 0.95 ? 'Almost every positive is caught, but most alarms are false.' : Number.isFinite(m.prec) && m.prec > 0.9 ? 'Alarms are almost always right, but many positives are missed.' : 'Moving the threshold trades one kind of error for the other.'}</p>`;
  }
  pills(document.getElementById('th-scale'), [['counts', 'Real class sizes (100 vs 900)'], ['norm', 'Each class normalised']], scale, (k) => { scale = k; render(); });
  tS.addEventListener('input', render);
  render();
}

/* ---------- 4. plot 1: accuracy vs minority recall, then costs ---------- */
function initP1() {
  const svg = document.getElementById('p1-plot'); let showP = false;
  function render() {
    svg.innerHTML = '';
    const L = 44, R = 450, T = 14, B = 210, Y = frame(svg, { L, R, T, B, yMin: 0, yMax: 1, yTicks: [0, 0.25, 0.5, 0.75, 1] });
    const series = [['acc', 'ev-b1'], ['rec', 'ev-b2']].concat(showP ? [['prec', 'ev-b3']] : []);
    const gw = (R - L) / P1.length, bw = Math.min(30, (gw - 24) / series.length);
    P1.forEach((m, i) => {
      const x0 = L + i * gw + (gw - bw * series.length) / 2;
      series.forEach(([k, cls], j) => {
        el('rect', { x: x0 + j * bw, y: Y(m[k]), width: bw - 3, height: B - Y(m[k]), class: cls }, svg);
        txt(svg, x0 + j * bw + (bw - 3) / 2, Y(m[k]) - 4, m[k].toFixed(3), 'tick ev-vlab', 'middle');
      });
      txt(svg, L + (i + 0.5) * gw, B + 18, 'Model ' + m.name, 'tick ev-cat', 'middle');
    });
  }
  const pbtn = document.getElementById('p1-prec');
  pbtn.addEventListener('click', () => { showP = !showP; pbtn.classList.toggle('active', showP); pbtn.textContent = showP ? 'Hide precision' : 'Also show precision'; document.getElementById('p1-leg-p').hidden = !showP; render(); });
  render();

  const cS = document.getElementById('p1-c'), cost = document.getElementById('p1-cost');
  function renderCost() {
    const c = +cS.value, costs = P1.map(m => p1Cost(m, c)), best = costs.indexOf(Math.min(...costs)), mx = Math.max(...costs);
    document.getElementById('p1-c-val').textContent = c;
    cost.innerHTML = P1.map((m, i) => `
      <div class="ev-crow${i === best ? ' best' : ''}"><span class="ev-cname">Model ${m.name}${i === best ? ' <em>lowest cost</em>' : ''}</span>
      <span class="ev-cf">${m.FN} FN × ${c} + ${m.FP} FP × 1</span><div class="ev-cbar"><i style="width:${(costs[i] / mx * 100).toFixed(1)}%"></i><b>${fmtN(costs[i])}</b></div></div>`).join('')
      + `<p class="note">With a missed positive costing ${c}× a false alarm, Model ${P1[best].name} is the cheapest. ${c <= 1 ? 'When both errors cost the same, the most accurate model wins: minimising errors is exactly maximising accuracy.' : ''}</p>`;
  }
  cS.addEventListener('input', renderCost);
  renderCost();
}

/* ---------- 5. BLEU / ROUGE-L overlap lab ---------- */
function initOverlap() {
  const ref = document.getElementById('ov-ref'), cands = document.getElementById('ov-cands'), table = document.getElementById('ov-table'), detail = document.getElementById('ov-detail');
  let sel = 0;
  function load(k) { const s = OV_SETS[k]; ref.value = s.ref; cands.value = s.cands.join('\n'); sel = s.cands.length > 1 ? 1 : 0; render(); }
  function render() {
    const lines = cands.value.split('\n').map(s => s.trim()).filter(Boolean);
    if (sel >= lines.length) sel = 0;
    const rows = lines.map(c => ({ c, b: bleu(c, ref.value), r: rougeL(c, ref.value) }));
    table.innerHTML = `<thead><tr><th>Candidate</th><th>p₁</th><th>p₂</th><th>p₃</th><th>p₄</th><th>BP</th><th>BLEU</th><th>BLEU+1</th><th>ROUGE-L F1</th></tr></thead><tbody>` +
      rows.map(({ c, b, r }, i) => `<tr class="${i === sel ? 'hl' : ''}" data-i="${i}"><td class="ov-c">${esc(c)}</td>${b.raw.map(([m, t]) => `<td>${m}/${t}</td>`).join('')}<td>${f2(b.bp)}</td><td><b>${f3(b.bleu)}</b></td><td><b>${f3(b.bleu1)}</b></td><td><b>${f3(r.F)}</b></td></tr>`).join('') + '</tbody>';
    if (!rows.length) { detail.innerHTML = ''; return; }
    const { b, r } = rows[sel], refSet = new Set(r.r);
    const toks = (arr, set, hit) => arr.map((w, i) => `<span class="${set.has(i) ? 'lcs' : hit(w) ? 'uni' : ''}">${esc(w)}</span>`).join(' ');
    detail.innerHTML = `
      <p><span class="ov-lab">Reference</span> ${toks(r.r, r.ib, (w) => r.c.includes(w))}</p>
      <p><span class="ov-lab">Candidate</span> ${toks(r.c, r.ia, (w) => refSet.has(w))}</p>
      <p class="bt-legend"><span class="k ov-klcs"></span> in the longest common subsequence &nbsp; <span class="k ov-kuni"></span> word also in the other sentence</p>
      <p>ROUGE-L: LCS = ${r.len}, P = ${r.len}/${r.c.length} = ${f3(r.P)}, R = ${r.len}/${r.r.length} = ${f3(r.R)}, F1 = <b>${f3(r.F)}</b></p>
      <p>BLEU = BP · (p₁p₂p₃p₄)<sup>1/4</sup> = ${f2(b.bp)} · (${b.ps.map(f3).join(' · ')})<sup>1/4</sup> = <b>${f3(b.bleu)}</b>${b.bleu === 0 && b.ps[0] > 0 ? ' — one zero n-gram precision makes the whole product 0' : ''}</p>`;
  }
  table.addEventListener('click', (e) => { const tr = e.target.closest('tr[data-i]'); if (tr) { sel = +tr.dataset.i; render(); } });
  [ref, cands].forEach(x => x.addEventListener('input', render));
  pills(document.getElementById('ov-sets'), Object.entries(OV_SETS).map(([k, s]) => [k, s.name]), 'cat', load);
  load('cat');
}

/* ---------- 6. plot: LLM-judge verbosity bias ---------- */
function initJudge() {
  const svg = document.getElementById('jb-plot'), data = judgeData(); let view = 'pooled';
  function render() {
    svg.innerHTML = '';
    const L = 48, R = 450, T = 14, B = 220, X = (v) => L + (v + 320) / 640 * (R - L);
    const Y = frame(svg, { L, R, T, B, yMin: 0, yMax: 1, yTicks: [0, 0.25, 0.5, 0.75, 1], yLabel: 'P(prefers A)' });
    [-300, -150, 0, 150, 300].forEach(v => txt(svg, X(v), B + 15, (v > 0 ? '+' : '') + v, 'tick', 'middle'));
    txt(svg, (L + R) / 2, B + 32, 'length of A − length of B (words)', 'tick', 'middle');
    el('line', { x1: X(0), y1: T, x2: X(0), y2: B, class: 'grid-line dashed' }, svg);
    const series = view === 'pooled' ? [['pooled', 'jb-j']] : [['first', 'jb-j'], ['second', 'jb-j2']];
    series.concat([['human', 'jb-h']]).forEach(([k, cls]) => {
      el('path', { d: polyline(data.map(d => [X(d.x), Y(d[k])])), class: cls + ' ln' }, svg);
      data.forEach(d => el('circle', { cx: X(d.x), cy: Y(d[k]), r: 4.5, class: cls + ' pt' }, svg));
    });
    document.getElementById('jb-leg2').hidden = view === 'pooled';
    document.getElementById('jb-leg1').innerHTML = view === 'pooled' ? 'LLM judge (both orders pooled)' : 'LLM judge, A shown <b>first</b>';
  }
  pills(document.getElementById('jb-view'), [['pooled', 'Pooled'], ['split', 'Split by answer order']], view, (k) => { view = k; render(); });
  render();
}

/* ---------- 7. plot: metric disagreement (bump chart) ---------- */
function initMD() {
  const svg = document.getElementById('md-plot'), out = document.getElementById('md-out'), ranks = mdRanks(); let hl = 1;
  function render() {
    svg.innerHTML = '';
    const L = 80, R = 420, T = 30, B = 220, X = (j) => L + j * (R - L) / 3, Y = (r) => T + (r - 1) * (B - T) / 4;
    [1, 2, 3, 4, 5].forEach(r => txt(svg, 14, Y(r) + 4, 'rank ' + r, 'tick'));
    MD_METRICS.forEach((m, j) => { el('line', { x1: X(j), y1: T - 8, x2: X(j), y2: B + 8, class: 'grid-line' }, svg); txt(svg, X(j), 16, m, 'tick ev-cat', 'middle'); });
    const order = MD_SYS.map((_, i) => i).sort((a, b) => (a === hl) - (b === hl));
    order.forEach(i => {
      const g = el('g', { class: `md-s s${i}${i === hl ? ' on' : hl >= 0 ? ' off' : ''}`, 'data-i': i }, svg);
      el('path', { d: polyline(MD_METRICS.map((_, j) => [X(j), Y(ranks[j][i])])), class: 'ln' }, g);
      MD_METRICS.forEach((_, j) => {
        el('circle', { cx: X(j), cy: Y(ranks[j][i]), r: 12, class: 'pt' }, g);
        txt(g, X(j), Y(ranks[j][i]) + 4, MD_FMT[j](MD_SYS[i].v[j]).replace(/^0\./, '.'), 'md-v', 'middle');
      });
    });
    const s = MD_SYS[hl], rk = ranks.map(r => r[hl]), bestJ = rk.indexOf(Math.min(...rk));
    out.innerHTML = `<p><b>${s.name}</b> ranks ${rk.map((r, j) => `${r}${['st', 'nd', 'rd'][r - 1] || 'th'} by ${MD_METRICS[j]}`).join(', ')}.</p>
      <p class="note">If its authors reported only <b>${MD_METRICS[bestJ]}</b>, the paper would say "${s.name} ranks ${rk[bestJ] === 1 ? 'first' : '#' + rk[bestJ]}". ${Math.max(...rk) - Math.min(...rk) >= 3 ? 'Every other evaluator would tell a very different story.' : 'Its position is fairly stable across evaluators.'}</p>`;
  }
  pills(document.getElementById('md-sys'), MD_SYS.map((s, i) => [String(i), s.name]), String(hl), (k) => { hl = +k; render(); });
  svg.addEventListener('click', (e) => { const g = e.target.closest('g[data-i]'); if (g) document.querySelector(`#md-sys [data-k="${g.dataset.i}"]`).click(); });
  render();
}

/* ---------- 8. plot: training curves ---------- */
function initTC() {
  const svg = document.getElementById('tc-plot'), eS = document.getElementById('tc-e'), out = document.getElementById('tc-out'); let key = 'base';
  function render() {
    const c = tcCurves(key), e = +eS.value;
    document.getElementById('tc-e-val').textContent = e;
    svg.innerHTML = '';
    const L = 44, R = 450, T = 14, B = 210, X = (v) => L + (v - 1) / (TC_E - 1) * (R - L);
    const Y = frame(svg, { L, R, T, B, yMin: 0, yMax: 1.8, yTicks: [0, 0.6, 1.2, 1.8], yLabel: 'loss' });
    [1, 10, 20, 30, 40].forEach(v => txt(svg, X(v), B + 15, v, 'tick', 'middle'));
    txt(svg, (L + R) / 2, B + 32, 'epoch', 'tick', 'middle');
    el('line', { x1: X(c.best), y1: T, x2: X(c.best), y2: B, class: 'kl-best' }, svg);
    txt(svg, X(c.best) + 4, T + 10, 'lowest validation loss', 'tick');
    el('path', { d: polyline(c.tr.map((v, i) => [X(i + 1), Y(v)])), class: 'err-train' }, svg);
    el('path', { d: polyline(c.va.map((v, i) => [X(i + 1), Y(Math.min(v, 1.8))])), class: 'err-test' }, svg);
    el('line', { x1: X(e), y1: T, x2: X(e), y2: B, class: 'guide' }, svg);
    el('circle', { cx: X(e), cy: Y(c.tr[e - 1]), r: 5, class: 'train-pt' }, svg);
    el('circle', { cx: X(e), cy: Y(Math.min(c.va[e - 1], 1.8)), r: 5, class: 'tc-vdot' }, svg);
    const gap = c.va[e - 1] - c.tr[e - 1];
    out.innerHTML = `<p>Stop at epoch ${e}: training loss <b>${f2(c.tr[e - 1])}</b>, validation loss <b>${f2(c.va[e - 1])}</b>, gap <b>${f2(gap)}</b>.</p>
      <p class="note">${e < c.best - 3 ? 'Both losses are still falling: stopping here underfits.' : e <= c.best + 3 ? `Near the best validation loss (epoch ${c.best}): this is where early stopping would keep the weights.` : `Training loss keeps falling, validation loss has been rising since about epoch ${c.best}: the model is memorising the training set.`}</p>`;
  }
  pills(document.getElementById('tc-setup'), Object.entries(TC_SETUPS).map(([k, s]) => [k, s.name]), key, (k) => { key = k; render(); });
  eS.addEventListener('input', render);
  render();
}

/* ---------- 9. plot: subgroup performance ---------- */
function initSG() {
  const svg = document.getElementById('sg-plot'), sS = document.getElementById('sg-share'), out = document.getElementById('sg-out');
  function render() {
    const sh = +sS.value / 100, st = SG_MODELS.map(m => sgStats(m, sh));
    document.getElementById('sg-share-val').textContent = sS.value + '%';
    svg.innerHTML = '';
    const L = 44, R = 450, T = 14, B = 210, Y = frame(svg, { L, R, T, B, yMin: 0, yMax: 1, yTicks: [0, 0.25, 0.5, 0.75, 1], yLabel: 'F1' });
    const cats = [['Group 1', st.map(s => s.groups[0].f1), (1 - sh) * 0.6], ['Group 2', st.map(s => s.groups[1].f1), (1 - sh) * 0.4], ['Group 3', st.map(s => s.groups[2].f1), sh], ['Overall', st.map(s => s.f1), 1]];
    const gw = (R - L) / 4, bw = 34;
    cats.forEach(([name, v, share], i) => {
      const x0 = L + i * gw + (gw - 2 * bw) / 2;
      if (i === 3) el('rect', { x: L + i * gw + 4, y: T, width: gw - 8, height: B - T, class: 'sg-over' }, svg);
      v.forEach((f, j) => { el('rect', { x: x0 + j * bw, y: Y(f), width: bw - 4, height: B - Y(f), class: j ? 'ev-b2' : 'ev-b1' }, svg); txt(svg, x0 + j * bw + (bw - 4) / 2, Y(f) - 4, f.toFixed(2), 'tick ev-vlab', 'middle'); });
      txt(svg, L + (i + 0.5) * gw, B + 16, name, 'tick ev-cat', 'middle');
      txt(svg, L + (i + 0.5) * gw, B + 30, i === 3 ? 'all data' : Math.round(share * 100) + '% of data', 'tick', 'middle');
    });
    const w = st[0].f1 > st[1].f1 ? 0 : 1;
    out.innerHTML = `<p>Overall F1: Model X <b>${f3(st[0].f1)}</b>, Model Y <b>${f3(st[1].f1)}</b>. On Group 3: X <b>${f3(st[0].groups[2].f1)}</b>, Y <b>${f3(st[1].groups[2].f1)}</b>.</p>
      <p class="note">${w === 1 ? `Ranked by the overall number, Model Y wins, even though it fails on Group 3. At ${sS.value}% of the data, Group 3 barely moves the average.` : 'Once Group 3 is a large enough share of the data, its failures pull Model Y\'s overall score below X.'}</p>`;
  }
  sS.addEventListener('input', render);
  render();
}

/* ---------- 9b. distribution shift ---------- */
function initShift() {
  const S = [0, 1, 2].map(i => document.getElementById('sh-' + i)), out = document.getElementById('sh-out');
  const test = SH_DOM.map(d => d[2] / 100), accT = test.reduce((s, w, i) => s + w * SH_DOM[i][1], 0);
  const bar = (w) => `<div class="sh-bar">${w.map((v, i) => v > 0.001 ? `<i class="d${i}" style="width:${(v * 100).toFixed(1)}%">${v >= 0.08 ? Math.round(v * 100) + '%' : ''}</i>` : '').join('')}</div>`;
  function render() {
    const raw = S.map(s => +s.value), tot = raw.reduce((a, b) => a + b, 0) || 1, w = raw.map(v => v / tot);
    S.forEach((s, i) => (document.getElementById(`sh-${i}-val`).textContent = Math.round(w[i] * 100) + '%'));
    const accD = w.reduce((s, v, i) => s + v * SH_DOM[i][1], 0);
    out.innerHTML = `
      <p class="sh-lab">Benchmark test set (IID with training)</p>${bar(test)}
      <p class="sh-lab">Deployment traffic</p>${bar(w)}
      <p class="bt-legend">${SH_DOM.map((d, i) => `<span class="k sh-k${i}"></span> ${d[0]} (accuracy ${d[1].toFixed(2)})`).join(' &nbsp; ')}</p>
      <p>Test-set accuracy = ${SH_DOM.map((d, i) => `${test[i].toFixed(2)}·${d[1].toFixed(2)}`).join(' + ')} = <b>${f3(accT)}</b></p>
      <p>Expected deployment accuracy = ${SH_DOM.map((d, i) => `${w[i].toFixed(2)}·${d[1].toFixed(2)}`).join(' + ')} = <b>${f3(accD)}</b></p>
      <p class="note">This assumes accuracy <i>within</i> each domain stays the same. New slang, new apps or new spam campaigns (drift inside a domain) would make deployment even worse.</p>`;
  }
  S.forEach(s => s.addEventListener('input', render));
  render();
}

/* ---------- 10. plot: contamination ---------- */
function initCT() {
  const svg = document.getElementById('ct-plot'), out = document.getElementById('ct-out'); let showO = false;
  function render() {
    svg.innerHTML = '';
    const L = 44, R = 450, T = 14, B = 210, Y = frame(svg, { L, R, T, B, yMin: 40, yMax: 100, yTicks: [40, 60, 80, 100], yLabel: 'score (%)' });
    const ser = [['before', 'ev-b3'], ['clean', 'ev-b1']].concat(showO ? [['over', 'ev-b2']] : []);
    const gw = (R - L) / CT_MODELS.length, bw = Math.min(30, (gw - 20) / ser.length);
    CT_MODELS.forEach((m, i) => {
      const x0 = L + i * gw + (gw - bw * ser.length) / 2;
      ser.forEach(([k, cls], j) => { el('rect', { x: x0 + j * bw, y: Y(m[k]), width: bw - 3, height: B - Y(m[k]), class: cls }, svg); txt(svg, x0 + j * bw + (bw - 3) / 2, Y(m[k]) - 4, m[k].toFixed(1), 'tick ev-vlab', 'middle'); });
      txt(svg, L + (i + 0.5) * gw, B + 18, m.name, 'tick ev-cat', 'middle');
    });
    const rk = (k) => CT_MODELS.map((m, i) => i).sort((a, b) => CT_MODELS[b][k] - CT_MODELS[a][k]).map(i => CT_MODELS[i].name.replace('Model ', 'M')).join(' > ');
    out.innerHTML = `<p>Ranking before: <b>${rk('before')}</b> · after deduplication: <b>${rk('clean')}</b></p>
      <p>Drop: ${CT_MODELS.map(m => `${m.name} ${(m.before - m.clean).toFixed(2)}`).join(' · ')} points</p>
      ${showO ? `<p class="note">The removed ${CT_OVER * 100}% of items are a little easier for every model, but Model 1 scores ${CT_MODELS[0].over}% on them versus ${CT_MODELS[0].clean}% on the rest: a gap that large is what memorisation would look like. Still evidence, not proof.</p>` : ''}`;
  }
  const b = document.getElementById('ct-show');
  b.addEventListener('click', () => { showO = !showO; b.classList.toggle('active', showO); b.textContent = showO ? 'Hide scores on removed items' : 'Show scores on the removed items'; document.getElementById('ct-leg-o').hidden = !showO; render(); });
  render();
}

/* ---------- 11. uncertainty: confidence intervals vs test-set size ---------- */
function initUnc() {
  const nS = document.getElementById('un-n'), svg = document.getElementById('un-plot'), out = document.getElementById('un-out');
  function render() {
    const n = Math.round(10 ** +nS.value), A = 0.82, Bv = 0.84, ca = wilson(A, n), cb = wilson(Bv, n), t = twoProp(A, Bv, n);
    document.getElementById('un-n-val').textContent = fmtN(n);
    svg.innerHTML = '';
    const L = 90, R = 440, X = (v) => L + (v - 0.7) / 0.25 * (R - L);
    [0.7, 0.75, 0.8, 0.85, 0.9, 0.95].forEach(v => { el('line', { x1: X(v), y1: 10, x2: X(v), y2: 110, class: 'grid-line' }, svg); txt(svg, X(v), 128, pc(v, 0), 'tick', 'middle'); });
    [['Model A', A, ca, 40, 'ev-b1'], ['Model B', Bv, cb, 80, 'ev-b2']].forEach(([name, p, ci, y, cls]) => {
      txt(svg, 12, y + 4, name, 'tick ev-cat');
      el('rect', { x: X(Math.max(0.7, ci[0])), y: y - 9, width: X(Math.min(0.95, ci[1])) - X(Math.max(0.7, ci[0])), height: 18, rx: 5, class: cls + ' un-ci' }, svg);
      el('circle', { cx: X(p), cy: y, r: 6, class: 'un-dot' }, svg);
    });
    const kA = Math.round(A * n), kB = Math.round(Bv * n);
    out.innerHTML = `<p>A: ${fmtN(kA)} / ${fmtN(n)} correct, 95% CI [${pc(ca[0])}, ${pc(ca[1])}] · B: ${fmtN(kB)} / ${fmtN(n)}, 95% CI [${pc(cb[0])}, ${pc(cb[1])}]</p>
      <p>Two-proportion z-test: z = <b>${t.z.toFixed(2)}</b>, p ≈ <b>${t.p < 1e-4 ? '< 0.0001' : t.p.toFixed(3)}</b></p>
      <p class="note">${t.p > 0.05 ? 'The intervals overlap heavily: a 2-point gap on this many examples is well within sampling noise.' : 'The difference is now statistically clear. Whether 2 points <i>matter</i> in practice is a separate question.'}</p>`;
  }
  nS.addEventListener('input', render);
  render();
}

/* ---------- 12. Cohen's kappa ---------- */
function initKappa() {
  const inp = ['a', 'b', 'c', 'd'].map(k => document.getElementById('ka-' + k)), out = document.getElementById('ka-out');
  function render() {
    const [a, b, c, d] = inp.map(i => Math.max(0, Math.round(+i.value || 0)));
    if (a + b + c + d === 0) { out.innerHTML = ''; return; }
    const k = kappa(a, b, c, d), n = k.n;
    out.innerHTML = `
      <p>Observed agreement p<sub>o</sub> = (${a} + ${d}) / ${n} = <b>${f3(k.po)}</b></p>
      <p>Chance agreement p<sub>e</sub> = ${f2((a + b) / n)}·${f2((a + c) / n)} + ${f2((c + d) / n)}·${f2((b + d) / n)} = <b>${f3(k.pe)}</b></p>
      <p class="big">κ = (p<sub>o</sub> − p<sub>e</sub>) / (1 − p<sub>e</sub>) = <b>${f3(k.k)}</b></p>
      <p class="note">${k.k < 0.2 ? 'Barely better than chance: the rubric (or the task) needs work.' : k.pe > 0.7 ? 'Raw agreement looks high, but when almost everything gets the same label, two annotators agree a lot by chance alone.' : 'Agreement well above chance.'}</p>`;
  }
  pills(document.getElementById('ka-presets'), Object.entries(KA_PRESETS).map(([k, p]) => [k, p.name]), 'balanced', (k) => { KA_PRESETS[k].v.forEach((v, i) => (inp[i].value = v)); render(); });
  inp.forEach(i => i.addEventListener('input', render));
  render();
}

/* ---------- init ---------- */
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
  initMath();
  initHero();
  initCM();
  initThreshold();
  initP1();
  initOverlap();
  initJudge();
  initMD();
  initTC();
  initSG();
  initShift();
  initCT();
  initUnc();
  initKappa();
});

if (typeof module !== 'undefined') module.exports = { clsMetrics, CM_PRESETS, thCounts, P1, p1Cost, bleu, rougeL, OV_SETS, judgeData, MD_SYS, mdRanks, tcCurves, sgStats, SG_MODELS, SH_DOM, CT_MODELS, wilson, twoProp, kappa, KA_PRESETS };
