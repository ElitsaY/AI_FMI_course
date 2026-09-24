/* ===== Lab 08 interactivity ===== */

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
const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtP = (v) => (v === 0 ? '0' : v < 1e-4 ? v.toExponential(2) : String(Number(v.toPrecision(3))));
const normal = (x, m, v) => Math.exp(-((x - m) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v);

/* ---------- maths rendering ---------- */
function initMath() {
  if (!window.renderMathInElement) return;
  renderMathInElement(document.body, {
    delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
    throwOnError: false,
  });
}

/* ---------- hero: envelopes, some flagged as spam ---------- */
function initHero() {
  const svg = document.getElementById('nb-hero-bg');
  const r = rng(8);
  for (let i = 0; i < 46; i++) {
    const x = r() * 1160 + 20, y = r() * 250 + 20, s = 18 + r() * 14, spam = r() < 0.4;
    const g = el('g', { class: spam ? 'env spam' : 'env', transform: `translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${((r() - 0.5) * 30).toFixed(0)})` }, svg);
    el('rect', { x: -s, y: -s * 0.65, width: 2 * s, height: 1.3 * s, rx: 3 }, g);
    el('path', { d: `M${-s},${-s * 0.65} L0,${s * 0.15} L${s},${-s * 0.65}` }, g);
  }
}

/* ---------- Bayes' theorem with 100 emails ---------- */
function initBayesGrid() {
  const grid = document.getElementById('bt-grid'), out = document.getElementById('bt-out');
  const [pS, lS, lH] = ['bt-prior', 'bt-ls', 'bt-lh'].map(id => document.getElementById(id));
  function render() {
    const prior = +pS.value, ls = +lS.value, lh = +lH.value;
    document.getElementById('bt-prior-val').textContent = prior.toFixed(2);
    document.getElementById('bt-ls-val').textContent = ls.toFixed(2);
    document.getElementById('bt-lh-val').textContent = lh.toFixed(2);
    const nSpam = Math.round(prior * 100), nHam = 100 - nSpam;
    const sFree = Math.round(ls * nSpam), hFree = Math.round(lh * nHam);
    let html = '';
    for (let i = 0; i < 100; i++) {
      const spam = i < nSpam;
      const free = spam ? i < sFree : (i - nSpam) < hFree;
      html += `<span class="bt-env${spam ? ' spam' : ''}${free ? ' free' : ''}" title="${spam ? 'spam' : 'ham'}${free ? ', contains “free”' : ''}"></span>`;
    }
    grid.innerHTML = html;
    const totalFree = sFree + hFree;
    const exact = (ls * prior) / (ls * prior + lh * (1 - prior) || 1);
    out.innerHTML = `
      <p class="bt-legend"><span class="k spam"></span> spam (${nSpam}) &nbsp; <span class="k ham"></span> ham (${nHam}) &nbsp; <span class="k dot"></span> contains “free”</p>
      <p>Emails that contain “free”: <b>${sFree}</b> spam + <b>${hFree}</b> ham = <b>${totalFree}</b></p>
      <p class="bt-big">P(spam | free) = ${sFree} / ${totalFree || 0} = <b>${totalFree ? (sFree / totalFree).toFixed(2) : '—'}</b></p>
      <p class="bt-formula">Bayes: P(free | spam) · P(spam) / P(free) = ${ls.toFixed(2)} · ${prior.toFixed(2)} / (${ls.toFixed(2)} · ${prior.toFixed(2)} + ${lh.toFixed(2)} · ${(1 - prior).toFixed(2)}) = <b>${Number.isFinite(exact) ? exact.toFixed(3) : '—'}</b></p>
      <p class="bt-note">Counting envelopes and using the formula give the same answer (up to rounding to whole emails). Notice how a small prior keeps the posterior low even when the word is much more common in spam.</p>`;
  }
  [pS, lS, lH].forEach(s => s.addEventListener('input', render));
  render();
}

/* ---------- d^n vs n·d ---------- */
function initComplexity() {
  const nS = document.getElementById('cx-n'), dS = document.getElementById('cx-d'), out = document.getElementById('cx-out');
  function render() {
    const n = +nS.value, d = +dS.value;
    document.getElementById('cx-n-val').textContent = n;
    document.getElementById('cx-d-val').textContent = d;
    const joint = d ** n, naive = n * d;
    const fmt = (v) => (v >= 1e7 ? v.toExponential(2).replace('e+', ' × 10^') : v.toLocaleString());
    const w = Math.max(1.5, Math.min(100, (Math.log10(naive + 1) / Math.log10(joint + 1)) * 100));
    out.innerHTML = `
      <div class="cx-row"><span class="cx-l">Full joint distribution: d<sup>n</sup></span><div class="cx-bar"><span class="joint" style="width:100%"></span></div><b>${fmt(joint)}</b></div>
      <div class="cx-row"><span class="cx-l">Naive Bayes: n · d</span><div class="cx-bar"><span class="naive" style="width:${w.toFixed(1)}%"></span></div><b>${naive}</b></div>
      <p class="cx-note">Probability values needed <b>per class</b> (bars on a log scale).</p>`;
  }
  [nS, dS].forEach(s => s.addEventListener('input', render));
  render();
}

/* ---------- the notebook's spam example ---------- */
function initSpamExample() {
  const P = { free: [0.30, 0.05], money: [0.25, 0.10], meeting: [0.05, 0.40] };
  const prior = [0.4, 0.6];
  const on = new Set(['free', 'money']);
  let mode = 'present';
  const out = document.getElementById('sp-out');
  function render() {
    document.querySelectorAll('.sp-word').forEach(b => b.classList.toggle('active', on.has(b.dataset.w)));
    const factors = [[], []];
    Object.entries(P).forEach(([w, [ps, ph]]) => {
      if (on.has(w)) { factors[0].push([`P(${w}|S)`, ps]); factors[1].push([`P(${w}|H)`, ph]); }
      else if (mode === 'bernoulli') { factors[0].push([`1 − P(${w}|S)`, 1 - ps]); factors[1].push([`1 − P(${w}|H)`, 1 - ph]); }
    });
    const score = [0, 1].map(c => factors[c].reduce((s, [, v]) => s * v, prior[c]));
    const post = score[0] / (score[0] + score[1]);
    const line = (c, name) => `${name}: ${prior[c]} × ${factors[c].map(([, v]) => v.toFixed(2)).join(' × ') || '(no words)'} = <b>${fmtP(score[c])}</b>`;
    const email = on.size ? [...on].map(w => `<span class="sp-chip">${w}</span>`).join(' ') : '<i>(empty email)</i>';
    out.innerHTML = `
      <p class="sp-email">✉️ New email: ${email}</p>
      <p class="sp-line spam">${line(0, 'Spam')}</p>
      <p class="sp-line ham">${line(1, 'Ham')}</p>
      <div class="nb-bar"><span class="spam" style="width:${(post * 100).toFixed(1)}%">spam ${(post * 100).toFixed(1)}%</span><span class="ham" style="width:${(100 - post * 100).toFixed(1)}%">ham ${(100 - post * 100).toFixed(1)}%</span></div>
      <p class="sp-decision">Decision: <b class="${score[0] > score[1] ? 'spam' : 'ham'}">${score[0] > score[1] ? 'Spam ✉️' : 'Ham 📬'}</b> <span>(${fmtP(score[0])} ${score[0] > score[1] ? '>' : '≤'} ${fmtP(score[1])}; the bar normalises the two scores so they sum to 1)</span></p>`;
  }
  document.querySelectorAll('.sp-word').forEach(b => b.addEventListener('click', () => {
    const w = b.dataset.w; on.has(w) ? on.delete(w) : on.add(w); render();
  }));
  document.querySelectorAll('.sp-mode').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.sp-mode').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); mode = b.dataset.m; render();
  }));
  render();
}

/* ---------- train a (multinomial) spam filter with Laplace smoothing ---------- */
const TRAIN = [
  ['win free money now', 'spam'],
  ['free prize claim your money', 'spam'],
  ['cheap meds free shipping', 'spam'],
  ['urgent claim your free prize now', 'spam'],
  ['make money fast from home', 'spam'],
  ['meeting tomorrow at ten', 'ham'],
  ['lunch meeting with the team', 'ham'],
  ['please review the project report', 'ham'],
  ['can we move our meeting to friday', 'ham'],
  ['the report is ready for review', 'ham'],
  ['see you at lunch tomorrow', 'ham'],
];
function initTrainer() {
  const list = document.getElementById('tr-list'), input = document.getElementById('tr-input');
  const aS = document.getElementById('tr-alpha'), out = document.getElementById('tr-out');
  const tokenize = (s) => s.toLowerCase().match(/[a-z']+/g) || [];
  const classes = ['spam', 'ham'];
  const counts = { spam: {}, ham: {} }, totals = { spam: 0, ham: 0 }, docs = { spam: 0, ham: 0 };
  TRAIN.forEach(([t, c]) => { docs[c]++; tokenize(t).forEach(w => { counts[c][w] = (counts[c][w] || 0) + 1; totals[c]++; }); });
  const vocab = new Set(Object.keys(counts.spam).concat(Object.keys(counts.ham)));
  const V = vocab.size;
  list.innerHTML = `<div class="tr-cols">${classes.map(c => `<div><h5>${c === 'spam' ? '✉️ Spam' : '📬 Ham'} — ${docs[c]} emails, ${totals[c]} words</h5>${TRAIN.filter(t => t[1] === c).map(([t]) => `<span class="tr-email ${c}">${t}</span>`).join('')}</div>`).join('')}</div>
    <p class="tr-meta">Priors: P(spam) = ${docs.spam}/${TRAIN.length} = ${(docs.spam / TRAIN.length).toFixed(3)}, P(ham) = ${docs.ham}/${TRAIN.length} = ${(docs.ham / TRAIN.length).toFixed(3)} · vocabulary size V = ${V}</p>`;

  function render() {
    const alpha = +aS.value;
    document.getElementById('tr-alpha-val').textContent = alpha.toFixed(1);
    const words = tokenize(input.value);
    const known = words.filter(w => vocab.has(w)), unknown = [...new Set(words.filter(w => !vocab.has(w)))];
    const prob = (w, c) => { const den = totals[c] + alpha * V; return den ? ((counts[c][w] || 0) + alpha) / den : 0; };
    const logScore = {}, score = {};
    classes.forEach(c => {
      const prior = docs[c] / TRAIN.length;
      score[c] = known.reduce((s, w) => s * prob(w, c), prior);
      logScore[c] = known.reduce((s, w) => s + Math.log(prob(w, c)), Math.log(prior));
    });
    const tot = score.spam + score.ham, post = tot ? score.spam / tot : 0.5;
    const rows = known.map(w => {
      const ps = prob(w, 'spam'), ph = prob(w, 'ham');
      const cell = (c, p) => `<td class="${p === 0 ? 'zero' : ''}">(${counts[c][w] || 0} + ${alpha.toFixed(1)}) / (${totals[c]} + ${alpha.toFixed(1)}·${V}) = <b>${fmtP(p)}</b></td>`;
      return `<tr><td><b>${esc(w)}</b></td>${cell('spam', ps)}${cell('ham', ph)}</tr>`;
    }).join('');
    const logTxt = (c) => (Number.isFinite(logScore[c]) ? logScore[c].toFixed(2) : '−∞');
    const bothZero = score.spam === 0 && score.ham === 0;
    const verdict = bothZero ? '<b>Undecided</b> — both scores are 0'
      : score.spam > score.ham ? '<b class="spam">Spam ✉️</b>' : '<b class="ham">Ham 📬</b>';
    const zeroWords = (c) => [...new Set(known.filter(w => prob(w, c) === 0))];
    const zs = zeroWords('spam'), zh = zeroWords('ham');
    const culprits = [zs.length ? `spam is 0 because of ${zs.map(w => `“${esc(w)}”`).join(', ')} (never seen in spam)` : '', zh.length ? `ham is 0 because of ${zh.map(w => `“${esc(w)}”`).join(', ')} (never seen in ham)` : ''].filter(Boolean).join('; ');
    const zeroMsg = culprits
      ? `<p class="bv-verdict over">⚠️ <b>Zero-probability problem</b>: ${culprits}. A single zero makes the whole product 0, so all the other words are ignored${bothZero ? ' — here both classes collapse and the classifier cannot decide at all' : ''}. Increase α.</p>` : '';
    out.innerHTML = `
      ${known.length ? `<div class="table-wrap"><table class="summary tr-table"><thead><tr><th>Word</th><th>P(word | spam)</th><th>P(word | ham)</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="tr-meta">None of the words are in the training vocabulary.</p>'}
      ${unknown.length ? `<p class="tr-meta">Not in the training vocabulary (ignored): ${unknown.map(w => `<span class="sp-chip grey">${esc(w)}</span>`).join(' ')}</p>` : ''}
      <p class="sp-line spam">Spam score: P(spam) · ∏ P(word | spam) = <b>${fmtP(score.spam)}</b> &nbsp;·&nbsp; log-score = ${logTxt('spam')}</p>
      <p class="sp-line ham">Ham score: P(ham) · ∏ P(word | ham) = <b>${fmtP(score.ham)}</b> &nbsp;·&nbsp; log-score = ${logTxt('ham')}</p>
      ${bothZero ? '' : `<div class="nb-bar"><span class="spam" style="width:${(post * 100).toFixed(1)}%">spam ${(post * 100).toFixed(1)}%</span><span class="ham" style="width:${(100 - post * 100).toFixed(1)}%">ham ${(100 - post * 100).toFixed(1)}%</span></div>`}
      <p class="sp-decision">Decision: ${verdict}</p>
      ${zeroMsg}`;
  }
  input.addEventListener('input', render);
  aS.addEventListener('input', render);
  document.querySelectorAll('.tr-sample').forEach(b => b.addEventListener('click', () => { input.value = b.textContent; render(); }));
  render();
}

/* ---------- Gaussian NB, one feature ---------- */
const G1 = { spam: { m: 35, v: 29.6 }, ham: { m: 10, v: 11.6 } };
function initGaussian1D() {
  const svg = document.getElementById('g1-plot'), xS = document.getElementById('g1-x'), pS = document.getElementById('g1-p'), out = document.getElementById('g1-out');
  const X = (x) => 40 + x * 6.8, maxY = 0.6 * normal(10, 10, 11.6);
  const Y = (y) => 250 - (y / maxY) * 220, YP = (p) => 250 - p * 220;
  function render() {
    const x = +xS.value, prior = +pS.value;
    document.getElementById('g1-x-val').textContent = x;
    document.getElementById('g1-p-val').textContent = prior.toFixed(2);
    svg.innerHTML = '';
    el('line', { x1: 40, y1: 250, x2: 450, y2: 250, class: 'axis' }, svg);
    [0, 10, 20, 30, 40, 50, 60].forEach(v => txt(svg, X(v), 266, v, 'tick', 'middle'));
    txt(svg, 245, 288, '% capital letters', 'tick', 'middle');
    txt(svg, 452, YP(1) + 4, 'P(spam|x) = 1', 'tick', 'end');
    el('line', { x1: 40, y1: YP(1), x2: 450, y2: YP(1), class: 'grid-line dashed' }, svg);
    const curve = (f, cls) => el('path', { d: Array.from({ length: 241 }, (_, i) => { const xx = i / 4; return `${i ? 'L' : 'M'}${X(xx).toFixed(1)},${f(xx).toFixed(1)}`; }).join(''), class: cls }, svg);
    curve((xx) => Y(prior * normal(xx, G1.spam.m, G1.spam.v)), 'g-spam');
    curve((xx) => Y((1 - prior) * normal(xx, G1.ham.m, G1.ham.v)), 'g-ham');
    curve((xx) => { const s = prior * normal(xx, G1.spam.m, G1.spam.v), h = (1 - prior) * normal(xx, G1.ham.m, G1.ham.v); return YP(s / (s + h)); }, 'g-post');
    const s = prior * normal(x, G1.spam.m, G1.spam.v), h = (1 - prior) * normal(x, G1.ham.m, G1.ham.v), post = s / (s + h);
    el('line', { x1: X(x), y1: 20, x2: X(x), y2: 250, class: 'guide' }, svg);
    el('circle', { cx: X(x), cy: Y(s), r: 5, class: 'cls1' }, svg);
    el('circle', { cx: X(x), cy: Y(h), r: 5, class: 'cls0' }, svg);
    el('circle', { cx: X(x), cy: YP(post), r: 5, class: 'g-post-dot' }, svg);
    out.innerHTML = `
      <p class="sp-line spam">Spam: ${prior.toFixed(2)} × 𝒩(${x}; 35, 29.6) = ${prior.toFixed(2)} × ${fmtP(normal(x, 35, 29.6))} = <b>${fmtP(s)}</b></p>
      <p class="sp-line ham">Ham: ${(1 - prior).toFixed(2)} × 𝒩(${x}; 10, 11.6) = ${(1 - prior).toFixed(2)} × ${fmtP(normal(x, 10, 11.6))} = <b>${fmtP(h)}</b></p>
      <p class="bt-big">P(spam | x) = <b>${post.toFixed(3)}</b> → <b class="${post > 0.5 ? 'spam' : 'ham'}">${post > 0.5 ? 'Spam' : 'Ham'}</b></p>
      <p class="bt-legend"><span class="k spam"></span> P(spam)·𝒩(x | spam) &nbsp; <span class="k ham"></span> P(ham)·𝒩(x | ham) &nbsp; <span class="k post"></span> posterior</p>`;
  }
  [xS, pS].forEach(s => s.addEventListener('input', render));
  render();
}

/* ---------- Gaussian NB, two features ---------- */
function initGaussian2D() {
  const svg = document.getElementById('g2-plot'), params = document.getElementById('g2-params'), out = document.getElementById('g2-out');
  let seed = 4, data, model, query = null;
  const X = (v) => 45 + v * 6.2, Y = (v) => 340 - v * 30;       // caps % ∈ [0, 60], links ∈ [0, 11]
  const invX = (px) => (px - 45) / 6.2, invY = (py) => (340 - py) / 30;
  function makeData() {
    const r = rng(seed), pts = [];
    for (let i = 0; i < 30; i++) pts.push([Math.max(1, 34 + gauss(r) * 9), Math.max(0.2, 6 + gauss(r) * 1.8), 'spam']);
    for (let i = 0; i < 45; i++) pts.push([Math.max(0.5, 11 + gauss(r) * 5), Math.max(0.1, 2 + gauss(r) * 1.2), 'ham']);
    return pts;
  }
  function fit() {
    const m = {};
    ['spam', 'ham'].forEach(c => {
      const pts = data.filter(p => p[2] === c), n = pts.length;
      const mu = [0, 1].map(j => pts.reduce((s, p) => s + p[j], 0) / n);
      const va = [0, 1].map(j => pts.reduce((s, p) => s + (p[j] - mu[j]) ** 2, 0) / n);
      m[c] = { prior: n / data.length, mu, va };
    });
    return m;
  }
  const score = (p, c) => model[c].prior * normal(p[0], model[c].mu[0], model[c].va[0]) * normal(p[1], model[c].mu[1], model[c].va[1]);
  const postSpam = (p) => { const s = score(p, 'spam'), h = score(p, 'ham'); return s + h ? s / (s + h) : 0.5; };

  function render() {
    svg.innerHTML = '';
    const N = 36, cw = 375 / N, ch = 330 / N;
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
      const p = [invX(45 + (a + 0.5) * cw), invY(10 + (b + 0.5) * ch)];
      const ps = postSpam(p);
      el('rect', { x: 45 + a * cw, y: 10 + b * ch, width: cw + 0.5, height: ch + 0.5, class: ps > 0.5 ? 'shade1' : 'shade0', style: `opacity:${(Math.abs(ps - 0.5) * 0.55).toFixed(3)}` }, svg);
    }
    ['spam', 'ham'].forEach(c => [1, 2].forEach(k => el('ellipse', {
      cx: X(model[c].mu[0]), cy: Y(model[c].mu[1]), rx: k * Math.sqrt(model[c].va[0]) * 6.2, ry: k * Math.sqrt(model[c].va[1]) * 30, class: `g-ell ${c}`,
    }, svg)));
    el('line', { x1: 45, y1: 340, x2: 420, y2: 340, class: 'axis' }, svg);
    el('line', { x1: 45, y1: 340, x2: 45, y2: 10, class: 'axis' }, svg);
    [0, 20, 40, 60].forEach(v => txt(svg, X(v), 356, v, 'tick', 'middle'));
    [0, 5, 10].forEach(v => txt(svg, 38, Y(v) + 4, v, 'tick', 'end'));
    txt(svg, 232, 374, '% capital letters', 'tick', 'middle');
    txt(svg, 14, 175, 'number of links', 'tick', 'middle', { transform: 'rotate(-90 14 175)' });
    data.forEach(([a, b, c]) => el('circle', { cx: X(a), cy: Y(b), r: 4.5, class: c === 'spam' ? 'cls1' : 'cls0' }, svg));
    ['spam', 'ham'].forEach(c => el('path', { d: `M${X(model[c].mu[0]) - 7},${Y(model[c].mu[1])} h14 M${X(model[c].mu[0])},${Y(model[c].mu[1]) - 7} v14`, class: `g-mu ${c}` }, svg));

    params.innerHTML = `<div class="table-wrap"><table class="summary tr-table">
      <thead><tr><th>Class</th><th>Prior</th><th>μ caps %</th><th>σ² caps %</th><th>μ links</th><th>σ² links</th></tr></thead>
      <tbody>${['spam', 'ham'].map(c => `<tr data-s="${c === 'spam' ? 'dfs' : 'ids'}"><td><b>${c}</b></td><td>${model[c].prior.toFixed(2)}</td><td>${model[c].mu[0].toFixed(1)}</td><td>${model[c].va[0].toFixed(1)}</td><td>${model[c].mu[1].toFixed(2)}</td><td>${model[c].va[1].toFixed(2)}</td></tr>`).join('')}</tbody>
    </table></div>`;

    if (query) {
      const s = score(query, 'spam'), h = score(query, 'ham'), post = s / (s + h);
      el('circle', { cx: X(query[0]), cy: Y(query[1]), r: 8, class: 'g-q ' + (post > 0.5 ? 'spam' : 'ham') }, svg);
      const f = (c, j) => fmtP(normal(query[j], model[c].mu[j], model[c].va[j]));
      out.innerHTML = `
        <p class="sp-email">✉️ New email: <b>${query[0].toFixed(1)} %</b> capitals, <b>${query[1].toFixed(1)}</b> links</p>
        <p class="sp-line spam">Spam: ${model.spam.prior.toFixed(2)} × ${f('spam', 0)} × ${f('spam', 1)} = <b>${fmtP(s)}</b></p>
        <p class="sp-line ham">Ham: ${model.ham.prior.toFixed(2)} × ${f('ham', 0)} × ${f('ham', 1)} = <b>${fmtP(h)}</b></p>
        <p class="bt-big">P(spam | x) = <b>${post.toFixed(3)}</b> → <b class="${post > 0.5 ? 'spam' : 'ham'}">${post > 0.5 ? 'Spam' : 'Ham'}</b></p>`;
    } else out.innerHTML = '<p class="tr-meta">Click the plot to classify a new email. The + marks are the class means; the ellipses are 1σ and 2σ.</p>';
  }
  function load() { data = makeData(); model = fit(); query = null; render(); }
  svg.addEventListener('click', (e) => {
    const p = svgPoint(svg, e);
    query = [Math.max(0, Math.min(60, invX(p.x))), Math.max(0, Math.min(11, invY(p.y)))];
    render();
  });
  document.getElementById('g2-new').addEventListener('click', () => { seed++; load(); });
  load();
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initMath();
  initHero();
  initBayesGrid();
  initComplexity();
  initSpamExample();
  initTrainer();
  initGaussian1D();
  initGaussian2D();
});
