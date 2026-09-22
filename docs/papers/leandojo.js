/* ===== LeanDojo deep-dive interactivity ===== */

/* ---------- illustrative proof-search tree ---------- */
const PT_NODES = {
  root: { x: 330, y: 40, w: 220, h: 46, label: '⊢ gcd n n = n', kind: 'state' },
  simp1: { x: 120, y: 170, w: 170, h: 46, label: 'no goals ✓', kind: 'goal' },
  induct: { x: 330, y: 170, w: 220, h: 46, label: '⊢ gcd 0 0 = 0  (case zero)', kind: 'state' },
  dead: { x: 550, y: 170, w: 170, h: 46, label: 'no progress', kind: 'dead' },
  simp2: { x: 330, y: 290, w: 170, h: 46, label: 'no goals ✓', kind: 'goal' },
};
const PT_EDGES = [
  ['root', 'simp1', 'simp [gcd]', 0.79],
  ['root', 'induct', 'induction n', 0.82],
  ['root', 'dead', 'rw [gcd_comm]', 0.18],
  ['induct', 'simp2', 'simp [gcd]', 0.71],
];

function renderProofTree(svgEl) {
  const ns = 'http://www.w3.org/2000/svg';
  svgEl.innerHTML = '';

  const defs = document.createElementNS(ns, 'defs');
  defs.innerHTML = `<marker id="pt-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#c9c1da"></path></marker>`;
  svgEl.appendChild(defs);

  PT_EDGES.forEach(([from, to, label, score]) => {
    const a = PT_NODES[from], b = PT_NODES[to];
    const x1 = a.x, y1 = a.y + a.h / 2;
    const x2 = b.x, y2 = b.y - b.h / 2;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('class', 'edge');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1 + 2);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2 - 2);
    line.setAttribute('marker-end', 'url(#pt-arrow)');
    svgEl.appendChild(line);

    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const tacticLabel = document.createElementNS(ns, 'text');
    tacticLabel.setAttribute('x', mx + 8); tacticLabel.setAttribute('y', my - 4);
    tacticLabel.setAttribute('font-size', '11'); tacticLabel.setAttribute('font-weight', '700');
    tacticLabel.setAttribute('fill', 'var(--indigo)');
    tacticLabel.textContent = label;
    svgEl.appendChild(tacticLabel);

    const scoreLabel = document.createElementNS(ns, 'text');
    scoreLabel.setAttribute('x', mx + 8); scoreLabel.setAttribute('y', my + 10);
    scoreLabel.setAttribute('font-size', '10'); scoreLabel.setAttribute('font-weight', '700');
    scoreLabel.setAttribute('fill', 'var(--ucs)');
    scoreLabel.textContent = `score ${score}`;
    svgEl.appendChild(scoreLabel);
  });

  Object.entries(PT_NODES).forEach(([id, node]) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'node' + (node.kind === 'goal' ? ' goal' : '') + (node.kind === 'dead' ? ' fail' : ''));
    g.setAttribute('data-id', id);

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', node.x - node.w / 2);
    rect.setAttribute('y', node.y - node.h / 2);
    rect.setAttribute('width', node.w);
    rect.setAttribute('height', node.h);
    rect.setAttribute('rx', 10);
    rect.setAttribute('fill', '#fff');
    rect.setAttribute('stroke', node.kind === 'goal' ? '#12a894' : node.kind === 'dead' ? 'var(--coral)' : 'var(--indigo)');
    g.appendChild(rect);

    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', node.x); text.setAttribute('y', node.y + 5);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '13');
    text.textContent = node.label;
    g.appendChild(text);

    svgEl.appendChild(g);
  });
}

const PT_STEPS = [
  { frontier: [], current: null, visited: [], message: 'Start: initial proof state ⊢ gcd n n = n is the only thing in the frontier.' },
  {
    frontier: [{ id: 'induct', score: 0.82 }, { id: 'simp1', score: 0.79 }, { id: 'dead', score: 0.18 }],
    current: 'root', visited: ['root'],
    message: 'Expand root. Try rfl → fails (the goal isn\'t definitionally trivial, so it never joins the frontier). Generate simp [gcd] (0.79), induction n (0.82), rw [gcd_comm] (0.18).',
  },
  {
    frontier: [{ id: 'simp1', score: 0.79 }, { id: 'simp2', score: 0.71 }, { id: 'dead', score: 0.18 }],
    current: 'induct', visited: ['root', 'induct'],
    message: 'Highest score is induction n (0.82) — expand it. Generate simp [gcd] (0.71) for the zero case.',
  },
  {
    frontier: [{ id: 'simp2', score: 0.71 }, { id: 'dead', score: 0.18 }],
    current: 'simp1', visited: ['root', 'induct', 'simp1'],
    message: 'Highest score is now simp [gcd] directly on the root (0.79) — expand it. No goals remain. Proof complete!',
    win: true,
  },
];

function initProofTree() {
  const svg = document.getElementById('proof-tree');
  const frontierChips = document.getElementById('ld-frontier-chips');
  const log = document.getElementById('ld-log');
  const playBtn = document.getElementById('ld-play');
  let idx = 0;
  let timer = null;

  function render() {
    renderProofTree(svg);
    const step = PT_STEPS[idx];
    const visited = new Set(step.visited || []);

    svg.querySelectorAll('.node').forEach(g => {
      const id = g.getAttribute('data-id');
      g.classList.remove('visited', 'current', 'frontier', 'found');
      if (step.win && id === step.current) g.classList.add('found');
      else if (id === step.current) g.classList.add('current');
      else if (visited.has(id)) g.classList.add('visited');
      else if (step.frontier.some(e => e.id === id)) g.classList.add('frontier');
    });

    frontierChips.innerHTML = step.frontier.length
      ? step.frontier.map(e => `<span class="chip">${PT_NODES[e.id].label === 'no goals ✓' ? 'goal candidate' : PT_NODES[e.id].label}  (${e.score})</span>`).join('')
      : '<span style="color:var(--ink-soft); font-size:0.85rem;">empty</span>';

    log.innerHTML = PT_STEPS.slice(0, idx + 1).map((s, i) => {
      const cls = i === idx ? (s.win ? 'win' : 'current') : '';
      return `<p class="${cls}">${i}. ${s.message}</p>`;
    }).join('');
    log.scrollTop = log.scrollHeight;

    playBtn.textContent = idx >= PT_STEPS.length - 1 ? '↺' : (timer ? '⏸' : '▶');
    document.getElementById('ld-prev').disabled = idx === 0;
    document.getElementById('ld-next').disabled = idx >= PT_STEPS.length - 1;
  }

  function stop() { clearInterval(timer); timer = null; }

  document.getElementById('ld-next').addEventListener('click', () => { if (idx < PT_STEPS.length - 1) { idx++; render(); } });
  document.getElementById('ld-prev').addEventListener('click', () => { stop(); if (idx > 0) { idx--; render(); } });
  document.getElementById('ld-reset').addEventListener('click', () => { stop(); idx = 0; render(); });
  playBtn.addEventListener('click', () => {
    if (idx >= PT_STEPS.length - 1) { idx = 0; render(); return; }
    if (timer) { stop(); render(); return; }
    timer = setInterval(() => {
      if (idx >= PT_STEPS.length - 1) { stop(); render(); return; }
      idx++; render();
    }, 1400);
    render();
  });

  render();
}

/* ---------- results bar charts ---------- */
function initResultsBars() {
  const random = [
    { label: 'tidy', value: 23.8, color: 'var(--coral)' },
    { label: 'GPT-4', value: 29.0, color: 'var(--amber)' },
    { label: 'ReProver (no retrieval)', value: 47.6, color: 'var(--ids)' },
    { label: 'ReProver', value: 51.2, color: 'var(--bfs)' },
  ];
  const novel = [
    { label: 'tidy', value: 5.3, color: 'var(--coral)' },
    { label: 'GPT-4', value: 7.4, color: 'var(--amber)' },
    { label: 'ReProver (no retrieval)', value: 23.2, color: 'var(--ids)' },
    { label: 'ReProver', value: 26.3, color: 'var(--bfs)' },
  ];

  function draw(containerId, data) {
    const el = document.getElementById(containerId);
    const max = Math.max(...data.map(d => d.value));
    el.innerHTML = data.map(d => `
      <div class="bar-row">
        <div class="label" style="color:${d.color}">${d.label}</div>
        <div class="bar-track"><div class="bar-fill" style="background:${d.color}; width:${(d.value / max) * 100}%"></div></div>
        <div class="num">${d.value}%</div>
      </div>`).join('');
  }
  draw('bars-random', random);
  draw('bars-novel', novel);
}

document.addEventListener('DOMContentLoaded', () => {
  initProofTree();
  initResultsBars();
});
