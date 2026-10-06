import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { createBarChart } from '../components/chart.js';
import { page, table, select, text } from '../components/page.js';
import { pct } from '../utils/format.js';

export function experimentPage() {
  return page('STRATEGY EXPERIMENT', async () => {
    const meta = await api.getExperiments();
    const names = Object.fromEntries(meta.strategies.map(s => [s.id, s.name]));
    const out = document.createElement('div');
    const budget = select(Array.from({ length: meta.max_budget }, (_, i) => [i + 1, `Budget ${i + 1}`]), meta.default_budget);

    const run = async () => {
      const r = await api.runExperiment({ budget: Number(budget.value), n_scenarios: 200 });
      const ids = Object.keys(r.results);
      out.replaceChildren(
        createCard(`LOAD SERVED (${r.n_scenarios} FAILURE SCENARIOS)`,
          createBarChart(['No intervention', ...ids.map(i => names[i])],
            [{ data: [r.baseline.avg_load_served, ...ids.map(i => r.results[i].avg_load_served)], backgroundColor: '#c9a84c' }], { y: { min: 0.5, max: 1 } })),
        createCard('RESULTS', table(['Strategy', 'Hardened', 'Load served', 'Connectivity', 'Avg. affected'],
          [['No intervention', '—', pct(r.baseline.avg_load_served), pct(r.baseline.avg_connectivity), r.baseline.avg_affected],
           ...ids.map(i => [names[i], r.results[i].protected.join(', '), pct(r.results[i].avg_load_served), pct(r.results[i].avg_connectivity), r.results[i].avg_affected])])),
      );
    };
    budget.onchange = () => run().catch(e => out.replaceChildren(text('p', e.message)));
    const root = document.createElement('div');
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.append(budget);
    root.append(controls, out, text('p', 'Scenarios: two substations fail, chosen with probability weighted by line loading. Random selection is a single seeded draw.', 'note'));
    await run();
    return root;
  });
}
