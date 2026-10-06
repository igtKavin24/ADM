
import { createNetworkGraph } from '../components/networkGraph.js';
import { api } from '../api.js';
import { createLoader } from '../components/loader.js';
import { createCard } from '../components/card.js';

export function networkPage() {
  const container = document.createElement('div');
  container.style.height = 'calc(100vh - 64px)';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  
  container.innerHTML = '<h1 class="cinzel" style="margin-bottom:var(--spacing-16);">NETWORK TOPOLOGY</h1>';
  
  const graphContainer = document.createElement('div');
  graphContainer.style.flex = '1';
  graphContainer.style.position = 'relative';
  graphContainer.style.background = 'var(--color-bg-card)';
  graphContainer.style.border = '1px solid var(--color-border)';
  graphContainer.style.borderRadius = 'var(--radius-card)';
  
  graphContainer.appendChild(createLoader('Initializing Graph...'));
  container.appendChild(graphContainer);
  
  api.getNetwork().then(data => {
    createNetworkGraph(data, graphContainer, {
      width: graphContainer.clientWidth || 800,
      height: graphContainer.clientHeight || 600,
      onClick: (n) => console.log('Node clicked', n)
    });
  });
  
  return container;
}
