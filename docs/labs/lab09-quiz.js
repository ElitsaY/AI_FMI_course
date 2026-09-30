/* ===== Lab 09 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab09-decision-trees.html';
/* ---------- small static visuals (reuse the lab's .dt-tree / .dt-mb styles) ---------- */
const svg = (w, h, body, cls = '') => `<svg class="dt-tree ${cls}" viewBox="0 0 ${w} ${h}" role="img">${body}</svg>`;
const nd = (x, y, w, text, cls, h = 36) => `<g class="nd ${cls}"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10"/><text class="t" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${text}</text></g>`;
const q = (x, y, w, text) => nd(x, y, w, text, 'q');
const leaf = (x, y, yes, label) => nd(x, y, 58, label || (yes ? 'Yes' : 'No'), 'leaf ' + (yes ? 'c0' : 'c1'));
const edge = (x1, y1, x2, y2, label, t = 0.5) => `<line class="edge" x1="${x1}" y1="${y1 + 18}" x2="${x2}" y2="${y2 - 18}"/>`
  + (label ? `<text class="elabel" x="${x1 + (x2 - x1) * t}" y="${y1 + 18 + (y2 - y1 - 36) * t}" text-anchor="middle" dominant-baseline="central">${label}</text>` : '');
const viz = (html, cls = '') => `<div class="qzv ${cls}">${html}</div>`;
const legend = '<p class="qzv-legend"><span><i class="dt-mb c0"></i> Yes</span><span><i class="dt-mb c1"></i> No</span></p>';
// the weather tree from the lab
const WEATHER = viz(svg(480, 270,
  edge(240, 30, 95, 135, 'Sunny') + edge(240, 30, 240, 135, 'Overcast') + edge(240, 30, 385, 135, 'Rain')
  + edge(95, 135, 40, 240, 'High') + edge(95, 135, 150, 240, 'Normal') + edge(385, 135, 330, 240, 'Weak') + edge(385, 135, 440, 240, 'Strong')
  + q(240, 30, 118, 'Outlook?') + q(95, 135, 112, 'Humidity?') + leaf(240, 135, true) + q(385, 135, 84, 'Wind?')
  + leaf(40, 240, false) + leaf(150, 240, true) + leaf(330, 240, true) + leaf(440, 240, false), 'qzv-tree'));
// class-count cards
const bag = (yes, no) => '<span class="dt-bag">' + '<i class="dt-mb c0"></i>'.repeat(yes) + '<i class="dt-mb c1"></i>'.repeat(no) + '</span>';
const card = (title, yes, no) => `<div class="qzv-node"><b>${title}</b>${bag(yes, no)}<span>${yes} Yes · ${no} No</span></div>`;
const cards = (...items) => viz('<div class="qzv-nodes">' + items.join('') + '</div>' + legend);
const ARROW = '<span class="qzv-arrow" aria-hidden="true">→</span>';
// a split drawn with marbles: parent [a, b] (a = class c0, b = class c1) → children [[branch, a, b], …]
const marbles = (x, y, a, b) => { const t = a + b, sp = Math.min(21, 118 / Math.max(t - 1, 1)), x0 = x - (t - 1) * sp / 2;
  return Array.from({ length: t }, (_, i) => `<circle class="qzv-m c${i < a ? 0 : 1}" cx="${x0 + i * sp}" cy="${y}" r="8"/>`).join(''); };
const splitSvg = (title, parent, kids) => {
  const W = 300, n = kids.length, cx = i => W * (i + 0.5) / n, pw = Math.min((parent[0] + parent[1]) * 21 + 22, 270), kw = W / n - 14;
  let g = kids.map(([br], i) => `<line class="edge" x1="${W / 2}" y1="62" x2="${cx(i)}" y2="138"/><text class="elabel" x="${(W / 2 + cx(i)) / 2}" y="100" text-anchor="middle" dominant-baseline="central">${br}</text>`).join('');
  g += `<g class="nd q"><rect x="${W / 2 - pw / 2}" y="18" width="${pw}" height="44" rx="12"/></g>` + marbles(W / 2, 40, parent[0], parent[1]);
  g += kids.map(([, a, b], i) => `<g class="nd q"><rect x="${cx(i) - kw / 2}" y="138" width="${kw}" height="44" rx="12"/></g>` + marbles(cx(i), 160, a, b)).join('');
  return `<div class="qzv-node qzv-splitcard"><b>${title}</b>` + svg(W, 196, g, 'qzv-mini qzv-split-svg') + '</div>';
};
const legend2 = (a, b) => `<p class="qzv-legend"><span><i class="dt-mb c0"></i> ${a}</span><span><i class="dt-mb c1"></i> ${b}</span></p>`;
// horizontal bars: rows of [label, value, max, shown, cls]
const bars = rows => '<div class="qzv-bars">' + rows.map(([l, v, max, shown, cls]) => l === null ? `<p class="qzv-group">${v}</p>`
  : `<div class="qzv-bar ${cls || ''}"><span>${l}</span><span class="track"><i style="width:${100 * v / max}%"></i></span><b>${shown}</b></div>`).join('') + '</div>';


window.QUIZ = {
  id: 'lab09',
  skills: [
    { id: 'basics', label: 'Trees, leaves and tree growth', href: LAB + '#intro' },
    { id: 'entropy', label: 'Entropy', href: LAB + '#entropy' },
    { id: 'gain', label: 'Information gain and splits', href: LAB + '#gain' },
    { id: 'overfit', label: 'Overfitting and pruning', href: LAB + '#overfit' },
    { id: 'pros', label: 'Advantages and disadvantages', href: LAB + '#summary' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: 'Classification tree or regression tree?', type: 'Task type', level: 'Easy', skill: 'basics',
      parts: [
        { kind: 'rows', pts: 3, q: 'Which kind of tree is appropriate?', options: ['Classification tree', 'Regression tree'],
          rows: [
            { label: '<b>A.</b> Predict spam / not spam.', answer: 0 },
            { label: '<b>B.</b> Predict the price of a flat.', answer: 1 },
            { label: '<b>C.</b> Predict annual electricity consumption.', answer: 1 },
            { label: '<b>D.</b> Predict approved / rejected.', answer: 0 },
          ] },
      ],
      explain: '<p>A and D predict a class → <b>classification tree</b> (a leaf predicts a class). B and C predict a number → <b>regression tree</b> (a leaf predicts a numeric value).</p>',
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'Anatomy of a decision tree', type: 'Reading a tree', level: 'Easy', skill: 'basics',
      intro: WEATHER,
      parts: [
        { kind: 'rows', pts: 4, q: 'What is each part of this tree?', options: ['Root node', 'Internal node', 'Leaf', 'Branch'],
          rows: [
            { label: '<code>Wind?</code>', answer: 1 },
            { label: '<code>Outlook = Sunny</code>', answer: 3 },
            { label: '<code>Outlook?</code>', answer: 0 },
            { label: '<code>Yes</code> under Overcast', answer: 2 },
            { label: '<code>Humidity?</code>', answer: 1 },
          ] },
      ],
      explain: '<p><b>Root</b>: Outlook? (the first question). <b>Internal nodes</b>: Humidity? and Wind? (feature tests). <b>Branch</b>: an outcome of a test, e.g. Outlook = Sunny or Wind = Strong. <b>Leaf</b>: a prediction, Yes or No.</p>',
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Follow the tree', type: 'Reading a tree', level: 'Easy', skill: 'basics',
      intro: '<p>Use the same tree. A day has <b>Outlook = Sunny</b>, <b>Humidity = Normal</b>, <b>Wind = Strong</b>.</p>' + WEATHER,
      parts: [
        { kind: 'mc', pts: 2, q: 'What does the tree predict?', options: ['Yes', 'No'], answer: 0, letters: false },
        { kind: 'mc', pts: 2, q: 'Which feature of this day is never used on its path?', options: ['Outlook', 'Humidity', 'Wind'], answer: 2, letters: false },
      ],
      explain: '<p>Outlook = Sunny → Humidity = Normal → <b>Yes</b>. The value of <b>Wind</b> is never used on this path.</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'What does a leaf predict?', type: 'Concept', level: 'Easy', skill: 'basics',
      parts: [
        { kind: 'mc', pts: 1.5, q: 'In a <b>classification</b> tree, a leaf predicts…', options: ['the mean target value of the examples that reach it', 'another feature question to split the examples on', 'the majority class of the examples that reach it', 'the class of the single closest training example'], answer: 2, inline: false },
        { kind: 'mc', pts: 1.5, q: 'In a <b>regression</b> tree, a leaf predicts…', options: ['the mean target value of the examples that reach it', 'the majority class of the examples that reach it', 'the largest target value seen anywhere in the training set', 'the entropy of the examples that reach the leaf'], answer: 0, inline: false },
      ],
      explain: '<p>A classification leaf predicts the <b>majority class</b> of the training examples reaching it; a regression leaf typically predicts their <b>mean target value</b>.</p>',
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'A node with mixed classes', type: 'Tree growth', level: 'Easy', skill: 'basics',
      intro: '<p>A decision-tree learner is at a node containing mixed classes.</p>',
      parts: [
        { kind: 'mc', pts: 2, q: 'What does it do next?', options: ['Search all possible trees and keep the best one', 'Split on the feature with the most distinct values', 'Pick a random feature and never reconsider it', 'Split on the best feature, then recurse'], answer: 3, inline: false },
      ],
      explain: '<p>Decision-tree construction is <b>top-down, recursive and greedy</b>: the learner chooses the best current split and does not later go back and redesign the upper part of the tree.</p>',
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'When does a branch stop?', type: 'Tree growth', level: 'Medium', skill: 'basics',
      parts: [
        { kind: 'multi', pts: 1, q: 'Which situations stop recursive growth in the basic ID3-style procedure?', options: ['The node is pure: all examples have one class', 'The node still contains examples of both classes', 'No useful features remain to split on', 'The parent node had a high entropy'], answer: [0, 2], inline: false },
        { kind: 'mc', pts: 1, q: 'If no features remain but the node is still mixed, what does it predict?', options: ['Its majority class', 'A random class', 'Nothing: it is removed'], answer: 0, letters: false },
      ],
      explain: '<p>A branch stops when the node is <b>pure</b> or when there are <b>no useful features left</b>; in the second case the node predicts its <b>majority class</b>.</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: '8 Yes, 0 No', type: 'Entropy', level: 'Easy', skill: 'entropy',
      intro: cards(card('Node', 8, 0)),
      parts: [{ kind: 'num', pts: 3, q: 'What is its entropy (in bits)?', prefix: 'H =', answer: 0 }],
      explain: '<p><b>H = 0</b>: the node is completely pure, so there is no uncertainty about the class.</p>',
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: '4 Yes, 4 No', type: 'Entropy', level: 'Easy', skill: 'entropy',
      intro: cards(card('Node', 4, 4)),
      parts: [{ kind: 'num', pts: 3, q: 'What is its entropy (in bits)?', prefix: 'H =', answer: 1 }],
      explain: '<p>For two equally likely classes <b>H = 1 bit</b>. In a two-class problem a pure node has entropy 0 and a 50/50 node has entropy 1: it is maximally impure.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'Which node is more impure?', type: 'Entropy', level: 'Medium', skill: 'entropy',
      intro: cards(card('Node A', 3, 1), card('Node B', 6, 2)),
      parts: [
        { kind: 'mc', pts: 3, q: 'Which has higher entropy?', options: ['Node A', 'Node B', 'Neither: they are equal'], answer: 2, letters: false },
        { kind: 'num', pts: 3, q: M`Compute the entropy of node A, to two decimal places: \(H = -\sum_i p_i \log_2 p_i\).`, prefix: 'H =', answer: -(0.75 * Math.log2(0.75) + 0.25 * Math.log2(0.25)), tol: 0.006, show: '0.81' },
      ],
      explain: M`<p><b>They are equal.</b> Both have 75% Yes and 25% No, and entropy depends on the class <b>proportions</b>, not directly on the number of examples: \(H = -(0.75 \log_2 0.75 + 0.25 \log_2 0.25) \approx 0.311 + 0.5 = 0.81\).</p>`,
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'One more Yes', type: 'Entropy', level: 'Medium', skill: 'entropy',
      intro: '<p>A node starts with 5 Yes and 2 No. Then one more Yes example is added.</p>' + cards(card('Before', 5, 2), ARROW, card('After', 6, 2)),
      parts: [
        { kind: 'mc', pts: 4, q: 'Does the entropy increase or decrease?', options: ['It increases', 'It decreases', 'It stays the same'], answer: 1, letters: false },
      ],
      explain: '<p><b>It decreases</b> (from about 0.86 to 0.81): the class distribution moves farther from 50/50 and closer to a pure node.</p>',
    },
    /* ---------- entropy: ranking ---------- */
    {
      id: 'e1', title: 'Rank four nodes', type: 'Entropy', level: 'Medium', skill: 'entropy',
      intro: cards(card('Node P', 3, 5), card('Node Q', 8, 0), card('Node R', 4, 4), card('Node S', 1, 7)),
      parts: [
        { kind: 'seq', pts: 4, q: 'Order the nodes from the <b>lowest</b> to the <b>highest</b> entropy.', label: 'Lowest → highest', tokens: ['P', 'Q', 'R', 'S'], answer: ['Q', 'S', 'P', 'R'] },
      ],
      explain: M`<p>Q (8/0) is pure: \(H = 0\). S (1/7): \(H \approx 0.54\). P (3/5): \(H \approx 0.95\). R (4/4) is a 50/50 node: \(H = 1\), the maximum for two classes. So <b>Q → S → P → R</b>: the closer a node is to 50/50, the higher its entropy.</p>`,
    },
    /* ---------- entropy: more than two classes ---------- */
    {
      id: 'e2', title: 'Four classes', type: 'Entropy', level: 'Medium', skill: 'entropy',
      intro: M`<p>A node holds <b>4 classes with 3 examples each</b> (12 examples in total). Recall \(H = -\sum_i p_i \log_2 p_i\).</p>` + viz('<div class="qzv-nodes"><div class="qzv-node"><b>Node</b><span class="dt-bag">' + [0, 1, 2, 3].map(c => ('<i class="dt-mb c' + c + '"></i>').repeat(3)).join('') + '</span><span>3 · 3 · 3 · 3</span></div></div>'),
      parts: [
        { kind: 'num', pts: 2, q: 'What is its entropy (in bits)?', prefix: 'H =', answer: 2, tol: 0.01 },
        { kind: 'mc', pts: 2, q: 'Could some node with these 4 classes have an entropy of 2.5 bits?',
          options: ['Yes, if the classes are split very unevenly', 'No: with 4 classes the maximum is 2 bits', 'Yes, if the node holds many more examples', 'No: entropy can never go above 1 bit'], answer: 1, inline: false },
      ],
      explain: M`<p>Each class has \(p = \tfrac14\): \(H = 4 \cdot \tfrac14 \log_2 4 = 2\) bits. With \(k\) classes the maximum is \(\log_2 k\), reached when all classes are equally likely, so 4 classes can never exceed \(\log_2 4 = 2\) bits. (The 1-bit maximum holds only for two classes.)</p>`,
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'Information gain', type: 'Calculation', level: 'Medium', skill: 'gain',
      intro: '<p>A parent node has entropy H(parent) = 1.0. A split produces two equally sized child nodes with entropy 0 and 0.</p>' + viz(svg(460, 215,
        edge(230, 40, 120, 170) + edge(230, 40, 340, 170)
        + `<g class="nd q"><rect x="120" y="12" width="220" height="56" rx="12"/></g>` + [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle class="qzv-m c${i < 4 ? 0 : 1}" cx="${146 + i * 24}" cy="40" r="9"/>`).join('')
        + `<g class="nd q"><rect x="45" y="144" width="150" height="52" rx="12"/></g><g class="nd q"><rect x="265" y="144" width="150" height="52" rx="12"/></g>`
        + [0, 1, 2, 3].map(i => `<circle class="qzv-m c0" cx="${84 + i * 24}" cy="170" r="9"/><circle class="qzv-m c1" cx="${304 + i * 24}" cy="170" r="9"/>`).join('')
        + '<text class="cnt" x="350" y="40" dominant-baseline="central">H = 1.0</text><text class="cnt" x="120" y="208" text-anchor="middle">H = 0</text><text class="cnt" x="340" y="208" text-anchor="middle">H = 0</text>', 'qzv-split-svg') + legend),
      parts: [{ kind: 'num', pts: 4, q: 'What is the information gain?', answer: 1, tol: 0.001, show: '1.0' }],
      explain: M`<p>Weighted child entropy \(= 0.5 \cdot 0 + 0.5 \cdot 0 = 0\), so Gain \(= 1.0 - 0 = 1.0\). This is a perfect split: both children are pure.</p>`,
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'Choose the split', type: 'Selection', level: 'Easy', skill: 'gain',
      intro: '<p>Information gain of each feature at the current node:</p>' + viz(bars([['Feature A', 0.12, 0.5, '0.12'], ['Feature B', 0.42, 0.5, '0.42'], ['Feature C', 0.08, 0.5, '0.08'], ['Feature D', 0.25, 0.5, '0.25']])),
      parts: [{ kind: 'mc', pts: 3, q: 'Which feature does ID3 choose?', options: ['A', 'B', 'C', 'D'], answer: 1, letters: false }],
      explain: '<p><b>Feature B</b>, because it has the largest information gain (0.42).</p>',
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: '90 vs. 10 examples', type: 'Calculation', level: 'Medium', skill: 'gain',
      intro: '<p>A split creates child A with <b>90 examples</b> and entropy 0.5, and child B with <b>10 examples</b> and entropy 1.0.</p>' + viz('<div class="qzv-split"><div class="a" style="flex:90">Child A · 90 examples · H = 0.5</div><div class="b" style="flex:10">B</div></div><p class="qzv-legend">Child B: 10 examples · H = 1.0</p>'),
      parts: [
        { kind: 'num', pts: 3, q: 'What is the weighted child entropy used by information gain?', answer: 0.55, tol: 0.001 },
        { kind: 'mc', pts: 3, q: 'Why not simply average the two child entropies 50/50?', options: ['A plain average would always give a negative gain.', 'Child A holds 90% of the data, so it should count more.', 'Entropy is only defined for nodes with 50 examples.', 'Averaging would make both children look pure.'], answer: 1, inline: false },
      ],
      explain: M`<p>Weighted: \(0.9 \cdot 0.5 + 0.1 \cdot 1.0 = 0.55\) (a plain 50/50 average would give 0.75). A child containing 90% of the data should contribute more to the post-split impurity than one containing 10%, so information gain uses a <b>weighted average</b>.</p>`,
    },
    /* ---------- gain: a useless split ---------- */
    {
      id: 'g2', title: 'A split that changes nothing?', type: 'Information gain', level: 'Medium', skill: 'gain',
      intro: '<p>A parent node with 4 Yes and 4 No is split into two children, each with 2 Yes and 2 No.</p>' + viz('<div class="qzv-nodes">' + splitSvg('Split on feature F', [4, 4], [['F = a', 2, 2], ['F = b', 2, 2]]) + '</div>' + legend),
      parts: [
        { kind: 'num', pts: 2, q: 'What is the information gain of this split?', answer: 0, tol: 0.001 },
        { kind: 'mc', pts: 1, q: 'Is it a useful split?', options: ['Yes: every split makes the children purer.', 'No: each child is as mixed as the parent.', 'Yes: it halves the number of examples.'], answer: 1, inline: false },
      ],
      explain: '<p>Parent: H = 1. Each child is still 50/50, so H = 1 for both and the weighted child entropy is 1. Gain = 1 − 1 = <b>0</b>: the split separates nothing, and ID3 would never choose it over a feature with positive gain.</p>',
    },
    /* ---------- gain: full calculation ---------- */
    {
      id: 'g1', title: 'Spam: link or known sender?', type: 'Information gain', level: 'Hard', skill: 'gain',
      intro: M`<p>8 emails, 4 spam and 4 ham, so \(H(\text{parent}) = 1\). Two candidate splits:</p>`
        + viz('<div class="qzv-nodes">' + splitSvg('Contains a link?', [4, 4], [['yes', 1, 3], ['no', 3, 1]]) + splitSvg('Known sender?', [4, 4], [['yes', 3, 0], ['no', 1, 4]]) + '</div>' + legend2('Ham', 'Spam'))
        + M`<p class="qzv-hint">Useful values: \(\log_2 0.75 \approx -0.415\), \(\log_2 0.25 = -2\), \(\log_2 0.8 \approx -0.322\), \(\log_2 0.2 \approx -2.322\).</p>`,
      parts: [
        { kind: 'num', pts: 2, q: 'Entropy of the child <b>Link = yes</b> (1 ham, 3 spam), to two decimals', prefix: 'H =', answer: -(0.25 * Math.log2(0.25) + 0.75 * Math.log2(0.75)), tol: 0.006, show: '0.81' },
        { kind: 'num', pts: 2, q: 'Gain(Link), to two decimals', answer: 1 - (-(0.25 * Math.log2(0.25) + 0.75 * Math.log2(0.75))), tol: 0.006, show: '1 − 0.811 = 0.19' },
        { kind: 'num', pts: 2, q: 'Gain(Known sender), to two decimals', answer: 1 - 5 / 8 * -(0.2 * Math.log2(0.2) + 0.8 * Math.log2(0.8)), tol: 0.006, show: '1 − 5/8 · 0.722 = 0.55' },
        { kind: 'mc', pts: 2, q: 'Which feature does ID3 split on?', options: ['Contains a link?', 'Known sender?'], answer: 1, letters: false },
      ],
      explain: M`<p><b>Link</b>: both children are 1 : 3, so each has \(H = 0.25 \cdot 2 + 0.75 \cdot 0.415 \approx 0.811\); weighted \(= 0.811\), Gain \(= 1 - 0.811 \approx 0.19\).</p><p><b>Known sender</b>: “yes” holds 3 ham and no spam, so \(H = 0\); “no” holds 1 ham and 4 spam, \(H = 0.2 \cdot 2.322 + 0.8 \cdot 0.322 \approx 0.722\). Weighted \(= \tfrac38 \cdot 0 + \tfrac58 \cdot 0.722 \approx 0.451\), Gain \(\approx 0.55\).</p><p>ID3 splits on <b>Known sender</b>. Its split is uneven, but one child is completely pure, which removes much more uncertainty than two equally mixed children.</p>`,
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'A StudentID feature', type: 'Split quality', level: 'Hard', skill: 'gain',
      intro: '<p>The dataset has an ID-like feature, <code>StudentID</code>: every training example has a unique value, so splitting on it creates one pure child per example.</p>' + viz(svg(460, 180,
        [40, 116, 192, 268, 344, 420].map((x, i) => edge(230, 30, x, 150, 'S' + (i + 1), 0.72)).join('') + q(230, 30, 124, 'StudentID?')
        + [40, 116, 192, 268, 344, 420].map((x, i) => leaf(x, 150, [1, 0, 1, 1, 0, 1][i])).join(''), 'qzv-tree')),
      parts: [
        { kind: 'mc', pts: 2, q: 'Why can information gain strongly prefer this useless feature?',
          options: ['IDs are numeric, and gain favours numeric features.', 'Every child is pure, so the gain is the maximum possible.', 'IDs are always sorted, which lowers the entropy.', 'Unique values make the parent entropy zero.'], answer: 1, inline: false },
        { kind: 'mc', pts: 2, q: 'What is a sensible response?', options: ['Split on StudentID first, then prune the tree.', 'Scale StudentID to [0, 1] before splitting.', 'Increase the maximum depth of the tree.', 'Drop ID-like features, or use gain ratio.'], answer: 3, inline: false },
      ],
      explain: '<p>Every child becomes pure, giving extremely high information gain, but the split just memorizes the training set and gives no reusable rule for unseen examples. Information gain is <b>biased toward features with many distinct values</b>; drop ID-like features or use <b>gain ratio</b>.</p>',
    },
    /* ---------- 15 ---------- */
    {
      id: 't15', title: 'Numeric thresholds', type: 'Split candidates', level: 'Medium', skill: 'gain',
      intro: '<p>A numeric feature has the sorted values <b>2, 5, 8, 12</b>. Candidate thresholds are tested at the midpoints between neighbouring values.</p>' + viz(svg(460, 90,
        '<line class="edge" x1="30" y1="55" x2="430" y2="55"/>' + Array.from({ length: 15 }, (_, v) => `<line class="edge" x1="${30 + v * 400 / 14}" y1="${v % 2 ? 51 : 48}" x2="${30 + v * 400 / 14}" y2="${v % 2 ? 59 : 62}"/>` + (v % 2 ? '' : `<text class="cnt" x="${30 + v * 400 / 14}" y="78" text-anchor="middle">${v}</text>`)).join('')
        + [2, 5, 8, 12].map((v, i) => `<circle class="qzv-m v" cx="${30 + v * 400 / 14}" cy="55" r="10"/><text class="t" x="${30 + v * 400 / 14}" y="26" text-anchor="middle">${v}</text>`).join(''), 'qzv-line')),
      parts: [
        { kind: 'multi', pts: 4, q: 'Which values are midpoint threshold candidates?', options: ['3.5', '5', '6.5', '7', '10', '12'], answer: [0, 2, 4], letters: false },
      ],
      explain: '<p>Between 2 and 5 → 3.5; between 5 and 8 → 6.5; between 8 and 12 → 10. The algorithm keeps the threshold with the largest gain.</p>',
    },
    /* ---------- 16 ---------- */
    {
      id: 't16', title: '100% train, 72% test', type: 'Diagnosis', level: 'Medium', skill: 'overfit',
      intro: '<p>A decision tree is very deep and has many leaves containing only a few examples.</p>' + viz(bars([['Training', 100, 100, '100%'], ['Test', 72, 100, '72%', 'val']])),
      parts: [
        { kind: 'mc', pts: 2, q: 'What is the likely problem?', options: ['Underfitting', 'Data leakage', 'Overfitting', 'Too few features'], answer: 2 },
        { kind: 'mc', pts: 2, q: 'Which is it associated with?', options: ['High bias', 'High variance'], answer: 1, letters: false },
      ],
      explain: '<p><b>Overfitting</b>: the tree has enough complexity to memorize noise and peculiarities of the training set (very deep tree, small leaves, excellent training performance, much worse test performance). It is associated with <b>high variance</b>.</p>',
    },
    /* ---------- 17 ---------- */
    {
      id: 't17', title: 'Shallow vs. deep trees', type: 'Matching', level: 'Medium', skill: 'overfit',
      intro: viz('<div class="qzv-nodes">' + [
        ['Shallow tree', [[110, 45, [[60, 125], [160, 125]]]]],
        ['Deep tree', [[110, 18, [[55, 52], [165, 52]]], [55, 52, [[28, 88], [82, 88]]], [165, 52, [[138, 88], [192, 88]]], [28, 88, [[14, 124], [44, 124]]], [82, 88, [[68, 124], [98, 124]]],
          [138, 88, [[124, 124], [154, 124]]], [44, 124, [[34, 160], [56, 160]]], [98, 124, [[88, 160], [110, 160]]], [154, 124, [[144, 160], [166, 160]]]]],
      ].map(([name, inner]) => {
        const kids = new Set(inner.map(([x, y]) => x + ',' + y));
        let lines = '', dots = '', k = 0;
        inner.forEach(([x, y, ch]) => { ch.forEach(([cx, cy]) => { lines += `<line class="edge" x1="${x}" y1="${y}" x2="${cx}" y2="${cy}"/>`; if (!kids.has(cx + ',' + cy)) dots += `<circle class="qzv-m c${k++ % 2}" cx="${cx}" cy="${cy}" r="7"/>`; }); dots += `<circle class="qzv-m q" cx="${x}" cy="${y}" r="7"/>`; });
        return `<div class="qzv-node"><b>${name}</b>` + svg(220, 175, lines + dots, 'qzv-mini') + '</div>';
      }).join('') + '</div>'),
      parts: [
        { kind: 'rows', pts: 4, q: 'Which tree typically has…', options: ['Shallow tree', 'Deep tree'],
          rows: [
            { label: 'higher bias', answer: 0 },
            { label: 'higher variance', answer: 1 },
            { label: 'greater risk of overfitting', answer: 1 },
            { label: 'lower training error', answer: 1 },
            { label: 'greater risk of underfitting', answer: 0 },
          ] },
      ],
      explain: '<p>Shallow tree: higher bias, lower variance, greater risk of underfitting. Deep tree: lower training error, higher variance, greater risk of overfitting. Tree depth is a major <b>complexity knob</b>.</p>',
    },
    /* ---------- 18 ---------- */
    {
      id: 't18', title: 'Pre-pruning or post-pruning?', type: 'Matching', level: 'Medium', skill: 'overfit',
      parts: [
        { kind: 'rows', pts: 4, q: 'Classify each technique.', options: ['Pre-pruning', 'Post-pruning'],
          rows: [
            { label: '<b>A.</b> Set <code>max_depth = 5</code>.', answer: 0 },
            { label: '<b>B.</b> Grow a large tree, then replace weak subtrees by leaves.', answer: 1 },
            { label: '<b>C.</b> Require a minimum number of examples per leaf.', answer: 0 },
            { label: '<b>D.</b> Stop splitting if the information gain is below a threshold.', answer: 0 },
          ] },
      ],
      explain: '<p>A, C and D stop growth early → <b>pre-pruning</b>. B grows a larger tree and then removes weak subtrees → <b>post-pruning</b>.</p>',
    },
    /* ---------- 19 ---------- */
    {
      id: 't19', title: 'As shallow as possible?', type: 'Trade-off', level: 'Hard', skill: 'overfit',
      intro: '<blockquote class="qz-quote">“If limiting tree depth reduces overfitting, then making the maximum depth as small as possible must always be better.”</blockquote>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Is the reasoning correct?',
          options: ['Yes: a shallower tree always generalizes better.', 'Yes, as long as the tree has at least one split.', 'No: too shallow a tree underfits.', 'No: depth has no effect on overfitting at all.'], answer: 2, inline: false },
      ],
      explain: '<p><b>No.</b> Too much pruning makes the tree too simple, and then it <b>underfits</b>. Too deep → overfitting / high variance; too shallow → underfitting / high bias. Choose the pruning strength with validation data or cross-validation.</p>',
    },
    /* ---------- 20 ---------- */
    {
      id: 't20', title: 'Advantages and disadvantages', type: 'Pros and cons', level: 'Medium', skill: 'pros',
      parts: [
        { kind: 'rows', pts: 6, q: 'Classify each statement.', options: ['Advantage', 'Disadvantage'],
          rows: [
            { label: '<b>A.</b> Readable as if-then rules.', answer: 0 },
            { label: '<b>B.</b> A small change in the training data may produce a very different tree.', answer: 1 },
            { label: '<b>C.</b> No feature scaling is usually required.', answer: 0 },
            { label: '<b>D.</b> Greedy splitting does not guarantee the globally best possible tree.', answer: 1 },
            { label: '<b>E.</b> Can model non-linear feature interactions.', answer: 0 },
            { label: '<b>F.</b> Prediction is fast, because only one root-to-leaf path is followed.', answer: 0 },
          ] },
      ],
      explain: '<p>Advantages: A (readable rules), C (no scaling), E (non-linear interactions), F (fast prediction). Disadvantages: B (instability / high variance) and D (greedy construction).</p>',
    },
    /* ---------- 21 ---------- */
    {
      id: 't21', title: 'Depth 3 vs. depth 20', type: 'Trade-off', level: 'Hard', skill: 'overfit',
      intro: viz(bars([[null, 'Model A · max depth 3'], ['Training', 83, 100, '83%'], ['Validation', 81, 100, '81%', 'val'], [null, 'Model B · max depth 20'], ['Training', 100, 100, '100%'], ['Validation', 70, 100, '70%', 'val']])),
      parts: [
        { kind: 'mc', pts: 2, q: 'Which tree shows stronger evidence of overfitting?', options: ['Model A', 'Model B'], answer: 1, letters: false },
        { kind: 'mc', pts: 2, q: 'Which model would you rather deploy?', options: ['Model A', 'Model B'], answer: 0, letters: false },
      ],
      explain: '<p><b>Model B</b> overfits: perfect training performance but much worse validation performance — the deep tree is likely fitting noise. <b>Model A</b> has a much smaller training–validation gap and the better validation accuracy, so it is the one to deploy.</p>',
    },
  ],
};
