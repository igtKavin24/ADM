import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { createRiskBadge } from '../components/riskBadge.js';
import { page, stat, text } from '../components/page.js';

export function overviewPage() {
  return page('SYSTEM OVERVIEW', async () => {
    const [forecast, vuln] = await Promise.all([api.getForecast(), api.getVulnerabilities()]);
    const ranked = vuln.vulnerabilities;
    const top = ranked[0];
    const hot = ranked.filter(r => r.risk_score >= 0.8).length;

    const root = document.createElement('div');
    const grid = document.createElement('div');
    grid.className = 'grid-4';
    const badge = document.createElement('div');
    badge.append(createRiskBadge(forecast.risk_level), text('div', forecast.horizon, 'margin-top:8px;font-size:0.8rem;color:var(--color-text-secondary)'));
    grid.append(
      createCard('NETWORK', stat(ranked.length, 'Substations')),
      createCard('SYSTEM RISK', badge),
      createCard('HIGH LOADING', stat(hot, 'Substations at ≥80% line loading')),
      createCard('TOP PRIORITY', stat(top.name, 'Highest priority score')),
    );

    const body = document.createElement('div');
    const link = document.createElement('a');
    link.href = '#investigate';
    link.className = 'btn btn-primary';
    link.style.textDecoration = 'none';
    link.textContent = 'INSPECT VULNERABILITIES';
    body.append(text('p', top.explanation, 'margin-bottom:16px;'), link);
    root.append(grid, createCard('TOP STRATEGIC VULNERABILITY', body));
    return root;
  });
}
