/* ===== Lab 11 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab11-neural-networks.html';
/* ---------- small static visuals ---------- */
const viz = (html, cls = '') => `<div class="qzv ${cls}">${html}</div>`;
const f1 = v => String(Math.round(v * 10) / 10);
// labels: ₁ / ₂ / ₃ become real subscripts (the Unicode glyphs are tiny in Poppins)
const sub = t => String(t).replace(/([₁₂₃])(.*)$/, (m, c, rest) => `<tspan dy="5" font-size="0.75em">${'₁₂₃'.indexOf(c) + 1}</tspan>` + (rest ? `<tspan dy="-5">${rest}</tspan>` : ''));
const lbl = (x, y, t, a = 'start', cls = 'pl') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${a}" dominant-baseline="central">${sub(t)}</text>`;
const DEFS = '<defs><marker id="qa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ah" d="M0,0 L10,5 L0,10 z"/></marker>'
  + '<marker id="qaf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="ah f" d="M0,0 L10,5 L0,10 z"/></marker>'
  + '<marker id="qab" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="ah b" d="M0,0 L10,5 L0,10 z"/></marker></defs>';
const svgw = (w, h, body, cls = '') => `<svg class="ml-plot qzv-plot ${cls}" viewBox="0 0 ${w} ${h}" role="img">${DEFS}${body}</svg>`;
// a 2-D plot: data ranges, grid steps (0 = none); draw(X, Y) returns the SVG body
const plot = ({ x: [x0, x1], y: [y0, y1], w = 420, h = 300, gx = 1, gy = 1, ticks = true, xl = '', yl = '', cls = '' }, draw) => {
  const L = ticks ? 44 : 14, R = 18, T = 18, B = ticks ? 36 : 14;
  const X = v => +(L + (v - x0) / (x1 - x0) * (w - L - R)).toFixed(1), Y = v => +(h - B - (v - y0) / (y1 - y0) * (h - T - B)).toFixed(1);
  let g = `<rect class="km-frame" x="${L}" y="${T}" width="${w - L - R}" height="${h - T - B}"/>`;
  if (gx) for (let v = Math.ceil(x0 / gx) * gx; v <= x1 + 1e-9; v += gx) g += `<line class="gl" x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${h - B}"/>` + (ticks ? `<text class="tk" x="${X(v)}" y="${h - B + 22}" text-anchor="middle">${f1(v) || 0}</text>` : '');
  if (gy) for (let v = Math.ceil(y0 / gy) * gy; v <= y1 + 1e-9; v += gy) g += `<line class="gl" x1="${L}" y1="${Y(v)}" x2="${w - R}" y2="${Y(v)}"/>` + (ticks ? `<text class="tk" x="${L - 8}" y="${Y(v)}" text-anchor="end" dominant-baseline="central">${f1(v) || 0}</text>` : '');
  if (xl) g += lbl(w - R - 4, h - B - 12, xl, 'end', 'tk');
  if (yl) g += lbl(L + 6, T + 12, yl, 'start', 'tk');
  return svgw(w, h, g + draw(X, Y), cls);
};
const pt = (X, Y, x, y, k, r = 7) => `<circle class="kp k${k}" cx="${X(x)}" cy="${Y(y)}" r="${r}"/>`;
const poly = (X, Y, f, a, b, cls, n = 160) => `<polyline class="crv ${cls}" points="${Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return X(x) + ',' + Y(f(x)); }).join(' ')}"/>`;
// a small curve card: axes through 0 (no numbers, so the ranges are read from the shape)
const mini = (title, f, { x = [-4, 4], y = [-1.25, 1.25], loss = false } = {}) => {
  if (loss) y = [-0.2, y[1]];
  const w = 200, h = 150, X = v => 10 + (v - x[0]) / (x[1] - x[0]) * 180, Y = v => 140 - (v - y[0]) / (y[1] - y[0]) * 130;
  let g = `<rect class="km-frame" x="1" y="1" width="198" height="148" rx="8"/>`;
  g += loss ? `<line class="ax" x1="${X(x[0])}" y1="${Y(0)}" x2="${X(x[1])}" y2="${Y(0)}"/><line class="ax" x1="${X(x[0])}" y1="${Y(0)}" x2="${X(x[0])}" y2="${Y(y[1])}"/>` + lbl(X(x[1]), Y(0) + 11, 'epochs', 'end', 'tk sm') + lbl(X(x[0]) + 6, Y(y[1]) + 4, 'loss', 'start', 'tk sm')
    : `<line class="ax" x1="${X(x[0])}" y1="${Y(0)}" x2="${X(x[1])}" y2="${Y(0)}"/><line class="ax" x1="${X(0)}" y1="${Y(y[0])}" x2="${X(0)}" y2="${Y(y[1])}"/>`;
  g += `<polyline class="crv" points="${Array.from({ length: 241 }, (_, i) => { const v = x[0] + (x[1] - x[0]) * i / 240; return X(v).toFixed(1) + ',' + Y(f(v)).toFixed(1); }).join(' ')}"/>`;
  return `<div class="qzv-node"><b>${title}</b><svg class="ml-plot qzv-plot qzv-mini" viewBox="0 0 ${w} ${h}" role="img">${g}</svg></div>`;
};
const cards = (...items) => viz('<div class="qzv-nodes">' + items.join('') + '</div>');
// a graph of units: nodes {id: [x, y, text, cls, note, noteSide]}, edges [a, b, label, t, cls]
const graph = (w, h, N, E, extra = '', R = 18) => {
  let g = E.map(([a, b, l, t = 0.5, cls = '', dy = -12]) => {
    const [x1, y1] = N[a], [x2, y2] = N[b], dx = x2 - x1, dyy = y2 - y1, L = Math.hypot(dx, dyy);
    const ra = N[a][3] === 'dot' ? 4 : R, rb = N[b][3] === 'dot' ? 4 : R + (R < 12 ? 1 : 3);
    return `<line class="nn-e ${cls}" x1="${(x1 + dx / L * ra).toFixed(1)}" y1="${(y1 + dyy / L * ra).toFixed(1)}" x2="${(x2 - dx / L * rb).toFixed(1)}" y2="${(y2 - dyy / L * rb).toFixed(1)}" marker-end="url(#qa)"/>`
      + (l ? lbl((x1 + dx * t).toFixed(1), (y1 + dyy * t + dy).toFixed(1), l, 'middle', 'ew') : '');
  }).join('');
  g += Object.values(N).map(([x, y, t, cls = '', note, side = 'left']) => (cls === 'dot' ? `<text class="pl" x="${x}" y="${y}" text-anchor="start" dominant-baseline="central">${sub(t)}</text>` : `<circle class="nn-n ${cls}" cx="${x}" cy="${y}" r="${R}"/>` + lbl(x, y, t, 'middle', 'nn-t'))
    + (note ? (side === 'left' ? lbl(x - R - 8, y, note, 'end') : side === 'right' ? lbl(x + R + 8, y, note) : lbl(x, y + (side === 'below' ? R + 16 : -R - 14), note, 'middle', 'tk')) : '')).join('');
  return svgw(w, h, g + extra);
};
// a fully connected network with the given layer sizes (drawn, not labelled)
const net = (sizes, w = 420, h = 240, names) => {
  const N = {}, E = [], cx = i => 40 + i * (w - 80) / (sizes.length - 1), spOf = n => Math.min(52, (h - (names ? 70 : 40)) / Math.max(n - 1, 1));
  const R = Math.max(6, Math.min(18, Math.min(...sizes.map(spOf)) / 2 - 1.5));
  sizes.forEach((n, i) => { const sp = spOf(n), y0 = (h - (names ? 26 : 0)) / 2 - sp * (n - 1) / 2;
    for (let j = 0; j < n; j++) N[i + '.' + j] = [cx(i), y0 + j * sp, '', i === 0 ? 'in' : i === sizes.length - 1 ? 'out' : 'hid']; });
  sizes.forEach((n, i) => { if (i) for (let a = 0; a < sizes[i - 1]; a++) for (let b = 0; b < n; b++) E.push([(i - 1) + '.' + a, i + '.' + b]); });
  return graph(w, h, N, E, names ? names.map((t, i) => lbl(cx(i), h - 12, t, 'middle', 'tk')).join('') : '', R);
};
// forward / backward flow between boxes
const flow = (boxes, top, bottom) => {
  const w = 440, h = 180, bw = 66, cx = i => 42 + i * (w - 84) / (boxes.length - 1), y = 90;
  let g = boxes.map((t, i) => `<rect class="box${i === boxes.length - 1 ? ' loss' : ''}" x="${cx(i) - bw / 2}" y="${y - 20}" width="${bw}" height="40" rx="10"/>` + lbl(cx(i), y, t, 'middle', 'nn-t fl')).join('');
  for (let i = 0; i + 1 < boxes.length; i++) {
    g += `<line class="nn-e fwd" x1="${cx(i) + bw / 2 + 3}" y1="${y - 8}" x2="${cx(i + 1) - bw / 2 - 3}" y2="${y - 8}" marker-end="url(#qaf)"/>`;
    g += `<line class="nn-e bwd" x1="${cx(i + 1) - bw / 2 - 3}" y1="${y + 8}" x2="${cx(i) + bw / 2 + 3}" y2="${y + 8}" marker-end="url(#qab)"/>`;
  }
  g += lbl(w / 2, 32, top, 'middle', 'pl f') + lbl(w / 2, 150, bottom, 'middle', 'pl b');
  return svgw(w, h, g);
};
// horizontal bars: rows of [label, value, max, shown, cls]
const bars = rows => '<div class="qzv-bars">' + rows.map(([l, v, max, shown, cls]) => `<div class="qzv-bar ${cls || ''}"><span>${l}</span><span class="track"><i style="width:${100 * v / max}%"></i></span><b>${shown}</b></div>`).join('') + '</div>';
const stat = (l, v) => `<div class="qzv-node qzv-stat"><b>${l}</b><span>${v}</span></div>`;
// layer blocks for width vs depth: taller = more units
const layers = (title, sizes) => `<div class="qzv-node"><b>${title}</b><div class="qzv-layers">` + sizes.map((n, i) => (i ? '<i aria-hidden="true">→</i>' : '')
  + `<span class="${i === 0 ? 'in' : i === sizes.length - 1 ? 'out' : 'hid'}" style="height:${(1.3 + 0.48 * Math.sqrt(n)).toFixed(2)}rem">${n}</span>`).join('') + '</div></div>';
const sig = z => 1 / (1 + Math.exp(-z));
// a 28 × 28 "7", flattened into a vector
const DIGIT = (() => {
  const on = (r, c) => (r >= 5 && r <= 7 && c >= 6 && c <= 21) || (r >= 7 && r <= 23 && Math.abs(c - (21 - (r - 7) * 0.62)) <= 1.4);
  let g = '';
  for (let r = 0; r < 28; r++) for (let c = 0; c < 28; c++) g += `<rect class="${on(r, c) ? 'pix' : 'pix0'}" x="${16 + c * 7}" y="${14 + r * 7}" width="6.4" height="6.4"/>`;
  g += `<path class="brace" d="M16 216 v6 h195 v-6"/>` + lbl(113, 234, '28 pixels', 'middle', 'tk') + `<path class="brace" d="M218 14 h6 v195 h-6"/>` + lbl(232, 112, '28', 'start', 'tk');
  g += `<line class="nn-e" x1="262" y1="112" x2="312" y2="112" marker-end="url(#qa)"/>` + lbl(287, 94, 'flatten', 'middle', 'tk');
  for (let i = 0; i < 9; i++) g += `<rect class="${[2, 3, 6].includes(i) ? 'pix' : 'pix0'}" x="330" y="${30 + i * 18}" width="16" height="16"/>`;
  g += lbl(338, 208, '⋮', 'middle', 'pl') + lbl(358, 39, 'x₁', 'start', 'tk') + lbl(358, 183, '…', 'start', 'tk');
  return viz(svgw(420, 250, g));
})();

window.QUIZ = {
  id: 'lab11',
  skills: [
    { id: 'neuron', label: 'Neurons and activation functions', href: LAB + '#neuron' },
    { id: 'perc', label: 'Perceptrons, XOR and hidden layers', href: LAB + '#logic' },
    { id: 'mlp', label: 'MLP architecture and the forward pass', href: LAB + '#structures' },
    { id: 'gd', label: 'Gradient descent and the learning rate', href: LAB + '#learning' },
    { id: 'bp', label: 'Back-propagation and training', href: LAB + '#backprop' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: 'One neuron, two inputs', type: 'Neuron', level: 'Easy', skill: 'neuron',
      intro: '<p>A neuron computes a weighted sum plus bias, \\(z = \\sum_j w_j x_j + b\\), then applies an activation \\(a = g(z)\\).</p>'
        + viz(graph(440, 230, { x1: [110, 55, 'x₁', 'in', '2'], x2: [110, 175, 'x₂', 'in', '1'], s: [250, 115, 'Σ', 'hid', 'b = 1', 'above'], g: [345, 115, 'g', 'out'], a: [410, 115, 'a', 'dot'] },
          [['x1', 's', 'w₁ = 0.5', 0.5, '', -16], ['x2', 's', 'w₂ = −1', 0.5, '', 22], ['s', 'g'], ['g', 'a']])),
      parts: [
        { kind: 'num', pts: 3, q: M`What is the pre-activation value \(z\)?`, prefix: M`\(z =\)`, answer: 1 },
        { kind: 'num', pts: 2, q: M`If \(g\) is the sigmoid \(\sigma(z) = \frac{1}{1 + e^{-z}}\), what is the output \(a\)? (two decimals)`, prefix: M`\(a =\)`, answer: sig(1), tol: 0.006, show: '0.73' },
      ],
      explain: M`<p>\(z = (0.5)(2) + (-1)(1) + 1 = 1\), and \(a = \sigma(1) = \frac{1}{1 + e^{-1}} \approx 0.73\).</p>`,
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'The same z, four activations', type: 'Activation', level: 'Easy', skill: 'neuron',
      intro: M`<p>A neuron's weighted sum plus bias is \(z = -3\).</p>` + cards(stat('z', '−3'), stat('ReLU(z)', 'max(0, z)'), stat('Step(z)', '1 if z > 0, else 0')),
      parts: [
        { kind: 'rows', pts: 4, q: 'What does each activation output for z = −3?', options: ['−3', '0', '≈ 0.05', '1'],
          rows: [
            { label: 'ReLU', answer: 1 },
            { label: 'Linear, g(z) = z', answer: 0 },
            { label: 'Sigmoid', answer: 2 },
            { label: 'Step', answer: 1 },
          ] },
      ],
      explain: M`<p>ReLU: \(\max(0, -3) = 0\). Step: \(z \le 0\), so 0. Linear: \(-3\). Sigmoid: \(\sigma(-3) = \frac{1}{1 + e^{3}} \approx 0.047\): small, but never exactly 0.</p>`,
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Four activation curves', type: 'Activation', level: 'Easy', skill: 'neuron',
      intro: '<p>Each card plots output against input; the lines are the axes through 0.</p>' + cards(mini('Curve A', sig), mini('Curve B', z => Math.max(0, z) / 3.4), mini('Curve C', z => (z > 0 ? 1 : 0)), mini('Curve D', Math.tanh)),
      parts: [
        { kind: 'rows', pts: 4, q: 'Match each curve to its activation function.', options: ['Step', 'tanh', 'Sigmoid', 'ReLU'],
          rows: [
            { label: 'Curve A', answer: 2 },
            { label: 'Curve B', answer: 3 },
            { label: 'Curve C', answer: 0 },
            { label: 'Curve D', answer: 1 },
          ] },
      ],
      explain: '<p><b>A</b>: sigmoid, a smooth S-curve from 0 to 1. <b>B</b>: ReLU, 0 for negative inputs and the identity for positive ones. <b>C</b>: step, jumping from 0 to 1 at 0. <b>D</b>: tanh, an S-curve like the sigmoid but from −1 to 1, centred at 0.</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'Output ranges', type: 'Activation', level: 'Easy', skill: 'neuron',
      parts: [
        { kind: 'mc', pts: 3, q: 'Which pairing is correct?', options: ['Sigmoid: (0, 1), tanh: (−1, 1)', 'Sigmoid: (−1, 1), tanh: (0, 1)', 'ReLU: (0, 1), sigmoid: all reals', 'Linear: (0, 1), ReLU: (−1, 1)'], answer: 0, inline: false },
      ],
      explain: '<p>Sigmoid outputs lie in <b>(0, 1)</b>, tanh outputs in <b>(−1, 1)</b>. ReLU outputs lie in [0, ∞) and a linear unit can output any real number.</p>',
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'A single threshold neuron', type: 'Perceptron', level: 'Easy', skill: 'perc',
      intro: '<p>A single threshold neuron fires on one side of its decision boundary:</p>'
        + viz(plot({ x: [0, 6], y: [0, 5], h: 260, ticks: false, gx: 0, gy: 0, xl: 'x₁', yl: 'x₂' }, (X, Y) =>
          `<polygon class="half" points="${X(0)},${Y(2.2)} ${X(6)},${Y(3.2)} ${X(6)},${Y(5)} ${X(0)},${Y(5)}"/><line class="sep" x1="${X(0)}" y1="${Y(2.2)}" x2="${X(6)}" y2="${Y(3.2)}"/>`
          + [[2, 3.6], [3, 4.2], [4, 3.9], [2.6, 4.5], [4.6, 4.5], [1.4, 4.1]].map(([x, y]) => pt(X, Y, x, y, 0)).join('') + [[1, 1.2], [2, 1.6], [3.2, 0.9], [1.6, 0.6], [4.4, 1.8], [2.6, 2.1]].map(([x, y]) => pt(X, Y, x, y, 1)).join(''))),
      parts: [
        { kind: 'mc', pts: 3, q: 'What kind of classifier can a single perceptron represent?', options: ['Any curved decision boundary', 'Any Boolean function of the inputs', 'Only a constant output', 'A linear separator'], answer: 3, inline: false },
      ],
      explain: M`<p>A single perceptron fires when \(\mathbf{W} \cdot \mathbf{x} > 0\): the points where it fires lie on one side of a straight line (a hyperplane in more dimensions). It is a <b>linear separator</b>.</p>`,
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'Four points, two classes', type: 'XOR', level: 'Medium', skill: 'perc',
      intro: '<p>XOR is 1 when exactly one input is 1:</p>'
        + viz(plot({ x: [-0.4, 1.4], y: [-0.4, 1.4], w: 320, h: 300, gx: 1, gy: 1, xl: 'x₁', yl: 'x₂' }, (X, Y) => pt(X, Y, 0, 1, 0, 11) + pt(X, Y, 1, 0, 0, 11) + pt(X, Y, 0, 0, 1, 11) + pt(X, Y, 1, 1, 1, 11)) + '<p class="qzv-legend"><span><i class="dt-mb c0"></i> class 1</span><span><i class="dt-mb c1"></i> class 0</span></p>', 'qzv-narrow'),
      parts: [
        { kind: 'mc', pts: 3, q: 'Why can a single perceptron not classify XOR perfectly?', options: ['XOR needs more than two input values', 'No line separates the two classes', 'The step function cannot output a 1', 'XOR has too few training examples'], answer: 1, inline: false },
        { kind: 'multi', pts: 2, q: 'Which of these functions <b>can</b> one threshold unit represent?', options: ['AND', 'OR', 'XOR', 'NAND', 'NOT'], answer: [0, 1, 3, 4], letters: false },
      ],
      explain: '<p>The two class-1 points sit on opposite corners, so every straight line leaves a class-0 point on the wrong side: XOR is <b>not linearly separable</b>. AND, OR, NAND and NOT are linearly separable, so one threshold unit represents each of them (see the lab’s gate table).</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'Two hidden units for XOR', type: 'Hidden layer', level: 'Medium', skill: 'perc',
      intro: M`<p>The lab's XOR network: \(h_1\) fires if <b>at least one</b> input is 1, \(h_2\) if <b>both</b> are 1, and the output fires if \(h_1 = 1\) and \(h_2 = 0\).</p>`
        + viz(graph(440, 250, { x1: [70, 70, 'x₁', 'in'], x2: [70, 190, 'x₂', 'in'], h1: [230, 70, 'h₁', 'hid', 'at least one is 1', 'above'], h2: [230, 190, 'h₂', 'hid', 'both are 1', 'below'], y: [380, 130, 'y', 'out'] },
          [['x1', 'h1'], ['x1', 'h2'], ['x2', 'h1'], ['x2', 'h2'], ['h1', 'y'], ['h2', 'y']])),
      parts: [
        { kind: 'mc', pts: 3, q: 'What is the main role of the hidden layer?', options: ['Learn new features of the input', 'Store a copy of the training set', 'Remove the weights of the output unit', 'Replace the output layer entirely'], answer: 0, inline: false },
        { kind: 'num', pts: 3, q: M`The four inputs (0, 0), (0, 1), (1, 0), (1, 1) are mapped to hidden values \((h_1, h_2)\). How many <b>distinct</b> points do they land on?`, answer: 3 },
      ],
      explain: '<p>(0, 0) → (0, 0); (0, 1) and (1, 0) → (1, 0); (1, 1) → (1, 1): only <b>3</b> distinct points. In this hidden space a single line separates (1, 0) from the other two: the hidden layer has learned a <b>new representation</b> in which XOR becomes linearly separable.</p>',
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'A 2 → 3 → 2 → 1 network', type: 'Architecture', level: 'Easy', skill: 'mlp',
      intro: '<p>The layer sizes are <b>2 → 3 → 2 → 1</b> (the lab’s golf network); every unit is connected to every unit in the next layer.</p>' + viz(net([2, 3, 2, 1])),
      parts: [
        { kind: 'num', pts: 1, q: 'How many input units?', answer: 2 },
        { kind: 'num', pts: 1, q: 'How many hidden layers?', answer: 2 },
        { kind: 'num', pts: 1, q: 'What is the width of the first hidden layer?', answer: 3 },
        { kind: 'num', pts: 1, q: 'How many output units?', answer: 1 },
      ],
      explain: '<p>Input units: <b>2</b>. Hidden layers: <b>2</b> (the layers with 3 and 2 units, between input and output). Width of the first hidden layer: <b>3</b>. Output units: <b>1</b>.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'Count the parameters', type: 'Parameters', level: 'Medium', skill: 'mlp',
      intro: '<p>The same 2 → 3 → 2 → 1 network. Every unit in one layer connects to every unit in the next, and each non-input unit has one bias.</p>' + viz(net([2, 3, 2, 1], 420, 200)),
      parts: [
        { kind: 'num', pts: 2, q: 'How many weights?', answer: 14 },
        { kind: 'num', pts: 3, q: 'How many trainable parameters in total (weights and biases)?', answer: 20 },
      ],
      explain: '<p>Weights: 2 × 3 + 3 × 2 + 2 × 1 = 6 + 6 + 2 = <b>14</b>. Biases: 3 + 2 + 1 = 6. Total: <b>20</b>. (The lab’s scikit-learn code prints the weight shapes (2, 3), (3, 2), (2, 1).)</p>',
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'Every activation is g(z) = z', type: 'Nonlinearity', level: 'Medium', skill: 'perc',
      intro: M`<p>A deep network in which every activation is linear:</p><pre class="qz-code qz-diagram">input
  ↓  linear layer, g(z) = z
  ↓  linear layer, g(z) = z
  ↓  linear layer, g(z) = z
output</pre><div class="math-block">\[ \mathbf{y} = \mathbf{W}^{(3)} \mathbf{W}^{(2)} \mathbf{W}^{(1)} \mathbf{x} \]</div>`,
      parts: [
        { kind: 'mc', pts: 3, q: 'What is the main consequence?', options: ['Each layer becomes a recurrent layer', 'The network can now represent XOR', 'Every layer gains extra output classes', 'The network is still a linear function'], answer: 3, inline: false },
      ],
      explain: M`<p>Composing linear maps gives a linear map: \(\mathbf{W} = \mathbf{W}^{(3)} \mathbf{W}^{(2)} \mathbf{W}^{(1)}\), so the whole network is equivalent to <b>one linear layer</b> and still cannot represent XOR. The nonlinearity is what gives depth its power.</p>`,
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'A forward pass with ReLU', type: 'Forward pass', level: 'Medium', skill: 'mlp',
      intro: '<p>All biases are 0 and every unit uses ReLU.</p>'
        + viz(graph(440, 230, { x1: [110, 55, 'x₁', 'in', '1'], x2: [110, 175, 'x₂', 'in', '2'], h: [250, 115, 'h', 'hid'], o: [390, 115, 'ŷ', 'out'] },
          [['x1', 'h', 'w₁ = 1', 0.5, '', -16], ['x2', 'h', 'w₂ = 1', 0.5, '', 22], ['h', 'o', 'w₃ = 2', 0.5, '', -16]])),
      parts: [
        { kind: 'num', pts: 3, q: M`What is the final output \(\hat{y}\)?`, prefix: M`\(\hat{y} =\)`, answer: 6 },
        { kind: 'num', pts: 2, q: M`And if \(w_3 = -2\) instead?`, prefix: M`\(\hat{y} =\)`, answer: 0 },
      ],
      explain: M`<p>Hidden: \(z_h = (1)(1) + (1)(2) = 3\), \(h = \text{ReLU}(3) = 3\). Output: \(z_o = (2)(3) = 6\), \(\hat{y} = \text{ReLU}(6) = 6\).</p><p>With \(w_3 = -2\): \(z_o = -6\) and \(\text{ReLU}(-6) = 0\).</p>`,
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'Two directions through the network', type: 'Back-propagation', level: 'Easy', skill: 'bp',
      intro: viz(flow(['inputs', 'hidden', 'output', 'loss'], 'FORWARD PASS', 'BACKWARD PASS')),
      parts: [
        { kind: 'mc', pts: 4, q: 'What information is propagated backward during back-propagation?', options: ['Error-derived gradients', 'The raw training labels only', 'New input examples', 'Cluster assignments'], answer: 0, inline: false },
      ],
      explain: M`<p><b>Gradient information derived from the error.</b> The output deltas \(\Delta_i\) are passed back through the weights, giving each hidden unit its share of the blame: \(\Delta_j = g'(in_j) \sum_i W_{j,i} \Delta_i\).</p>`,
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: 'A hard threshold', type: 'Activation', level: 'Medium', skill: 'neuron',
      intro: '<p>The step function and its derivative (dashed):</p>'
        + viz(plot({ x: [-3, 3], y: [-0.2, 1.3], h: 220, gx: 1, gy: 0, ticks: false }, (X, Y) => `<line class="ax" x1="${X(-3)}" y1="${Y(0)}" x2="${X(3)}" y2="${Y(0)}"/><line class="ax" x1="${X(0)}" y1="${Y(-0.2)}" x2="${X(0)}" y2="${Y(1.3)}"/>`
          + `<polyline class="crv" points="${X(-3)},${Y(0)} ${X(0)},${Y(0)} ${X(0)},${Y(1)} ${X(3)},${Y(1)}"/><line class="crv d" x1="${X(-3)}" y1="${Y(0.03)}" x2="${X(3)}" y2="${Y(0.03)}"/>` + lbl(X(0.15), Y(1) - 14, '1') + lbl(X(3) - 4, Y(0) + 16, 'z', 'end', 'tk')), 'qzv-narrow'),
      parts: [
        { kind: 'mc', pts: 3, q: 'Why is this a problem for gradient-based learning?', options: ['The step output is not in (0, 1)', 'Zero derivative: no learning signal', 'Its derivative is too large to be stable', 'The step makes the network recurrent'], answer: 1, inline: false },
      ],
      explain: '<p>Gradient descent needs a useful derivative. The step’s derivative is <b>0 almost everywhere</b> (and undefined at 0), so the weights receive essentially no learning signal. That is why we switch to soft thresholds such as the sigmoid.</p>',
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'One gradient-descent step', type: 'Gradient descent', level: 'Easy', skill: 'gd',
      intro: M`<div class="math-block">\[ w \leftarrow w - \alpha \frac{\partial J}{\partial w} \]</div>` + cards(stat('current w', '3'), stat('∂J / ∂w', '+4'), stat('learning rate α', '0.1')),
      parts: [
        { kind: 'num', pts: 3, q: 'What is the new weight?', prefix: M`\(w =\)`, answer: 2.6, tol: 0.001 },
        { kind: 'num', pts: 2, q: 'What would it be if the gradient were −4 instead?', prefix: M`\(w =\)`, answer: 3.4, tol: 0.001 },
      ],
      explain: M`<p>\(w = 3 - (0.1)(4) = 2.6\). With gradient \(-4\): \(w = 3 - (0.1)(-4) = 3.4\). A positive gradient means increasing \(w\) raises the cost, so \(w\) shrinks; a negative gradient makes it grow.</p>`,
    },
    /* ---------- 15 ---------- */
    {
      id: 't15', title: 'Three loss curves', type: 'Learning rate', level: 'Medium', skill: 'gd',
      intro: '<p>The same model trained three times, with three different learning rates:</p>'
        + cards(mini('Run A', t => 1 - 0.062 * t, { x: [0, 10], y: [0, 1.15], loss: true }), mini('Run B', t => 0.72 + 0.16 * Math.sin(t * 5.3) * Math.cos(t * 2.1) + 0.05 * Math.sin(t * 11), { x: [0, 10], y: [0, 1.15], loss: true }), mini('Run C', t => 0.1 + 0.9 * Math.exp(-t / 1.4), { x: [0, 10], y: [0, 1.15], loss: true })),
      parts: [
        { kind: 'rows', pts: 4, q: 'What is the most plausible interpretation of each run?', options: ['Learning rate too small', 'Reasonable learning rate', 'Learning rate too large'],
          rows: [
            { label: 'Run A', answer: 0 },
            { label: 'Run B', answer: 2 },
            { label: 'Run C', answer: 1 },
          ] },
      ],
      explain: '<p><b>A</b>: the loss keeps falling steadily but slowly: the learning rate may be too small. <b>B</b>: the loss jumps around without settling: the learning rate may be too large (unstable). <b>C</b>: fast descent, then it levels off: a reasonable learning rate that converges quickly.</p>',
    },
    /* ---------- 16 ---------- */
    {
      id: 't16', title: 'Three step sizes', type: 'Learning rate', level: 'Medium', skill: 'gd',
      intro: M`<p>The same model is trained with three learning rates \(\alpha\):</p>` + cards(stat('Run A', 'α = 5'), stat('Run B', 'α = 0.00001'), stat('Run C', 'α = 0.3')),
      parts: [
        { kind: 'rows', pts: 3, q: 'Which behaviour is most plausible?', options: ['Very slow progress', 'Useful progress', 'Overshooting or divergence'],
          rows: [
            { label: 'Run A, α = 5', answer: 2 },
            { label: 'Run B, α = 0.00001', answer: 0 },
            { label: 'Run C, α = 0.3', answer: 1 },
          ] },
        { kind: 'num', pts: 2, q: M`The lab's example: \(J(w) = (w - 2)^2 + 1\), starting at \(w = 5.5\) with \(\alpha = 0.3\). Where is \(w\) after <b>one</b> step?`, prefix: M`\(w =\)`, answer: 3.4, tol: 0.001,
          html: viz(plot({ x: [-1, 7], y: [0, 16], w: 400, h: 240, gx: 1, gy: 4, xl: 'w', yl: 'J(w)' }, (X, Y) => poly(X, Y, w => Math.min((w - 2) ** 2 + 1, 16.5), -1, 6.2, '') + `<circle class="probe" cx="${X(5.5)}" cy="${Y(13.25)}" r="7"/>` + lbl(X(5.5) + 12, Y(13.25) + 4, 'start')), 'qzv-narrow') },
      ],
      explain: M`<p>A tiny \(\alpha\) barely moves the weights; a moderate one makes useful progress; a very large one jumps past the minimum and can diverge.</p><p>Here \(J'(w) = 2(w - 2) = 2 \cdot 3.5 = 7\) at \(w = 5.5\), so \(w = 5.5 - 0.3 \cdot 7 = 3.4\), which is what the lab's “Just right (0.3)” widget shows after one step.</p>`,
    },
    /* ---------- 17 ---------- */
    {
      id: 't17', title: 'A training curve', type: 'Training curve', level: 'Easy', skill: 'gd',
      intro: viz(plot({ x: [0, 50], y: [0, 1], h: 230, gx: 10, gy: 0.2, yl: 'training loss' }, (X, Y) => poly(X, Y, t => 0.08 + 0.55 * Math.exp(-t / 6) + 0.3 / (1 + Math.exp((t - 30) / 3)) * (t > 12 ? 1 : 0.3 + 0.7 * t / 12), 0, 50, '')) + '<p class="qzv-legend">training loss (vertical) against epochs (horizontal)</p>'),
      parts: [
        { kind: 'mc', pts: 2, q: 'What does this curve show?', options: ['Training error is decreasing', 'The model is getting wider', 'The number of classes is falling', 'Inputs are being removed'], answer: 0, inline: false },
      ],
      explain: '<p>The training loss goes down over the epochs: the model fits the training set better and better (with a plateau before a second drop).</p>',
    },
    /* ---------- 18 ---------- */
    {
      id: 't18', title: '1000 examples, 5 epochs', type: 'Epochs', level: 'Easy', skill: 'bp',
      intro: '<p>A training set has 1000 examples; one <b>epoch</b> means every example is processed once.</p>'
        + viz('<div class="qzv-split">' + [1, 2, 3, 4, 5].map(i => `<div class="${i % 2 ? 'a' : 'b'}" style="flex:1">epoch ${i}</div>`).join('') + '</div>'),
      parts: [
        { kind: 'num', pts: 2, q: 'How many example-visits occur during 5 epochs?', answer: 5000 },
        { kind: 'num', pts: 2, q: 'With mini-batches of 50 examples and one weight update per mini-batch, how many updates happen in those 5 epochs?', answer: 100 },
      ],
      explain: '<p>5 × 1000 = <b>5000</b> example-visits. One epoch has 1000 / 50 = 20 mini-batches, so 5 epochs give 5 × 20 = <b>100</b> updates (batch gradient descent would make only 5).</p>',
    },
    /* ---------- 19 ---------- */
    {
      id: 't19', title: 'When to update', type: 'Update styles', level: 'Easy', skill: 'bp',
      parts: [
        { kind: 'rows', pts: 3, q: 'Which update style does each setup describe?', options: ['Batch gradient descent', 'Stochastic / mini-batch GD'],
          rows: [
            { label: '<b>A.</b> Compute gradients from all training examples, then update once.', answer: 0 },
            { label: '<b>B.</b> Use one example or a small mini-batch, then update.', answer: 1 },
            { label: '<b>C.</b> Pick 32 random examples, update, and repeat.', answer: 1 },
            { label: '<b>D.</b> Sum the updates for every example in the epoch, then apply them.', answer: 0 },
          ] },
      ],
      explain: '<p><b>Batch</b> gradient descent (A, D): one update per pass over the whole training set. <b>Stochastic / mini-batch</b> (B, C): update after every example or small random batch.</p>',
    },
    /* ---------- 20 ---------- */
    {
      id: 't20', title: 'Classifying handwritten digits', type: 'Output layer', level: 'Easy', skill: 'mlp',
      intro: '<p>A network classifies handwritten digits into ten classes:</p>' + viz('<div class="qzv-digits">' + '0123456789'.split('').map(d => `<span>${d}</span>`).join('') + '</div>'),
      parts: [
        { kind: 'mc', pts: 2, q: 'How many output units are natural for this setup?', options: ['1', '2', '10', '784'], answer: 2, letters: false },
      ],
      explain: '<p><b>10</b>: one output unit per class (per digit), and the prediction is the most active one. One output unit is for regression or binary classification.</p>',
    },
    /* ---------- 21 ---------- */
    {
      id: 't21', title: 'A 28 × 28 image', type: 'Input layer', level: 'Easy', skill: 'mlp',
      intro: '<p>An MNIST image has 28 × 28 pixels, and the MLP treats it as a flat vector.</p>' + DIGIT,
      parts: [
        { kind: 'num', pts: 2, q: 'How many input values are used?', answer: 784 },
        { kind: 'num', pts: 3, q: 'The slides’ 400–300–10 MLP has layers 784 → 400 → 300 → 10. How many parameters (weights and biases) connect the input to the first hidden layer?', answer: 314000 },
      ],
      explain: '<p>28 × 28 = <b>784</b> inputs. Input → first hidden layer: 784 × 400 = 313,600 weights plus 400 biases = <b>314,000</b> parameters.</p>',
    },
    /* ---------- 22 ---------- */
    {
      id: 't22', title: 'No hidden layer vs. 8 hidden units', type: 'Architecture', level: 'Medium', skill: 'perc',
      intro: cards(`<div class="qzv-node"><b>Network A</b>${net([2, 1], 200, 190)}</div>`, `<div class="qzv-node"><b>Network B</b>${net([2, 8, 1], 200, 190)}</div>`),
      parts: [
        { kind: 'mc', pts: 3, q: 'Why can Network B represent a more complex decision boundary?', options: ['It sees more input features than A', 'Its hidden units combine several lines', 'Its output uses a larger learning rate', 'It stores all the training points'], answer: 1, inline: false },
      ],
      explain: '<p>Network A is a single unit: one linear boundary. In Network B each nonlinear hidden unit learns its own boundary (an intermediate feature), and the output combines them into a nonlinear function. In the lab’s playground, the <i>2-1</i> network cannot fit the golf data, while the networks with hidden layers can.</p>',
    },
    /* ---------- 23 ---------- */
    {
      id: 't23', title: 'Six runs of the same MLP', type: 'Initialisation', level: 'Medium', skill: 'gd',
      intro: '<p>The lab’s 2 → 3 → 2 → 1 golf network, trained six times from different random initial weights (everything else identical):</p>'
        + viz(bars([['Run 1', 50, 100, '50%'], ['Run 2', 50, 100, '50%'], ['Run 3', 75, 100, '75%'], ['Run 4', 100, 100, '100%'], ['Run 5', 100, 100, '100%'], ['Run 6', 62.5, 100, '62.5%']]) + '<p class="qzv-legend">training accuracy</p>'),
      parts: [
        { kind: 'mc', pts: 3, q: 'What does this illustrate?', options: ['The dataset changes on every run', 'The output layer has no weights', 'Back-propagation is deterministic', 'Initialisation affects the solution'], answer: 3, inline: false },
      ],
      explain: '<p>Only the initial weights differ, yet the runs end at different solutions: gradient descent can get stuck in <b>local minima</b>, so the <b>initialisation</b> affects the final result (as with K-means, random restarts help).</p>',
    },
    /* ---------- 24 ---------- */
    {
      id: 't24', title: '2 → 100 → 1 vs. 2 → 10 → 10 → 10 → 1', type: 'Width and depth', level: 'Medium', skill: 'mlp',
      intro: cards(layers('Network A', [2, 100, 1]), layers('Network B', [2, 10, 10, 10, 1])),
      parts: [
        { kind: 'mc', pts: 2, q: 'Which statement is correct?', options: ['A is deeper; B is wider', 'They have equal depth', 'A is wider; B is deeper', 'Neither has hidden layers'], answer: 2, inline: false },
        { kind: 'num', pts: 3, q: 'How many trainable parameters (weights and biases) does Network B have?', answer: 261 },
      ],
      explain: '<p><b>A is wider</b> (one hidden layer of 100 units), <b>B is deeper</b> (three hidden layers of 10).</p><p>B: (2·10 + 10) + (10·10 + 10) + (10·10 + 10) + (10·1 + 1) = 30 + 110 + 110 + 11 = <b>261</b> parameters. (A has 2·100 + 100 + 100·1 + 1 = 401.)</p>',
    },
    /* ---------- 25 ---------- */
    {
      id: 't25', title: 'One training iteration', type: 'Learning cycle', level: 'Medium', skill: 'bp',
      intro: viz(flow(['x', 'hidden', 'output', 'loss'], 'FORWARD', 'BACKWARD: gradients')),
      parts: [
        { kind: 'rows', pts: 5, q: 'What happens in each stage?', options: ['Measure the prediction error', 'Update the weights', 'Compute activations and prediction', 'Compute the gradients'],
          rows: [
            { label: 'Forward pass', answer: 2 },
            { label: 'Loss', answer: 0 },
            { label: 'Backward pass (back-propagation)', answer: 3 },
            { label: 'Gradient-descent step', answer: 1 },
          ] },
      ],
      explain: '<p><b>Forward pass</b>: compute the activations and the prediction. <b>Loss</b>: measure the prediction error. <b>Backward pass</b>: compute the gradients with back-propagation. <b>Gradient descent</b>: update the weights to reduce the loss. Then repeat.</p>',
    },
  ],
};
