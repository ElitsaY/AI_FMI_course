/* ===== Lab 12 quiz: question data (rendered and graded by quiz.js) ===== */
const M = String.raw;
const LAB = 'lab12-transformers.html';
/* ---------- small static visuals (reuse the lab's .tk-chip / .tf-flow styles) ---------- */
const viz = (html, cls = '') => `<div class="qzv ${cls}">${html}</div>`;
const f1 = v => String(Math.round(v * 10) / 10);
const sub = t => String(t).replace(/([₁₂₃])(.*)$/, (m, c, rest) => `<tspan dy="5" font-size="0.75em">${'₁₂₃'.indexOf(c) + 1}</tspan>` + (rest ? `<tspan dy="-5">${rest}</tspan>` : ''));
const lbl = (x, y, t, a = 'start', cls = 'pl') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${a}" dominant-baseline="central">${sub(t)}</text>`;
const DEFS = '<defs><marker id="qa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ah" d="M0,0 L10,5 L0,10 z"/></marker>'
  + '<marker id="qaf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="ah f" d="M0,0 L10,5 L0,10 z"/></marker>'
  + '<marker id="qab" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="ah b" d="M0,0 L10,5 L0,10 z"/></marker></defs>';
const svgw = (w, h, body, cls = '') => `<svg class="ml-plot qzv-plot ${cls}" viewBox="0 0 ${w} ${h}" role="img">${DEFS}${body}</svg>`;
const plot = ({ x: [x0, x1], y: [y0, y1], w = 420, h = 300, gx = 1, gy = 1, cls = '' }, draw) => {
  const L = 44, R = 18, T = 18, B = 36;
  const X = v => +(L + (v - x0) / (x1 - x0) * (w - L - R)).toFixed(1), Y = v => +(h - B - (v - y0) / (y1 - y0) * (h - T - B)).toFixed(1);
  let g = `<rect class="km-frame" x="${L}" y="${T}" width="${w - L - R}" height="${h - T - B}"/>`;
  for (let v = Math.ceil(x0 / gx) * gx; v <= x1 + 1e-9; v += gx) g += `<line class="gl" x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${h - B}"/><text class="tk" x="${X(v)}" y="${h - B + 22}" text-anchor="middle">${f1(v) || 0}</text>`;
  for (let v = Math.ceil(y0 / gy) * gy; v <= y1 + 1e-9; v += gy) g += `<line class="gl" x1="${L}" y1="${Y(v)}" x2="${w - R}" y2="${Y(v)}"/><text class="tk" x="${L - 8}" y="${Y(v)}" text-anchor="end" dominant-baseline="central">${f1(v) || 0}</text>`;
  return svgw(w, h, g + draw(X, Y), cls);
};
const bars = rows => '<div class="qzv-bars">' + rows.map(([l, v, max, shown, cls]) => `<div class="qzv-bar ${cls || ''}"><span>${l}</span><span class="track"><i style="width:${Math.max(0, 100 * v / max)}%"></i></span><b>${shown}</b></div>`).join('') + '</div>';
const stat = (l, v) => `<div class="qzv-node qzv-stat"><b>${l}</b><span>${v}</span></div>`;
const cards = (...items) => viz('<div class="qzv-nodes">' + items.join('') + '</div>');
// token chips, one row per representation
const chips = (toks, cls = '') => '<span class="tk-chips">' + toks.map(t => `<span class="tk-chip ${cls}">${t}</span>`).join('') + '</span>';
const tokrow = (name, toks, cls) => `<div class="tk-row"><div class="tk-name">${name}</div>${chips(toks, cls)}</div>`;
const tokrows = (...rows) => viz('<div class="tk-out">' + rows.join('') + '</div>');
const flowV = (...items) => viz('<div class="tf-flow">' + items.map(t => `<div class="tf-fl${t.startsWith('<div') ? ' tf-blockbox' : ''}">${t}</div>`).join('<div class="tf-arr">↓</div>') + '</div>');
const MERGES = [['l', 'o'], ['lo', 'w'], ['e', 'r'], ['e', 'w'], ['n', 'ew'], ['e', 's'], ['es', 't'], ['low', 'er']];

window.QUIZ = {
  id: 'lab12',
  skills: [
    { id: 'tok', label: 'Tokenization and BPE', href: LAB + '#tokenization' },
    { id: 'emb', label: 'Embeddings and position', href: LAB + '#embeddings' },
    { id: 'attn', label: 'Self-attention', href: LAB + '#attention' },
    { id: 'block', label: 'Causal masking, blocks and residuals', href: LAB + '#causal' },
    { id: 'out', label: 'Logits, sampling and generation', href: LAB + '#logits' },
  ],
  tasks: [
    /* ---------- 1 ---------- */
    {
      id: 't1', title: 'Three ways to split “replaying”', type: 'Tokenization', level: 'Easy', skill: 'tok',
      intro: tokrows(tokrow('A', ['replaying']), tokrow('B', 'replaying'.split(''), 'char'), tokrow('C', ['re', 'play', 'ing'])),
      parts: [
        { kind: 'rows', pts: 3, q: 'Which kind of tokenization is each representation?', options: ['Word-level', 'Character-level', 'Subword-level'],
          rows: [
            { label: 'A', answer: 0 },
            { label: 'B', answer: 1 },
            { label: 'C', answer: 2 },
          ] },
      ],
      explain: '<p><b>A</b>: one token for the whole word (word-level). <b>B</b>: one token per character (character-level). <b>C</b>: reusable pieces (subword-level): <i>play</i> is shared with <i>playing, replay, player</i>.</p>',
    },
    /* ---------- 2 ---------- */
    {
      id: 't2', title: 'Vocabulary vs. sequence length', type: 'Tokenization', level: 'Easy', skill: 'tok',
      parts: [
        { kind: 'mc', pts: 3, q: 'Which description best matches <b>subword</b> tokenization?', options: ['Huge vocabulary, very short sequences', 'Small vocabulary, very long sequences', 'One token for every full sentence', 'A balance of vocabulary and length'], answer: 3, inline: false },
      ],
      explain: '<p>Subword tokenization is a <b>compromise</b>: word-level gives a huge vocabulary and short sequences, character-level a tiny vocabulary and long sequences. Subwords keep both manageable and can still spell out unseen words.</p>',
    },
    /* ---------- 3 ---------- */
    {
      id: 't3', title: 'BPE on a toy corpus', type: 'BPE', level: 'Medium', skill: 'tok',
      intro: '<p>The lab’s toy corpus <i>low, low, lower, lowest, new, newer</i>, split into characters, and its adjacent-pair counts. Ties are broken alphabetically, so the first merge is <b>(l, o)</b>.</p>'
        + tokrows(...['low', 'low', 'lower', 'lowest', 'new', 'newer'].map((w, i) => tokrow('word ' + (i + 1), w.split(''), 'char')))
        + viz(bars([['(l, o)', 4, 4, '4'], ['(o, w)', 4, 4, '4'], ['(w, e)', 3, 4, '3'], ['(e, r)', 2, 4, '2'], ['(n, e)', 2, 4, '2'], ['(e, w)', 2, 4, '2'], ['(e, s)', 1, 4, '1'], ['(s, t)', 1, 4, '1']]), 'qzv-wide'),
      parts: [
        { kind: 'mc', pts: 2, q: 'What does this one BPE merge do?', options: ['Replaces every adjacent “l o” by one token “lo”', 'Deletes the rarer of the two characters, “o”', 'Splits every word at each occurrence of “l”', 'Adds “lo” to the vocabulary but changes no word'], answer: 0, inline: false },
        { kind: 'seq', pts: 3, q: 'The second merge is (lo, w). How is <b>lowest</b> represented after these two merges?', label: 'lowest =', tokens: ['l', 'o', 'w', 'lo', 'low', 'e', 's', 't', 'es', 'est'], sep: ' ', answer: ['low', 'e', 's', 't'] },
      ],
      explain: '<p>A merge replaces every occurrence of the adjacent pair by one new unit: <i>l o w e s t</i> → <i>lo w e s t</i>. The second merge (lo, w) then gives <b>low e s t</b>. BPE keeps repeating this for the most frequent pair until the vocabulary has the desired size.</p>',
    },
    /* ---------- 4 ---------- */
    {
      id: 't4', title: 'A word the corpus never contained', type: 'BPE', level: 'Medium', skill: 'tok',
      intro: '<p>The same corpus, after 8 merges. The merge list <b>is</b> the tokenizer: to tokenize a word, split it into characters and apply the merges in this order.</p>'
        + viz('<div class="tk-chips">' + MERGES.map(([a, b], i) => `<span class="tk-chip"><b>${i + 1}.</b> ${a} + ${b}</span>`).join('') + '</div>'),
      parts: [
        { kind: 'mc', pts: 2, q: 'The word <b>newest</b> never appeared in the corpus. Can the tokenizer still represent it?', options: ['No: it becomes one unknown token', 'Yes: as known pieces, e.g. new + est', 'Only after the tokenizer is retrained', 'No: every character must be in a merge'], answer: 1, inline: false },
        { kind: 'seq', pts: 3, q: 'Apply the merges to <b>renew</b>. What are its tokens?', label: 'renew =', tokens: ['r', 'e', 'n', 'w', 're', 'ne', 'ew', 'new', 'renew'], sep: ' ', answer: ['r', 'e', 'new'] },
      ],
      explain: '<p><b>newest</b>: n e w e s t → (e, w) n ew e s t → (n, ew) new e s t → (e, s) new es t → (es, t) <b>new est</b>. Subwords represent unseen words with smaller known pieces.</p><p><b>renew</b>: r e n e w → (e, w) r e n ew → (n, ew) <b>r e new</b>. No merge joins r and e, so they stay single characters (the lab’s code prints the same).</p>',
    },
    /* ---------- 5 ---------- */
    {
      id: 't5', title: 'cat = 324, dog = 517', type: 'Token IDs', level: 'Easy', skill: 'emb',
      intro: cards(stat('cat', 'ID 324'), stat('car', 'ID 325'), stat('dog', 'ID 517')),
      parts: [
        { kind: 'mc', pts: 3, q: 'Which interpretation is correct?', options: ['Dog is semantically larger than cat', 'Cat and car are close in meaning', 'The ID difference measures similarity', 'The IDs are arbitrary identifiers'], answer: 3, inline: false },
      ],
      explain: '<p>Token IDs only <b>identify</b> vocabulary entries: their size, order and differences mean nothing. <i>cat</i> (324) and <i>car</i> (325) are neighbours by ID but not by meaning. That is why each ID is mapped to a learned embedding.</p>',
    },
    /* ---------- 6 ---------- */
    {
      id: 't6', title: 'An embedding lookup', type: 'Embeddings', level: 'Medium', skill: 'emb',
      intro: M`<p>The embedding matrix is \(E \in \mathbb{R}^{50000 \times 768}\) (vocabulary size × model width), and a token has ID <b>324</b>.</p>`
        + viz(svgw(420, 220, `<rect class="mat" x="120" y="30" width="260" height="170" rx="6"/>` + Array.from({ length: 16 }, (_, i) => `<line class="gl" x1="120" y1="${40 + i * 10}" x2="380" y2="${40 + i * 10}"/>`).join('')
          + lbl(250, 16, '768 columns', 'middle', 'tk') + lbl(108, 115, '50,000 rows', 'end', 'tk') + `<line class="nn-e" x1="30" y1="190" x2="112" y2="190" marker-end="url(#qa)"/>` + lbl(30, 172, 'ID 324', 'start', 'pl'))),
      parts: [
        { kind: 'mc', pts: 2, q: 'What is used as the token’s representation?', options: ['The number 324, fed in as one input', 'Row 324 of E, a learned vector', 'A one-hot vector with 768 entries', 'The average of all the rows of E'], answer: 1, inline: false },
        { kind: 'num', pts: 1, q: 'How many numbers does that representation contain?', answer: 768 },
        { kind: 'num', pts: 2, q: 'How many learned parameters does E hold?', answer: 38400000, show: '50,000 × 768 = 38,400,000' },
      ],
      explain: '<p>The ID selects <b>row 324</b> of E, a learned <b>768-dimensional</b> vector (the ID itself is never fed in as a number). E holds 50,000 × 768 = <b>38,400,000</b> learned values, one row per vocabulary token.</p>',
    },
    /* ---------- 7 ---------- */
    {
      id: 't7', title: 'dog bites man', type: 'Position', level: 'Easy', skill: 'emb',
      intro: tokrows(tokrow('Sentence 1', ['dog', 'bites', 'man']), tokrow('Sentence 2', ['man', 'bites', 'dog'])),
      parts: [
        { kind: 'mc', pts: 2, q: 'Why is positional information necessary?', options: ['Order changes meaning, even with the same tokens', 'Positions tell the model which of the tokens are rare', 'Longer sentences need more vocabulary entries', 'Without it, the embeddings could not be learned'], answer: 0, inline: false },
      ],
      explain: '<p>Both sentences contain the same tokens in a different order, with different meanings. The model needs both <b>what</b> token is present and <b>where</b> it occurs.</p>',
    },
    /* ---------- 8 ---------- */
    {
      id: 't8', title: 'The input vector', type: 'Position', level: 'Easy', skill: 'emb',
      intro: M`<p>For token position \(i\):</p><div class="math-block">\[ x_i = E_{\text{token}_i} + P_i \]</div>`,
      parts: [
        { kind: 'rows', pts: 2, q: 'What does each term represent?', options: ['What the token is', 'Where the token is', 'How rare the token is'],
          rows: [
            { label: M`\(E_{\text{token}_i}\)`, answer: 0 },
            { label: M`\(P_i\)`, answer: 1 },
          ] },
      ],
      explain: M`<p>\(E_{\text{token}_i}\) is the learned token representation (<b>what</b>), \(P_i\) the positional information (<b>where</b>): fixed sinusoids, learned position vectors, or rotations of queries and keys (RoPE), depending on the model.</p>`,
    },
    /* ---------- 9 ---------- */
    {
      id: 't9', title: 'Three vectors per token', type: 'Q, K, V', level: 'Easy', skill: 'attn',
      intro: M`<p>Each token vector \(x_i\) is turned into three vectors by learned matrices: \(q_i = x_i W_Q\), \(k_i = x_i W_K\), \(v_i = x_i W_V\).</p>`
        + viz(svgw(420, 170, `<rect class="box" x="30" y="65" width="70" height="40" rx="10"/>` + lbl(65, 85, 'x', 'middle', 'nn-t')
          + [['q', 30], ['k', 85], ['v', 140]].map(([t, y]) => `<line class="nn-e" x1="104" y1="85" x2="290" y2="${y}" marker-end="url(#qa)"/><rect class="box hl" x="296" y="${y - 18}" width="70" height="36" rx="10"/>` + lbl(331, y, t, 'middle', 'nn-t')).join(''))),
      parts: [
        { kind: 'rows', pts: 3, q: 'Which vector does each intuition describe?', options: ['Query', 'Key', 'Value'],
          rows: [
            { label: 'What information should I contribute?', answer: 2 },
            { label: 'What am I looking for?', answer: 0 },
            { label: 'What information do I contain?', answer: 1 },
          ] },
      ],
      explain: '<p><b>Query</b>: what am I looking for? <b>Key</b>: what information do I contain? <b>Value</b>: what information should I contribute? A token compares its query with every key, and copies more of the values whose keys match better.</p>',
    },
    /* ---------- 10 ---------- */
    {
      id: 't10', title: 'One query, three keys', type: 'Attention scores', level: 'Medium', skill: 'attn',
      intro: M`<p>The lab's example: the query of <i>sleeps</i> is \(q = [1, 1]\); the keys of <i>The</i>, <i>cat</i>, <i>sleeps</i> are \(k_1 = [1, 0]\), \(k_2 = [0, 1]\), \(k_3 = [1, 1]\).</p>`
        + viz(plot({ x: [-0.2, 1.4], y: [-0.2, 1.4], w: 320, h: 300, gx: 0.5, gy: 0.5 }, (X, Y) =>
          [[1, 0, 'k₁', 12, 16], [0, 1, 'k₂', 12, -2], [1, 1, 'k₃ = q', 10, -14]].map(([x, y, t, dx, dy]) => `<line class="vec k" x1="${X(0)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(y)}" marker-end="url(#qa)"/>` + lbl(X(x) + dx, Y(y) + dy, t)).join('')), 'qzv-narrow'),
      parts: [
        { kind: 'num', pts: 1, q: M`\(q \cdot k_1\)`, answer: 1 },
        { kind: 'num', pts: 1, q: M`\(q \cdot k_2\)`, answer: 1 },
        { kind: 'num', pts: 1, q: M`\(q \cdot k_3\)`, answer: 2 },
        { kind: 'num', pts: 2, q: M`Apply softmax to the three scores (no scaling). What weight does the <b>third</b> key get? (two decimals)`, answer: Math.E / (2 + Math.E), tol: 0.006, show: '0.58' },
      ],
      explain: M`<p>Scores: \(1 \cdot 1 + 1 \cdot 0 = 1\), \(0 + 1 = 1\), \(1 + 1 = 2\), so \([1, 1, 2]\): the third key matches best. Softmax: \(\frac{e^2}{e^1 + e^1 + e^2} = \frac{e}{2 + e} \approx 0.58\) (and \(\approx 0.21\) for each of the others).</p>`,
    },
    /* ---------- 11 ---------- */
    {
      id: 't11', title: 'The attention weights', type: 'Attention weights', level: 'Easy', skill: 'attn',
      intro: '<p>Softmax turned the scores into these weights for the query <i>sleeps</i>:</p>' + viz(bars([['The', 0.21, 0.6, '0.21'], ['cat', 0.21, 0.6, '0.21'], ['sleeps', 0.58, 0.6, '0.58']]), 'qzv-wide'),
      parts: [
        { kind: 'mc', pts: 1, q: 'Which token receives the most attention?', options: ['The', 'cat', 'sleeps'], answer: 2, letters: false },
        { kind: 'num', pts: 1, q: 'What do the weights of one row sum to?', answer: 1 },
      ],
      explain: '<p>The third token, <i>sleeps</i> itself, gets the most attention (0.58). Softmax weights in one row always sum to <b>1</b>: they are the proportions in which the value vectors are mixed.</p>',
    },
    /* ---------- 12 ---------- */
    {
      id: 't12', title: 'Mix the values', type: 'Attention output', level: 'Medium', skill: 'attn',
      intro: '<p>With the weights [0.21, 0.21, 0.58] and the value vectors:</p>' + cards(stat('V₁ (The)', '[1, 2]'), stat('V₂ (cat)', '[3, 0]'), stat('V₃ (sleeps)', '[2, 2]')),
      parts: [
        { kind: 'num', pts: 2, q: 'First coordinate of the attention output (two decimals)', answer: 2.0, tol: 0.006, show: '2.00' },
        { kind: 'num', pts: 2, q: 'Second coordinate (two decimals)', answer: 1.58, tol: 0.006, show: '1.58' },
      ],
      explain: M`<p>\(0.21[1, 2] + 0.21[3, 0] + 0.58[2, 2] = [0.21 + 0.63 + 1.16,\; 0.42 + 0 + 1.16] = [2.00, 1.58]\). The new representation of <i>sleeps</i> is a weighted average of all the value vectors.</p>`,
    },
    /* ---------- 13 ---------- */
    {
      id: 't13', title: 'A five-token sequence', type: 'Shapes', level: 'Medium', skill: 'attn',
      intro: tokrows(tokrow('Sequence', ['The', 'scientist', 'wrote', 'the', 'paper'])),
      parts: [
        { kind: 'mc', pts: 2, q: M`What is the shape of \(QK^T\) in self-attention?`, options: ['5 × 5', '5 × 1', '1 × 5', '5 × dₖ'], answer: 0, letters: false },
        { kind: 'num', pts: 3, q: 'With a causal mask, how many of these scores are allowed (not masked out)?', answer: 15 },
      ],
      explain: M`<p>One score for every query–key pair: \(5 \times 5 = 25\). The causal mask keeps the lower triangle with the diagonal: \(1 + 2 + 3 + 4 + 5 = 15\) scores.</p>`,
    },
    /* ---------- 14 ---------- */
    {
      id: 't14', title: 'Dividing by √dₖ', type: 'Scaling', level: 'Medium', skill: 'attn',
      intro: M`<div class="math-block">\[ \text{Attention}(Q, K, V) = \text{softmax}\!\left( \frac{Q K^T}{\sqrt{d_k}} \right) V \]</div>`,
      parts: [
        { kind: 'mc', pts: 3, q: M`Why are the dot products divided by \(\sqrt{d_k}\)?`, options: ['It makes all the attention weights equal', 'It turns the scores into probabilities', 'Scores grow with dₖ and saturate softmax', 'It hides the future positions from a query'], answer: 2, inline: false },
      ],
      explain: M`<p>As the query/key dimension \(d_k\) grows, raw dot products grow too (their typical size is about \(\sqrt{d_k}\)). Very large scores push the softmax to nearly 0/1 weights with tiny gradients. Scaling keeps the scores manageable. (Softmax, not the scaling, makes probabilities; the mask, not the scaling, hides the future.)</p>`,
    },
    /* ---------- 15 ---------- */
    {
      id: 't15', title: 'A lower-triangular pattern', type: 'Causal mask', level: 'Easy', skill: 'block',
      intro: viz(svgw(360, 250, (() => {
        let g = lbl(215, 16, 'keys', 'middle', 'tk');
        for (let j = 0; j < 4; j++) g += lbl(140 + j * 50, 42, j + 1, 'middle', 'pl');
        for (let i = 0; i < 4; i++) {
          g += lbl(100, 80 + i * 46, 'query ' + (i + 1), 'end', 'pl');
          for (let j = 0; j < 4; j++) g += `<rect class="cell ${j <= i ? 'on' : 'off'}" x="${117 + j * 50}" y="${58 + i * 46}" width="46" height="42" rx="6"/>` + lbl(140 + j * 50, 80 + i * 46, j <= i ? '✓' : '✗', 'middle', 'cellt ' + (j <= i ? 'on' : 'off'));
        }
        return g;
      })()), 'qzv-narrow'),
      parts: [
        { kind: 'mc', pts: 3, q: 'What does this pattern mean?', options: ['Each position sees itself and the past', 'Each position sees only later positions', 'Every position sees all the positions', 'Each position sees only its own token'], answer: 0, inline: false },
      ],
      explain: '<p>Row = query, column = key. Each position may attend only to <b>itself and earlier positions</b>; future positions are blocked (their scores are set to −∞, so their weights become 0).</p>',
    },
    /* ---------- 16 ---------- */
    {
      id: 't16', title: 'Processing “wrote”', type: 'Causal mask', level: 'Easy', skill: 'block',
      intro: '<p>A causal language model processes token 3, <i>wrote</i>:</p>' + viz('<div class="tk-chips">' + ['The', 'scientist', 'wrote', 'the', 'paper'].map((t, i) => `<span class="tk-chip${i === 2 ? ' cont' : ''}"><b>${i + 1}</b> ${t}</span>`).join('') + '</div>'),
      parts: [
        { kind: 'rows', pts: 5, q: 'May <i>wrote</i> attend to each token?', options: ['Yes', 'No'],
          rows: [
            { label: '1 The', answer: 0 },
            { label: '4 the', answer: 1 },
            { label: '2 scientist', answer: 0 },
            { label: '5 paper', answer: 1 },
            { label: '3 wrote (itself)', answer: 0 },
          ] },
      ],
      explain: '<p>Position 3 may attend to positions 1–3: <i>The</i>, <i>scientist</i> and itself. <i>the</i> (4) and <i>paper</i> (5) are in the future and are masked out.</p>',
    },
    /* ---------- 17 ---------- */
    {
      id: 't17', title: 'The whole sentence is available', type: 'Causal mask', level: 'Medium', skill: 'block',
      intro: '<p>During training the complete sentence <i>The cat sat on the mat</i> is available, and the model predicts the next token at <b>every</b> position in one pass.</p>',
      parts: [
        { kind: 'mc', pts: 3, q: 'Why is causal masking still necessary?', options: ['The full sentence is too long for one pass', 'It makes the attention matrix symmetric', 'It removes the padding tokens from a batch', 'A position could see the token it predicts'], answer: 3, inline: false },
      ],
      explain: '<p>Without the mask, position <i>i</i> could look directly at token <i>i</i> + 1, the answer it is supposed to predict. The model would learn to cheat, and it would behave differently at generation time, when later tokens do not exist yet.</p>',
    },
    /* ---------- 18 ---------- */
    {
      id: 't18', title: 'Inside one block', type: 'Transformer block', level: 'Medium', skill: 'block',
      intro: flowV('representation', '<div class="tf-sub attn">Self-attention <small>+ residual</small></div><div class="tf-sub mlp">MLP <small>+ residual</small></div>', 'new representation'),
      parts: [
        { kind: 'mc', pts: 3, q: 'Which description is most accurate?', options: ['Attention and the MLP do the same operation', 'Attention communicates; the MLP computes', 'The MLP moves information between positions', 'Attention replaces the tokenization step'], answer: 1, inline: false },
      ],
      explain: '<p><b>Attention = communication</b> across positions (each token gathers information from earlier tokens); <b>MLP = computation</b> within one position (the same small network applied to every position on its own). Communicate → compute, repeated in every block.</p>',
    },
    /* ---------- 19 ---------- */
    {
      id: 't19', title: 'x + f(x)', type: 'Residual', level: 'Medium', skill: 'block',
      intro: M`<p>A residual connection computes \(x_{\text{new}} = x + f(x)\):</p>`
        + viz(svgw(420, 150, `<line class="nn-e" x1="20" y1="90" x2="92" y2="90" marker-end="url(#qa)"/>` + lbl(20, 72, 'x', 'start')
          + `<rect class="box" x="140" y="70" width="90" height="40" rx="10"/>` + lbl(185, 90, 'f', 'middle', 'nn-t') + `<line class="nn-e" x1="100" y1="90" x2="136" y2="90" marker-end="url(#qa)"/><line class="nn-e" x1="230" y1="90" x2="298" y2="90" marker-end="url(#qa)"/>`
          + `<path class="nn-e skip" d="M100 90 V35 H315 V70" fill="none" marker-end="url(#qa)"/><circle class="nn-n" cx="315" cy="90" r="16"/>` + lbl(315, 90, '+', 'middle', 'nn-t') + `<line class="nn-e" x1="331" y1="90" x2="392" y2="90" marker-end="url(#qa)"/>` + lbl(400, 72, 'x_new', 'end'))),
      parts: [
        { kind: 'mc', pts: 2, q: 'What is the intuition?', options: ['Replace x by a completely new vector', 'Average x with the previous token', 'Keep x and add a learned change', 'Reset x to its embedding in every layer'], answer: 2, inline: false },
        { kind: 'num', pts: 2, q: M`In one dimension, \(x = 3\) and the sublayer outputs \(f(x) = -0.4\). What is \(x_{\text{new}}\)?`, answer: 2.6, tol: 0.001 },
      ],
      explain: M`<p>Keep the current representation and add a learned modification: \(3 + (-0.4) = 2.6\). The original information is never overwritten, and the derivative \(1 + f'(x)\) always has a direct path of slope 1, so gradients travel through deep networks.</p>`,
    },
    /* ---------- 20 ---------- */
    {
      id: 't20', title: 'Put the pipeline in order', type: 'Pipeline', level: 'Medium', skill: 'out',
      intro: '<p>From raw text to next-token probabilities.</p>',
      parts: [
        { kind: 'seq', pts: 4, q: 'Click the stages in order, from the text to the probabilities.', label: 'text →', tokens: ['softmax', 'Transformer blocks', 'token IDs', 'logits', 'tokenization', 'embeddings + position'], answer: ['tokenization', 'token IDs', 'embeddings + position', 'Transformer blocks', 'logits', 'softmax'] },
      ],
      explain: '<p>text → <b>tokenization</b> → <b>token IDs</b> → <b>embeddings + positional information</b> → <b>Transformer blocks</b> → <b>logits</b> → <b>softmax</b> → next-token probabilities.</p>',
    },
    /* ---------- 21 ---------- */
    {
      id: 't21', title: '“The cat sat on the …”', type: 'Logits', level: 'Medium', skill: 'out',
      intro: '<p>The lab’s logits for the next token:</p>' + viz(bars([['mat', 8.2, 8.2, '8.2'], ['floor', 6.7, 8.2, '6.7'], ['chair', 5.1, 8.2, '5.1'], ['moon', 0, 8.2, '−0.3', 'neg']]), 'qzv-wide'),
      parts: [
        { kind: 'mc', pts: 2, q: 'Which token has the highest softmax probability?', options: ['mat', 'floor', 'chair', 'moon'], answer: 0, letters: false },
        { kind: 'num', pts: 3, q: M`How many times more probable is <i>mat</i> than <i>floor</i> (at \(T = 1\))? (two decimals)`, answer: Math.exp(1.5), tol: 0.02, show: 'e^1.5 ≈ 4.48' },
      ],
      explain: M`<p>The largest logit gets the largest probability: <b>mat</b>. Softmax fixes the ratio of two probabilities by the difference of their logits: \(P_{\text{mat}} / P_{\text{floor}} = e^{8.2 - 6.7} = e^{1.5} \approx 4.48\), whatever the other tokens are.</p>`,
    },
    /* ---------- 22 ---------- */
    {
      id: 't22', title: 'Changing the temperature', type: 'Temperature', level: 'Medium', skill: 'out',
      intro: M`<div class="math-block">\[ P(w) = \frac{e^{z_w / T}}{\sum_{w'} e^{z_{w'} / T}} \]</div>`,
      parts: [
        { kind: 'rows', pts: 3, q: 'Which temperature produces each effect?', options: ['T < 1', 'T > 1'],
          rows: [
            { label: 'The distribution becomes sharper.', answer: 0 },
            { label: 'Text becomes more varied, with more errors.', answer: 1 },
            { label: 'The distribution becomes flatter.', answer: 1 },
            { label: 'Text becomes more predictable and repetitive.', answer: 0 },
          ] },
        { kind: 'num', pts: 2, q: M`With the logits of the previous task (mat 8.2, floor 6.7) and \(T = 0.5\), how many times more probable is <i>mat</i> than <i>floor</i>?`, answer: Math.exp(3), tol: 0.2, show: 'e^3 ≈ 20.1' },
      ],
      explain: M`<p>\(T < 1\) divides the logits by a small number, stretching their differences: the distribution becomes <b>sharper</b>, and generation more predictable, less varied and more repetitive. \(T > 1\) flattens it: more varied, more error-prone. Here the ratio grows from \(e^{1.5} \approx 4.5\) to \(e^{1.5/0.5} = e^3 \approx 20.1\).</p>`,
    },
    /* ---------- 23 ---------- */
    {
      id: 't23', title: 'top-k = 3', type: 'Top-k sampling', level: 'Medium', skill: 'out',
      intro: '<p>Next-token probabilities (invented for this task):</p>' + viz(bars([['mat', 0.5, 0.5, '0.50'], ['floor', 0.25, 0.5, '0.25'], ['chair', 0.15, 0.5, '0.15'], ['sofa', 0.07, 0.5, '0.07'], ['moon', 0.03, 0.5, '0.03']]), 'qzv-wide'),
      parts: [
        { kind: 'multi', pts: 2, q: 'With top-k = 3, which tokens can still be sampled?', options: ['mat', 'floor', 'chair', 'sofa', 'moon'], answer: [0, 1, 2], letters: false },
        { kind: 'num', pts: 3, q: 'After renormalising the remaining probabilities, what is the probability of <i>floor</i>? (two decimals)', answer: 0.25 / 0.9, tol: 0.006, show: '0.25 / 0.90 ≈ 0.28' },
      ],
      explain: '<p>Only the three most probable tokens, <b>mat, floor, chair</b>, stay eligible (together 0.90); the sampler then chooses among them with renormalised probabilities: floor gets 0.25 / 0.90 ≈ <b>0.28</b>. <i>sofa</i> and <i>moon</i> can never be picked.</p>',
    },
    /* ---------- 24 ---------- */
    {
      id: 't24', title: 'The cat → sat → …', type: 'Generation', level: 'Easy', skill: 'out',
      intro: viz('<div class="tf-flow"><div class="tf-fl">“The cat”</div><div class="tf-arr">↓ <small>predict next-token probabilities, choose “sat”</small></div><div class="tf-fl">“The cat sat”</div><div class="tf-arr">↓ <small>predict again</small></div><div class="tf-fl">“The cat sat on” …</div></div>'),
      parts: [
        { kind: 'mc', pts: 2, q: 'What style of generation is this?', options: ['Retrieving a stored reply', 'Autoregressive generation', 'Masked-token infilling', 'Whole-sentence decoding'], answer: 1, inline: false },
      ],
      explain: '<p><b>Autoregressive generation</b>: the model generates one token, appends it to the input, and predicts again, until an end token or a length limit.</p>',
    },
    /* ---------- 25 ---------- */
    {
      id: 't25', title: 'One head, one weight of 0.70', type: 'Interpretation', level: 'Hard', skill: 'attn',
      intro: '<p>One attention head in one layer, the row for the query <i>she</i>:</p>'
        + viz(svgw(440, 120, ['The', 'scientist', 'said', 'that', 'she'].map((t, i) => { const w = [0.05, 0.7, 0.08, 0.05, 0.12][i];
          return `<rect class="heat" x="${10 + i * 86}" y="40" width="80" height="44" rx="6" style="opacity:${(0.12 + 0.88 * w / 0.7).toFixed(2)}"/>` + `<rect class="heat-o" x="${10 + i * 86}" y="40" width="80" height="44" rx="6"/>` + lbl(50 + i * 86, 62, w.toFixed(2), 'middle', 'pl') + lbl(50 + i * 86, 20, t, 'middle', 'tk'); }).join(''))),
      parts: [
        { kind: 'mc', pts: 4, q: 'Which conclusion is justified?', options: ['The model is 70% sure “she” means scientist', 'Scientist caused the final prediction', 'This head copied much from “scientist”', 'Every head found this same relation'], answer: 2, inline: false },
      ],
      explain: '<p>The weight describes <b>one internal computation in one head and one layer</b>: the representation of <i>she</i> copied a large share of its value information from the position of <i>scientist</i>. It is not a probability of coreference, and not automatically a causal explanation of the final prediction (other heads, MLPs and later layers also shape it); showing causation needs an intervention.</p>',
    },
    /* ---------- 26 ---------- */
    {
      id: 't26', title: 'A missing component', type: 'Position', level: 'Medium', skill: 'emb',
      intro: '<p>A Transformer is built with:</p>' + cards(stat('token embeddings', '✓'), stat('self-attention', '✓'), stat('MLPs', '✓'), stat('positional information', '✗')),
      parts: [
        { kind: 'mc', pts: 3, q: 'What problem appears?', options: ['It can no longer compute attention scores', 'Its vocabulary shrinks to single characters', 'Its MLPs stop working at every position', 'It loses reliable information about order'], answer: 3, inline: false },
      ],
      explain: '<p>Self-attention treats its input as a <b>set</b>: shuffle the tokens and it returns the same vectors, shuffled. Without positional information the model cannot reliably tell <i>dog bites man</i> from <i>man bites dog</i>.</p>',
    },
    /* ---------- 27 ---------- */
    {
      id: 't27', title: 'Follow “The cat sat on the”', type: 'Pipeline', level: 'Hard', skill: 'out',
      intro: flowV('“The cat sat on the”', 'Tokenizer', '[token IDs]', 'Embeddings + position', '<div class="tf-sub attn">Transformer blocks: attention + MLP</div>', '[contextual vectors]', 'Output projection', '[logits] → softmax', 'decoding: mat · floor · chair …'),
      parts: [
        { kind: 'rows', pts: 2, q: 'The input side: what does each stage do?', options: ['Identify vocabulary entries', 'Split text into tokens', 'Add order information', 'Map IDs to learned vectors'],
          rows: [
            { label: 'Tokenizer', answer: 1 },
            { label: 'Token IDs', answer: 0 },
            { label: 'Embeddings', answer: 3 },
            { label: 'Position', answer: 2 },
          ] },
        { kind: 'rows', pts: 2, q: 'The model and output side:', options: ['One score per vocabulary token', 'Turn logits into probabilities', 'Mix and transform the vectors', 'Pick or sample the next token'],
          rows: [
            { label: 'Transformer blocks', answer: 2 },
            { label: 'Output projection', answer: 0 },
            { label: 'Softmax', answer: 1 },
            { label: 'Decoding', answer: 3 },
          ] },
      ],
      explain: '<p><b>Tokenizer</b>: splits raw text into tokens. <b>Token IDs</b>: identify vocabulary entries. <b>Embeddings</b>: map IDs to learned vectors. <b>Position</b>: adds order information. <b>Transformer blocks</b>: attention mixes information across positions, MLPs transform each position. <b>Output projection</b>: one score (logit) per vocabulary token. <b>Softmax</b>: logits → probabilities. <b>Decoding</b>: choose or sample the next token; then append it and repeat.</p>',
    },
  ],
};
