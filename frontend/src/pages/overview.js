
import { createCard } from '../components/card.js';
import { createRiskBadge } from '../components/riskBadge.js';
import { api } from '../api.js';
import { createLoader } from '../components/loader.js';

export function overviewPage() {
  const container = document.createElement('div');
  container.innerHTML = '<h1 class="cinzel" style="margin-bottom:var(--spacing-24);">SYSTEM OVERVIEW</h1>';
  
  const content = document.createElement('div');
  content.appendChild(createLoader('Analyzing Grid State...'));
  container.appendChild(content);
  
  api.getForecast().then(data => {
    content.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'grid-4';
    grid.style.marginBottom = 'var(--spacing-24)';
    
    const stat1 = document.createElement('div');
    stat1.innerHTML = `<div style="font-size:2rem; font-family:'Cinzel'; color:var(--color-text-primary);">14</div><div style="color:var(--color-text-secondary); font-size:0.8rem;">Active Nodes</div>`;
    grid.appendChild(createCard('NETWORK STATUS', stat1));
    
    const stat2 = document.createElement('div');
    stat2.appendChild(createRiskBadge(data.riskLevel));
    grid.appendChild(createCard('SYSTEM RISK', stat2));
    
    const stat3 = document.createElement('div');
    stat3.innerHTML = `<div style="font-size:2rem; font-family:'Cinzel'; color:var(--color-risk-critical);">1</div><div style="color:var(--color-text-secondary); font-size:0.8rem;">Critical Components</div>`;
    grid.appendChild(createCard('HIGH RISK', stat3));
    
    const stat4 = document.createElement('div');
    stat4.innerHTML = `<div style="font-size:1.2rem; font-family:'Cinzel'; color:var(--color-accent-gold);">Line 2</div><div style="color:var(--color-text-secondary); font-size:0.8rem;">Priority Vulnerability</div>`;
    grid.appendChild(createCard('TOP PRIORITY', stat4));
    
    content.appendChild(grid);
    
    const actionBtn = document.createElement('a');
    actionBtn.href = '#investigate';
    actionBtn.className = 'btn btn-primary';
    actionBtn.style.textDecoration = 'none';
    actionBtn.textContent = 'INSPECT VULNERABILITY';
    
    const vulnContent = document.createElement('div');
    vulnContent.innerHTML = `<p style="margin-bottom:16px;">The predictive model has identified a critical vulnerability in the network. A cascading failure is possible if Line 2 fails under current loading conditions.</p>`;
    vulnContent.appendChild(actionBtn);
    
    content.appendChild(createCard('TOP STRATEGIC VULNERABILITY', vulnContent));
  });
  
  return container;
}
