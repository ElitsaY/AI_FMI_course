/* ===== Lab 05 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab05-games.html';
const LAB_TREE = 'MAX(MIN(MAX(-1,3),MAX(5,1)),MIN(MAX(-6,-4),MAX(0,9)))';
const LEAVES = ['-1', '3', '5', '1', '-6', '-4', '0', '9'];

window.QUIZ = {
  id: 'lab05',
  skills: [
    { id: 'values', label: 'Minimax values', href: LAB + '#minimax' },
    { id: 'props', label: 'Minimax properties', href: LAB + '#minimax' },
    { id: 'ab', label: 'Alpha–beta pruning', href: LAB + '#alphabeta' },
    { id: 'practice', label: 'Move ordering and depth cutoffs', href: LAB + '#alphabeta' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: 'MAX or MIN?', type: 'Backup', level: 'Easy', skill: 'values',
      figure: { tree: 'MAX(3,7,5)', dx: 80, alt: 'MAX node with leaves 3, 7, 5' },
      parts: [{ kind: 'num', pts: 5, q: 'What value is returned by the root?', answer: 7 }],
      explain: '<p><b>7</b>: MAX chooses the largest child value.</p>',
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'MIN node', type: 'Backup', level: 'Easy', skill: 'values',
      figure: { tree: 'MIN(3,7,-2)', dx: 80, alt: 'MIN node with leaves 3, 7, -2' },
      parts: [{ kind: 'num', pts: 5, q: 'What value is returned?', answer: -2 }],
      explain: '<p><b>−2</b>: MIN chooses the smallest child value.</p>',
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Back up a game tree', type: 'Backup', level: 'Easy–Medium', skill: 'values',
      figure: { tree: 'MAX(MIN(3,5),MIN(-4,9))', dx: 70, alt: 'Two-level game tree' },
      parts: [
        { kind: 'num', pts: 3, q: 'Value of the left MIN node?', answer: 3 },
        { kind: 'num', pts: 3, q: 'Value of the right MIN node?', answer: -4 },
        { kind: 'num', pts: 4, q: 'What is the minimax value of the root?', answer: 3 },
      ],
      explain: '<p>Left MIN = min(3, 5) = 3; right MIN = min(−4, 9) = −4; root MAX = max(3, −4) = <b>3</b>.</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'The lab’s minimax tree', type: 'Backup', level: 'Medium', skill: 'values',
      intro: '<p>Leaf values are utilities from MAX’s point of view.</p>',
      figure: { tree: LAB_TREE, alt: 'Three-level game tree from the lab' },
      parts: [
        { kind: 'num', pts: 4, q: 'Value of the left MIN node?', answer: 3 },
        { kind: 'num', pts: 4, q: 'Value of the right MIN node?', answer: -4 },
        { kind: 'num', pts: 4, q: 'Minimax value of the root?', answer: 3 },
        { kind: 'mc', pts: 3, q: 'Which move should MAX choose at the root?', options: ['Left subtree', 'Right subtree', 'Either: both have the same value'], answer: 0, letters: false, inline: false },
      ],
      explain: '<p>MAX nodes: max(−1, 3) = 3, max(5, 1) = 5, max(−6, −4) = −4, max(0, 9) = 9. MIN nodes: min(3, 5) = 3, min(−4, 9) = −4. Root: max(3, −4) = 3, so MAX chooses the <b>left subtree</b>.</p>',
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'Minimax properties', type: 'Properties', level: 'Medium', skill: 'props',
      intro: M`<p>\(b\) = branching factor, \(m\) = maximum depth of the game tree.</p>`,
      parts: [
        { kind: 'mc', pts: 3, q: 'Is minimax complete?', options: ['Yes, if the game tree is finite', 'Yes, always', 'No', 'Only with alpha–beta pruning'], answer: 0, inline: false },
        { kind: 'mc', pts: 3, q: 'Is minimax optimal?', options: ['Yes, against any opponent', 'Yes, against an optimal opponent', 'No, never', 'Only with a depth cutoff'], answer: 1, inline: false },
        { kind: 'mc', pts: 2, q: 'Time complexity?', options: [M`\(O(bm)\)`, M`\(O(b^d)\)`, M`\(O(b^m)\)`, M`\(O(m)\)`], answer: 2 },
        { kind: 'mc', pts: 2, q: 'Space complexity?', options: [M`\(O(b^m)\)`, M`\(O(bm)\)`, M`\(O(b)\)`, M`\(O(m^b)\)`], answer: 1 },
      ],
      explain: M`<p><b>Complete</b>: yes, if the game tree is finite. <b>Optimal</b>: yes, against an optimal opponent. <b>Time</b>: \(O(b^m)\). <b>Space</b>: \(O(bm)\) (depth-first exploration).</p>`,
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'Alpha and beta', type: 'Definitions', level: 'Medium', skill: 'ab',
      parts: [
        { kind: 'rows', pts: 5, q: 'What do alpha and beta represent?', options: ['Best value MAX can guarantee so far', 'Best value MIN can guarantee so far'],
          rows: [{ label: M`\(\alpha\) (alpha)`, answer: 0 }, { label: M`\(\beta\) (beta)`, answer: 1 }] },
        { kind: 'mc', pts: 5, q: 'When is a branch pruned?', options: [M`\(\beta \leq \alpha\)`, M`\(\alpha \leq \beta\)`, M`\(\alpha = 0\)`, M`\(\beta = +\infty\)`], answer: 0 },
      ],
      explain: M`<p>\(\alpha\) = best value MAX can guarantee so far; \(\beta\) = best value MIN can guarantee so far. The pruning condition is \(\beta \leq \alpha\).</p>`,
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'Find the pruned leaves', type: 'Alpha–beta tracing', level: 'Hard', skill: 'ab',
      intro: '<p>Use the same tree and search left-to-right using alpha–beta pruning.</p>',
      figure: { tree: LAB_TREE, alt: 'Three-level game tree from the lab' },
      parts: [
        { kind: 'multi', pts: 10, q: 'Which leaves are never evaluated?', options: LEAVES, answer: [3, 6, 7], letters: false },
        { kind: 'num', pts: 5, q: 'How many of the 8 leaves are evaluated?', answer: 5 },
        { kind: 'num', pts: 5, q: M`What is \(\beta\) at the right MIN node when it prunes its second child?`, prefix: M`\(\beta =\)`, answer: -4 },
      ],
      explain: M`<p>After the first left MAX returns 3, the left MIN has \(\beta = 3\). The next MAX sees 5, so \(\alpha = 5\); \(\beta \leq \alpha\) (\(3 \leq 5\)), so leaf <b>1</b> is pruned.</p><p>The root now has \(\alpha = 3\). The first MAX on the right returns −4, so the right MIN has \(\beta = -4\); since \(-4 \leq 3\), the subtree with <b>0 and 9</b> is pruned. Only <b>5 of the 8 leaves</b> are evaluated.</p>`,
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'Does alpha–beta change the answer?', type: 'Conceptual', level: 'Medium', skill: 'ab',
      intro: '<blockquote class="qz-quote">“Alpha–beta pruning skips branches, so it may return a different move from minimax.”</blockquote>',
      parts: [
        { kind: 'mc', pts: 8, q: 'Is the student correct?',
          options: ['Yes: skipped branches may contain the best move.', 'No: correct alpha–beta pruning returns the same minimax result; it only skips branches that cannot affect the final decision.', 'Yes, unless the moves are perfectly ordered.', 'No, because alpha–beta evaluates every leaf anyway.'], answer: 1, inline: false },
      ],
      explain: '<p><b>No.</b> Correct alpha–beta pruning returns the <b>same minimax result</b>. It only skips branches that cannot affect the final decision.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'Why move ordering matters', type: 'Conceptual', level: 'Medium', skill: 'practice',
      intro: '<p>Two alpha–beta implementations search the same game tree. Algorithm A examines <b>strong moves first</b>; algorithm B examines <b>weak moves first</b>.</p>',
      parts: [
        { kind: 'mc', pts: 8, q: 'Which statement is correct?', options: ['Algorithm A can usually prune more branches.', 'Algorithm B always returns a better move.', 'Move ordering changes the minimax value.', 'Alpha–beta works only with perfect ordering.'], answer: 0, inline: false },
      ],
      explain: '<p>Good move ordering establishes useful alpha and beta bounds earlier. It can dramatically increase pruning, while leaving the final minimax answer unchanged (try the ordering buttons in the lab’s alpha–beta widget).</p>',
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'Depth-limited game search', type: 'Conceptual', level: 'Medium', skill: 'practice',
      intro: '<p>Suppose minimax stops at <b>depth = 5</b> before reaching terminal positions.</p>',
      parts: [
        { kind: 'mc', pts: 9, q: 'How should the states at depth 5 be scored?', options: ['Random values', 'A heuristic evaluation function', 'BFS depth', 'The alpha value only'], answer: 1, inline: false },
      ],
      explain: '<p>If search reaches a true terminal state, use its actual utility. If search stops at a cutoff depth, use a <b>heuristic evaluation function</b> to estimate how good the state is.</p>',
    },
  ],
};
