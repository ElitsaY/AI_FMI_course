/* ===== colour theme: follows the OS; the sun/moon button overrides it and is remembered ===== */
(function () {
  var KEY = 'class-notes-theme', root = document.documentElement;
  try { var saved = localStorage.getItem(KEY); if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved); } catch (e) {}
  function current() { return root.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function label() {
    var l = current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    document.querySelectorAll('.theme-toggle').forEach(function (b) { b.setAttribute('aria-label', l); b.title = l; });
  }
  // delegated, so the button works before slow CDN scripts (KaTeX) let DOMContentLoaded fire
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.theme-toggle')) return;
    var next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch (e2) {}
    label();
  });
  document.addEventListener('DOMContentLoaded', label);
})();
