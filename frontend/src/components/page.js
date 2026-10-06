import { createLoader, createErrorState } from './loader.js';

// Page shell: title + loader, then swaps in whatever `build()` resolves to (or an error with retry).
export function page(title, build) {
  const root = document.createElement('div');
  const h = document.createElement('h1');
  h.className = 'cinzel';
  h.style.marginBottom = 'var(--spacing-24)';
  h.textContent = title;
  const body = document.createElement('div');
  root.append(h, body);
  const run = () => {
    body.replaceChildren(createLoader());
    Promise.resolve().then(build)
      .then(node => body.replaceChildren(node))
      .catch(e => body.replaceChildren(createErrorState(e.message, run)));
  };
  run();
  return root;
}

export function stat(value, label) {
  const d = document.createElement('div');
  const v = document.createElement('div');
  v.className = 'stat-value';
  v.textContent = value;
  const l = document.createElement('div');
  l.className = 'stat-label';
  l.textContent = label;
  d.append(v, l);
  return d;
}

export function text(tag, str, style = '') {
  const e = document.createElement(tag);
  e.textContent = str;
  e.style.cssText = style;
  return e;
}

export function table(headers, rows, onRowClick) {
  const t = document.createElement('table');
  t.className = 'data-table';
  const head = t.createTHead().insertRow();
  headers.forEach(h => head.appendChild(text('th', h)));
  const tbody = t.createTBody();
  rows.forEach((r, i) => {
    const tr = tbody.insertRow();
    r.forEach(c => { const td = tr.insertCell(); c instanceof Node ? td.appendChild(c) : (td.textContent = c); });
    if (onRowClick) { tr.style.cursor = 'pointer'; tr.onclick = () => onRowClick(i); }
  });
  return t;
}

export function select(options, value) {
  const s = document.createElement('select');
  s.className = 'input';
  options.forEach(([val, label]) => s.appendChild(new Option(label, val)));
  if (value !== undefined) s.value = value;
  return s;
}

export function button(label, onClick, primary = true) {
  const b = document.createElement('button');
  b.className = `btn ${primary ? 'btn-primary' : 'btn-secondary'}`;
  b.textContent = label;
  b.onclick = onClick;
  return b;
}
