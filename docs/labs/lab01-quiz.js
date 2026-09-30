/* ===== Lab 01 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const ALGOS = ['DFS', 'BFS', 'UCS', 'DLS', 'IDS'];
const LAB = 'lab01-uninformed-search.html';

window.QUIZ = {
  id: 'lab01',
  skills: [
    { id: 'terms', label: M`\(b, d, m\) and terminology`, href: LAB + '#concepts' },
    { id: 'complexity', label: 'Complexity', href: LAB + '#summary' },
    { id: 'tracing', label: 'Algorithm tracing', href: LAB + '#bfs' },
    { id: 'dls', label: 'DLS and depth limits', href: LAB + '#dls' },
    { id: 'tradeoffs', label: 'Algorithm trade-offs', href: LAB + '#summary' },
    { id: 'ds', label: 'Data structures', href: LAB + '#summary' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: M`Identify \(b\), \(d\) and \(m\)`, type: 'Visual · multiple choice', level: 'Easy', skill: 'terms',
      intro: '<p>Consider the following search tree. Suppose <b>G is the shallowest goal state</b>.</p>',
      figure: { tree: 'S(A(D(J,K),E),B(F,G(L(N)),H),C(I(M)))', goals: ['G'] },
      parts: [
        { kind: 'mc', pts: 5, q: M`What are \(b\) (maximum branching factor), \(d\) (depth of the shallowest solution) and \(m\) (maximum depth of the search tree)?`,
          options: [M`\(b=3,\ d=2,\ m=4\)`, M`\(b=2,\ d=2,\ m=4\)`, M`\(b=3,\ d=3,\ m=4\)`, M`\(b=3,\ d=2,\ m=5\)`], answer: 0, inline: false },
      ],
      explain: M`<ul class="concept-list"><li>The largest number of children of any node is 3 (S and B), so \(b=3\).</li><li>G is at depth 2, so \(d=2\).</li><li>N is at depth 4, so \(m=4\).</li></ul>`,
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'Complexity matching', type: 'Matching', level: 'Easy', skill: 'complexity',
      intro: '<p>Match each algorithm with its worst-case time complexity.</p>',
      parts: [
        { kind: 'rows', pts: 8, q: 'Worst-case time complexity', options: [M`\(O(b^d)\)`, M`\(O(b^m)\)`, M`\(O(b^{d+1})\)`, M`\(O(b^l)\)`],
          rows: [{ label: '<b>DFS</b>', answer: 1 }, { label: '<b>BFS</b>', answer: 2 }, { label: '<b>DLS</b>', answer: 3 }, { label: '<b>IDS</b>', answer: 0 }] },
        { kind: 'multi', pts: 2, q: 'Follow-up: which algorithms have linear-in-depth rather than exponential memory usage?', options: ALGOS, answer: [0, 3, 4] },
      ],
      explain: M`<p>DFS, DLS and IDS. Typical space complexities:</p><ul class="concept-list"><li><b>DFS</b>: \(O(bm)\)</li><li><b>DLS</b>: \(O(bl)\)</li><li><b>IDS</b>: \(O(bd)\)</li><li><b>BFS</b> (and UCS): exponential in the solution depth.</li></ul>`,
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'BFS traversal', type: 'Algorithm tracing', level: 'Easy–Medium', skill: 'tracing',
      intro: '<p><b>G is the goal state.</b> Assume children are inserted left-to-right.</p>',
      figure: { tree: 'S(A(C(G,H),D),B(E(I,J),F))', goals: ['G'] },
      parts: [
        { kind: 'seq', pts: 4, q: 'In what order does BFS expand nodes? Include G, the node where the goal test succeeds.', label: 'Order', answer: ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] },
        { kind: 'seq', pts: 2, q: 'What path does BFS return?', label: 'Path', placeholder: 'Click the path from S to G…', answer: ['S', 'A', 'C', 'G'] },
        { kind: 'mc', pts: 2, q: 'Follow-up: would BFS still necessarily return the cheapest solution if edges had different costs?', options: ['Yes', 'No'], answer: 1, letters: false },
      ],
      explain: '<p>BFS is optimal when all step costs are equal. With different edge costs, <b>UCS</b> is the appropriate uninformed algorithm for finding the cheapest solution.</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'DFS vs BFS', type: 'Visual comparison', level: 'Medium', skill: 'tracing',
      intro: '<p>G is a goal. Children are explored left-to-right.</p>',
      figure: { tree: 'S(A(C(E(F(H)))),B(D,G))', goals: ['G'] },
      parts: [
        { kind: 'mc', pts: 2, q: 'Which algorithm reaches G first (after fewer node expansions)?', options: ['BFS', 'DFS'], answer: 0, letters: false },
        { kind: 'seq', pts: 3, q: 'BFS: node-expansion order until G is reached (include G).', label: 'BFS', answer: ['S', 'A', 'B', 'C', 'D', 'G'] },
        { kind: 'seq', pts: 3, q: 'DFS: node-expansion order until G is reached (include G).', label: 'DFS', answer: ['S', 'A', 'C', 'E', 'F', 'H', 'B', 'D', 'G'] },
      ],
      explain: '<p>BFS: S → A → B → C → D → G. DFS: S → A → C → E → F → H → B → D → G.</p><p>DFS may spend significant time exploring a deep irrelevant branch even when a goal exists at a shallow depth.</p>',
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'Depth-limited search', type: 'Visual + reasoning', level: 'Medium', skill: 'dls',
      intro: '<p>G is the only goal.</p>',
      figure: { tree: 'S(A(C,D(H(G))),B(E,F(I)))', goals: ['G'], depths: true },
      parts: [
        { kind: 'rows', pts: 6, q: 'What happens for each call?', options: ['Finds G', 'Cutoff without finding G', 'Failure'],
          rows: [{ label: M`\(\text{DLS}(S,\ \text{limit}=2)\)`, answer: 1 }, { label: M`\(\text{DLS}(S,\ \text{limit}=3)\)`, answer: 1 }, { label: M`\(\text{DLS}(S,\ \text{limit}=4)\)`, answer: 0 }] },
        { kind: 'mc', pts: 2, q: 'What is the minimum useful depth limit?', options: [M`\(l=2\)`, M`\(l=3\)`, M`\(l=4\)`, M`\(l=5\)`], answer: 2 },
      ],
      explain: M`<p>G is at depth 4, so limits 2 and 3 stop before reaching it. Those runs end in a <b>cutoff</b>, not a failure: nodes at the limit still had children that were never generated, so DLS cannot claim that no solution exists. The minimum useful limit is \(l=4\).</p>`,
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'Pick the smallest useful DLS limit', type: 'Quick visual', level: 'Medium', skill: 'dls',
      intro: '<p>You know the goal is <b>G</b>.</p>',
      figure: { tree: 'S(A(C,D(H,I(G))),B(E,F(J,K)))', goals: ['G'] },
      parts: [
        { kind: 'mc', pts: 4, q: M`What is the smallest depth limit \(l\) that allows DLS to find it?`, options: ['2', '3', '4', '5'], answer: 2 },
        { kind: 'mc', pts: 3, q: 'Follow-up: suppose you do <b>not</b> know the goal depth. You know only that the solution is finite, and memory is limited. Which is more appropriate?',
          options: ['BFS', 'DFS', M`DLS with \(l=2\)`, 'IDS'], answer: 3 },
      ],
      explain: M`<p>G is at depth 4 (S → A → D → I → G), so \(l=4\). With an unknown goal depth and limited memory, <b>IDS</b> tries \(l = 0, 1, 2, \dots\) and keeps DFS-like memory.</p>`,
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'Iterative deepening simulation', type: 'Tracing', level: 'Medium', skill: 'tracing',
      intro: M`<p>The goal is G. IDS starts with \(l=0\). Write which nodes are visited during each iteration until G is found. Assume left-to-right DFS.</p>`,
      figure: { tree: 'S(A(C,D(G)),B(E,F(H)))', goals: ['G'] },
      parts: [
        { kind: 'seq', pts: 1, q: M`Iteration \(l=0\)`, label: 'l = 0', answer: ['S'] },
        { kind: 'seq', pts: 1, q: M`Iteration \(l=1\)`, label: 'l = 1', answer: ['S', 'A', 'B'] },
        { kind: 'seq', pts: 2, q: M`Iteration \(l=2\)`, label: 'l = 2', answer: ['S', 'A', 'C', 'D', 'B', 'E', 'F'] },
        { kind: 'seq', pts: 2, q: M`Iteration \(l=3\) (stop at G)`, label: 'l = 3', answer: ['S', 'A', 'C', 'D', 'G'] },
        { kind: 'mc', pts: 2, q: 'Follow-up: IDS repeatedly visits nodes such as S and A. Why is this still often efficient?',
          options: [
            'Most nodes of a tree are at the deepest explored level, so re-expanding the few nodes near the top adds limited overhead.',
            'IDS caches the nodes of the previous iteration, so they are not generated again.',
            'Only the root is visited more than once.',
            'Repeated nodes are skipped by the goal test, so they cost nothing.',
          ], answer: 0 },
      ],
      explain: M`<p>Most nodes in a tree are concentrated near the deepest explored level, so re-expanding the relatively small number of nodes near the top usually adds limited overhead. IDS combines BFS-like behaviour for shallow solutions with DFS-like memory usage: time \(O(b^d)\), space \(O(bd)\).</p>`,
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'BFS or UCS?', type: 'Weighted graph', level: 'Medium', skill: 'tradeoffs',
      intro: '<p>There are two paths to the goal: <b>S → G</b> with cost 10, and <b>S → A → B → G</b> with cost 2 + 2 + 2 = 6.</p>',
      figure: { nodes: { S: [80, 50], A: [380, 50], B: [380, 190], G: [80, 300] }, edges: [['S', 'A', 2], ['A', 'B', 2], ['B', 'G', 2], ['S', 'G', 10]], goals: ['G'], w: 460, h: 350, alt: 'Weighted graph' },
      parts: [
        { kind: 'rows', pts: 6, q: 'Choose the path for each question.', options: ['S → G', 'S → A → B → G'],
          rows: [{ label: 'Which path does <b>BFS</b> return?', answer: 0 }, { label: 'Which path does <b>UCS</b> return?', answer: 1 }, { label: 'Which one is optimal with respect to total path cost?', answer: 1 }] },
      ],
      explain: '<p>BFS returns S → G (cost 10); UCS returns S → A → B → G (cost 6), the least-cost solution. Do not confuse the shortest path in number of edges with the cheapest path in total cost: BFS minimizes the number of steps (optimal only when all actions cost the same), UCS minimizes accumulated path cost.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'Simulate UCS frontier priorities', type: 'Algorithm tracing', level: 'Medium–Hard', skill: 'tracing',
      intro: '<p>Some relevant paths are:</p><ul class="concept-list"><li>S → B → D → G = 1 + 2 + 2 = 5</li><li>S → A → C → G = 4 + 1 + 2 = 7</li><li>S → B → G = 1 + 6 = 7</li><li>S → A → G = 4 + 8 = 12</li></ul>',
      figure: { nodes: { S: [220, 40], B: [115, 130], A: [325, 130], D: [40, 245], C: [400, 245], G: [220, 335] },
        edges: [['S', 'B', 1], ['S', 'A', 4], ['B', 'D', 2], ['B', 'G', 6], ['A', 'C', 1], ['A', 'G', 8], ['D', 'G', 2], ['C', 'G', 2]], goals: ['G'], w: 440, h: 375, alt: 'Weighted graph' },
      parts: [
        { kind: 'mc', pts: 4, q: 'Which solution will UCS return?', options: [M`\(S \rightarrow A \rightarrow G\)`, M`\(S \rightarrow B \rightarrow G\)`, M`\(S \rightarrow A \rightarrow C \rightarrow G\)`, M`\(S \rightarrow B \rightarrow D \rightarrow G\)`], answer: 3, inline: false },
        { kind: 'mc', pts: 2, q: 'Follow-up: when UCS expands B it generates G with cost 7. Why should UCS not stop as soon as a goal is generated?',
          options: [
            'Another frontier path may still lead to a cheaper goal; UCS stops when the goal is selected from the priority queue with the minimum path cost.',
            'Generated nodes cannot be goal-tested at all.',
            'UCS must expand every node of the graph before it returns.',
            'The first generated goal is always the deepest one.',
          ], answer: 0 },
      ],
      explain: '<p>UCS returns <b>S → B → D → G</b> with total cost 5. It should not stop when G is first generated (cost 7 via B), because another frontier path may still lead to a cheaper goal. Under the standard assumptions, UCS stops when the goal is <i>selected</i> from the priority queue with the minimum accumulated path cost.</p>',
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'Infinite-depth trap', type: 'Algorithm-selection reasoning', level: 'Hard', skill: 'tradeoffs',
      intro: '<p>The left branch continues <b>forever</b>. Children are explored left-to-right.</p>',
      figure: { tree: 'S(A(C(E(F(…)))),B(D(G)))', goals: ['G'], dx: 120, alt: 'Search tree with an infinite left branch' },
      parts: [
        { kind: 'mc', pts: 3, q: 'What happens with ordinary DFS?', options: ['It eventually finds G.', 'It may never find G.', 'It finds G optimally.', 'DFS automatically switches branches after a fixed depth.'], answer: 1, inline: false },
        { kind: 'mc', pts: 3, q: 'Follow-up: which algorithm is appropriate if every action has cost 1, the solution has finite but unknown depth, and memory is limited?', options: ALGOS, answer: 4 },
      ],
      explain: '<p>DFS keeps descending the infinite left branch and may never find G. With unit costs, a finite but unknown solution depth and limited memory, <b>IDS</b> is the right choice: complete, optimal for unit costs, and linear memory.</p>',
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'Choose the algorithm from the scenario', type: 'Algorithm selection', level: 'Hard', skill: 'tradeoffs',
      intro: '<p>For each scenario, select one algorithm.</p>',
      parts: [
        { kind: 'rows', pts: 10, q: 'Scenarios', options: ALGOS,
          rows: [
            { label: '<b>A.</b> You are solving a puzzle where every action costs exactly 1. You need the solution requiring the <b>fewest actions</b>, and you have plenty of memory.', answer: 1 },
            { label: '<b>B.</b> Every action has a different positive cost. You need the <b>cheapest solution</b>.', answer: 2 },
            { label: '<b>C.</b> You know beforehand that no useful solution can occur below depth 20. Memory is very limited and optimality is not required.', answer: 3 },
            { label: '<b>D.</b> Step costs are equal. The solution depth is unknown. The tree may be very deep and memory is severely limited. You still want the shallowest solution.', answer: 4 },
            { label: '<b>E.</b> The state space is finite, memory is extremely limited, and <b>any solution is acceptable</b>.', answer: 0 },
          ] },
      ],
      explain: M`<p>A → <b>BFS</b>, B → <b>UCS</b>, C → <b>DLS</b> with \(l=20\), D → <b>IDS</b>, E → <b>DFS</b>.</p><p>Algorithm selection should be based on completeness, optimality, time and memory complexity, whether edge costs are equal, whether the solution depth is known, and whether the search space can be infinite.</p>`,
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'Challenge: reject the tempting algorithm', type: 'Conceptual · scenario', level: 'Hard', skill: 'tradeoffs',
      intro: '<p>A robot must find a path from S to G. Candidate paths: <b>S → B → G</b> (cost 5, depth 2) and <b>S → A → C → D → G</b> (cost 4, depth 4).</p><blockquote class="qz-quote">“We should use BFS because G can be reached at depth 2, so BFS gives the optimal solution.”</blockquote>',
      figure: { nodes: { S: [210, 40], A: [90, 120], C: [90, 200], D: [90, 280], B: [330, 190], G: [210, 340] },
        edges: [['S', 'A', 1], ['A', 'C', 1], ['C', 'D', 1], ['D', 'G', 1], ['S', 'B', 4], ['B', 'G', 1]], goals: ['G'], w: 420, h: 380, alt: 'Weighted graph' },
      parts: [
        { kind: 'mc', pts: 4, q: 'Is the student’s reasoning correct?',
          options: ['Yes, BFS is always optimal.', 'Yes, because depth 2 is smaller than depth 4.', 'No, BFS minimizes number of actions, not arbitrary path cost.', 'No, because DFS is always better for weighted graphs.'], answer: 2, inline: false },
        { kind: 'mc', pts: 2, q: 'Which uninformed search algorithm returns the least-cost path here?', options: ALGOS, answer: 2 },
        { kind: 'rows', pts: 2, q: 'What is the cost of the path each algorithm returns?', options: ['4', '5'],
          rows: [{ label: '<b>BFS</b>', answer: 1 }, { label: '<b>UCS</b>', answer: 0 }] },
      ],
      explain: '<p>BFS returns S → B → G (cost 5) because it has fewer actions. The correct cost-sensitive uninformed search algorithm here is <b>UCS</b>, which returns S → A → C → D → G with cost 4.</p>',
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: 'Complexity under changing parameters', type: 'Complexity reasoning', level: 'Medium–Hard', skill: 'complexity',
      intro: M`<p>Suppose \(b = 2\), \(d = 10\), \(m = 100\), and consider DFS: \(O(b^m)\), BFS: \(O(b^{d+1})\), IDS: \(O(b^d)\).</p>`,
      parts: [
        { kind: 'mc', pts: 3, q: 'Which parameter makes DFS potentially much worse than BFS and IDS in this case?', options: [M`\(b\)`, M`\(d\)`, M`\(m\)`, 'Number of goal states'], answer: 2 },
        { kind: 'mc', pts: 2, q: M`Follow-up: now suppose \(m = d = 10\). Does this mean DFS becomes optimal?`, options: ['Yes', 'No'], answer: 1, letters: false },
      ],
      explain: M`<p>\(2^{100}\) versus \(2^{11}\): the maximum depth \(m\) dominates DFS's worst case. A smaller maximum depth does not give DFS an optimality guarantee. This distinguishes complexity from algorithmic properties such as optimality.</p>`,
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'Identify the algorithm from its frontier', type: 'Visual · identify algorithm', level: 'Medium', skill: 'ds',
      parts: [
        { kind: 'mc', pts: 1, q: '<b>Case A.</b> Which search strategy naturally uses this structure?',
          html: '<div class="qz-frontier"><small>remove A (added first) ←</small><span class="chip out">A</span><span class="chip">B</span><span class="chip">C</span><span class="chip">D</span><small>← new nodes</small></div>',
          options: ALGOS, answer: 1 },
        { kind: 'multi', pts: 2, q: '<b>Case B.</b> Which uninformed search strategies naturally use this structure?',
          html: '<div class="qz-frontier"><span class="chip">A</span><span class="chip">B</span><span class="chip">C</span><span class="chip out">D</span><small>← remove D (added last)</small></div>',
          options: ALGOS, answer: [0, 3, 4] },
        { kind: 'mc', pts: 2, q: '<b>Case C.</b> Which algorithm uses this frontier organization?',
          html: '<table class="qz-pq"><thead><tr><th>Node</th><th>Path cost</th></tr></thead><tbody><tr class="out"><td>C</td><td>2</td></tr><tr><td>A</td><td>5</td></tr><tr><td>D</td><td>7</td></tr><tr><td>B</td><td>11</td></tr></tbody></table><p class="qz-fr-note">Remove C.</p>',
          options: ALGOS, answer: 2 },
      ],
      explain: '<ul class="concept-list"><li><b>Case A — BFS</b>: a FIFO queue.</li><li><b>Case B — DFS, DLS and IDS</b>: stack-like LIFO behaviour during each depth-first iteration.</li><li><b>Case C — UCS</b>: a priority queue ordered by accumulated path cost.</li></ul>',
    },
  ],
};
