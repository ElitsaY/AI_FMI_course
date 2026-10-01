/* ===== Lab 00 quiz: modern AI concepts, a self-check before the course (rendered and graded by quiz.js) ===== */
const M = String.raw;
const L12 = 'lab12-transformers.html', L13 = 'lab13-alignment.html', L14 = 'lab14-evaluation.html';
const a = (href, text) => `<a href="${href}">${text}</a>`;
/* ---------- small static visuals (reuse .al-card, .al-flow2 lanes, .tf-flow, .tk-chip, .qzv-bars) ---------- */
const viz = (html, cls = '') => `<div class="qzv ${cls}">${html}</div>`;
const lbl = (x, y, t, an = 'start', cls = 'pl') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${an}" dominant-baseline="central">${t}</text>`;
const stat = (l, v) => `<div class="qzv-node qzv-stat"><b>${l}</b><span>${v}</span></div>`;
const cards = (...items) => viz('<div class="qzv-nodes">' + items.join('') + '</div>');
const card = (h, p, cls = '') => `<div class="al-card ${cls}"><h5>${h}</h5><p>${p}</p></div>`;
const pair = (...cs) => viz('<div class="al-pair">' + cs.join('') + '</div>');
const stack = (...cs) => viz('<div class="al-stack">' + cs.join('') + '</div>');
const bars = rows => '<div class="qzv-bars">' + rows.map(([l, v, max, shown, cls]) => `<div class="qzv-bar ${cls || ''}"><span>${l}</span><span class="track"><i style="width:${100 * v / max}%"></i></span><b>${shown}</b></div>`).join('') + '</div>';
const lane = (...parts) => '<div class="al-lane">' + parts.map(p => p === '→' || p === '+' ? `<span class="ar">${p}</span>` : p.startsWith('!') ? `<span class="n learned">${p.slice(1)}</span>` : `<span class="n">${p}</span>`).join('') + '</div>';
const lanes = (...ls) => viz('<div class="al-flow2">' + ls.join('') + '</div>');
const flowV = (...items) => viz('<div class="tf-flow">' + items.map(t => `<div class="tf-fl">${t}</div>`).join('<div class="tf-arr">↓</div>') + '</div>');
const chips = items => viz('<div class="tk-chips">' + items.map(t => `<span class="tk-chip">${t}</span>`).join('') + '</div>');
// four words in a 2-D embedding space
const EMB = viz(`<svg class="ml-plot qzv-plot" viewBox="0 0 420 220" role="img"><rect class="km-frame" x="10" y="10" width="400" height="200" rx="10"/>`
  + [['cat', 80, 60, 0], ['dog', 150, 75, 0], ['car', 280, 160, 1], ['truck', 350, 145, 1]].map(([w, x, y, k]) => `<circle class="kp k${k}" cx="${x}" cy="${y}" r="9"/>` + lbl(x + 15, y, w)).join('')
  + lbl(404, 200, 'dimension 1', 'end', 'tk') + lbl(18, 26, 'dimension 2', 'start', 'tk') + '</svg>');
// LoRA: a big frozen W plus a small low-rank update B·A
const LORA = viz(`<svg class="ml-plot qzv-plot" viewBox="0 0 440 200" role="img">`
  + `<rect class="lo-w" x="20" y="20" width="160" height="160" rx="8"/>` + lbl(100, 92, 'W', 'middle', 'lo-t') + lbl(100, 120, 'frozen', 'middle', 'tk')
  + lbl(205, 100, '+', 'middle', 'lo-t')
  + `<rect class="lo-b" x="235" y="20" width="22" height="160" rx="5"/>` + lbl(246, 194, 'B', 'middle', 'tk')
  + lbl(275, 100, '×', 'middle', 'lo-t')
  + `<rect class="lo-a" x="295" y="89" width="130" height="22" rx="5"/>` + lbl(360, 128, 'A', 'middle', 'tk') + lbl(360, 60, 'small, trained', 'middle', 'tk') + '</svg>');
// a router sending each token to some of the subnetworks (the experts)
const MOE = viz(`<svg class="ml-plot qzv-plot" viewBox="0 0 440 220" role="img">`
  + `<rect class="box" x="20" y="90" width="80" height="40" rx="10"/>` + lbl(60, 110, 'token', 'middle', 'nn-t fl')
  + `<rect class="box hl" x="140" y="90" width="90" height="40" rx="10"/>` + lbl(185, 110, 'router', 'middle', 'nn-t fl')
  + `<line class="nn-e" x1="100" y1="110" x2="136" y2="110" marker-end="url(#qa0)"/>`
  + [0, 1, 2, 3].map(i => { const y = 16 + i * 50, on = i === 1 || i === 2;
    return `<line class="nn-e${on ? ' fwd' : ' off'}" x1="230" y1="110" x2="306" y2="${y + 18}"/><rect class="box${on ? '' : ' dim'}" x="310" y="${y}" width="110" height="36" rx="10"/>` + lbl(365, y + 18, 'block ' + (i + 1), 'middle', 'nn-t fl' + (on ? '' : ' dim')); }).join('')
  + '<defs><marker id="qa0" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="ah" d="M0,0 L10,5 L0,10 z"/></marker></defs></svg>'
  + '<p class="qzv-legend">for this token, blocks 2 and 3 are active</p>');

window.QUIZ = {
  id: 'lab00',
  skills: [
    { id: 'terms', label: 'Common abbreviations', href: 'lab00-introduction.html#topics' },
    { id: 'emb', label: 'Embeddings and semantic search', href: L12 + '#embeddings' },
    { id: 'train', label: 'Pretraining, fine-tuning and post-training', href: L13 + '#pretraining' },
    { id: 'use', label: 'Prompting, RAG, tools and agents', href: L12 + '#generate' },
    { id: 'risk', label: 'Reliability, alignment and efficiency', href: L13 + '#hacking' },
  ],
  tasks: [
    /* ---------- abbreviations ---------- */
    {
      id: 'q01', title: 'GPT', type: 'Abbreviation', level: 'Easy', skill: 'terms',
      parts: [{ kind: 'mc', pts: 2, q: 'What does <b>GPT</b> stand for?', options: ['General Predictive Training', 'General Purpose Predictive Transformer', 'Generative Pre-trained Transformer', 'Generative Processing Technique'], answer: 2, inline: false }],
      explain: `<p><b>Generative Pre-trained Transformer</b>: a model that <i>generates</i> text, is <i>pre-trained</i> on large amounts of text, and uses the <i>Transformer</i> architecture (${a(L12, 'Lab 12')}).</p>`,
    },
    {
      id: 'q02', title: 'LLM', type: 'Abbreviation', level: 'Easy', skill: 'terms',
      parts: [{ kind: 'mc', pts: 2, q: 'What does <b>LLM</b> stand for?', options: ['Learned Linguistic Matrix', 'Large Language Model', 'Latent Language Machine', 'Large Learning Method'], answer: 1, inline: false }],
      explain: '<p><b>Large Language Model</b>: a very large neural network trained on text to predict the next token.</p>',
    },
    {
      id: 'q03', title: 'RLHF', type: 'Abbreviation', level: 'Easy', skill: 'terms',
      parts: [{ kind: 'mc', pts: 2, q: 'What does <b>RLHF</b> stand for?', options: ['Representation Learning from Hidden Features', 'Recursive Learning with Human Functions', 'Reward Learning for Hybrid Features', 'Reinforcement Learning from Human Feedback'], answer: 3, inline: false }],
      explain: `<p><b>Reinforcement Learning from Human Feedback</b>: humans compare responses, a reward model learns their preferences, and the language model is optimised against it (${a(L13 + '#rlhf', 'Lab 13')}).</p>`,
    },
    {
      id: 'q04', title: 'RAG', type: 'Abbreviation', level: 'Easy', skill: 'terms',
      parts: [{ kind: 'mc', pts: 2, q: 'What does <b>RAG</b> stand for?', options: ['Retrieval-Augmented Generation', 'Recurrent Attention-Guided Generator', 'Reinforced Agent Generation', 'Retrieval-Aware Gradient'], answer: 0, inline: false }],
      explain: '<p><b>Retrieval-Augmented Generation</b>: retrieve relevant documents first, then generate the answer with them in the model’s context.</p>',
    },
    {
      id: 'q05', title: 'SFT', type: 'Abbreviation', level: 'Easy', skill: 'terms',
      parts: [{ kind: 'mc', pts: 2, q: 'What does <b>SFT</b> usually mean in modern LLM training?', options: ['Semantic Feature Training', 'Stochastic Foundation Training', 'Supervised Fine-Tuning', 'Structured Feedback Transfer'], answer: 2, inline: false }],
      explain: `<p><b>Supervised Fine-Tuning</b>: train a pretrained model to imitate curated example responses (${a(L13 + '#sft', 'Lab 13')}).</p>`,
    },
    {
      id: 'q06', title: 'DPO', type: 'Abbreviation', level: 'Easy', skill: 'terms',
      parts: [{ kind: 'mc', pts: 2, q: 'What does <b>DPO</b> stand for?', options: ['Dynamic Prompt Optimization', 'Direct Preference Optimization', 'Distributed Parameter Optimization', 'Deep Preference Output'], answer: 1, inline: false }],
      explain: `<p><b>Direct Preference Optimization</b>: learn from chosen / rejected response pairs directly, without a separate reward model (${a(L13 + '#dpo', 'Lab 13')}).</p>`,
    },
    {
      id: 'q36', title: 'LoRA', type: 'Abbreviation', level: 'Easy', skill: 'terms',
      parts: [{ kind: 'mc', pts: 2, q: 'What is <b>LoRA</b>?', options: ['Long-Range Attention for long documents', 'Logit-Ranked Alignment from preferences', 'Low-Rank Adaptation for fine-tuning', 'Layered Retrieval Agent for search'], answer: 2, inline: false }],
      explain: '<p><b>LoRA = Low-Rank Adaptation</b>, a parameter-efficient fine-tuning (PEFT) method: the model’s original weights stay frozen, and only a small low-rank update is trained and added to them. Adapting a large model then needs far less memory and compute (see the “Billions of parameters” question below).</p>',
    },
    /* ---------- embeddings ---------- */
    {
      id: 'q07', title: 'cat, dog, car, truck', type: 'Embeddings', level: 'Easy', skill: 'emb',
      intro: '<p>Four words represented as vectors, drawn in two dimensions:</p>' + EMB,
      parts: [{ kind: 'mc', pts: 3, q: 'What property is being illustrated?', options: ['Related items lie close together', 'Token IDs increase with meaning', 'Every vector has exactly one dimension', 'Similar words share one token'], answer: 0, inline: false }],
      explain: `<p>A good <b>embedding</b> space places semantically related items near one another: the animals together, the vehicles together. Real embeddings have hundreds or thousands of dimensions (${a(L12 + '#embeddings', 'Lab 12')}).</p>`,
    },
    {
      id: 'q08', title: 'Token ID 324 vs. a vector', type: 'Embeddings', level: 'Medium', skill: 'emb',
      intro: cards(stat('“cat” → token ID', '324'), stat('“cat” → embedding', '[0.12, −0.44, 0.91, …]')),
      parts: [
        { kind: 'mc', pts: 2, q: 'What is the difference?', options: ['The ID encodes meaning; the vector is its name', 'Both are learned vectors of different sizes', 'The embedding is the ID written in binary', 'The ID is a label; the vector is learned'], answer: 3, inline: false },
        { kind: 'mc', pts: 1, q: 'Do the neighbouring IDs 324 (cat) and 325 (car) mean the words are similar?', options: ['Yes', 'No'], answer: 1, letters: false },
      ],
      explain: `<p>A <b>token ID</b> is just an integer identifier for a vocabulary entry; its value carries no meaning, so 324 and 325 can be unrelated words. The <b>embedding</b> is a learned vector that does encode similarity (${a(L12 + '#embeddings', 'Lab 12')}).</p>`,
    },
    {
      id: 'q09', title: '“How do I reset my password?”', type: 'Semantic search', level: 'Easy', skill: 'emb',
      intro: '<p>You have 1 million documents and want the ones with a similar <b>meaning</b>, even if they use different words.</p>' + stack(card('Query', 'How do I reset my password?'), card('A matching document', 'Forgot your login credentials? Follow these steps to create a new one…')),
      parts: [{ kind: 'mc', pts: 3, q: 'Which technique is most suitable?', options: ['Random sampling of tokens from documents', 'Gradient clipping during training', 'Embedding-based semantic search', 'Image data augmentation'], answer: 2, inline: false }],
      explain: '<p>Embed the query and the documents, then compare the vectors: documents with a similar meaning end up close, even with no word in common (<i>password</i> vs. <i>login credentials</i>).</p>',
    },
    {
      id: 'q10', title: 'Three cosine similarities', type: 'Semantic search', level: 'Easy', skill: 'emb',
      intro: '<p>Cosine similarity of each document’s embedding with the query’s:</p>' + viz(bars([['Document A', 0.91, 1, '0.91'], ['Document B', 0.42, 1, '0.42'], ['Document C', 0.08, 1, '0.08']]), 'qzv-wide'),
      parts: [{ kind: 'mc', pts: 2, q: 'Which document is most semantically similar to the query?', options: ['Document A', 'Document B', 'Document C'], answer: 0, letters: false }],
      explain: '<p><b>Document A</b>: a larger cosine similarity means the vectors point in a closer direction (1 = same direction, 0 = unrelated).</p>',
    },
    /* ---------- training lifecycle ---------- */
    {
      id: 'q11', title: 'Three stages of a model’s life', type: 'Lifecycle', level: 'Easy', skill: 'train',
      parts: [{ kind: 'seq', pts: 3, q: 'Put the stages in order.', label: 'first →', tokens: ['deployment / inference', 'pretraining', 'post-training'], answer: ['pretraining', 'post-training', 'deployment / inference'] }],
      explain: `<p><b>Pretraining</b> → <b>post-training</b> → <b>deployment / inference</b>: learn broad capabilities, shape the behaviour, then use the model (${a(L13, 'Lab 13')}).</p>`,
    },
    {
      id: 'q12', title: 'Trillions of tokens', type: 'Lifecycle', level: 'Easy', skill: 'train',
      intro: '<p>A model learns from trillions of tokens by predicting likely next tokens.</p>' + lanes(lane('web text, books, code', '→', 'The cat sat on the …', '→', '!predict: mat')),
      parts: [{ kind: 'mc', pts: 3, q: 'Which stage is this?', options: ['Pretraining', 'Retrieval', 'Evaluation only', 'Quantization'], answer: 0 }],
      explain: `<p><b>Pretraining</b>: next-token prediction on large-scale data, which gives the model broad language and world knowledge (${a(L13 + '#pretraining', 'Lab 13')}).</p>`,
    },
    {
      id: 'q13', title: '“Explain photosynthesis simply”', type: 'Lifecycle', level: 'Easy', skill: 'train',
      intro: '<p>A pretrained model is given curated examples such as:</p>' + pair(card('Prompt', 'Explain photosynthesis simply.'), card('Desired answer', 'Photosynthesis is the process by which plants…', 'chosen')),
      parts: [{ kind: 'mc', pts: 3, q: 'What is happening?', options: ['Tokenization', 'Pretraining from scratch', 'Vector indexing', 'Supervised fine-tuning'], answer: 3 }],
      explain: `<p><b>Supervised fine-tuning</b> (SFT): the model learns to imitate high-quality example responses (${a(L13 + '#sft', 'Lab 13')}).</p>`,
    },
    {
      id: 'q14', title: 'Pretraining vs. post-training', type: 'Lifecycle', level: 'Medium', skill: 'train',
      parts: [{ kind: 'rows', pts: 3, q: 'What is the main goal of each stage?', options: ['Learn broad capabilities from data', 'Shape behaviour: instructions, safety', 'Shrink the model for cheaper use'],
        rows: [{ label: 'Post-training', answer: 1 }, { label: 'Pretraining', answer: 0 }] }],
      explain: '<p><b>Pretraining → learn capabilities</b> from large-scale data. <b>Post-training → shape behaviour</b>: follow instructions, match preferences, be safe, fit specific uses. (Shrinking a model is quantization or distillation.)</p>',
    },
    {
      id: 'q18', title: 'Too formal', type: 'Adaptation', level: 'Medium', skill: 'train',
      intro: '<p>An LLM knows the domain, but its answers are too formal. You have 5,000 examples in the desired conversational style.</p>' + pair(card('Current answer', 'Pursuant to the applicable regulations, the requested modification cannot be effected.'), card('Desired style', 'Sorry, that change isn’t possible under the current rules, but here’s what you can do instead…', 'chosen')),
      parts: [{ kind: 'mc', pts: 3, q: 'Which technique is a reasonable choice?', options: ['Increasing the context length', 'Fine-tuning', 'Embedding search only', 'Changing the token IDs'], answer: 1, inline: false }],
      explain: '<p><b>Fine-tuning</b> changes the model’s behaviour persistently by updating its parameters on the 5,000 examples. Retrieval or a longer context add information, not a new style.</p>',
    },
    {
      id: 'q19', title: 'Billions of parameters', type: 'Adaptation', level: 'Medium', skill: 'train',
      intro: '<p>You want to adapt a large model without updating all of its billions of parameters.</p>' + LORA,
      parts: [{ kind: 'mc', pts: 3, q: 'Which technique is designed for this?', options: ['BPE', 'RAG', 'LoRA', 'Beam search'], answer: 2 }],
      explain: '<p><b>LoRA</b> (Low-Rank Adaptation) is a parameter-efficient fine-tuning (PEFT) method: the original weights W stay frozen and only a small low-rank update B·A is trained. BPE is a tokenizer, RAG adds retrieved documents, beam search is a decoding method.</p>',
    },
    {
      id: 'q30', title: 'Changing vs. using the weights', type: 'Training vs. inference', level: 'Medium', skill: 'train',
      parts: [{ kind: 'rows', pts: 3, q: 'Is each activity training or inference?', options: ['Training', 'Inference'],
        rows: [
          { label: 'Use fixed weights to generate an answer', answer: 1 },
          { label: 'Compute gradients and update the weights', answer: 0 },
          { label: 'Few-shot prompting with examples in the prompt', answer: 1 },
          { label: 'Adapt a model to new data with LoRA', answer: 0 },
        ] }],
      explain: '<p><b>Training</b> changes the model’s parameters (gradients, updates, LoRA). <b>Inference</b> uses fixed parameters to produce an output; examples in a prompt change only the input.</p>',
    },
    /* ---------- prompting, RAG, tools, agents ---------- */
    {
      id: 'q15', title: 'Two examples in the prompt', type: 'Prompting', level: 'Easy', skill: 'use',
      intro: stack(card('Prompt', 'Classify each review as positive or negative.<br>Review: Amazing movie → Positive<br>Review: Very boring → Negative<br>Now classify: I loved the acting')),
      parts: [
        { kind: 'mc', pts: 2, q: 'What technique is this?', options: ['Pretraining on the reviews', 'Few-shot prompting', 'Pruning the model’s weights', 'Quantization of the weights'], answer: 1 },
        { kind: 'mc', pts: 1, q: 'Are any model weights changed?', options: ['Yes', 'No'], answer: 1, letters: false },
      ],
      explain: '<p><b>In-context learning / few-shot prompting</b>: the examples are supplied inside the prompt, and the model picks up the task without any weight update.</p>',
    },
    {
      id: 'q16', title: 'Policies that change every week', type: 'RAG', level: 'Easy', skill: 'use',
      intro: '<p>A company’s internal policies change every week. The assistant must answer from the latest policy documents, without retraining the model every week.</p>' + chips(['policy v12 · 3 Mar', 'policy v13 · 10 Mar', 'policy v14 · 17 Mar', '…']),
      parts: [{ kind: 'mc', pts: 3, q: 'Which technique is most suitable?', options: ['Pretraining from scratch', 'Increasing the temperature', 'Distillation', 'RAG'], answer: 3 }],
      explain: '<p><b>RAG</b> retrieves the relevant current documents at question time and puts them into the model’s context; updating the document store is enough, no retraining needed.</p>',
    },
    {
      id: 'q20', title: 'Documents, style or instructions?', type: 'Choosing a technique', level: 'Medium', skill: 'use',
      parts: [{ kind: 'rows', pts: 3, q: 'Which approach fits each goal most naturally?', options: ['RAG', 'Fine-tuning', 'Prompting'],
        rows: [
          { label: 'Give temporary instructions for one request', answer: 2 },
          { label: 'Give the model current company documents', answer: 0 },
          { label: 'Teach a persistent new response style', answer: 1 },
        ] }],
      explain: '<p>Current documents → <b>RAG</b>; a persistent new style → <b>fine-tuning</b>; temporary instructions → <b>prompting</b>.</p>',
    },
    {
      id: 'q21', title: '128,000 tokens', type: 'Context window', level: 'Medium', skill: 'use',
      intro: '<p>A model has a context window of <b>128,000 tokens</b>.</p>' + viz('<div class="qzv-split qz-ctx"><div class="a" style="flex:4">system</div><div class="b" style="flex:18">history</div><div class="a" style="flex:40">retrieved documents</div><div class="b" style="flex:6">input</div><div class="a" style="flex:12">output</div><div class="free" style="flex:20">free</div></div>'),
      parts: [
        { kind: 'mc', pts: 1.5, q: 'What does this number describe?', options: ['The words the model has learned', 'The size of its training corpus', 'Tokens it can process at once', 'The number of its parameters'], answer: 2, inline: false },
        { kind: 'multi', pts: 1.5, q: 'Which of these use up the context window?', options: ['System instructions', 'Conversation history', 'Retrieved documents', 'The model’s own output', 'The training corpus', 'The model’s weights'], answer: [0, 1, 2, 3], letters: false },
      ],
      explain: '<p>The context window is roughly the maximum amount of tokenized information the model can process at once: system instructions, the conversation so far, retrieved documents, the user’s input and the model’s own output all share it. The training data and the weights are not part of it.</p>',
    },
    {
      id: 'q17', title: 'Before the model answers', type: 'RAG', level: 'Medium', skill: 'use',
      intro: flowV('user question', 'embed the query', '<b>retrieve relevant documents</b>', 'question + retrieved context', 'LLM', 'answer'),
      parts: [{ kind: 'mc', pts: 3, q: 'What is the main purpose of the retrieval step?', options: ['Supply relevant external information first', 'Update the model’s weights for each question', 'Translate the question into token IDs', 'Check the answer after it is generated'], answer: 0, inline: false }],
      explain: '<p>Retrieval supplies relevant <b>external information before generation</b>, which improves freshness, domain grounding and source-specific answers.</p>',
    },
    {
      id: 'q24', title: '3817 × 942', type: 'Tool use', level: 'Easy', skill: 'use',
      intro: lanes(lane('“What is 3817 × 942?”', '→', 'LLM', '→', '!calculator', '→', '3,595,614', '→', 'answer')),
      parts: [{ kind: 'mc', pts: 3, q: 'Instead of estimating, the model calls a calculator. What capability is this?', options: ['Pretraining', 'Token compression', 'Distillation', 'Tool use'], answer: 3, inline: false }],
      explain: '<p><b>Tool use</b>: the model delegates a specialised operation to an external tool and uses the result (3817 × 942 = 3,595,614).</p>',
    },
    {
      id: 'q25', title: '“Plan my trip”', type: 'Agents', level: 'Medium', skill: 'use',
      intro: chips(['1 · search flights', '2 · compare hotels', '3 · check calendar', '4 · revise the plan', '5 · present the itinerary']),
      parts: [{ kind: 'multi', pts: 3, q: 'What makes this more agent-like than a one-shot chatbot reply?', options: ['Several steps toward a goal', 'It calls external tools', 'It keeps intermediate state', 'It revises its own plan', 'It uses a bigger model', 'It answers in a single reply'], answer: [0, 1, 2, 3], letters: false }],
      explain: '<p>An agent is roughly <b>model + tools + state + a multi-step control loop</b>: it takes several actions toward a goal, uses tools, remembers intermediate results and revises its plan. Model size has nothing to do with it.</p>',
    },
    {
      id: 'q26', title: 'Text, images, audio', type: 'Modality', level: 'Easy', skill: 'use',
      intro: lanes(lane('text', '+', 'images', '+', 'audio', '→', '!one model')),
      parts: [{ kind: 'mc', pts: 2, q: 'What kind of model is this?', options: ['Multimodal model', 'Text-only tokenizer', 'Linear regressor', 'Vector database'], answer: 0 }],
      explain: '<p>A <b>multimodal</b> model accepts (and may produce) several modalities: text, images, audio.</p>',
    },
    {
      id: 'q34', title: 'Six concepts, six purposes', type: 'Concept map', level: 'Medium', skill: 'use',
      parts: [
        { kind: 'rows', pts: 2, q: 'What is the main purpose of each concept?', options: ['Represent meaning as vectors', 'Inject retrieved knowledge', 'Change persistent behaviour'],
          rows: [{ label: 'RAG', answer: 1 }, { label: 'Embeddings', answer: 0 }, { label: 'Fine-tuning', answer: 2 }] },
        { kind: 'rows', pts: 2, q: 'And of these?', options: ['Shape behaviour by preferences', 'Cut memory and compute cost', 'Delegate to external systems'],
          rows: [{ label: 'Tool use', answer: 2 }, { label: 'RLHF / DPO', answer: 0 }, { label: 'Quantization', answer: 1 }] },
      ],
      explain: '<p><b>Embeddings</b>: semantic information as vectors. <b>RAG</b>: inject retrieved external knowledge. <b>Fine-tuning</b>: modify persistent behaviour. <b>RLHF / DPO</b>: shape behaviour using preferences. <b>Quantization</b>: reduce inference memory and compute. <b>Tool use</b>: delegate operations to external systems.</p>',
    },
    {
      id: 'q35', title: 'A university assistant', type: 'System design', level: 'Hard', skill: 'use',
      intro: '<p>A university wants an AI assistant. Which component covers each requirement?</p>',
      parts: [{ kind: 'rows', pts: 4, q: 'Requirement → component', options: ['LLM', 'RAG', 'Fine-tuning (SFT)', 'Tool use', 'Grounding rules'],
        rows: [
          { label: 'Searches the current university regulations', answer: 1 },
          { label: 'Uses a calculator for numerical tasks', answer: 3 },
          { label: 'Understands natural-language questions', answer: 0 },
          { label: 'Refuses unsupported answers when information is missing', answer: 4 },
          { label: 'Answers in the university’s preferred style', answer: 2 },
        ] }],
      explain: '<p>LLM → language understanding and generation; RAG (with embeddings for semantic search) → current regulations, with citations; fine-tuning / SFT → preferred style; tool use → calculator; grounding rules and evaluation → refuse unsupported answers. Modern AI products are usually <b>systems</b>, not one standalone model.</p>',
    },
    /* ---------- reliability, alignment, efficiency ---------- */
    {
      id: 'q22', title: 'The Eiffel Tower, 1957', type: 'Failure modes', level: 'Easy', skill: 'risk',
      intro: stack(card('Model answer (high confidence)', 'The Eiffel Tower was completed in 1957.')) + '<p>The correct year is 1889.</p>',
      parts: [{ kind: 'mc', pts: 3, q: 'What failure mode does this illustrate?', options: ['Hallucination', 'Tokenization', 'Quantization', 'Embedding collapse'], answer: 0 }],
      explain: '<p><b>Hallucination</b>: the model generated plausible-sounding but false information, with confidence.</p>',
    },
    {
      id: 'q23', title: 'A legal handbook', type: 'Grounding', level: 'Easy', skill: 'risk',
      intro: '<p>You answer questions about a company’s legal handbook.</p>' + stack(card('Question', 'How many days of notice does an employee have to give?')),
      parts: [{ kind: 'mc', pts: 3, q: 'Which setup is more likely to reduce unsupported claims?', options: ['Raise the temperature substantially', 'Answer from the retrieved handbook', 'Remove all of the source documents', 'Randomise the tokenizer'], answer: 1, inline: false }],
      explain: '<p><b>Grounding</b> the model in the relevant source material (and requiring answers to come from it, ideally with citations) reduces unsupported generation. A higher temperature makes outputs more random.</p>',
    },
    {
      id: 'q27', title: 'Only some blocks run', type: 'Architecture', level: 'Medium', skill: 'risk',
      intro: '<p>A model contains many parallel subnetworks; a router activates only some of them for each token.</p>' + MOE,
      parts: [{ kind: 'mc', pts: 3, q: 'What architecture is this?', options: ['K-nearest neighbours', 'Decision tree', 'Mixture of Experts', 'Logistic regression'], answer: 2 }],
      explain: '<p><b>Mixture of Experts</b> (MoE): the parallel blocks are called <b>experts</b>, and a router sends each token to only a few of them (here blocks 2 and 3), so the model has a large total capacity while only part of it runs for each token.</p>',
    },
    {
      id: 'q28', title: '16-bit → 8-bit → 4-bit', type: 'Efficiency', level: 'Medium', skill: 'risk',
      intro: '<p>A model’s weights are stored with lower numerical precision:</p>' + viz(bars([['16-bit', 16, 16, '16 bits'], ['8-bit', 8, 16, '8 bits', 'val'], ['4-bit', 4, 16, '4 bits', 'alt']]), 'qzv-wide'),
      parts: [
        { kind: 'mc', pts: 1.5, q: 'What technique is this?', options: ['Retrieval', 'RLHF', 'Tokenization', 'Quantization'], answer: 3 },
        { kind: 'num', pts: 1.5, q: 'A 7-billion-parameter model needs about 14 GB at 16 bits per weight. About how many GB at 4 bits?', answer: 3.5, tol: 0.01, suffix: 'GB' },
      ],
      explain: '<p><b>Quantization</b>: fewer bits per weight cut memory and compute, sometimes with a small loss of quality. 4 bits is a quarter of 16, so 14 GB → <b>3.5 GB</b> (7 × 10⁹ weights × 0.5 bytes).</p>',
    },
    {
      id: 'q29', title: 'Teacher and student', type: 'Efficiency', level: 'Easy', skill: 'risk',
      intro: lanes(lane('large teacher model', '→', 'outputs / probabilities', '→', '!smaller student model')),
      parts: [{ kind: 'mc', pts: 3, q: 'What technique is this?', options: ['Knowledge distillation', 'Retrieval augmentation', 'Beam search decoding', 'Dropout regularisation'], answer: 0 }],
      explain: '<p><b>Knowledge distillation</b>: the smaller student learns to imitate the larger teacher, keeping much of its behaviour at a fraction of the cost.</p>',
    },
    {
      id: 'q31', title: 'A preferred over B', type: 'Post-training', level: 'Easy', skill: 'risk',
      intro: '<p>Humans compare two outputs and mark A as better; the preferences are used to improve the model.</p>' + pair(card('Response A', 'preferred', 'chosen'), card('Response B', 'rejected', 'rejected')),
      parts: [{ kind: 'mc', pts: 2, q: 'Which family of techniques does this belong to?', options: ['Unsupervised clustering', 'Preference-based post-training', 'Pretraining', 'Retrieval-augmented generation'], answer: 1, inline: false }],
      explain: `<p><b>Preference-based post-training</b>, e.g. RLHF and DPO (${a(L13 + '#preferences', 'Lab 13')}).</p>`,
    },
    {
      id: 'q32', title: 'RLHF and DPO', type: 'Post-training', level: 'Medium', skill: 'risk',
      parts: [{ kind: 'rows', pts: 3, q: 'Which method does each statement describe?', options: ['RLHF', 'DPO', 'Both'],
        rows: [
          { label: 'Uses chosen / rejected pairs more directly', answer: 1 },
          { label: 'Learns from human preference data', answer: 2 },
          { label: 'Often trains a separate reward model first', answer: 0 },
          { label: 'Then optimises the policy against that reward', answer: 0 },
        ] }],
      explain: `<p><b>RLHF</b> trains a reward model, then optimises the policy against it with reinforcement learning; <b>DPO</b> uses the chosen / rejected pairs directly. <b>Both</b> align the model with preference data (${a(L13 + '#dpo', 'Lab 13')}).</p>`,
    },
    {
      id: 'q33', title: 'Longer and longer answers', type: 'Alignment risk', level: 'Medium', skill: 'risk',
      intro: '<p>A reward model gives high scores to very long answers, and the trained assistant starts producing unnecessarily long responses to maximise reward.</p>' + viz(bars([['150 words', 3.1, 9, '3.1'], ['400 words', 6.4, 9, '6.4'], ['900 words', 8.8, 9, '8.8']]) + '<p class="qzv-legend">illustrative reward-model scores, by answer length, for one question</p>', 'qzv-wide'),
      parts: [{ kind: 'mc', pts: 3, q: 'What problem is this?', options: ['Tokenization failure', 'Data sharding', 'Quantization error', 'Reward hacking'], answer: 3 }],
      explain: `<p><b>Reward hacking</b>: the model exploits the measurable reward (length) instead of the real goal (helpful answers) (${a(L13 + '#hacking', 'Lab 13')}).</p>`,
    },
  ],
};
