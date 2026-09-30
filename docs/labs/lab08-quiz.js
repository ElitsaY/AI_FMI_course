/* ===== Lab 08 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab08-naive-bayes.html';
const KN = ['KNN', 'Naive Bayes'];

window.QUIZ = {
  id: 'lab08',
  skills: [
    { id: 'terms', label: 'Bayes’ theorem: prior, likelihood, posterior', href: LAB + '#bayes' },
    { id: 'compute', label: 'Computing Naive Bayes scores', href: LAB + '#classifier' },
    { id: 'indep', label: 'The conditional-independence assumption', href: LAB + '#naive' },
    { id: 'zero', label: 'Zero frequency and Laplace smoothing', href: LAB + '#zero' },
    { id: 'gauss', label: 'Gaussian Naive Bayes', href: LAB + '#gaussian' },
    { id: 'pros', label: 'Advantages, disadvantages and fit', href: LAB + '#summary' },
    { id: 'knn', label: 'Naive Bayes vs. KNN', href: LAB + '#summary' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't2', title: 'Class priors', type: 'Calculation', level: 'Easy', skill: 'terms',
      intro: '<p>A training dataset contains 100 emails: 40 spam and 60 ham.</p>',
      parts: [
        { kind: 'num', pts: 2, q: 'What is the prior of Spam?', prefix: 'P(Spam) =', answer: 0.4, tol: 0.001, pct: true, show: '40 / 100 = 0.4' },
        { kind: 'num', pts: 2, q: 'And of Ham?', prefix: 'P(Ham) =', answer: 0.6, tol: 0.001, pct: true, show: '60 / 100 = 0.6' },
      ],
      explain: M`<p>\(P(\text{Spam}) = 40/100 = 0.4\) and \(P(\text{Ham}) = 60/100 = 0.6\).</p>`,
    },
    /* ---------- 2 ---------- */
    {
      id: 't3', title: 'Read a posterior', type: 'Interpretation', level: 'Easy', skill: 'terms',
      intro: M`<p>Suppose \(P(\text{Spam} \mid \text{free}, \text{money}) = 0.91\).</p>`,
      parts: [
        { kind: 'mc', pts: 6, q: 'What does this probability represent?',
          options: ['The probability of seeing “free” and “money” in a spam email', 'The share of spam emails in the training data, before any words are seen', 'The probability of seeing “free” and “money” in any email at all', 'The probability that the email is spam, given it has “free” and “money”'], answer: 3, inline: false },
      ],
      explain: '<p>It is the probability that the email belongs to the <b>Spam</b> class given the observed features “free” and “money”: prior knowledge + observed evidence → posterior. (The other options describe the likelihood, the prior and the evidence.)</p>',
    },
    /* ---------- 3 ---------- */
    {
      id: 't4', title: 'Compute a Naive Bayes score', type: 'Calculation', level: 'Medium', skill: 'compute',
      intro: '<table class="qz-pq"><thead><tr><th></th><th>Spam</th><th>Ham</th></tr></thead><tbody><tr><td>Prior P(C)</td><td>0.4</td><td>0.6</td></tr><tr><td>P(free | C)</td><td>0.30</td><td>0.05</td></tr><tr><td>P(money | C)</td><td>0.25</td><td>0.10</td></tr></tbody></table><p>A new email contains <b>free</b> and <b>money</b>.</p>',
      parts: [
        { kind: 'num', pts: 2, q: M`Score of Spam: \(P(\text{Spam})\,P(\text{free} \mid \text{Spam})\,P(\text{money} \mid \text{Spam})\)`, answer: 0.03, tol: 0.0001 },
        { kind: 'num', pts: 2, q: 'Score of Ham, computed the same way', answer: 0.003, tol: 0.00001 },
        { kind: 'mc', pts: 2, q: 'Which class receives the larger score?', options: ['Spam', 'Ham'], answer: 0, letters: false },
      ],
      explain: M`<p>Spam: \(0.4 \times 0.30 \times 0.25 = 0.03\). Ham: \(0.6 \times 0.05 \times 0.10 = 0.003\). Since \(0.03 > 0.003\), the email is classified as <b>Spam</b>.</p>`,
    },
    /* ---------- 4 ---------- */
    {
      id: 't5', title: M`The denominator \(P(x)\)`, type: 'Concept', level: 'Medium', skill: 'terms',
      intro: M`<p>The posterior is \(P(C_i \mid x) = \dfrac{P(x \mid C_i)\,P(C_i)}{P(x)}\).</p>`,
      parts: [
        { kind: 'mc', pts: 6, q: M`Why can Naive Bayes ignore \(P(x)\) when choosing the winning class?`,
          options: ['P(x) is the same for every class, so it cannot change the winner.', 'P(x) is always equal to 1, so dividing by it changes nothing.', 'P(x) is too small to estimate, so it is simply set to zero.', 'P(x) only matters for regression, not for classification.'], answer: 0, inline: false },
      ],
      explain: M`<p>\(P(x)\) is the same denominator for every candidate class, so it does not affect which class has the largest score. It is enough to compare \(P(C_i)\,P(x \mid C_i)\).</p>`,
    },
    /* ---------- 5 ---------- */
    {
      id: 't6', title: 'The “naive” assumption', type: 'Concept', level: 'Medium', skill: 'indep',
      parts: [
        { kind: 'mc', pts: 4, q: 'What assumption does Naive Bayes make?',
          options: ['The classes are equally likely before any feature is seen.', 'Every feature follows a Gaussian distribution in each class.', 'The features are independent of the class label itself.', 'The features are conditionally independent given the class.'], answer: 3, inline: false },
      ],
      explain: M`<p>The features are <b>conditionally independent given the class</b>. This lets \(P(x_1, x_2, \dots, x_n \mid C)\) be replaced by \(P(x_1 \mid C)\,P(x_2 \mid C) \cdots P(x_n \mid C)\).</p>`,
    },
    /* ---------- 6 ---------- */
    {
      id: 't7', title: '“free” and “money” in spam', type: 'Concept', level: 'Medium', skill: 'indep',
      intro: '<p>In spam detection, consider the features <i>contains “free”</i> and <i>contains “money”</i>.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Why may the independence assumption be unrealistic here?',
          options: ['Spam emails never contain both words, so the product is zero.', 'The two words differ in length, so their probabilities differ.', 'Independence would require both classes to have equal priors.', 'The two words tend to appear together in spam.'], answer: 3, inline: false },
      ],
      explain: '<p>The features may be correlated: spam emails containing “free” may also be more likely to contain “money”. Naive Bayes ignores that dependency once the class is known.</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't8', title: '10 binary features', type: 'Calculation', level: 'Medium', skill: 'indep',
      intro: '<p>Suppose there are 10 binary features.</p>',
      parts: [
        { kind: 'num', pts: 3, q: 'How many value combinations would a full joint distribution over the features need to represent?', answer: 1024, show: M`\(2^{10} = 1024\)` },
        { kind: 'mc', pts: 2, q: 'What does the independence assumption let Naive Bayes estimate instead?',
          options: ['One probability for every combination, but for fewer classes', 'Each feature’s probability separately for each class', 'Only the class priors, ignoring the features', 'The distances between all pairs of training examples'], answer: 1, inline: false },
      ],
      explain: M`<p>\(2^{10} = 1024\) combinations. The independence assumption avoids estimating every joint combination and instead estimates feature probabilities separately for each class: a strong simplifying assumption buys much simpler computation.</p>`,
    },
    /* ---------- 8 ---------- */
    {
      id: 't9', title: 'A word never seen in spam', type: 'Zero frequency', level: 'Medium', skill: 'zero',
      intro: '<p>“discount” never occurred in a spam email in the training set, so P(discount | Spam) = 0. A new email contains <b>discount</b>, <b>free</b> and <b>money</b>.</p>',
      parts: [
        { kind: 'mc', pts: 6, q: 'What happens to the Spam score without smoothing?',
          options: ['“discount” is ignored and the score uses only “free” and “money”.', 'It becomes 0, however strongly the other words point to Spam.', 'The score becomes 1, because the other two words dominate it.', 'The Ham score becomes 0 instead, so the email is labelled Spam.'], answer: 1, inline: false },
      ],
      explain: '<p>The Spam score contains a factor of zero, so the <b>entire product is 0</b>, regardless of how strongly the other features support Spam. This is the <b>zero-frequency problem</b>.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't10', title: 'Laplace smoothing', type: 'Calculation', level: 'Medium', skill: 'zero',
      intro: M`<p>Count(discount, Spam) = 0, Count(Spam words) = 40, vocabulary size \(V = 1000\), \(\alpha = 1\). Use \[P(x \mid C) = \frac{\text{Count}(x, C) + \alpha}{\text{Count}(C) + \alpha V}\]</p>`,
      parts: [
        { kind: 'num', pts: 3, q: 'What is the denominator?', answer: 1040 },
        { kind: 'num', pts: 4, q: 'What probability is assigned to “discount”? A fraction such as 1/7 or a decimal both work.', prefix: 'P(discount | Spam) =', answer: 1 / 1040, tol: 0.00001, show: '1/1040 ≈ 0.00096' },
      ],
      explain: M`<p>\(\dfrac{0 + 1}{40 + 1 \cdot 1000} = \dfrac{1}{1040} \approx 0.00096\): a <b>small</b> probability instead of zero.</p>`,
    },
    /* ---------- 10 ---------- */
    {
      id: 't11', title: 'Hundreds of words', type: 'Practice', level: 'Medium', skill: 'compute',
      intro: '<p>An email contains hundreds of words, and Naive Bayes multiplies many probabilities smaller than 1.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Why is this a practical problem?',
          options: ['The product gets too small to store accurately: underflow.', 'The product grows past 1, so it is no longer a probability.', 'Multiplying is much slower than adding on modern CPUs.', 'Rounding makes every class score equal to its prior.'], answer: 0, inline: false },
        { kind: 'mc', pts: 3, q: 'What do implementations compute instead?',
          options: ['The average of the likelihoods, without the prior', 'Only the single largest likelihood in the email', 'The log prior plus the sum of the log likelihoods', 'The product of the likelihoods, rounded to 3 decimals'], answer: 2, inline: false },
      ],
      explain: '<p>The product can become so tiny that the computer cannot represent it accurately: <b>numerical underflow</b>. Implementations use <b>log prior + sum of log likelihoods</b> instead of multiplying many tiny values.</p>',
    },
    /* ---------- 11 ---------- */
    {
      id: 't12', title: 'Advantages of Naive Bayes', type: 'Pros', level: 'Medium', skill: 'pros',
      parts: [
        { kind: 'multi', pts: 5, q: 'Which are genuine advantages of Naive Bayes?',
          options: ['Fast training', 'Captures interactions between features well', 'Fast prediction', 'Works well with high-dimensional data', 'Its probability estimates are very accurate', 'Can work with limited training data'], answer: [0, 2, 3, 5], inline: false },
      ],
      explain: '<p>Fast training, fast prediction, strength with high-dimensional data and working with limited training data are genuine advantages: Naive Bayes mainly learns compact statistics (class priors and feature likelihoods). It does <i>not</i> capture feature interactions well, and its probability estimates can be inaccurate.</p>',
    },
    /* ---------- 12 ---------- */
    {
      id: 't13', title: 'Disadvantages of Naive Bayes', type: 'Cons', level: 'Medium', skill: 'pros',
      parts: [
        { kind: 'multi', pts: 5, q: 'Which are genuine disadvantages?',
          options: ['Conditional independence can be unrealistic.', 'Training is slow on large datasets.', 'Probability estimates can be inaccurate.', 'Strong feature interactions are hard to represent.', 'It cannot handle more than two classes.', 'Zero-frequency values require smoothing.'], answer: [0, 2, 3, 5], inline: false },
      ],
      explain: '<p>The unrealistic independence assumption, inaccurate probability estimates, weak handling of feature interactions and the need for smoothing are genuine disadvantages. Training is fast, and Naive Bayes handles any number of classes.</p>',
    },
    /* ---------- 13 ---------- */
    {
      id: 't14', title: 'Strongly interacting features', type: 'Fit', level: 'Hard', skill: 'indep',
      intro: '<p>A problem contains strongly interacting features: feature A is useful only when feature B is high, and feature C changes meaning depending on feature D.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Why may Naive Bayes be a poor fit?',
          options: ['It needs every feature to be binary, and these are not.', 'It cannot use more than two features at the same time.', 'It needs the features to be scaled to the same range first.', 'It treats the features separately, losing their interactions.'], answer: 3, inline: false },
      ],
      explain: '<p>Naive Bayes does not naturally model rich dependencies between features; its simplifying assumption may throw away important interaction information. Efficiency gained ↔ interaction structure lost.</p>',
    },
    /* ---------- 14 ---------- */
    {
      id: 't15', title: 'Continuous features', type: 'Concept', level: 'Medium', skill: 'gauss',
      intro: '<p>The features are continuous: temperature, height, percentage of capital letters.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Why can we not simply count every exact value, as with words?',
          options: ['Continuous features are always independent of the class.', 'Counting works only when there are exactly two classes.', 'So many values are possible that counts are useless.', 'Continuous values cannot be multiplied by probabilities.'], answer: 2, inline: false },
        { kind: 'mc', pts: 3, q: 'What does Gaussian Naive Bayes store for each feature within each class?', options: ['Mean and variance', 'Minimum and maximum', 'Median and mode', 'The full list of values'], answer: 0 },
      ],
      explain: '<p>Continuous features can take many possible values, so exact-frequency counting is not useful. Gaussian Naive Bayes models each continuous feature within each class with a Gaussian distribution, summarized by its <b>mean</b> and <b>variance</b>.</p>',
    },
    /* ---------- 15 ---------- */
    {
      id: 't16', title: 'A spam classifier with 30,000 word features', type: 'Fit', level: 'Medium', skill: 'pros',
      intro: '<p>You are building a spam classifier with 30,000 word features, limited training data and strict prediction-latency requirements.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Is Naive Bayes a reasonable candidate?',
          options: ['No: 30,000 features are far too many for Naive Bayes.', 'No: Naive Bayes needs a lot of training data to work.', 'Yes: it is fast and handles many features well.', 'Only if the word features are scaled to [0, 1] first.'], answer: 2, inline: false },
      ],
      explain: '<p><b>Yes.</b> Naive Bayes is strong with high-dimensional feature spaces, trains and predicts fast, is commonly effective for text classification, and can work with limited data.</p>',
    },
    /* ---------- 16 ---------- */
    {
      id: 't17', title: 'KNN or Naive Bayes? 100,000 documents', type: 'Method choice', level: 'Medium', skill: 'knn',
      intro: '<p>You have 100,000 documents, 20,000 word features, and predictions must be fast.</p>',
      parts: [{ kind: 'mc', pts: 4, q: 'Which method is usually the more natural choice?', options: KN, answer: 1, letters: false }],
      explain: '<p><b>Naive Bayes</b> works well in high dimensions, creates a compact model and predicts quickly. Basic KNN suffers here: distances become less meaningful in high dimensions, prediction compares against many stored examples, and the training data must remain in memory.</p>',
    },
    /* ---------- 17 ---------- */
    {
      id: 't18', title: 'KNN or Naive Bayes? A small, irregular dataset', type: 'Method choice', level: 'Medium', skill: 'knn',
      intro: '<p>The dataset is small, the features are well scaled, there are only 2 useful dimensions, and the class boundary is highly irregular and local.</p>',
      parts: [{ kind: 'mc', pts: 4, q: 'Which method may be the better fit?', options: KN, answer: 0, letters: false }],
      explain: '<p><b>KNN</b> follows local structure naturally, makes few distributional assumptions and can represent irregular decision boundaries. Naive Bayes imposes a stronger probabilistic structure and the conditional-independence assumption.</p>',
    },
    /* ---------- 18 ---------- */
    {
      id: 't19', title: 'KNN or Naive Bayes? 5 million examples', type: 'Method choice', level: 'Medium', skill: 'knn',
      intro: '<p>The training set has 5 million examples, prediction latency must be low, and memory is limited.</p>',
      parts: [{ kind: 'mc', pts: 4, q: 'Which is more attractive for a basic implementation?', options: KN, answer: 1, letters: false }],
      explain: '<p><b>Naive Bayes</b> is model-based and stores learned statistics: low training cost, cheap prediction, compact model. KNN is instance-based and stores the training examples: cheap training, expensive prediction, high memory use.</p>',
    },
    /* ---------- 19 ---------- */
    {
      id: 't20', title: 'KNN vs. Naive Bayes overall', type: 'Trade-offs', level: 'Hard', skill: 'knn',
      parts: [
        { kind: 'rows', pts: 6, q: 'Which method does each property describe?', options: KN,
          rows: [
            { label: 'Prediction is usually cheap', answer: 1 },
            { label: 'Stores the training data', answer: 0 },
            { label: 'Feature scaling is important', answer: 0 },
            { label: 'Assumes conditional independence given the class', answer: 1 },
            { label: 'Often strong with high-dimensional data', answer: 1 },
            { label: 'Handles irregular local boundaries naturally', answer: 0 },
          ] },
        { kind: 'mc', pts: 4, q: 'Which statement is best?',
          options: ['It depends on the data, dimensions, latency and memory.', 'Naive Bayes is always the better of the two methods.', 'KNN is always the better of the two methods.', 'The two algorithms make essentially the same trade-offs.'], answer: 0, inline: false },
      ],
      explain: '<p>KNN: local, instance-based, lazy, distance-based — stores the data, needs scaling, handles irregular local boundaries. Naive Bayes: global, model-based, probabilistic — cheap prediction, strong in high dimensions, assumes conditional independence. There is <b>no universal winner</b>: the choice depends on the number of examples and dimensions, latency, memory, local geometry and how dependent the features are.</p>',
    },
  ],
};
