/* ===== Lab 06 interactivity ===== */

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
  if (parent) parent.appendChild(e);
  return e;
}
// small seeded RNG so the "lab" datasets look the same for everyone
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function gauss(r) { const u = Math.max(r(), 1e-9), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const CLUSTER_COLORS = ['var(--dfs)', 'var(--bfs)', 'var(--ucs)', 'var(--ids)', 'var(--pink)', '#a855c7'];

/* ---------- hero backdrop: a faint scatter plot with a fitted curve ---------- */
function initHero() {
  const svg = document.getElementById('ml-hero-bg');
  const r = rng(11);
  for (let i = 0; i < 70; i++) {
    const x = r() * 1200, y = 150 - 70 * Math.sin(x / 190) + gauss(r) * 28;
    el('circle', { cx: x.toFixed(0), cy: y.toFixed(0), r: 4 + r() * 3, class: `pt c${i % 4}` }, svg);
  }
  const d = Array.from({ length: 121 }, (_, i) => { const x = i * 10; return `${i ? 'L' : 'M'}${x},${(150 - 70 * Math.sin(x / 190)).toFixed(1)}`; }).join('');
  el('path', { d, class: 'fit' }, svg);
}

/* ---------- least squares with a Legendre basis (well conditioned on [-1, 1]) ---------- */
function legendre(x, deg) {
  const p = [1, x];
  for (let n = 1; n < deg; n++) p.push(((2 * n + 1) * x * p[n] - n * p[n - 1]) / (n + 1));
  return p.slice(0, deg + 1);
}
function solve(A, b) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c || !M[c][c]) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1));
}
function fitPoly(xs, ys, deg) {
  const k = deg + 1;
  const A = Array.from({ length: k }, () => Array(k).fill(0)), b = Array(k).fill(0);
  xs.forEach((x, i) => {
    const phi = legendre(x, deg);
    for (let r = 0; r < k; r++) { b[r] += phi[r] * ys[i]; for (let c = 0; c < k; c++) A[r][c] += phi[r] * phi[c]; }
  });
  for (let r = 0; r < k; r++) A[r][r] += 1e-9; // tiny ridge for numerical safety
  const w = solve(A, b);
  return (x) => legendre(x, deg).reduce((s, v, i) => s + v * w[i], 0);
}
const mse = (f, xs, ys) => xs.reduce((s, x, i) => s + (f(x) - ys[i]) ** 2, 0) / xs.length;

/* ---------- bias–variance playground ---------- */
function initBiasVariance() {
  const plot = document.getElementById('bv-plot');
  const curve = document.getElementById('bv-curve');
  const degSlider = document.getElementById('bv-deg');
  const varBtn = document.getElementById('bv-var');
  const truth = (x) => 0.9 * Math.sin(2.6 * x) + 0.35 * x;
  const NOISE = 0.3, N_TRAIN = 14;
  let r = rng(7), train, showVar = false;
  const tr = rng(99);
  const test = Array.from({ length: 200 }, () => { const x = tr() * 2 - 1; return [x, truth(x) + gauss(tr) * NOISE]; });

  const sample = (rand) => {
    const xs = Array.from({ length: N_TRAIN }, (_, i) => -1 + (2 * (i + 0.5)) / N_TRAIN + (rand() - 0.5) * 0.08);
    return { xs, ys: xs.map(x => truth(x) + gauss(rand) * NOISE) };
  };
  const X = (x) => 40 + (x + 1) * 230, Y = (y) => 170 - y * 70;
  const curvePath = (f) => Array.from({ length: 201 }, (_, i) => { const x = -1 + i / 100; return `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(Math.max(-2.4, Math.min(2.4, f(x)))).toFixed(1)}`; }).join('');

  function render() {
    const deg = +degSlider.value;
    document.getElementById('bv-deg-val').textContent = deg;
    const f = fitPoly(train.xs, train.ys, deg);
    plot.innerHTML = '';
    const defs = el('defs', {}, plot);
    const clip = el('clipPath', { id: 'bv-clip' }, defs);
    el('rect', { x: 40, y: 10, width: 460, height: 320 }, clip);
    el('line', { x1: 40, y1: 330, x2: 500, y2: 330, class: 'axis' }, plot);
    el('line', { x1: 40, y1: 10, x2: 40, y2: 330, class: 'axis' }, plot);
    const g = el('g', { 'clip-path': 'url(#bv-clip)' }, plot);
    test.forEach(([x, y]) => el('circle', { cx: X(x), cy: Y(y), r: 2.2, class: 'test-pt' }, g));
    el('path', { d: curvePath(truth), class: 'truth' }, g);
    if (showVar) {
      const vr = rng(1234);
      for (let s = 0; s < 10; s++) { const sm = sample(vr); el('path', { d: curvePath(fitPoly(sm.xs, sm.ys, deg)), class: 'fit ghost' }, g); }
    }
    el('path', { d: curvePath(f), class: 'fit' }, g);
    train.xs.forEach((x, i) => el('circle', { cx: X(x), cy: Y(train.ys[i]), r: 5.5, class: 'train-pt' }, g));

    const trainErr = mse(f, train.xs, train.ys), testErr = mse(f, test.map(p => p[0]), test.map(p => p[1]));
    document.getElementById('bv-train').textContent = trainErr.toFixed(3);
    document.getElementById('bv-test').textContent = testErr > 99 ? '>99' : testErr.toFixed(3);

    // error curve for every degree on this training sample
    const errs = Array.from({ length: 13 }, (_, d) => {
      const fd = fitPoly(train.xs, train.ys, d);
      return [mse(fd, train.xs, train.ys), mse(fd, test.map(p => p[0]), test.map(p => p[1]))];
    });
    const best = errs.reduce((bi, e, i) => (e[1] < errs[bi][1] ? i : bi), 0);
    const verdict = document.getElementById('bv-verdict');
    const nearBest = testErr <= errs[best][1] * 1.2;
    if (!nearBest && deg < best) { verdict.innerHTML = '⬇️ <b>Underfitting</b> — too simple: high bias, low variance. Both errors are high.'; verdict.className = 'bv-verdict under'; }
    else if (!nearBest && deg > best) { verdict.innerHTML = '⬆️ <b>Overfitting</b> — the curve chases the noise: low bias, high variance. Training error is tiny, test error grows.'; verdict.className = 'bv-verdict over'; }
    else { verdict.innerHTML = `✅ <b>Near the sweet spot</b> — the lowest test error for this sample is at degree ${best}.`; verdict.className = 'bv-verdict ok'; }

    curve.innerHTML = '';
    const cx = (d) => 20 + d * 22, cy = (v) => 130 - Math.min(1, (Math.log10(Math.max(v, 0.01)) + 2) / 3) * 115;
    el('line', { x1: 20, y1: 130, x2: 288, y2: 130, class: 'axis' }, curve);
    el('line', { x1: cx(deg), y1: 8, x2: cx(deg), y2: 130, class: 'deg-mark' }, curve);
    el('polyline', { points: errs.map((e, d) => `${cx(d)},${cy(e[0]).toFixed(1)}`).join(' '), class: 'err-train' }, curve);
    el('polyline', { points: errs.map((e, d) => `${cx(d)},${cy(e[1]).toFixed(1)}`).join(' '), class: 'err-test' }, curve);
    const lbl = el('text', { x: 288, y: 146, class: 'tick', 'text-anchor': 'end' }, curve); lbl.textContent = 'degree →';
    const lbl2 = el('text', { x: 20, y: 146, class: 'tick' }, curve); lbl2.textContent = '0';
  }

  function newSample() { train = sample(r); render(); }
  degSlider.addEventListener('input', render);
  varBtn.addEventListener('click', () => { showVar = !showVar; varBtn.classList.toggle('active', showVar); render(); });
  document.getElementById('bv-new').addEventListener('click', newSample);
  newSample();
}

/* ---------- linear regression playground ---------- */
function initLinReg() {
  const plot = document.getElementById('lr-plot');
  const wS = document.getElementById('lr-w'), bS = document.getElementById('lr-b');
  const data = [[1, 38], [1.8, 50], [2.5, 41], [3.2, 58], [3.8, 47], [4.6, 55], [5.2, 70], [6.3, 66], [7.1, 60], [8.2, 71], [8.8, 82], [9.5, 76]];
  const X = (x) => 50 + x * 45, Y = (y) => 290 - y * 2.8;
  const n = data.length, mx = data.reduce((s, d) => s + d[0], 0) / n, my = data.reduce((s, d) => s + d[1], 0) / n;
  const wOpt = data.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / data.reduce((s, [x]) => s + (x - mx) ** 2, 0);
  const bOpt = my - wOpt * mx;
  const sse = (w, b) => data.reduce((s, [x, y]) => s + (y - (w * x + b)) ** 2, 0);
  const minSSE = sse(wOpt, bOpt);

  function render() {
    const w = +wS.value, b = +bS.value;
    document.getElementById('lr-w-val').textContent = w.toFixed(2);
    document.getElementById('lr-b-val').textContent = b.toFixed(1);
    plot.innerHTML = '';
    el('line', { x1: 50, y1: 290, x2: 510, y2: 290, class: 'axis' }, plot);
    el('line', { x1: 50, y1: 290, x2: 50, y2: 10, class: 'axis' }, plot);
    el('text', { x: 280, y: 314, class: 'tick', 'text-anchor': 'middle' }, plot).textContent = 'Experience (years)';
    el('text', { x: 14, y: 150, class: 'tick', 'text-anchor': 'middle', transform: 'rotate(-90 14 150)' }, plot).textContent = 'Salary (k$)';
    const clip = el('clipPath', { id: 'lr-clip' }, el('defs', {}, plot));
    el('rect', { x: 50, y: 0, width: 470, height: 290 }, clip);
    const g = el('g', { 'clip-path': 'url(#lr-clip)' }, plot);
    data.forEach(([x, y]) => el('line', { x1: X(x), y1: Y(y), x2: X(x), y2: Y(w * x + b), class: 'resid' }, g));
    el('line', { x1: X(0), y1: Y(b), x2: X(10), y2: Y(w * 10 + b), class: 'reg-line' }, g);
    data.forEach(([x, y]) => el('path', { d: `M${X(x) - 6},${Y(y)} h12 M${X(x)},${Y(y) - 6} v12`, class: 'reg-pt' }, g));
    const e = sse(w, b);
    document.getElementById('lr-sse').textContent = Math.round(e).toLocaleString();
    document.getElementById('lr-eq').innerHTML = `ŷ = ${w.toFixed(1)} · x + ${b.toFixed(1)}<br><span>${e - minSSE < minSSE * 0.002 ? '✅ This is the least-squares line — no other line has a smaller sum.' : `The minimum possible is ${Math.round(minSSE).toLocaleString()} (slope ${wOpt.toFixed(1)}, intercept ${bOpt.toFixed(1)}).`}</span>`;
  }

  let anim = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('lr-fit').addEventListener('click', () => {
    clearInterval(anim);
    const w0 = +wS.value, b0 = +bS.value, t0 = performance.now();
    const step = () => {
      const k = reduceMotion ? 1 : Math.min(1, (performance.now() - t0) / 700), e = 1 - (1 - k) ** 3;
      wS.value = w0 + (wOpt - w0) * e; bS.value = b0 + (bOpt - b0) * e;
      render();
      if (k >= 1) clearInterval(anim);
    };
    anim = setInterval(step, 16);
    step();
  });
  [wS, bS].forEach(s => s.addEventListener('input', () => { clearInterval(anim); render(); }));
  render();
}

/* ---------- K-nearest neighbours ---------- */
function initKNN() {
  const svg = document.getElementById('knn-plot');
  const kS = document.getElementById('knn-k');
  // same layout as the lecture figure (red vs blue), in the figure's own coordinates
  const pts = [
    ...[[118, 145], [317, 102], [104, 258], [184, 212], [413, 228], [419, 273], [240, 325], [328, 349], [158, 370], [506, 204], [632, 321]].map(p => [...p, 'red']),
    ...[[260, 186], [341, 193], [225, 250], [322, 284], [523, 303], [559, 348], [510, 363]].map(p => [...p, 'blue']),
  ];
  let q = [296, 232];

  function render() {
    const K = +kS.value;
    document.getElementById('knn-k-val').textContent = K;
    document.querySelectorAll('.knn-preset').forEach(b => b.classList.toggle('active', +b.dataset.k === K));
    const sorted = pts.map(p => ({ p, d: Math.hypot(p[0] - q[0], p[1] - q[1]) })).sort((a, b) => a.d - b.d);
    const nb = sorted.slice(0, K);
    const radius = nb[nb.length - 1].d + 14;
    svg.innerHTML = '';
    el('line', { x1: 60, y1: 450, x2: 780, y2: 450, class: 'axis' }, svg);
    el('line', { x1: 60, y1: 450, x2: 60, y2: 20, class: 'axis' }, svg);
    el('rect', { x: 60, y: 20, width: 720, height: 430, fill: 'transparent', class: 'knn-hit' }, svg);
    el('circle', { cx: q[0], cy: q[1], r: radius, class: 'knn-radius' }, svg);
    const t = el('text', { x: q[0] + radius * 0.6, y: q[1] - radius * 0.8, class: 'knn-klabel' }, svg); t.textContent = `K = ${K}`;
    nb.forEach(({ p }) => el('line', { x1: q[0], y1: q[1], x2: p[0], y2: p[1], class: 'knn-link' }, svg));
    pts.forEach(p => {
      const isNb = nb.some(n => n.p === p);
      el('circle', { cx: p[0], cy: p[1], r: 13, class: `knn-pt ${p[2]}${isNb ? ' nb' : ''}` }, svg);
    });
    const red = nb.filter(n => n.p[2] === 'red').length, blue = K - red;
    const cls = red > blue ? 'red' : blue > red ? 'blue' : 'tie';
    el('circle', { cx: q[0], cy: q[1], r: 14, class: `knn-query ${cls}` }, svg);
    document.getElementById('knn-red').textContent = red;
    document.getElementById('knn-blue').textContent = blue;
    const v = document.getElementById('knn-verdict');
    v.innerHTML = cls === 'tie' ? `🤝 <b>Tie</b> (${red} vs ${blue}) — this is why an odd K is often preferred for two classes.`
      : `Majority vote → the new point is classified as <b>${cls}</b> (${Math.max(red, blue)} of ${K}).`;
    v.className = `bv-verdict knn-${cls}`;
  }

  svg.addEventListener('click', (e) => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    q = [Math.max(70, Math.min(770, p.x)), Math.max(30, Math.min(440, p.y))];
    render();
  });
  kS.addEventListener('input', render);
  document.querySelectorAll('.knn-preset').forEach(b => b.addEventListener('click', () => { kS.value = b.dataset.k; render(); }));
  render();
}

/* ---------- naive Bayes calculator ---------- */
function initNaiveBayes() {
  const ids = ['nb-ps', 'nb-f-s', 'nb-a-s', 'nb-f-h', 'nb-a-h'];
  const out = document.getElementById('nb-out');
  function render() {
    const [ps, fs, as, fh, ah] = ids.map(id => Math.min(1, Math.max(0, +document.getElementById(id).value || 0)));
    const spam = fs * as * ps, ham = fh * ah * (1 - ps), total = spam + ham;
    const p = total ? spam / total : 0;
    out.innerHTML = `
      <div class="nb-line">P(FMI | spam) · P(AI | spam) · P(spam) = ${fs} · ${as} · ${ps} = <b>${spam.toFixed(4)}</b></div>
      <div class="nb-line">P(FMI | not spam) · P(AI | not spam) · P(not spam) = ${fh} · ${ah} · ${(1 - ps).toFixed(2)} = <b>${ham.toFixed(4)}</b></div>
      <div class="nb-line">P(spam | FMI, AI) = ${spam.toFixed(4)} / (${spam.toFixed(4)} + ${ham.toFixed(4)}) = <b class="nb-res">${total ? (p * 100).toFixed(1) + '%' : '—'}</b></div>
      <div class="nb-bar"><span class="spam" style="width:${(p * 100).toFixed(1)}%">spam</span><span class="ham" style="width:${(100 - p * 100).toFixed(1)}%">not spam</span></div>
      <p class="nb-note">The denominator P(FMI, AI) is the same for both classes, so we only need to normalise the two numerators.</p>`;
  }
  ids.forEach(id => document.getElementById(id).addEventListener('input', render));
  render();
}

/* ---------- K-means ---------- */
function initKMeans() {
  const svg = document.getElementById('km-plot');
  const kS = document.getElementById('km-k');
  const log = document.getElementById('km-log');
  const playBtn = document.getElementById('km-play');
  let data, centers, assign, trails, iter, phase, logLines, timer = null, dataSeed = 5;

  function newData() {
    const r = rng(dataSeed++);
    const blobs = Array.from({ length: 3 + Math.floor(r() * 2) }, () => [80 + r() * 360, 60 + r() * 240]);
    data = [];
    blobs.forEach(([cx, cy]) => { for (let i = 0; i < 22; i++) data.push([cx + gauss(r) * 32, cy + gauss(r) * 32]); });
    data = data.map(([x, y]) => [Math.max(15, Math.min(505, x)), Math.max(15, Math.min(345, y))]);
  }
  function reset() {
    stop();
    const K = +kS.value;
    centers = null; assign = data.map(() => -1); trails = []; iter = 0; phase = 'init';
    logLines = [`${data.length} unlabeled points. Press ⏭ to pick ${K} random centres.`];
    render();
  }
  const nearest = (p) => centers.reduce((bi, c, i) => (Math.hypot(p[0] - c[0], p[1] - c[1]) < Math.hypot(p[0] - centers[bi][0], p[1] - centers[bi][1]) ? i : bi), 0);

  function step() {
    const K = +kS.value;
    if (phase === 'init') {
      const idx = [];
      while (idx.length < K) { const i = Math.floor(Math.random() * data.length); if (!idx.includes(i)) idx.push(i); }
      centers = idx.map(i => [...data[i]]);
      trails = centers.map(c => [[...c]]);
      phase = 'assign';
      logLines.push(`Initialise: ${K} random points become the cluster centres.`);
    } else if (phase === 'assign') {
      const next = data.map(nearest);
      const changed = next.filter((a, i) => a !== assign[i]).length;
      assign = next; iter++;
      if (changed === 0 && iter > 1) { phase = 'done'; logLines.push(`Iteration ${iter}: no point changed cluster → the centres are stable. Converged! ✅`); }
      else { phase = 'update'; logLines.push(`Iteration ${iter} — assign: every point joins its closest centre (${changed} changed).`); }
    } else if (phase === 'update') {
      let moved = 0;
      centers = centers.map((c, k) => {
        const mine = data.filter((_, i) => assign[i] === k);
        if (!mine.length) return c;
        const m = [mine.reduce((s, p) => s + p[0], 0) / mine.length, mine.reduce((s, p) => s + p[1], 0) / mine.length];
        moved = Math.max(moved, Math.hypot(m[0] - c[0], m[1] - c[1]));
        trails[k].push([...m]);
        return m;
      });
      phase = 'assign';
      logLines.push(`Iteration ${iter} — update: each centre moves to the mean of its points (largest move ${moved.toFixed(1)} px).`);
    }
    render();
    return phase !== 'done';
  }

  function render() {
    svg.innerHTML = '';
    el('rect', { x: 0, y: 0, width: 520, height: 360, class: 'km-bg' }, svg);
    data.forEach((p, i) => el('circle', { cx: p[0], cy: p[1], r: 5, class: 'km-pt', style: assign[i] >= 0 ? `fill:${CLUSTER_COLORS[assign[i]]}` : '' }, svg));
    if (centers) {
      trails.forEach((t, k) => { if (t.length > 1) el('polyline', { points: t.map(p => p.join(',')).join(' '), class: 'km-trail', style: `stroke:${CLUSTER_COLORS[k]}` }, svg); });
      centers.forEach(([x, y], k) => {
        el('path', { d: `M${x - 11},${y - 11} L${x + 11},${y + 11} M${x + 11},${y - 11} L${x - 11},${y + 11}`, class: 'km-center-o' }, svg);
        el('path', { d: `M${x - 11},${y - 11} L${x + 11},${y + 11} M${x + 11},${y - 11} L${x - 11},${y + 11}`, class: 'km-center', style: `stroke:${CLUSTER_COLORS[k]}` }, svg);
      });
    }
    document.getElementById('km-iter').textContent = iter;
    document.getElementById('km-phase').textContent = { init: 'initialise', assign: 'assign', update: 'update', done: 'done ✅' }[phase];
    log.innerHTML = logLines.map((l, i) => `<p class="${i === logLines.length - 1 ? (phase === 'done' ? 'win' : 'current') : ''}">${l}</p>`).join('');
    log.scrollTop = log.scrollHeight;
    playBtn.textContent = timer ? '⏸' : '▶';
    document.getElementById('km-step').disabled = phase === 'done';
  }
  function stop() { clearInterval(timer); timer = null; }

  document.getElementById('km-step').addEventListener('click', () => { stop(); step(); });
  document.getElementById('km-reset').addEventListener('click', reset);
  document.getElementById('km-data').addEventListener('click', () => { newData(); reset(); });
  kS.addEventListener('input', () => { document.getElementById('km-k-val').textContent = kS.value; reset(); });
  playBtn.addEventListener('click', () => {
    if (timer) { stop(); render(); return; }
    if (phase === 'done') reset();
    timer = setInterval(() => { if (!step()) { stop(); render(); } }, 700);
    render();
  });
  newData();
  reset();
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initHero();
  initBiasVariance();
  initLinReg();
  initKNN();
  initNaiveBayes();
  initKMeans();
});
