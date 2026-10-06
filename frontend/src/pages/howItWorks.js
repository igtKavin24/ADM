import { createCard } from '../components/card.js';
import { text } from '../components/page.js';

const STEPS = [
  ['1 · FORECAST', 'A gradient-boosting model reads the grid state (line loadings, overloads, disconnections) and predicts the risk class and time-to-failure horizon.'],
  ['2 · UNDERSTAND CONSEQUENCE', 'Graph analysis (betweenness, articulation points) and structural outage simulation show what is lost when a substation or line fails.'],
  ['3 · PRIORITIZE', 'Each substation gets a weighted score from its line loading, centrality, lack of redundancy and load/generation share.'],
  ['4 · INTERVENE', 'With a limited budget, the highest-priority substations are hardened; the effect is measured over simulated failure scenarios and compared with simpler strategies.'],
];

export function howItWorksPage() {
  const root = document.createElement('div');
  root.appendChild(text('h1', 'HOW IT WORKS', 'font-family:Cinzel,serif;margin-bottom:24px'));
  STEPS.forEach(([t, d]) => root.appendChild(createCard(t, text('p', d))));
  root.appendChild(text('a', '← Back to start', 'color:var(--color-accent-gold)')).href = '#landing';
  return root;
}
