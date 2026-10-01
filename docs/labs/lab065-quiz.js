/* ===== Lab 6.5 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab065-linear-logistic.html';
/* ---------- small static visuals ---------- */
const viz = (html, cls = '') => `<div class="qzv ${cls}">${html}</div>`;
const lbl = (x, y, t, a = 'start', cls = 'pl') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${a}" dominant-baseline="central">${t}</text>`;
const stat = (l, v) => `<div class="qzv-node qzv-stat"><b>${l}</b><span>${v}</span></div>`;
const cards = (...items) => viz('<div class="qzv-nodes">' + items.join('') + '</div>');
const bars = rows => '<div class="qzv-bars">' + rows.map(([l, v, max, shown, cls]) => `<div class="qzv-bar ${cls || ''}"><span>${l}</span><span class="track"><i style="width:${100 * v / max}%"></i></span><b>${shown}</b></div>`).join('') + '</div>';
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
const R0 = rng(65), noise = s => (R0() + R0() + R0() - 1.5) * s;
// a scatter card in [0, 1]² coordinates: pts = [[x, y, k]] (k: 0 blue, 1 red, null grey), extra(X, Y) adds lines
const scatter = (title, pts, { xl = 'x', yl = 'y', extra = () => '', w = 220, h = 170 } = {}) => {
  const X = v => +(14 + v * (w - 28)).toFixed(1), Y = v => +(h - 16 - v * (h - 32)).toFixed(1);
  let g = `<rect class="km-frame" x="1" y="1" width="${w - 2}" height="${h - 2}" rx="8"/>` + extra(X, Y);
  g += pts.map(([x, y, k]) => `<circle class="kp ${k == null ? 'kgrey' : 'k' + k}" cx="${X(x)}" cy="${Y(y)}" r="5"/>`).join('');
  g += lbl(w - 8, h - 8, xl, 'end', 'tk sm') + lbl(8, 12, yl, 'start', 'tk sm');
  return `<div class="qzv-node"><b>${title}</b><svg class="ml-plot qzv-plot qzv-mini qzv-sc" viewBox="0 0 ${w} ${h}" role="img">${g}</svg></div>`;
};
const line = (X, Y, x1, y1, x2, y2, cls = 'fitl') => `<line class="${cls}" x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}"/>`;
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i / (n - 1), i));
const DATA = {
  salary: range(12, t => [0.06 + 0.88 * t, 0.12 + 0.72 * t + noise(0.08), null]),
  linear: range(12, t => [0.06 + 0.88 * t, 0.15 + 0.68 * t + noise(0.07), null]),
  ushape: range(13, t => [0.05 + 0.9 * t, 0.12 + 3.1 * (t - 0.5) ** 2 + noise(0.05), null]),
  curve: range(13, t => [0.05 + 0.9 * t, 0.08 + 0.85 * t ** 2.6 + noise(0.03), null]),
};
const sig = z => 1 / (1 + Math.exp(-z));

window.QUIZ = {
  id: 'lab065',
  skills: [
    { id: 'lin', label: 'Linear regression: reading the model', href: LAB + '#linear' },
    { id: 'fit', label: 'When a straight line fits', href: LAB + '#linear' },
    { id: 'log', label: 'Logistic regression: probabilities and thresholds', href: LAB + '#logistic' },
    { id: 'cls', label: 'Decision boundaries and multiple classes', href: LAB + '#multiclass' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: 'Four prediction tasks', type: 'Model type', level: 'Easy', skill: 'lin',
      parts: [
        { kind: 'rows', pts: 6, q: 'Which model fits each task?', options: ['Linear regression', 'Logistic regression'],
          rows: [
            { label: '<b>A.</b> Predict an apartment’s price.', answer: 0 },
            { label: '<b>B.</b> Predict whether a customer will churn.', answer: 1 },
            { label: '<b>C.</b> Predict spam / not spam.', answer: 1 },
            { label: '<b>D.</b> Predict an exam score from study hours.', answer: 0 },
          ] },
      ],
      explain: '<p>A and D predict a <b>number</b> (a continuous value) → linear regression. B and C predict a <b>class</b> → logistic regression, which, despite its name, is a classifier.</p>',
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'score = 40 + 5 × hours', type: 'Coefficients', level: 'Easy', skill: 'lin',
      intro: M`<p>The lab's example: a fitted model predicts an exam score from study hours,</p><div class="math-block">\[ \hat{y} = 40 + 5x \]</div>`,
      parts: [
        { kind: 'rows', pts: 4, q: 'What does each number represent?', options: ['Predicted score at 0 hours', 'Points gained per extra hour', 'The average error of the model'],
          rows: [
            { label: '5', answer: 1 },
            { label: '40', answer: 0 },
          ] },
        { kind: 'num', pts: 4, q: 'What score does the model predict for a student who studies 6 hours?', answer: 70 },
      ],
      explain: '<p><b>40</b> is the intercept: the predicted score when study_hours = 0. <b>5</b> is the slope: each extra study hour raises the predicted score by 5 points. For 6 hours: 40 + 5 · 6 = <b>70</b>.</p>',
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Salary and experience', type: 'Slope', level: 'Easy', skill: 'lin',
      intro: cards(scatter('Data', DATA.salary, { xl: 'years of experience', yl: 'salary' })),
      parts: [
        { kind: 'mc', pts: 5, q: 'Which slope sign is most plausible for a line fitted to this data?', options: ['Negative', 'Exactly zero', 'Positive', 'Cannot be estimated'], answer: 2 },
      ],
      explain: '<p><b>Positive</b>: salary tends to rise with experience, so the fitted line goes up from left to right.</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'Actual 80, predicted 74', type: 'Residuals', level: 'Easy', skill: 'lin',
      intro: cards(stat('actual value', '80'), stat('predicted value', '74')) + M`<p>The residual is \(y - \hat{y}\) (actual − predicted).</p>`,
      parts: [
        { kind: 'num', pts: 3, q: 'What is the residual?', answer: 6 },
        { kind: 'mc', pts: 3, q: 'What does it tell us?', options: ['The model under-predicted this example', 'The model over-predicted this example', 'The model is wrong on average', 'The point is an outlier'], answer: 0, inline: false },
      ],
      explain: '<p>Residual = 80 − 74 = <b>6</b>: positive, so the prediction was too low; the model <b>under-predicted</b> this example by 6. (One residual says nothing about the average error.)</p>',
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'Two scatter plots', type: 'Linearity', level: 'Easy', skill: 'fit',
      intro: cards(scatter('Dataset A', DATA.linear), scatter('Dataset B', DATA.ushape)),
      parts: [
        { kind: 'mc', pts: 5, q: 'Which dataset is more naturally suited to simple linear regression?', options: ['Dataset A', 'Dataset B', 'Both equally', 'Neither'], answer: 0, letters: false },
      ],
      explain: '<p><b>Dataset A</b> shows an approximately linear trend. Dataset B is U-shaped: a straight line would miss it completely (its best line is almost flat).</p>',
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'House price and size', type: 'Limitations', level: 'Medium', skill: 'fit',
      intro: '<p>A model predicts house price with a straight line in house size, but the real relationship is strongly curved.</p>'
        + cards(scatter('Data and the fitted line', DATA.curve, { xl: 'size', yl: 'price', extra: (X, Y) => line(X, Y, 0.126, 0, 1, 0.77) })),
      parts: [
        { kind: 'mc', pts: 5, q: 'What is the main problem?', options: ['The model automatically becomes nonlinear', 'Linear regression turns into clustering', 'The target stops being a numeric value', 'It may underfit the curved pattern'], answer: 3, inline: false },
      ],
      explain: '<p>A straight line cannot follow the curve: it <b>underfits</b>, over-predicting in the middle and under-predicting at both ends. Remedies: transform the features (e.g. add size²) or use a more flexible model.</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'R² = 0.82 vs. R² = 0.35', type: 'Evaluation', level: 'Medium', skill: 'lin',
      intro: '<p>Two models on the same regression task:</p>' + viz(bars([['Model A', 0.82, 1, 'R² = 0.82'], ['Model B', 0.35, 1, 'R² = 0.35', 'val']]), 'qzv-wide'),
      parts: [
        { kind: 'mc', pts: 3, q: 'Which model explains more of the variation in the target?', options: ['Model A', 'Model B', 'Neither: R² cannot compare models'], answer: 0, letters: false, inline: false },
        { kind: 'num', pts: 4, q: M`\(R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}\). A third model has squared-error sum 18, and the targets' total sum of squares around their mean is 100. What is its \(R^2\)?`, answer: 0.82, tol: 0.001 },
      ],
      explain: M`<p><b>Model A</b>: a larger \(R^2\) means more of the target variation is explained. \(R^2 = 1 - \frac{18}{100} = 0.82\). \(R^2 = 1\) is a perfect fit, \(R^2 = 0\) is no better than always predicting the mean.</p>`,
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'Approve the loan?', type: 'Why logistic', level: 'Medium', skill: 'log',
      intro: '<p>The target is <b>approve loan?</b> (0 = No, 1 = Yes). A linear regression model trained on the 0/1 labels predicts <b>1.23</b> for one applicant.</p>'
        + cards(scatter('Linear regression on 0/1 labels', range(14, (t, i) => [0.05 + 0.9 * t, i < 7 ? 0.18 : 0.72, i < 7 ? 1 : 0]), { xl: 'income', yl: 'label', extra: (X, Y) => `<line class="gl" x1="${X(0)}" y1="${Y(0.72)}" x2="${X(1)}" y2="${Y(0.72)}" stroke-dasharray="4 4"/>` + lbl(X(0.02), Y(0.72) - 9, '1', 'start', 'tk sm') + lbl(X(0.02), Y(0.18) + 10, '0', 'start', 'tk sm') + line(X, Y, 0, 0.02, 1, 0.98) })),
      parts: [
        { kind: 'mc', pts: 7, q: 'What is the problem?', options: ['A prediction above 1 means the data is corrupted', 'Linear regression cannot be trained on 0/1 labels', 'Its output is not restricted to [0, 1]', 'The applicant must be approved with certainty'], answer: 2, inline: false },
      ],
      explain: '<p>A class probability should lie in <b>[0, 1]</b>, but ordinary linear regression is not restricted to that interval (1.23 is not a probability). Logistic regression passes the linear score through the sigmoid, so its output always is.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'An S-shaped curve', type: 'Sigmoid', level: 'Medium', skill: 'log',
      intro: viz(`<svg class="ml-plot qzv-plot" viewBox="0 0 420 240" role="img"><rect class="km-frame" x="44" y="14" width="358" height="190"/>`
        + [0, 0.5, 1].map(v => `<line class="gl" x1="44" y1="${204 - v * 190}" x2="402" y2="${204 - v * 190}"/>` + lbl(36, 204 - v * 190, v, 'end', 'tk')).join('')
        + [-6, -3, 0, 3, 6].map(v => lbl(223 + v * 28, 222, v, 'middle', 'tk')).join('')
        + `<polyline class="crv" points="${Array.from({ length: 121 }, (_, i) => { const z = -6.4 + i * 12.8 / 120; return (223 + z * 28).toFixed(1) + ',' + (204 - sig(z) * 190).toFixed(1); }).join(' ')}"/>`
        + lbl(398, 190, 'linear score z', 'end', 'tk') + lbl(52, 28, 'probability', 'start', 'tk') + '</svg>'),
      parts: [
        { kind: 'mc', pts: 3, q: 'What is the main purpose of the sigmoid in logistic regression?', options: ['Sort the training examples by score', 'Map a linear score to a probability', 'Remove all of the outliers from data', 'Create new features automatically'], answer: 1, inline: false },
        { kind: 'num', pts: 5, q: M`The lab's widget starts at the linear score \(z = 1.5\). What is \(\sigma(1.5) = \frac{1}{1 + e^{-1.5}}\)? (two decimals)`, answer: sig(1.5), tol: 0.006, show: '0.82' },
      ],
      explain: M`<p>The sigmoid maps any linear score \(z \in (-\infty, \infty)\) to a probability in \((0, 1)\): \(\sigma(0) = 0.5\), and \(\sigma(1.5) = \frac{1}{1 + e^{-1.5}} \approx 0.82\), so this example is predicted as class 1.</p>`,
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'P(class 1) = 0.78', type: 'Thresholds', level: 'Easy', skill: 'log',
      intro: cards(stat('P(class 1)', '0.78'), stat('threshold', '0.50')),
      parts: [
        { kind: 'mc', pts: 5, q: 'Which class is predicted?', options: ['Class 0', 'Class 1', 'Neither: 0.78 is not certain'], answer: 1, letters: false, inline: false },
      ],
      explain: '<p>0.78 ≥ 0.50, so the model predicts <b>class 1</b>. The probability itself (0.78) is a separate piece of information: how confident the model is.</p>',
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'The same 0.62, three thresholds', type: 'Thresholds', level: 'Medium', skill: 'log',
      intro: cards(stat('P(class 1)', '0.62')),
      parts: [
        { kind: 'rows', pts: 6, q: 'Which class is predicted with each threshold?', options: ['Class 0', 'Class 1'],
          rows: [
            { label: 'threshold 0.70', answer: 0 },
            { label: 'threshold 0.50', answer: 1 },
            { label: 'threshold 0.60', answer: 1 },
          ] },
        { kind: 'mc', pts: 2, q: 'When the threshold moves from 0.50 to 0.70, what changes?', options: ['The probability 0.62', 'Only the decision rule', 'The model’s weights'], answer: 1, inline: false },
      ],
      explain: '<p>0.62 ≥ 0.50 and ≥ 0.60 → class 1; 0.62 &lt; 0.70 → <b>class 0</b>. The probability stays the same; only the decision rule changes.</p>',
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'Two classes in the plane', type: 'Decision boundary', level: 'Easy', skill: 'cls',
      intro: cards(scatter('Data and the boundary', [[0.3, 0.8, 0], [0.45, 0.85, 0], [0.6, 0.8, 0], [0.25, 0.68, 0], [0.42, 0.7, 0], [0.58, 0.66, 0], [0.75, 0.75, 0],
        [0.15, 0.32, 1], [0.3, 0.25, 1], [0.45, 0.3, 1], [0.1, 0.15, 1], [0.27, 0.12, 1], [0.6, 0.35, 1], [0.8, 0.28, 1]], { xl: 'x₁', yl: 'x₂', extra: (X, Y) => line(X, Y, 0, 0.5, 1, 0.5, 'sep') })),
      parts: [
        { kind: 'mc', pts: 6, q: 'What kind of decision boundary does basic logistic regression produce?', options: ['Circular only', 'Arbitrarily curved', 'Random', 'Linear'], answer: 3 },
      ],
      explain: M`<p><b>Linear</b>: the model predicts class 1 when \(p \ge 0.5\), i.e. when the linear score \(w_0 + w_1 x_1 + w_2 x_2 \ge 0\): one side of a straight line (a hyperplane in more dimensions).</p>`,
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: 'Separated rows vs. a checkerboard', type: 'Decision boundary', level: 'Medium', skill: 'cls',
      intro: cards(scatter('Dataset A', [0.15, 0.38, 0.62, 0.85].flatMap(x => [[x, 0.78, 0], [x, 0.24, 1]])), scatter('Dataset B', [0.2, 0.5, 0.8].flatMap((x, i) => [0.2, 0.5, 0.8].map((y, j) => [x, y, (i + j) % 2])))),
      parts: [
        { kind: 'mc', pts: 6, q: 'Which dataset is more naturally suited to basic logistic regression?', options: ['Dataset A', 'Dataset B', 'Both equally', 'Neither'], answer: 0, letters: false },
      ],
      explain: '<p><b>Dataset A</b> can be separated by a single straight line. Dataset B is a checkerboard (like XOR): no line separates it, so basic logistic regression fails unless features are engineered.</p>',
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'Apple, banana or orange?', type: 'Multiclass', level: 'Medium', skill: 'cls',
      intro: M`<p>The lab's fruit example: for one fruit the model computes the logits</p>` + cards(stat('z apple', '1.2'), stat('z banana', '0.3'), stat('z orange', '2.1')),
      parts: [
        { kind: 'multi', pts: 4, q: 'Which approaches extend logistic regression to three classes?', options: ['One-vs-Rest', 'Softmax (multinomial) regression', 'One single sigmoid unit', 'Linear regression on 1 / 2 / 3'], answer: [0, 1], letters: false },
        { kind: 'num', pts: 6, q: M`With softmax, \(P(k) = \frac{e^{z_k}}{\sum_j e^{z_j}}\), what is \(P(\text{orange})\)? (two decimals)`, answer: Math.exp(2.1) / (Math.exp(1.2) + Math.exp(0.3) + Math.exp(2.1)), tol: 0.006, show: '0.64' },
      ],
      explain: M`<p><b>One-vs-Rest</b> trains one binary model per class and picks the most probable; <b>softmax</b> computes all class probabilities at once. \(P(\text{orange}) = \frac{e^{2.1}}{e^{1.2} + e^{0.3} + e^{2.1}} \approx \frac{8.17}{3.32 + 1.35 + 8.17} \approx 0.64\), so the prediction is orange.</p>`,
    },
    /* ---------- 15 ---------- */
    {
      id: 't15', title: 'Linear vs. logistic regression', type: 'Comparison', level: 'Medium', skill: 'fit',
      parts: [
        { kind: 'rows', pts: 8, q: 'Which model does each statement describe?', options: ['Linear', 'Logistic', 'Both'],
          rows: [
            { label: 'Predicts a class probability.', answer: 1 },
            { label: 'The basic model is interpretable.', answer: 2 },
            { label: 'Predicts a continuous value.', answer: 0 },
            { label: 'Struggles with strong nonlinearity unless features are engineered.', answer: 2 },
            { label: 'A typical output is a spam probability.', answer: 1 },
            { label: 'A typical output is a price.', answer: 0 },
          ] },
      ],
      explain: '<p>Linear regression predicts a continuous value (a price); logistic regression a class probability (spam). <b>Both</b> are simple, fast and interpretable, and both have limited flexibility unless features are engineered.</p>',
    },
  ],
};
