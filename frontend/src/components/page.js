import { createLoader, createErrorState } from './loader.js';
import { state } from '../state.js';

/**
 * Standard Page Shell Helper
 * Creates a cohesive screen with:
 * - Page title & plain-English subtitle
 * - "What to do here" action instruction
 * - Persistent scientific benchmark notice
 * - Shared benchmark case selector (optional per page)
 * - Next-step footer link
 */
export function page(title, build, options = {}) {
  const root = document.createElement('div');
  root.className = 'page-container';

  // Page Header
  const header = document.createElement('div');
  header.className = 'page-header';

  const h = document.createElement('h1');
  h.textContent = title;
  header.appendChild(h);

  if (options.subtitle) {
    const sub = document.createElement('div');
    sub.className = 'page-subtitle';
    sub.textContent = options.subtitle;
    header.appendChild(sub);
  }

  if (options.actionHint) {
    const hint = document.createElement('div');
    hint.className = 'page-action-hint';
    hint.innerHTML = `<span>🎯</span> <strong>What to do here:</strong> ${options.actionHint}`;
    header.appendChild(hint);
  }

  root.appendChild(header);

  // Persistent scientific benchmark caveat (unless suppressed on landing/meta)
  if (!options.hideCaveat) {
    const caveat = document.createElement('div');
    caveat.className = 'scientific-caveat-banner';
    caveat.innerHTML = `
      <div class="caveat-icon">ⓘ</div>
      <div class="caveat-text">
        <strong>Synthetic IEEE 14-bus Benchmark:</strong>
        This engine evaluates synthetic cases and structural network models. It is not connected to a live operational utility grid and does not run an electrical AC power-flow solver.
        <a href="#methodology">View methodology & limitations →</a>
      </div>
    `;
    root.appendChild(caveat);
  }

  // Case selector bar (if requested for case-dependent pages)
  if (options.showCaseSelector) {
    const caseBar = createCaseSelectorBar(options.onCaseChange);
    root.appendChild(caseBar);
  }

  // Page Content Body with async loading and retry
  const body = document.createElement('div');
  body.className = 'page-body';
  root.appendChild(body);

  const run = () => {
    body.replaceChildren(createLoader('Loading simulation state...'));
    Promise.resolve()
      .then(build)
      .then(node => {
        body.replaceChildren(node);
        // If a next-step config is provided, attach it at the bottom
        if (options.nextStep) {
          const nextStrip = createNextStepStrip(options.nextStep);
          body.appendChild(nextStrip);
        }
      })
      .catch(e => {
        body.replaceChildren(createErrorState(e.message || 'Failed to load page content.', run));
      });
  };

  run();

  // If case change triggers rebuild, register listener
  if (options.rebuildOnCaseChange) {
    const unsubscribe = state.subscribe(() => {
      // Re-run if container is still in DOM
      if (document.body.contains(root)) {
        run();
      } else {
        unsubscribe();
      }
    });
  }

  return root;
}

/**
 * Shared Benchmark Case Selection Strip
 */
export function createCaseSelectorBar(onChangeCallback) {
  const bar = document.createElement('div');
  bar.className = 'case-selector-bar';

  const info = document.createElement('div');
  info.className = 'case-info';
  info.innerHTML = `
    <div>
      <span class="case-info-label">Active Synthetic Case:</span>
      <span class="case-info-val" id="active-case-val">#${state.getCaseId()}</span>
    </div>
    <div style="font-size:0.78rem; color:var(--color-text-muted);">
      (Range: ${state.validRange[0]}–${state.validRange[1]})
    </div>
  `;
  bar.appendChild(info);

  const controls = document.createElement('div');
  controls.className = 'case-controls';

  const input = document.createElement('input');
  input.type = 'number';
  input.min = state.validRange[0];
  input.max = state.validRange[1];
  input.value = state.getCaseId();
  input.className = 'input';
  input.style.width = '100px';
  input.setAttribute('aria-label', 'Benchmark Case Number');

  const btnApply = document.createElement('button');
  btnApply.className = 'btn btn-primary btn-sm';
  btnApply.textContent = 'Apply Case';

  const btnReset = document.createElement('button');
  btnReset.className = 'btn btn-secondary btn-sm';
  btnReset.textContent = 'Reset Demo';

  const applyChange = (val) => {
    try {
      const newId = state.setCaseId(val);
      const valEl = bar.querySelector('#active-case-val');
      if (valEl) valEl.textContent = `#${newId}`;
      input.value = newId;
      if (onChangeCallback) onChangeCallback(newId);
    } catch (err) {
      alert(err.message);
      input.value = state.getCaseId();
    }
  };

  btnApply.onclick = () => applyChange(input.value);
  input.onkeydown = (e) => {
    if (e.key === 'Enter') applyChange(input.value);
  };
  btnReset.onclick = () => {
    state.resetToDefaultCase();
    input.value = state.getCaseId();
    const valEl = bar.querySelector('#active-case-val');
    if (valEl) valEl.textContent = `#${state.getCaseId()}`;
    if (onChangeCallback) onChangeCallback(state.getCaseId());
  };

  controls.append(input, btnApply, btnReset);
  bar.appendChild(controls);

  return bar;
}

/**
 * Natural Next Step Strip
 */
export function createNextStepStrip({ title, description, linkText, linkHref }) {
  const strip = document.createElement('div');
  strip.className = 'next-step-strip';
  strip.innerHTML = `
    <div class="next-step-desc">
      <strong>Next Recommended Action:</strong> ${description || title}
    </div>
    <a href="${linkHref}" class="btn btn-primary" style="text-decoration:none;">
      ${linkText || 'Proceed →'}
    </a>
  `;
  return strip;
}

/**
 * Progressive Disclosure Helper
 */
export function createDisclosure(title, contentElOrText) {
  const box = document.createElement('details');
  box.className = 'disclosure-box';

  const summary = document.createElement('summary');
  summary.className = 'disclosure-summary';
  summary.innerHTML = `<span>${title}</span> <span style="font-size:0.75rem;opacity:0.7;">▾</span>`;
  box.appendChild(summary);

  const content = document.createElement('div');
  content.className = 'disclosure-content';
  if (typeof contentElOrText === 'string') {
    content.innerHTML = contentElOrText;
  } else {
    content.appendChild(contentElOrText);
  }
  box.appendChild(content);

  return box;
}

export function stat(value, label, hint = '') {
  const d = document.createElement('div');
  const v = document.createElement('div');
  v.className = 'stat-value';
  v.textContent = value;
  const l = document.createElement('div');
  l.className = 'stat-label';
  l.textContent = label;
  d.append(v, l);
  if (hint) {
    const h = document.createElement('div');
    h.className = 'stat-hint';
    h.textContent = hint;
    d.append(h);
  }
  return d;
}

export function text(tag, str, style = '') {
  const e = document.createElement(tag);
  e.textContent = str;
  if (style) e.style.cssText = style;
  return e;
}

export function table(headers, rows, onRowClick) {
  const wrap = document.createElement('div');
  wrap.className = 'table-wrapper';
  const t = document.createElement('table');
  t.className = 'data-table';
  const head = t.createTHead().insertRow();
  headers.forEach(h => head.appendChild(text('th', h)));
  const tbody = t.createTBody();
  rows.forEach((r, i) => {
    const tr = tbody.insertRow();
    tr.tabIndex = 0; // Accessible keyboard focus
    r.forEach(c => {
      const td = tr.insertCell();
      c instanceof Node ? td.appendChild(c) : (td.textContent = c);
    });
    if (onRowClick) {
      tr.style.cursor = 'pointer';
      tr.onclick = () => {
        tbody.querySelectorAll('tr').forEach(node => node.classList.remove('selected'));
        tr.classList.add('selected');
        onRowClick(i);
      };
      tr.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tr.click();
        }
      };
    }
  });
  wrap.appendChild(t);
  return wrap;
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
