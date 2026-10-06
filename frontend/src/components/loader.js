
export function createLoader(message = 'Loading...') {
  const el = document.createElement('div');
  el.className = 'loading-container';
  el.innerHTML = `<div class="spinner"></div><div style="color:var(--color-text-secondary); font-size:0.9rem;">${message}</div>`;
  return el;
}
export function createErrorState(message, retryFn) {
  const el = document.createElement('div');
  el.className = 'loading-container';
  el.style.color = 'var(--color-risk-critical)';
  el.innerHTML = `<div style="margin-bottom:var(--spacing-8);">⚠️ ${message}</div>`;
  if (retryFn) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.textContent = 'RETRY';
    btn.onclick = retryFn;
    el.appendChild(btn);
  }
  return el;
}
