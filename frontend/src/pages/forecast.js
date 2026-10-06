import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { createRiskBadge } from '../components/riskBadge.js';
import { createBarChart } from '../components/chart.js';
import { page, stat, table, button, text } from '../components/page.js';
import { pct, num } from '../utils/format.js';

const CLASS_NAMES = ['STABLE', 'WATCH', 'HIGH_RISK', 'CRITICAL'];

export function forecastPage() {
  return page('FAILURE-RISK FORECAST', async () => {
    const root = document.createElement('div');
    const result = document.createElement('div');
    const input = Object.assign(document.createElement('input'), { type: 'number', min: 0, max: 4999, className: 'input' });
    const show = f => {
      const probs = CLASS_NAMES.map((_, i) => f.probabilities[i] ?? 0);
      const head = document.createElement('div');
      head.className = 'controls';
      head.append(createRiskBadge(f.risk_level), text('span', f.horizon),
        text('span', `Dataset label: ${f.actual_risk_level.replace('_', ' ')}`, 'color:var(--color-text-dim)'));
      const grid = document.createElement('div');
      grid.className = 'grid-2';
      grid.append(
        createCard('CLASS PROBABILITIES', createBarChart(CLASS_NAMES.map(c => c.replace('_', ' ')), [{ data: probs, backgroundColor: '#c9a84c' }], { y: { max: 1 } })),
        createCard('TOP DRIVERS (SHAP)', table(['Feature', 'Contribution'], f.top_contributions.map(c => [c.feature, num(c.score, 3)]))),
        createCard('GRID STATE', table(['Measure', 'Value'], [
          ['Max line loading', pct(f.features.max_rho, 0)], ['Overloaded lines', f.features.n_overloaded],
          ['Disconnected lines', f.features.n_disconnected], ['Generation / load (MW)', `${num(f.features.total_gen, 1)} / ${num(f.features.total_load, 1)}`]])),
        createCard('MOST STRESSED SUBSTATIONS', table(['Substation', 'Risk'], f.vulnerable_components.map(c => [c.name, pct(c.risk_score, 0)]))),
      );
      result.replaceChildren(head, grid);
    };
    const load = id => api.getForecastById(id).then(show).catch(e => result.replaceChildren(text('p', e.message)));

    const first = await api.getForecast();
    input.value = first.state_id;
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.append(text('label', 'Grid state #'), input, button('LOAD STATE', () => load(input.value)));
    root.append(controls, result, text('p', 'Each state is a real row of the synthetic dataset (0–4999).', 'note'));
    show(first);
    return root;
  });
}
