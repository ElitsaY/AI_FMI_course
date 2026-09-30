/* ===== Quiz engine: shared by every labNN-quiz.html =====
   The page defines window.QUIZ (in labNN-quiz.js) and has #quiz, #qz-results and .qz-bar.
   Part kinds: mc (one option), multi (all that apply, all-or-nothing), rows (one pill per row,
   points split per row), seq (node sequence built by clicking the task's figure or typing),
   num (typed number; tol = allowed error, pct = also accept a percentage).
   A seq part may use tokens: [...] (buttons to click instead of figure nodes) and sep: '' / ',' (chip separator).
   A multi part may set none: <index of a 'None' option>, which deselects the others (and vice versa).
   Figures may carry notes: { A: 'h=5' } drawn beside the node (h, f or score values).
   A part may have its own (non-clickable) figure, and an id to keep its saved answer when parts are removed.
   Grading runs in the browser; answers are kept in localStorage for this viewer only. */
(function () {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const LETTERS = 'ABCDEFGHIJ';

function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function sv(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
function fmt(x) { return String(Math.round(x * 10) / 10); }
function math(node) {
  if (window.renderMathInElement) renderMathInElement(node, { delimiters: [{ left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }], throwOnError: false });
}

/* ---------- figures: trees ('S(A(C,D),B:4)', ':n' = edge cost, '…' = continues) and graphs with fixed coordinates ---------- */
function parseTree(src) {
  let i = 0;
  function node() {
    let s = '';
    while (i < src.length && '(),'.indexOf(src[i]) < 0) s += src[i++];
    const bits = s.split(':');
    const n = { label: bits[0].trim(), cost: bits.length > 1 ? bits[1].trim() : null, children: [] };
    if (src[i] === '(') { i++; n.children.push(node()); while (src[i] === ',') { i++; n.children.push(node()); } i++; }
    return n;
  }
  return node();
}

function drawFigure(fig) {
  const R = fig.r || 21, PAD = 30, nodes = [], edges = [], goals = new Set(fig.goals || []), depthRows = [];
  let W, H, HIT = 30;   // HIT: invisible tap radius around each node (phones)
  if (fig.tree) {
    const DX = fig.dx || 62, DY = fig.dy || 70, left = fig.depths ? 58 : 0, root = parseTree(fig.tree);
    HIT = Math.min(HIT, DX / 2 - 1);
    let leaf = 0, maxD = 0;
    (function walk(n, d) {
      n.depth = d; maxD = Math.max(maxD, d);
      n.children.forEach(c => walk(c, d + 1));
      n.xi = n.children.length ? (n.children[0].xi + n.children[n.children.length - 1].xi) / 2 : leaf++;
    })(root, 0);
    (function emit(n, parent) {
      const idx = nodes.length, more = n.label === '…';
      nodes.push({ label: n.label, x: left + PAD + n.xi * DX, y: PAD + n.depth * DY, goal: goals.has(n.label), more });
      if (parent != null) edges.push({ a: parent, b: idx, cost: n.cost, more });
      n.children.forEach(c => emit(c, idx));
    })(root, null);
    W = left + 2 * PAD + Math.max(leaf - 1, 1) * DX + (fig.notes ? 34 : 0); H = 2 * PAD + maxD * DY;
    if (fig.depths) for (let d = 0; d <= maxD; d++) depthRows.push([d, PAD + d * DY]);
  } else {
    const at = {};
    Object.keys(fig.nodes).forEach(k => { at[k] = nodes.length; nodes.push({ label: k, x: fig.nodes[k][0], y: fig.nodes[k][1], goal: goals.has(k) }); });
    fig.edges.forEach(e => edges.push({ a: at[e[0]], b: at[e[1]], cost: e[2] }));
    W = fig.w; H = fig.h;
  }
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': fig.alt || 'Search tree' });
  svg.style.maxWidth = Math.round(W * 1.1) + 'px';
  depthRows.forEach(([d, y]) => { sv('text', { x: 4, y, class: 'qz-depth' }, svg).textContent = 'depth ' + d; });
  edges.forEach(e => {
    const p = nodes[e.a], q = nodes[e.b], dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1, rq = q.more ? 10 : R;
    sv('line', { x1: p.x + dx / L * R, y1: p.y + dy / L * R, x2: q.x - dx / L * rq, y2: q.y - dy / L * rq, class: 'qz-edge' + (e.more ? ' more' : '') }, svg);
    if (e.cost != null) {
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, w = String(e.cost).length * 10 + 14;
      sv('rect', { x: mx - w / 2, y: my - 12, width: w, height: 24, rx: 7, class: 'qz-cost-bg' }, svg);
      sv('text', { x: mx, y: my, class: 'qz-cost' }, svg).textContent = e.cost;
    }
  });
  const byLabel = {};
  nodes.forEach(n => {
    const role = /^(MAX|MIN)$/.test(n.label) ? ' ' + n.label.toLowerCase() : '';   // game-tree players
    const g = sv('g', { class: 'qz-node' + (n.goal ? ' goal' : '') + (n.more ? ' more' : '') + role, 'data-label': n.label }, svg);
    if (!n.more) { sv('circle', { cx: n.x, cy: n.y, r: HIT, class: 'hit' }, g); sv('circle', { cx: n.x, cy: n.y, r: R }, g); }
    sv('text', { x: n.x, y: n.y, class: n.label.length > 2 ? 'long' : '' }, g).textContent = n.label;
    if (fig.notes && fig.notes[n.label] != null) sv('text', { x: n.x + R + 5, y: n.y, class: 'qz-note' }, svg).textContent = fig.notes[n.label];
    if (n.more) return;
    const o = sv('g', { class: 'qz-ord', transform: `translate(${n.x + R * 0.9},${n.y - R * 0.9})` }, g);
    sv('circle', { r: 9 }, o); sv('text', {}, o);
    byLabel[n.label] = g;
  });
  return { svg, byLabel };
}

/* ---------- grading ---------- */
function grade(part, ans) {
  const max = part.pts;
  if (part.kind === 'rows') {
    const per = max / part.rows.length, v = ans || {};
    const right = part.rows.filter((r, i) => v[i] === r.answer).length;
    return { got: right * per, max, right, of: part.rows.length, answered: Object.keys(v).length > 0 };
  }
  let ok = false, answered = false;
  if (part.kind === 'mc') { answered = ans != null; ok = ans === part.answer; }
  if (part.kind === 'multi') { const a = (ans || []).slice().sort(), b = part.answer.slice().sort(); answered = a.length > 0; ok = a.length === b.length && a.every((x, i) => x === b[i]); }
  if (part.kind === 'seq') { const a = ans || []; answered = a.length > 0; ok = a.length === part.answer.length && a.every((x, i) => x === part.answer[i]); }
  if (part.kind === 'num') { const v = toNum(ans, part); answered = ans != null && ans !== ''; ok = v != null && Math.abs(v - part.answer) <= (part.tol || 0) + 1e-9; }
  return { got: ok ? max : 0, max, ok, answered };
}
function toNum(ans, part) {
  if (ans == null || ans === '') return null;
  let t = String(ans).replace('%', '').replace(/[−–]/g, '-').replace(/\s+/g, '');
  t = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');   // 135,000 = thousands; 0,37 = decimal comma
  const frac = t.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);   // 1/1040
  const v = frac ? +frac[1] / +frac[2] : parseFloat(t);
  if (isNaN(v)) return null;
  return part.pct && (v > 1 || /%/.test(ans)) ? v / 100 : v;
}
function isAnswered(part, ans) {
  if (part.kind === 'num') return ans != null && ans !== '';
  if (part.kind === 'rows') return !!ans && part.rows.every((r, i) => ans[i] != null);
  if (part.kind === 'mc') return ans != null;
  return !!ans && ans.length > 0;
}

/* ---------- hero: faint checkboxes, some ticked ---------- */
function initHero() {
  const svg = document.querySelector('.art-quiz .hero-art');
  if (!svg) return;
  const r = rng(Number(String(window.QUIZ && window.QUIZ.id || 1).replace(/\D/g, '')) * 97 + 11);
  for (let x = 20; x < 1200; x += 58) for (let y = 18; y < 300; y += 58) {
    if (r() < 0.45) continue;
    const cx = x + r() * 18, cy = y + r() * 18, s = 22 + r() * 8;
    sv('rect', { x: cx, y: cy, width: s, height: s, rx: 6, class: 'box' }, svg);
    if (r() < 0.55) sv('path', { d: `M${cx + s * 0.22} ${cy + s * 0.52} L${cx + s * 0.43} ${cy + s * 0.74} L${cx + s * 0.8} ${cy + s * 0.28}`, class: 'tick t' + Math.floor(r() * 4) }, svg);
  }
}

/* ---------- the quiz ---------- */
function initQuiz() {
  const Q = window.QUIZ, root = document.getElementById('quiz');
  if (!Q || !root) return;
  const KEY = 'class-notes-quiz:' + Q.id;
  let answers = {}, graded = false;
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { answers = s.answers || {}; graded = !!s.graded; } } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ answers, graded })); } catch (e) {} };
  const all = [];   // every part: { task, part, id, ui }
  const tasks = [];

  Q.tasks.forEach((task, ti) => {
    const T = { task, parts: [], seqIds: [], active: null, fig: null };
    tasks.push(T);
    const total = task.parts.reduce((s, p) => s + p.pts, 0);
    const sec = el('section', 'block qz-task'); sec.id = 'task-' + (ti + 1);
    sec.innerHTML = `<div class="qz-head"><span class="qz-no">${ti + 1}</span><div><h2 class="section-title">${task.title}</h2></div></div>`;
    T.total = total;
    if (task.intro) sec.appendChild(el('div', 'qz-intro', task.intro));
    if (task.figure) {
      T.fig = drawFigure(task.figure);
      const box = el('div', 'qz-fig'); box.appendChild(T.fig.svg);
      if (task.parts.some(p => p.kind === 'seq')) {
        box.classList.add('pick');
        box.appendChild(el('p', 'qz-fig-hint', 'Tap the nodes in order to fill the highlighted answer box below (or type the letters in it; Backspace removes the last one).'));
        T.now = el('div', 'qz-fig-now', '<span class="qz-now-lbl"></span><span class="qz-now-seq"></span><button class="qz-mini" type="button">⌫ Undo</button>');
        T.now.querySelector('button').addEventListener('click', () => { const P = T.parts.find(p => p.id === T.active); if (P) pop(P); });
        box.appendChild(T.now);
        Object.keys(T.fig.byLabel).forEach(lab => T.fig.byLabel[lab].addEventListener('click', () => { if (T.active) push(T, T.active, lab); }));
      }
      sec.appendChild(box);
    }
    task.parts.forEach((part, pi) => {
      const id = task.id + '.' + (part.id || pi + 1);   // part.id keeps saved answers stable when parts are removed
      const P = { task: T, part, id };
      P.ui = buildPart(P);
      all.push(P); T.parts.push(P);
      sec.appendChild(P.ui.box);
    });
    if (task.explain) { T.explain = el('div', 'qz-explain', '<p class="qz-explain-h">Explanation</p>' + task.explain); T.explain.hidden = true; sec.appendChild(T.explain); }
    root.appendChild(sec);
    if (T.seqIds.length) setActive(T, T.seqIds[0]);
  });

  /* ----- part widgets ----- */
  function optionButtons(P, cls, pick) {
    const { part } = P, wrap = el('div', 'qz-opts');
    const short = part.options.every(o => o.replace(/\\\(.*?\\\)/g, 'xxxx').length <= 16);
    if (part.inline || (part.inline !== false && short)) wrap.classList.add('inline');
    const btns = part.options.map((o, i) => {
      const b = el('button', cls, (part.letters === false ? '' : `<span class="qz-letter">${LETTERS[i]}</span>`) + `<span>${o}</span>`);
      b.type = 'button'; b.addEventListener('click', () => { if (!graded) pick(i); });
      wrap.appendChild(b); return b;
    });
    return { wrap, btns };
  }

  function buildPart(P) {
    const { part } = P, box = el('div', 'qz-part');
    box.appendChild(el('p', 'qz-q', `${part.q} <span class="qz-pts">${fmt(part.pts)} pt${part.pts === 1 ? '' : 's'}</span>` + (part.kind === 'multi' ? ' <span class="qz-hint">Select all that apply.</span>' : '')));
    if (part.html) box.appendChild(el('div', 'qz-q-extra', part.html));
    if (part.figure) { const f = el('div', 'qz-fig qz-fig-part'); f.appendChild(drawFigure(part.figure).svg); box.appendChild(f); }
    const fb = el('p', 'qz-fb'); fb.hidden = true;
    let refresh = () => {}, mark = () => {};

    if (part.kind === 'mc' || part.kind === 'multi') {
      const { wrap, btns } = optionButtons(P, 'qz-opt', i => {
        if (part.kind === 'mc') answers[P.id] = answers[P.id] === i ? undefined : i;
        else {   // part.none: index of a "None" option that excludes the others
          const s = new Set(answers[P.id] || []); s.has(i) ? s.delete(i) : s.add(i);
          if (part.none != null && s.has(i)) { if (i === part.none) { s.clear(); s.add(i); } else s.delete(part.none); }
          answers[P.id] = [...s];
        }
        changed();
      });
      wrap.setAttribute('role', part.kind === 'mc' ? 'radiogroup' : 'group');
      box.appendChild(wrap);
      refresh = () => {
        const a = answers[P.id];
        btns.forEach((b, i) => { const on = part.kind === 'mc' ? a === i : (a || []).includes(i); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      };
      mark = () => {
        const a = answers[P.id], chosen = i => part.kind === 'mc' ? a === i : (a || []).includes(i), right = i => part.kind === 'mc' ? part.answer === i : part.answer.includes(i);
        btns.forEach((b, i) => { b.classList.toggle('correct', right(i) && chosen(i)); b.classList.toggle('missed', right(i) && !chosen(i)); b.classList.toggle('wrong', !right(i) && chosen(i)); });
      };
    }

    if (part.kind === 'rows') {
      const rowsBox = el('div', 'qz-rows'), pills = [];
      part.rows.forEach((row, ri) => {
        const r = el('div', 'qz-row'); r.appendChild(el('div', 'qz-row-lbl', row.label));
        const ps = el('div', 'qz-pills');
        pills.push(part.options.map((o, oi) => {
          const b = el('button', 'qz-pill', o); b.type = 'button';
          b.addEventListener('click', () => {
            if (graded) return;
            const v = Object.assign({}, answers[P.id]);
            if (v[ri] === oi) delete v[ri]; else v[ri] = oi;
            answers[P.id] = v; changed();
          });
          ps.appendChild(b); return b;
        }));
        r.appendChild(ps); rowsBox.appendChild(r);
      });
      box.appendChild(rowsBox);
      refresh = () => { const v = answers[P.id] || {}; pills.forEach((row, ri) => row.forEach((b, oi) => { b.classList.toggle('on', v[ri] === oi); b.setAttribute('aria-pressed', v[ri] === oi); })); };
      mark = () => {
        const v = answers[P.id] || {};
        pills.forEach((row, ri) => row.forEach((b, oi) => {
          const right = part.rows[ri].answer === oi, chosen = v[ri] === oi;
          b.classList.toggle('correct', right && chosen); b.classList.toggle('missed', right && !chosen); b.classList.toggle('wrong', !right && chosen);
        }));
      };
    }

    if (part.kind === 'num') {
      const wrap = el('label', 'qz-numrow');
      if (part.prefix) wrap.appendChild(el('span', 'qz-num-pre', part.prefix));
      const inp = el('input', 'qz-num'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.spellcheck = false;
      inp.placeholder = part.placeholder || 'number';
      wrap.appendChild(inp);
      if (part.suffix) wrap.appendChild(el('span', 'qz-num-pre', part.suffix));
      box.appendChild(wrap);
      inp.addEventListener('input', () => { if (graded) return; answers[P.id] = inp.value.trim() === '' ? undefined : inp.value.trim(); changed(); });
      refresh = () => { const v = answers[P.id] == null ? '' : answers[P.id]; if (inp.value.trim() !== v) inp.value = v; inp.disabled = graded; };
      mark = () => { const r = grade(part, answers[P.id]); inp.classList.toggle('correct', r.ok); inp.classList.toggle('wrong', r.answered && !r.ok); };
    }

    if (part.kind === 'seq') {
      const T = P.task; T.seqIds.push(P.id);
      const s = el('div', 'qz-seq'); s.tabIndex = 0; s.setAttribute('role', 'textbox'); s.setAttribute('aria-label', part.label || part.q.replace(/<[^>]+>/g, ''));
      if (part.label) s.appendChild(el('span', 'qz-seq-lbl', part.label));
      const chips = el('div', 'qz-seq-chips'); s.appendChild(chips);
      const btns = el('div', 'qz-seq-btns');
      const undo = el('button', 'qz-mini', '⌫ Undo'), clear = el('button', 'qz-mini', 'Clear');
      undo.type = clear.type = 'button';
      btns.append(undo, clear); s.appendChild(btns);
      box.appendChild(s);
      if (part.tokens) {   // build the sequence from buttons instead of figure nodes
        const tw = el('div', 'qz-tokens');
        part.tokens.forEach(t => { const b = el('button', 'qz-pill qz-tok', t); b.type = 'button'; b.addEventListener('click', () => push(T, P.id, t)); tw.appendChild(b); });
        box.appendChild(tw);
      }
      const labels = () => part.tokens || Object.keys(T.fig ? T.fig.byLabel : {});
      s.addEventListener('click', () => setActive(T, P.id));
      s.addEventListener('focus', () => setActive(T, P.id));
      undo.addEventListener('click', e => { e.stopPropagation(); setActive(T, P.id); pop(P); });
      clear.addEventListener('click', e => { e.stopPropagation(); setActive(T, P.id); if (!graded) { answers[P.id] = []; changed(); } });
      s.addEventListener('keydown', e => {
        if (graded || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === 'Backspace') { e.preventDefault(); pop(P); return; }
        const hit = labels().find(l => l.toLowerCase() === e.key.toLowerCase());
        if (hit) { e.preventDefault(); push(T, P.id, hit); }
      });
      P.seqBox = s;
      refresh = (bad) => {
        const a = answers[P.id] || [];
        const sep = part.sep != null ? part.sep : '→';
        chips.innerHTML = a.length ? a.map((l, i) => `${i && sep ? `<span class="qz-arr">${sep}</span>` : ''}<span class="chip${bad != null && i >= bad ? ' bad' : ''}${bad != null && i < bad ? ' good' : ''}">${l}</span>`).join('')
          : `<span class="qz-seq-empty">${part.placeholder || (part.tokens ? 'Click the buttons below in order…' : 'Click the nodes in order…')}</span>`;
        if (T.active === P.id) badges(T);
      };
      mark = () => {
        const a = answers[P.id] || [], ex = part.answer;
        let k = 0; while (k < a.length && k < ex.length && a[k] === ex[k]) k++;
        refresh(k);   // chips before k green, from k on red
      };
    }

    return { box, fb, refresh, mark: () => { mark(); showFeedback(P, fb); }, init() { box.appendChild(fb); refresh(); } };
  }

  function showFeedback(P, fb) {
    const { part } = P, r = grade(part, answers[P.id]);
    fb.hidden = false;
    const pts = `${fmt(r.got)} / ${fmt(r.max)} pts`;
    if (!r.answered) { fb.className = 'qz-fb bad'; fb.innerHTML = `<b>Not answered</b> · ${pts}` + correctText(part); }
    else if (part.kind === 'rows') {
      fb.className = 'qz-fb ' + (r.right === r.of ? 'ok' : r.right ? 'part' : 'bad');
      fb.innerHTML = `<b>${r.right === r.of ? '✓ All correct' : `${r.right} of ${r.of} correct`}</b> · ${pts}` + (r.right === r.of ? '' : ' — the correct choice in each row is outlined in green.');
    } else if (r.ok) { fb.className = 'qz-fb ok'; fb.innerHTML = `<b>✓ Correct</b> · ${pts}`; }
    else {
      fb.className = 'qz-fb bad'; fb.innerHTML = `<b>✗ Not quite</b> · ${pts}` + correctText(part, answers[P.id]);
    }
    math(fb);
  }
  function said(t) { t = String(t); return ` — correct: <b>${t}</b>` + (/[.!?]$/.test(t) ? '' : '.'); }
  function correctText(part, ans) {
    if (part.kind === 'seq') {
      const sep = part.sep != null ? part.sep : '→';
      let t = ` — correct: <b>${sep === '→' ? part.answer.join(' → ') : '[' + part.answer.join(', ') + ']'}</b>.`;
      const a = ans || [];
      if (a.length) { let k = 0; while (k < a.length && a[k] === part.answer[k]) k++; t += k < a.length ? ` Your answer first differs at step ${k + 1}.` : ` Your answer stops after step ${a.length}.`; }
      return t;
    }
    if (part.kind === 'rows') return ' — the correct choice in each row is outlined in green.';
    if (part.kind === 'num') return said(part.show || part.answer);
    if (part.kind === 'multi') return said(part.answer.slice().sort().map(i => part.options[i]).join(', '));
    return said((part.letters === false ? '' : LETTERS[part.answer] + '. ') + part.options[part.answer]);
  }

  /* ----- sequences ----- */
  function setActive(T, id) {
    T.active = id;
    T.parts.forEach(p => { if (p.seqBox) p.seqBox.classList.toggle('active', p.id === id); });
    badges(T);
  }
  function badges(T) {
    if (!T.fig) return;
    const a = (T.active && answers[T.active]) || [];
    Object.keys(T.fig.byLabel).forEach(lab => {
      const g = T.fig.byLabel[lab], pos = a.lastIndexOf(lab);
      g.classList.toggle('in', pos >= 0);
      g.querySelector('.qz-ord text').textContent = pos >= 0 ? pos + 1 : '';
    });
    if (T.now) {   // live copy of the active answer inside the figure card: on phones the box itself is often off-screen
      const P = T.parts.find(p => p.id === T.active);
      T.now.querySelector('.qz-now-lbl').textContent = P ? (P.part.label || 'Answer') : '';
      T.now.querySelector('.qz-now-seq').textContent = a.length ? a.join(' → ') : 'tap a node…';
    }
  }
  function push(T, id, lab) { if (graded) return; setActive(T, id); answers[id] = (answers[id] || []).concat(lab); changed(); }
  function pop(P) { if (graded) return; const a = (answers[P.id] || []).slice(0, -1); answers[P.id] = a; changed(); }

  /* ----- progress bar, grading, results ----- */
  const bar = document.querySelector('.qz-bar'), prog = bar.querySelector('.qz-prog'), fill = bar.querySelector('.qz-track i');
  const checkBtn = bar.querySelector('[data-act="check"]'), resetBtn = bar.querySelector('[data-act="reset"]'), seeBtn = bar.querySelector('[data-act="results"]');
  const results = document.getElementById('qz-results');
  let confirmCheck = false, confirmReset = null;   // two-click confirmations (window.confirm is blocked in some embedded browsers)

  function changed() { confirmCheck = false; all.forEach(P => P.ui.refresh()); status(); save(); }
  function status() {
    const done = all.filter(P => isAnswered(P.part, answers[P.id])).length;
    fill.style.width = (100 * done / all.length) + '%';
    root.classList.toggle('graded', graded);
    checkBtn.hidden = graded; seeBtn.hidden = resetBtn.hidden = !graded;
    if (graded) { const s = totals(); prog.innerHTML = `Score <b>${fmt(s.got)} / ${fmt(s.max)}</b>`; fill.style.width = (100 * s.got / s.max) + '%'; }
    else {
      prog.innerHTML = `<b>${done} / ${all.length}</b> answered`;
      checkBtn.textContent = confirmCheck ? `${all.length - done} unanswered — check anyway?` : 'Check answers';
    }
  }
  function totals() {
    let got = 0, max = 0;
    all.forEach(P => { const r = grade(P.part, answers[P.id]); got += r.got; max += r.max; });
    return { got, max };
  }

  function showResults() {
    all.forEach(P => P.ui.mark());
    tasks.forEach(T => {
      const got = T.parts.reduce((s, P) => s + grade(P.part, answers[P.id]).got, 0);
      T.got = got;
      if (T.explain) T.explain.hidden = false;
      T.parts.forEach(P => { if (P.seqBox) P.seqBox.classList.remove('active'); });
      if (T.fig) Object.values(T.fig.byLabel).forEach(g => g.classList.remove('in'));
    });
    const s = totals(), pct = Math.round(100 * s.got / s.max);
    const skills = (Q.skills || []).map(sk => {
      const ts = tasks.filter(T => T.task.skill === sk.id);
      return { sk, ts, got: ts.reduce((a, T) => a + T.got, 0), max: ts.reduce((a, T) => a + T.total, 0) };
    }).filter(x => x.max > 0);
    const weakest = skills.slice().sort((a, b) => a.got / a.max - b.got / b.max)[0];
    results.hidden = false;
    results.querySelector('.qz-res-body').innerHTML = `
      <div class="qz-total"><b>${fmt(s.got)}</b><span>/ ${fmt(s.max)} points · ${pct}%</span></div>
      ${weakest && weakest.got < weakest.max ? `<p class="qz-verdict">Weakest area: <b>${weakest.sk.label}</b>${weakest.sk.href ? ` — <a href="${weakest.sk.href}">review it in the lab notes →</a>` : ''}</p>` : '<p class="qz-verdict">Full marks — well done.</p>'}
      <div class="qz-skills">${skills.map(x => `<div class="qz-skill"><div>${x.sk.label}<small>Task${x.ts.length > 1 ? 's' : ''} ${x.ts.map(T => `<a href="#task-${tasks.indexOf(T) + 1}">${tasks.indexOf(T) + 1}</a>`).join(', ')}</small></div>
        <div class="qz-track"><i style="width:${100 * x.got / x.max}%"></i></div><b>${fmt(x.got)} / ${fmt(x.max)}</b></div>`).join('')}</div>
      <p class="qz-res-sub">Per task</p>
      <div class="qz-tasklist">${tasks.map((T, i) => `<a class="${T.got === T.total ? 'ok' : T.got > 0 ? 'part' : 'bad'}" href="#task-${i + 1}"><span>${i + 1}</span>${fmt(T.got)} / ${fmt(T.total)}</a>`).join('')}</div>`;
    math(results);
  }

  function clearMarks() {
    root.querySelectorAll('.correct, .wrong, .missed').forEach(b => b.classList.remove('correct', 'wrong', 'missed'));
    root.querySelectorAll('.qz-fb').forEach(f => { f.hidden = true; });
    tasks.forEach(T => { if (T.explain) T.explain.hidden = true; if (T.seqIds.length) setActive(T, T.seqIds[0]); });
    results.hidden = true;
  }

  checkBtn.addEventListener('click', () => {
    const left = all.filter(P => !isAnswered(P.part, answers[P.id])).length;
    if (left && !confirmCheck) { confirmCheck = true; status(); return; }
    graded = true; save(); status(); showResults();
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  seeBtn.addEventListener('click', () => results.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  resetBtn.addEventListener('click', () => {
    if (!confirmReset) {
      resetBtn.textContent = 'Clear all answers?'; resetBtn.classList.add('warn');
      confirmReset = setTimeout(() => { confirmReset = null; resetBtn.textContent = 'Try again'; resetBtn.classList.remove('warn'); }, 4000);
      return;
    }
    clearTimeout(confirmReset); confirmReset = null; resetBtn.textContent = 'Try again'; resetBtn.classList.remove('warn');
    answers = {}; graded = false; confirmCheck = false; clearMarks(); changed();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // drop saved answers whose shape no longer fits the part (the quiz data was edited since they were saved)
  all.forEach(P => {
    const a = answers[P.id], k = P.part.kind;
    const fits = a == null || (k === 'mc' ? typeof a === 'number' : k === 'multi' || k === 'seq' ? Array.isArray(a) : k === 'rows' ? typeof a === 'object' && !Array.isArray(a) : typeof a === 'string');
    if (!fits) delete answers[P.id];
  });
  all.forEach(P => P.ui.init());
  math(document.body);
  status();
  if (graded) showResults();
}

document.addEventListener('DOMContentLoaded', () => { initHero(); initQuiz(); });
})();
