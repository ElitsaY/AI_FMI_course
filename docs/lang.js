/* ===== language switcher: globe button opens an EN / BG menu; the choice is remembered ===== */
(function () {
  var KEY = 'class-notes-lang', root = document.documentElement, lang = 'en';
  try { var saved = localStorage.getItem(KEY); if (saved === 'en' || saved === 'bg') lang = saved; } catch (e) {}
  root.setAttribute('lang', lang);

  function menu() { return document.querySelector('.lang-menu'); }
  function button() { return document.querySelector('.lang-toggle'); }
  function setOpen(open) {
    var m = menu(), b = button();
    if (!m || !b) return;
    m.hidden = !open;
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function mark() {
    document.querySelectorAll('.lang-menu [data-lang]').forEach(function (o) {
      o.setAttribute('aria-selected', o.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }
  function choose(next) {
    lang = next;
    root.setAttribute('lang', lang);
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    mark();
    // translation hook for later: listen for this event to swap the page text
    document.dispatchEvent(new CustomEvent('class-notes-lang', { detail: lang }));
  }

  // delegated, like theme.js, so it works even before slow CDN scripts finish loading
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentNode;
    var opt = t.closest('.lang-menu [data-lang]');
    if (opt) { choose(opt.getAttribute('data-lang')); setOpen(false); return; }
    if (t.closest('.lang-toggle')) { var m = menu(); setOpen(m ? m.hidden : false); return; }
    setOpen(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('DOMContentLoaded', mark);
})();