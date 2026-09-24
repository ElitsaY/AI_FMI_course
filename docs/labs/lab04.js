/* ===== Lab 04 interactivity ===== */

const SVG_NS = 'http://www.w3.org/2000/svg';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function svgEl(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (parent) parent.appendChild(e);
  return e;
}
const rand = (k) => Math.floor(Math.random() * k);
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- terminology tooltips ---------- */
function initTerms() {
  const tip = document.getElementById('term-tip');
  let pinned = null;

  function show(term) {
    tip.textContent = term.dataset.def;
    tip.classList.add('show');
    const r = term.getBoundingClientRect();
    const tw = Math.min(300, window.innerWidth - 32);
    tip.style.maxWidth = tw + 'px';
    let left = r.left + r.width / 2 - tip.offsetWidth / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - tip.offsetWidth - 16));
    let top = r.top - tip.offsetHeight - 10;
    if (top < 70) top = r.bottom + 10;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function hide() { tip.classList.remove('show'); }

  document.querySelectorAll('.term').forEach(term => {
    term.addEventListener('mouseenter', () => show(term));
    term.addEventListener('mouseleave', () => { if (pinned !== term) hide(); });
    term.addEventListener('focus', () => show(term));
    term.addEventListener('blur', () => { pinned = null; hide(); });
    term.addEventListener('click', (e) => { e.stopPropagation(); pinned = term; show(term); });
  });
  document.addEventListener('click', () => { pinned = null; hide(); });
  window.addEventListener('scroll', () => { if (!pinned) hide(); }, { passive: true });
}

/* ---------- animated DNA helix in the hero ---------- */
function initHelix() {
  const svg = document.getElementById('dna-helix');
  const W = 1200, H = 220, mid = H / 2, A = 70, rungs = 48;
  const baseColors = ['var(--dfs)', 'var(--bfs)', 'var(--ucs)', 'var(--ids)'];
  const strandA = svgEl('path', { class: 'strand a' }, svg);
  const strandB = svgEl('path', { class: 'strand b' }, svg);
  const lines = Array.from({ length: rungs }, (_, i) => svgEl('line', { class: 'rung', style: `stroke:${baseColors[i % 4]}` }, svg));

  function draw(phase) {
    const k = (2 * Math.PI) / 400;
    let da = '', db = '';
    for (let x = 0; x <= W; x += 8) {
      const y = A * Math.sin(k * x + phase);
      da += `${x === 0 ? 'M' : 'L'}${x},${(mid + y).toFixed(1)}`;
      db += `${x === 0 ? 'M' : 'L'}${x},${(mid - y).toFixed(1)}`;
    }
    strandA.setAttribute('d', da);
    strandB.setAttribute('d', db);
    lines.forEach((ln, i) => {
      const x = (i + 0.5) * (W / rungs);
      const y = A * Math.sin(k * x + phase);
      ln.setAttribute('x1', x); ln.setAttribute('x2', x);
      ln.setAttribute('y1', mid + y); ln.setAttribute('y2', mid - y);
      ln.style.opacity = 0.35 + 0.65 * Math.abs(Math.cos(k * x + phase));
    });
  }

  if (reduceMotion) { draw(0); return; }
  const t0 = performance.now();
  const tick = (t) => { draw(((t - t0) / 1000) * 0.8); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

/* ---------- shared example population ---------- */
const POP = [
  { id: 'A', f: 10, color: 'var(--dfs)' },
  { id: 'B', f: 20, color: 'var(--bfs)' },
  { id: 'C', f: 30, color: 'var(--ucs)' },
  { id: 'D', f: 25, color: 'var(--ids)' },
  { id: 'E', f: 15, color: 'var(--pink)' },
];
const TOTAL_F = POP.reduce((s, p) => s + p.f, 0);

function renderTally(container, counts, expectedShare) {
  const total = counts.reduce((s, c) => s + c, 0);
  container.innerHTML = POP.map((p, i) => {
    const share = total ? counts[i] / total : 0;
    const marker = expectedShare ? `<span class="exp-mark" style="left:${(expectedShare[i] * 100).toFixed(1)}%" title="expected ${(expectedShare[i] * 100).toFixed(1)}%"></span>` : '';
    return `<div class="bar-row tally-row">
      <div class="label" style="color:${p.color}">${p.id} <span class="fit">f=${p.f}</span></div>
      <div class="bar-track" style="position:relative"><div class="bar-fill" style="width:${(share * 100).toFixed(1)}%; background:${p.color}"></div>${marker}</div>
      <div class="num">${counts[i]} (${(share * 100).toFixed(1)}%)</div>
    </div>`;
  }).join('');
}

/* ---------- roulette wheel + SUS ---------- */
function initRoulette() {
  const wheel = document.getElementById('rw-wheel');
  const pointersSvg = document.getElementById('rw-pointers');
  const picked = document.getElementById('rw-picked');
  const tally = document.getElementById('rw-tally');
  const msg = document.getElementById('rw-msg');
  const nSlider = document.getElementById('rw-n');
  const expected = POP.map(p => p.f / TOTAL_F);

  // slice boundaries in degrees, clockwise from the top
  const bounds = [];
  let acc = 0;
  POP.forEach(p => { bounds.push([acc, acc + (p.f / TOTAL_F) * 360]); acc += (p.f / TOTAL_F) * 360; });
  const whoAt = (deg) => bounds.findIndex(([a, b]) => deg >= a && deg < b);

  const R = 100;
  const pt = (deg, r = R) => [r * Math.sin((deg * Math.PI) / 180), -r * Math.cos((deg * Math.PI) / 180)];
  POP.forEach((p, i) => {
    const [a, b] = bounds[i];
    const [x1, y1] = pt(a), [x2, y2] = pt(b);
    svgEl('path', { d: `M0,0 L${x1},${y1} A${R},${R} 0 ${b - a > 180 ? 1 : 0} 1 ${x2},${y2} Z`, style: `fill:${p.color}`, class: 'rw-slice' }, wheel);
    const [lx, ly] = pt((a + b) / 2, 64);
    const t = svgEl('text', { x: lx, y: ly, class: 'rw-label' }, wheel);
    t.textContent = p.id;
    const [fx, fy] = pt((a + b) / 2, 64);
    const t2 = svgEl('text', { x: fx, y: fy + 15, class: 'rw-sub' }, wheel);
    t2.textContent = `${Math.round((p.f / TOTAL_F) * 100)}%`;
  });
  svgEl('circle', { cx: 0, cy: 0, r: 10, class: 'rw-hub' }, wheel);

  let mode = 'roulette';
  let rotation = 0;
  let counts = POP.map(() => 0);
  let busy = false;

  const n = () => +nSlider.value;
  const pointerAngles = () => (mode === 'sus' ? Array.from({ length: n() }, (_, k) => (k * 360) / n()) : [0]);

  function drawPointers() {
    pointersSvg.innerHTML = '';
    pointerAngles().forEach(a => {
      const g = svgEl('g', { transform: `rotate(${a})` }, pointersSvg);
      svgEl('path', { d: 'M0,-86 L-8,-108 L8,-108 Z', class: 'rw-pointer' }, g);
    });
  }

  // wheel-local angle under a pointer at screen angle p when the wheel is rotated by `rot`
  const localAt = (p, rot) => (((p - rot) % 360) + 360) % 360;

  function selectOnce() {
    // returns chosen indexes and the rotation that shows them
    const step = 360 / (mode === 'sus' ? n() : 1);
    const u = Math.random() * step; // local angle under pointer 0
    const rot = -u;
    const chosen = pointerAngles().map(p => whoAt(localAt(p, rot)));
    return { chosen, rot };
  }

  function showPicked(list) {
    picked.innerHTML = list.map(i => `<span class="chip" style="border-color:${POP[i].color}; color:${POP[i].color}">${POP[i].id}</span>`).join('');
  }

  function spinTo(targetRot, duration) {
    const base = rotation - (rotation % 360);
    let next = base + 720 + (((targetRot % 360) + 360) % 360);
    if (next <= rotation) next += 360;
    rotation = next;
    wheel.style.transition = reduceMotion ? 'none' : `transform ${duration}ms cubic-bezier(.17,.67,.24,1)`;
    wheel.style.transform = `rotate(${rotation}deg)`;
  }

  async function spin() {
    if (busy) return;
    busy = true;
    const got = [];
    const rounds = mode === 'sus' ? 1 : n();
    for (let r = 0; r < rounds; r++) {
      const { chosen, rot } = selectOnce();
      const dur = mode === 'sus' ? 1600 : 900;
      spinTo(rot, dur);
      await new Promise(res => setTimeout(res, reduceMotion ? 0 : dur + 80));
      chosen.forEach(i => { counts[i]++; got.push(i); });
      showPicked(got);
      renderTally(tally, counts, expected);
    }
    msg.textContent = mode === 'sus'
      ? `One spin, ${n()} evenly spaced pointers → ${n()} parents at once. Each individual is picked ⌊n·p⌋ or ⌈n·p⌉ times — never far from its fair share.`
      : `${n()} independent spin${n() === 1 ? '' : 's'} → ${n()} parent${n() === 1 ? '' : 's'}. Selection is with replacement, so the same individual can be picked again.`;
    busy = false;
  }

  function spinMany() {
    if (busy) return;
    const got = [];
    for (let s = 0; s < 100; s++) {
      if (mode === 'sus') { selectOnce().chosen.forEach(i => { counts[i]++; got.push(i); }); } else {
        for (let r = 0; r < n(); r++) { selectOnce().chosen.forEach(i => { counts[i]++; got.push(i); }); }
      }
    }
    showPicked(got.slice(-n()));
    renderTally(tally, counts, expected);
    msg.textContent = 'The marker on each bar is the expected share (fitness / total fitness). The more spins, the closer the bars get to it.';
  }

  function reset() {
    counts = POP.map(() => 0);
    picked.innerHTML = '<span style="color:var(--ink-soft); font-size:0.85rem;">spin the wheel</span>';
    renderTally(tally, counts, expected);
    msg.textContent = '';
  }

  document.querySelectorAll('.rw-mode').forEach(btn => btn.addEventListener('click', () => {
    if (busy) return;
    document.querySelectorAll('.rw-mode').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
    drawPointers();
    reset();
  }));
  nSlider.addEventListener('input', () => { document.getElementById('rw-n-val').textContent = nSlider.value; drawPointers(); });
  document.getElementById('rw-spin').addEventListener('click', spin);
  document.getElementById('rw-many').addEventListener('click', spinMany);
  document.getElementById('rw-reset').addEventListener('click', reset);

  drawPointers();
  reset();
}

/* ---------- tournament selection ---------- */
function initTournament() {
  const arena = document.getElementById('tn-arena');
  const tally = document.getElementById('tn-tally');
  const msg = document.getElementById('tn-msg');
  const kSlider = document.getElementById('tn-k');
  let counts = POP.map(() => 0);

  function draw(participants = [], winner = -1) {
    arena.innerHTML = POP.map((p, i) => {
      const cls = ['tn-card'];
      if (participants.includes(i)) cls.push('in');
      if (i === winner) cls.push('winner');
      return `<div class="${cls.join(' ')}" style="--c:${p.color}">
        ${i === winner ? '<span class="crown">🏆</span>' : ''}
        <div class="tn-id">${p.id}</div><div class="tn-f">fitness ${p.f}</div></div>`;
    }).join('');
  }

  function runOnce() {
    const k = +kSlider.value;
    const participants = shuffle(POP.map((_, i) => i)).slice(0, k);
    const winner = participants.reduce((best, i) => (POP[i].f > POP[best].f ? i : best));
    counts[winner]++;
    return { participants, winner };
  }

  document.getElementById('tn-run').addEventListener('click', () => {
    const { participants, winner } = runOnce();
    draw(participants, winner);
    msg.innerHTML = `Tournament participants: <b>${participants.map(i => POP[i].id).join(', ')}</b> (fitness ${participants.map(i => POP[i].f).join(', ')}) → winner <b>${POP[winner].id}</b>.`;
    renderTally(tally, counts);
  });
  document.getElementById('tn-many').addEventListener('click', () => {
    let last;
    for (let s = 0; s < 100; s++) last = runOnce();
    draw(last.participants, last.winner);
    const k = +kSlider.value;
    msg.innerHTML = k === 1
      ? 'With k = 1 the "tournament" has a single participant — selection is purely random (lowest pressure).'
      : k === POP.length
        ? `With k = ${k} every individual takes part, so the fittest (C) always wins — maximum pressure, no diversity.`
        : `With k = ${k}, ${POP.slice().sort((a, b) => a.f - b.f).slice(0, k - 1).map(p => p.id).join(' and ')} can never win: they are always beaten by someone fitter in a group of ${k}.`;
    renderTally(tally, counts);
  });
  document.getElementById('tn-reset').addEventListener('click', () => { counts = POP.map(() => 0); draw(); msg.textContent = ''; renderTally(tally, counts); });
  kSlider.addEventListener('input', () => {
    document.getElementById('tn-k-val').textContent = kSlider.value;
    counts = POP.map(() => 0); draw(); msg.textContent = ''; renderTally(tally, counts);
  });
  draw();
  renderTally(tally, counts);
}

/* ---------- rank-based vs roulette probabilities ---------- */
function initRank() {
  const bars = document.getElementById('rk-bars');
  const msg = document.getElementById('rk-msg');

  function render(cFit) {
    const pop = POP.map(p => ({ ...p, f: p.id === 'C' ? cFit : p.f }));
    const total = pop.reduce((s, p) => s + p.f, 0);
    const sorted = [...pop].sort((a, b) => a.f - b.f);
    const rankSum = (pop.length * (pop.length + 1)) / 2;
    const rankProb = Object.fromEntries(sorted.map((p, i) => [p.id, (i + 1) / rankSum]));
    bars.innerHTML = sorted.slice().reverse().map(p => {
      const rw = p.f / total, rk = rankProb[p.id];
      return `<div class="rk-row">
        <div class="rk-id" style="color:${p.color}">${p.id}<span>f=${p.f} · rank ${sorted.indexOf(p) + 1}</span></div>
        <div class="rk-pair">
          <div class="rk-bar"><span class="rk-tag">roulette</span><div class="bar-track"><div class="bar-fill" style="width:${(rw * 100).toFixed(1)}%; background:${p.color}"></div></div><b>${(rw * 100).toFixed(1)}%</b></div>
          <div class="rk-bar"><span class="rk-tag">rank</span><div class="bar-track"><div class="bar-fill" style="width:${(rk * 100).toFixed(1)}%; background:${p.color}; opacity:0.6"></div></div><b>${(rk * 100).toFixed(1)}%</b></div>
        </div>
      </div>`;
    }).join('');
    msg.textContent = cFit === 30
      ? 'Ranks 1…5 give probabilities 1/15 … 5/15 — the same values the notebook prints: 0.067, 0.133, 0.2, 0.267, 0.333.'
      : 'C now takes over the roulette wheel (81%) — a recipe for premature convergence. Its rank is still 5, so rank-based selection keeps it at 33%.';
  }

  document.querySelectorAll('.rk-mode').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.rk-mode').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(+btn.dataset.c);
  }));
  render(30);
}

/* ---------- chromosome rendering helpers ---------- */
function geneRow(label, genes, classes = [], extra = '') {
  return `<div class="xo-row"><span class="xo-label">${label}</span><div class="xo-genes">${genes.map((g, i) => `<span class="gcell ${classes[i] || ''}">${g}</span>`).join('')}</div>${extra}</div>`;
}

/* ---------- one-point (order) crossover ---------- */
function orderCrossover(p1, p2, k) {
  const head = p1.slice(0, k);
  return head.concat(p2.filter(x => !head.includes(x)));
}

function initOnePoint() {
  const view = document.getElementById('op-view');
  const slider = document.getElementById('op-k');
  const P1 = [1, 2, 3, 4, 5], P2 = [5, 4, 3, 2, 1];

  function render() {
    const k = +slider.value;
    document.getElementById('op-k-val').textContent = k;
    const c1 = orderCrossover(P1, P2, k), c2 = orderCrossover(P2, P1, k);
    const cutCls = (arr, a, b) => arr.map((_, i) => (i < k ? a : b) + (i === k - 1 ? ' cut' : ''));
    view.innerHTML =
      geneRow('parent 1', P1, cutCls(P1, 'p1', 'p1 dim')) +
      geneRow('parent 2', P2, cutCls(P2, 'p2', 'p2 dim')) +
      '<div class="xo-sep"></div>' +
      geneRow('child 1', c1, cutCls(c1, 'p1', 'p2'), `<span class="xo-note">copy first part from parent 1 + fill the remaining values in their order from parent 2</span>`) +
      geneRow('child 2', c2, cutCls(c2, 'p2', 'p1'), `<span class="xo-note">copy first part from parent 2 + fill the remaining values in their order from parent 1</span>`);
  }
  slider.addEventListener('input', render);
  render();
}

/* ---------- uniform crossover ---------- */
function initUniform() {
  const view = document.getElementById('uc-view');
  const P1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1], P2 = [2, 3, 4, 5, 5, 7, 7, 9, 9, 0];
  let mask;

  function render() {
    const c1 = P1.map((g, i) => (mask[i] ? g : P2[i]));
    const c2 = P1.map((g, i) => (mask[i] ? P2[i] : g));
    view.innerHTML =
      geneRow('parent 1', P1, P1.map(() => 'p1')) +
      geneRow('parent 2', P2, P2.map(() => 'p2')) +
      geneRow('mask', mask.map(m => (m ? '1' : '2')), mask.map(m => 'mask ' + (m ? 'p1' : 'p2'))) +
      '<div class="xo-sep"></div>' +
      geneRow('child 1', c1, mask.map(m => (m ? 'p1' : 'p2'))) +
      geneRow('child 2', c2, mask.map(m => (m ? 'p2' : 'p1')));
  }
  function roll() { mask = P1.map(() => Math.random() < 0.5); render(); }
  document.getElementById('uc-roll').addEventListener('click', roll);
  roll();
}

/* ---------- mutation operators ---------- */
function mutate(chrom, op) {
  const n = chrom.length;
  let i = rand(n), j = rand(n);
  while (j === i) j = rand(n);
  const c = [...chrom];
  if (op === 'swap') {
    [c[i], c[j]] = [c[j], c[i]];
    return { child: c, desc: `swap positions ${i} and ${j}`, marks: [i, j], newMarks: [i, j] };
  }
  if (op === 'insertion') {
    const [g] = c.splice(i, 1);
    c.splice(j, 0, g);
    return { child: c, desc: `take gene ${g} from position ${i} and insert it at position ${j}`, marks: [i], newMarks: [j] };
  }
  if (i > j) [i, j] = [j, i];
  const seg = c.slice(i, j + 1).reverse();
  c.splice(i, seg.length, ...seg);
  const range = Array.from({ length: j - i + 1 }, (_, k) => i + k);
  return { child: c, desc: `reverse positions ${i}…${j}`, marks: range, newMarks: range };
}

function initMutation() {
  const view = document.getElementById('mu-view');
  const START = [2, 1, 5, 4, 3, 6, 8, 7];
  let chrom = [...START], op = 'swap';

  function render(result) {
    if (!result) {
      view.innerHTML = geneRow('current', chrom, chrom.map(() => 'p1'));
      return;
    }
    const before = chrom;
    chrom = result.child;
    view.innerHTML =
      geneRow('before', before, before.map((_, i) => 'p1' + (result.marks.includes(i) ? ' hl' : ''))) +
      geneRow('after', chrom, chrom.map((_, i) => 'p1' + (result.newMarks.includes(i) ? ' hl' : '')), `<span class="xo-note">${op}: ${result.desc}</span>`);
  }

  document.querySelectorAll('.mu-op').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.mu-op').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    op = btn.dataset.op;
    render();
  }));
  document.getElementById('mu-apply').addEventListener('click', () => render(mutate(chrom, op)));
  document.getElementById('mu-reset').addEventListener('click', () => { chrom = [...START]; render(); });
  render();
}

/* ---------- GA on the travelling salesman problem ---------- */
function initTSP() {
  const map = document.getElementById('ga-map');
  const chart = document.getElementById('ga-chart');
  const pmSlider = document.getElementById('ga-pm');
  const playBtn = document.getElementById('ga-play');
  const N_CITIES = 14, POP_SIZE = 60, ELITE = 2, K = 3, MAX_GEN = 400;

  let cities, population, gen, history, timer = null, op = 'reverse';

  const dist = (a, b) => Math.hypot(cities[a][0] - cities[b][0], cities[a][1] - cities[b][1]);
  const tourLength = (t) => t.reduce((s, c, i) => s + dist(c, t[(i + 1) % t.length]), 0);

  function newCities() {
    cities = [];
    while (cities.length < N_CITIES) {
      const c = [40 + Math.random() * 520, 40 + Math.random() * 320];
      if (cities.every(d => Math.hypot(c[0] - d[0], c[1] - d[1]) > 45)) cities.push(c);
    }
  }

  function newPopulation() {
    const base = cities.map((_, i) => i);
    population = Array.from({ length: POP_SIZE }, () => shuffle(base))
      .map(t => ({ t, len: tourLength(t) }))
      .sort((a, b) => a.len - b.len);
    gen = 0;
    history = [population[0].len];
  }

  // fitness = 1 / length, so the tournament winner is the shortest tour
  const tournament = () => {
    let best = null;
    for (let i = 0; i < K; i++) { const c = population[rand(POP_SIZE)]; if (!best || c.len < best.len) best = c; }
    return best.t;
  };

  function nextGeneration() {
    const pm = +pmSlider.value / 100;
    const next = population.slice(0, ELITE).map(x => ({ ...x }));
    while (next.length < POP_SIZE) {
      const p1 = tournament(), p2 = tournament();
      const k = 1 + rand(N_CITIES - 1);
      let child = orderCrossover(p1, p2, k);
      if (Math.random() < pm) child = mutate(child, op).child;
      next.push({ t: child, len: tourLength(child) });
    }
    population = next.sort((a, b) => a.len - b.len);
    gen++;
    history.push(population[0].len);
  }

  function render() {
    const best = population[0].t;
    map.innerHTML = '';
    const d = best.map((c, i) => `${i ? 'L' : 'M'}${cities[c][0].toFixed(1)},${cities[c][1].toFixed(1)}`).join(' ') + ' Z';
    svgEl('path', { d, class: 'ga-tour' }, map);
    cities.forEach(([x, y], i) => {
      svgEl('circle', { cx: x, cy: y, r: 9, class: 'ga-city' + (i === best[0] ? ' start' : '') }, map);
    });

    chart.innerHTML = '';
    const maxL = history[0], minL = Math.min(...history);
    const span = Math.max(1, maxL - minL);
    const xs = (i) => 6 + (i / Math.max(1, Math.max(history.length - 1, 50))) * 288;
    const ys = (v) => 10 + ((maxL - v) / span) * 120; // longest at the top, so the line falls as tours get shorter
    svgEl('line', { x1: 6, y1: 130, x2: 294, y2: 130, class: 'ga-axis' }, chart);
    svgEl('polyline', { points: history.map((v, i) => `${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(' '), class: 'ga-line' }, chart);

    document.getElementById('ga-gen').textContent = gen;
    document.getElementById('ga-best').textContent = Math.round(population[0].len);
    playBtn.textContent = timer ? '⏸' : '▶';
  }

  function stop() { clearInterval(timer); timer = null; }
  function reset() { stop(); newPopulation(); render(); }

  playBtn.addEventListener('click', () => {
    if (timer) { stop(); render(); return; }
    timer = setInterval(() => {
      if (gen >= MAX_GEN) { stop(); render(); return; }
      nextGeneration(); render();
    }, 60);
    render();
  });
  document.getElementById('ga-step').addEventListener('click', () => { stop(); nextGeneration(); render(); });
  document.getElementById('ga-reset').addEventListener('click', reset);
  document.getElementById('ga-cities').addEventListener('click', () => { newCities(); reset(); });
  pmSlider.addEventListener('input', () => { document.getElementById('ga-pm-val').textContent = (+pmSlider.value / 100).toFixed(2); });
  document.querySelectorAll('.ga-op').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.ga-op').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    op = btn.dataset.op;
  }));

  newCities();
  reset();
}

/* ---------- code cards: python highlighting, line numbers, copy ---------- */
const PY_KEYWORDS = new Set(['def', 'return', 'for', 'in', 'if', 'elif', 'else', 'import', 'as', 'from', 'while', 'not', 'and', 'or', 'None', 'True', 'False', 'lambda', 'class', 'with', 'yield', 'break', 'continue', 'pass']);
const PY_BUILTINS = new Set(['print', 'len', 'range', 'sum', 'min', 'max', 'sorted', 'list', 'dict', 'set', 'int', 'float', 'str', 'enumerate', 'zip']);
const escapeHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function highlightPython(line) {
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b/g;
  let out = '', last = 0, m;
  while ((m = re.exec(line))) {
    out += escapeHtml(line.slice(last, m.index));
    const [tok, com, str, num, word] = m;
    if (com) out += `<span class="tok-com">${escapeHtml(com)}</span>`;
    else if (str) out += `<span class="tok-str">${escapeHtml(str)}</span>`;
    else if (num) out += `<span class="tok-num">${num}</span>`;
    else if (PY_KEYWORDS.has(word)) out += `<span class="tok-kw">${word}</span>`;
    else if (PY_BUILTINS.has(word)) out += `<span class="tok-bi">${word}</span>`;
    else if (line[re.lastIndex] === '(' || /\bdef\s+$/.test(line.slice(0, m.index))) out += `<span class="tok-fn">${word}</span>`;
    else out += escapeHtml(tok);
    last = re.lastIndex;
  }
  return out + escapeHtml(line.slice(last));
}

function initCodeCards() {
  document.querySelectorAll('.code-card').forEach(card => {
    const code = card.querySelector('code');
    const source = code.textContent;
    code.innerHTML = source.split('\n').map(l => `<span class="ln">${highlightPython(l) || ' '}</span>`).join('');
    const btn = card.querySelector('.code-copy');
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); // keep the <details> open
      try {
        await navigator.clipboard.writeText(source);
        btn.textContent = 'Copied ✓';
      } catch {
        btn.textContent = 'Copy failed';
      }
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
  });
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initTerms();
  initCodeCards();
  initHelix();
  initRoulette();
  initTournament();
  initRank();
  initOnePoint();
  initUniform();
  initMutation();
  initTSP();
});
