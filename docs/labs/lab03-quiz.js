/* ===== Lab 03 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab03-csp.html';
const TECH = ['Backtracking', 'MRV', 'LCV', 'Forward Checking', 'Min-Conflicts'];
const YN = { options: ['Yes', 'No'], letters: false };
const RGB = ['Red', 'Green', 'Blue'];
const doms = rows => '<table class="qz-pq"><thead><tr><th>Variable</th><th>Domain</th></tr></thead><tbody>'
  + rows.map(([v, d]) => `<tr><td>${v}</td><td>{${d}}</td></tr>`).join('') + '</tbody></table>';
const code = lines => `<pre class="qz-code">${lines}</pre>`;
// n×n board from queenPosition[col] = row, with row / column indices
const board = pos => {
  const n = pos.length; let h = `<div class="nq-board qz-nq" style="grid-template-columns: repeat(${n + 1}, 2.1rem)"><div class="qz-nq-idx"></div>`;
  for (let c = 0; c < n; c++) h += `<div class="qz-nq-idx">${c}</div>`;
  for (let r = 0; r < n; r++) {
    h += `<div class="qz-nq-idx">${r}</div>`;
    for (let c = 0; c < n; c++) h += `<div class="nq-cell${(r + c) % 2 ? ' dark' : ''}">${pos[c] === r ? '♛' : ''}</div>`;
  }
  return h + '</div>';
};

window.QUIZ = {
  id: 'lab03',
  skills: [
    { id: 'form', label: 'CSP formulation and constraint graphs', href: LAB + '#intro' },
    { id: 'bt', label: 'Backtracking', href: LAB + '#solving' },
    { id: 'heur', label: 'MRV and LCV', href: LAB + '#solving' },
    { id: 'prop', label: 'Forward checking', href: LAB + '#solving' },
    { id: 'mc', label: 'Min-conflicts', href: LAB + '#min-conflicts' },
    { id: 'nq', label: 'N-Queens representation and conflicts', href: LAB + '#nqueens' },
    { id: 'select', label: 'Technique selection', href: LAB + '#solving' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: 'Identify the CSP components', type: 'Fundamentals', level: 'Easy', skill: 'form',
      intro: '<blockquote class="qz-quote">Schedule three exams <b>AI</b>, <b>ML</b> and <b>DB</b> into time slots {1, 2, 3}. AI and ML cannot be at the same time. ML must be before DB.</blockquote>',
      parts: [
        { kind: 'rows', pts: 4, q: 'Classify each part of the problem.', options: ['Variable', 'Domain', 'Constraint'],
          rows: [
            { label: '<code>ML</code>', answer: 0 },
            { label: '<code>{1, 2, 3}</code> for DB', answer: 1 },
            { label: '<code>AI ≠ ML</code>', answer: 2 },
            { label: '<code>ML &lt; DB</code>', answer: 2 },
          ] },
      ],
      explain: '<p><b>Variables</b>: AI, ML, DB. <b>Domains</b>: D(AI) = D(ML) = D(DB) = {1, 2, 3}. <b>Constraints</b>: AI ≠ ML, ML &lt; DB.</p><p>A CSP is defined by variables + domains + constraints.</p>',
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'Read a constraint graph', type: 'Visual · graph reasoning', level: 'Easy', skill: 'form',
      intro: '<p>Each edge means <code>X ≠ Y</code>. Every variable has domain {Red, Green, Blue}.</p>',
      figure: { nodes: { A: [150, 40], B: [60, 150], C: [240, 150], D: [380, 150] }, edges: [['A', 'B'], ['A', 'C'], ['B', 'C'], ['C', 'D']], w: 430, h: 190, alt: 'Constraint graph' },
      parts: [
        { kind: 'multi', pts: 2, q: 'Which variables directly constrain C?', options: ['A', 'B', 'C', 'D'], answer: [0, 1, 3], letters: false },
        { kind: 'mc', pts: 2, id: 'viol', q: 'Assignment: A = Red, B = Green, C = Red, D = Blue. Which constraint, if any, is violated?', options: ['A ≠ B', 'A ≠ C', 'B ≠ C', 'C ≠ D', 'None'], answer: 1 },
      ],
      explain: '<p>C is connected to <b>A, B and D</b>. The assignment is <b>not valid</b>: A and C are connected by an edge but both are Red, so A ≠ C is violated.</p>',
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Classify the constraints', type: 'Matching', level: 'Easy–Medium', skill: 'form',
      parts: [
        { kind: 'rows', pts: 4, q: 'Classify each constraint.', options: ['Unary', 'Binary', 'Higher-order', 'Soft'],
          rows: [
            { label: '<code>X ≠ 2</code>', answer: 0 },
            { label: '<code>X ≠ Y</code>', answer: 1 },
            { label: '<code>X + Y + Z = 10</code>', answer: 2 },
            { label: 'Red is preferred over Green', answer: 3 },
          ] },
      ],
      explain: '<ul class="concept-list"><li><b>Unary</b> constraints involve one variable.</li><li><b>Binary</b> constraints involve two variables.</li><li><b>Higher-order</b> constraints involve three or more variables.</li><li><b>Soft</b> constraints express preferences rather than strict feasibility.</li></ul>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'Is this assignment a solution?', type: 'CSP validation', level: 'Easy–Medium', skill: 'form',
      intro: '<p>Variables A, B, C, D with domain {1, 2, 3}. Constraints: <code>A ≠ B</code>, <code>B ≠ C</code>, <code>C ≠ D</code>, <code>A &lt; D</code>.</p><p>Candidate assignment: A = 1, B = 2, C = 1, D = 3.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Which constraint, if any, is violated?', options: ['A ≠ B', 'B ≠ C', 'C ≠ D', 'A < D', 'None'], answer: 4 },
      ],
      explain: '<p>A ≠ B → 1 ≠ 2 ✓; B ≠ C → 2 ≠ 1 ✓; C ≠ D → 1 ≠ 3 ✓; A &lt; D → 1 &lt; 3 ✓. <b>Yes, the assignment is a valid solution.</b></p>',
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'Trace plain backtracking', type: 'Algorithm tracing', level: 'Medium', skill: 'bt',
      intro: '<p>Variables A, B, C with domain {Red, Green}. Constraints: A ≠ B, B ≠ C, A ≠ C. Variable order A → B → C; value order Red → Green.</p>',
      figure: { nodes: { A: [150, 40], B: [60, 160], C: [240, 160] }, edges: [['A', 'B'], ['B', 'C'], ['A', 'C']], w: 300, h: 200, alt: 'Triangle constraint graph' },
      parts: [
        { kind: 'mc', pts: 5, q: 'With A = Red and B = Green, no value works for C. What does backtracking do next?',
          options: ['It tries C = Blue next, since C has not run out of colours yet.', 'It returns to B; B has no values left, so it goes back to A and tries A = Green.', 'It reports that the CSP has no solution, since C has no legal value.', 'It changes A and C at the same time and checks the constraints again.'], answer: 1, inline: false },
        { kind: 'num', pts: 2, q: 'How many different values does backtracking assign to A before it stops?', answer: 2 },
        { kind: 'mc', pts: 5, q: 'What is the final result?', options: ['A = Red, B = Green, C = Red', 'A = Green, B = Red, C = Green', 'No solution with two colours', 'The search never terminates'], answer: 2, inline: false },
      ],
      explain: '<p>A = Red; B = Red ✗ (conflicts with A), B = Green ✓; C = Red ✗ (A), C = Green ✗ (B). No value works for C → back to B, which has no unused valid value → back to A.</p><p>A = Green; B = Red ✓; C = Red ✗ (B), C = Green ✗ (A). Back to B: B = Green ✗ (A). Again nothing works, and A has no values left. The CSP has <b>no solution</b> with only two colours: a triangle needs three.</p>',
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'Minimum Remaining Values (MRV)', type: 'Heuristic selection', level: 'Easy–Medium', skill: 'heur',
      intro: '<p>After some constraint propagation, the current domains are below. All variables are currently unassigned.</p>' + doms([['A', '1, 2, 3'], ['B', '2'], ['C', '1, 3'], ['D', '1, 2, 3']]),
      parts: [
        { kind: 'mc', pts: 5, q: 'Which variable should MRV select next?', options: ['A', 'B', 'C', 'D'], answer: 1, letters: false },
      ],
      explain: '<p>MRV chooses the variable with the fewest remaining legal values: |D(A)| = 3, |D(B)| = 1, |D(C)| = 2, |D(D)| = 3. So <b>B</b> is the most constrained variable.</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'Least Constraining Value (LCV)', type: 'Heuristic reasoning', level: 'Medium', skill: 'heur',
      intro: '<p>Variable X has domain {Red, Green, Blue} and is connected to Y, Z and W with constraints X ≠ Y, X ≠ Z, X ≠ W. Current domains of the neighbours:</p>' + doms([['Y', 'Red, Green'], ['Z', 'Red, Green'], ['W', 'Red, Blue']]),
      figure: { nodes: { X: [200, 110], Y: [60, 40], Z: [60, 180], W: [340, 110] }, edges: [['X', 'Y'], ['X', 'Z'], ['X', 'W']], w: 400, h: 220, alt: 'X connected to Y, Z and W' },
      parts: [
        { kind: 'num', pts: 2, id: 'red', q: 'How many values are removed from the neighbours’ domains if X = Red?', answer: 3 },
        { kind: 'num', pts: 2, id: 'green', q: '…if X = Green?', answer: 2 },
        { kind: 'num', pts: 2, id: 'blue', q: '…if X = Blue?', answer: 1 },
        { kind: 'mc', pts: 4, q: 'Which value should LCV prefer for X?', options: RGB, answer: 2, letters: false },
      ],
      explain: '<p>X = Red removes Red from Y, Z and W (3 values); X = Green removes Green from Y and Z (2); X = Blue removes Blue only from W (1). LCV prefers <b>X = Blue</b>.</p><p>LCV chooses the value that eliminates the <b>fewest options for neighbouring unassigned variables</b>.</p>',
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'Forward checking', type: 'Domain propagation', level: 'Medium', skill: 'prop',
      intro: '<p>Constraints A ≠ B, A ≠ C, B ≠ C. Initially every domain is {Red, Green, Blue}. Assign <b>A = Red</b>.</p>',
      figure: { nodes: { A: [150, 40], B: [60, 160], C: [240, 160] }, edges: [['A', 'B'], ['B', 'C'], ['A', 'C']], w: 300, h: 200, alt: 'Triangle constraint graph' },
      parts: [
        { kind: 'multi', pts: 3, q: 'After forward checking, what is D(B)?', options: RGB, answer: [1, 2], letters: false },
        { kind: 'multi', pts: 3, q: 'After forward checking, what is D(C)?', options: RGB, answer: [1, 2], letters: false },
        { kind: 'multi', pts: 2, q: 'Now assign <b>B = Green</b>. What is the remaining domain of C?', options: RGB, answer: [2], letters: false },
      ],
      explain: '<p>Red is removed from B and C because both are neighbours of A: D(B) = D(C) = {Green, Blue}. After B = Green, C cannot be Red (because of A) or Green (because of B), so D(C) = {Blue}.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'Forward checking after Y = 2', type: 'Forward checking vs. plain backtracking', level: 'Medium', skill: 'prop',
      intro: '<p>Variables X, Y, Z with domain {1, 2}; constraints X ≠ Y, Y ≠ Z, X ≠ Z. Assign <b>X = 1</b>: forward checking produces D(Y) = {2}, D(Z) = {2}. Now assign <b>Y = 2</b>.</p>',
      parts: [
        { kind: 'multi', pts: 4, q: 'What happens to D(Z)? Select the values left in it.', options: ['1', '2', 'None — the domain is empty'], none: 2, answer: [2], letters: false },
        { kind: 'mc', pts: 3, q: 'What should the algorithm do now?', options: ['Backtrack immediately, before trying to assign Z.', 'Assign Z = 2 anyway and check the constraints afterwards.', 'Restart the search from scratch.', 'Continue with Z; the failure only matters at the end.'], answer: 0, inline: false },
      ],
      explain: '<p>Because Y ≠ Z, the value 2 must be removed from Z, but D(Z) = {2}, so <b>D(Z) = {}</b>. Forward checking detects that the current partial assignment cannot lead to a solution <b>before attempting to assign Z</b>; the algorithm should backtrack immediately.</p>',
    },
    /* ---------- 10 ---------- */
    {
      id: 't12', title: 'Do MRV and LCV guarantee success?', type: 'Conceptual', level: 'Medium', skill: 'heur',
      intro: '<blockquote class="qz-quote">“If I use both MRV and LCV, backtracking will never make a bad choice.”</blockquote>',
      parts: [
        { kind: 'mc', pts: 5, q: 'Is the student’s statement correct?',
          options: ['Yes: together they guarantee that the first branch always leads to a solution.', 'No: they are heuristics; backtracking may still be needed.', 'No: MRV and LCV cannot be used in the same backtracking search.', 'Yes, but only when the constraint graph is a tree without cycles.'], answer: 1, inline: false },
      ],
      explain: '<p><b>No.</b> MRV and LCV are <b>heuristics</b>. They often reduce search, but they do not guarantee that the chosen branch will lead directly to a solution; backtracking may still be necessary.</p>',
    },
    /* ---------- 11 ---------- */
    {
      id: 't13', title: 'One min-conflicts step', type: 'Local search', level: 'Medium', skill: 'mc',
      intro: '<p>All-different CSP: variables A, B, C with domain {1, 2, 3}; constraints A ≠ B, A ≠ C, B ≠ C. Current complete assignment: <b>A = 1, B = 1, C = 2</b>. B is selected as a conflicted variable.</p>',
      parts: [
        { kind: 'rows', pts: 3, q: 'How many constraints does B violate for each value?', options: ['0', '1', '2'],
          rows: [{ label: 'B = 1', answer: 1 }, { label: 'B = 2', answer: 1 }, { label: 'B = 3', answer: 0 }] },
        { kind: 'mc', pts: 3, q: 'Which value should min-conflicts assign to B?', options: ['1', '2', '3'], answer: 2, letters: false },
      ],
      explain: '<p>B = 1 conflicts with A; B = 2 conflicts with C; B = 3 conflicts with neither. Min-conflicts assigns <b>B = 3</b>, giving A = 1, B = 3, C = 2 with no constraint violations.</p>',
    },
    /* ---------- 12 ---------- */
    {
      id: 't14', title: 'Understand min-conflicts', type: 'Algorithm reasoning', level: 'Medium', skill: 'mc',
      parts: [
        { kind: 'mc', pts: 4, q: 'Which description best matches min-conflicts?',
          options: ['Start with no assignments and build a solution level by level, as BFS does.', 'Repair a complete assignment by moving conflicted variables to low-conflict values.', 'Always assign the variable with the smallest domain first and never revise it later.', 'Enumerate every complete assignment first and only then check all the constraints.'], answer: 1, inline: false },
      ],
      explain: '<p>Min-conflicts is a local search: it starts from a <b>complete</b> (usually conflicting) assignment and repairs it one conflicted variable at a time.</p>',
    },
    /* ---------- 13 ---------- */
    {
      id: 't15', title: 'N-Queens representation', type: 'Representation', level: 'Easy–Medium', skill: 'nq',
      intro: '<p>For a 5-Queens problem, <code>queenPosition = [0, 2, 4, 1, 3]</code>, where <code>queenPosition[col] = row</code>. Rows and columns are numbered from 0.</p>',
      parts: [
        { kind: 'num', pts: 2, q: 'In which row is the queen in column 2?', prefix: 'row', answer: 4 },
        { kind: 'num', pts: 1, q: 'How many positive diagonals are there on a 5 × 5 board?', answer: 9 },
        { kind: 'num', pts: 1, q: 'How many negative diagonals are there?', answer: 9 },
      ],
      explain: M`<p><code>queenPosition[2] = 4</code>, so the queen is in <b>row 4</b>. The number of diagonals in either direction is \(2n - 1 = 2 \cdot 5 - 1 = 9\): 9 positive and 9 negative diagonals.</p>`,
    },
    /* ---------- 14 ---------- */
    {
      id: 't16', title: 'Compute N-Queens diagonal indices', type: 'Calculation', level: 'Medium', skill: 'nq',
      intro: '<p>On an 8 × 8 board, a queen is at <b>row = 2, col = 5</b>. Use positive diagonal = <code>row + col</code> and negative diagonal = <code>n − 1 − row + col</code>.</p>',
      parts: [
        { kind: 'num', pts: 2, q: 'What is the positive diagonal index?', answer: 7 },
        { kind: 'num', pts: 2, q: 'What is the negative diagonal index?', answer: 10 },
      ],
      explain: '<p>Positive: 2 + 5 = <b>7</b>. Negative: 8 − 1 − 2 + 5 = 7 − 2 + 5 = <b>10</b>.</p>',
    },
    /* ---------- 15 ---------- */
    {
      id: 't17', title: 'Count conflicts in N-Queens', type: 'Visual · pair counting', level: 'Hard', skill: 'nq',
      intro: '<p>4-Queens assignment <code>queenPosition = [0, 0, 2, 3]</code>: Q0 = (row 0, col 0), Q1 = (row 0, col 1), Q2 = (row 2, col 2), Q3 = (row 3, col 3). <code>h(n)</code> = number of attacking queen pairs; each pair is counted once, and two queens on the same row or diagonal count as a pair even if another queen stands between them (as in the lab’s conflict arrays).</p>' + board([0, 0, 2, 3]),
      parts: [
        { kind: 'multi', pts: 2, q: 'Which pairs attack each other?', options: ['Q0 – Q1', 'Q0 – Q2', 'Q0 – Q3', 'Q1 – Q2', 'Q1 – Q3', 'Q2 – Q3'], answer: [0, 1, 2, 5], letters: false },
        { kind: 'num', pts: 2, q: 'What is h(n)?', prefix: 'h(n) =', answer: 4 },
      ],
      explain: '<p>Q0 – Q1: same row → conflict. Q0 – Q2: same diagonal → conflict. Q0 – Q3: same diagonal → conflict. Q1 – Q2 and Q1 – Q3: no conflict. Q2 – Q3: same diagonal → conflict. There are four attacking pairs: <b>h(n) = 4</b>.</p>',
    },
    /* ---------- 16 ---------- */
    {
      id: 't18', title: 'Identify a valid 4-Queens solution', type: 'Visual reasoning', level: 'Hard', skill: 'nq',
      intro: '<p>Each list gives <code>queenPosition[col] = row</code>.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Which assignment is a valid 4-Queens solution?', options: ['[0, 1, 2, 3]', '[1, 3, 0, 2]', '[0, 2, 1, 3]', '[1, 2, 3, 0]'], answer: 1 },
      ],
      explain: '<p><b>[1, 3, 0, 2]</b>: no two queens share a row, a column or a diagonal.</p>' + board([1, 3, 0, 2]) + '<p>[0, 1, 2, 3] puts every queen on one diagonal; in [0, 2, 1, 3] the queens in columns 1 and 2 are diagonal neighbours; in [1, 2, 3, 0] the queens in columns 0–2 share a diagonal.</p>',
    },
    /* ---------- 17 ---------- */
    {
      id: 't19', title: 'Choose the technique from the scenario', type: 'Algorithm selection', level: 'Hard', skill: 'select',
      parts: [
        { kind: 'rows', pts: 5, q: 'Scenarios', options: TECH,
          rows: [
            { label: '<b>A.</b> Several variables are unassigned. One has only one legal value remaining, while the others have three or four. Which heuristic decides which variable to assign next?', answer: 1 },
            { label: '<b>B.</b> You have already chosen variable X and need to decide which of its possible values to try first. You want to eliminate as few choices as possible for neighbouring variables.', answer: 2 },
            { label: '<b>C.</b> After assigning a variable, you immediately remove incompatible values from its unassigned neighbours.', answer: 3 },
            { label: '<b>D.</b> You start from a complete N-Queens board containing conflicts and repeatedly move conflicted queens.', answer: 4 },
            { label: '<b>E.</b> You construct a partial assignment, abandon a branch when no legal value remains, and return to an earlier decision.', answer: 0 },
          ] },
      ],
      explain: '<p>A → <b>MRV</b>, B → <b>LCV</b>, C → <b>Forward Checking</b>, D → <b>Min-Conflicts</b>, E → <b>Backtracking</b>.</p>',
    },
    /* ---------- 18 ---------- */
    {
      id: 't20', title: 'Challenge: diagnose the search strategy', type: 'Integrated reasoning', level: 'Hard', skill: 'select',
      intro: '<p>A solver produces this log:</p>' + code(`Current domains:
  A = {Red, Green, Blue}
  B = {Green}
  C = {Red, Blue}
  D = {Red, Green}

Choose B because it has the fewest remaining values.

Assign: B = Green

Update neighbour domains:
  A = {Red, Blue}
  C = {Red, Blue}
  D = {Red, Green}

Now choose a value for the next variable that removes
the fewest possibilities from its neighbours.`),
      parts: [
        { kind: 'rows', pts: 6, q: 'Name the technique at each step.', options: TECH,
          rows: [
            { label: '1. Which heuristic caused B to be chosen?', answer: 1 },
            { label: '2. Which propagation technique is being used after <code>B = Green</code>?', answer: 3 },
            { label: '3. Which heuristic is described in the final sentence?', answer: 2 },
          ] },
      ],
      explain: '<p>1 → <b>MRV</b>, 2 → <b>Forward checking</b>, 3 → <b>LCV</b>.</p><ul class="concept-list"><li><b>MRV</b>: which variable should I choose?</li><li><b>LCV</b>: which value should I try?</li><li><b>Forward checking</b>: what immediate domain reductions follow from this assignment?</li></ul>',
    },
  ],
};
