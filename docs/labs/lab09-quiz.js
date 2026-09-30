/* ===== Lab 09 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab09-decision-trees.html';
const TREE = `                 Outlook?
              /     |      \\
          Sunny  Overcast   Rain
            |       |         |
        Humidity?  Yes      Wind?
         /   \\              /   \\
      High Normal        Weak Strong
       No    Yes          Yes    No`;

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
        { kind: 'rows', pts: 4, q: 'Which kind of tree is appropriate?', options: ['Classification tree', 'Regression tree'],
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
      intro: '<pre class="qz-code qz-diagram">' + TREE + '</pre>',
      parts: [
        { kind: 'rows', pts: 5, q: 'What is each part of this tree?', options: ['Root node', 'Internal node', 'Leaf', 'Branch'],
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
      intro: '<p>Use the same tree. A day has <b>Outlook = Sunny</b>, <b>Humidity = Normal</b>, <b>Wind = Strong</b>.</p><pre class="qz-code qz-diagram">' + TREE + '</pre>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What does the tree predict?', options: ['Yes', 'No'], answer: 0, letters: false },
        { kind: 'mc', pts: 2, q: 'Which feature of this day is never used on its path?', options: ['Outlook', 'Humidity', 'Wind'], answer: 2, letters: false },
      ],
      explain: '<p>Outlook = Sunny → Humidity = Normal → <b>Yes</b>. The value of <b>Wind</b> is never used on this path.</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'What does a leaf predict?', type: 'Concept', level: 'Easy', skill: 'basics',
      parts: [
        { kind: 'mc', pts: 2, q: 'In a <b>classification</b> tree, a leaf predicts…', options: ['the mean target value of the examples that reach it', 'another feature question to split the examples on', 'the majority class of the examples that reach it', 'the class of the single closest training example'], answer: 2, inline: false },
        { kind: 'mc', pts: 2, q: 'In a <b>regression</b> tree, a leaf predicts…', options: ['the mean target value of the examples that reach it', 'the majority class of the examples that reach it', 'the largest target value seen anywhere in the training set', 'the entropy of the examples that reach the leaf'], answer: 0, inline: false },
      ],
      explain: '<p>A classification leaf predicts the <b>majority class</b> of the training examples reaching it; a regression leaf typically predicts their <b>mean target value</b>.</p>',
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'A node with mixed classes', type: 'Tree growth', level: 'Easy', skill: 'basics',
      intro: '<p>A decision-tree learner is at a node containing mixed classes.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What does it do next?', options: ['Search all possible trees and keep the best one', 'Split on the feature with the most distinct values', 'Pick a random feature and never reconsider it', 'Split on the best feature, then recurse'], answer: 3, inline: false },
      ],
      explain: '<p>Decision-tree construction is <b>top-down, recursive and greedy</b>: the learner chooses the best current split and does not later go back and redesign the upper part of the tree.</p>',
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'When does a branch stop?', type: 'Tree growth', level: 'Medium', skill: 'basics',
      parts: [
        { kind: 'multi', pts: 2, q: 'Which situations stop recursive growth in the basic ID3-style procedure?', options: ['The node is pure: all examples have one class', 'The node still contains examples of both classes', 'No useful features remain to split on', 'The parent node had a high entropy'], answer: [0, 2], inline: false },
        { kind: 'mc', pts: 1, q: 'If no features remain but the node is still mixed, what does it predict?', options: ['Its majority class', 'A random class', 'Nothing: it is removed'], answer: 0, letters: false },
      ],
      explain: '<p>A branch stops when the node is <b>pure</b> or when there are <b>no useful features left</b>; in the second case the node predicts its <b>majority class</b>.</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: '8 Yes, 0 No', type: 'Entropy', level: 'Easy', skill: 'entropy',
      intro: '<p>A node contains 8 Yes and 0 No examples.</p>',
      parts: [{ kind: 'num', pts: 3, q: 'What is its entropy (in bits)?', prefix: 'H =', answer: 0 }],
      explain: '<p><b>H = 0</b>: the node is completely pure, so there is no uncertainty about the class.</p>',
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: '4 Yes, 4 No', type: 'Entropy', level: 'Easy', skill: 'entropy',
      intro: '<p>A node contains 4 Yes and 4 No examples.</p>',
      parts: [{ kind: 'num', pts: 3, q: 'What is its entropy (in bits)?', prefix: 'H =', answer: 1 }],
      explain: '<p>For two equally likely classes <b>H = 1 bit</b>. In a two-class problem a pure node has entropy 0 and a 50/50 node has entropy 1: it is maximally impure.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'Which node is more impure?', type: 'Entropy', level: 'Medium', skill: 'entropy',
      intro: '<p>Node A has 3 Yes and 1 No. Node B has 6 Yes and 2 No.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Which has higher entropy?', options: ['Node A', 'Node B', 'Neither: they are equal'], answer: 2, letters: false },
        { kind: 'num', pts: 3, q: M`Compute the entropy of node A, to two decimal places: \(H = -\sum_i p_i \log_2 p_i\).`, prefix: 'H =', answer: -(0.75 * Math.log2(0.75) + 0.25 * Math.log2(0.25)), tol: 0.006, show: '0.81' },
      ],
      explain: M`<p><b>They are equal.</b> Both have 75% Yes and 25% No, and entropy depends on the class <b>proportions</b>, not directly on the number of examples: \(H = -(0.75 \log_2 0.75 + 0.25 \log_2 0.25) \approx 0.311 + 0.5 = 0.81\).</p>`,
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'One more Yes', type: 'Entropy', level: 'Medium', skill: 'entropy',
      intro: '<p>A node starts with 5 Yes and 2 No. Then one more Yes example is added: 6 Yes and 2 No.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Does the entropy increase or decrease?', options: ['It increases', 'It decreases', 'It stays the same'], answer: 1, letters: false },
      ],
      explain: '<p><b>It decreases</b> (from about 0.86 to 0.81): the class distribution moves farther from 50/50 and closer to a pure node.</p>',
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'Information gain', type: 'Calculation', level: 'Medium', skill: 'gain',
      intro: '<p>A parent node has entropy H(parent) = 1.0. A split produces two equally sized child nodes with entropy 0 and 0.</p>',
      parts: [{ kind: 'num', pts: 4, q: 'What is the information gain?', answer: 1, tol: 0.001, show: '1.0' }],
      explain: M`<p>Weighted child entropy \(= 0.5 \cdot 0 + 0.5 \cdot 0 = 0\), so Gain \(= 1.0 - 0 = 1.0\). This is a perfect split: both children are pure.</p>`,
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'Choose the split', type: 'Selection', level: 'Easy', skill: 'gain',
      intro: '<p>At the current node: gain(A) = 0.12, gain(B) = 0.42, gain(C) = 0.08, gain(D) = 0.25.</p>',
      parts: [{ kind: 'mc', pts: 3, q: 'Which feature does ID3 choose?', options: ['A', 'B', 'C', 'D'], answer: 1, letters: false }],
      explain: '<p><b>Feature B</b>, because it has the largest information gain (0.42).</p>',
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: '90 vs. 10 examples', type: 'Calculation', level: 'Medium', skill: 'gain',
      intro: '<p>A split creates child A with <b>90 examples</b> and entropy 0.5, and child B with <b>10 examples</b> and entropy 1.0.</p>',
      parts: [
        { kind: 'num', pts: 3, q: 'What is the weighted child entropy used by information gain?', answer: 0.55, tol: 0.001 },
        { kind: 'mc', pts: 3, q: 'Why not simply average the two child entropies 50/50?', options: ['A plain average would always give a negative gain.', 'Child A holds 90% of the data, so it should count more.', 'Entropy is only defined for nodes with 50 examples.', 'Averaging would make both children look pure.'], answer: 1, inline: false },
      ],
      explain: M`<p>Weighted: \(0.9 \cdot 0.5 + 0.1 \cdot 1.0 = 0.55\) (a plain 50/50 average would give 0.75). A child containing 90% of the data should contribute more to the post-split impurity than one containing 10%, so information gain uses a <b>weighted average</b>.</p>`,
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'A StudentID feature', type: 'Split quality', level: 'Hard', skill: 'gain',
      intro: '<p>The dataset has an ID-like feature, <code>StudentID</code>: every training example has a unique value, so splitting on it creates one pure child per example.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Why can information gain strongly prefer this useless feature?',
          options: ['IDs are numeric, and gain favours numeric features.', 'Every child is pure, so the gain is the maximum possible.', 'IDs are always sorted, which lowers the entropy.', 'Unique values make the parent entropy zero.'], answer: 1, inline: false },
        { kind: 'mc', pts: 2, q: 'What is a sensible response?', options: ['Split on StudentID first, then prune the tree.', 'Scale StudentID to [0, 1] before splitting.', 'Increase the maximum depth of the tree.', 'Drop ID-like features, or use gain ratio.'], answer: 3, inline: false },
      ],
      explain: '<p>Every child becomes pure, giving extremely high information gain, but the split just memorizes the training set and gives no reusable rule for unseen examples. Information gain is <b>biased toward features with many distinct values</b>; drop ID-like features or use <b>gain ratio</b>.</p>',
    },
    /* ---------- 15 ---------- */
    {
      id: 't15', title: 'Numeric thresholds', type: 'Split candidates', level: 'Medium', skill: 'gain',
      intro: '<p>A numeric feature has the sorted values <b>2, 5, 8, 12</b>. Candidate thresholds are tested at the midpoints between neighbouring values.</p>',
      parts: [
        { kind: 'multi', pts: 6, q: 'Which values are midpoint threshold candidates?', options: ['3.5', '5', '6.5', '7', '10', '12'], answer: [0, 2, 4], letters: false },
      ],
      explain: '<p>Between 2 and 5 → 3.5; between 5 and 8 → 6.5; between 8 and 12 → 10. The algorithm keeps the threshold with the largest gain.</p>',
    },
    /* ---------- 16 ---------- */
    {
      id: 't16', title: '100% train, 72% test', type: 'Diagnosis', level: 'Medium', skill: 'overfit',
      intro: '<p>A decision tree achieves training accuracy 100% and test accuracy 72%. It is very deep and has many leaves containing only a few examples.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What is the likely problem?', options: ['Underfitting', 'Data leakage', 'Overfitting', 'Too few features'], answer: 2 },
        { kind: 'mc', pts: 2, q: 'Which is it associated with?', options: ['High bias', 'High variance'], answer: 1, letters: false },
      ],
      explain: '<p><b>Overfitting</b>: the tree has enough complexity to memorize noise and peculiarities of the training set (very deep tree, small leaves, excellent training performance, much worse test performance). It is associated with <b>high variance</b>.</p>',
    },
    /* ---------- 17 ---------- */
    {
      id: 't17', title: 'Shallow vs. deep trees', type: 'Matching', level: 'Medium', skill: 'overfit',
      parts: [
        { kind: 'rows', pts: 5, q: 'Which tree typically has…', options: ['Shallow tree', 'Deep tree'],
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
        { kind: 'rows', pts: 6, q: 'Classify each technique.', options: ['Pre-pruning', 'Post-pruning'],
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
        { kind: 'mc', pts: 6, q: 'Is the reasoning correct?',
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
      intro: '<table class="qz-pq"><thead><tr><th></th><th>Model A</th><th>Model B</th></tr></thead><tbody><tr><td>Max depth</td><td>3</td><td>20</td></tr><tr><td>Training accuracy</td><td>83%</td><td>100%</td></tr><tr><td>Validation accuracy</td><td>81%</td><td>70%</td></tr></tbody></table>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Which tree shows stronger evidence of overfitting?', options: ['Model A', 'Model B'], answer: 1, letters: false },
        { kind: 'mc', pts: 4, q: 'Which model would you rather deploy?', options: ['Model A', 'Model B'], answer: 0, letters: false },
      ],
      explain: '<p><b>Model B</b> overfits: perfect training performance but much worse validation performance — the deep tree is likely fitting noise. <b>Model A</b> has a much smaller training–validation gap and the better validation accuracy, so it is the one to deploy.</p>',
    },
  ],
};
