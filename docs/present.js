/* ===== presentation mode: shows the page's <template id="slides"> as a slide deck.
   The screen button in the header (or P) switches it on and off and is remembered, like the theme.
   ← → / Space / PageUp PageDown move, Home End jump, F full screen, Esc leaves. #slide-N links to a slide.
   A placeholder <div data-embed="#id"> borrows that live widget from the notes while presenting. ===== */
(function () {
  var KEY = 'class-notes-present', root = document.documentElement;
  var tpl = document.getElementById('slides');
  if (!tpl) return;
  var deck, slides, cur = 0, homes = [], ui = {};
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/></svg>';
  var FULL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

  function remember(on) { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {} }
  function remembered() { try { return localStorage.getItem(KEY) === 'on'; } catch (e) { return false; } }
  function presenting() { return root.classList.contains('presenting'); }

  function btn(cls, html, label, onClick) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.innerHTML = html; b.title = label; b.setAttribute('aria-label', label);
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  function build() {
    deck = document.createElement('div');
    deck.className = 'deck'; deck.setAttribute('role', 'region'); deck.setAttribute('aria-label', 'Slides');
    var stage = document.createElement('div'); stage.className = 'deck-stage';
    stage.appendChild(tpl.content.cloneNode(true));
    slides = Array.prototype.slice.call(stage.querySelectorAll('.slide'));
    var bar = document.createElement('div'); bar.className = 'deck-bar';
    ui.prog = document.createElement('span'); ui.prog.className = 'deck-prog';
    ui.title = document.createElement('span'); ui.title.className = 'deck-title'; ui.title.textContent = tpl.getAttribute('data-title') || document.title;
    ui.prev = btn('deck-btn', '‹', 'Previous slide (←)', function () { go(cur - 1); });
    ui.count = document.createElement('span'); ui.count.className = 'deck-count'; ui.count.setAttribute('aria-live', 'polite');
    ui.next = btn('deck-btn', '›', 'Next slide (→)', function () { go(cur + 1); });
    var theme = document.querySelector('.site-nav .theme-toggle');
    bar.append(ui.prog, ui.title, ui.prev, ui.count, ui.next);
    if (document.fullscreenEnabled) bar.append(btn('deck-btn', FULL, 'Full screen (F)', fullscreen));
    if (theme) { var t = theme.cloneNode(true); t.title = 'Switch colour theme'; bar.append(t); }   // theme.js listens on every .theme-toggle
    bar.append(btn('deck-btn deck-exit', '✕ <span>Notes</span>', 'Back to the notes (Esc)', function () { leave(); }));
    deck.append(stage, bar);
    document.body.appendChild(deck);
  }

  // borrow the live widgets: a comment marks each one's place in the notes so it can go back
  function borrow() {
    deck.querySelectorAll('[data-embed]').forEach(function (ph) {
      var w = document.querySelector(ph.getAttribute('data-embed'));
      if (!w || deck.contains(w)) return;
      var mark = document.createComment('slide widget');
      w.parentNode.insertBefore(mark, w);
      homes.push([w, mark]);
      ph.appendChild(w);
    });
  }
  function giveBack() {
    homes.forEach(function (h) { h[1].parentNode.insertBefore(h[0], h[1]); h[1].remove(); });
    homes = [];
  }

  function go(i) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, k) { s.classList.toggle('on', k === cur); s.setAttribute('aria-hidden', k === cur ? 'false' : 'true'); });
    slides[cur].scrollTop = 0;
    ui.count.textContent = (cur + 1) + ' / ' + slides.length;
    ui.prog.style.width = (100 * (cur + 1) / slides.length) + '%';
    ui.prev.disabled = cur === 0; ui.next.disabled = cur === slides.length - 1;
    history.replaceState(null, '', '#slide-' + (cur + 1));
  }

  // the slide for the part of the notes being read
  function slideInView() {
    var best = null;
    document.querySelectorAll('.lab-main section[id]').forEach(function (s) { if (s.getBoundingClientRect().top < innerHeight * 0.4) best = s; });
    if (!best) return 0;
    var k = slides.findIndex(function (s) { return s.getAttribute('data-section') === '#' + best.id; });
    return k < 0 ? 0 : k;
  }

  function enter(i) {
    if (!deck) build();
    if (i == null) i = slideInView();
    borrow();
    root.classList.add('presenting');
    remember(true);
    go(i);
  }
  function leave() {
    var sec = slides[cur].getAttribute('data-section');
    if (document.fullscreenElement) document.exitFullscreen();
    giveBack();
    root.classList.remove('presenting');
    remember(false);
    history.replaceState(null, '', location.pathname + location.search);
    var el = sec && document.querySelector(sec);
    var nav = document.querySelector('.site-nav');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - (nav ? nav.offsetHeight + 12 : 0), behavior: 'instant' });
  }
  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.requestFullscreen().catch(function () {});
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
    var k = e.key;
    if (k === 'p' || k === 'P') { presenting() ? leave() : enter(); e.preventDefault(); return; }
    if (!presenting()) return;
    if ((k === ' ' || k === 'Enter') && tag === 'BUTTON') return;   // let buttons inside a slide work
    if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) go(cur + 1);
    else if (k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey)) go(cur - 1);
    else if (k === 'Home') go(0);
    else if (k === 'End') go(slides.length - 1);
    else if (k === 'f' || k === 'F') fullscreen();
    else if (k === 'Escape') leave();
    else return;
    e.preventDefault();
  });

  var theme = document.querySelector('.site-nav .theme-toggle');
  if (theme) theme.parentNode.insertBefore(btn('present-toggle', ICON, 'Presentation mode (P)', function () { enter(); }), theme);

  var m = /^#slide-(\d+)$/.exec(location.hash);
  if (m) enter(+m[1] - 1);
  else if (remembered()) enter(0);
})();
