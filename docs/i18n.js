/* ===== translations: the English page is the source; BG replaces text by exact match ===== */
(function () {
  var BG = {
    /* header + hero */
    "Class Notes": "Записки",
    "Labs": "Упражнения",
    "Projects": "Проекти",
    "Team": "Екип",
    "Switch language": "Смяна на езика",
    "Language": "Език",
    "Intelligent Systems / Artificial Intelligence — Sofia University": "Интелигентни системи / Изкуствен интелект — Софийски университет",
    "Intelligent Systems / Artificial Intelligence": "Интелигентни системи / Изкуствен интелект",
    "course @ Sofia University": "курс @ Софийски университет",
    "Lab notes by": "Материали за упражненията от",
    "and": "и",
    "Elitsa Yotkova": "Елица Йоткова",
    "Kristina Kalemdzhieva": "Кристина Калемджиева",
    "Sofia University \"St. Kliment Ohridski\"": "Софийски университет „Св. Климент Охридски“",
    "Faculty of Mathematics and Informatics": "Факултет по математика и информатика",

    /* labs table */
    "Topic": "Тема",
    "Description": "Описание",
    "Notes": "Материали",
    "Quiz": "Тест",
    "Learn →": "Преглед →",
    "Quiz →": "Тест →",

    "Introduction": "Увод",
    "Who we are and a map of the course: search, machine learning and language models": "Кои сме ние и карта на курса: търсене, машинно обучение и езикови модели",
    "Uninformed Search": "Неинформирано търсене",
    "Basic definitions, state spaces, and blind search strategies (BFS, DFS, UCS, IDS)": "Основни дефиниции, пространства на състоянията и стратегии за сляпо търсене (BFS, DFS, UCS, IDS)",
    "Informed Search": "Информирано търсене",
    "Heuristic functions, greedy search, A* algorithm, and optimization techniques": "Евристични функции, лакомо търсене, алгоритъм A* и техники за оптимизация",
    "Constraint Satisfaction": "Удовлетворяване на ограничения",
    "CSP fundamentals, backtracking, arc consistency (AC-3), and min-conflicts heuristics": "Основи на CSP, backtracking, дъгова консистентност (AC-3) и min-conflicts евристики",
    "Genetic Algorithms": "Генетични алгоритми",
    "Evolutionary search, selection mechanisms, crossover, mutation, and metaheuristic optimization": "Еволюционно търсене, механизми за селекция, кръстосване, мутация и метаевристична оптимизация",
    "Games": "Игри",
    "Adversarial search, game trees, minimax, and alpha-beta pruning": "Състезателно търсене, дървета на игрите, минимакс и алфа-бета отсичане",
    "Introduction to ML": "Въведение в машинното обучение",
    "Core concepts, bias and variance, regression and classification, KNN, SVM, Naive Bayes, decision trees, and K-Means": "Основни понятия, bias и variance, регресия и класификация, KNN, SVM, Наивен Бейсов класификатор, дървета на решенията и K-Means",
    "Linear & Logistic Regression": "Линейна и логистична регресия",
    "Cost function, gradient descent and the closed form, R² and RMSE, logit and sigmoid, cross-entropy, one-vs-rest and softmax": "Функция на цената, градиентно спускане и затворена форма, R² и RMSE, logit и sigmoid, крос-ентропия, one-vs-rest и softmax",
    "K-Nearest Neighbours": "K най-близки съседи",
    "Global vs local, instance-based vs model-based and lazy vs eager learning, distance metrics, choosing K, KNN classification and regression": "Глобално срещу локално, обучение върху екземпляри срещу върху модел, мързеливо срещу нетърпеливо обучение, метрики за разстояние, избор на K, KNN класификация и регресия",
    "Naive Bayes Classifier": "Наивен Бейсов класификатор",
    "Bayes' theorem, conditional independence, spam filtering, the zero-probability problem and Laplace smoothing, Gaussian Naive Bayes": "Теорема на Бейс, условна независимост, филтриране на спам, проблемът с нулевата вероятност и изглаждане на Лаплас, Гаусов Наивен Бейсов класификатор",
    "Decision Trees": "Дървета на решенията",
    "Classification and regression trees, recursive construction, entropy as expected surprise, information gain, ID3 in Python, overfitting, pre- and post-pruning": "Дървета за класификация и регресия, рекурсивно построяване, ентропия като очаквана изненада, информационна печалба, ID3 на Python, overfitting, pre- и post-pruning",
    "K-Means and Clustering": "K-Means и клъстеризация",
    "Unsupervised learning, the K-means algorithm and its cost, local optima and random restarts, the elbow method and silhouette analysis, K-means++, soft K-means, hierarchical clustering and linkages, cluster evaluation metrics": "Обучение без учител, алгоритъмът K-means и неговата цена, локални оптимуми и случайни рестартирания, методът на лакътя и силуетен анализ, K-means++, мек K-means, йерархична клъстеризация и свързване, метрики за оценка на клъстери",
    "Neural Networks": "Невронни мрежи",
    "The artificial neuron and activation functions, logic gates and XOR, multilayer perceptrons and universality, gradient descent, perceptron learning, back-propagation, handwritten digit recognition": "Изкуственият неврон и активационни функции, логически порти и XOR, многослойни перцептрони и универсалност, градиентно спускане, обучение на перцептрона, back-propagation, разпознаване на ръкописни цифри",
    "Transformers and Generative Models": "Трансформъри и генеративни модели",
    "Subword tokenization and BPE, embeddings and position, self-attention with queries, keys and values, causal masking, MLP and residual connections, logits, softmax and temperature, text generation": "Токенизация на поддуми и BPE, embeddings и позиция, self-attention със заявки (queries), ключове (keys) и стойности (values), каузално маскиране, MLP и остатъчни връзки, logits, softmax и температура, генериране на текст",
    "Post-training and Alignment": "Post-training и alignment",
    "Pretraining vs SFT vs preference learning, reward models and RLHF, the KL constraint, reward hacking and Goodhart's law, DPO, human and AI feedback, outcome vs process supervision, verifiable rewards, evaluation": "Pretraining срещу SFT срещу обучение по предпочитания, reward models и RLHF, KL ограничението, reward hacking и законът на Гудхарт, DPO, обратна връзка от хора и от ИИ, надзор върху резултата срещу надзор върху процеса, проверими награди, оценяване",
    "Evaluation, Metrics and Data Analysis": "Оценяване, метрики и анализ на данни",
    "Task vs metric vs evaluator, precision, recall and F1, BLEU, ROUGE-L and COMET, LLM-as-a-judge and its biases, reading plots, subgroup analysis, distribution shift, data leakage and contamination, uncertainty, human evaluation": "Задача срещу метрика срещу оценител, прецизност, recall и F1, BLEU, ROUGE-L и COMET, LLM-as-a-judge и неговите пристрастия, четене на графики, анализ по подгрупи, промяна на разпределението, изтичане и замърсяване на данни, несигурност, оценяване от хора",

    /* projects */
    "Recommended projects": "Препоръчани проекти",
    "SemEval-2027 shared tasks": "Споделени задачи на SemEval-2027",
    "For the course project we recommend taking part in a task from": "За курсовия проект препоръчваме участие в задача от",
    ", the 21st International Workshop on Semantic Evaluation. Each task is already": ", 21-вия международен семинар по семантична оценка. Всяка задача вече е",
    "defined by its organisers and comes with its own data": "дефинирана от организаторите и идва със собствени данни",
    "and evaluation, so you can focus on building and analysing a system instead of collecting a dataset.": "и оценяване, така че можете да се съсредоточите върху изграждането и анализа на система, вместо върху събирането на набор от данни.",
    "Teams": "Отбори",
    ": of at most": ": най-много",
    "students.": "студента.",
    "Choose a task": "Изберете задача",
    ": the 11 tasks cover reasoning and inference, lexical semantics, cross-lingual and cultural understanding, stereotypes, framing and sentiment, and AI agents and tools.": ": 11-те задачи обхващат разсъждение и извод, лексикална семантика, междуезиково и културно разбиране, стереотипи, framing и настроения, както и ИИ агенти и инструменти.",
    "Data and evaluation": "Данни и оценяване",
    ": provided by each task's organisers; see the task pages and their contact / mailing-list links.": ": предоставят се от организаторите на всяка задача; вижте страниците на задачите и техните контакти / пощенски списъци.",
    "Browse the SemEval-2027 tasks →": "Разгледайте задачите на SemEval-2027 →",

    /* team */
    "Led by": "Воден от",
    "Labs · Teaching Assistant · Author of these notes": "Упражнения · Асистент · Автор на тези материали",
    "Master's student in Information Retrieval and Knowledge Discovery @ Sofia University, ex-Google, Uber": "Студентка в магистърска програма „Извличане на информация и откриване на знания“ @ Софийски университет, ex-Google, Uber",
    "Master's student in Information Retrieval and Knowledge Discovery @ Sofia University, ex-AWS": "Студентка в магистърска програма „Извличане на информация и откриване на знания“ @ Софийски университет, ex-AWS",
    "Website": "Уебсайт",
    "Previously at": "Преди това в",
    "Lectures": "Лекции",
    "Prof. Ivan Koychev": "проф. Иван Койчев",
    "Sofia University \"St. Kliment Ohridski\", Faculty of Mathematics and Informatics": "Софийски университет „Св. Климент Охридски“, Факултет по математика и информатика",
    "The course is also taught by other teaching assistants; this site contains only our lab notes.": "Курсът се води и от други асистенти; този сайт съдържа само нашите материали от упражненията.",
    "Intelligent Systems / Artificial Intelligence · Sofia University · Lab notes by Elitsa Yotkova and Kristina Kalemdzhieva (teaching assistants of the course)": "Интелигентни системи / Изкуствен интелект · Софийски университет · Материали от упражненията на Елица Йоткова и Кристина Калемджиева (асистенти по курса)"
  };

  var ATTRS = ['alt', 'title', 'aria-label'];
  var orig = new WeakMap(), attrOrig = new WeakMap(), titleEn = null;

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  function tr(text) {
    var key = norm(text);
    if (!key || !Object.prototype.hasOwnProperty.call(BG, key)) return null;
    return text.match(/^\s*/)[0] + BG[key] + text.match(/\s*$/)[0];
  }

  function setText(n, bg) {
    if (bg) {
      var t = tr(orig.has(n) ? orig.get(n) : n.nodeValue);
      if (t !== null) { if (!orig.has(n)) orig.set(n, n.nodeValue); n.nodeValue = t; }
    } else if (orig.has(n)) { n.nodeValue = orig.get(n); orig.delete(n); }
  }
  function setAttrs(el, bg) {
    if (el.nodeType !== 1 || el.classList.contains('theme-toggle')) return; // theme.js manages its own labels
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var saved = attrOrig.get(el) || {};
      if (bg) {
        var base = (a in saved) ? saved[a] : el.getAttribute(a), t = tr(base);
        if (t !== null) { saved[a] = base; attrOrig.set(el, saved); el.setAttribute(a, t.trim()); }
      } else if (a in saved) { el.setAttribute(a, saved[a]); delete saved[a]; }
    });
  }
  function translateTree(root, bg) {
    if (root.nodeType === 3) { setText(root, bg); return; }
    if (root.nodeType !== 1) return;
    setAttrs(root, bg);
    root.querySelectorAll('[alt],[title],[aria-label]').forEach(function (el) { setAttrs(el, bg); });
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode && n.parentNode.nodeName;
        return (p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    }), nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(function (n) { setText(n, bg); });
  }

  var bgOn = false;
  function apply(lang) {
    bgOn = lang === 'bg';
    translateTree(document.body, bgOn);
    if (titleEn === null) titleEn = document.title;
    var t = bgOn ? tr(titleEn) : null;
    document.title = t !== null ? t.trim() : titleEn;
  }

  document.addEventListener('class-notes-lang', function (e) { apply(e.detail); });
  document.addEventListener('DOMContentLoaded', function () {
    // text that scripts add later (widgets, quizzes) is translated as it appears
    new MutationObserver(function (muts) {
      if (!bgOn) return;
      muts.forEach(function (m) { m.addedNodes.forEach(function (n) { translateTree(n, true); }); });
    }).observe(document.body, { childList: true, subtree: true });
    apply(document.documentElement.getAttribute('lang') === 'bg' ? 'bg' : 'en');
  });
})();