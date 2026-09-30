/* ===== Lab 02 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab02-informed-search.html';
const ALGOS = ['Greedy', 'Beam Search', 'Hill Climbing', 'A*', 'IDA*', 'Simulated Annealing'];
const YN = { options: ['Yes', 'No'], letters: false };
const board = (label, cells) => `<div><p class="puzzle-label">${label}</p><div class="puzzle-board">${cells.map(c => `<div class="puzzle-tile${c ? '' : ' blank'}">${c || ''}</div>`).join('')}</div></div>`;

window.QUIZ = {
  id: 'lab02',
  skills: [
    { id: 'ghf', label: M`\(g, h, f\) fundamentals`, href: LAB + '#heuristics' },
    { id: 'local', label: 'Greedy, Beam Search, Hill Climbing', href: LAB + '#greedy' },
    { id: 'sa', label: 'Simulated Annealing', href: LAB + '#annealing' },
    { id: 'astar', label: 'A* tracing', href: LAB + '#astar' },
    { id: 'adm', label: 'Admissibility and consistency', href: LAB + '#astar' },
    { id: 'heur', label: 'Heuristic construction and dominance', href: LAB + '#choosing' },
    { id: 'ida', label: 'IDA*', href: LAB + '#ida' },
    { id: 'select', label: 'Complexity and algorithm selection', href: LAB + '#summary' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: M`Identify \(g(n)\), \(h(n)\) and \(f(n)\)`, type: 'Basic calculation', level: 'Easy', skill: 'ghf',
      intro: M`<p>Suppose A* has reached node \(N\). The heuristic estimate from \(N\) to the goal is \(h(N) = 4\).</p>`,
      figure: { nodes: { S: [40, 45], A: [190, 45], N: [340, 45] }, edges: [['S', 'A', 2], ['A', 'N', 3]], notes: { N: 'h=4' }, w: 420, h: 90, alt: 'Path S to A to N' },
      parts: [
        { kind: 'mc', pts: 3, q: M`What are \(g(N)\), \(h(N)\) and \(f(N)\)?`, options: [M`\(g=4,\ h=5,\ f=9\)`, M`\(g=5,\ h=4,\ f=9\)`, M`\(g=5,\ h=4,\ f=20\)`, M`\(g=2,\ h=3,\ f=4\)`], answer: 1, inline: false },
      ],
      explain: M`<p>\(g(N) = 2 + 3 = 5\), \(h(N) = 4\), \(f(N) = g(N) + h(N) = 9\).</p><p>A* does <b>not</b> choose nodes using only \(h(n)\). It combines the cost already paid and the estimated cost remaining.</p>`,
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'Trace greedy best-first search', type: 'Visual tracing', level: 'Easy–Medium', skill: 'local',
      intro: '<p>Heuristic values are shown next to the nodes; edge costs are on the edges.</p>',
      figure: { nodes: { S: [200, 40], A: [90, 150], B: [310, 150], C: [310, 260], G: [90, 340] }, edges: [['S', 'A', 2], ['S', 'B', 1], ['A', 'G', 4], ['B', 'C', 10], ['C', 'G', 10]],
        notes: { A: 'h=5', B: 'h=1', C: 'h=1', G: 'h=0' }, goals: ['G'], w: 400, h: 380, alt: 'Weighted graph with heuristic values' },
      parts: [
        { kind: 'seq', pts: 2, q: 'Which path will Greedy Best-First Search follow?', label: 'Greedy', placeholder: 'Click the path from S to G…', answer: ['S', 'B', 'C', 'G'] },
        { kind: 'num', pts: 2, q: 'What is the cost of that path?', answer: 21 },
        { kind: 'seq', pts: 2, q: 'What is the cheaper path?', label: 'Cheaper', placeholder: 'Click the path from S to G…', answer: ['S', 'A', 'G'] },
      ],
      explain: M`<p>Greedy always prefers the frontier node with the smallest heuristic, so it follows S → B → C → G with cost \(1 + 10 + 10 = 21\). The cheaper path is S → A → G with cost \(2 + 4 = 6\).</p><p>Greedy search uses only \(h(n)\) and ignores how expensive the path has already been. Therefore, it is <b>not optimal</b>.</p>`,
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Greedy vs. A*', type: 'Identify the priority rule', level: 'Easy', skill: 'ghf',
      intro: M`<p>A frontier currently contains:</p><table class="qz-pq"><thead><tr><th>Node</th><th>\(g(n)\)</th><th>\(h(n)\)</th></tr></thead><tbody><tr><td>A</td><td>8</td><td>1</td></tr><tr><td>B</td><td>3</td><td>4</td></tr><tr><td>C</td><td>1</td><td>7</td></tr></tbody></table>`,
      parts: [
        { kind: 'rows', pts: 6, q: 'Which node is selected next by…', options: ['A', 'B', 'C'],
          rows: [{ label: '<b>Greedy Best-First Search</b>', answer: 0 }, { label: '<b>A*</b>', answer: 1 }] },
      ],
      explain: M`<p><b>Greedy</b> uses only \(h(n)\): A has \(h = 1\), so it selects <b>A</b>. <b>A*</b> uses \(f(n) = g(n) + h(n)\): \(f(A) = 9\), \(f(B) = 7\), \(f(C) = 8\), so it selects <b>B</b>.</p><p>Greedy asks “which node looks closest to the goal?”; A* asks “which node gives the best estimated total path cost?”</p>`,
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'Beam search with width 2', type: 'Visual reasoning', level: 'Medium', skill: 'local',
      intro: M`<p>Beam Search uses beam width \(l = 2\). Heuristic values are shown next to the nodes.</p>`,
      figure: { tree: 'S(A(D),B(G),C(E))', notes: { A: 'h=2', B: 'h=4', C: 'h=1', D: 'h=2', G: 'h=0', E: 'h=1' }, goals: ['G'], dx: 110, alt: 'Search tree with heuristic values' },
      parts: [
        { kind: 'multi', pts: 2, q: 'After expanding S, which nodes remain in the beam?', options: ['A', 'B', 'C'], answer: [0, 2], letters: false },
        { kind: 'mc', pts: 1, q: M`Can Beam Search with \(l = 2\) find G in this example?`, ...YN, answer: 1 },
        { kind: 'num', pts: 2, q: 'What minimum beam width would keep all three first-level alternatives?', prefix: M`\(l =\)`, answer: 3 },
      ],
      explain: M`<p>Beam Search keeps only the two nodes with the lowest heuristic values, C (1) and A (2); B (4) is permanently discarded. The only path to G goes through B, so G can never be found. With \(l = 3\) all three first-level alternatives survive.</p><p>Beam Search saves memory by permanently throwing away less promising states. That means it is <b>not complete</b> and <b>not optimal</b>.</p>`,
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'Where does hill climbing stop?', type: 'Optimization landscape', level: 'Medium', skill: 'local',
      intro: '<p>For this task, <b>higher score is better</b>; the scores are shown next to the nodes. Hill Climbing always moves to the best neighbouring state if that neighbour improves the current score.</p>',
      figure: { tree: 'S(A(C(E,F),D),B(G))', notes: { S: '5', A: '7', B: '6', C: '8', D: '6', E: '7', F: '7', G: '10' }, dx: 90, alt: 'Tree of states with scores' },
      parts: [
        { kind: 'seq', pts: 3, q: 'What path does Hill Climbing take from S? End with the state where it stops.', label: 'Path', answer: ['S', 'A', 'C'] },
        { kind: 'mc', pts: 1, q: 'The state where Hill Climbing stops is…', options: ['the global maximum', 'a local maximum, not the global one', 'a plateau', 'the goal G'], answer: 1, inline: false },
      ],
      explain: '<p>Path: S (5) → A (7) → C (8). At C, both neighbours have score 7, which is worse than 8, so Hill Climbing stops at C. However, G (10) is better: C is a <b>local maximum</b>, not the global maximum.</p><p>Hill Climbing keeps only one current candidate and does not backtrack.</p>',
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'Why random restart helps', type: 'Conceptual', level: 'Medium', skill: 'local',
      intro: '<p>Suppose Hill Climbing repeatedly reaches different local maxima depending on its starting state.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What is the purpose of <b>random-restart hill climbing</b>?',
          options: ['To make the heuristic admissible', 'To explore the same path repeatedly', 'To start from different states and reduce the chance of remaining stuck at a poor local optimum', 'To turn Hill Climbing into BFS'], answer: 2, inline: false },
      ],
      explain: '<p>A single hill-climbing run can get trapped. Random restarts give the algorithm opportunities to climb from different regions of the search space.</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'Simulated annealing', type: 'Calculation + interpretation', level: 'Medium', skill: 'sa',
      intro: M`<p>A proposed move is worse than the current state by \(\Delta = 2\). The current temperature is \(T = 2\). The acceptance probability is \(P = \exp(-\Delta / T)\).</p>`,
      parts: [
        { kind: 'num', pts: 3, q: 'Approximately what is the probability of accepting the worse move? Give it to two decimal places (a percentage also works).', prefix: M`\(P \approx\)`, answer: 0.368, tol: 0.006, pct: true, show: M`\(e^{-1} \approx 0.368\) (36.8%)` },
        { kind: 'mc', pts: 2, q: 'What happens if the temperature becomes very small?',
          options: ['Worse moves are accepted more and more often.', 'Worse moves become increasingly unlikely to be accepted, and simulated annealing behaves like hill climbing.', 'The search turns into a random walk.', 'The acceptance probability no longer depends on Δ.'], answer: 1, inline: false },
      ],
      explain: M`<p>\(P = e^{-1} \approx 0.368\), about a 36.8% chance. As \(T \rightarrow 0\), worse moves become increasingly unlikely to be accepted, and simulated annealing behaves more like ordinary hill climbing.</p><p>Accepting occasional bad moves allows simulated annealing to escape local optima.</p>`,
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'Trace A*', type: 'A* tracing', level: 'Medium–Hard', skill: 'astar',
      intro: '<p>Heuristic values are shown beside the nodes. Relevant path costs are:</p><ul class="concept-list"><li>S → A → C → G = 10</li><li>S → A → D → G = 10</li><li>S → B → D → G = 8</li><li>S → B → E → G = 9</li></ul>',
      figure: { nodes: { S: [220, 40], A: [110, 140], B: [330, 140], C: [40, 250], D: [220, 250], E: [400, 250], G: [220, 360] },
        edges: [['S', 'A', 2], ['S', 'B', 4], ['A', 'C', 2], ['A', 'D', 5], ['B', 'D', 1], ['B', 'E', 3], ['C', 'G', 6], ['D', 'G', 3], ['E', 'G', 2]],
        notes: { S: 'h=7', A: 'h=7', B: 'h=3', C: 'h=4', D: 'h=2', E: 'h=2', G: 'h=0' }, goals: ['G'], w: 470, h: 400, alt: 'Weighted graph with heuristic values' },
      parts: [
        { kind: 'seq', pts: 7, q: 'In what order does A* expand nodes? Include G, the node where the goal test succeeds.', label: 'Order', answer: ['S', 'B', 'D', 'G'] },
        { kind: 'num', pts: 2, q: 'What is \\(f(D)\\) when D is generated from B?', prefix: M`\(f(D) =\)`, answer: 7 },
        { kind: 'mc', pts: 4, q: 'Which path will A* return?', options: ['S → A → C → G', 'S → A → D → G', 'S → B → D → G', 'S → B → E → G'], answer: 2, inline: false },
      ],
      explain: M`<p>From S: A has \(g = 2, h = 7, f = 9\); B has \(g = 4, h = 3, f = 7\). Choose <b>B</b>. From B: D has \(g = 5, h = 2, f = 7\); E has \(g = 7, h = 2, f = 9\). Choose <b>D</b>. From D: G has \(g = 8, h = 0, f = 8\), still the smallest f on the frontier (A and E have 9), so G is selected.</p><p>A* returns S → B → D → G with cost 8, which is the optimal path in this graph.</p>`,
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'Is the heuristic admissible?', type: 'Heuristic analysis', level: 'Medium', skill: 'adm',
      intro: M`<p>Suppose the true remaining costs \(h^*(n)\) and heuristic values \(h(n)\) are:</p><table class="qz-pq"><thead><tr><th>Node</th><th>\(h(n)\)</th><th>\(h^*(n)\)</th></tr></thead><tbody><tr><td>S</td><td>7</td><td>8</td></tr><tr><td>A</td><td>6</td><td>6</td></tr><tr><td>B</td><td>5</td><td>4</td></tr><tr><td>C</td><td>1</td><td>2</td></tr><tr><td>G</td><td>0</td><td>0</td></tr></tbody></table>`,
      parts: [
        { kind: 'multi', pts: 4, q: 'Which nodes, if any, break admissibility?', options: ['S', 'A', 'B', 'C', 'G', 'None'], none: 5, answer: [2], letters: false },
      ],
      explain: M`<p>Only <b>B</b>. For an admissible heuristic, \(h(n) \leq h^*(n)\) must hold for <b>every node</b>. But for B, \(h(B) = 5 > 4 = h^*(B)\): the heuristic overestimates the true cost, so it is not admissible.</p>`,
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'Admissibility and consistency', type: 'Heuristic reasoning', level: 'Hard', skill: 'adm',
      intro: M`<p>The true cheapest costs to G are \(h^*(S) = 5\), \(h^*(A) = 5\), \(h^*(B) = 2\), \(h^*(G) = 0\).</p>`,
      figure: { nodes: { S: [200, 40], A: [80, 160], B: [320, 160], G: [200, 280] }, edges: [['S', 'A', 2], ['S', 'B', 3], ['A', 'G', 5], ['B', 'G', 2]],
        notes: { S: 'h=5', A: 'h=4', B: 'h=1', G: 'h=0' }, goals: ['G'], w: 400, h: 320, alt: 'Weighted graph with heuristic values' },
      parts: [
        { kind: 'mc', pts: 1, q: 'Is the heuristic admissible?', ...YN, answer: 0 },
        { kind: 'mc', pts: 3, id: 'edge', q: M`Which edge, if any, violates the consistency condition \(h(n) \leq c(n, n') + h(n')\)?`, options: ['S → A', 'S → B', 'A → G', 'B → G', 'None'], answer: 1 },
      ],
      explain: M`<p><b>Admissible: yes</b> — \(h(S) = 5 \leq 5\), \(h(A) = 4 \leq 5\), \(h(B) = 1 \leq 2\), \(h(G) = 0 \leq 0\).</p><p><b>Consistent: no</b> — on the edge S → B we need \(5 \leq 3 + 1\), but \(5 > 4\). The other edges pass: S → A: \(5 \leq 2 + 4\), A → G: \(4 \leq 5 + 0\), B → G: \(1 \leq 2 + 0\).</p><p>Consistency is a stronger requirement: a consistent heuristic is admissible, but an admissible heuristic does not have to be consistent.</p>`,
    },
    /* ---------- 10b: three cases ---------- */
    {
      id: 't10b', title: 'Admissible, consistent, both or neither?', type: 'Case scenarios', level: 'Hard', skill: 'adm',
      intro: M`<p>For each case, decide whether the heuristic is <b>admissible</b> (\(h(n) \leq h^*(n)\) for every node) and whether it is <b>consistent</b> (\(h(n) \leq c(n, n') + h(n')\) for every edge). Edge costs are on the edges; heuristic values are next to the nodes; G is the goal.</p>`,
      parts: [
        { kind: 'rows', pts: 2, id: 'a', q: '<b>Case A</b>', options: ['Yes', 'No'],
          figure: { nodes: { S: [200, 35], A: [90, 115], B: [310, 115], C: [200, 195], G: [310, 275] }, edges: [['S', 'A', 2], ['S', 'B', 4], ['A', 'C', 3], ['B', 'C', 1], ['C', 'G', 2], ['B', 'G', 5]],
            notes: { S: 'h=6', A: 'h=4', B: 'h=3', C: 'h=2', G: 'h=0' }, goals: ['G'], w: 400, h: 310, alt: 'Case A graph' },
          rows: [{ label: 'Is h admissible?', answer: 0 }, { label: 'Is h consistent?', answer: 0 }] },
        { kind: 'rows', pts: 2, id: 'b', q: '<b>Case B</b>', options: ['Yes', 'No'],
          figure: { nodes: { S: [200, 35], A: [90, 125], B: [310, 125], G: [200, 235] }, edges: [['S', 'A', 1], ['S', 'B', 4], ['A', 'B', 2], ['A', 'G', 6], ['B', 'G', 2]],
            notes: { S: 'h=4', A: 'h=5', B: 'h=1', G: 'h=0' }, goals: ['G'], w: 400, h: 270, alt: 'Case B graph' },
          rows: [{ label: 'Is h admissible?', answer: 1 }, { label: 'Is h consistent?', answer: 1 }] },
        { kind: 'rows', pts: 2, id: 'c', q: '<b>Case C</b>', options: ['Yes', 'No'],
          figure: { nodes: { S: [200, 35], A: [90, 115], B: [90, 205], C: [310, 125], G: [200, 285] }, edges: [['S', 'A', 1], ['A', 'B', 1], ['B', 'G', 3], ['S', 'C', 2], ['C', 'G', 4]],
            notes: { S: 'h=4', A: 'h=4', B: 'h=1', C: 'h=3', G: 'h=0' }, goals: ['G'], w: 400, h: 320, alt: 'Case C graph' },
          rows: [{ label: 'Is h admissible?', answer: 0 }, { label: 'Is h consistent?', answer: 1 }] },
      ],
      explain: M`<ul class="concept-list">
        <li><b>Case A — admissible and consistent.</b> True costs: \(h^*(S) = 7\), \(h^*(A) = 5\), \(h^*(B) = 3\) (via C), \(h^*(C) = 2\), so no node overestimates. Every edge passes, e.g. B → C: \(3 \leq 1 + 2\) and S → B: \(6 \leq 4 + 3\).</li>
        <li><b>Case B — neither.</b> The direct edge A → G costs 6, but A → B → G costs only \(2 + 2 = 4\), so \(h^*(A) = 4 < 5 = h(A)\): not admissible. On the edge A → B, \(5 > 2 + 1\): not consistent.</li>
        <li><b>Case C — admissible but not consistent.</b> True costs: \(h^*(S) = 5\), \(h^*(A) = 4\), \(h^*(B) = 3\), \(h^*(C) = 4\), and no node overestimates. But on the edge A → B, \(h(A) = 4 > 1 + 1 = c(A, B) + h(B)\): the estimate drops by 3 over an edge that costs 1.</li>
      </ul><p>A heuristic can be admissible without being consistent (Case C), but a consistent heuristic with \(h(G) = 0\) is always admissible, so “consistent but not admissible” never happens.</p>`,
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'A* tree search vs. graph search', type: 'Conceptual', level: 'Hard', skill: 'adm',
      intro: '<p>Mark each statement as <b>True</b> or <b>False</b>.</p>',
      parts: [
        { kind: 'rows', pts: 6, q: 'Statements', options: ['True', 'False'],
          rows: [
            { label: '1. An admissible heuristic is sufficient for A* tree search to be optimal.', answer: 0 },
            { label: '2. For the standard A* graph-search guarantee, consistency is required.', answer: 0 },
            { label: '3. Every admissible heuristic is automatically consistent.', answer: 1 },
            { label: M`4. Every consistent heuristic is admissible, assuming \(h(G) = 0\).`, answer: 0 },
          ] },
      ],
      explain: '<p>1 True, 2 True, 3 False, 4 True. Course result: A* tree search + admissible heuristic → optimal; A* graph search + consistent heuristic → optimal.</p>',
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'Compute 8-puzzle heuristics', type: 'Visual heuristic calculation', level: 'Medium–Hard', skill: 'heur',
      intro: '<p>Consider the 8-puzzle. Ignore the blank tile when calculating the heuristic.</p><div class="puzzle-row qz-boards">'
        + board('Current state', [2, 8, 3, 1, 6, 4, 7, 0, 5]) + board('Goal state', [1, 2, 3, 4, 5, 6, 7, 8, 0]) + '</div>',
      parts: [
        { kind: 'num', pts: 3, q: 'Hamming distance: how many numbered tiles are misplaced?', prefix: M`\(h_1 =\)`, answer: 6 },
        { kind: 'num', pts: 3, q: 'Manhattan distance: what is the total?', prefix: M`\(h_2 =\)`, answer: 9 },
      ],
      explain: M`<p>Misplaced tiles: 1, 2, 4, 5, 6, 8, so \(h_1 = 6\).</p><p>Manhattan distances: tile 1 → 1, 2 → 1, 3 → 0, 4 → 2, 5 → 2, 6 → 1, 7 → 0, 8 → 2, so \(h_2 = 1 + 1 + 0 + 2 + 2 + 1 + 0 + 2 = 9\).</p><p>For the standard 8-puzzle, both heuristics are admissible and consistent; Manhattan distance is usually more informative.</p>`,
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: 'Heuristic dominance', type: 'Conceptual', level: 'Hard', skill: 'heur',
      intro: M`<p>Suppose \(h_1\) and \(h_2\) are both admissible heuristics and \(h_2(n) \geq h_1(n)\) for every node \(n\).</p>`,
      parts: [
        { kind: 'mc', pts: 2, q: 'Which statement is correct?', options: [M`\(h_1\) dominates \(h_2\)`, M`\(h_2\) dominates \(h_1\)`, 'Neither heuristic can be used by A*', M`\(h_2\) must be inconsistent`], answer: 1 },
        { kind: 'mc', pts: 1, q: M`Follow-up: suppose \(h_a\) and \(h_b\) are admissible, and define \(h(n) = \max(h_a(n), h_b(n))\). Is this new heuristic admissible?`, ...YN, answer: 0 },
      ],
      explain: M`<p>\(h_2\) dominates \(h_1\): its estimates are at least as informed while still remaining admissible. The maximum of two admissible heuristics is admissible too: it remains a lower bound while dominating each individual heuristic.</p>`,
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'IDA* thresholds', type: 'Visual tracing', level: 'Hard', skill: 'ida',
      intro: M`<p>Each node is labelled with its value \(f(n) = g(n) + h(n)\). G is the goal. IDA* begins with threshold 4. A node is pruned whenever \(f(n) > \text{threshold}\) (before its goal test), and the next threshold is the smallest pruned f-value.</p>`,
      figure: { tree: 'S(A(C,D),B(E,F(G)))', notes: { S: 'f=4', A: 'f=6', B: 'f=5', C: 'f=8', D: 'f=7', E: 'f=9', F: 'f=6', G: 'f=7' }, goals: ['G'], dx: 96, alt: 'Search tree with f-values' },
      parts: [
        { kind: 'num', pts: 2, q: 'Iteration 1 uses threshold 4. What threshold does iteration 2 use?', prefix: 'threshold', answer: 5 },
        { kind: 'num', pts: 2, q: 'What threshold does iteration 3 use?', prefix: 'threshold', answer: 6 },
        { kind: 'seq', pts: 3, q: 'In that iteration (threshold 6), which nodes are expanded, in depth-first order?', label: 'Expanded', answer: ['S', 'A', 'B', 'F'] },
        { kind: 'num', pts: 2, q: 'With which threshold does IDA* finally reach G?', prefix: 'threshold', answer: 7 },
      ],
      explain: M`<p><b>Threshold 4</b>: pruned values 6, 5 → next threshold 5. <b>Threshold 5</b>: pruned 6, 9, 6 → next 6. <b>Threshold 6</b>: S, A, B and F are expanded; pruned 8, 7, 9, 7 → next 7. <b>Threshold 7</b>: \(f(G) = 7\), so G can now be reached. Sequence: 4 → 5 → 6 → 7.</p><p>IDA* does <b>not</b> simply increase the threshold by 1: the next threshold is the <b>smallest f-value that was pruned</b> during the previous iteration.</p>`,
    },
    /* ---------- 15 ---------- */
    {
      id: 't15', title: 'Complexity matching', type: 'Matching', level: 'Medium', skill: 'select',
      intro: '<p>Match each algorithm with the time and space complexity used in the course notes.</p>',
      parts: [
        { kind: 'rows', pts: 5, q: 'Time and space complexity',
          options: [M`Time \(O(bm)\), space \(O(b)\)`, M`Time \(O(b^d)\), space \(O(bd)\)`, M`Time \(O(b^m)\), space \(O(b^m)\)`, M`Time \(O(bml)\), space \(O(bl)\)`, M`Time \(O(b^d)\), space \(O(b^d)\)`],
          rows: [{ label: '<b>Greedy</b>', answer: 2 }, { label: '<b>Beam Search</b>', answer: 3 }, { label: '<b>Hill Climbing</b>', answer: 0 }, { label: '<b>A*</b>', answer: 4 }, { label: '<b>IDA*</b>', answer: 1 }] },
      ],
      explain: M`<ul class="concept-list"><li><b>Greedy</b>: \(O(b^m)\) time and space.</li><li><b>Beam Search</b>: \(O(bml)\) time, \(O(bl)\) space.</li><li><b>Hill Climbing</b>: \(O(bm)\) time, \(O(b)\) space.</li><li><b>A*</b>: \(O(b^d)\) time and space.</li><li><b>IDA*</b>: \(O(b^d)\) time, \(O(bd)\) space.</li></ul>`,
    },
    /* ---------- 16 ---------- */
    {
      id: 't16', title: 'Choose the algorithm from the scenario', type: 'Algorithm selection', level: 'Hard', skill: 'select',
      intro: '<p>More than one algorithm may sometimes be plausible, but choose the one that best matches the stated requirement.</p>',
      parts: [
        { kind: 'rows', pts: 6, q: 'Scenarios', options: ALGOS,
          rows: [
            { label: '<b>A.</b> A robot has an admissible heuristic. It must find a <b>least-cost path</b>, and enough memory is available.', answer: 3 },
            { label: '<b>B.</b> You still need an optimal solution, but A* uses too much memory. You have a useful admissible heuristic and can tolerate repeated search.', answer: 4 },
            { label: '<b>C.</b> You are generating candidate sequences. Memory allows only the <b>best 5 candidates</b> to survive at each stage. Losing the globally best solution is acceptable.', answer: 1 },
            { label: '<b>D.</b> You want a quick goal and have a strong heuristic. Optimality is not required.', answer: 0 },
            { label: '<b>E.</b> You are optimizing one current candidate. Memory must be extremely small. You repeatedly move to the best improving neighbour and stop when none improves.', answer: 2 },
            { label: '<b>F.</b> The optimization landscape has many local optima. You want the algorithm to occasionally accept worse moves early in the search.', answer: 5 },
          ] },
      ],
      explain: M`<p>A → <b>A*</b>; B → <b>IDA*</b> (A*-style \(f = g + h\) guidance with depth-first memory); C → <b>Beam Search</b> with \(l = 5\); D → <b>Greedy Best-First Search</b>; E → <b>Hill Climbing</b>; F → <b>Simulated Annealing</b>.</p>`,
    },
    /* ---------- 17 ---------- */
    {
      id: 't17', title: 'Which algorithm produced this frontier?', type: 'Identify the algorithm', level: 'Medium', skill: 'select',
      parts: [
        { kind: 'mc', pts: 1, q: M`<b>Case A.</b> The node with minimum \(h\) is removed first.`, options: ALGOS,
          html: '<table class="qz-pq"><thead><tr><th>Node</th><th>h</th></tr></thead><tbody><tr class="out"><td>A</td><td>2</td></tr><tr><td>B</td><td>5</td></tr><tr><td>C</td><td>7</td></tr></tbody></table>', answer: 0 },
        { kind: 'mc', pts: 1, q: M`<b>Case B.</b> The node with minimum \(f\) is removed first.`, options: ALGOS,
          html: '<table class="qz-pq"><thead><tr><th>Node</th><th>g</th><th>h</th><th>f</th></tr></thead><tbody><tr><td>A</td><td>3</td><td>4</td><td>7</td></tr><tr class="out"><td>B</td><td>5</td><td>1</td><td>6</td></tr><tr><td>C</td><td>2</td><td>7</td><td>9</td></tr></tbody></table>', answer: 3 },
        { kind: 'mc', pts: 1, q: M`<b>Case C.</b> Current beam with \(l = 2\): A (h = 2), B (h = 4). New candidate: C (h = 1). Only two candidates may remain.`, options: ALGOS, answer: 1 },
        { kind: 'mc', pts: 1, q: '<b>Case D.</b> Only one candidate survives after each expansion.', options: ALGOS, answer: 2 },
      ],
      explain: M`<ul class="concept-list"><li><b>Case A — Greedy Best-First Search</b>: ordered by \(h\).</li><li><b>Case B — A*</b>: ordered by \(f = g + h\).</li><li><b>Case C — Beam Search</b>: after inserting C, the two best candidates (C and A) are retained and B is discarded.</li><li><b>Case D — Hill Climbing</b>: it can be viewed as Beam Search with \(l = 1\).</li></ul>`,
    },
    /* ---------- 18 ---------- */
    {
      id: 't18', title: 'Evaluate a proposed heuristic', type: 'Conceptual challenge', level: 'Hard', skill: 'adm',
      intro: '<p>A student proposes this heuristic for route planning:</p><blockquote class="qz-quote">“Take the straight-line distance to the goal and multiply it by 2. This should make A* more aggressive and therefore better.”</blockquote><p>Suppose ordinary straight-line distance is known to be admissible.</p>',
      parts: [
        { kind: 'mc', pts: 2, q: 'What is the main problem with the proposed heuristic?',
          options: ['Multiplication always makes a heuristic consistent', 'It may overestimate the true remaining cost and therefore lose admissibility', M`A* requires \(h(n) = 0\) for every node`, 'Larger heuristic values always guarantee fewer expansions without affecting optimality'], answer: 1, inline: false },
      ],
      explain: M`<p>Multiplying an admissible heuristic by a factor greater than 1 can make \(h(n) > h^*(n)\) for some states, which destroys the admissibility guarantee. A more aggressive heuristic is not automatically a better heuristic if optimality matters.</p>`,
    },
  ],
};
