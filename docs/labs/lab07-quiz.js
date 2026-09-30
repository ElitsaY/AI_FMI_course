/* ===== Lab 07 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab07-knn.html';
const FIT = ['Good fit', 'Poor fit', 'Depends on preprocessing / K'];

window.QUIZ = {
  id: 'lab07',
  skills: [
    { id: 'basics', label: 'What KNN is and how it predicts', href: LAB + '#global-local' },
    { id: 'k', label: 'Choosing K: small vs. large', href: LAB + '#knn' },
    { id: 'dist', label: 'Distances, scaling and dimensionality', href: LAB + '#knn' },
    { id: 'cost', label: 'Prediction cost and memory', href: LAB + '#lazy-eager' },
    { id: 'trade', label: 'Trade-offs and scenarios', href: LAB + '#knn' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: 'What kind of learner is KNN?', type: 'Concept', level: 'Easy', skill: 'basics',
      parts: [
        { kind: 'mc', pts: 4, q: 'KNN is described as:', options: ['global, model-based, eager', 'local, instance-based, lazy', 'global, instance-based, eager', 'local, model-based, eager'], answer: 1 },
      ],
      explain: '<ul class="concept-list"><li><b>Local</b>: the prediction depends on nearby training points.</li><li><b>Instance-based</b>: the training instances themselves act as the model.</li><li><b>Lazy</b>: little model-building happens before prediction time.</li></ul>',
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'Classification or regression?', type: 'Task type', level: 'Easy', skill: 'basics',
      parts: [
        { kind: 'rows', pts: 4, q: 'For each KNN task, identify whether it is classification or regression.', options: ['Classification', 'Regression'],
          rows: [
            { label: '<b>A.</b> Predict spam / not spam.', answer: 0 },
            { label: '<b>B.</b> Predict tomorrow’s temperature.', answer: 1 },
            { label: '<b>C.</b> Predict the price of a house from nearby similar houses.', answer: 1 },
            { label: '<b>D.</b> Predict cat / dog / horse.', answer: 0 },
          ] },
      ],
      explain: '<p>A and D are <b>classification</b> (majority vote over the neighbours’ classes); B and C are <b>regression</b> (average of the neighbours’ values).</p>',
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Five neighbours vote', type: 'Prediction', level: 'Easy', skill: 'basics',
      intro: '<p>With <b>K = 5</b>, a new point’s five nearest neighbours have the classes <code>A, B, A, A, B</code>.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'What class does KNN predict?', options: ['A', 'B', 'It is a tie'], answer: 0, letters: false },
      ],
      explain: '<p><b>A</b>: A appears 3 times and B 2 times. KNN classification uses a majority vote.</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'KNN regression', type: 'Prediction', level: 'Easy', skill: 'basics',
      intro: '<p>With <b>K = 3</b>, the three nearest neighbours of a new apartment have prices 120,000, 135,000 and 150,000.</p>',
      parts: [
        { kind: 'num', pts: 4, q: 'What does basic KNN regression predict?', answer: 135000, show: '135,000' },
      ],
      explain: M`<p>\(\dfrac{120000 + 135000 + 150000}{3} = 135000\). Basic KNN regression averages the neighbours’ target values.</p>`,
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'K = 1', type: 'Choosing K', level: 'Medium', skill: 'k',
      parts: [
        { kind: 'mc', pts: 4, q: 'Suppose K = 1. Which description is most accurate?', options: ['The decision boundary is usually very smooth and ignores local structure.', 'The model follows the training data closely and can be very sensitive to noise.', 'Prediction no longer depends on distance.', 'The model becomes a global learner.'], answer: 1, inline: false },
      ],
      explain: '<p>Small K captures very local structure, but it is sensitive to noise and outliers and can <b>overfit</b>.</p>',
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'Increasing K a lot', type: 'Choosing K', level: 'Medium', skill: 'k',
      parts: [
        { kind: 'mc', pts: 4, q: 'Suppose K is increased substantially. What usually happens?',
          options: ['Accuracy always improves, because more neighbours are consulted.', 'The model overfits more.', 'Predictions become less sensitive to individual noisy examples, but if K is too large local structure is averaged away and the model may underfit.', 'Prediction no longer depends on distance.'], answer: 2, inline: false },
      ],
      explain: '<p>Large K: + more robust to noise, + smoother predictions; − may ignore meaningful local patterns, − can <b>underfit</b>.</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'Small K vs. large K', type: 'Matching', level: 'Medium', skill: 'k',
      parts: [
        { kind: 'rows', pts: 5, q: 'Match each description.', options: ['Small K', 'Large K'],
          rows: [
            { label: 'More sensitive to mislabelled examples', answer: 0 },
            { label: 'More likely to overfit', answer: 0 },
            { label: 'Smoother decision boundary', answer: 1 },
            { label: 'More likely to underfit if taken too far', answer: 1 },
            { label: 'Preserves very local structure', answer: 0 },
          ] },
      ],
      explain: '<p>Small K: sensitive to mislabelled examples, more likely to overfit, preserves very local structure. Large K: smoother decision boundary, more likely to underfit if taken too far.</p>',
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'Age and income as features', type: 'Distances', level: 'Medium', skill: 'dist',
      intro: '<p>A KNN model uses two features: <b>age</b> (18 to 80) and <b>income</b> (20,000 to 200,000), with Euclidean distance on the raw values.</p><table class="qz-pq"><thead><tr><th>Person</th><th>Age</th><th>Income</th></tr></thead><tbody><tr><td>Query Q</td><td>30</td><td>50,000</td></tr><tr><td>P1</td><td>70</td><td>50,500</td></tr><tr><td>P2</td><td>31</td><td>53,000</td></tr></tbody></table>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Without scaling, which point is nearer to Q?', options: ['P1', 'P2', 'Both are equally near'], answer: 0, letters: false },
        { kind: 'mc', pts: 3, q: 'What problem does this show?', options: ['Age dominates the distance because it changes more.', 'Income dominates the distance simply because its numerical scale is much larger.', 'KNN cannot use two features.', 'Euclidean distance ignores large values.'], answer: 1, inline: false },
      ],
      explain: M`<p>\(d(Q, P1) = \sqrt{40^2 + 500^2} \approx 502\) and \(d(Q, P2) = \sqrt{1^2 + 3000^2} \approx 3000\), so the 70-year-old P1 counts as “nearer” than the 31-year-old P2. <b>Income</b> dominates the distance simply because its scale is much larger: KNN is distance-based, so feature scale matters.</p>`,
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: '10 million examples, low latency', type: 'Prediction cost', level: 'Medium', skill: 'cost',
      intro: '<p>You have 10 million training examples, and a production system must answer each prediction with very low latency.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Is basic KNN an attractive choice?',
          options: ['Yes: it has almost no training cost, so it is fast overall.', 'Usually no: every new query is compared with the stored training data to find its neighbours, so prediction is expensive.', 'Yes: more data always makes KNN faster.', 'No: KNN cannot handle more than a million examples at all.'], answer: 1, inline: false },
      ],
      explain: '<p><b>Usually no.</b> KNN is a lazy learner: very cheap “training” but expensive prediction, a major disadvantage for large datasets and latency-sensitive systems.</p>',
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'Where does KNN pay?', type: 'Prediction cost', level: 'Medium', skill: 'cost',
      intro: '<p>Compare a lazy learner like KNN with an eager learner.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Where does KNN pay most of its computational cost?', options: ['At training time', 'Equally at training and prediction time', 'At prediction time', 'Only when new data is added'], answer: 2 },
      ],
      explain: '<p><b>At prediction time.</b> KNN: training / model construction → cheap; prediction → expensive. An eager learner does more work before prediction so that later predictions can be faster.</p>',
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'The dataset grows 400×', type: 'Memory', level: 'Medium', skill: 'cost',
      intro: '<p>A dataset grows from 50,000 examples to 20,000,000 examples.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Why can this become a problem for KNN even before considering prediction speed?', options: ['KNN must retrain from scratch on every new example.', 'The number of features grows with the number of examples.', 'K must grow with the dataset.', 'KNN stores the training instances because they are needed at prediction time, so more examples need more memory.'], answer: 3, inline: false },
      ],
      explain: '<p>KNN stores the training instances because they are needed during prediction, so a larger training set means <b>more memory</b>. It does not compress the dataset into a small fixed set of learned parameters.</p>',
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'New data arrives every hour', type: 'Trade-off', level: 'Medium', skill: 'cost',
      intro: '<p>A recommendation system receives new user examples continuously.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'What is one advantage of KNN in this setting?', options: ['New instances can be added to the stored data without rebuilding a complex model from scratch.', 'Predictions get faster as more data arrives.', 'Memory use stays constant.', 'It no longer needs a distance metric.'], answer: 0, inline: false },
      ],
      explain: '<p>Advantage: new examples are easy to incorporate. Disadvantage: the stored dataset keeps growing, making memory use and prediction cost worse.</p>',
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: '3 features vs. 2,000 features', type: 'Dimensionality', level: 'Medium', skill: 'dist',
      intro: '<p>Dataset A has 3 useful features. Dataset B has 2,000 features.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'Why can KNN struggle badly on dataset B?', options: ['KNN cannot store more than 1,000 features.', 'With many dimensions, points tend to be far apart and distances become less useful for telling similar from dissimilar examples.', 'More features always cause underfitting.', 'Majority voting does not work in high dimensions.'], answer: 1, inline: false },
      ],
      explain: '<p>In high-dimensional spaces points tend to become far apart, and distances become less useful for distinguishing truly similar from dissimilar examples — the <b>curse of dimensionality</b>. The idea of a meaningful “nearest neighbour” becomes weaker.</p>',
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'Is K = 1 always best?', type: 'Choosing K', level: 'Medium', skill: 'k',
      intro: '<blockquote class="qz-quote">“K = 1 is always best because it uses the closest possible example.”</blockquote>',
      parts: [
        { kind: 'mc', pts: 4, q: 'What is wrong with this reasoning?', options: ['Nothing: the closest example is always the most reliable.', 'K = 1 is too slow to compute.', 'K must always be even.', 'The closest example may be noisy, mislabelled or an outlier, and with K = 1 it alone decides; K should be chosen with validation data, e.g. cross-validation.'], answer: 3, inline: false },
      ],
      explain: '<p>With K = 1 a single noisy, mislabelled or outlying example completely determines the prediction. A somewhat larger K reduces this sensitivity; the best K should be chosen using validation data, for example through <b>cross-validation</b>.</p>',
    },
    /* ---------- 15 ---------- */
    {
      id: 't15', title: 'Odd K for two classes', type: 'Choosing K', level: 'Easy', skill: 'k',
      intro: '<p>A binary classification problem has classes A and B.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Why are odd values of K often convenient?', options: ['Odd K is faster to compute.', 'Odd K reduces overfitting.', 'With two classes, an odd K cannot split the vote evenly, so ties are avoided.', 'Odd K works without feature scaling.'], answer: 2, inline: false },
      ],
      explain: '<p>With K = 4 the vote can tie 2 A – 2 B; K = 5 cannot split evenly between two classes.</p>',
    },
    /* ---------- 16 ---------- */
    {
      id: 't16', title: 'Trade-off scenarios', type: 'Scenarios', level: 'Hard', skill: 'trade',
      parts: [
        { kind: 'rows', pts: 10, q: 'For each scenario, is basic KNN a good fit, a poor fit, or does it depend on preprocessing / K?', options: FIT,
          rows: [
            { label: '<b>A.</b> A small dataset, only a few meaningful numerical features, and an irregular class boundary.', answer: 0 },
            { label: '<b>B.</b> Two features — height in meters and annual income in euros — used as raw values.', answer: 2 },
            { label: '<b>C.</b> 30 million examples, and predictions must be returned almost instantly.', answer: 1 },
            { label: '<b>D.</b> New labelled examples arrive frequently and you want them incorporated immediately.', answer: 0 },
            { label: '<b>E.</b> 5,000 features, many of them weak or irrelevant.', answer: 1 },
          ] },
      ],
      explain: '<ul class="concept-list"><li><b>A — good fit</b>: KNN can model complex local boundaries without assuming a particular global distribution.</li><li><b>B — depends on preprocessing</b>: a poor setup unless the features are scaled, because income dominates the distance.</li><li><b>C — poor fit</b>: prediction requires searching the stored training instances.</li><li><b>D — good fit</b>: new instances are simply added to the stored data (but more data → slower predictions and more memory).</li><li><b>E — poor fit</b>: the curse of dimensionality makes distance much less meaningful.</li></ul>',
    },
    /* ---------- 17 ---------- */
    {
      id: 't17', title: 'Diagnose: K = 1', type: 'Diagnosis', level: 'Medium', skill: 'k',
      intro: '<p>A KNN classifier has K = 1, training error almost 0%, and high validation error.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What is the most plausible diagnosis?', options: ['Underfitting', 'Overfitting', 'Curse of dimensionality', 'Too little memory'], answer: 1 },
        { kind: 'mc', pts: 2, q: 'What is a sensible response?', options: ['Decrease K to 0.', 'Remove the validation set.', 'Try a larger K, chosen with validation or cross-validation.', 'Use training error to pick K.'], answer: 2, inline: false },
      ],
      explain: '<p><b>Overfitting</b>: the model follows individual training examples too closely. Try increasing K and select it using validation or cross-validation.</p>',
    },
    /* ---------- 18 ---------- */
    {
      id: 't18', title: 'Diagnose: a very large K', type: 'Diagnosis', level: 'Medium', skill: 'k',
      intro: '<p>A classifier uses a very large K. Its decision boundary is extremely smooth, and it misses meaningful local class regions.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What is happening?', options: ['Overfitting', 'Feature scaling', 'Underfitting', 'Data leakage'], answer: 2 },
        { kind: 'mc', pts: 2, q: 'What is a sensible response?', options: ['Try a smaller K, chosen using validation performance.', 'Increase K further.', 'Add more irrelevant features.', 'Stop scaling the features.'], answer: 0, inline: false },
      ],
      explain: '<p><b>Underfitting</b>: the neighbourhood is so large that local information is averaged away. Try a smaller K, chosen using validation performance.</p>',
    },
    /* ---------- 19 ---------- */
    {
      id: 't19', title: 'Advantages of KNN', type: 'Pros', level: 'Medium', skill: 'trade',
      parts: [
        { kind: 'multi', pts: 6, q: 'Select the statements that describe genuine KNN advantages.',
          options: ['It is simple and intuitive.', 'It has almost no model-building phase.', 'It can naturally represent complex local decision boundaries.', 'It can incorporate new stored examples without a full retraining process.', 'It requires very little prediction-time work on massive datasets.'], answer: [0, 1, 2, 3], inline: false },
      ],
      explain: '<p>1–4 are genuine advantages. Statement 5 is false: prediction-time cost on large datasets is one of KNN’s main <b>disadvantages</b>.</p>',
    },
    /* ---------- 20 ---------- */
    {
      id: 't20', title: 'Disadvantages of KNN', type: 'Cons', level: 'Medium', skill: 'trade',
      parts: [
        { kind: 'multi', pts: 6, q: 'Which of the following are important disadvantages of basic KNN?',
          options: ['Slow prediction for large datasets', 'It cannot be used for regression', 'High memory usage, because the training data must be stored', 'Sensitivity to feature scaling', 'A long, expensive training phase', 'Problems with high-dimensional data'], answer: [0, 2, 3, 5], inline: false },
      ],
      explain: '<p>Slow prediction on large datasets, high memory usage, sensitivity to feature scaling and problems with high-dimensional data are central practical weaknesses of KNN. It <i>can</i> be used for regression (average of the neighbours), and its training phase is almost free.</p>',
    },
    /* ---------- 21 ---------- */
    {
      id: 't21', title: 'Final decision challenge', type: 'Scenario', level: 'Hard', skill: 'trade',
      intro: '<p>You are comparing two possible applications.</p><pre class="qz-code">Application 1\n  Dataset size:       2,000 examples\n  Features:           4 well-scaled measurements\n  Prediction volume:  low\n  Class relationship: locally irregular\n\nApplication 2\n  Dataset size:       50 million examples\n  Features:           3,000\n  Prediction volume:  extremely high\n  Latency:            strict requirement</pre>',
      parts: [
        { kind: 'mc', pts: 6, q: 'Which application is more naturally suited to basic KNN?', options: ['Application 1', 'Application 2', 'Both equally'], answer: 0, letters: false },
      ],
      explain: '<p><b>Application 1</b> matches KNN’s strengths: small dataset, few dimensions, scaled features, local patterns, low prediction volume. Application 2 combines several weaknesses: huge training set, high dimensionality, high memory requirements, expensive prediction, strict latency constraints.</p>',
    },
  ],
};
