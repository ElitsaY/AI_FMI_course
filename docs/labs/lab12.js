/* ===== Lab 12 interactivity ===== */

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
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const f2 = (v) => v.toFixed(2), f3 = (v) => v.toFixed(3);
const sgn = (v, d = 2) => (v < 0 ? '−' + Math.abs(v).toFixed(d) : v.toFixed(d));
const softmax = (z) => { const m = Math.max(...z.filter(Number.isFinite)), e = z.map(v => (Number.isFinite(v) ? Math.exp(v - m) : 0)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = (a) => Math.sqrt(dot(a, a));
const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b) || 1);

/* ---------- tokenizers ---------- */
const SUBWORDS = ['play', 're', 'ing', 'ed', 'er', 's', 'un', 'able', 'token', 'iz', 'ation', 'trans', 'form', 'new', 'low', 'est', 'the', 'cat', 'sat', 'on', 'mat', 'model', 'learn', 'predict', 'ion', 'ly'];
const WORDS = ['play', 'playing', 'played', 'player', 'plays', 'replay', 'replaying', 'the', 'cat', 'sat', 'on', 'mat', 'a', 'dog', 'is', 'model', 'models', 'language'];
const splitWords = (s) => s.toLowerCase().match(/[a-z]+|[^\sa-z]/g) || [];
function subwordTokenize(word) {
  const out = []; let i = 0;
  while (i < word.length) {
    let best = word[i];
    SUBWORDS.forEach(p => { if (p.length > best.length && word.startsWith(p, i)) best = p; });
    out.push(best); i += best.length;
  }
  return out;
}

/* ---------- BPE ---------- */
const BPE_CORPUS = ['low', 'low', 'lower', 'lowest', 'new', 'newer'];
function pairCounts(words) {
  const m = new Map();
  words.forEach(w => { for (let i = 0; i + 1 < w.length; i++) { const k = w[i] + '\u0001' + w[i + 1]; m.set(k, (m.get(k) || 0) + 1); } });
  return [...m.entries()].map(([k, c]) => ({ pair: k.split('\u0001'), c }))
    .sort((a, b) => b.c - a.c || (a.pair[0] + ' ' + a.pair[1] < b.pair[0] + ' ' + b.pair[1] ? -1 : a.pair[0] + ' ' + a.pair[1] > b.pair[0] + ' ' + b.pair[1] ? 1 : 0));
}
/* alphabetical tie-break on (first, second), like Python's sorted((-count, pair)) */
function sortPairs(list) { return list.sort((a, b) => b.c - a.c || (a.pair[0] < b.pair[0] ? -1 : a.pair[0] > b.pair[0] ? 1 : a.pair[1] < b.pair[1] ? -1 : a.pair[1] > b.pair[1] ? 1 : 0)); }
function mergePair(words, [a, b]) {
  return words.map(w => { const n = []; for (let i = 0; i < w.length; i++) { if (i + 1 < w.length && w[i] === a && w[i + 1] === b) { n.push(a + b); i++; } else n.push(w[i]); } return n; });
}
function bpeStates() {
  const states = [{ words: BPE_CORPUS.map(w => w.split('')), merges: [] }];
  for (;;) {
    const s = states[states.length - 1], pc = sortPairs(pairCounts(s.words));
    if (!pc.length) break;
    states.push({ words: mergePair(s.words, pc[0].pair), merges: s.merges.concat([pc[0].pair]) });
  }
  return states;
}
const bpeTokenize = (word, merges) => merges.reduce((w, p) => mergePair([w], p)[0], word.split(''));

/* ---------- toy data ---------- */
const EMB = [
  ['cat', 324, [2.0, 1.6]], ['kitten', 7021, [1.5, 2.1]], ['dog', 517, [2.5, 1.1]], ['puppy', 8840, [2.2, 0.6]],
  ['car', 325, [-1.9, 1.5]], ['truck', 4402, [-2.4, 1.0]], ['bus', 1170, [-1.5, 0.7]],
  ['mat', 2603, [0.7, -1.8]], ['floor', 3110, [1.2, -2.2]], ['chair', 1545, [0.2, -1.4]],
  ['sat', 981, [-1.1, -1.1]], ['slept', 5402, [-1.6, -1.6]], ['ran', 1308, [-0.8, -2.0]],
];
const POS_TOK = { dog: [1.2, 0.6], bites: [-0.2, 1.3], man: [0.9, -0.9] };
const POS_VEC = [[0.0, 0.7], [0.7, 0.0], [0.0, -0.7]];
const AT_EX = { Q: [[1, 0], [0, 1], [1, 1]], K: [[1, 0], [0, 1], [1, 1]], V: [[1, 2], [3, 0], [2, 2]] };
const AT_TOK = ['The', 'cat', 'sleeps'];
const CM_TOK = ['The', 'cat', 'sat', 'on', 'the', 'mat'];
const CM_S = [
  [2.0, 0.5, 0.2, 0.0, 0.3, 0.1],
  [1.5, 2.0, 1.2, 0.0, 0.0, 0.8],
  [0.3, 2.5, 1.0, 1.2, 0.0, 1.5],
  [0.0, 0.5, 2.0, 1.0, 0.5, 1.8],
  [0.8, 0.0, 0.3, 2.0, 1.0, 2.2],
  [0.2, 1.2, 1.5, 1.8, 2.0, 1.0],
];
const LOGITS = [['mat', 8.2], ['floor', 6.7], ['bed', 6.3], ['sofa', 5.9], ['rug', 5.6], ['chair', 5.1], ['table', 5.0], ['roof', 3.0], ['moon', -0.3]];
const CORPUS = `the cat sat on the mat .
the cat sat on the mat and slept .
the dog sat on the floor .
the cat sat on the floor .
the cat slept on the mat .
the dog slept on the chair .
the cat sat on the chair .
the dog ran to the park .
the cat ran to the door .
the dog sat on the mat .
the cat saw the dog .
the dog saw the cat .
the cat chased the mouse .
the dog chased the cat .
the mouse ran to the hole .
the cat sat by the door .
the dog slept by the fire .
the cat sat on the mat again .
the cat sat on the sofa .
the dog ate the food .
the cat ate the fish .
the cat was happy .
the dog was tired .
the mouse was scared .`.split('\n').map(l => l.split(' '));
/* trigram counts with back-off to bigrams and unigrams */
const NGRAM = (() => {
  const tri = {}, bi = {}, uni = {};
  const add = (m, k, w) => { m[k] = m[k] || {}; m[k][w] = (m[k][w] || 0) + 1; };
  CORPUS.forEach(s => s.forEach((w, i) => { uni[w] = (uni[w] || 0) + 1; if (i >= 1) add(bi, s[i - 1], w); if (i >= 2) add(tri, s[i - 2] + ' ' + s[i - 1], w); }));
  return { tri, bi, uni };
})();
function nextDist(ctx) {
  const a = ctx[ctx.length - 2], b = ctx[ctx.length - 1];
  let counts, used;
  if (a && NGRAM.tri[a + ' ' + b]) { counts = NGRAM.tri[a + ' ' + b]; used = `${a} ${b}`; }
  else if (NGRAM.bi[b]) { counts = NGRAM.bi[b]; used = b; }
  else { counts = NGRAM.uni; used = '(nothing)'; }
  const tot = Object.values(counts).reduce((x, y) => x + y, 0);
  return { used, dist: Object.entries(counts).map(([w, c]) => [w, c / tot, c]).sort((x, y) => y[1] - x[1]) };
}

/* ---------- maths rendering ---------- */
function initMath() {
  if (!window.renderMathInElement) return;
  renderMathInElement(document.body, {
    delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
    throwOnError: false,
  });
}
const renderMathIn = (node) => { if (window.renderMathInElement) renderMathInElement(node, { delimiters: [{ left: '\\(', right: '\\)', display: false }], throwOnError: false }); };

/* ---------- hero: tokens with attention arcs ---------- */
function initHero() {
  const svg = document.getElementById('tf-hero-bg');
  const r = rng(12), n = 11, xs = Array.from({ length: n }, (_, i) => 70 + i * 106), y = 245;
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) {
    if (r() < 0.35) {
      const x1 = xs[j], x2 = xs[i], h = Math.min(190, 30 + (x2 - x1) * 0.45);
      el('path', { d: `M${x1},${y - 14} C${x1},${y - 14 - h} ${x2},${y - 14 - h} ${x2},${y - 14}`, class: 'arc', 'stroke-width': (0.8 + r() * 3).toFixed(1) }, svg);
    }
  }
  xs.forEach((x, i) => el('rect', { x: x - 34, y: y - 14, width: 68, height: 28, rx: 8, class: i === n - 1 ? 'tok next' : 'tok' }, svg));
}

/* ---------- three tokenizers ---------- */
function initTokenizers() {
  const input = document.getElementById('tk-input'), out = document.getElementById('tk-out');
  function render() {
    const words = splitWords(input.value);
    const word = words.map(w => (WORDS.includes(w) || !/[a-z]/.test(w) ? { t: w } : { t: '[UNK]', unk: true, orig: w }));
    const chars = words.flatMap(w => w.split(''));
    const sub = words.flatMap(w => subwordTokenize(w).map((t, i) => ({ t, cont: i > 0, single: !SUBWORDS.includes(t) && /[a-z]/.test(t) })));
    const row = (name, toks, note) => `<div class="tk-row"><div class="tk-name">${name}<span>${toks.length} tokens</span></div><div class="tk-chips">${toks.map(x => `<span class="tk-chip${x.unk ? ' unk' : ''}${x.cont ? ' cont' : ''}${x.single ? ' char' : ''}" ${x.orig ? `title="${esc(x.orig)}"` : ''}>${esc(x.t)}</span>`).join('')}</div>${note ? `<p class="note">${note}</p>` : ''}</div>`;
    const unk = word.filter(x => x.unk).map(x => `“${esc(x.orig)}”`);
    out.innerHTML =
      row('Word-level', word, unk.length ? `${unk.join(', ')} ${unk.length === 1 ? 'is' : 'are'} not in the ${WORDS.length}-word vocabulary → [UNK]: the information is lost.` : `Every word is in the ${WORDS.length}-word vocabulary here; a real word vocabulary would need hundreds of thousands of entries.`) +
      row('Character-level', chars.map(t => ({ t })), '26 letters are enough for anything, but the sequence is long.') +
      row('Subword', sub, 'Pieces that continue a word have a dashed border (real tokenizers mark this too: BERT writes “##ing”, GPT-style tokenizers keep the space in front of a word). Grey letters show where no known piece fits.');
  }
  input.addEventListener('input', render);
  render();
}

/* ---------- BPE step by step ---------- */
function initBPE() {
  const corpusBox = document.getElementById('bp-corpus'), pairsBox = document.getElementById('bp-pairs'), mergesBox = document.getElementById('bp-merges');
  const stepLbl = document.getElementById('bp-step'), wordIn = document.getElementById('bp-word'), wordOut = document.getElementById('bp-word-out');
  const states = bpeStates();
  let step = 0;
  function render() {
    const s = states[step], pc = sortPairs(pairCounts(s.words)), next = pc[0];
    stepLbl.textContent = `After ${step} merge${step === 1 ? '' : 's'} (of ${states.length - 1} possible)`;
    corpusBox.innerHTML = s.words.map((w, i) => `<div class="bp-word"><span class="bp-src">${BPE_CORPUS[i]}</span>${w.map(u => `<span class="bp-unit${next && u.length > 1 && s.merges.length && u === s.merges[s.merges.length - 1].join('') ? ' new' : ''}">${u}</span>`).join('')}</div>`).join('');
    pairsBox.innerHTML = pc.length ? `<table class="summary bp-table"><thead><tr><th>Pair</th><th>Count</th></tr></thead><tbody>${pc.map((p, i) => `<tr class="${i === 0 ? 'top' : ''}"><td>(${p.pair[0]}, ${p.pair[1]})${i === 0 ? ' ← merge next' : ''}</td><td>${p.c}</td></tr>`).join('')}</tbody></table>` : '<p class="note">No pairs left: every word is a single unit.</p>';
    mergesBox.innerHTML = s.merges.length ? s.merges.map((m, i) => `<span class="chip${i === s.merges.length - 1 ? ' cur' : ''}">${i + 1}. ${m[0]} + ${m[1]} → ${m.join('')}</span>`).join('') : '<span class="note">none yet</span>';
    const w = (wordIn.value.toLowerCase().match(/[a-z]+/) || [''])[0];
    const toks = w ? bpeTokenize(w, s.merges) : [];
    wordOut.innerHTML = w ? `<div class="tk-row"><div class="tk-name">“${esc(w)}”<span>${toks.length} tokens</span></div><div class="tk-chips">${toks.map(t => `<span class="tk-chip${t.length === 1 ? ' char' : ''}">${t}</span>`).join('')}</div><p class="note">${BPE_CORPUS.includes(w) ? 'This word is in the training corpus.' : `Never seen in training, but still representable with the ${s.merges.length} merges learned so far${toks.some(t => t.length === 1) ? '; the leftover single characters are always available as a fallback' : ''}.`}</p></div>` : '';
    document.getElementById('bp-prev').disabled = step === 0;
    document.getElementById('bp-next').disabled = step === states.length - 1;
  }
  document.getElementById('bp-next').addEventListener('click', () => { step = Math.min(states.length - 1, step + 1); render(); });
  document.getElementById('bp-prev').addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
  document.getElementById('bp-reset').addEventListener('click', () => { step = 0; render(); });
  wordIn.addEventListener('input', render);
  render();
}

/* ---------- embeddings ---------- */
function initEmbeddings() {
  const svg = document.getElementById('em-plot'), out = document.getElementById('em-out');
  let sel = 'cat';
  const X = (v) => 200 + v * 60, Y = (v) => 180 - v * 60;
  function render() {
    svg.innerHTML = '';
    el('line', { x1: 20, y1: 180, x2: 380, y2: 180, class: 'axis-soft' }, svg);
    el('line', { x1: 200, y1: 15, x2: 200, y2: 345, class: 'axis-soft' }, svg);
    const s = EMB.find(e => e[0] === sel);
    const sims = EMB.filter(e => e[0] !== sel).map(e => [e, cosine(s[2], e[2])]).sort((a, b) => b[1] - a[1]);
    const near = new Set(sims.slice(0, 3).map(x => x[0][0]));
    el('line', { x1: X(0), y1: Y(0), x2: X(s[2][0]), y2: Y(s[2][1]), class: 'em-vec' }, svg);
    EMB.forEach(([w, id, v]) => {
      const g = el('g', { class: 'em-pt' + (w === sel ? ' sel' : near.has(w) ? ' near' : ''), transform: `translate(${X(v[0])} ${Y(v[1])})` }, svg);
      el('circle', { r: w === sel ? 8 : 6 }, g);
      txt(g, 10, 4, w, 'em-l');
      g.addEventListener('click', () => { sel = w; render(); });
    });
    const byId = EMB.filter(e => e[0] !== sel).sort((a, b) => Math.abs(a[1] - s[1]) - Math.abs(b[1] - s[1])).slice(0, 2);
    out.innerHTML = `
      <p class="big"><b>${sel}</b>: ID ${s[1]} → embedding [${s[2].map(v => sgn(v, 1)).join(', ')}]</p>
      <p>Most similar by embedding (cosine):</p>
      <ol class="concept-list">${sims.slice(0, 3).map(([e, c]) => `<li><b>${e[0]}</b> (${e[1]}): ${f3(c)}</li>`).join('')}</ol>
      <p>Closest by ID number: ${byId.map(e => `<b>${e[0]}</b> (${e[1]})`).join(', ')}, which says nothing about meaning.</p>
      <p class="note">cos(a, b) = a·b / (‖a‖‖b‖): 1 = same direction, 0 = unrelated, −1 = opposite.</p>`;
  }
  render();
}

/* ---------- position ---------- */
function initPosition() {
  const svg = document.getElementById('ps-plot'), out = document.getElementById('ps-out');
  let usePos = false;
  const A = ['dog', 'bites', 'man'], B = ['man', 'bites', 'dog'];
  const X = (v) => 190 + v * 75, Y = (v) => 170 - v * 75;
  const vec = (w, i) => POS_TOK[w].map((v, d) => v + (usePos ? POS_VEC[i][d] : 0));
  function render() {
    document.querySelectorAll('#ps-mode .strat-btn').forEach(b => b.classList.toggle('active', +b.dataset.p === (usePos ? 1 : 0)));
    svg.innerHTML = '';
    el('line', { x1: 20, y1: 170, x2: 360, y2: 170, class: 'axis-soft' }, svg);
    el('line', { x1: 190, y1: 15, x2: 190, y2: 325, class: 'axis-soft' }, svg);
    A.forEach((w, i) => { const v = vec(w, i); el('circle', { cx: X(v[0]), cy: Y(v[1]), r: 9, class: 'ps-a' }, svg); txt(svg, X(v[0]) - 20, Y(v[1]) + 4, `${w}${usePos ? '@' + (i + 1) : ''}`, 'ps-la', 'end'); });
    B.forEach((w, i) => { const v = vec(w, i); el('circle', { cx: X(v[0]), cy: Y(v[1]), r: 14, class: 'ps-b' }, svg); txt(svg, X(v[0]) + 17, Y(v[1]) + 4, `${w}${usePos ? '@' + (i + 1) : ''}`, 'ps-lb'); });
    const setA = A.map((w, i) => vec(w, i).map(v => v.toFixed(1)).join(',')).sort(), setB = B.map((w, i) => vec(w, i).map(v => v.toFixed(1)).join(',')).sort();
    const same = setA.join('|') === setB.join('|');
    const rowsFor = (S) => S.map((w, i) => `<tr><td>${i + 1}</td><td>${w}</td><td>[${vec(w, i).map(v => sgn(v, 1)).join(', ')}]</td></tr>`).join('');
    out.innerHTML = `
      <p class="bt-legend"><span class="k ps-ka"></span> dog bites man &nbsp; <span class="k ps-kb"></span> man bites dog</p>
      <div class="table-wrap"><table class="summary tf-table"><thead><tr><th>pos</th><th>token</th><th>input vector</th></tr></thead><tbody>${rowsFor(A)}<tr class="sep"><td colspan="3"></td></tr>${rowsFor(B)}</tbody></table></div>
      <p class="big">Same set of input vectors? <b>${same ? 'Yes' : 'No'}</b></p>
      <p class="note">${same ? 'The two sentences give exactly the same three vectors, only in a different order. Attention, which ignores the order of its inputs, would compute the same things for both.' : 'Adding the position vector P<sub>i</sub> makes “dog at position 1” a different vector from “dog at position 3”, so the two sentences now look different to the model.'}</p>`;
  }
  document.querySelectorAll('#ps-mode .strat-btn').forEach(b => b.addEventListener('click', () => { usePos = b.dataset.p === '1'; render(); }));
  render();
}

/* ---------- attention calculator ---------- */
function attentionRow(Q, K, V, i, scale, mask) {
  const dk = K[0].length, raw = K.map(k => dot(Q[i], k));
  const scaled = raw.map(s => (scale ? s / Math.sqrt(dk) : s));
  const masked = scaled.map((s, j) => (mask && j > i ? -Infinity : s));
  const w = softmax(masked);
  const out = V[0].map((_, d) => w.reduce((s, wj, j) => s + wj * V[j][d], 0));
  return { raw, scaled, masked, w, out, dk };
}
function initAttention() {
  const mats = document.getElementById('at-mats'), heat = document.getElementById('at-heat'), out = document.getElementById('at-out');
  const scaleBtn = document.getElementById('at-scale'), maskBtn = document.getElementById('at-mask');
  let M, qi = 2, scale = false, mask = false;
  const reset = () => { M = JSON.parse(JSON.stringify(AT_EX)); };
  function buildInputs() {
    mats.innerHTML = ['Q', 'K', 'V'].map(name => `<div class="at-mat"><h5>${name}</h5><table>${M[name].map((row, i) => `<tr><th>${AT_TOK[i]}</th>${row.map((v, d) => `<td><input type="number" step="0.5" value="${v}" data-m="${name}" data-i="${i}" data-d="${d}" aria-label="${name} ${AT_TOK[i]} ${d + 1}"></td>`).join('')}</tr>`).join('')}</table></div>`).join('');
    mats.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => { const v = parseFloat(inp.value); if (Number.isFinite(v)) { M[inp.dataset.m][+inp.dataset.i][+inp.dataset.d] = v; render(); } }));
  }
  function render() {
    document.querySelectorAll('#at-q .strat-btn').forEach(b => b.classList.toggle('active', +b.dataset.q === qi));
    scaleBtn.classList.toggle('active', scale); maskBtn.classList.toggle('active', mask);
    mats.querySelectorAll('tr').forEach(tr => { const th = tr.querySelector('th'); if (th) tr.classList.toggle('qrow', th.textContent === AT_TOK[qi] && tr.closest('.at-mat').querySelector('h5').textContent === 'Q'); });
    const rows = [0, 1, 2].map(i => attentionRow(M.Q, M.K, M.V, i, scale, mask)), r = rows[qi];
    // heatmap
    heat.innerHTML = '';
    const x0 = 80, y0 = 40, c = 70;
    AT_TOK.forEach((t, j) => txt(heat, x0 + j * c + c / 2, y0 - 10, t, 'hm-l', 'middle'));
    txt(heat, x0 + 1.5 * c, 16, 'keys (attended to)', 'tick', 'middle');
    rows.forEach((row, i) => {
      txt(heat, x0 - 8, y0 + i * c + c / 2 + 4, AT_TOK[i], 'hm-l' + (i === qi ? ' cur' : ''), 'end');
      row.w.forEach((w, j) => {
        const g = el('g', { class: 'hm-cell' + (i === qi ? ' cur' : '') }, heat);
        el('rect', { x: x0 + j * c + 1, y: y0 + i * c + 1, width: c - 2, height: c - 2, rx: 6, class: mask && j > i ? 'hm-masked' : 'hm-w', 'fill-opacity': mask && j > i ? 1 : (0.08 + w * 0.9).toFixed(3) }, g);
        txt(g, x0 + j * c + c / 2, y0 + i * c + c / 2 + 5, mask && j > i ? '✕' : f2(w), 'hm-v' + (w > 0.5 ? ' dark' : ''), 'middle');
      });
    });
    el('rect', { x: x0 - 2, y: y0 + qi * c - 1, width: 3 * c + 4, height: c + 2, rx: 8, class: 'hm-sel' }, heat);
    txt(heat, 16, y0 + 1.5 * c, 'queries', 'tick', 'middle', { transform: `rotate(-90 16 ${y0 + 1.5 * c})` });
    const q = M.Q[qi], tok = AT_TOK[qi];
    const dots = M.K.map((k, j) => `q·k<sub>${AT_TOK[j]}</sub> = ${q.map((v, d) => `${v}×${k[d]}`).join(' + ')} = <b>${r.raw[j]}</b>`);
    out.innerHTML = `
      <p class="big">Query <b>${tok}</b>: q = [${q.join(', ')}]</p>
      <p><b>1. Dot products</b><br>${dots.join('<br>')}</p>
      <p><b>Scores</b>: [${r.raw.join(', ')}]${scale ? ` ÷ √d<sub>k</sub> = ÷ √${r.dk} → [${r.scaled.map(f3).join(', ')}]` : ' (no scaling)'}${mask ? ` · mask → [${r.masked.map(v => (Number.isFinite(v) ? f3(v) : '−∞')).join(', ')}]` : ''}</p>
      <p><b>Softmax weights</b>: [${r.w.map(f3).join(', ')}]</p>
      <p><b>2. Output</b> = ${r.w.map((w, j) => `${f2(w)}·[${M.V[j].join(', ')}]`).join(' + ')}</p>
      <p class="big">= <b>[${r.out.map(f2).join(', ')}]</b></p>
      <p class="note">${!scale && !mask && qi === 2 && JSON.stringify(M) === JSON.stringify(AT_EX) ? 'This is the exercise: weights ≈ [0.21, 0.21, 0.58], output ≈ [2.00, 1.58].' : scale ? 'Scaling by 1/√d_k shrinks the differences between scores, so the weights become more even.' : mask ? 'With the mask, a token only mixes values from itself and earlier tokens.' : 'The output is a weighted average of the value vectors.'}</p>`;
  }
  document.querySelectorAll('#at-q .strat-btn').forEach(b => b.addEventListener('click', () => { qi = +b.dataset.q; render(); }));
  scaleBtn.addEventListener('click', () => { scale = !scale; render(); });
  maskBtn.addEventListener('click', () => { mask = !mask; render(); });
  document.getElementById('at-reset').addEventListener('click', () => { reset(); scale = false; mask = false; qi = 2; buildInputs(); render(); });
  reset(); buildInputs(); render();
}

/* ---------- causal mask ---------- */
function initCausal() {
  const svg = document.getElementById('cm-heat'), out = document.getElementById('cm-out');
  let mask = true, sel = 2;
  function render() {
    document.querySelectorAll('#cm-mode .strat-btn').forEach(b => b.classList.toggle('active', +b.dataset.m === (mask ? 1 : 0)));
    const W = CM_S.map((row, i) => softmax(row.map((s, j) => (mask && j > i ? -Infinity : s))));
    svg.innerHTML = '';
    const x0 = 62, y0 = 58, c = 50;
    CM_TOK.forEach((t, j) => txt(svg, x0 + j * c + c / 2, y0 - 10, t, 'hm-l', 'middle'));
    txt(svg, x0 + 3 * c, 20, 'keys (attended to) →', 'tick', 'middle');
    W.forEach((row, i) => {
      const lab = txt(svg, x0 - 8, y0 + i * c + c / 2 + 4, CM_TOK[i], 'hm-l' + (i === sel ? ' cur' : ''), 'end');
      lab.style.cursor = 'pointer'; lab.addEventListener('click', () => { sel = i; render(); });
      row.forEach((w, j) => {
        const g = el('g', { class: 'hm-cell' }, svg);
        const masked = mask && j > i;
        el('rect', { x: x0 + j * c + 1, y: y0 + i * c + 1, width: c - 2, height: c - 2, rx: 5, class: masked ? 'hm-masked' : j > i ? 'hm-w future' : 'hm-w', 'fill-opacity': masked ? 1 : (0.08 + w * 0.9).toFixed(3) }, g);
        txt(g, x0 + j * c + c / 2, y0 + i * c + c / 2 + 4, masked ? '✕' : f2(w), 'hm-v small' + (w > 0.5 ? ' dark' : ''), 'middle');
        g.addEventListener('click', () => { sel = i; render(); });
      });
    });
    el('rect', { x: x0 - 2, y: y0 + sel * c - 1, width: 6 * c + 4, height: c + 2, rx: 7, class: 'hm-sel' }, svg);
    if (!mask) el('path', { d: `M${x0},${y0} L${x0 + 6 * c},${y0 + 6 * c}`, class: 'cm-diag' }, svg);
    const row = W[sel], future = row.reduce((s, w, j) => s + (j > sel ? w : 0), 0);
    const unmasked = softmax(CM_S[sel]), futureUn = unmasked.reduce((s, w, j) => s + (j > sel ? w : 0), 0);
    out.innerHTML = `
      <p class="big">Row <b>${CM_TOK[sel]}</b> (position ${sel + 1})</p>
      ${row.map((w, j) => `<div class="cm-bar${j > sel ? ' fut' : ''}"><span>${CM_TOK[j]}</span><div><i style="width:${(w * 100).toFixed(1)}%"></i></div><b>${f2(w)}</b></div>`).join('')}
      <p>${mask ? `Allowed: positions 1–${sel + 1}. Without the mask, <b>${(futureUn * 100).toFixed(0)}%</b> of this row's attention would go to future tokens.` : `<b>${(future * 100).toFixed(0)}%</b> of this row's attention goes to <b>future</b> tokens (above the diagonal): information the model will not have when it generates.`}</p>
      <p class="note">Click a row label or cell to inspect another token.</p>`;
  }
  document.querySelectorAll('#cm-mode .strat-btn').forEach(b => b.addEventListener('click', () => { mask = b.dataset.m === '1'; render(); }));
  render();
}

/* ---------- communicate vs compute ---------- */
function initCommCompute() {
  const svg = document.getElementById('cc-plot'), out = document.getElementById('cc-out');
  const toks = ['The', 'cat', 'sat', 'on', 'the'], d = 4, r = rng(21);
  const Xs = toks.map(() => Array.from({ length: d }, () => 0.25 + r() * 0.6));
  const W = Array.from({ length: d }, () => Array.from({ length: d }, () => gauss(r) * 0.6));
  const A = [[1], [0.4, 0.6], [0.15, 0.6, 0.25], [0.1, 0.2, 0.5, 0.2], [0.05, 0.35, 0.2, 0.25, 0.15]];
  let mode = 'attn';
  function render() {
    document.querySelectorAll('#cc-mode .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.m === mode));
    const after = mode === 'attn'
      ? Xs.map((x, i) => x.map((v, k) => v + 0.6 * A[i].reduce((s, a, j) => s + a * Xs[j][k], 0) - 0.3))
      : Xs.map(x => x.map((v, k) => v + 0.5 * Math.tanh(W[k].reduce((s, w, j) => s + w * x[j], 0))));
    svg.innerHTML = '';
    const cx = (i) => 70 + i * 120, top = 140, bot = 300, bw = 14;
    toks.forEach((t, i) => {
      const g = el('g', { transform: `translate(${cx(i)} 0)` }, svg);
      txt(g, 0, top + 18, t, 'cc-t', 'middle');
      Xs[i].forEach((v, k) => el('rect', { x: -2 * bw + k * bw, y: top - v * 50, width: bw - 1, height: v * 50, class: `cc-bar b${k}` }, g));
      after[i].forEach((v, k) => { const h = Math.max(2, Math.min(1.4, v) * 50); el('rect', { x: -2 * bw + k * bw, y: bot - h, width: bw - 1, height: h, class: `cc-bar b${k}` }, g); });
      txt(g, 0, bot + 14, `${t}′`, 'tick', 'middle');
    });
    txt(svg, 8, top - 50, 'input', 'tick'); txt(svg, 8, bot - 62, 'output', 'tick');
    if (mode === 'attn') {
      A.forEach((row, i) => row.forEach((a, j) => {
        if (j === i) return;
        const x1 = cx(j), x2 = cx(i), h = 18 + (x2 - x1) * 0.1;
        el('path', { d: `M${x1},${top - 56} C${x1},${top - 56 - h} ${x2},${top - 56 - h} ${x2},${top - 56}`, class: 'cc-arc', 'stroke-width': (a * 8).toFixed(1) }, svg);
      }));
      toks.forEach((_, i) => el('path', { d: `M${cx(i)},${top + 26} L${cx(i)},${bot - 80}`, class: 'cc-down' }, svg));
      out.innerHTML = 'Self-attention: each position <b>reads from the earlier positions</b> (arcs, thickness = attention weight) and adds a weighted average of their values to its own vector. Information moves <b>across</b> positions.';
    } else {
      toks.forEach((_, i) => { el('rect', { x: cx(i) - 26, y: top + 34, width: 52, height: 22, rx: 6, class: 'cc-mlp' }, svg); txt(svg, cx(i), top + 49, 'MLP', 'cc-mlp-t', 'middle'); el('path', { d: `M${cx(i)},${top + 26} L${cx(i)},${top + 34} M${cx(i)},${top + 56} L${cx(i)},${bot - 80}`, class: 'cc-down' }, svg); });
      out.innerHTML = 'MLP: the <b>same</b> small network is applied to every position <b>separately</b>; no arrows between columns. It computes new features from what each position already holds. Information does not move between positions.';
    }
  }
  document.querySelectorAll('#cc-mode .strat-btn').forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; render(); }));
  render();
}

/* ---------- residual connections ---------- */
function residualRun(seed, gain, L = 24, d = 16) {
  const r = rng(seed);
  const Ws = Array.from({ length: L }, () => Array.from({ length: d }, () => Array.from({ length: d }, () => gauss(r) / Math.sqrt(d))));
  const x0 = Array.from({ length: d }, () => gauss(r));
  const run = (res) => {
    let x = x0.slice();
    const sims = [1];
    const jac = [];
    Ws.forEach(W => {
      const z = W.map(row => gain * dot(row, x)), f = z.map(Math.tanh);
      jac.push(W.map((row, i) => row.map((w, j) => (1 - f[i] ** 2) * gain * w + (res && i === j ? 1 : 0))));
      x = res ? x.map((v, i) => v + f[i]) : f;
      sims.push(cosine(x, x0));
    });
    // gradient of the output w.r.t. the input, along one direction: backward through the layers
    let v = Array.from({ length: d }, () => 1 / Math.sqrt(d));
    for (let l = L - 1; l >= 0; l--) { const J = jac[l]; v = J[0].map((_, j) => J.reduce((s, row, i) => s + row[j] * v[i], 0)); }
    return { sims, grad: norm(v), norm: norm(x) };
  };
  return { res: run(true), plain: run(false) };
}
function initResidual() {
  const svg = document.getElementById('rs-plot'), out = document.getElementById('rs-out'), gS = document.getElementById('rs-g');
  let seed = 5;
  function render() {
    const gain = +gS.value;
    document.getElementById('rs-g-val').textContent = f2(gain);
    const { res, plain } = residualRun(seed, gain);
    svg.innerHTML = '';
    const X = (l) => 45 + l * 15, Y = (s) => 215 - (Math.max(-0.5, s) + 0.5) / 1.5 * 195;
    el('line', { x1: 45, y1: Y(0), x2: 410, y2: Y(0), class: 'axis' }, svg);
    el('line', { x1: 45, y1: 215, x2: 45, y2: 15, class: 'axis' }, svg);
    [-0.5, 0, 0.5, 1].forEach(v => { txt(svg, 39, Y(v) + 4, v, 'tick', 'end'); if (v) el('line', { x1: 45, y1: Y(v), x2: 410, y2: Y(v), class: 'grid-line' }, svg); });
    [0, 6, 12, 18, 24].forEach(l => txt(svg, X(l), 232, l, 'tick', 'middle'));
    txt(svg, 228, 252, 'layer', 'tick', 'middle');
    txt(svg, 14, 115, 'cos(x, input)', 'tick', 'middle', { transform: 'rotate(-90 14 115)' });
    [[plain.sims, 'rs-plain'], [res.sims, 'rs-res']].forEach(([s, cls]) => {
      el('path', { d: s.map((v, l) => `${l ? 'L' : 'M'}${X(l)},${Y(v).toFixed(1)}`).join(''), class: cls }, svg);
      s.forEach((v, l) => { if (l % 4 === 0) el('circle', { cx: X(l), cy: Y(v), r: 3, class: cls + '-d' }, svg); });
    });
    const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
    const lg = (v) => { if (v >= 0.01 && v < 1000) return f2(v); const [m, e] = v.toExponential(1).split('e'); return `${m} × 10${String(+e).split('').map(c => SUP[c]).join('')}`; };
    out.innerHTML = `
      <p class="bt-legend"><span class="k ln rs-kr"></span> x + f(x) (residual) &nbsp; <span class="k ln rs-kp"></span> f(x) (no residual)</p>
      <p>Similarity to the input after 24 layers: residual <b>${sgn(res.sims[24])}</b>, no residual <b>${sgn(plain.sims[24])}</b></p>
      <p>Size of the gradient that reaches the input (back-propagated through all 24 layers): residual <b>${lg(res.grad)}</b>, no residual <b>${lg(plain.grad)}</b></p>
      <p class="note">${plain.grad < 1e-3 ? 'Without residuals the gradient <b>vanishes</b>: early layers would barely learn. ' : plain.grad > 1e3 ? 'Without residuals the gradient <b>explodes</b>. ' : ''}With residuals each layer only nudges the vector, and the identity path keeps both the input information and the gradient alive.</p>`;
  }
  gS.addEventListener('input', render);
  document.getElementById('rs-new').addEventListener('click', () => { seed++; render(); });
  render();
}

/* ---------- logits → probabilities → token ---------- */
function initLogits() {
  const out = document.getElementById('lg-out'), tS = document.getElementById('lg-t'), kS = document.getElementById('lg-k');
  const r = rng(99);
  let counts = {}, last = null, n = 0;
  const probs = () => {
    const T = +tS.value, k = +kS.value;
    const z = LOGITS.map(([, l], i) => (i < k ? l / T : -Infinity));
    return softmax(z);
  };
  function sample() { const p = probs(); let u = r(), i = 0; while (i < p.length - 1 && (u -= p[i]) > 0) i++; return LOGITS[i][0]; }
  function render() {
    const T = +tS.value, k = +kS.value, p = probs();
    document.getElementById('lg-t-val').textContent = f2(T);
    document.getElementById('lg-k-val').textContent = k === LOGITS.length ? 'all' : k;
    const mx = Math.max(...p);
    out.innerHTML = `
      <div class="table-wrap"><table class="summary lg-table"><thead><tr><th>token</th><th>logit z</th><th>z / T</th><th>probability</th><th></th>${n ? '<th>sampled</th>' : ''}</tr></thead><tbody>
      ${LOGITS.map(([w, l], i) => `<tr class="${i >= k ? 'off' : ''}${w === last ? ' last' : ''}"><td><b>${w}</b>${['mat', 'floor', 'chair', 'moon'].includes(w) ? '' : ' <span class="lg-inv">*</span>'}</td><td>${sgn(l, 1)}</td><td>${i < k ? sgn(l / T, 2) : '—'}</td><td>${p[i] < 0.0005 && p[i] > 0 ? p[i].toExponential(1) : f3(p[i])}</td><td class="lg-barcell"><div class="lg-bar"><i style="width:${(p[i] / mx * 100).toFixed(1)}%"></i></div></td>${n ? `<td>${counts[w] || 0}</td>` : ''}</tr>`).join('')}
      </tbody></table></div>
      <p>Greedy choice: <b>${LOGITS[p.indexOf(mx)][0]}</b>${last ? ` · last sample: <b>${last}</b>` : ''}${n ? ` · ${n} samples` : ''}</p>
      <p class="note">* invented vocabulary entries. ${T < 0.5 ? 'Low temperature: almost all probability on mat, like greedy decoding.' : T > 1.6 ? 'High temperature: the distribution flattens; even roof and moon get picked now and then.' : k < LOGITS.length ? `Top-${k}: tokens outside the top ${k} get probability 0, the rest are renormalised.` : 'T = 1 is the model\'s own distribution.'}</p>`;
  }
  document.getElementById('lg-sample').addEventListener('click', () => { last = sample(); counts[last] = (counts[last] || 0) + 1; n++; render(); });
  document.getElementById('lg-sample100').addEventListener('click', () => { for (let i = 0; i < 100; i++) { last = sample(); counts[last] = (counts[last] || 0) + 1; n++; } render(); });
  document.getElementById('lg-clear').addEventListener('click', () => { counts = {}; last = null; n = 0; render(); });
  [tS, kS].forEach(s => s.addEventListener('input', render));
  render();
}

/* ---------- the complete pipeline ---------- */
function initPipeline() {
  const stagesBox = document.getElementById('pl-stages'), out = document.getElementById('pl-out'), stepLbl = document.getElementById('pl-step');
  const toks = ['The', ' cat', ' sat', ' on', ' the'], ids = [17, 324, 981, 290, 263];
  const r = rng(3), row = () => Array.from({ length: 5 }, () => sgn(gauss(r) * 0.6, 2));
  const emb = toks.map(row), pos = toks.map(row), hid = toks.map(row);
  const p = softmax(LOGITS.map(x => x[1]));
  const vecRows = (labels, rows) => `<div class="pl-mat">${rows.map((rw, i) => `<div><span>${esc(labels[i]).replace(/ /g, '␣')}</span>[${rw.join(', ')}, … ]</div>`).join('')}</div>`;
  const STAGES = [
    ['Text', 'a string', `<p class="pl-big">“The cat sat on the”</p>`],
    ['Tokens', '5 tokens', `<div class="tk-chips">${toks.map(t => `<span class="tk-chip">${esc(t).replace(/ /g, '␣')}</span>`).join('')}</div><p class="note">GPT-style tokenizers keep the space in front of a word as part of the token (␣cat).</p>`],
    ['Token IDs', '5 integers', `<p class="pl-big">[${ids.join(', ')}]</p><p class="note">Row numbers in the embedding table: pure identifiers (illustrative values).</p>`],
    ['Embeddings', '5 × 768', `${vecRows(toks, emb)}<p class="note">Row ID of the 50 257 × 768 embedding matrix, one vector per token.</p>`],
    ['+ positions', '5 × 768', `${vecRows(toks.map((t, i) => `P${i + 1}`), pos)}<p class="note">A position vector is added to each token vector: <b>what</b> + <b>where</b>.</p>`],
    ['Transformer blocks × 12', '5 × 768', `<p>Each of the 12 blocks: <b>masked self-attention</b> (+ residual) then <b>MLP</b> (+ residual). The shape stays 5 × 768; the content becomes contextual: the vector at “the” now carries information about “cat sat on”.</p>`],
    ['Last hidden state', '1 × 768', `${vecRows(['h_last'], [hid[4]])}<p class="note">Only the last position's vector is needed to predict the next token.</p>`],
    ['Logits', '50 257 scores', `<p>z = h<sub>last</sub> W<sub>out</sub>: one score per vocabulary token.</p><p class="pl-big">${LOGITS.slice(0, 4).map(([w, l]) => `${w} ${l}`).join(' · ')} · …</p>`],
    ['Softmax', 'probabilities, sum = 1', `<p class="pl-big">${LOGITS.slice(0, 4).map(([w], i) => `${w} ${f2(p[i])}`).join(' · ')} · …</p>`],
    ['Next token', '1 token', `<p class="pl-big">The cat sat on the <b class="pl-new">mat</b></p><p class="note">Append it and run the pipeline again for the next token: that is text generation.</p>`],
  ];
  let step = 0;
  function render() {
    stepLbl.textContent = `Stage ${step + 1} / ${STAGES.length}`;
    stagesBox.innerHTML = STAGES.map(([name, shape], i) => `<button class="pl-stage${i === step ? ' cur' : i < step ? ' done' : ''}" data-i="${i}"><span>${name}</span><small>${shape}</small></button>`).join('<span class="pl-arrow">↓</span>');
    stagesBox.querySelectorAll('.pl-stage').forEach(b => b.addEventListener('click', () => { step = +b.dataset.i; render(); }));
    const [name, shape, body] = STAGES[step];
    out.innerHTML = `<h5 class="pl-h">${name} <span>${shape}</span></h5>${body}`;
  }
  document.getElementById('pl-next').addEventListener('click', () => { step = Math.min(STAGES.length - 1, step + 1); render(); });
  document.getElementById('pl-prev').addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
  document.getElementById('pl-reset').addEventListener('click', () => { step = 0; render(); });
  render();
}

/* ---------- generation loop ---------- */
function initGenerate() {
  const textBox = document.getElementById('gn-text'), out = document.getElementById('gn-out'), tS = document.getElementById('gn-t');
  const PROMPT = ['the', 'cat', 'sat', 'on', 'the'];
  let seq = PROMPT.slice(), mode = 'sample', seed = 7, r = rng(seed), lastPick = null;
  const done = () => seq[seq.length - 1] === '.' || seq.length >= 22;
  function temper(dist) {
    const T = +tS.value, z = dist.map(([, p]) => Math.log(p) / T), q = softmax(z);
    return dist.map(([w, , c], i) => [w, q[i], c]);
  }
  function step() {
    if (done()) return;
    const d = temper(nextDist(seq).dist);
    let i = 0;
    if (mode === 'greedy') i = 0;
    else { let u = r(); while (i < d.length - 1 && (u -= d[i][1]) > 0) i++; }
    lastPick = { w: d[i][0], p: d[i][1] };
    seq.push(d[i][0]);
  }
  function render() {
    document.getElementById('gn-t-val').textContent = (+tS.value).toFixed(1);
    document.querySelectorAll('#gn-mode .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.m === mode));
    textBox.innerHTML = seq.map((w, i) => `<span class="gn-tok${i < PROMPT.length ? ' prompt' : ''}${i === seq.length - 1 && i >= PROMPT.length ? ' last' : ''}">${esc(w)}</span>`).join('') + (done() ? '<span class="gn-end">end</span>' : '<span class="gn-cursor">?</span>');
    if (done()) {
      out.innerHTML = `<p class="big">Finished: ${seq[seq.length - 1] === '.' ? 'the model produced the end token “.”' : 'length limit reached'}.</p><p class="note">Press ↺ and generate again: with sampling you get a different continuation; with greedy decoding always the same one.</p>`;
    } else {
      const { used, dist } = nextDist(seq), d = temper(dist).slice(0, 6), mx = d[0][1];
      out.innerHTML = `
        <p>Next-token distribution, from what followed “<b>${esc(used)}</b>” in training${+tS.value !== 1 ? `, at temperature ${(+tS.value).toFixed(1)}` : ''}:</p>
        ${d.map(([w, pr, c]) => `<div class="cm-bar"><span>${esc(w)}</span><div><i style="width:${(pr / mx * 100).toFixed(1)}%"></i></div><b>${f2(pr)}</b></div>`).join('')}
        ${lastPick ? `<p class="note">Last step picked “${esc(lastPick.w)}” (probability ${f2(lastPick.p)}).</p>` : '<p class="note">A Transformer would compute this distribution from the <b>whole</b> context with attention; this toy model only looks at the last two words.</p>'}`;
    }
    document.getElementById('gn-step').disabled = done();
    document.getElementById('gn-run').disabled = done();
  }
  document.getElementById('gn-step').addEventListener('click', () => { step(); render(); });
  document.getElementById('gn-run').addEventListener('click', () => { while (!done()) step(); render(); });
  document.getElementById('gn-reset').addEventListener('click', () => { seed++; r = rng(seed); seq = PROMPT.slice(); lastPick = null; render(); });
  document.querySelectorAll('#gn-mode .strat-btn').forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; render(); }));
  tS.addEventListener('input', render);
  render();
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initMath();
  initHero();
  initTokenizers();
  initBPE();
  initEmbeddings();
  initPosition();
  initAttention();
  initCausal();
  initCommCompute();
  initResidual();
  initLogits();
  initPipeline();
  initGenerate();
});
