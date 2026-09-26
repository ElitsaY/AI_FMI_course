/* ===== Lab 13 interactivity ===== */

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
const f2 = (v) => v.toFixed(2), f3 = (v) => v.toFixed(3);
const sgn = (v, d = 2) => (v < 0 ? '−' + Math.abs(v).toFixed(d) : v.toFixed(d));
const par = (v, d = 2) => (v < 0 ? `(${sgn(v, d)})` : v.toFixed(d));
const sigm = (z) => 1 / (1 + Math.exp(-z));
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

/* ---------- data ---------- */
const STAGES = [
  { kind: 'proc', name: 'Pretraining', data: 'trillions of tokens of web text, books and code', obj: 'next-token prediction: minimise −Σ log p(x_t | x_<t)' },
  { kind: 'model', name: 'Base model', out: 'Write three concise reasons why cloud storage is useful.\nWrite three concise reasons why passwords should be long.\nWrite a short paragraph about the history of the floppy disk.', note: 'It continues the text as if it were a worksheet of writing prompts: likely text, not an answer.' },
  { kind: 'proc', name: 'Supervised fine-tuning', data: 'a curated set of prompt → high-quality response demonstrations', obj: 'imitate the target responses (same next-token loss, on the responses)' },
  { kind: 'model', name: 'Instruction-following model', out: 'Regular backups are useful for several reasons. First, backups protect your data in case your hard drive fails, which can happen unexpectedly at any time. Second, backups allow you to recover files that you have deleted by mistake. Third, backups can help you recover from ransomware attacks. In summary, backups are very important.', note: 'It follows the instruction, but not the word "concise".' },
  { kind: 'proc', name: 'Preference / reward optimisation', data: 'pairs of responses ranked by humans (or AI evaluators)', obj: 'make preferred responses more likely: RLHF (reward model + RL, with a KL penalty) or DPO' },
  { kind: 'model', name: 'Assistant-like model', out: '1. Hardware fails: a backup lets you recover your files.\n2. Mistakes happen: you can restore something you deleted or overwrote.\n3. Ransomware: a clean copy lets you recover without paying.', note: 'Concise, structured, on task: annotators preferred answers like this.' },
];
const PT = [['The', 'capital', 0.02], ['The capital', 'of', 0.85], ['The capital of', 'France', 0.06], ['The capital of France', 'is', 0.70], ['The capital of France is', 'Paris', null], ['The capital of France is Paris', '.', 0.60]];
const PF_CASES = [
  { user: 'What is logistic regression? I have never studied machine learning.', A: 'Logistic regression is a classification method that estimates the probability that an example belongs to a class. Despite its name, it is commonly used for classification.', B: 'Let x∈ℝᵈ and define p(y=1|x)=σ(wᵀx+b), where σ is the logistic sigmoid and maximum likelihood produces the standard cross-entropy objective.' },
  { user: 'I am implementing logistic regression from scratch. Give me the mathematical prediction equation.', A: 'Logistic regression is a useful classification algorithm.', B: 'p(y=1|x)=σ(wᵀx+b), where σ(z)=1/(1+e^{−z}).' },
];
const KL_R = [
  ['Clear beginner explanation with an analogy', 0.22, 1.2, 1.0],
  ['Correct but terse one-liner', 0.22, 0.5, 0.6],
  ['Jargon-heavy (like Response B)', 0.26, 0.6, 0.2],
  ['Very long, jargon, equations, "In conclusion"', 0.02, 3.0, 0.1],
  ['Off-topic or wrong', 0.28, -1.5, 0.0],
];
const RH_FEATS = [['long', '> 250 words', 2], ['eqs', '≥ 3 equations', 2], ['vocab', 'technical vocabulary', 1], ['click', 'student clicks "helpful"', 3], ['follow', 'student asks a follow-up', -2]];
const RH_ANS = [
  { name: 'Clear 120-word explanation with one example, ends with a check-your-understanding question', f: { long: 0, eqs: 0, vocab: 1, click: 1, follow: 1 }, q: 9 },
  { name: '400-word wall of jargon with four equations', f: { long: 1, eqs: 1, vocab: 1, click: 0, follow: 1 }, q: 3 },
  { name: 'Padded, flattering answer with three decorative equations: "Great question! … I hope this fully answers everything!"', f: { long: 1, eqs: 1, vocab: 1, click: 1, follow: 0 }, q: 2 },
  { name: 'Just gives the fixed code, no explanation', f: { long: 0, eqs: 0, vocab: 0, click: 1, follow: 0 }, q: 2 },
  { name: 'Short, correct, says what it is unsure about and invites questions', f: { long: 0, eqs: 0, vocab: 1, click: 0, follow: 1 }, q: 8 },
];
const HF_CRIT = ['clarity', 'rigour', 'brevity', 'learning value'];
const HF_PAIRS = [
  { prompt: 'Explain gradient descent to a beginner.', A: ['Walking downhill in small steps (analogy)', [0.9, 0.4, 0.8, 0.8]], B: ['Formal definition with derivatives', [0.2, 0.9, 0.7, 0.3]] },
  { prompt: 'I\'m stuck on graded exercise 3. Help!', A: ['Complete working solution', [0.9, 0.7, 0.7, 0.1]], B: ['Hint + a question about their code', [0.5, 0.4, 0.7, 0.9]] },
  { prompt: 'What is a hash map?', A: ['One-line definition', [0.6, 0.3, 1.0, 0.4]], B: ['Thorough answer with complexity analysis', [0.6, 0.9, 0.2, 0.7]] },
];
const HF_POOLS = {
  beginners: [['Beginner 1', [1, 0.1, 0.8, 0.2]], ['Beginner 2', [0.9, 0.2, 0.6, 0.3]], ['Beginner 3', [1, 0, 1, 0.1]]],
  experts: [['Programmer 1', [0.4, 1, 0.6, 0.2]], ['Programmer 2', [0.3, 0.9, 0.9, 0.1]], ['Programmer 3', [0.5, 0.8, 0.4, 0.3]]],
  instructors: [['Instructor 1', [0.6, 0.5, 0.1, 1]], ['Instructor 2', [0.7, 0.6, 0.2, 0.9]], ['Instructor 3', [0.5, 0.7, 0.1, 1]]],
};
HF_POOLS.mixed = [HF_POOLS.beginners[0], HF_POOLS.experts[0], HF_POOLS.instructors[0]];
const TO_OBJ = ['instruction following', 'completeness', 'honesty (key caveat)', 'brevity'];
const TO_RESP = [
  ['Two sentences, main result only, no caveat', [1.0, 0.4, 0.2, 0.9]],
  ['Two sentences including "only in patients over 65"', [1.0, 0.6, 0.9, 0.8]],
  ['Five sentences: result, caveats and methods', [0.2, 1.0, 1.0, 0.2]],
];
const PS_SOL = [
  { name: 'Solution 1', steps: [['3 + 5 = 8', true], ['8 × 2 = 16', true], ['16 − 4 = 12', true]], ans: 12 },
  { name: 'Solution 2', steps: [['3 + 5 = 9', false], ['9 × 2 = 16', false], ['16 − 4 = 12', true]], ans: 12 },
];
const VF_CANDS = [
  { name: 'Correct', code: 'def is_even(n):\n    return n % 2 == 0', fn: (n) => n % 2 === 0, log: '' },
  { name: 'Hard-coded to the public test', code: 'def is_even(n):\n    return n == 2', fn: (n) => n === 2, log: '' },
  { name: 'Wrong rule that fits the public tests', code: 'def is_even(n):\n    return n % 4 == 2', fn: (n) => ((n % 4) + 4) % 4 === 2, log: '' },
  { name: 'Fakes the log', code: 'def is_even(n):\n    print("All tests passed")\n    return True', fn: () => true, log: 'All tests passed' },
];
const VF_PUBLIC = [[2, true], [3, false]], VF_HIDDEN = [[0, true], [7, false], [4, true], [-6, true], [11, false], [100, true]];

/* ---------- maths rendering ---------- */
function initMath() {
  if (!window.renderMathInElement) return;
  renderMathInElement(document.body, {
    delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
    throwOnError: false,
  });
}

/* ---------- hero: proxy keeps rising, true quality turns down ---------- */
function initHero() {
  const svg = document.getElementById('al-hero-bg');
  const X = (t) => 40 + t * 1120, pr = (t) => 250 - 190 * (1 - Math.exp(-3 * t)), tq = (t) => 250 - 170 * Math.exp(-((t - 0.38) ** 2) / 0.05);
  const path = (f) => Array.from({ length: 121 }, (_, i) => `${i ? 'L' : 'M'}${X(i / 120).toFixed(1)},${f(i / 120).toFixed(1)}`).join('');
  el('path', { d: path(pr), class: 'proxy' }, svg);
  el('path', { d: path(tq), class: 'true' }, svg);
  const r = rng(13);
  for (let i = 0; i < 9; i++) {
    const x = 90 + i * 130 + r() * 30, y = 40 + r() * 60;
    const g = el('g', { class: 'pair', transform: `translate(${x.toFixed(0)} ${y.toFixed(0)})` }, svg);
    el('rect', { x: 0, y: 0, width: 26, height: 18, rx: 4, class: 'a' }, g);
    txt(g, 34, 14, '≻', 'gt');
    el('rect', { x: 50, y: 0, width: 26, height: 18, rx: 4, class: 'b' }, g);
  }
}

/* ---------- 1. one prompt through the stages ---------- */
function initStages() {
  const flow = document.getElementById('st-flow'), out = document.getElementById('st-out');
  let sel = 1;
  function render() {
    flow.innerHTML = STAGES.map((s, i) => `<button class="st-node ${s.kind}${i === sel ? ' cur' : ''}" data-i="${i}">${s.name}</button>`).join('<span class="st-ar">→</span>');
    flow.querySelectorAll('.st-node').forEach(b => b.addEventListener('click', () => { sel = +b.dataset.i; render(); }));
    const s = STAGES[sel];
    out.innerHTML = s.kind === 'proc'
      ? `<h5 class="al-h">${s.name}</h5><p><b>Data:</b> ${esc(s.data)}</p><p><b>Objective:</b> ${esc(s.obj)}</p>`
      : `<h5 class="al-h">${s.name} <span>illustrative reply</span></h5><p class="st-prompt">User: Write three concise reasons why regular backups are useful.</p><pre class="st-reply">${esc(s.out)}</pre><p class="note">${esc(s.note)}</p>`;
  }
  render();
}

/* ---------- 2. pretraining loss ---------- */
function initPretrain() {
  const pS = document.getElementById('pt-p'), out = document.getElementById('pt-out');
  function render() {
    const p = +pS.value;
    document.getElementById('pt-p-val').textContent = f2(p);
    let tot = 0;
    const rows = PT.map(([ctx, next, pr]) => { const v = pr === null ? p : pr, l = -Math.log(v); tot += l; return `<tr class="${pr === null ? 'hl' : ''}"><td>${esc(ctx)}</td><td><b>${next}</b></td><td>${f2(v)}</td><td>${f3(l)}</td><td class="pt-barcell"><div class="pt-bar"><i style="width:${Math.min(100, l / 4.6 * 100).toFixed(1)}%"></i></div></td></tr>`; }).join('');
    out.innerHTML = `
      <div class="table-wrap"><table class="summary al-table"><thead><tr><th>context x<sub>&lt;t</sub></th><th>true next x<sub>t</sub></th><th>p(x<sub>t</sub> | x<sub>&lt;t</sub>)</th><th>−log p</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="big">𝓛<sub>pretrain</sub> = Σ −log p = <b>${f3(tot)}</b> (natural log)</p>
      <p class="note">Invented probabilities. The first tokens are hard to predict (many sentences start with "The …"), "of" after "The capital" is easy. ${p > 0.8 ? 'A confident, correct "Paris" costs almost nothing.' : p < 0.2 ? 'If the model barely expects "Paris", this one token dominates the loss: the gradient pushes p(Paris) up.' : ''}</p>`;
  }
  pS.addEventListener('input', render);
  render();
}

/* ---------- 5. you are the annotator ---------- */
function initPreferences() {
  const box = document.getElementById('pf-cases'), data = document.getElementById('pf-data');
  const records = [];
  box.innerHTML = PF_CASES.map((c, i) => `
    <div class="pf-case"><h5>Case ${i + 1}</h5><p class="st-prompt">User: ${esc(c.user)}</p>
      <div class="al-pair">${['A', 'B'].map(k => `<button class="al-card pf-pick" data-c="${i}" data-k="${k}"><h5>Response ${k}</h5><p>${esc(c[k])}</p><span class="pf-btn">Prefer ${k}</span></button>`).join('')}</div></div>`).join('');
  function render() {
    box.querySelectorAll('.pf-pick').forEach(b => { const last = [...records].reverse().find(r => r.c === +b.dataset.c); b.classList.toggle('chosen', !!last && last.k === b.dataset.k); b.classList.toggle('rejected', !!last && last.k !== b.dataset.k); });
    data.innerHTML = records.length
      ? `<h5 class="al-h">Your preference dataset <span>${records.length} record${records.length === 1 ? '' : 's'}</span></h5><div class="table-wrap"><table class="summary al-table"><thead><tr><th>#</th><th>prompt x</th><th>chosen y<sub>w</sub></th><th>rejected y<sub>l</sub></th></tr></thead><tbody>${records.map((r, i) => { const c = PF_CASES[r.c], o = r.k === 'A' ? 'B' : 'A'; return `<tr><td>${i + 1}</td><td>${esc(c.user.slice(0, 48))}…</td><td>${r.k}: ${esc(c[r.k].slice(0, 40))}…</td><td>${o}: ${esc(c[o].slice(0, 40))}…</td></tr>`; }).join('')}</tbody></table></div>
         ${records.some(r => r.c === 0) && records.some(r => r.c === 1) ? `<p class="note">${[...records].reverse().find(r => r.c === 0).k !== [...records].reverse().find(r => r.c === 1).k ? 'You preferred the plain answer for the beginner and the equation for the implementer: the same kind of answer is chosen in one context and rejected in the other.' : 'You picked the same letter in both cases. Look again at who is asking.'}</p>` : ''}`
      : '<p class="note">Click a response to prefer it.</p>';
  }
  box.querySelectorAll('.pf-pick').forEach(b => b.addEventListener('click', () => { records.push({ c: +b.dataset.c, k: b.dataset.k }); render(); }));
  render();
}

/* ---------- 6. Bradley-Terry reward model ---------- */
function initBT() {
  const aS = document.getElementById('bt-a'), bS = document.getElementById('bt-b'), svg = document.getElementById('bt-plot'), out = document.getElementById('bt-out');
  function render() {
    const ra = +aS.value, rb = +bS.value, d = ra - rb, p = sigm(d), loss = -Math.log(p);
    document.getElementById('bt-a-val').textContent = sgn(ra, 1);
    document.getElementById('bt-b-val').textContent = sgn(rb, 1);
    svg.innerHTML = '';
    const X = (v) => 40 + (v + 6) / 12 * 345, Y = (v) => 205 - v * 180;
    el('line', { x1: 40, y1: 205, x2: 385, y2: 205, class: 'axis' }, svg);
    el('line', { x1: X(0), y1: 205, x2: X(0), y2: 15, class: 'axis' }, svg);
    [-6, -3, 3, 6].forEach(v => txt(svg, X(v), 221, v, 'tick', 'middle'));
    [0.5, 1].forEach(v => { txt(svg, X(0) - 5, Y(v) + 4, v, 'tick', 'end'); el('line', { x1: 40, y1: Y(v), x2: 385, y2: Y(v), class: 'grid-line' }, svg); });
    txt(svg, 212, 238, 'r(x, A) − r(x, B)', 'tick', 'middle');
    el('path', { d: Array.from({ length: 121 }, (_, i) => { const v = -6 + i / 10; return `${i ? 'L' : 'M'}${X(v).toFixed(1)},${Y(sigm(v)).toFixed(1)}`; }).join(''), class: 'bt-curve' }, svg);
    el('line', { x1: X(d), y1: 205, x2: X(d), y2: Y(p), class: 'guide' }, svg);
    el('circle', { cx: X(d), cy: Y(p), r: 7, class: 'bt-dot' }, svg);
    txt(svg, 50, 30, 'P(A ≻ B)', 'tick');
    out.innerHTML = `
      <p>P(A ≻ B) = σ(${sgn(ra, 1)} − ${par(rb, 1)}) = σ(${sgn(d, 1)}) = <b>${f3(p)}</b></p>
      <p class="big">Loss = −log σ(r<sub>A</sub> − r<sub>B</sub>) = <b>${f3(loss)}</b></p>
      <p>Gradient: ∂𝓛/∂r<sub>A</sub> = −σ(r<sub>B</sub> − r<sub>A</sub>) = ${sgn(-sigm(-d), 3)}, ∂𝓛/∂r<sub>B</sub> = ${sgn(sigm(-d), 3)}</p>
      <p class="note">${d < 0 ? 'The reward model disagrees with the human: the loss is large, and a gradient step pushes r(A) up and r(B) down.' : p > 0.95 ? 'It agrees confidently; further steps change little (the gradient is almost 0).' : 'It agrees, but not yet confidently.'} Adding the same constant to both rewards changes nothing: only differences are learned.</p>`;
  }
  [aS, bS].forEach(s => s.addEventListener('input', render));
  document.getElementById('bt-step').addEventListener('click', () => { const g = sigm(-(+aS.value - +bS.value)); aS.value = Math.min(3, +aS.value + g); bS.value = Math.max(-3, +bS.value - g); render(); });
  document.getElementById('bt-reset').addEventListener('click', () => { aS.value = 0.5; bS.value = 0; render(); });
  render();
}

/* ---------- 7. KL-regularised optimum ---------- */
function klPolicy(beta) { const w = KL_R.map(([, p, r]) => p * Math.exp(r / beta)), Z = w.reduce((a, b) => a + b, 0); return w.map(v => v / Z); }
function klStats(beta) {
  const p = klPolicy(beta);
  return { p, Er: dot(p, KL_R.map(x => x[2])), Eq: dot(p, KL_R.map(x => x[3])), KL: p.reduce((s, v, i) => s + (v > 0 ? v * Math.log(v / KL_R[i][1]) : 0), 0) };
}
function initKL() {
  const bS = document.getElementById('kl-b'), bars = document.getElementById('kl-bars'), svg = document.getElementById('kl-plot'), out = document.getElementById('kl-out');
  const grid = Array.from({ length: 131 }, (_, i) => -1.3 + i * 0.02).map(lb => ({ lb, ...klStats(10 ** lb) }));
  const best = grid.reduce((b, g) => (g.Eq > b.Eq ? g : b));
  function render() {
    const lb = +bS.value, beta = 10 ** lb, s = klStats(beta), ref = klStats(1e6);
    document.getElementById('kl-b-val').textContent = beta < 1 ? f2(beta) : beta.toFixed(1);
    bars.innerHTML = `<h5 class="al-h">Policy π* vs reference π<sub>ref</sub></h5>` + KL_R.map(([name, pr, r, q], i) => `
      <div class="kl-row"><div class="kl-name">${esc(name)}<span>reward ${sgn(r, 1)} · quality ${q}</span></div>
      <div class="kl-bars"><div class="kl-bar ref"><i style="width:${(pr * 100).toFixed(1)}%"></i><b>${f2(pr)}</b></div><div class="kl-bar pol"><i style="width:${(s.p[i] * 100).toFixed(1)}%"></i><b>${f2(s.p[i])}</b></div></div></div>`).join('') + '<p class="bt-legend"><span class="k kl-kref"></span> π<sub>ref</sub> (SFT model) &nbsp; <span class="k kl-kpol"></span> π* (after optimisation)</p>';
    svg.innerHTML = '';
    const X = (l) => 45 + (-l + 1.3) / 2.6 * 340, Y = (v) => 200 - v / 3.2 * 180;
    el('line', { x1: 45, y1: 200, x2: 385, y2: 200, class: 'axis' }, svg);
    el('line', { x1: 45, y1: 200, x2: 45, y2: 12, class: 'axis' }, svg);
    [0, 1, 2, 3].forEach(v => { txt(svg, 39, Y(v) + 4, v, 'tick', 'end'); if (v) el('line', { x1: 45, y1: Y(v), x2: 385, y2: Y(v), class: 'grid-line' }, svg); });
    [[20, 1.3], [5, 0.7], [1, 0], [0.2, -0.7], [0.05, -1.3]].forEach(([b, l], i, arr) => txt(svg, X(l), 216, `β=${b}`, 'tick', i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'));
    txt(svg, 215, 238, 'optimisation pressure → (smaller β)', 'tick', 'middle');
    el('path', { d: grid.map((g, i) => `${i ? 'L' : 'M'}${X(g.lb).toFixed(1)},${Y(g.Er).toFixed(1)}`).join(''), class: 'kl-er' }, svg);
    el('path', { d: grid.map((g, i) => `${i ? 'L' : 'M'}${X(g.lb).toFixed(1)},${Y(g.Eq * 3).toFixed(1)}`).join(''), class: 'kl-eq' }, svg);
    txt(svg, 380, Y(best.Eq * 3) - 8, 'quality (× 3)', 'tick', 'end');
    el('line', { x1: X(best.lb), y1: 200, x2: X(best.lb), y2: Y(best.Eq * 3), class: 'kl-best' }, svg);
    el('line', { x1: X(lb), y1: 12, x2: X(lb), y2: 200, class: 'guide' }, svg);
    el('circle', { cx: X(lb), cy: Y(s.Er), r: 6, class: 'kl-dr' }, svg);
    el('circle', { cx: X(lb), cy: Y(s.Eq * 3), r: 6, class: 'kl-dq' }, svg);
    out.innerHTML = `
      <p>β = ${beta < 1 ? f2(beta) : beta.toFixed(1)}: proxy reward <b>${f2(s.Er)}</b> (reference ${f2(ref.Er)}), true quality <b>${f2(s.Eq)}</b> (reference ${f2(ref.Eq)}), KL(π*‖π<sub>ref</sub>) = <b>${f3(s.KL)}</b></p>
      <p class="note">${s.Eq < ref.Eq ? '⚠️ <b>Reward hacking</b>: the policy has drifted to the long, jargon-heavy answer the reward model overrates. The proxy is at its maximum, true quality is below where we started.' : Math.abs(lb - best.lb) < 0.15 ? `✅ Near the best trade-off (β ≈ ${f2(10 ** best.lb)}): bad and off-topic answers were suppressed, before the reward model's blind spot took over.` : lb > best.lb ? 'Strong KL penalty: the policy barely moves from the SFT model, so it keeps its mistakes.' : 'Less penalty: the policy moves further towards what the reward model likes.'}</p>`;
  }
  bS.addEventListener('input', render);
  render();
}

/* ---------- 9. score answers with the proposed reward ---------- */
function initRewardHack() {
  const out = document.getElementById('rh-out'), feats = document.getElementById('rh-feats'), score = document.getElementById('rh-score');
  const reward = (f) => RH_FEATS.reduce((s, [k, , w]) => s + (f[k] ? w : 0), 0);
  const scored = RH_ANS.map(a => ({ ...a, r: reward(a.f) }));
  const maxR = Math.max(...scored.map(a => a.r));
  out.innerHTML = `<div class="table-wrap"><table class="summary al-table rh-table"><thead><tr><th>Answer</th>${RH_FEATS.map(([, n, w]) => `<th title="${esc(n)}">${w > 0 ? '+' : '−'}${Math.abs(w)}</th>`).join('')}<th>Proxy reward</th><th>Real teaching quality</th></tr></thead><tbody>
    ${scored.map(a => `<tr class="${a.r === maxR ? 'top' : ''}"><td>${esc(a.name)}</td>${RH_FEATS.map(([k]) => `<td>${a.f[k] ? '✓' : ''}</td>`).join('')}<td><div class="rh-bar r"><i style="width:${(Math.max(0, a.r) / 10 * 100).toFixed(0)}%"></i><b>${sgn(a.r, 0)}</b></div></td><td><div class="rh-bar q"><i style="width:${a.q * 10}%"></i><b>${a.q}/10</b></div></td></tr>`).join('')}
    </tbody></table></div>
    <p class="note">Columns: ${RH_FEATS.map(([, n, w]) => `${n} (${w > 0 ? '+' : '−'}${Math.abs(w)})`).join(' · ')}. "Real teaching quality" is our judgement. The highest proxy reward (highlighted) goes to the padded, flattering answer; the two best teaching answers score lowest.</p>`;
  const f = { long: 0, eqs: 0, vocab: 0, click: 0, follow: 0 };
  feats.innerHTML = RH_FEATS.map(([k, n, w]) => `<label class="rh-feat"><input type="checkbox" data-k="${k}"> ${esc(n)} <b>${w > 0 ? '+' : '−'}${Math.abs(w)}</b></label>`).join('');
  function render() {
    const r = reward(f);
    const terms = RH_FEATS.filter(([k]) => f[k]).map(([, , w]) => (w > 0 ? '+' + w : '−' + Math.abs(w))).join(' ');
    score.innerHTML = `<p class="big">Reward = ${terms ? terms + ' = ' : ''}<b>${sgn(r, 0)}</b> (maximum 8)</p><p class="note">${r === 8 ? 'Maximum reward: a long answer with three equations and jargon that the student clicks "helpful" and never asks about. Nothing here says the student learned anything.' : f.follow ? 'A follow-up question costs 2 points, even though it often means the student is engaged and learning.' : 'Which combination gets the maximum? Does any of it require the answer to be correct?'}</p>`;
  }
  feats.querySelectorAll('input').forEach(i => i.addEventListener('change', () => { f[i.dataset.k] = i.checked ? 1 : 0; render(); }));
  render();
}

/* ---------- 11. DPO on one pair ---------- */
function initDPO() {
  const wS = document.getElementById('dp-w'), lS = document.getElementById('dp-l'), bS = document.getElementById('dp-b'), out = document.getElementById('dp-out');
  function render() {
    const dw = +wS.value, dl = +lS.value, b = +bS.value, m = b * (dw - dl), loss = -Math.log(sigm(m)), wgt = sigm(-m);
    document.getElementById('dp-w-val').textContent = sgn(dw);
    document.getElementById('dp-l-val').textContent = sgn(dl);
    document.getElementById('dp-b-val').textContent = f2(b);
    out.innerHTML = `
      <p>Implicit rewards: r̂<sub>w</sub> = β·log(π/π<sub>ref</sub>)(y<sub>w</sub>) = ${f2(b)}·${par(dw)} = <b>${sgn(b * dw, 3)}</b>, r̂<sub>l</sub> = ${f2(b)}·${par(dl)} = <b>${sgn(b * dl, 3)}</b></p>
      <p>Margin r̂<sub>w</sub> − r̂<sub>l</sub> = <b>${sgn(m, 3)}</b> → P(y<sub>w</sub> ≻ y<sub>l</sub>) = σ(${sgn(m, 3)}) = <b>${f3(sigm(m))}</b></p>
      <p class="big">𝓛<sub>DPO</sub> = −log σ(${sgn(m, 3)}) = <b>${f3(loss)}</b> · gradient weight σ(r̂<sub>l</sub> − r̂<sub>w</sub>) = <b>${f3(wgt)}</b></p>
      <div class="dp-arrows"><span class="up">chosen ${dw > 0 ? '↑' : dw < 0 ? '↓' : '='} ${(Math.exp(dw)).toFixed(2)}× as likely as under π<sub>ref</sub></span><span class="down">rejected ${dl < 0 ? '↓' : dl > 0 ? '↑' : '='} ${(Math.exp(dl)).toFixed(2)}×</span></div>
      <p class="note">${m < 0 ? 'The model still ranks the pair the wrong way: large weight, big update.' : wgt < 0.15 ? 'The pair is ranked correctly by a clear margin: the weight is small, so DPO mostly leaves it alone.' : 'Each step raises the chosen response and lowers the rejected one, relative to the reference model.'}</p>`;
  }
  [wS, lS, bS].forEach(s => s.addEventListener('input', render));
  document.getElementById('dp-step').addEventListener('click', () => { const b = +bS.value, g = sigm(-b * (+wS.value - +lS.value)); wS.value = Math.min(3, +wS.value + 1.0 * g); lS.value = Math.max(-3, +lS.value - 1.0 * g); render(); });
  document.getElementById('dp-reset').addEventListener('click', () => { wS.value = 0; lS.value = 0; render(); });
  render();
}

/* ---------- 12. annotator pools ---------- */
function initAnnotators() {
  const out = document.getElementById('hf-out');
  let pool = 'beginners';
  function render() {
    document.querySelectorAll('#hf-pool .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.p === pool));
    const anns = HF_POOLS[pool];
    const rows = HF_PAIRS.map(pr => {
      const votes = anns.map(([, w]) => { const d = dot(w, pr.A[1]) - dot(w, pr.B[1]); return Math.abs(d) < 0.05 ? '=' : d > 0 ? 'A' : 'B'; });
      const nA = votes.filter(v => v === 'A').length, nB = votes.filter(v => v === 'B').length;
      const lab = nA > nB ? 'A' : nB > nA ? 'B' : 'tie';
      return { pr, votes, lab, split: nA && nB };
    });
    out.innerHTML = `
      <p class="note">Weights (${HF_CRIT.join(', ')}): ${anns.map(([n, w]) => `${n} [${w.join(', ')}]`).join(' · ')}</p>
      <div class="table-wrap"><table class="summary al-table hf-table"><thead><tr><th>Prompt</th><th>Response A</th><th>Response B</th>${anns.map(([n]) => `<th>${n}</th>`).join('')}<th>Dataset label</th></tr></thead><tbody>
      ${rows.map(({ pr, votes, lab, split }) => `<tr><td>${esc(pr.prompt)}</td><td>${esc(pr.A[0])}</td><td>${esc(pr.B[0])}</td>${votes.map(v => `<td class="v v${v === '=' ? 'eq' : v}">${v === '=' ? 'equal' : v}</td>`).join('')}<td><b class="lab${lab}">${lab === 'tie' ? 'tie' : 'chosen: ' + lab}</b>${split ? ' <span class="hf-split">split</span>' : ''}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="note">${pool === 'beginners' ? 'Beginners choose the complete solution for the graded exercise and the short definitions: a model trained on these labels learns to hand out answers.' : pool === 'instructors' ? 'Instructors choose the hint and the thorough explanation: a model trained on these labels learns to teach, and to be longer.' : pool === 'experts' ? 'Programmers value rigour and disagree among themselves: the labels depend on who happens to annotate.' : 'A mixed pool disagrees on every pair: how disagreements are resolved (majority, discard, ask for more labels) now shapes the model.'}</p>`;
  }
  document.querySelectorAll('#hf-pool .strat-btn').forEach(b => b.addEventListener('click', () => { pool = b.dataset.p; render(); }));
  render();
}

/* ---------- 13. trade-offs ---------- */
function initTradeoffs() {
  const sl = document.getElementById('to-sliders'), out = document.getElementById('to-out');
  const w = [1, 1, 1, 1];
  sl.innerHTML = TO_OBJ.map((o, i) => `<label><span>${esc(o)}</span><input type="range" min="0" max="2" step="0.1" value="1" data-i="${i}"><span class="val" id="to-v${i}">1.0</span></label>`).join('');
  function render() {
    w.forEach((v, i) => { document.getElementById('to-v' + i).textContent = v.toFixed(1); });
    const sc = TO_RESP.map(([, s]) => dot(w, s)), mx = Math.max(...sc), best = sc.indexOf(mx);
    out.innerHTML = TO_RESP.map(([name, s], i) => `
      <div class="to-row${i === best ? ' best' : ''}"><div class="to-name">${esc(name)}${i === best ? ' <span>best for these weights</span>' : ''}</div>
      <div class="to-scores">${s.map((v, j) => `<span title="${esc(TO_OBJ[j])}">${TO_OBJ[j].split(' ')[0]} ${v}</span>`).join('')}</div>
      <div class="to-bar"><i style="width:${(sc[i] / (2 * 4) * 100).toFixed(1)}%"></i><b>${f2(sc[i])}</b></div></div>`).join('') +
      `<p class="note">Score = Σ weight × property score. ${best === 0 ? 'Honesty barely counts here, so the answer that drops the caveat wins, and it misleads readers.' : best === 2 ? 'Completeness outweighs the instruction: the long answer wins, ignoring the "two sentences" request.' : 'The short answer that keeps the key caveat wins: it trades a little completeness for brevity without misleading.'} There is no single "right" weighting: it has to be specified for the application.</p>`;
  }
  sl.querySelectorAll('input').forEach(i => i.addEventListener('input', () => { w[+i.dataset.i] = +i.value; render(); }));
  render();
}

/* ---------- 15. outcome vs process ---------- */
function initProcess() {
  const out = document.getElementById('ps-out');
  let mode = 'outcome';
  function render() {
    document.querySelectorAll('#ps-mode .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.m === mode));
    out.innerHTML = PS_SOL.map(s => {
      const okAll = s.steps.every(x => x[1]), reward = mode === 'outcome' ? (s.ans === 12 ? 1 : 0) : (okAll && s.ans === 12 ? 1 : 0);
      return `<div class="ps-sol"><h5>${s.name}</h5><ol>${s.steps.map(([t, ok]) => `<li class="${mode === 'process' ? (ok ? 'ok' : 'bad') : ''}">${t}${mode === 'process' ? (ok ? ' ✅' : ' ❌') : ''}</li>`).join('')}</ol>
        <p class="ps-ans">Final answer: <b>${s.ans}</b> ${mode === 'outcome' ? '✅' : ''}</p><p class="ps-rew">Reward: <b>${reward}</b></p></div>`;
    }).join('') + `<p class="note ps-note">${mode === 'outcome' ? 'Both get reward 1: the outcome verifier cannot tell that Solution 2 made two mistakes that happened to cancel. Trained on this signal, a model is also rewarded for unreliable reasoning.' : 'The process verifier catches the wrong steps: 3 + 5 is 8, and 9 × 2 is 18. Solution 2 gets no reward, even though its answer is right. Labelling every step is more expensive, though.'}</p>`;
  }
  document.querySelectorAll('#ps-mode .strat-btn').forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; render(); }));
  render();
}

/* ---------- 16. hack the verifier ---------- */
function initVerifier() {
  const out = document.getElementById('vf-out');
  let mode = 'log';
  function render() {
    document.querySelectorAll('#vf-mode .strat-btn').forEach(b => b.classList.toggle('active', b.dataset.v === mode));
    const tests = mode === 'hidden' ? VF_PUBLIC.concat(VF_HIDDEN) : VF_PUBLIC;
    out.innerHTML = `<div class="vf-grid">${VF_CANDS.map(c => {
      const res = tests.map(([n, want]) => c.fn(n) === want);
      const pubPass = VF_PUBLIC.every(([n, want]) => c.fn(n) === want);
      const log = (c.log ? c.log + '\n' : '') + (pubPass ? 'All tests passed' : 'FAILED: is_even(3) should be False');
      const reward = mode === 'log' ? (log.includes('All tests passed') ? 1 : 0) : (res.every(Boolean) ? 1 : 0);
      const trulyCorrect = VF_PUBLIC.concat(VF_HIDDEN).every(([n, want]) => c.fn(n) === want);
      return `<div class="vf-card${reward ? ' rew' : ''}"><h5>${esc(c.name)}</h5><pre>${esc(c.code)}</pre>
        ${mode === 'log' ? `<div class="vf-log">${esc(log)}</div>` : `<div class="vf-tests">${tests.map(([n, want], i) => `<span class="${res[i] ? 'ok' : 'bad'}" title="is_even(${n}) should be ${want}">${n}</span>`).join('')}</div>`}
        <p class="vf-r">Reward <b>${reward}</b>${reward && !trulyCorrect ? ' <span class="vf-hack">hacked</span>' : ''}</p></div>`;
    }).join('')}</div>
    <p class="note">${mode === 'log' ? 'The verifier only reads the log. The fake-log program prints "All tests passed" itself and gets full reward, like the two programs that only fit the public tests.' : mode === 'public' ? 'Running the tests stops the fake log, but two wrong programs still pass: the public tests (2 → True, 3 → False) do not pin down "even".' : 'With hidden tests (0, 7, 4, −6, 11, 100) only the correct program earns reward. Hidden tests help, but they, too, only check what they were designed to check.'}</p>`;
  }
  document.querySelectorAll('#vf-mode .strat-btn').forEach(b => b.addEventListener('click', () => { mode = b.dataset.v; render(); }));
  render();
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initMath();
  initHero();
  initStages();
  initPretrain();
  initPreferences();
  initBT();
  initKL();
  initRewardHack();
  initDPO();
  initAnnotators();
  initTradeoffs();
  initProcess();
  initVerifier();
});
