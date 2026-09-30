/* ===== Lab 00 interactivity ===== */

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
  if (parent) parent.appendChild(e);
  return e;
}
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/* ---------- hero: a faint network of nodes, one motif per part of the course ---------- */
function initHero() {
  const svg = document.getElementById('in-hero-bg'), r = rng(7), pts = [];
  for (let i = 0; i < 26; i++) pts.push([30 + (i % 13) * 90 + r() * 50, 40 + Math.floor(i / 13) * 150 + r() * 90, i % 4]);
  pts.forEach(([x, y], i) => pts.forEach(([u, v], j) => {
    if (j > i && Math.hypot(u - x, v - y) < 150) el('line', { x1: x.toFixed(0), y1: y.toFixed(0), x2: u.toFixed(0), y2: v.toFixed(0), class: 'lk' }, svg);
  }));
  pts.forEach(([x, y, c]) => el('circle', { cx: x.toFixed(0), cy: y.toFixed(0), r: 7 + (c % 2) * 4, class: 'nd c' + c }, svg));
}

document.addEventListener('DOMContentLoaded', () => {
  initHero();
});
