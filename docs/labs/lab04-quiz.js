/* ===== Lab 04 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab04-genetic-algorithms.html';
const YN = { options: ['Yes', 'No'], letters: false };
const AE = ['A', 'B', 'C', 'D', 'E'];
const SEL = ['Roulette Wheel', 'SUS', 'Tournament', 'Rank-Based', 'Elitism', 'Truncation'];
const fit = rows => '<table class="qz-pq"><thead><tr><th>Chromosome</th><th>Fitness</th></tr></thead><tbody>'
  + rows.map(([c, f]) => `<tr><td>${c}</td><td>${f}</td></tr>`).join('') + '</tbody></table>';
const POP = [['A', 10], ['B', 20], ['C', 30], ['D', 25], ['E', 15]];
// cumulative roulette strip for the A–E population
const strip = () => '<div class="qz-strip" role="img" aria-label="Roulette wheel intervals: A 0 to 0.10, B 0.10 to 0.30, C 0.30 to 0.60, D 0.60 to 0.85, E 0.85 to 1.00">'
  + POP.map(([c, f], i) => `<span class="s${i}" style="flex:${f}">${c}</span>`).join('') + '</div>'
  + '<div class="qz-strip-ticks">' + [0, 0.1, 0.3, 0.6, 0.85, 1].map(v => `<span style="left:${v * 100}%">${v.toFixed(2)}</span>`).join('') + '</div>';

window.QUIZ = {
  id: 'lab04',
  skills: [
    { id: 'terms', label: 'GA terminology and pipeline', href: LAB + '#intro' },
    { id: 'pressure', label: 'Selection pressure', href: LAB + '#selection' },
    { id: 'roulette', label: 'Roulette wheel and SUS', href: LAB + '#selection' },
    { id: 'select', label: 'Tournament, rank, elitism, truncation', href: LAB + '#selection' },
    { id: 'cross', label: 'Crossover', href: LAB + '#crossover' },
    { id: 'mut', label: 'Mutation', href: LAB + '#mutation' },
    { id: 'tsp', label: 'TSP encoding and fitness', href: LAB + '#tsp' },
    { id: 'integ', label: 'Method selection and integration', href: LAB + '#tsp' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: 'Identify the GA components', type: 'Fundamentals', level: 'Easy', skill: 'terms',
      intro: '<p>Consider this population:</p><pre class="qz-code">Individual A: [3, 7, 1, 9, 4]\nIndividual B: [8, 2, 6, 5, 0]\nIndividual C: [1, 1, 7, 3, 6]</pre>',
      parts: [
        { kind: 'rows', pts: 4, q: 'Match each item to the GA term.', options: ['Gene', 'Chromosome', 'Population', 'Fitness function'],
          rows: [
            { label: 'The value <code>7</code> in individual A', answer: 0 },
            { label: '<code>[3, 7, 1, 9, 4]</code>', answer: 1 },
            { label: 'The collection {A, B, C}', answer: 2 },
            { label: 'How well a chromosome solves the optimization problem', answer: 3 },
          ] },
      ],
      explain: '<ul class="concept-list"><li>A <b>gene</b> is one parameter or component of a solution, e.g. <code>7</code>.</li><li>A <b>chromosome</b> is one complete candidate solution, e.g. <code>[3, 7, 1, 9, 4]</code>.</li><li>A <b>population</b> is the collection of candidate solutions: A, B, C.</li><li>The <b>fitness function</b> measures how well a chromosome solves the optimization problem.</li></ul>',
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'Put the GA steps in order', type: 'Ordering', level: 'Easy', skill: 'terms',
      parts: [
        { kind: 'seq', pts: 6, q: 'Arrange these stages in the standard evolutionary cycle.', label: 'Cycle', tokens: ['Mutation', 'Initialization', 'Selection', 'Crossover'], answer: ['Initialization', 'Selection', 'Crossover', 'Mutation'] },
      ],
      explain: '<p>Initialization → Selection → Crossover → Mutation → next generation. The selection–crossover–mutation process is repeated generation after generation.</p>',
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Selection pressure', type: 'Conceptual', level: 'Easy–Medium', skill: 'pressure',
      intro: '<p>A genetic algorithm is changed so that the best individuals are much more likely to reproduce than before.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'What is the likely effect?', options: ['Lower selection pressure, so the search explores more randomly', 'Higher selection pressure: faster convergence, but less diversity in the population', 'No change in convergence, because crossover still mixes all genes', 'Mutation becomes unnecessary, because the best genes always survive'], answer: 1, inline: false },
        { kind: 'rows', pts: 6, q: 'With higher selection pressure, what happens to…', options: ['Increases', 'Decreases'],
          rows: [{ label: 'the speed of convergence', answer: 0 }, { label: 'population diversity', answer: 1 }, { label: 'the risk of premature convergence', answer: 0 }] },
      ],
      explain: '<p><b>High</b> selection pressure: strong preference for fitter individuals → faster convergence → less diversity → higher risk of premature convergence. <b>Low</b> selection pressure: weaker preference → slower convergence → more diversity → more exploration.</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'Roulette-wheel probabilities', type: 'Calculation', level: 'Easy–Medium', skill: 'roulette',
      intro: '<p>Consider the population used in the lab:</p>' + fit(POP),
      parts: [
        { kind: 'num', pts: 2, q: 'What is the total population fitness?', answer: 100 },
        { kind: 'num', pts: 2, q: 'What is the roulette-wheel selection probability of C?', prefix: 'P(C) =', answer: 0.3, tol: 0.001, pct: true, show: '0.30' },
        { kind: 'num', pts: 2, q: 'And of E?', prefix: 'P(E) =', answer: 0.15, tol: 0.001, pct: true, show: '0.15' },
      ],
      explain: M`<p>Total fitness \(= 10 + 20 + 30 + 25 + 15 = 100\). With \(P(i) = \text{fitness}(i) / \text{total fitness}\): A 0.10, B 0.20, C 0.30, D 0.25, E 0.15. Roulette-wheel selection is <b>fitness proportional</b>.</p>`,
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'Roulette-wheel spin', type: 'Visual calculation', level: 'Medium', skill: 'roulette',
      intro: '<p>Using the same population, the cumulative roulette wheel is shown below. Each interval includes its left end and excludes its right end, e.g. D is \\(0.60 \\leq r < 0.85\\).</p>' + strip(),
      parts: [
        { kind: 'rows', pts: 5, q: 'Which chromosome is selected for each random number r?', options: AE,
          rows: [{ label: 'r = 0.72', answer: 3 }, { label: 'r = 0.05', answer: 0 }, { label: 'r = 0.30', answer: 2 }, { label: 'r = 0.95', answer: 4 }] },
      ],
      explain: '<p>r = 0.72 lies in D’s interval \\(0.60 \\leq r < 0.85\\), so <b>D</b> is selected. r = 0.05 → A; r = 0.30 is the left end of C’s interval → C; r = 0.95 → E.</p>',
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'Selection with replacement', type: 'Conceptual', level: 'Easy–Medium', skill: 'roulette',
      intro: '<p>Suppose roulette-wheel selection uses <code>replace=True</code>.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What does this mean?', options: ['Once selected, a chromosome is removed and cannot be selected again.', 'The same chromosome may be selected several times as a parent in one generation.', 'Every chromosome in the population must be selected exactly once.', 'The fitness values are recomputed and replaced after every selection.'], answer: 1, inline: false },
      ],
      explain: '<p>Sampling with replacement means a highly fit individual may become a parent multiple times.</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'Stochastic universal sampling', type: 'Calculation · visual', level: 'Hard', skill: 'roulette',
      intro: '<p>Use the same roulette-wheel intervals. SUS must select <b>4 parents</b>, and the first pointer is at <b>0.08</b>.</p>' + strip(),
      parts: [
        { kind: 'num', pts: 1, q: 'What is the pointer spacing?', answer: 0.25, tol: 0.001, show: '1/4 = 0.25' },
        { kind: 'num', pts: 1, q: 'Where is the fourth pointer?', answer: 0.83, tol: 0.001, show: '0.83' },
        { kind: 'seq', pts: 4, q: 'Which chromosomes are selected by the four pointers, in pointer order?', label: 'Selected', tokens: AE, sep: ',', answer: ['A', 'C', 'C', 'D'] },
      ],
      explain: '<p>Spacing \\(1/4 = 0.25\\); pointers 0.08, 0.33, 0.58, 0.83 → A, C, C, D. SUS uses evenly spaced pointers, reducing sampling variance compared with independent roulette spins.</p>',
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'Tournament selection', type: 'Selection reasoning', level: 'Medium', skill: 'select',
      intro: '<p>Population fitness: A = 10, B = 20, C = 30, D = 25, E = 15. A tournament randomly chooses <b>B, D, E</b>.</p>',
      parts: [
        { kind: 'mc', pts: 2, q: 'Which chromosome wins?', options: ['B', 'D', 'E'], answer: 1, letters: false },
        { kind: 'mc', pts: 3, q: M`What generally happens when the tournament size \(k\) is increased?`, options: ['Selection pressure increases', 'Selection pressure decreases', 'Selection becomes fitness proportional', 'Nothing changes'], answer: 0, inline: false },
      ],
      explain: M`<p>B = 20, D = 25, E = 15, so <b>D</b> wins. Larger tournaments make it more likely that very fit individuals participate and win: larger \(k\) → stronger selection pressure → faster convergence → lower diversity.</p>`,
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'Rank-based vs. roulette selection', type: 'Conceptual + calculation', level: 'Medium', skill: 'select',
      intro: '<p>Fitness values are initially A = 10, B = 20, C = 30, D = 25, E = 15. Now C becomes extremely fit: <b>C = 300</b>.</p>',
      parts: [
        { kind: 'mc', pts: 2, q: 'Which selection method is less sensitive to this huge change in C’s raw fitness?', options: ['Roulette-wheel selection', 'Rank-based selection', 'Truncation selection with only C surviving', 'Fitness-proportional selection'], answer: 1, inline: false },
        { kind: 'num', pts: 2, q: 'What is C’s roulette-wheel probability now? Two decimal places.', prefix: 'P(C) =', answer: 300 / 370, tol: 0.006, pct: true, show: '300 / 370 ≈ 0.81' },
        { kind: 'num', pts: 2, q: M`With rank-based selection (rank 1 for the worst, \(n\) for the best, \(P = \text{rank} / (1 + 2 + \dots + n)\)), what is C’s probability? Two decimal places.`, prefix: 'P(C) =', answer: 5 / 15, tol: 0.006, pct: true, show: '5 / 15 ≈ 0.33' },
      ],
      explain: '<p>Rank-based selection uses the individual’s <b>rank</b>, not the magnitude of its raw fitness. With C = 300, roulette gives C 300 / 370 ≈ 81% of the wheel; C is still rank 5 of 5, so rank-based selection keeps it at 5 / 15 ≈ 33% — no dramatic probability jump.</p>',
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'Elitism', type: 'Conceptual', level: 'Medium', skill: 'select',
      intro: '<p>A GA uses elitism and preserves the best two chromosomes unchanged in the next generation.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Which statement is correct?', options: ['The best two chromosomes cannot be lost through crossover or mutation in the next generation.', 'Every chromosome in the population survives unchanged to the next generation.', 'Population diversity is guaranteed to increase in every generation.', 'The algorithm becomes equivalent to an exhaustive search of all tours.'], answer: 0, inline: false },
      ],
      explain: '<p>Elitism protects some of the best individuals from being destroyed by random genetic operators. Advantage: preserves strong solutions. Risk: reduces diversity if overused.</p>',
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'Truncation selection', type: 'Calculation · reasoning', level: 'Medium', skill: 'select',
      intro: '<p>Truncation selection keeps the <b>top 50%</b> of this population.</p>' + fit([['A', 15], ['B', 41], ['C', 22], ['D', 35], ['E', 10], ['F', 28]]).replace('Chromosome', 'Individual'),
      parts: [
        { kind: 'multi', pts: 5, q: 'Which individuals are allowed to become parents?', options: ['A', 'B', 'C', 'D', 'E', 'F'], answer: [1, 3, 5], letters: false },
      ],
      explain: '<p>Sorted by fitness: B 41, D 35, F 28, C 22, A 15, E 10. 50% of 6 individuals is 3, so <b>B, D, F</b>. Truncation selection is simple and creates strong selection pressure, but can destroy diversity quickly.</p>',
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'One-point order crossover', type: 'Crossover tracing', level: 'Hard', skill: 'cross',
      intro: '<p>For a permutation problem:</p><pre class="qz-code">Parent 1: [1, 2, 3, 4, 5, 6]\nParent 2: [4, 1, 2, 6, 5, 3]</pre><p>The crossover point is after the third gene. The order-safe crossover: (1) copy the first part from Parent 1; (2) scan Parent 2 from left to right; (3) append values that are not already in the child.</p>',
      parts: [
        { kind: 'seq', pts: 6, q: 'What child is produced?', label: 'Child', tokens: ['1', '2', '3', '4', '5', '6'], sep: '', answer: ['1', '2', '3', '4', '6', '5'] },
      ],
      explain: '<p>Start with the first three genes of Parent 1: [1, 2, 3]. Scan Parent 2: 4 → append; 1, 2 → already present, skip; 6 → append; 5 → append; 3 → skip. Child: <b>[1, 2, 3, 4, 6, 5]</b>.</p>',
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: 'Why naive crossover fails for TSP', type: 'Conceptual challenge', level: 'Medium–Hard', skill: 'cross',
      intro: '<p>TSP chromosomes are permutations. Parents <code>P1 = [A, B, C, D, E, F]</code> and <code>P2 = [D, E, F, A, B, C]</code>. A student performs ordinary one-point crossover after position 3: <code>[A, B, C] + [A, B, C]</code> = <code>[A, B, C, A, B, C]</code>.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Why is this child invalid for TSP?', options: ['Every city must appear exactly once in a tour.', 'A tour must start and end at the same city A.', 'The two halves must come from the same parent.', 'Its fitness is lower than both parents’ fitness.'], answer: 0, inline: false },
        { kind: 'multi', pts: 2, q: 'Which cities are missing from the child?', options: ['A', 'B', 'C', 'D', 'E', 'F'], answer: [3, 4, 5], letters: false },
      ],
      explain: '<p>A TSP chromosome must contain every city exactly once. This child repeats A, B, C and completely loses D, E, F. Permutation problems need crossover operators that preserve permutation validity.</p>',
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'Uniform crossover', type: 'Crossover tracing', level: 'Medium', skill: 'cross',
      intro: '<pre class="qz-code">Parent 1: 1 1 0 0 1 0\nParent 2: 0 1 1 0 0 1\nMask:     1 0 1 0 1 0</pre><p>For Child 1: mask = 1 → take the gene from Parent 1; mask = 0 → take it from Parent 2.</p>',
      parts: [
        { kind: 'seq', pts: 4, q: 'What is Child 1?', label: 'Child 1', tokens: ['0', '1'], sep: '', answer: ['1', '1', '0', '0', '1', '1'] },
      ],
      explain: '<p>Sources by position: P1, P2, P1, P2, P1, P2 → <b>[1, 1, 0, 0, 1, 1]</b>. Uniform crossover chooses the source parent <b>gene by gene</b> rather than using one fixed crossover point.</p>',
    },
    /* ---------- 15 ---------- */
    {
      id: 't15', title: 'Identify the mutation operator', type: 'Visual', level: 'Medium', skill: 'mut',
      intro: '<p>Original chromosome: <code>[A, B, C, D, E, F]</code>.</p>',
      parts: [
        { kind: 'rows', pts: 3, q: 'Match each result to the mutation operator.', options: ['Swap', 'Insertion', 'Reverse'],
          rows: [{ label: '<code>[A, E, C, D, B, F]</code>', answer: 0 }, { label: '<code>[A, C, D, E, B, F]</code>', answer: 1 }, { label: '<code>[A, E, D, C, B, F]</code>', answer: 2 }] },
      ],
      explain: '<ul class="concept-list"><li><b>Swap</b>: B and E exchange positions.</li><li><b>Insertion</b>: B is removed and inserted later in the chromosome.</li><li><b>Reverse</b>: the segment [B, C, D, E] is reversed.</li></ul>',
    },
    /* ---------- 16 ---------- */
    {
      id: 't16', title: 'Mutation rate', type: 'Probability · interpretation', level: 'Medium', skill: 'mut',
      intro: '<p>A GA creates <b>100 children</b> and applies mutation independently with probability <b>0.30</b>.</p>',
      parts: [
        { kind: 'num', pts: 3, q: 'How many children are expected to mutate?', answer: 30 },
        { kind: 'mc', pts: 1, q: 'Will exactly that many children mutate in every generation?', ...YN, answer: 1 },
      ],
      explain: M`<p>\(100 \times 0.30 = 30\). This is an <b>expected value</b>, not a guarantee that exactly 30 children mutate in every generation.</p>`,
    },
    /* ---------- 17 ---------- */
    {
      id: 't17', title: 'What happens with mutation rate 0?', type: 'Conceptual', level: 'Medium', skill: 'mut',
      intro: '<p>A TSP GA is run with <b>mutation rate = 0</b> for many generations.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What problem becomes more likely?', options: ['The population keeps gaining diversity with no upper limit.', 'The population may lose diversity and converge too early.', 'Every child produced by crossover becomes an invalid tour.', 'Selection pressure drops to exactly zero for every tour.'], answer: 1, inline: false },
      ],
      explain: '<p>Mutation introduces random variation. Without mutation, the population may lose useful genetic diversity and get stuck early (try it in the lab’s TSP widget).</p>',
    },
    /* ---------- 18 ---------- */
    {
      id: 't18', title: 'TSP chromosome and fitness', type: 'Representation · reasoning', level: 'Medium', skill: 'tsp',
      intro: '<p>There are six cities: A, B, C, D, E, F.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Which chromosome is a valid TSP representation?', options: ['[A, B, C, D, E, F]', '[A, A, C, D, E, F]', '[A, B, C, D, E]', '[A, B, C, D, E, F, A, B]'], answer: 0 },
        { kind: 'mc', pts: 2, q: 'Two valid tours have lengths X = 120 and Y = 150. The lab defines higher fitness for shorter tours. Which should have higher fitness?', options: ['Tour X', 'Tour Y'], answer: 0, letters: false },
      ],
      explain: '<p>[A, B, C, D, E, F] is valid: each city occurs exactly once. <b>Tour X</b> has higher fitness, because 120 &lt; 150.</p>',
    },
    /* ---------- 19 ---------- */
    {
      id: 't19', title: 'Choose the selection method', type: 'Scenario reasoning', level: 'Hard', skill: 'integ',
      parts: [
        { kind: 'rows', pts: 6, q: 'Scenarios', options: SEL,
          rows: [
            { label: '<b>A.</b> You want probability directly proportional to raw fitness.', answer: 0 },
            { label: '<b>B.</b> You want proportional selection but less sampling variance than repeated independent roulette spins.', answer: 1 },
            { label: M`<b>C.</b> You want a simple method whose selection pressure can be controlled by changing a parameter \(k\).`, answer: 2 },
            { label: '<b>D.</b> One individual has an enormously larger raw fitness than everyone else, and you do not want that magnitude alone to dominate selection.', answer: 3 },
            { label: '<b>E.</b> You want to guarantee that the current best chromosome survives unchanged.', answer: 4 },
            { label: '<b>F.</b> You want to permit reproduction only from the top fraction of the current population.', answer: 5 },
          ] },
      ],
      explain: '<p>A → <b>Roulette Wheel</b>, B → <b>SUS</b>, C → <b>Tournament</b>, D → <b>Rank-Based</b>, E → <b>Elitism</b>, F → <b>Truncation</b>.</p>',
    },
    /* ---------- 20 ---------- */
    {
      id: 't20', title: 'Challenge: diagnose the GA', type: 'Integrated reasoning', level: 'Hard', skill: 'integ',
      intro: '<p>A TSP genetic algorithm uses:</p><pre class="qz-code">Population size:   60\nChromosome:        permutation of 14 cities\nElites:            best 2 tours\nParent selection:  tournament selection, k = 3\nCrossover:         permutation-safe one-point order crossover\nMutation rate:     0.30\nMutation operator: reverse</pre>',
      parts: [
        { kind: 'mc', pts: 0.8, q: '1. Why must the crossover preserve permutations?', options: ['A tour must visit each city exactly once.', 'It makes crossover run faster on long tours.', 'The reverse mutation only works on permutations.', 'It keeps the population size fixed at 60.'], answer: 0, inline: false },
        { kind: 'mc', pts: 0.8, q: '2. What is the purpose of keeping the best 2 tours?', options: ['It raises the mutation rate for the elite tours.', 'It keeps the population diverse across generations.', 'Elitism: strong tours are never lost.', 'It guarantees that the optimal tour is found.'], answer: 2, inline: false },
        { kind: 'mc', pts: 0.8, q: '3. What does increasing the tournament size from 3 to 8 generally do?', options: ['Weaker selection pressure, since more tours compete', 'Stronger selection pressure, so the fittest tours dominate reproduction', 'No change, since the winner is still one tour', 'It becomes roulette-wheel selection'], answer: 1, inline: false },
        { kind: 'mc', pts: 0.8, q: '4. What role does mutation play?', options: ['It chooses which tours become parents.', 'It protects the best tours from being changed.', 'It repairs tours that crossover made invalid.', 'It adds random variation and keeps diversity.'], answer: 3, inline: false },
        { kind: 'mc', pts: 0.8, q: '5. What is a possible danger if both selection pressure and elitism become too strong?', options: ['The search becomes far too random and never converges.', 'Diversity collapses; the GA converges too early.', 'Children start to become invalid permutations.', 'The population size starts growing without bound.'], answer: 1, inline: false },
      ],
      explain: '<ol class="concept-list"><li>A TSP tour must visit every city exactly once; the crossover must avoid duplicate and missing cities.</li><li>Keeping the best 2 tours is <b>elitism</b>: it protects strong solutions from being lost.</li><li>Larger \\(k\\) means <b>stronger selection pressure</b>.</li><li>Mutation introduces random variation and helps preserve exploration and genetic diversity.</li><li>Too much exploitation: diversity collapses → the population becomes very similar → premature convergence → stuck around a suboptimal solution.</li></ol>',
    },
  ],
};
