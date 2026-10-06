
export function createCard(title, contentEl, options = {}) {
  const card = document.createElement('div');
  card.className = `card ${options.className || ''}`;
  
  const header = document.createElement('div');
  header.className = 'card-header';
  
  const titleEl = document.createElement('span');
  titleEl.textContent = title;
  header.appendChild(titleEl);
  
  if (options.headerRight) {
    header.appendChild(options.headerRight);
  }
  card.appendChild(header);
  
  const body = document.createElement('div');
  body.className = 'card-body';
  body.appendChild(contentEl);
  card.appendChild(body);
  
  if (options.footer) {
    const footer = document.createElement('div');
    footer.style.borderTop = '1px solid var(--color-border)';
    footer.style.marginTop = 'var(--spacing-16)';
    footer.style.paddingTop = 'var(--spacing-8)';
    footer.appendChild(options.footer);
    card.appendChild(footer);
  }
  return card;
}
