/* ===== Lab 10 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab10-kmeans.html';
/* ---------- small static visuals (reuse the lab's .ml-plot .kp / .kc styles) ---------- */
const viz = (html, cls = '') => `<div class="qzv ${cls}">${html}</div>`;
const f1 = v => String(Math.round(v * 10) / 10);
// a 2-D plot: data ranges, grid steps (0 = none); draw(X, Y) returns the SVG body
const plot = ({ x: [x0, x1], y: [y0, y1], w = 420, h = 300, gx = 1, gy = 1, ticks = true, cls = '' }, draw) => {
  const L = ticks ? 44 : 14, R = 18, T = 18, B = ticks ? 36 : 14;
  const X = v => +(L + (v - x0) / (x1 - x0) * (w - L - R)).toFixed(1), Y = v => +(h - B - (v - y0) / (y1 - y0) * (h - T - B)).toFixed(1);
  let g = `<rect class="km-frame" x="${L}" y="${T}" width="${w - L - R}" height="${h - T - B}"/>`;
  if (gx) for (let v = Math.ceil(x0 / gx) * gx; v <= x1 + 1e-9; v += gx) g += `<line class="gl" x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${h - B}"/>` + (ticks ? `<text class="tk" x="${X(v)}" y="${h - B + 22}" text-anchor="middle">${f1(v) || 0}</text>` : '');
  if (gy) for (let v = Math.ceil(y0 / gy) * gy; v <= y1 + 1e-9; v += gy) g += `<line class="gl" x1="${L}" y1="${Y(v)}" x2="${w - R}" y2="${Y(v)}"/>` + (ticks ? `<text class="tk" x="${L - 8}" y="${Y(v)}" text-anchor="end" dominant-baseline="central">${f1(v) || 0}</text>` : '');
  return `<svg class="ml-plot qzv-plot ${cls}" viewBox="0 0 ${w} ${h}" role="img">${g}${draw(X, Y)}</svg>`;
};
// labels: ₁ / ₂ become real subscripts (the Unicode glyphs are tiny in Poppins)
const sub = t => String(t).replace(/([₁₂])(.*)$/, (m, c, rest) => `<tspan dy="5" font-size="12">${'₁₂'.indexOf(c) + 1}</tspan>` + (rest ? `<tspan dy="-5">${rest}</tspan>` : ''));
const lbl = (x, y, t, a = 'start') => `<text class="pl" x="${x}" y="${y}" text-anchor="${a}" dominant-baseline="central">${sub(t)}</text>`;
// data point (k = cluster colour, null = unlabelled grey) and centroid (circle with a cross)
const pt = (X, Y, x, y, k, t, dx = 12, dy = -12, r = 7) => `<circle class="kp ${k == null ? 'kgrey' : 'k' + k}" cx="${X(x)}" cy="${Y(y)}" r="${r}"/>` + (t ? lbl(X(x) + dx, Y(y) + dy, t, dx < 0 ? 'end' : dx === 0 ? 'middle' : 'start') : '');
const ctr = (X, Y, x, y, k, t, dx = 14, dy = -14) => `<g class="kc k${k}" transform="translate(${X(x)} ${Y(y)})"><circle r="11"/><path class="kx" d="M-6,-6 L6,6 M-6,6 L6,-6"/></g>` + (t ? lbl(X(x) + dx, Y(y) + dy, t, dx < 0 ? 'end' : 'start') : '');
// a number line with points [value, label?] and centroids [value, k, label]
const numline = (x0, x1, pts, cs = [], step = 1) => {
  const w = 440, h = cs.length ? 130 : 96, L = 22, R = 22, Y = cs.length ? 88 : 54, X = v => +(L + (v - x0) / (x1 - x0) * (w - L - R)).toFixed(1);
  let g = `<line class="ax" x1="${L - 10}" y1="${Y}" x2="${w - R + 10}" y2="${Y}"/>`;
  for (let v = x0; v <= x1; v += step) g += `<line class="ax" x1="${X(v)}" y1="${Y - 5}" x2="${X(v)}" y2="${Y + 5}"/><text class="tk" x="${X(v)}" y="${Y + 26}" text-anchor="middle">${v}</text>`;
  cs.forEach(([v, k, t]) => { g += `<line class="dl" x1="${X(v)}" y1="${Y - 30}" x2="${X(v)}" y2="${Y - 10}"/><g class="kc k${k}" transform="translate(${X(v)} ${Y - 44})"><circle r="11"/><path class="kx" d="M-6,-6 L6,6 M-6,6 L6,-6"/></g>` + lbl(X(v) + 16, Y - 44, t); });
  pts.forEach(([v, t]) => { g += `<circle class="kp kgrey" cx="${X(v)}" cy="${Y}" r="7"/>` + (t && !cs.length ? lbl(X(v), Y - 24, t, 'middle') : ''); });
  return `<svg class="ml-plot qzv-plot" viewBox="0 0 ${w} ${h}" role="img">${g}</svg>`;
};
// horizontal bars: rows of [label, value, max, shown, cls]
const bars = rows => '<div class="qzv-bars">' + rows.map(([l, v, max, shown, cls]) => `<div class="qzv-bar ${cls || ''}"><span>${l}</span><span class="track"><i style="width:${100 * v / max}%"></i></span><b>${shown}</b></div>`).join('') + '</div>';
// small unlabelled scatter thumbnails, from seeded random data in [0, 1]²
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
const R0 = rng(1010), gauss = () => Math.sqrt(-2 * Math.log(R0() + 1e-12)) * Math.cos(2 * Math.PI * R0());
const blob = (cx, cy, s, n) => Array.from({ length: n }, () => [cx + s * gauss(), cy + s * gauss()]);
const arc = (n, f) => Array.from({ length: n }, (_, i) => f(i / (n - 1)));
const thumb = (title, P) => `<div class="qzv-node"><b>${title}</b><svg class="ml-plot qzv-mini" viewBox="0 0 200 150" role="img"><rect class="km-frame" x="1" y="1" width="198" height="148" rx="8"/>`
  + P.map(([x, y]) => `<circle class="kp kgrey" cx="${(12 + x * 176).toFixed(1)}" cy="${(140 - y * 130).toFixed(1)}" r="3.4"/>`).join('') + '</svg></div>';
const DATA = {
  blobs3: [...blob(0.2, 0.28, 0.06, 22), ...blob(0.78, 0.3, 0.06, 22), ...blob(0.5, 0.78, 0.06, 22)],
  moons: [...arc(34, t => [Math.cos(Math.PI * t), Math.sin(Math.PI * t)]), ...arc(34, t => [1 - Math.cos(Math.PI * t), 0.5 - Math.sin(Math.PI * t)])].map(([x, y]) => [0.05 + (x + 1) / 3 * 0.9 + 0.015 * gauss(), 0.1 + (y + 0.5) / 1.5 * 0.8 + 0.015 * gauss()]),
  blobs4: [...blob(0.2, 0.25, 0.05, 16), ...blob(0.8, 0.25, 0.05, 16), ...blob(0.2, 0.76, 0.05, 16), ...blob(0.8, 0.76, 0.05, 16)],
  spirals: [0, Math.PI].flatMap(ph => arc(40, t => { const a = 0.6 + t * 3.2 * Math.PI, r = 0.05 + t * 0.42; return [0.5 + r * Math.cos(a + ph) * 0.95 + 0.012 * gauss(), 0.5 + r * Math.sin(a + ph) + 0.012 * gauss()]; })),
  rings: [...arc(20, t => [0.5 + 0.13 * Math.cos(2 * Math.PI * t), 0.5 + 0.17 * Math.sin(2 * Math.PI * t)]), ...arc(46, t => [0.5 + 0.44 * Math.cos(2 * Math.PI * t), 0.5 + 0.46 * Math.sin(2 * Math.PI * t)])].map(([x, y]) => [x + 0.012 * gauss(), y + 0.012 * gauss()]),
  unequal: [...blob(0.36, 0.5, 0.13, 70), ...blob(0.82, 0.52, 0.03, 10)],
};
const thumbs = (...items) => viz('<div class="qzv-nodes">' + items.map(([t, d]) => thumb(t, DATA[d])).join('') + '</div>');
// a pre-drawn dendrogram: leaves a–f, merges at heights 1, 1.5, 2.5, 6, 7, and a cut line at height 4
const DENDRO = (() => {
  const w = 420, h = 280, L = 48, B = 40, T = 16, X = i => L + 30 + i * 62, Y = v => h - B - v / 8 * (h - B - T);
  let g = '';
  for (let v = 0; v <= 8; v += 2) g += `<line class="gl" x1="${L}" y1="${Y(v)}" x2="${w - 10}" y2="${Y(v)}"/><text class="tk" x="${L - 8}" y="${Y(v)}" text-anchor="end" dominant-baseline="central">${v}</text>`;
  const link = (xa, ha, xb, hb, hm) => `<path class="den" d="M${xa} ${Y(ha)} V${Y(hm)} H${xb} V${Y(hb)}"/>`;
  // a,b @1 → x 0.5 ; d,e @1.5 → x 3.5 ; c+(de) @2.5 → x (2+3.5)/2 ; (ab)+(cde) @6 ; +f @7
  const ab = (X(0) + X(1)) / 2, de = (X(3) + X(4)) / 2, cde = (X(2) + de) / 2, abcde = (ab + cde) / 2;
  g += link(X(0), 0, X(1), 0, 1) + link(X(3), 0, X(4), 0, 1.5) + link(X(2), 0, de, 1.5, 2.5) + link(ab, 1, cde, 2.5, 6) + link(abcde, 6, X(5), 0, 7) + `<path class="den" d="M${(abcde + X(5)) / 2} ${Y(7)} V${Y(7.6)}"/>`;
  'abcdef'.split('').forEach((c, i) => { g += `<text class="pl" x="${X(i)}" y="${h - B + 20}" text-anchor="middle" dominant-baseline="central">${c}</text>`; });
  g += `<line class="cut" x1="${L}" y1="${Y(4)}" x2="${w - 10}" y2="${Y(4)}"/><text class="tk cutl" x="${ab + 7}" y="${Y(4) - 10}">cut at height 4</text>`;
  return viz(`<svg class="ml-plot qzv-plot" viewBox="0 0 ${w} ${h}" role="img">${g}</svg>`);
})();
// six points in three panels of an agglomerative run: each group drawn as a rounded hull
const AGG = (() => {
  const P = [[34, 40], [62, 52], [46, 104], [140, 36], [166, 62], [150, 112]];
  const hull = G => { const xs = G.map(i => P[i][0]), ys = G.map(i => P[i][1]), p = 13;
    return `<rect class="hull" x="${Math.min(...xs) - p}" y="${Math.min(...ys) - p}" width="${Math.max(...xs) - Math.min(...xs) + 2 * p}" height="${Math.max(...ys) - Math.min(...ys) + 2 * p}" rx="${p}"/>`; };
  const panel = (t, groups) => `<div class="qzv-node"><b>${t}</b><svg class="ml-plot qzv-mini" viewBox="0 0 200 150" role="img">${groups.map(hull).join('')}${P.map(([x, y]) => `<circle class="kp kgrey" cx="${x}" cy="${y}" r="5"/>`).join('')}</svg><span>${groups.length} clusters</span></div>`;
  return viz('<div class="qzv-nodes">' + panel('Start', [[0], [1], [2], [3], [4], [5]]) + panel('After 2 merges', [[0, 1], [2], [3, 4], [5]]) + panel('After 4 merges', [[0, 1, 2], [3, 4, 5]]) + '</div>');
})();

window.QUIZ = {
  id: 'lab10',
  skills: [
    { id: 'steps', label: 'Clustering and the K-means steps', href: LAB + '#kmeans' },
    { id: 'cost', label: 'Cost J, convergence and initialisation', href: LAB + '#fit' },
    { id: 'k', label: 'Choosing K: elbow and silhouette', href: LAB + '#howmany' },
    { id: 'limits', label: 'Shapes, outliers and variants', href: LAB + '#variants' },
    { id: 'hier', label: 'Hierarchical clustering and evaluation', href: LAB + '#hierarchical' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: '10,000 customer records', type: 'Problem type', level: 'Easy', skill: 'steps',
      intro: '<p>You have 10,000 customer records with 20 numerical features and <b>no customer-group labels</b>. You want to discover natural groups.</p>'
        + '<pre class="qz-code qz-diagram">id      f1    f2   …   f20   group\n0001   3.2  0.71   …    14     ?\n0002   1.9  0.35   …    22     ?\n0003   4.4  0.12   …     9     ?\n…\n10000  2.7  0.58   …    17     ?</pre>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What kind of learning problem is this?', options: ['Supervised classification', 'Supervised regression', 'Unsupervised clustering', 'Reinforcement learning'], answer: 2, inline: false },
      ],
      explain: '<p><b>Unsupervised clustering</b>: the data has no target labels, and the goal is to discover structure in it.</p>',
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'Assign the point (2, 1)', type: 'Assignment step', level: 'Easy', skill: 'steps',
      intro: M`<p>The current centroids are \(C_1 = (0, 0)\) and \(C_2 = (8, 0)\). A data point is \(x = (2, 1)\).</p>`
        + viz(plot({ x: [-1, 9], y: [-1, 2], h: 190 }, (X, Y) => `<line class="dl" x1="${X(2)}" y1="${Y(1)}" x2="${X(0)}" y2="${Y(0)}"/><line class="dl" x1="${X(2)}" y1="${Y(1)}" x2="${X(8)}" y2="${Y(0)}"/>`
          + ctr(X, Y, 0, 0, 0, 'C₁', 14, 16) + ctr(X, Y, 8, 0, 1, 'C₂', -14, 16) + pt(X, Y, 2, 1, null, 'x', 12, -12))),
      parts: [
        { kind: 'num', pts: 2, q: M`What is the <b>squared</b> Euclidean distance \(\lVert x - C_2 \rVert^2\)?`, answer: 37 },
        { kind: 'mc', pts: 2, q: 'What does K-means do with this point during the assignment step?', options: ['Assign it to C₁', 'Assign it to C₂', 'Create a new cluster', 'Remove the point'], answer: 0 },
      ],
      explain: M`<p>\(\lVert x - C_1 \rVert^2 = 2^2 + 1^2 = 5\) and \(\lVert x - C_2 \rVert^2 = (2 - 8)^2 + 1^2 = 37\). The point goes to the <b>nearest</b> centroid, \(C_1\).</p>`,
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Three points in one cluster', type: 'Update step', level: 'Easy', skill: 'steps',
      intro: '<p>After an assignment step, one cluster contains the points <b>(1, 1)</b>, <b>(3, 1)</b> and <b>(5, 4)</b>.</p>'
        + viz(plot({ x: [0, 6], y: [0, 5], h: 280 }, (X, Y) => pt(X, Y, 1, 1, 0, '(1, 1)', 0, 22) + pt(X, Y, 3, 1, 0, '(3, 1)', 0, 22) + pt(X, Y, 5, 4, 0, '(5, 4)', -12, -14))),
      parts: [
        { kind: 'num', pts: 2, q: 'After the update step, what is the <b>x</b>-coordinate of the new centroid?', prefix: 'x =', answer: 3 },
        { kind: 'num', pts: 2, q: 'And its <b>y</b>-coordinate?', prefix: 'y =', answer: 2 },
        { kind: 'num', pts: 2, q: M`What does this cluster contribute to \(J\) with the new centroid (the sum of squared distances of its three points)?`, answer: 14 },
      ],
      explain: M`<p>The new centroid is the mean: \(x = \tfrac{1 + 3 + 5}{3} = 3\), \(y = \tfrac{1 + 1 + 4}{3} = 2\), so \((3, 2)\).</p><p>Squared distances to \((3, 2)\): \((-2)^2 + (-1)^2 = 5\), \(0^2 + (-1)^2 = 1\), \(2^2 + 2^2 = 8\). Total \(5 + 1 + 8 = 14\).</p>`,
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'Three candidate centres', type: 'Update step', level: 'Easy', skill: 'steps',
      intro: '<p>A cluster has the points (0, 0), (2, 0) and (4, 0). Candidate centres: <b>A</b> = (0, 0), <b>B</b> = (2, 0), <b>C</b> = (4, 0).</p>'
        + viz(numline(0, 4, [[0, 'A'], [2, 'B'], [4, 'C']])),
      parts: [
        { kind: 'mc', pts: 2, q: 'Which candidate minimises the sum of squared distances to the three points?', options: ['A', 'B', 'C', 'All tie'], answer: 1, letters: false },
        { kind: 'num', pts: 2, q: 'What is that minimal sum of squared distances?', answer: 8 },
      ],
      explain: M`<p><b>B</b>, the arithmetic mean \((2, 0)\): \(2^2 + 0^2 + 2^2 = 8\). A and C both give \(0 + 4 + 16 = 20\). For squared Euclidean distance, the mean minimises the within-cluster squared error.</p>`,
    },
    /* ---------- 5 (added: a full run) ---------- */
    {
      id: 'r1', title: 'Two centres on a line', type: 'Trace', level: 'Medium', skill: 'steps',
      intro: M`<p>Six points on a line: <b>0, 3, 6, 12, 13, 14</b>. K-means with \(K = 2\) starts from the centres \(m_1 = 3\) and \(m_2 = 6\) (two of the data points). No ties occur.</p>`
        + viz(numline(0, 14, [[0], [3], [6], [12], [13], [14]], [[3, 0, 'm₁'], [6, 1, 'm₂']])),
      parts: [
        { kind: 'num', pts: 2, q: M`After the first assignment step and the first update step, where is \(m_2\)?`, prefix: M`\(m_2 =\)`, answer: 11.25, tol: 0.01 },
        { kind: 'mc', pts: 2, q: 'In the second assignment step, which point changes its cluster?', options: ['0', '3', '6', '12', '13', 'None'], answer: 2, letters: false },
        { kind: 'num', pts: 2, q: M`K-means then converges. Where does \(m_2\) end up?`, prefix: M`\(m_2 =\)`, answer: 13, tol: 0.01 },
        { kind: 'num', pts: 2, q: M`What is the final cost \(J\)?`, prefix: M`\(J =\)`, answer: 20, tol: 0.01 },
      ],
      explain: M`<p><b>Assign 1</b>: 0 and 3 are closer to \(m_1 = 3\); 6, 12, 13, 14 go to \(m_2 = 6\). <b>Update 1</b>: \(m_1 = \tfrac{0 + 3}{2} = 1.5\), \(m_2 = \tfrac{6 + 12 + 13 + 14}{4} = 11.25\).</p><p><b>Assign 2</b>: point 6 is 4.5 from \(m_1\) and 5.25 from \(m_2\), so it moves to cluster 1. <b>Update 2</b>: \(m_1 = \tfrac{0 + 3 + 6}{3} = 3\), \(m_2 = \tfrac{12 + 13 + 14}{3} = 13\). <b>Assign 3</b>: nothing changes (6 is 3 from \(m_1\), 7 from \(m_2\)), so K-means has converged.</p><p>\(J = (0 - 3)^2 + 0 + (6 - 3)^2 + 1 + 0 + 1 = 20\).</p>`,
    },
    /* ---------- 6 ---------- */
    {
      id: 't5', title: 'The objective J', type: 'Objective', level: 'Easy', skill: 'cost',
      intro: M`<p>K-means uses the objective</p><div class="math-block">\[ J = \sum_{k} \sum_{i:\, y_i = k} \lVert x_i - m_k \rVert^2 \]</div>`
        + viz(plot({ x: [0, 10], y: [0, 6], h: 240, ticks: false, gx: 0, gy: 0 }, (X, Y) => {
          const A = [[1.4, 1.6], [2.6, 1.1], [2.2, 2.7], [3.3, 2.2], [1.6, 3.0]], B = [[7.0, 4.0], [8.2, 4.6], [7.6, 3.2], [8.7, 3.6], [7.3, 5.0]];
          const mA = [2.22, 2.12], mB = [7.76, 4.08], dl = (P, m) => P.map(([x, y]) => `<line class="dl" x1="${X(x)}" y1="${Y(y)}" x2="${X(m[0])}" y2="${Y(m[1])}"/>`).join('');
          return dl(A, mA) + dl(B, mB) + A.map(([x, y]) => pt(X, Y, x, y, 0)).join('') + B.map(([x, y]) => pt(X, Y, x, y, 1)).join('') + ctr(X, Y, ...mA, 0, 'm₁', 16, 20) + ctr(X, Y, ...mB, 1, 'm₂', -16, -20);
        })),
      parts: [
        { kind: 'mc', pts: 3, q: M`What does \(J\) measure?`, options: ['Squared distances between all pairs of centroids', 'The number of iterations until convergence', 'The number of points in the largest cluster', 'Squared distances of points to their centroid'], answer: 3, inline: false },
      ],
      explain: M`<p>\(J\) sums the squared distances of the points to the centroid of their own cluster (the dashed lines above, squared): the within-cluster sum of squares. Lower \(J\) means the points are, overall, closer to their assigned centroids.</p>`,
    },
    /* ---------- 7 ---------- */
    {
      id: 't6', title: 'One iteration and the cost', type: 'Objective', level: 'Medium', skill: 'cost',
      intro: '<p>One normal K-means iteration:</p><pre class="qz-code qz-diagram">1. assignment step\n   centres fixed, points move\n2. update step\n   points fixed, centres move</pre>',
      parts: [
        { kind: 'mc', pts: 3, q: M`What can happen to \(J\) during this iteration?`, options: ['It rises in the assignment step, then falls', 'It can go up or down, depending on the data', 'It can only stay the same or decrease', 'It must strictly decrease in every iteration'], answer: 2, inline: false },
      ],
      explain: M`<p><b>It can only stay the same or decrease.</b> The assignment step moves each point to its <b>nearest</b> centre, which cannot lengthen its distance; the update step replaces each centre by the <b>mean</b>, which minimises the squared distances of its points. Neither step increases \(J\). (It does not have to decrease strictly: at convergence it stays the same.)</p>`,
    },
    /* ---------- 8 ---------- */
    {
      id: 't7', title: 'Same labels twice', type: 'Convergence', level: 'Easy', skill: 'cost',
      intro: '<p>A full assignment step produces exactly the same cluster labels as the previous iteration:</p><pre class="qz-code qz-diagram">iteration 6:  1 1 2 3 3 2 1 3 2 2\niteration 7:  1 1 2 3 3 2 1 3 2 2</pre>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What follows?', options: ['K must be increased by one', 'The algorithm converged', 'All points are outliers', 'The run must be restarted'], answer: 1, inline: false },
      ],
      explain: '<p><b>The algorithm has converged.</b> If no assignment changes, the means do not move either, so nothing will ever change again: the process has reached a stable solution.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't8', title: 'A student’s claim', type: 'Convergence', level: 'Medium', skill: 'cost',
      intro: '<blockquote class="qz-quote">“K-means always converges, so it always finds the globally best clustering.”</blockquote>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Is this reasoning correct?', options: ['No: it converges, but maybe to a local minimum.', 'No: K-means is not guaranteed to converge.', 'Yes: at convergence J has reached its minimum.', 'Yes, as long as it runs until labels stop changing.'], answer: 0, inline: false },
      ],
      explain: M`<p><b>No.</b> K-means always converges, but possibly to a <b>local minimum</b> of \(J\): different initial centroids can produce different final clusterings (compare the random runs in the lab's local-optima widget).</p>`,
    },
    /* ---------- 10 ---------- */
    {
      id: 't9', title: 'Two runs, same K', type: 'Random restarts', level: 'Easy', skill: 'cost',
      intro: M`<p>Two runs of K-means on the same data with the same \(K\) finish with:</p>` + viz(bars([['Run A', 215, 240, 'J = 215'], ['Run B', 168, 240, 'J = 168']]), 'qzv-wide'),
      parts: [
        { kind: 'mc', pts: 3, q: 'Which run should be kept?', options: ['Run A', 'Run B', 'Keep both equally', 'Choose randomly'], answer: 1, letters: false },
      ],
      explain: M`<p><b>Run B.</b> For the same data and the same \(K\), the lower \(J\) is preferred. This is exactly what random restarts do: run several times and keep the best solution.</p>`,
    },
    /* ---------- 11 ---------- */
    {
      id: 't10', title: 'A better starting point', type: 'Initialisation', level: 'Medium', skill: 'cost',
      intro: M`<p>Plain K-means sometimes starts with several centroids very close to each other. K-means++ changes how the initial centroids are chosen.</p>`,
      parts: [
        { kind: 'mc', pts: 2, q: 'What is the purpose of K-means++?', options: ['Remove the need to choose K in advance', 'Make every assignment soft', 'Replace each mean by a mode', 'Spread out the initial centroids'], answer: 3, inline: false },
        { kind: 'num', pts: 3, id: 'p', q: M`The data are four points \(O = (0, 0)\), \(A = (1, 0)\), \(B = (3, 0)\), \(C = (0, 4)\), and the first centroid is \(C_1 = O\). With what probability does K-means++ pick <b>C</b> as the second centroid (two decimals)?`,
          html: viz(plot({ x: [-1, 4], y: [-1, 5], w: 320, h: 300 }, (X, Y) => ctr(X, Y, 0, 0, 0, 'C₁ = O', 14, 18) + pt(X, Y, 1, 0, null, 'A', 0, -18) + pt(X, Y, 3, 0, null, 'B', 0, -18) + pt(X, Y, 0, 4, null, 'C', 14, 0)), 'qzv-narrow'),
          placeholder: 'e.g. 0.25', answer: 16 / 26, tol: 0.006, pct: true, show: '16/26 ≈ 0.62' },
      ],
      explain: M`<p>K-means++ gives far-away points a higher probability of becoming the next centroid; the rest of K-means stays the same.</p><p>Squared distances to the nearest chosen centroid: \(d_O = 0\), \(d_A = 1\), \(d_B = 9\), \(d_C = 16\), total 26. So \(P(C) = \tfrac{16}{26} \approx 0.62\) (and \(P(B) \approx 0.35\), \(P(A) \approx 0.04\)).</p>`,
    },
    /* ---------- 12 ---------- */
    {
      id: 't11', title: 'K = 20 gives J = 30', type: 'Choosing K', level: 'Medium', skill: 'k',
      intro: M`<p>Final costs for several values of \(K\):</p>` + viz(bars([['K = 2', 900, 900, '900'], ['K = 3', 430, 900, '430'], ['K = 4', 250, 900, '250'], ['K = 5', 180, 900, '180'], ['K = 20', 30, 900, '30']]), 'qzv-wide'),
      parts: [
        { kind: 'mc', pts: 3, q: M`Why is “choose the largest \(K\), because its \(J\) is smallest” a bad rule?`, options: ['Past the elbow, J starts to grow again with K', 'J always drops as K grows, down to 0 at K = N', 'A large K makes K-means stop at a worse optimum', 'J is only comparable for K below about 10'], answer: 1, inline: false },
      ],
      explain: M`<p>\(J\) <b>always decreases</b> as \(K\) increases. In the extreme, \(K = N\) gives one point per cluster and \(J = 0\), which is not a meaningful clustering. \(J\) cannot compare different values of \(K\) on its own; use the elbow or the silhouette.</p>`,
    },
    /* ---------- 13 ---------- */
    {
      id: 't12', title: 'A cost curve for K = 1 … 5', type: 'Elbow', level: 'Medium', skill: 'k',
      intro: viz(plot({ x: [1, 5], y: [0, 1100], h: 290, gx: 1, gy: 250 }, (X, Y) => {
        const J = [1000, 520, 260, 220, 205];
        return `<polyline class="ek-cost" points="${J.map((v, i) => X(i + 1) + ',' + Y(v)).join(' ')}"/>` + J.map((v, i) => `<circle class="ek-cost-dot" cx="${X(i + 1)}" cy="${Y(v)}" r="6"/>` + lbl(X(i + 1) + (i ? 0 : 10), Y(v) - 18, v, i ? 'middle' : 'start')).join('');
      }) + '<p class="qzv-legend">cost J (vertical) against K (horizontal)</p>'),
      parts: [
        { kind: 'mc', pts: 5, q: M`Which \(K\) is the most plausible choice by the elbow method?`, options: ['K = 1', 'K = 2', 'K = 3', 'K = 5'], answer: 2, letters: false },
      ],
      explain: M`<p><b>K = 3.</b> The cost drops sharply up to \(K = 3\) (1000 → 520 → 260); after that each extra centre gains little (260 → 220 → 205). \(K = 5\) has the lowest cost, but only because \(J\) always drops as \(K\) grows.</p>`,
    },
    /* ---------- 14 ---------- */
    {
      id: 't13', title: 'a(i) = 1.2, b(i) = 5.0', type: 'Silhouette', level: 'Medium', skill: 'k',
      intro: M`<p>For one point, \(a(i)\) = mean distance to the other points of its own cluster, \(b(i)\) = mean distance to the points of the nearest other cluster.</p>` + viz(bars([['a(i) own', 1.2, 6, '1.2'], ['b(i) other', 5.0, 6, '5.0', 'val']]), 'qzv-wide'),
      parts: [
        { kind: 'num', pts: 3, q: M`Compute the silhouette \(s(i) = \dfrac{b(i) - a(i)}{\max\{a(i), b(i)\}}\).`, prefix: M`\(s(i) =\)`, answer: 0.76, tol: 0.005 },
        { kind: 'mc', pts: 2, q: 'What does this suggest about the point?', options: ['It is well placed', 'It lies on a border', 'It is likely misplaced', 'It forms a new cluster'], answer: 0 },
      ],
      explain: M`<p>\(s = \tfrac{5.0 - 1.2}{5.0} = 0.76\), close to 1. The point is <b>well placed</b>: \(a(i)\) is small and \(b(i)\) is much larger, so it is close to its own cluster and far from the alternatives.</p>`,
    },
    /* ---------- 15 ---------- */
    {
      id: 't14', title: 'a(i) = 4.0, b(i) = 3.0', type: 'Silhouette', level: 'Medium', skill: 'k',
      intro: '<p>Another point, with the same definitions of a(i) and b(i):</p>' + viz(bars([['a(i) own', 4.0, 6, '4.0'], ['b(i) other', 3.0, 6, '3.0', 'val']]), 'qzv-wide'),
      parts: [
        { kind: 'num', pts: 3, q: 'Compute its silhouette.', prefix: M`\(s(i) =\)`, answer: -0.25, tol: 0.005 },
        { kind: 'mc', pts: 2, q: 'What is the best interpretation?', options: ['It defines the centroid of its cluster', 'It sits at the centre of its cluster', 'It is likely in the wrong cluster', 'It shows that the clustering is good'], answer: 2, inline: false },
      ],
      explain: M`<p>\(s = \tfrac{3.0 - 4.0}{\max\{4.0, 3.0\}} = -0.25\). A <b>negative</b> silhouette means the point is, on average, closer to another cluster than to its own: it <b>may be misassigned</b>. (\(s \approx 1\): well clustered, \(s \approx 0\): on a border, \(s < 0\): possibly misassigned.)</p>`,
    },
    /* ---------- 16 ---------- */
    {
      id: 't15', title: 'Round groups or crescents?', type: 'Shape assumptions', level: 'Easy', skill: 'limits',
      intro: thumbs(['Dataset A', 'blobs3'], ['Dataset B', 'moons']) + '<p><b>Dataset A</b>: three compact, round groups of similar size. <b>Dataset B</b>: two long, curved, crescent-shaped groups.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'For which dataset is ordinary K-means more naturally suited?', options: ['Dataset A', 'Dataset B', 'Both equally', 'Neither one'], answer: 0, letters: false },
      ],
      explain: '<p><b>Dataset A.</b> K-means works best with roughly round, similarly sized clusters. It cuts the plane into convex regions around the centres, so curved or elongated clusters like the crescents get split incorrectly.</p>',
    },
    /* ---------- 17 ---------- */
    {
      id: 't16', title: 'One point at (100, 100)', type: 'Outliers', level: 'Medium', skill: 'limits',
      intro: '<p>A cluster contains 9 points around (0, 0), whose mean is exactly (0, 0), and one extreme point at (100, 100).</p>'
        + viz(plot({ x: [-10, 110], y: [-10, 110], w: 360, h: 330, gx: 20, gy: 20 }, (X, Y) => [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3], [2, 2], [-2, -2], [2, -2], [-2, 2]].map(([x, y]) => pt(X, Y, x, y, 0, '', 0, 0, 4.5)).join('') + pt(X, Y, 100, 100, 1, '(100, 100)', -14, 14)), 'qzv-narrow'),
      parts: [
        { kind: 'num', pts: 3, q: 'Where is the mean of the cluster? Give its <b>x</b>-coordinate (the y-coordinate is the same).', prefix: 'x =', answer: 10, tol: 0.01 },
        { kind: 'mc', pts: 2, q: 'Which of these centres stays at (0, 0)?', options: ['The mean', 'The coordinate-wise median', 'Both of them', 'Neither of them'], answer: 1, letters: false },
      ],
      explain: M`<p>The mean is \(\tfrac{9 \cdot (0, 0) + (100, 100)}{10} = (10, 10)\): <b>pulled toward the outlier</b>. The coordinate-wise median of the x-values \(-3, -2, -2, 0, 0, 0, 2, 2, 3, 100\) is 0 (and the same for y), so the median stays at (0, 0). This is why K-medians and K-medoids are more <b>robust to outliers</b>.</p>`,
    },
    /* ---------- 18 ---------- */
    {
      id: 't17', title: 'Pick the variant', type: 'Variants', level: 'Medium', skill: 'limits',
      parts: [
        { kind: 'rows', pts: 5, q: 'Which variant fits each situation best?', options: ['K-means', 'K-medians', 'K-medoids', 'K-modes', 'Soft K-means'],
          rows: [
            { label: 'Each point should belong partly to several clusters.', answer: 4 },
            { label: 'The distance is Manhattan (L1).', answer: 1 },
            { label: 'The features are categorical.', answer: 3 },
            { label: 'Squared Euclidean distance, one cluster per point.', answer: 0 },
            { label: 'The centre must be an actual data point.', answer: 2 },
          ] },
      ],
      explain: '<p><b>K-medians</b> for Manhattan / L1 (the coordinate-wise median minimises absolute deviations). <b>K-medoids</b> when the centre must be a data point (it works for any distance). <b>K-modes</b> for categorical features (the mode of each feature). <b>Soft K-means</b> gives each point a responsibility for every cluster. Plain <b>K-means</b> is the one for squared Euclidean distance with hard assignments.</p>',
    },
    /* ---------- 19 ---------- */
    {
      id: 't18', title: 'A point between two clusters', type: 'Hard vs. soft', level: 'Easy', skill: 'limits',
      intro: '<p>Ordinary K-means finishes with a point <b>x</b> near the boundary of two clusters.</p>'
        + viz(plot({ x: [0, 10], y: [0, 6], h: 240, ticks: false, gx: 0, gy: 0 }, (X, Y) => {
          const A = [[1.5, 2.2], [2.5, 3.4], [2.0, 4.1], [3.1, 2.6], [1.2, 3.3], [2.9, 1.7]], B = [[7.2, 2.4], [8.3, 3.1], [7.6, 4.2], [8.8, 2.0], [6.9, 3.4], [8.1, 4.8]];
          return A.map(([x, y]) => pt(X, Y, x, y, 0)).join('') + B.map(([x, y]) => pt(X, Y, x, y, 1)).join('') + ctr(X, Y, 2.2, 2.9, 0) + ctr(X, Y, 7.8, 3.3, 1) + pt(X, Y, 5, 3.1, null, 'x', 0, -20);
        })),
      parts: [
        { kind: 'mc', pts: 3, q: 'How is that point represented in the final result?', options: ['It gets no cluster label', 'It belongs equally to both', 'It creates another centroid', 'It belongs to one cluster'], answer: 3, inline: false },
      ],
      explain: '<p><b>It belongs to exactly one cluster</b>: ordinary K-means makes <b>hard</b> assignments. Soft methods (soft K-means, Gaussian mixtures with EM) would instead give it a responsibility, a probability, for each cluster.</p>',
    },
    /* ---------- 20 ---------- */
    {
      id: 't19', title: 'Every point starts alone', type: 'Hierarchical', level: 'Easy', skill: 'hier',
      intro: '<p>A clustering method starts with every point in its own cluster and repeatedly merges the two closest groups.</p>' + AGG,
      parts: [
        { kind: 'mc', pts: 3, q: 'Which description matches this procedure?', options: ['Divisive clustering', 'Flat K-means', 'Agglomerative clustering', 'Soft K-means'], answer: 2 },
      ],
      explain: M`<p><b>Agglomerative clustering</b> works bottom-up: \(N\) singletons, then \(N - 1\) merges of the closest groups. Divisive clustering (e.g. bisecting K-means) works top-down: one cluster, split recursively.</p>`,
    },
    /* ---------- 21 ---------- */
    {
      id: 't20', title: 'Cutting a dendrogram', type: 'Dendrogram', level: 'Medium', skill: 'hier',
      intro: '<p>A hierarchical clustering of six points a–f produced this dendrogram. The vertical axis is the merge height (merges at 1, 1.5, 2.5, 6 and 7).</p>' + DENDRO,
      parts: [
        { kind: 'mc', pts: 2, q: 'What does cutting a dendrogram at a chosen height do?', options: ['Recalculates all the distances', 'Removes every outlier', 'Forces exactly two groups', 'Produces a flat clustering'], answer: 3, inline: false },
        { kind: 'num', pts: 3, q: 'How many clusters does the cut at height 4 give?', answer: 3 },
      ],
      explain: '<p>Cutting at a height gives the clusters that exist at that height: a <b>flat clustering</b>. Different heights give different numbers of clusters. The line at height 4 crosses three vertical lines: <b>{a, b}</b>, <b>{c, d, e}</b> and <b>{f}</b>. (At height 6.5 you would get 2 clusters, below 1 you would get 6.)</p>',
    },
    /* ---------- 22 ---------- */
    {
      id: 't21', title: 'Labels or no labels?', type: 'Evaluation', level: 'Easy', skill: 'hier',
      parts: [
        { kind: 'rows', pts: 5, q: 'Classify each metric by whether it needs the true labels.', options: ['Internal: no true labels', 'External: needs true labels'],
          rows: [
            { label: 'Adjusted Rand Index (ARI)', answer: 1 },
            { label: 'Silhouette score', answer: 0 },
            { label: 'Normalized Mutual Information (NMI)', answer: 1 },
            { label: 'Davies–Bouldin index', answer: 0 },
            { label: 'Cluster purity', answer: 1 },
            { label: 'WCSS, the K-means cost J', answer: 0 },
          ] },
      ],
      explain: M`<p><b>Internal</b> (computed from the data alone): silhouette, Davies–Bouldin, WCSS / \(J\). <b>External</b> (compare with ground-truth labels): ARI, NMI, purity.</p>`,
    },
    /* ---------- 23 ---------- */
    {
      id: 't22', title: 'K = N and purity', type: 'Evaluation', level: 'Medium', skill: 'hier',
      intro: M`<p>Cluster purity is used to score a clustering. A student proposes \(K = N\), so that every point becomes its own cluster.</p>`
        + viz(`<svg class="ml-plot qzv-plot" viewBox="0 0 420 150" role="img">` + [[40, 50, 0], [90, 95, 0], [130, 40, 0], [175, 105, 1], [225, 45, 0], [270, 100, 1], [320, 50, 1], [375, 95, 1]].map(([x, y, k]) => `<circle class="hull" cx="${x}" cy="${y}" r="20"/><circle class="kp k${k}" cx="${x}" cy="${y}" r="7"/>`).join('') + '</svg><p class="qzv-legend"><span><i class="dt-mb c0"></i> true class 1</span><span><i class="dt-mb c1"></i> true class 2</span></p>'),
      parts: [
        { kind: 'num', pts: 2, q: 'What purity does this clustering get?', answer: 1, tol: 0.001, pct: true, show: '1 (100%)' },
        { kind: 'mc', pts: 2, q: 'Why is purity alone dangerous here?', options: ['Singletons are trivially pure, yet useless', 'Purity cannot be computed when K equals N', 'Purity rewards merging all points into one', 'Purity needs no labels, so it cannot judge'], answer: 0, inline: false },
      ],
      explain: '<p>Every singleton cluster contains one class only, so purity is <b>1</b>, even though the clustering is useless as a grouping. Purity only measures homogeneity; ARI and NMI do not reward this trivial solution in the same way.</p>',
    },
    /* ---------- 24 ---------- */
    {
      id: 't23', title: 'Four datasets', type: 'Decision', level: 'Hard', skill: 'limits',
      intro: thumbs(['Dataset A', 'blobs4'], ['Dataset B', 'spirals'], ['Dataset C', 'rings'], ['Dataset D', 'unequal'])
        + '<p><b>A</b>: four compact, roughly spherical groups of similar size, clearly separated. <b>B</b>: two long, intertwined, strongly curved shapes. <b>C</b>: a small ring inside a large ring. <b>D</b>: one large, spread-out group next to a very small, tight one.</p>',
      parts: [
        { kind: 'rows', pts: 4, q: 'Is ordinary K-means (with the right K) a reasonable choice?', options: ['Suits K-means', 'K-means struggles'],
          rows: [
            { label: 'Dataset A', answer: 0 },
            { label: 'Dataset B', answer: 1 },
            { label: 'Dataset C', answer: 1 },
            { label: 'Dataset D', answer: 1 },
          ] },
      ],
      explain: '<p>K-means partitions space around centroids into <b>convex</b> regions and works best when clusters are compact, round and similarly sized: <b>A</b>. It splits the intertwined shapes of <b>B</b> and the rings of <b>C</b> across their structure (no centre lies “inside” a ring), and in <b>D</b> the boundary between the two centres cuts into the large group, handing part of it to the small one.</p>',
    },
  ],
};
