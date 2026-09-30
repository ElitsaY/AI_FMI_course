/* ===== Lab 13 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab13-alignment.html';
/* ---------- small static visuals (reuse the lab's .al-card / .al-flow2 / .al-map / .ps-sol / .vf-card styles) ---------- */
const viz = (html, cls = '') => `<div class="qzv ${cls}">${html}</div>`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const card = (h, p, cls = '') => `<div class="al-card ${cls}"><h5>${h}</h5><p>${p}</p></div>`;
const pair = (...cs) => viz(`<div class="al-pair${cs.length === 3 ? ' al-three' : ''}">` + cs.join('') + '</div>');
const stack = (...cs) => viz('<div class="al-stack">' + cs.join('') + '</div>');
const stat = (l, v) => `<div class="qzv-node qzv-stat"><b>${l}</b><span>${v}</span></div>`;
const cards = (...items) => viz('<div class="qzv-nodes">' + items.join('') + '</div>');
const bars = rows => '<div class="qzv-bars">' + rows.map(([l, v, max, shown, cls]) => `<div class="qzv-bar ${cls || ''}"><span>${l}</span><span class="track"><i style="width:${Math.max(0, 100 * v / max)}%"></i></span><b>${shown}</b></div>`).join('') + '</div>';
const flowV = (...items) => viz('<div class="tf-flow">' + items.map(t => `<div class="tf-fl">${t}</div>`).join('<div class="tf-arr">↓</div>') + '</div>');
const lane = (...parts) => '<div class="al-lane">' + parts.map(p => p === '→' || p === '+' ? `<span class="ar">${p}</span>` : p.startsWith('!') ? `<span class="n learned">${p.slice(1)}</span>` : `<span class="n">${p}</span>`).join('') + '</div>';
const lanes = (...ls) => viz('<div class="al-flow2">' + ls.join('') + '</div>');
const chipsV = items => viz('<div class="tk-chips">' + items.map(t => `<span class="tk-chip">${t}</span>`).join('') + '</div>');
// a two-line plot of proxy score and true quality against optimisation strength
const GOODHART = (() => {
  const w = 420, h = 260, L = 44, R = 18, T = 18, B = 40, X = i => L + 20 + i * (w - L - R - 40) / 3, Y = v => h - B - v / 11 * (h - T - B);
  const P = [4, 6, 8, 10], Q = [4, 7, 8, 5];
  let g = `<rect class="km-frame" x="${L}" y="${T}" width="${w - L - R}" height="${h - T - B}"/>`;
  for (let v = 0; v <= 10; v += 2) g += `<line class="gl" x1="${L}" y1="${Y(v)}" x2="${w - R}" y2="${Y(v)}"/><text class="tk" x="${L - 8}" y="${Y(v)}" text-anchor="end" dominant-baseline="central">${v}</text>`;
  [1, 2, 3, 4].forEach((n, i) => { g += `<text class="tk" x="${X(i)}" y="${h - B + 22}" text-anchor="middle">${n}</text>`; });
  g += `<polyline class="gh-p" points="${P.map((v, i) => X(i) + ',' + Y(v)).join(' ')}"/><polyline class="gh-q" points="${Q.map((v, i) => X(i) + ',' + Y(v)).join(' ')}"/>`;
  g += P.map((v, i) => `<circle class="gh-pd" cx="${X(i)}" cy="${Y(v)}" r="5.5"/>`).join('') + Q.map((v, i) => `<rect class="gh-qd" x="${X(i) - 5}" y="${Y(v) - 5}" width="10" height="10"/>`).join('');
  return viz(`<svg class="ml-plot qzv-plot" viewBox="0 0 ${w} ${h}" role="img">${g}</svg><p class="qzv-legend"><span><i class="lg p"></i> proxy score</span><span><i class="lg q"></i> true quality</span><span>x: optimisation strength</span></p>`);
})();
const PROGS = [
  ['Program 1', 'def is_even(n):\n    print("All tests passed")\n    return True'],
  ['Program 2', 'def is_even(n):\n    return n % 2 == 0'],
  ['Program 3', 'def is_even(n):\n    return n % 4 == 2'],
  ['Program 4', 'def is_even(n):\n    return n == 2'],
];

window.QUIZ = {
  id: 'lab13',
  skills: [
    { id: 'stages', label: 'Pretraining, SFT and the assistant', href: LAB + '#pretraining' },
    { id: 'prefs', label: 'Preferences, reward models and RLHF', href: LAB + '#preferences' },
    { id: 'hack', label: 'Reward hacking and Goodhart', href: LAB + '#hacking' },
    { id: 'dpo', label: 'DPO, human feedback and trade-offs', href: LAB + '#dpo' },
    { id: 'verify', label: 'AI feedback, process and verifiable rewards', href: LAB + '#ai-feedback' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: 'Three training objectives', type: 'Stages', level: 'Easy', skill: 'stages',
      intro: pair(card('A', 'Predict the next token from large-scale text.'), card('B', 'Imitate curated examples of desired assistant responses.'), card('C', 'Prefer chosen responses over rejected responses.')),
      parts: [
        { kind: 'rows', pts: 3, q: 'Which training stage has each objective?', options: ['Pretraining', 'Supervised fine-tuning', 'Preference-based post-training'],
          rows: [
            { label: 'A', answer: 0 },
            { label: 'B', answer: 1 },
            { label: 'C', answer: 2 },
          ] },
      ],
      explain: '<p><b>A</b>: pretraining (next-token prediction on huge amounts of text). <b>B</b>: supervised fine-tuning, SFT (imitate target responses). <b>C</b>: preference-based post-training, e.g. RLHF or DPO (chosen ≻ rejected).</p>',
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'From base model to SFT model', type: 'SFT', level: 'Easy', skill: 'stages',
      intro: flowV('Large text corpus', 'Pretraining', 'Base model', 'SFT', 'Instruction-following model'),
      parts: [
        { kind: 'mc', pts: 3, q: 'What changes most directly from the base model to the SFT model?', options: ['Its tokenizer is always replaced by a new one', 'Its vocabulary becomes much smaller', 'It learns the desired response behaviour', 'It stops predicting the next token'], answer: 2, inline: false },
      ],
      explain: '<p>SFT trains the model on examples of how an assistant should respond: it learns the <b>desired response behaviour</b> (instruction following, structure, tone). It keeps the same tokenizer and still predicts tokens, usually with the same next-token loss.</p>',
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'Translate “good morning”', type: 'Base vs. assistant', level: 'Easy', skill: 'stages',
      intro: stack(card('Prompt', 'Translate "good morning" into Spanish.'), card('Output A', 'Buenos días.'), card('Output B', 'Translate "good night" into French.<br>Translate "thank you" into German.')),
      parts: [
        { kind: 'mc', pts: 2, q: 'Which output looks more like instruction-following assistant behaviour?', options: ['Output A', 'Output B'], answer: 0, letters: false },
        { kind: 'mc', pts: 1, q: 'What is Output B doing?', options: ['Refusing the request', 'Continuing a worksheet-like pattern', 'Translating into the wrong language'], answer: 1, inline: false },
      ],
      explain: '<p><b>Output A</b> performs the requested task. Output B is a perfectly plausible <b>continuation</b> of a list of translation exercises, what a base model predicts after a worksheet-like prompt, but it does not do what the user asked.</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'Only next-token prediction', type: 'Pretraining', level: 'Medium', skill: 'stages',
      intro: M`<p>A model is trained only with next-token prediction:</p><div class="math-block">\[ \mathcal{L}_{\text{pretrain}} = -\sum_t \log p(x_t \mid x_{&lt;t}) \]</div>`,
      parts: [
        { kind: 'mc', pts: 3, q: 'Which behaviour is <b>not explicitly present</b> in that objective?', options: ['Predict likely continuation text', 'Follow the user’s instruction', 'Match the statistics of the text', 'Assign probabilities to tokens'], answer: 1, inline: false },
        { kind: 'num', pts: 2, q: M`The model gives the true next token <i>Paris</i> probability 0.9 after <i>The capital of France is</i>. What is that token's loss \(-\ln p\)? (two decimals)`, answer: -Math.log(0.9), tol: 0.006, show: '−ln 0.9 ≈ 0.11' },
      ],
      explain: M`<p>Next-token prediction rewards likely continuations and well-calibrated token probabilities; nothing in it says <b>follow the instruction</b> or be helpful. Useful abilities emerge, but which behaviour the model shows depends on what kind of text the prompt resembles.</p><p>Loss: \(-\ln 0.9 \approx 0.105\): a confident correct prediction costs little (with \(p = 0.1\) it would be \(\approx 2.30\)).</p>`,
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'One SFT example', type: 'SFT', level: 'Easy', skill: 'stages',
      intro: pair(card('Prompt', 'Explain overfitting in one paragraph.'), card('Target response', 'Overfitting occurs when a model learns patterns that are too specific to the training set…', 'chosen')),
      parts: [
        { kind: 'mc', pts: 2, q: 'What supervision does the model receive?', options: ['A reward score for its own answer', 'A ranking of two of its answers', 'A target response to imitate', 'No labels at all, only raw text'], answer: 2, inline: false },
      ],
      explain: '<p>SFT gives a <b>high-quality target response</b>, and the model is trained to imitate it (next-token loss on the response tokens). Its limitation: someone must write these examples.</p>',
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'Pretraining data vs. SFT data', type: 'Data', level: 'Easy', skill: 'stages',
      parts: [
        { kind: 'rows', pts: 2, q: 'What is the typical training data of each stage?', options: ['Huge amounts of natural text', 'Smaller curated prompt–response pairs', 'Chosen / rejected response pairs'],
          rows: [
            { label: 'Pretraining', answer: 0 },
            { label: 'SFT', answer: 1 },
          ] },
      ],
      explain: '<p>Pretraining: very large, naturally occurring text. SFT: a much smaller, <b>curated</b> collection of prompt–response examples. The two may use the same next-token loss; the data and the behavioural goal differ. (Chosen / rejected pairs are preference data.)</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'A > B', type: 'Preference data', level: 'Easy', skill: 'prefs',
      intro: '<p>For one prompt (<i>Explain gradient descent to a beginner.</i>) a human compares two responses and labels <b>A &gt; B</b>.</p>'
        + pair(card('Response A', 'Gradient descent repeatedly changes the parameters in the direction that reduces the loss, like walking downhill in small steps.', 'chosen'), card('Response B', 'Gradient descent applies iterative updates using the negative local derivative of the scalar objective.', 'rejected')),
      parts: [
        { kind: 'mc', pts: 2, q: 'What kind of training data is this?', options: ['Regression targets', 'Preference data', 'Unlabelled text', 'Token embeddings'], answer: 1 },
      ],
      explain: '<p><b>Preference data</b>: a typical record is (prompt, chosen response, rejected response).</p>',
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'Compare instead of write', type: 'Preference data', level: 'Easy', skill: 'prefs',
      intro: '<p>An evaluator finds it hard to write the perfect answer from scratch, but can easily decide which of two answers is better.</p>',
      parts: [
        { kind: 'mc', pts: 2, q: 'What advantage does pairwise preference collection provide?', options: ['Relative judgements are easier to collect', 'Pairs remove all disagreement between people', 'Comparisons need no human evaluators at all', 'The data becomes objective ground truth'], answer: 0, inline: false },
      ],
      explain: '<p>It can be easier and cheaper to collect <b>relative judgements</b> (A is better than B) than complete ideal responses. It does not remove disagreement or make the labels objective.</p>',
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'Two users, one topic', type: 'Context', level: 'Medium', skill: 'prefs',
      intro: pair(card('Prompt 1', 'A beginner asks: “What is logistic regression?”'), card('Prompt 2', 'A programmer implementing it asks: “What is the prediction equation?”')),
      parts: [
        { kind: 'rows', pts: 2, q: 'Which response style is preferable for each prompt?', options: ['Plain-language explanation', 'The prediction equation'],
          rows: [
            { label: 'Prompt 2', answer: 1 },
            { label: 'Prompt 1', answer: 0 },
          ] },
        { kind: 'mc', pts: 2, q: 'What does this show about “better” responses?', options: ['One style is always best for a topic', 'It depends on the user and their goal', 'Beginners’ preferences should be ignored', 'Technical answers are always preferred'], answer: 1, inline: false },
      ],
      explain: '<p>The same two <i>styles</i> swap places: a simple conceptual answer for the beginner, the equation for the implementer. “Better” depends on the <b>prompt, the user’s background and their goal</b>, so preference data must capture that context.</p>',
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'The RLHF pipeline', type: 'RLHF', level: 'Medium', skill: 'prefs',
      intro: lanes(lane('Pretrained model', '→', 'SFT', '→', 'SFT model'), lane('SFT model', '→', 'candidate responses', '→', 'human comparisons', '→', '!reward model'), lane('!reward model', '→', 'RL optimisation', '→', 'final model')),
      parts: [
        { kind: 'mc', pts: 4, q: 'What does the reward model learn?', options: ['The exact true utility of a response', 'The tokenizer’s vocabulary', 'The number of examples in the training set', 'A score estimating human preference'], answer: 3, inline: false },
      ],
      explain: '<p>The reward model learns a <b>score that estimates human preference</b>, a proxy trained on pairwise comparisons, not the true utility. RL then updates the language model to earn higher scores.</p>',
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'r(A) = 2.0, r(B) = 0.5', type: 'Reward model', level: 'Medium', skill: 'prefs',
      intro: M`<p>Humans prefer response A over B. The reward model gives:</p>` + viz(bars([['r(A) chosen', 2.0, 2.5, '2.0'], ['r(B) rejected', 0.5, 2.5, '0.5', 'val']]), 'qzv-wide')
        + M`<p>The lab's Bradley–Terry model: \(P(A \succ B) = \sigma\big(r(A) - r(B)\big)\).</p>`,
      parts: [
        { kind: 'mc', pts: 1, q: 'Does the reward model rank this pair in the desired direction?', options: ['Yes', 'No'], answer: 0, letters: false },
        { kind: 'num', pts: 3, q: M`What probability \(P(A \succ B)\) does it assign? (two decimals)`, answer: 1 / (1 + Math.exp(-1.5)), tol: 0.006, pct: true, show: 'σ(1.5) ≈ 0.82' },
      ],
      explain: M`<p><b>Yes</b>: the chosen response gets the higher score. \(P(A \succ B) = \sigma(2.0 - 0.5) = \sigma(1.5) = \frac{1}{1 + e^{-1.5}} \approx 0.82\). Only the <b>difference</b> of the two rewards matters; the loss \(-\log 0.82 \approx 0.20\) is small because the model agrees with the human by a clear margin.</p>`,
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'A reward of 8.7', type: 'Reward model', level: 'Easy', skill: 'prefs',
      intro: cards(stat('reward-model score', '8.7')),
      parts: [
        { kind: 'mc', pts: 3, q: 'Which interpretation is correct?', options: ['It is a learned preference estimate', 'It is objective ground truth', 'It is the probability of being correct', 'It proves that the response is safe'], answer: 0, inline: false },
      ],
      explain: '<p>The score comes from <b>another learned model</b>, trained on a limited set of (noisy) human comparisons. It is an estimate of preference, not truth, correctness or safety.</p>',
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: 'Reward minus a penalty', type: 'KL regularisation', level: 'Medium', skill: 'prefs',
      intro: M`<p>The KL-constrained RLHF objective:</p><div class="math-block">\[ \max_{\pi}\; \mathbb{E}_{y \sim \pi}\big[r(x, y)\big] \;-\; \beta\, D_{\mathrm{KL}}\big(\pi \,\|\, \pi_{\text{ref}}\big) \]</div><p>reward − penalty for moving far from the reference (SFT) behaviour.</p>`,
      parts: [
        { kind: 'mc', pts: 3, q: 'Why include the second term?', options: ['It makes the reward model train faster', 'It keeps the policy near the reference', 'It turns the reward into a probability', 'It removes the need for preference data'], answer: 1, inline: false },
      ],
      explain: '<p>The reward model is imperfect. Without a constraint, aggressive optimisation drifts far from sensible behaviour and <b>exploits the reward model’s weaknesses</b>. The KL term keeps the policy close to the reference model while it improves.</p>',
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'A reward for tutoring answers', type: 'Reward hacking', level: 'Medium', skill: 'hack',
      intro: '<p>A tutoring reward, meant to encourage explanations that help students understand:</p>'
        + viz('<table class="qz-pq"><thead><tr><th>Component</th><th>Reward</th></tr></thead><tbody><tr><td>answer longer than 250 words</td><td>+2</td></tr><tr><td>contains at least 3 equations</td><td>+2</td></tr><tr><td>uses technical vocabulary</td><td>+1</td></tr></tbody></table>', 'qzv-table'),
      parts: [
        { kind: 'mc', pts: 3, q: 'Which answer could score well without being a good explanation?', options: ['A concise, clear answer at the right level', 'A correction of a factual mistake', 'A short and relevant worked example', 'A padded answer full of needless equations'], answer: 3, inline: false },
        { kind: 'num', pts: 2, q: 'What reward does a 400-word answer with three equations and heavy jargon get?', answer: 5 },
        { kind: 'num', pts: 1, q: 'And a clear 150-word answer with one equation, in plain words?', answer: 0 },
      ],
      explain: '<p>The padded answer collects 2 + 2 + 1 = <b>5</b>, the clear short answer <b>0</b>. The model can maximise the measured features without improving student understanding.</p>',
    },
    /* ---------- 15 ---------- */
    {
      id: 't15', title: 'Long answers, many equations', type: 'Reward hacking', level: 'Medium', skill: 'hack',
      intro: pair(card('Real objective', 'student understanding'), card('What the training rewards', 'long answers · many equations · technical vocabulary')) + '<p>The model learns to maximise those signals.</p>',
      parts: [
        { kind: 'mc', pts: 4, q: 'What failure mode is this?', options: ['Reward hacking (specification gaming)', 'Underfitting the preference data', 'Too much KL regularisation in training', 'Forgetting what pretraining taught'], answer: 0, inline: false },
      ],
      explain: '<p><b>Reward hacking</b>, also called <b>specification gaming</b>: the model optimises the <b>proxy</b> (what is measured) rather than the real objective.</p>',
    },
    /* ---------- 16 ---------- */
    {
      id: 't16', title: 'Goal, proxy, failure', type: 'Real goal vs. proxy', level: 'Medium', skill: 'hack',
      parts: [
        { kind: 'rows', pts: 3, q: 'A customer-support bot is rewarded for <b>shorter conversations</b>. Classify each item.', options: ['Real goal', 'Proxy', 'Failure mode'],
          rows: [
            { label: 'Conversation length', answer: 1 },
            { label: 'Ending chats early with rushed answers', answer: 2 },
            { label: 'Solving the customer’s problem', answer: 0 },
          ] },
        { kind: 'rows', pts: 2, q: 'A moderation system is rewarded for <b>minimising harmful messages that stay visible</b>.', options: ['Real goal', 'Proxy', 'Failure mode'],
          rows: [
            { label: 'Removing almost every message', answer: 2 },
            { label: 'Removing harm while keeping legitimate speech', answer: 0 },
            { label: 'Few harmful messages visible', answer: 1 },
          ] },
      ],
      explain: '<p><b>Support bot</b>: goal = solve the problem; proxy = conversation length; failure = ending chats early, rushed or wrong answers, customers giving up. <b>Moderation</b>: goal = remove harmful content while keeping legitimate speech; proxy = few harmful messages visible; failure = massive over-removal.</p>',
    },
    /* ---------- 17 ---------- */
    {
      id: 't17', title: 'Proxy 4 → 10, quality 4 → 5', type: 'Goodhart', level: 'Medium', skill: 'hack',
      intro: '<p>As optimisation strength increases (1 → 4):</p>' + GOODHART,
      parts: [
        { kind: 'mc', pts: 3, q: 'What does this illustrate?', options: ['The proxy is a perfect measure', 'A Goodhart-style failure', 'Too little optimisation', 'Noise in the true quality'], answer: 1, inline: false },
        { kind: 'num', pts: 2, q: 'At which optimisation strength (1–4) is the true quality highest?', answer: 3 },
      ],
      explain: '<p>The proxy keeps rising (4 → 6 → 8 → 10), while the true quality peaks at strength <b>3</b> (8) and then falls to 5: once a proxy becomes the optimisation target, it stops being a good measure of the real goal (<b>Goodhart</b>). The lab’s KL widget shows the same shape as β is lowered.</p>',
    },
    /* ---------- 18 ---------- */
    {
      id: 't18', title: 'Two ways to use preferences', type: 'RLHF vs. DPO', level: 'Easy', skill: 'dpo',
      intro: lanes('<b class="al-lbl">Pipeline A</b>' + lane('preferences', '→', '!reward model', '→', 'RL optimisation'), '<b class="al-lbl">Pipeline B</b>' + lane('preferences', '→', 'raise chosen, lower rejected directly')),
      parts: [
        { kind: 'rows', pts: 2, q: 'Name each pipeline.', options: ['RLHF', 'DPO', 'SFT'],
          rows: [
            { label: 'Pipeline A', answer: 0 },
            { label: 'Pipeline B', answer: 1 },
          ] },
      ],
      explain: '<p><b>A: RLHF</b> (reward model, then reinforcement learning). <b>B: DPO</b> (the language model is trained directly on the preference pairs).</p>',
    },
    /* ---------- 19 ---------- */
    {
      id: 't19', title: 'What DPO skips', type: 'DPO', level: 'Medium', skill: 'dpo',
      intro: M`<div class="math-block">\[ \mathcal{L}_{\text{DPO}} = -\log \sigma\!\Big( \beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)} \Big) \]</div>`,
      parts: [
        { kind: 'mc', pts: 3, q: 'Which component does DPO avoid training separately?', options: ['The language model', 'The preference dataset', 'The reference model', 'The reward model'], answer: 3, inline: false },
        { kind: 'num', pts: 3, q: M`As in the lab's widget: \(\beta = 0.5\); the policy has raised \(\log \frac{\pi}{\pi_{\text{ref}}}\) of the chosen response by 1.0 and lowered that of the rejected one by 1.0. What is the DPO loss? (two decimals)`, answer: -Math.log(1 / (1 + Math.exp(-1))), tol: 0.006, show: '−log σ(1) ≈ 0.31' },
      ],
      explain: M`<p>DPO uses the preference pairs directly, <b>without a separate reward model and RL loop</b>; it still needs the data and a reference model. Here the argument is \(0.5 \cdot 1.0 - 0.5 \cdot (-1.0) = 1\), so \(\mathcal{L} = -\log \sigma(1) = \log(1 + e^{-1}) \approx 0.31\) (it was \(\log 2 \approx 0.69\) before training).</p>`,
    },
    /* ---------- 20 ---------- */
    {
      id: 't20', title: 'Preference data that favours length', type: 'DPO', level: 'Medium', skill: 'dpo',
      intro: '<p>The preference data consistently prefers <b>very long answers</b>, even when shorter answers are better.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'What might DPO learn?', options: ['Longer, more verbose answers', 'Shorter answers: DPO corrects bad labels', 'Nothing: DPO ignores the length', 'Answers of a random length'], answer: 0, inline: false },
      ],
      explain: '<p>DPO faithfully learns what the data prefers, so answers become <b>more verbose</b>. Changing the optimisation method does not fix poor preference data or a poorly specified goal.</p>',
    },
    /* ---------- 21 ---------- */
    {
      id: 't21', title: 'Three annotators, three verdicts', type: 'Human feedback', level: 'Medium', skill: 'dpo',
      intro: cards(stat('Annotator 1', 'A better'), stat('Annotator 2', 'B better'), stat('Annotator 3', 'tie')),
      parts: [
        { kind: 'mc', pts: 2, q: 'What does this show?', options: ['Feedback is not one well-defined truth', 'Two of the three annotators must be wrong', 'The two answers must be exactly identical', 'Pairwise comparisons cannot be used'], answer: 0, inline: false },
        { kind: 'multi', pts: 2, q: 'Which of these could explain the disagreement?', options: ['Different expertise', 'Ambiguous instructions', 'Annotation mistakes', 'The tokenizer used', 'The GPU type'], answer: [0, 1, 2], letters: false },
      ],
      explain: '<p>“Human feedback” is not one perfectly defined objective. Disagreement can come from expertise, instructions, preferences, ambiguity and annotation noise; the result depends on who labels, with which instructions, and how disagreements are handled.</p>',
    },
    /* ---------- 22 ---------- */
    {
      id: 't22', title: 'Seven evaluation criteria', type: 'Trade-offs', level: 'Easy', skill: 'dpo',
      intro: chipsV(['helpfulness', 'correctness', 'honesty', 'harmlessness', 'brevity', 'creativity', 'instruction following']),
      parts: [
        { kind: 'mc', pts: 2, q: 'Why can these not always be collapsed into one obvious “best” behaviour?', options: ['They are all measured on the same scale', 'Only one of them matters in practice', 'Reward models cannot score text', 'Some of the objectives conflict'], answer: 3, inline: false },
      ],
      explain: '<p>The objectives can <b>conflict</b>: brevity vs. completeness, helpfulness vs. safety, confidence vs. calibrated uncertainty, creativity vs. predictability. Alignment requires specifying the trade-offs; there is no universal scalar “goodness”.</p>',
    },
    /* ---------- 23 ---------- */
    {
      id: 't23', title: '“Omit all caveats”', type: 'Trade-offs', level: 'Medium', skill: 'dpo',
      intro: '<blockquote class="qz-quote">“Give me a two-sentence summary, but omit all caveats.”</blockquote><p>The caveat changes the meaning of the result.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Which goal conflict appears?', options: ['Creativity vs. predictability of style', 'Speed vs. cost of text generation', 'Instruction following vs. accuracy', 'Privacy vs. personalisation of answers'], answer: 2, inline: false },
      ],
      explain: '<p><b>Instruction following / brevity vs. accuracy / completeness.</b> A good specification must decide how to handle it, e.g. keep it short but include the one caveat that changes the conclusion, and say why.</p>',
    },
    /* ---------- 24 ---------- */
    {
      id: 't24', title: 'Generate, critique, revise', type: 'AI feedback', level: 'Easy', skill: 'verify',
      intro: lanes(lane('generate answer', '→', 'critique answer', '→', 'revise answer')),
      parts: [
        { kind: 'mc', pts: 3, q: 'What research direction does this illustrate?', options: ['Pretraining on more web text', 'Byte pair encoding of the answers', 'Outcome-only supervision of answers', 'AI feedback / scalable supervision'], answer: 3, inline: false },
      ],
      explain: '<p><b>AI feedback / scalable supervision</b>: models are used as part of the supervision or evaluation process (e.g. Constitutional AI’s critique and revision).</p>',
    },
    /* ---------- 25 ---------- */
    {
      id: 't25', title: 'An AI judges another AI', type: 'AI feedback', level: 'Medium', skill: 'verify',
      intro: lanes(lane('response A', '+', 'response B', '→', '!AI evaluator', '→', 'preference')),
      parts: [
        { kind: 'mc', pts: 2, q: 'What additional concern appears?', options: ['AI evaluators are always slower than humans', 'The policy can no longer be trained', 'The evaluator may itself be wrong or biased', 'Preferences can no longer be stored'], answer: 2, inline: false },
      ],
      explain: '<p>The evaluator itself may be <b>wrong, biased, weak on the same task, or manipulable</b>. Automating feedback does not make the feedback correct.</p>',
    },
    /* ---------- 26 ---------- */
    {
      id: 't26', title: 'Both answers are 12', type: 'Outcome vs. process', level: 'Medium', skill: 'verify',
      intro: M`<p>The lab's two solutions to \((3 + 5) \times 2 - 4\):</p>` + viz('<div class="ps-sols"><div class="ps-sol"><h5>Solution A</h5><ol><li>3 + 5 = 8</li><li>8 × 2 = 16</li><li>16 − 4 = 12</li></ol></div><div class="ps-sol"><h5>Solution B</h5><ol><li>3 + 5 = 9</li><li>9 × 2 = 16</li><li>16 − 4 = 12</li></ol></div></div>'),
      parts: [
        { kind: 'mc', pts: 2, q: 'Which kind of supervision can distinguish them more directly?', options: ['Process supervision', 'Outcome-only supervision', 'Tokenization', 'SFT formatting'], answer: 0 },
        { kind: 'num', pts: 2, q: 'How many steps of Solution B would a process verifier mark as wrong?', answer: 2 },
      ],
      explain: '<p>Both reach 12, so an outcome verifier rewards both. <b>Process supervision</b> checks the steps: Solution B has <b>2</b> invalid steps (3 + 5 = 9 and 9 × 2 = 16) whose errors happen to cancel.</p>',
    },
    /* ---------- 27 ---------- */
    {
      id: 't27', title: 'Checking only the final output', type: 'Outcome supervision', level: 'Easy', skill: 'verify',
      parts: [
        { kind: 'mc', pts: 2, q: 'Which task is easiest to verify automatically from the final output alone?', options: ['A medical recommendation', 'The quality of an essay’s argument', 'A Sudoku solution', 'An open-ended explanation'], answer: 2, inline: false },
      ],
      explain: '<p><b>Sudoku</b>: the final grid can be checked mechanically against the rules. Medical advice, essays and explanations need evidence or reasoning to be inspected.</p>',
    },
    /* ---------- 28 ---------- */
    {
      id: 't28', title: 'A loop with an automatic checker', type: 'Verifiable rewards', level: 'Easy', skill: 'verify',
      intro: flowV('model', 'candidate solution', 'automatic verifier', 'reward', 'optimisation'),
      parts: [
        { kind: 'mc', pts: 2, q: 'What type of post-training setup is this?', options: ['Supervised fine-tuning', 'RL with human feedback', 'Direct preference optimisation', 'RL with verifiable rewards'], answer: 3, inline: false },
      ],
      explain: '<p><b>Reinforcement learning with verifiable rewards</b>: the reward comes from an automatic checker (maths answers, tests, proof checkers, games), not from humans or a learned reward model.</p>',
    },
    /* ---------- 29 ---------- */
    {
      id: 't29', title: 'Write is_even(n)', type: 'Verifiable rewards', level: 'Hard', skill: 'verify',
      intro: '<p>The lab’s coding task. The public tests are <code>is_even(2) == True</code> and <code>is_even(3) == False</code>; the hidden tests are 0, 7, 4, −6, 11, 100. Four candidate programs:</p>'
        + viz('<div class="vf-grid">' + PROGS.map(([n, c]) => `<div class="vf-card"><h5>${n}</h5><pre>${esc(c)}</pre></div>`).join('') + '</div>'),
      parts: [
        { kind: 'mc', pts: 2, q: 'If the reward is “passes the 2 public tests”, what is the obvious exploit?', options: ['Special-case the exact public test inputs', 'Write a program that is correct in general', 'Refuse to write any code for the task', 'Add comments that explain the solution'], answer: 0, inline: false },
        { kind: 'rows', pts: 3, q: 'Which test suites does each program pass?', options: ['Public and hidden', 'Public only', 'Neither'],
          rows: [
            { label: 'Program 1', answer: 2 },
            { label: 'Program 2', answer: 0 },
            { label: 'Program 3', answer: 1 },
            { label: 'Program 4', answer: 1 },
          ] },
      ],
      explain: '<p>A weak verifier can be gamed by special-casing its inputs (Program 4 only knows the number 2) or by a wrong rule that happens to fit (Program 3, n % 4 == 2, fails the hidden tests 0, 4 and 100). Program 1 fails the public test 3 (it returns True); it only fools a verifier that merely reads the log. Only Program 2 passes the hidden tests. Stronger verifiers use <b>hidden tests, randomised cases and edge cases</b>.</p>',
    },
    /* ---------- 30 ---------- */
    {
      id: 't30', title: 'The full map', type: 'Iteration', level: 'Medium', skill: 'verify',
      intro: viz('<div class="al-map"><span class="m-box pre">Pretraining</span><span class="m-ar">↓</span><span class="m-note">base model</span><span class="m-ar">↓</span><span class="m-box sft">Supervised fine-tuning</span><span class="m-ar">↓</span><span class="m-note">instruction model</span><span class="m-ar">↓</span><div class="m-split"><div class="m-col"><span class="m-sub">preference learning</span><div class="m-row"><span class="m-box pref">RLHF</span><span class="m-box pref">DPO</span></div></div><div class="m-col"><span class="m-sub">verifiable rewards</span><div class="m-row"><span class="m-box ver">RL / search</span></div></div></div><span class="m-ar">↓</span><span class="m-note">post-trained assistant</span><span class="m-ar">↓</span><span class="m-box eval">Evaluation</span><span class="m-ar">↓</span><span class="m-box fail">discover failures → better data / reward / evaluation / retraining ↺</span></div>'),
      parts: [
        { kind: 'mc', pts: 2, q: 'What is the key lesson of this diagram?', options: ['Alignment is finished after RLHF', 'Evaluation replaces the need for training', 'Alignment is an iterative loop', 'Each method must be used exactly once'], answer: 2, inline: false },
      ],
      explain: '<p>Alignment is an <b>iterative process</b>: training is followed by evaluation, failures are discovered, and they motivate better data, objectives, rewards and evaluators, and retraining.</p>',
    },
  ],
};
