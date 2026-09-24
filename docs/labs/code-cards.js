/* ===== Shared: editor-style code cards (Python highlighting, line numbers, copy) ===== */

const PY_KEYWORDS = new Set(['def', 'return', 'for', 'in', 'if', 'elif', 'else', 'import', 'as', 'from', 'while', 'not', 'and', 'or', 'None', 'True', 'False', 'lambda', 'class', 'with', 'yield', 'break', 'continue', 'pass']);
const PY_BUILTINS = new Set(['print', 'len', 'range', 'sum', 'min', 'max', 'sorted', 'list', 'dict', 'set', 'int', 'float', 'str', 'enumerate', 'zip']);
const escapeHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function highlightPython(line) {
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b/g;
  let out = '', last = 0, m;
  while ((m = re.exec(line))) {
    out += escapeHtml(line.slice(last, m.index));
    const [tok, com, str, num, word] = m;
    if (com) out += `<span class="tok-com">${escapeHtml(com)}</span>`;
    else if (str) out += `<span class="tok-str">${escapeHtml(str)}</span>`;
    else if (num) out += `<span class="tok-num">${num}</span>`;
    else if (PY_KEYWORDS.has(word)) out += `<span class="tok-kw">${word}</span>`;
    else if (PY_BUILTINS.has(word)) out += `<span class="tok-bi">${word}</span>`;
    else if (line[re.lastIndex] === '(' || /\bdef\s+$/.test(line.slice(0, m.index))) out += `<span class="tok-fn">${word}</span>`;
    else out += escapeHtml(tok);
    last = re.lastIndex;
  }
  return out + escapeHtml(line.slice(last));
}

function initCodeCards() {
  document.querySelectorAll('.code-card').forEach(card => {
    const code = card.querySelector('code');
    const source = code.textContent;
    code.innerHTML = source.split('\n').map(l => `<span class="ln">${highlightPython(l) || ' '}</span>`).join('');
    const btn = card.querySelector('.code-copy');
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); // keep the <details> open
      try {
        await navigator.clipboard.writeText(source);
        btn.textContent = 'Copied ✓';
      } catch {
        btn.textContent = 'Copy failed';
      }
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
  });
}

document.addEventListener('DOMContentLoaded', initCodeCards);
