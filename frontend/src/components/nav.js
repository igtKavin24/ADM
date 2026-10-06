
export function createNav(currentHash) {
  const nav = document.createElement('nav');
  nav.className = 'sidebar';
  nav.style.padding = 'var(--spacing-24) 0';
  
  const logo = document.createElement('div');
  logo.style.padding = '0 var(--spacing-24) var(--spacing-32)';
  logo.innerHTML = '<h2 class="cinzel" style="color:var(--color-accent-gold); letter-spacing: 2px;">JARASANDHA</h2><div style="font-size:0.7rem; color:var(--color-text-dim); text-transform:uppercase;">Resilience Engine</div>';
  nav.appendChild(logo);

  const steps = [
    { id: '#overview', name: 'OVERVIEW', num: '01' },
    { id: '#forecast', name: 'FORECAST', num: '02' },
    { id: '#network', name: 'NETWORK', num: '03' },
    { id: '#investigate', name: 'INVESTIGATE', num: '04' },
    { id: '#whatif', name: 'WHAT-IF', num: '05' },
    { id: '#intervene', name: 'INTERVENE', num: '06' },
    { id: '#compare', name: 'COMPARE', num: '07' },
    { id: '#experiment', name: 'EXPERIMENT', num: '08' }
  ];

  const ul = document.createElement('ul');
  ul.style.listStyle = 'none';
  ul.style.flex = '1';
  
  steps.forEach(step => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = step.id;
    a.style.display = 'flex';
    a.style.alignItems = 'center';
    a.style.padding = 'var(--spacing-12) var(--spacing-24)';
    a.style.color = currentHash === step.id ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)';
    a.style.textDecoration = 'none';
    a.style.fontSize = '0.9rem';
    a.style.fontFamily = 'Cinzel, serif';
    a.style.fontWeight = '600';
    a.style.borderLeft = currentHash === step.id ? '3px solid var(--color-accent-gold)' : '3px solid transparent';
    if(currentHash === step.id) a.style.background = 'rgba(201, 168, 76, 0.05)';
    
    a.innerHTML = `<span style="opacity:0.5; margin-right:var(--spacing-12); font-size:0.75rem;">${step.num}</span> ${step.name}`;
    li.appendChild(a);
    ul.appendChild(li);
  });
  nav.appendChild(ul);
  
  const bottomLinks = document.createElement('div');
  bottomLinks.style.padding = 'var(--spacing-24)';
  bottomLinks.style.borderTop = '1px solid var(--color-border)';
  bottomLinks.innerHTML = `
    <a href="#methodology" style="display:block; color:var(--color-text-dim); text-decoration:none; font-size:0.8rem; margin-bottom:8px;">METHODOLOGY</a>
    <a href="#howitworks" style="display:block; color:var(--color-text-dim); text-decoration:none; font-size:0.8rem;">HOW IT WORKS</a>
  `;
  nav.appendChild(bottomLinks);
  
  return nav;
}
