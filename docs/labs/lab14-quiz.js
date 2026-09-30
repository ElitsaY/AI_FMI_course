/* ===== Lab 14 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab14-evaluation.html';
/* ---------- small static visuals ---------- */
const viz = (html, cls = '') => `<div class="qzv ${cls}">${html}</div>`;
const lbl = (x, y, t, a = 'start', cls = 'pl') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${a}" dominant-baseline="central">${t}</text>`;
const stat = (l, v) => `<div class="qzv-node qzv-stat"><b>${l}</b><span>${v}</span></div>`;
const cards = (...items) => viz('<div class="qzv-nodes">' + items.join('') + '</div>');
const card = (h, p, cls = '') => `<div class="al-card ${cls}"><h5>${h}</h5><p>${p}</p></div>`;
const stack = (...cs) => viz('<div class="al-stack">' + cs.join('') + '</div>');
// bars: rows of [label, value, max, shown, cls]; [null, title] starts a group
const bars = rows => '<div class="qzv-bars">' + rows.map(([l, v, max, shown, cls]) => l === null ? `<p class="qzv-group">${v}</p>`
  : `<div class="qzv-bar ${cls || ''}"><span>${l}</span><span class="track"><i style="width:${Math.max(0, 100 * v / max)}%"></i></span><b>${shown}</b></div>`).join('') + '</div>';
// a small table: head = [..], rows = [[..], ..]; the first column is a row label
const table = (head, rows, cls = '') => viz(`<table class="qz-pq qz-num-t ${cls}"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`
  + rows.map(r => '<tr>' + r.map((c, i) => i ? `<td>${c}</td>` : `<th>${c}</th>`).join('') + '</tr>').join('') + '</tbody></table>', 'qzv-table');
// a 2 × 2 matrix with row / column titles
const matrix = (rowT, colT, rows, cols, vals) => viz(`<table class="qz-pq qz-cm"><thead><tr><th></th>${cols.map(c => `<th>${colT} ${c}</th>`).join('')}</tr></thead><tbody>`
  + rows.map((r, i) => `<tr><th>${rowT} ${r}</th>${vals[i].map((v, j) => `<td class="${i === j ? 'diag' : 'off'}">${v}</td>`).join('')}</tr>`).join('') + '</tbody></table>', 'qzv-table');
// a line plot with several series: series = [{pts: [[x, y]], cls, name, dash}]
const lines = ({ x: [x0, x1], y: [y0, y1], xt, yt, xl, yl, w = 420, h = 270 }, series, extra = () => '') => {
  const L = 48, R = 18, T = 18, B = 42, X = v => +(L + (v - x0) / (x1 - x0) * (w - L - R)).toFixed(1), Y = v => +(h - B - (v - y0) / (y1 - y0) * (h - T - B)).toFixed(1);
  let g = `<rect class="km-frame" x="${L}" y="${T}" width="${w - L - R}" height="${h - T - B}"/>`;
  yt.forEach(v => { g += `<line class="gl" x1="${L}" y1="${Y(v)}" x2="${w - R}" y2="${Y(v)}"/>` + lbl(L - 8, Y(v), v, 'end', 'tk'); });
  xt.forEach(v => { g += `<line class="gl" x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${h - B}"/>` + lbl(X(v), h - B + 18, v, 'middle', 'tk'); });
  if (xl) g += lbl((L + w - R) / 2, h - 8, xl, 'middle', 'tk');
  if (yl) g += lbl(L + 6, T + 12, yl, 'start', 'tk');
  g += extra(X, Y);
  series.forEach(s => { g += `<polyline class="ln ${s.cls}" points="${s.pts.map(([a, b]) => X(a) + ',' + Y(b)).join(' ')}"/>` + s.pts.map(([a, b]) => `<circle class="ld ${s.cls}" cx="${X(a)}" cy="${Y(b)}" r="5"/>`).join(''); });
  return `<svg class="ml-plot qzv-plot" viewBox="0 0 ${w} ${h}" role="img">${g}</svg><p class="qzv-legend">${series.map(s => `<span><i class="lg ${s.cls}"></i> ${s.name}</span>`).join('')}</p>`;
};
const pct = x => Math.round(x * 1000) / 10;

window.QUIZ = {
  id: 'lab14',
  skills: [
    { id: 'cls', label: 'Classification metrics, thresholds and costs', href: LAB + '#classification' },
    { id: 'text', label: 'Text metrics and evaluators', href: LAB + '#text' },
    { id: 'curves', label: 'Curves, subgroups and distribution shift', href: LAB + '#curves' },
    { id: 'data', label: 'Leakage, cleaning and confounds', href: LAB + '#leakage' },
    { id: 'stats', label: 'Uncertainty, agreement and reporting', href: LAB + '#uncertainty' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: 'A fraud detector on 1,000 transactions', type: 'Confusion matrix', level: 'Easy', skill: 'cls',
      intro: '<p>The positive class is <b>fraud</b>.</p>' + matrix('Actual', 'Pred.', ['fraud', 'legit.'], ['fraud', 'legit.'], [[72, 28], [18, 882]]),
      parts: [
        { kind: 'num', pts: 1, q: 'Accuracy', answer: 0.954, tol: 0.0006, pct: true, show: '95.4%' },
        { kind: 'num', pts: 1, q: 'Precision', answer: 0.8, tol: 0.001, pct: true, show: '80%' },
        { kind: 'num', pts: 1, q: 'Recall', answer: 0.72, tol: 0.001, pct: true, show: '72%' },
        { kind: 'num', pts: 2, q: M`\(F_1\) (three decimals, or a percentage)`, answer: 2 * 0.8 * 0.72 / 1.52, tol: 0.0015, pct: true, show: '0.758 (75.8%)' },
      ],
      explain: M`<p>TP = 72, FN = 28, FP = 18, TN = 882. Accuracy \(= \frac{72 + 882}{1000} = 0.954\). Precision \(= \frac{72}{72 + 18} = 0.80\). Recall \(= \frac{72}{72 + 28} = 0.72\). \(F_1 = 2 \cdot \frac{0.80 \cdot 0.72}{0.80 + 0.72} \approx 0.758\).</p>`,
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: '5,000 patients, 50 sick', type: 'Class imbalance', level: 'Easy', skill: 'cls',
      intro: '<p>A model predicts <b>healthy</b> for every patient.</p>' + viz('<div class="qzv-split"><div class="a" style="flex:4950">4,950 healthy</div><div class="b" style="flex:50"></div></div><p class="qzv-legend">the thin sliver: 50 sick patients</p>'),
      parts: [
        { kind: 'num', pts: 1, q: 'What is the accuracy?', answer: 0.99, tol: 0.001, pct: true, show: '99%' },
        { kind: 'num', pts: 1, q: 'What is the recall for the sick class?', answer: 0, tol: 0.001, pct: true, show: '0%' },
        { kind: 'mc', pts: 1, q: 'Is the model useful as a screening system?', options: ['Yes: 99% accuracy is excellent', 'No: it never finds a sick patient'], answer: 1, letters: false, inline: false },
      ],
      explain: '<p>Accuracy = 4,950 / 5,000 = <b>99%</b>, recall = 0 / 50 = <b>0%</b>: useless for finding sick patients. High accuracy on an imbalanced dataset can hide total failure on the minority class; always compare with the majority-class baseline.</p>',
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Three thresholds', type: 'Thresholds', level: 'Medium', skill: 'cls',
      intro: '<p>One classifier (100 positives, 900 negatives) at three decision thresholds:</p>' + table(['', '0.30', '0.50', '0.70'], [['TP', 95, 82, 60], ['FP', 180, 60, 15], ['FN', 5, 18, 40], ['TN', 720, 840, 885]]),
      parts: [
        { kind: 'rows', pts: 3, q: 'Which threshold fits each description best?', options: ['0.30', '0.50', '0.70'],
          rows: [
            { label: 'Highest precision', answer: 2 },
            { label: 'First-round disease screening (a missed case is very costly)', answer: 0 },
            { label: 'Highest recall', answer: 0 },
            { label: 'False alarms are very expensive', answer: 2 },
          ] },
        { kind: 'num', pts: 2, q: 'What is the precision at threshold 0.50? (a percentage, one decimal)', answer: 82 / 142, tol: 0.0015, pct: true, show: '82 / 142 ≈ 57.7%' },
      ],
      explain: '<p>0.30: recall 95 / 100 = 95%, precision 95 / 275 ≈ 34.5%. 0.50: recall 82%, precision 82 / 142 ≈ 57.7%. 0.70: recall 60%, precision 60 / 75 = 80%. Lowering the threshold catches more positives and raises more false alarms: screening prefers 0.30, expensive false alarms prefer 0.70. There is no universally correct threshold.</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'Put a price on the errors', type: 'Error costs', level: 'Medium', skill: 'cls',
      intro: table(['Model', 'FP', 'FN'], [['A', 20, 40], ['B', 80, 10]]) + '<p>Cost(FP) = 1, Cost(FN) = 10, so total cost = FP + 10 · FN.</p>',
      parts: [
        { kind: 'num', pts: 1.5, q: 'Total cost of Model A', answer: 420 },
        { kind: 'num', pts: 1.5, q: 'Total cost of Model B', answer: 180 },
        { kind: 'mc', pts: 2, q: 'If a false negative cost only 1 (the same as a false positive), which model would be preferred?', options: ['Model A', 'Model B', 'They tie'], answer: 0, letters: false },
      ],
      explain: '<p>A: 20 + 10 · 40 = <b>420</b>; B: 80 + 10 · 10 = <b>180</b>, so B is cheaper. With Cost(FN) = 1: A = 20 + 40 = 60, B = 80 + 10 = 90, and <b>A</b> is preferred. The best operating point depends on the cost of each error type.</p>',
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'Four models on 1,000 examples', type: 'Model comparison', level: 'Medium', skill: 'cls',
      intro: viz(bars([[null, 'Accuracy'], ['A', 94.3, 100, '94.3%'], ['B', 94.0, 100, '94.0%'], ['C', 91.0, 100, '91.0%'], ['D', 92.5, 100, '92.5%'],
        [null, 'Minority recall'], ['A', 45, 100, '45%', 'val'], ['B', 60, 100, '60%', 'val'], ['C', 85, 100, '85%', 'val'], ['D', 73, 100, '73%', 'val'],
        [null, 'Minority precision'], ['A', 82, 100, '82%', 'alt'], ['B', 70, 100, '70%', 'alt'], ['C', 49, 100, '49%', 'alt'], ['D', 61, 100, '61%', 'alt']])),
      parts: [
        { kind: 'rows', pts: 3, q: 'Which model…', options: ['A', 'B', 'C', 'D'],
          rows: [
            { label: 'catches the most minority cases?', answer: 2 },
            { label: 'has the highest overall accuracy?', answer: 0 },
            { label: 'raises the most reliable minority-class alarms?', answer: 0 },
          ] },
        { kind: 'mc', pts: 1, q: 'Can this table establish one universally best model?', options: ['Yes: A, with the highest accuracy', 'No: it depends on the costs of FP vs. FN'], answer: 1, letters: false, inline: false },
      ],
      explain: '<p>Highest accuracy: <b>A</b>; highest recall: <b>C</b>; highest precision: <b>A</b>. There is no universal winner: C finds more minority events but half its alarms are false; A is more accurate and precise but misses more than half of the minority cases. The application must specify the relative costs of false positives and false negatives.</p>',
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'ROUGE-L for one summary', type: 'ROUGE-L', level: 'Medium', skill: 'text',
      intro: cards(stat('reference', '8 tokens'), stat('candidate', '6 tokens'), stat('LCS', '5 tokens')) + M`<div class="math-block">\[ P = \frac{LCS}{|\text{candidate}|} \qquad R = \frac{LCS}{|\text{reference}|} \qquad F = \frac{2PR}{P + R} \]</div>`,
      parts: [
        { kind: 'num', pts: 1, q: M`\(P\) (two decimals)`, answer: 5 / 6, tol: 0.006, show: '5/6 ≈ 0.83' },
        { kind: 'num', pts: 3, q: 'ROUGE-L F1 (two decimals)', answer: 2 * (5 / 6) * 0.625 / (5 / 6 + 0.625), tol: 0.006, show: '0.71' },
      ],
      explain: M`<p>\(P = \frac{5}{6} \approx 0.833\), \(R = \frac{5}{8} = 0.625\), \(F = \frac{2 \cdot 0.833 \cdot 0.625}{0.833 + 0.625} \approx 0.714\).</p>`,
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'The committee rejected the proposal', type: 'Overlap metrics', level: 'Medium', skill: 'text',
      intro: stack(card('Reference', 'The committee rejected the proposal.'), card('Candidate A · ROUGE-L 0.50', 'The proposal was rejected by the committee.'), card('Candidate B · ROUGE-L 0.80', 'The committee accepted the proposal.')),
      parts: [
        { kind: 'rows', pts: 2, q: 'Which candidate…', options: ['Candidate A', 'Candidate B'],
          rows: [
            { label: 'preserves the meaning?', answer: 0 },
            { label: 'has better lexical overlap?', answer: 1 },
          ] },
        { kind: 'num', pts: 1, q: 'Check B’s score: what is the length of its longest common subsequence with the reference (in words)?', answer: 4 },
        { kind: 'mc', pts: 1, q: 'What does this show?', options: ['ROUGE-L is computed incorrectly here', 'Longer candidates always score higher', 'Lexical overlap ≠ semantic correctness', 'Passive sentences are penalised as errors'], answer: 2, inline: false },
      ],
      explain: '<p>B keeps <i>the committee … the proposal</i> in order (LCS = 4 of 5 words: P = R = 0.8) but reverses the meaning; A says the same thing in the passive voice and shares only <i>the … rejected … the</i> (LCS = 3: P = 3/7, R = 3/5, F = 0.50). <b>Lexical overlap ≠ semantic correctness.</b></p>',
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'Three translation systems', type: 'Evaluator disagreement', level: 'Medium', skill: 'text',
      intro: table(['', 'A', 'B', 'C'], [['BLEU', 35, 32, 34], ['ROUGE-L', '0.50', '0.45', '0.48'], ['COMET', '0.76', '0.83', '0.80'], ['Human', '4.0', '4.6', '4.3']]),
      parts: [
        { kind: 'rows', pts: 2, q: 'Which system does each evaluator rank first?', options: ['A', 'B', 'C'],
          rows: [
            { label: 'Humans', answer: 1 },
            { label: 'BLEU', answer: 0 },
          ] },
        { kind: 'mc', pts: 1, q: 'Which automatic metric matches the human ranking?', options: ['BLEU', 'ROUGE-L', 'COMET'], answer: 2, letters: false },
        { kind: 'mc', pts: 1, q: 'Is it legitimate to report only BLEU and conclude A is best?', options: ['Yes: BLEU is the standard metric', 'No: it hides contradictory evidence'], answer: 1, letters: false, inline: false },
      ],
      explain: '<p>BLEU (and ROUGE-L): A &gt; C &gt; B. Humans: B &gt; C &gt; A. COMET: B &gt; C &gt; A, the same order as the humans. Reporting only BLEU would hide contradictory evidence; different evaluators measure different properties.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'Longer answers and the judge', type: 'LLM-as-a-judge', level: 'Medium', skill: 'text',
      intro: '<p>Humans consider these answer pairs about equal in quality. How often each evaluator prefers answer A, by how much longer A is:</p>'
        + viz(lines({ x: [-120, 220], y: [0, 100], xt: [-100, 0, 100, 200], yt: [0, 25, 50, 75, 100], xl: 'extra length of answer A (words)', yl: '% prefer A' },
          [{ pts: [[-100, 25], [0, 50], [100, 68], [200, 81]], cls: 'a', name: 'LLM judge' }, { pts: [[-100, 50], [0, 51], [100, 49], [200, 50]], cls: 'b', name: 'humans' }])),
      parts: [
        { kind: 'mc', pts: 2, q: 'What bias does the pattern suggest?', options: ['Position bias', 'Self-preference', 'Knowledge limits', 'Verbosity bias'], answer: 3 },
        { kind: 'mc', pts: 2, q: 'Does this table prove that length <b>causes</b> the judge’s preference?', options: ['No: length may go along with style or content', 'Yes: the trend rises with every extra 100 words', 'Yes: the humans stay at 50% throughout', 'No: an LLM judge is never biased by length'], answer: 0, inline: false },
      ],
      explain: '<p>The judge prefers A more and more as A gets longer (25% → 81%), while humans stay near 50%: this suggests <b>verbosity bias</b>. It does not prove causation: length may be correlated with style, formatting, topic or extra useful information. A controlled experiment (pad the same answer and re-judge) is needed.</p>',
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: '66% vs. 41%', type: 'LLM-as-a-judge', level: 'Medium', skill: 'text',
      intro: '<p>The same answer pairs, judged twice:</p>' + viz(bars([['A shown first', 66, 100, '66%'], ['A shown second', 41, 100, '41%', 'val']]), 'qzv-wide'),
      parts: [
        { kind: 'mc', pts: 2, q: 'What bias does this suggest?', options: ['Position bias', 'Verbosity bias', 'Style bias', 'Self-preference'], answer: 0 },
        { kind: 'multi', pts: 2, q: 'Which changes to the protocol help?', options: ['Randomise the answer order', 'Score both orders', 'Allow ties', 'Always show A first', 'Drop the pairs where the orders disagree'], answer: [0, 1, 2], letters: false },
      ],
      explain: '<p>The verdict depends on the presentation order: <b>position bias</b>. Controls: randomise the order, score both orders (and count a win only if it survives the swap), allow ties, and report order-stratified results. Always showing A first bakes the bias in; silently dropping disagreements hides it.</p>',
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'Training and validation loss', type: 'Training curves', level: 'Medium', skill: 'curves',
      intro: viz(lines({ x: [0, 26], y: [0, 1.12], xt: [1, 5, 10, 15, 20, 25], yt: [0, 0.25, 0.5, 0.75, 1], xl: 'epoch', yl: 'loss' },
        [{ pts: [[1, 0.9], [5, 0.6], [10, 0.35], [15, 0.22], [20, 0.14], [25, 0.09]], cls: 'a', name: 'training loss' }, { pts: [[1, 0.95], [5, 0.62], [10, 0.39], [15, 0.34], [20, 0.4], [25, 0.52]], cls: 'b', name: 'validation loss' }])),
      parts: [
        { kind: 'num', pts: 2, q: 'Around which epoch is validation performance best?', answer: 15 },
        { kind: 'mc', pts: 1, q: 'What happens after that?', options: ['Both losses keep falling together', 'Both losses rise: the data got harder', 'Training loss falls, validation rises', 'Validation falls, training loss rises'], answer: 2, inline: false },
        { kind: 'mc', pts: 1, q: 'Should the final model necessarily use epoch 25?', options: ['Yes: its training loss is lowest', 'No: it has overfitted'], answer: 1, letters: false, inline: false },
      ],
      explain: '<p>Validation loss is lowest around <b>epoch 15</b> (0.34). After that the training loss keeps falling while the validation loss rises: <b>overfitting</b>. Epoch 25 is not automatically better; use early stopping on the validation curve.</p>',
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'Reporting the validation minimum', type: 'Model selection', level: 'Medium', skill: 'curves',
      intro: '<p>A team chooses its stopping epoch by finding the lowest validation loss, then reports that minimum validation loss as the final unbiased performance estimate.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What is wrong?', options: ['Validation loss is not a real metric', 'It chose the epoch, so it is biased', 'Early stopping always underfits', 'Nothing: it is the standard practice'], answer: 1, inline: false },
      ],
      explain: '<p>The validation set <b>influenced model selection</b>: picking the minimum of a noisy curve makes the reported value optimistically biased. Final reporting should use an <b>untouched test set</b>.</p>',
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: 'A 5% group', type: 'Subgroups', level: 'Medium', skill: 'curves',
      intro: '<p>Deployment share of each group and the per-group accuracy of Models X and Y:</p>' + table(['Group', 'Share', 'X', 'Y'], [['1', '70%', '92%', '88%'], ['2', '25%', '90%', '86%'], ['3', '5%', '40%', '82%']]),
      parts: [
        { kind: 'num', pts: 2, q: 'Overall accuracy of Model X', answer: 0.889, tol: 0.0006, pct: true, show: '88.9%' },
        { kind: 'num', pts: 1, q: 'Overall accuracy of Model Y', answer: 0.872, tol: 0.0006, pct: true, show: '87.2%' },
        { kind: 'mc', pts: 1, q: 'What serious problem does the average hide?', options: ['Y is better for every group', 'X fails badly on group 3', 'Group 1 is too large', 'X is worse on average'], answer: 1, inline: false },
      ],
      explain: M`<p>X: \(0.70 \cdot 0.92 + 0.25 \cdot 0.90 + 0.05 \cdot 0.40 = 0.889\). Y: \(0.70 \cdot 0.88 + 0.25 \cdot 0.86 + 0.05 \cdot 0.82 = 0.872\). X wins overall, but on group 3 it gets <b>40%</b> against Y's 82%: the aggregate hides a severe subgroup failure. Report per-group results and the worst group.</p>`,
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'Benchmark mix vs. deployment mix', type: 'Distribution shift', level: 'Medium', skill: 'curves',
      intro: table(['', 'News', 'Wiki', 'Social'], [['Accuracy', '94%', '92%', '71%'], ['Benchmark', '70%', '20%', '10%'], ['Deployment', '10%', '10%', '80%']]) + '<p class="qzv-hint">Wiki = Wikipedia, Social = social media.</p>',
      parts: [
        { kind: 'num', pts: 2, q: 'Expected accuracy on the benchmark mix', answer: 0.913, tol: 0.0006, pct: true, show: '91.3%' },
        { kind: 'num', pts: 2, q: 'Expected accuracy on the deployment mix', answer: 0.754, tol: 0.0006, pct: true, show: '75.4%' },
      ],
      explain: M`<p>Benchmark: \(0.70 \cdot 0.94 + 0.20 \cdot 0.92 + 0.10 \cdot 0.71 = 0.913\). Deployment: \(0.10 \cdot 0.94 + 0.10 \cdot 0.92 + 0.80 \cdot 0.71 = 0.754\). The same model, with the same per-domain accuracy, drops 16 points when the mix shifts.</p>`,
    },
    /* ---------- 15 ---------- */
    {
      id: 't15', title: 'Movie reviews → app comments', type: 'Distribution shift', level: 'Medium', skill: 'curves',
      intro: cards(stat('movie reviews', '92% F1'), stat('short mobile-app comments', 'poor')),
      parts: [
        { kind: 'multi', pts: 3, q: 'Which are plausible data reasons for the drop?', options: ['Different vocabulary', 'Much shorter texts', 'Slang, emojis and misspellings', 'Different class balance', 'The test set was too large', 'The model’s random seed'], answer: [0, 1, 2, 3], letters: false },
      ],
      explain: '<p>Different vocabulary, text length, slang / emojis / misspellings, class balance, label meaning, language mix, temporal drift. A better evaluation set samples from the real deployment environment. (A larger test set only makes the estimate more precise.)</p>',
    },
    /* ---------- 16 ---------- */
    {
      id: 't16', title: 'Four data pipelines', type: 'Leakage', level: 'Medium', skill: 'data',
      intro: viz('<div class="al-pair">' + card('A', 'Multiple records from the same patient are randomly split across train and test.') + card('B', 'A publication date, known when an article is published, is used as a feature.')
        + card('C', 'Feature scaling is fitted on the complete dataset before cross-validation.') + card('D', 'A benchmark question appears in the language model’s training corpus.') + '</div>'),
      parts: [
        { kind: 'rows', pts: 3, q: 'Is leakage likely?', options: ['Leakage / contamination', 'Not necessarily leakage'],
          rows: [
            { label: 'A', answer: 0 },
            { label: 'B', answer: 1 },
            { label: 'C', answer: 0 },
            { label: 'D', answer: 0 },
          ] },
      ],
      explain: '<p><b>A</b>: leakage risk (the model can recognise the patient); split by patient. <b>B</b>: not necessarily leakage, the feature is available at prediction time. <b>C</b>: leakage, the test folds’ statistics leak into training; fit preprocessing inside each training fold. <b>D</b>: contamination; deduplicate or use fresh held-out items.</p>',
    },
    /* ---------- 17 ---------- */
    {
      id: 't17', title: '15% near-duplicates', type: 'Contamination', level: 'Hard', skill: 'data',
      intro: '<p>15% of a benchmark’s items are near-duplicates of training data.</p>' + viz(bars([[null, 'Model A'], ['full', 78, 100, '78.0%'], ['clean subset', 75, 100, '75.0%', 'val'], ['overlap items', 95, 100, '95.0%', 'alt'],
        [null, 'Model B'], ['full', 77.5, 100, '77.5%'], ['clean subset', 77, 100, '77.0%', 'val'], ['overlap items', 80, 100, '80.0%', 'alt']])),
      parts: [
        { kind: 'rows', pts: 2, q: 'Which model ranks first…', options: ['Model A', 'Model B'],
          rows: [
            { label: 'after deduplication (clean subset)?', answer: 1 },
            { label: 'on the full benchmark?', answer: 0 },
          ] },
        { kind: 'mc', pts: 2, q: 'Does A’s large overlap-vs-clean gap prove intentional contamination?', options: ['Yes: 95% is too high to be chance', 'Yes: B would show the same gap otherwise', 'No: the gap means A generalises better', 'No: memorisation or easier items fit too'], answer: 3, inline: false },
      ],
      explain: '<p>Full: A &gt; B (78.0 vs. 77.5). Clean: B &gt; A (77.0 vs. 75.0): the ranking flips. A’s 95% on overlapping items is consistent with <b>memorisation</b>, <b>easier overlapping items</b> or dataset artifacts; it does not prove intentional contamination. Report clean-subset results.</p>',
    },
    /* ---------- 18 ---------- */
    {
      id: 't18', title: '50,000 messy examples', type: 'Data cleaning', level: 'Medium', skill: 'data',
      intro: cards(stat('examples', '50,000'), stat('exact duplicates', '4,000'), stat('near-duplicates', '2,000'), stat('corrupted', '800')) + '<p>There are also several examples per user, and inconsistent labels.</p>',
      parts: [
        { kind: 'seq', pts: 4, q: 'Put these four steps in a sensible order.', label: 'first →', tokens: ['split by user', 'normalise fields', 'inspect data', 'deduplicate'], answer: ['inspect data', 'normalise fields', 'deduplicate', 'split by user'] },
        { kind: 'mc', pts: 1, q: 'Why normalise before deduplicating?', options: ['It catches more duplicates', 'It makes the files smaller', 'It fixes the labels'], answer: 0, inline: false },
      ],
      explain: '<p>One sensible full order: inspect → remove corrupted examples → <b>normalise</b> → <b>deduplicate</b> → investigate labels → <b>split by user</b> → document and freeze the test set. Normalising first (case, whitespace, encodings) turns near-duplicates into exact ones, so deduplication catches more; grouping by user before splitting prevents user-level leakage.</p>',
    },
    /* ---------- 19 ---------- */
    {
      id: 't19', title: '82 vs. 84 correct out of 100', type: 'Uncertainty', level: 'Medium', skill: 'stats',
      intro: cards(stat('Model A', '82 / 100'), stat('Model B', '84 / 100')),
      parts: [
        { kind: 'mc', pts: 2, q: 'Which conclusion is justified?', options: ['B is clearly better', 'A is better because it is simpler', 'The difference proves causation', 'The 2-point gap is weak evidence'], answer: 3, inline: false },
        { kind: 'num', pts: 3, q: M`Normal approximation: the 95% interval for B is \(\hat p \pm 1.96\sqrt{\hat p(1 - \hat p)/n}\). What is its half-width, in percentage points? (one decimal)`, answer: 196 * Math.sqrt(0.84 * 0.16 / 100), tol: 0.15, show: '±7.2 points' },
      ],
      explain: M`<p>\(1.96 \sqrt{0.84 \cdot 0.16 / 100} \approx 0.072\): about <b>±7 points</b>, so the intervals of A and B overlap almost completely (the lab's Wilson intervals give the same picture). A better study: more test examples, the same examples for both models with a <b>paired</b> test (McNemar, paired bootstrap), and several training seeds.</p>`,
    },
    /* ---------- 20 ---------- */
    {
      id: 't20', title: 'The same 2 points on 1,000,000 examples', type: 'Uncertainty', level: 'Medium', skill: 'stats',
      intro: '<p>Accuracies stay at 82% and 84%, but the test set now has <b>1,000,000 independent examples</b>.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'How does the interpretation change?', options: ['It proves that B is better on every distribution', 'Convincing, but not proof it matters in practice', 'Nothing changes: a 2-point gap is always noise', 'It shows that B’s design caused the improvement'], answer: 1, inline: false },
      ],
      explain: '<p>The intervals shrink to about ±0.08 points, so the difference is statistically convincing. It still does not prove <b>practical importance</b>, <b>robustness under distribution shift</b>, or what <b>caused</b> the gain.</p>',
    },
    /* ---------- 21 ---------- */
    {
      id: 't21', title: '“Larger models are better”', type: 'Confounds', level: 'Medium', skill: 'data',
      intro: viz('<div class="al-pair">' + card('Model A', '7B parameters · 1 trillion training tokens') + card('Model B', '13B parameters · 3 trillion training tokens', 'chosen') + '</div>') + '<p>Model B scores higher, and the report concludes: “Larger models are better.”</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Why is this conclusion too strong?', options: ['13B parameters is not really a large model', 'Benchmarks cannot compare two such models', 'Size and data amount changed together', 'Model A was trained for far too long'], answer: 2, inline: false },
      ],
      explain: '<p>Two factors changed at once, <b>model size and training-data amount</b>, so the experiment cannot isolate which caused the improvement. Vary one factor while holding the other fixed (or run a grid of sizes × data, with several seeds).</p>',
    },
    /* ---------- 22 ---------- */
    {
      id: 't22', title: 'Two annotators, 100 outputs', type: 'Agreement', level: 'Hard', skill: 'stats',
      intro: matrix('A', 'B', ['Accept', 'Reject'], ['Accept', 'Reject'], [[70, 10], [10, 10]]) + M`<div class="math-block">\[ \kappa = \frac{p_o - p_e}{1 - p_e} \]</div>`,
      parts: [
        { kind: 'num', pts: 1, q: M`Observed agreement \(p_o\)`, answer: 0.8, tol: 0.001, pct: true, show: '0.80' },
        { kind: 'num', pts: 2, q: M`Chance agreement \(p_e\) (both annotators say Accept 80% of the time)`, answer: 0.68, tol: 0.001, pct: true, show: '0.8 · 0.8 + 0.2 · 0.2 = 0.68' },
        { kind: 'num', pts: 2, q: M`Cohen's \(\kappa\) (three decimals)`, answer: 0.375, tol: 0.0051, show: '0.375' },
      ],
      explain: M`<p>\(p_o = \frac{70 + 10}{100} = 0.80\). Each annotator accepts 80 of 100, so \(p_e = 0.8 \cdot 0.8 + 0.2 \cdot 0.2 = 0.68\). \(\kappa = \frac{0.80 - 0.68}{1 - 0.68} = 0.375\): 80% raw agreement is only modest agreement beyond chance, because both annotators accept most outputs anyway.</p>`,
    },
    /* ---------- 23 ---------- */
    {
      id: 't23', title: 'Same raw agreement, different κ', type: 'Agreement', level: 'Hard', skill: 'stats',
      intro: '<p>Case A (previous task): raw agreement 80%, κ = 0.375. Case B:</p>' + matrix('A', 'B', ['Accept', 'Reject'], ['Accept', 'Reject'], [[40, 10], [10, 40]]),
      parts: [
        { kind: 'num', pts: 2, q: M`Cohen's \(\kappa\) for Case B (two decimals)`, answer: 0.6, tol: 0.006, show: '0.60' },
        { kind: 'mc', pts: 2, q: 'Why is κ higher than in Case A?', options: ['Balanced labels: lower chance agreement', 'Case B has more raw agreement than A', 'Case B was labelled by fewer annotators', 'κ ignores the off-diagonal disagreement cells'], answer: 0, inline: false },
      ],
      explain: M`<p>Raw agreement is again \(\frac{40 + 40}{100} = 0.80\), but each annotator uses each label 50% of the time: \(p_e = 0.5 \cdot 0.5 + 0.5 \cdot 0.5 = 0.50\), so \(\kappa = \frac{0.80 - 0.50}{1 - 0.50} = 0.60\). Same raw agreement, stronger agreement beyond chance.</p>`,
    },
    /* ---------- 24 ---------- */
    {
      id: 't24', title: '“LLM-judge win rate = 68%”', type: 'Reporting', level: 'Medium', skill: 'stats',
      intro: '<blockquote class="qz-quote">“Our assistant is better. LLM-judge win rate = 68%.”</blockquote>',
      parts: [
        { kind: 'multi', pts: 3, q: 'Which information is needed before this is convincing?', options: ['Was the answer order randomised?', 'Were ties allowed?', 'What rubric did the judge use?', 'Did the answers differ in length?', 'How many independent prompts, and the CI?', 'Was the judge calibrated against humans?', 'Which font the report used', 'How confident the team feels'], answer: [0, 1, 2, 3, 4, 5], letters: false },
      ],
      explain: '<p>Order randomisation, ties, the rubric and judge model, length differences, the number of independent prompts and a confidence interval, calibration against humans, how prompts were sampled and whether they are representative, contamination, fact checks. A single win rate is not an evaluation methodology.</p>',
    },
    /* ---------- 25 ---------- */
    {
      id: 't25', title: 'Model X vs. Model Y', type: 'Final challenge', level: 'Hard', skill: 'stats',
      intro: table(['Aggregate', 'X', 'Y'], [['Factual QA accuracy', '88%', '86%'], ['LLM-judge win rate', '61%', '39%'], ['Avg. answer length', '310 words', '170 words']])
        + table(['Human score', 'X', 'Y'], [['Definitions', '4.6', '4.4'], ['Calculations', '3.7', '4.5'], ['Open-ended', '4.7', '4.2'], ['Bulgarian prompts', '3.8', '4.3']])
        + '<p>The LLM judge has previously shown a preference for longer answers.</p>',
      parts: [
        { kind: 'rows', pts: 2, q: 'Which model is better on…', options: ['Model X', 'Model Y'],
          rows: [
            { label: 'Calculations', answer: 1 },
            { label: 'Factual QA accuracy', answer: 0 },
            { label: 'Bulgarian prompts', answer: 1 },
            { label: 'The LLM-judge win rate', answer: 0 },
          ] },
        { kind: 'mc', pts: 1, q: 'Why might the judge win rate be inflated for X?', options: ['X’s answers are much longer', 'X has higher factual accuracy', 'Y was shown first more often'], answer: 0, inline: false },
        { kind: 'mc', pts: 2, q: 'Is “X is the better assistant” justified?', options: ['Yes: it wins on QA accuracy and the judge', 'Yes: a 61% win rate is a clear majority', 'No: Y is better on every prompt type', 'No: Y wins on calculations and Bulgarian'], answer: 3, inline: false },
      ],
      explain: '<p>X: higher factual-QA accuracy and judge win rate; Y: better on calculations and Bulgarian prompts. X’s answers are much longer (310 vs. 170 words) and the judge is known to prefer length, so the 61% may partly reflect <b>verbosity bias</b>. The data does not justify a universal claim. Next: randomised order, length-controlled comparisons, human evaluation, per-subgroup reporting, confidence intervals, judge–human agreement, failure examples, representative deployment prompts.</p>',
    },
  ],
};
