/* ===== Lab 06 quiz: question data (rendered and graded by quiz.js) ===== */
const LAB = 'lab06-intro-ml.html';
const YN = { options: ['Yes', 'No'], letters: false };
const CR = ['Classification', 'Regression'];

window.QUIZ = {
  id: 'lab06',
  skills: [
    { id: 'found', label: 'Tasks and learning paradigms', href: LAB + '#concepts' },
    { id: 'data', label: 'Features, targets and data splits', href: LAB + '#concepts' },
    { id: 'gen', label: 'Overfitting, underfitting, bias and variance', href: LAB + '#concepts' },
    { id: 'train', label: 'Parameters and the training loop', href: LAB + '#concepts' },
    { id: 'review', label: 'Mixed review', href: LAB + '#concepts' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: 'AI or machine learning?', type: 'Concept', level: 'Easy', skill: 'found',
      parts: [
        { kind: 'mc', pts: 4, q: 'Which statement is correct?', options: ['Every AI system must use machine learning.', 'Machine learning is a branch of AI that learns patterns from data.', 'AI and machine learning mean exactly the same thing.', 'Machine learning cannot make predictions on unseen data.'], answer: 1, inline: false },
      ],
      explain: '<p>Machine learning is a <b>branch of AI</b>. Not every AI system uses machine learning: a rule-based system may be AI without learning from data.</p>',
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'Classification or regression?', type: 'Task type', level: 'Easy', skill: 'found',
      parts: [
        { kind: 'rows', pts: 10, q: 'For each task, decide whether it is classification or regression.', options: CR,
          rows: [
            { label: '<b>A.</b> Predict the price of an apartment.', answer: 1 },
            { label: '<b>B.</b> Predict whether an email is spam / not spam.', answer: 0 },
            { label: '<b>C.</b> Predict a person’s weight.', answer: 1 },
            { label: '<b>D.</b> Predict whether an image contains a cat / dog / horse.', answer: 0 },
            { label: '<b>E.</b> Predict how many minutes a food delivery will take.', answer: 1 },
            { label: '<b>F.</b> Recognise which digit (0–9) is written in a handwritten image.', answer: 0 },
            { label: '<b>G.</b> Predict a student’s final exam score out of 100.', answer: 1 },
            { label: '<b>H.</b> Predict a film’s genre: comedy / drama / horror.', answer: 0 },
            { label: '<b>I.</b> Predict a loan applicant’s risk level: low / medium / high.', answer: 0 },
            { label: '<b>J.</b> Predict a household’s electricity consumption next month (kWh).', answer: 1 },
          ] },
      ],
      explain: '<p><b>Regression</b> (a continuous numeric quantity): A price, C weight, E delivery time, G exam score, J electricity consumption. <b>Classification</b> (a discrete class): B spam, D animal, F digit, H genre, I risk level.</p><p>Watch F and I: the digits 0–9 are written as numbers, and low / medium / high has an order, but both are still a fixed set of categories, not a quantity to measure.</p>',
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Spot the trick', type: 'Trap', level: 'Medium', skill: 'found',
      intro: '<p>A model predicts <code>0 = failed</code>, <code>1 = passed</code>.</p>',
      parts: [
        { kind: 'mc', pts: 6, q: 'Is this regression because the outputs are numbers?',
          options: ['Yes: the model outputs numbers, so it is regression.', 'No: 0 and 1 are codes for two categories, so it is classification.', 'Yes, as long as the loss function is numeric.', 'No: it is unsupervised learning.'], answer: 1, inline: false },
      ],
      explain: '<p><b>No — this is classification.</b> The values 0 and 1 represent the categories <i>failed</i> and <i>passed</i>. The important question is not “is the output written as a number?” but “does the output represent a continuous quantity or a discrete class?”</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'Supervised or unsupervised?', type: 'Learning paradigm', level: 'Easy', skill: 'found',
      parts: [
        { kind: 'rows', pts: 5, q: 'Identify the learning paradigm.', options: ['Supervised', 'Unsupervised'],
          rows: [
            { label: '<b>A.</b> The training examples contain house features → known house price.', answer: 0 },
            { label: '<b>B.</b> A dataset contains customer behaviour but no predefined customer groups; the goal is to discover natural groups in the data.', answer: 1 },
          ] },
      ],
      explain: '<p>A: <b>supervised</b> — the correct target is provided. B: <b>unsupervised</b> — there are no provided labels. Supervised = inputs + known target; unsupervised = inputs only, no known target.</p>',
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'Feature or target?', type: 'Data', level: 'Easy', skill: 'data',
      intro: '<p>A dataset for <b>house-price prediction</b> contains these columns.</p>',
      parts: [
        { kind: 'rows', pts: 5, q: 'Which are the features, and which is the target?', options: ['Feature', 'Target'],
          rows: [{ label: 'square meters', answer: 0 }, { label: 'number of bedrooms', answer: 0 }, { label: 'distance from city center', answer: 0 }, { label: 'house price', answer: 1 }] },
      ],
      explain: '<p>Features: square meters, number of bedrooms, distance from city center. Target: house price. Features are the information given to the model; the target is the value the model should predict.</p>',
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'Training set vs. test set', type: 'Data splits', level: 'Easy–Medium', skill: 'data',
      intro: '<p>A student trains a model using 10,000 examples. They then report the model’s accuracy using those exact same 10,000 examples.</p>',
      parts: [
        { kind: 'mc', pts: 5, q: 'What is the problem?', options: ['10,000 examples are too few to train on.', 'Accuracy is never a valid metric.', 'They measure performance on the training data, not on unseen data; a separate test set is needed to measure generalization.', 'They should have used unsupervised learning.'], answer: 2, inline: false },
      ],
      explain: '<p>They are measuring performance on the <b>training data</b>, not on unseen data. A separate <b>test set</b> should be used to measure how well the trained model generalizes.</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'Training, validation or test?', type: 'Data splits', level: 'Medium', skill: 'data',
      parts: [
        { kind: 'rows', pts: 6, q: 'Match each role to the dataset split.', options: ['Training set', 'Validation set', 'Test set'],
          rows: [
            { label: '1. Used to fit model parameters.', answer: 0 },
            { label: '2. Used during development to compare settings or model choices.', answer: 1 },
            { label: '3. Used for the final evaluation on unseen data.', answer: 2 },
          ] },
      ],
      explain: '<p>Training set → 1, validation set → 2, test set → 3. The test set should not become part of the repeated model-development process; otherwise it is no longer a clean estimate of performance on unseen data.</p>',
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'What is overfitting?', type: 'Generalization', level: 'Medium', skill: 'gen',
      intro: '<p>A model achieves <b>training accuracy 99%</b> and <b>test accuracy 68%</b>.</p>',
      parts: [
        { kind: 'mc', pts: 6, q: 'Which phenomenon is the strongest warning sign here?', options: ['Underfitting', 'Overfitting', 'Unsupervised learning', 'Feature scaling'], answer: 1 },
      ],
      explain: '<p><b>Overfitting</b>: the model learns the training data extremely well but does not generalize to unseen data (training performance very good, test performance much worse). Overfitting is associated with <b>high variance</b>.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'What is underfitting?', type: 'Generalization', level: 'Medium', skill: 'gen',
      intro: '<p><b>Training accuracy 58%</b>, <b>test accuracy 55%</b>. The task is known to be learnable much more accurately.</p>',
      parts: [
        { kind: 'mc', pts: 5, q: 'Which phenomenon is most likely?', options: ['Overfitting', 'Data leakage', 'Underfitting', 'Too many training examples'], answer: 2 },
      ],
      explain: '<p><b>Underfitting</b>: the model is not capturing the important relationship even in the training data (training and test performance both poor). Underfitting is associated with <b>high bias</b>.</p>',
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'Bias or variance?', type: 'Generalization', level: 'Medium', skill: 'gen',
      parts: [
        { kind: 'rows', pts: 9, q: 'Match each description.', options: ['High bias', 'High variance'],
          rows: [
            { label: '<b>A.</b> The model is too simple to capture the real underlying relationship.', answer: 0 },
            { label: '<b>B.</b> Training the same type of model on different samples produces very different predictions.', answer: 1 },
            { label: '<b>C.</b> The model fits random fluctuations in its training sample.', answer: 1 },
          ] },
      ],
      explain: '<p>A → <b>high bias</b>; B and C → <b>high variance</b>. High bias: the model is systematically too simple. High variance: the model is too sensitive to the particular training data.</p>',
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'Parameter or hyperparameter?', type: 'Training', level: 'Medium', skill: 'train',
      parts: [
        { kind: 'rows', pts: 5, q: 'Classify each item.', options: ['Parameter', 'Hyperparameter'],
          rows: [
            { label: '<b>A.</b> A value learned automatically from the training data.', answer: 0 },
            { label: '<b>B.</b> A configuration chosen before or around training that controls the learning process.', answer: 1 },
            { label: '<b>C.</b> Batch size.', answer: 1 },
            { label: '<b>D.</b> A model weight learned during training.', answer: 0 },
          ] },
      ],
      explain: '<p>A and D are <b>parameters</b> (learned from data); B and C are <b>hyperparameters</b> (chosen to control training).</p>',
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'Batch, iteration or epoch?', type: 'Training', level: 'Medium', skill: 'train',
      parts: [
        { kind: 'rows', pts: 6, q: 'Match each definition.', options: ['Batch', 'Iteration', 'Epoch'],
          rows: [
            { label: '1. A subset of the training examples processed together.', answer: 0 },
            { label: '2. One model-update step using one batch.', answer: 1 },
            { label: '3. One complete pass through the entire training dataset.', answer: 2 },
          ] },
        { kind: 'num', pts: 3, q: 'There are 1000 training examples and the batch size is 100. How many iterations does one epoch take?', answer: 10 },
      ],
      explain: '<p>Batch → 1, iteration → 2, epoch → 3. One epoch over 1000 examples with batch size 100 takes 1000 / 100 = <b>10 iterations</b>.</p>',
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: 'Dimensionality', type: 'Data', level: 'Easy', skill: 'data',
      intro: '<p>A dataset contains these input features: age, salary, years of experience, distance from work, number of children.</p>',
      parts: [{ kind: 'num', pts: 4, q: 'What is the dimensionality of the input data?', answer: 5 }],
      explain: '<p><b>5</b>. Dimensionality is the <b>number of features</b> used to represent each example.</p>',
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'Feature engineering vs. feature scaling', type: 'Data', level: 'Easy–Medium', skill: 'data',
      parts: [
        { kind: 'rows', pts: 5, q: 'Name the technique.', options: ['Feature engineering', 'Feature scaling'],
          rows: [
            { label: '<b>A.</b> Convert <code>date = 2026-12-25</code> into a new feature <code>is_holiday = 1</code>.', answer: 0 },
            { label: '<b>B.</b> Transform salary and age so that their numerical ranges become comparable.', answer: 1 },
          ] },
      ],
      explain: '<p>A: <b>feature engineering</b> — a new informative feature is created from existing data. B: <b>feature scaling</b> — the values are transformed to similar scales.</p>',
    },
    /* ---------- 15 ---------- */
    {
      id: 't15', title: 'Loss function', type: 'Training', level: 'Easy', skill: 'train',
      intro: '<p>A model predicts \\(\\hat{y}\\); the correct target is \\(y\\).</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'What is the purpose of a loss / cost / objective function?', options: ['Measure how wrong the model’s predictions are.', 'Count the number of input features.', 'Split data into training and test sets.', 'Decide whether the task is supervised.'], answer: 0, inline: false },
      ],
      explain: '<p>The loss function gives training a quantity to <b>minimize</b>: large loss → predictions are poor; small loss → predictions are closer to the desired outputs.</p>',
    },
    /* ---------- 16 ---------- */
    {
      id: 't16', title: 'Quick scenario challenge', type: 'Mixed review', level: 'Medium', skill: 'review',
      intro: '<p>For each problem, identify the correct term.</p>',
      parts: [
        { kind: 'rows', pts: 3, q: 'What kind of problem is it?', options: ['Regression', 'Classification', 'Unsupervised learning'],
          rows: [
            { label: 'Predict tomorrow’s temperature', answer: 0 },
            { label: 'Predict whether a transaction is fraudulent', answer: 1 },
            { label: 'Discover natural groups of customers without labels', answer: 2 },
          ] },
        { kind: 'rows', pts: 4, q: 'Which data term fits?', options: ['Feature', 'Target / label', 'Training set', 'Test set'],
          rows: [
            { label: 'Input variable such as age', answer: 0 },
            { label: 'Correct output the model should predict', answer: 1 },
            { label: 'Data used to learn model parameters', answer: 2 },
            { label: 'Data used for final unseen evaluation', answer: 3 },
          ] },
        { kind: 'rows', pts: 5, q: 'Which training term fits?', options: ['Overfitting', 'Underfitting', 'Parameter', 'Hyperparameter', 'Epoch'],
          rows: [
            { label: 'Excellent training performance, poor test performance', answer: 0 },
            { label: 'Poor training and test performance', answer: 1 },
            { label: 'Learned model weight', answer: 2 },
            { label: 'Batch size', answer: 3 },
            { label: 'Full pass through training data', answer: 4 },
          ] },
      ],
      explain: '<p>Temperature → regression; fraud → classification; groups without labels → unsupervised learning. Age → feature; correct output → target / label; learning parameters → training set; final unseen evaluation → test set. Great training / poor test → overfitting; poor both → underfitting; learned weight → parameter; batch size → hyperparameter; full pass → epoch.</p>',
    },
  ],
};
