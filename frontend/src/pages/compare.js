import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { createBarChart } from '../components/chart.js';
import { page, table, text } from '../components/page.js';
import { pct } from '../utils/format.js';

export function comparePage() {
  return page('SYSTEM VS BASELINE', async () => {
    const r = await api.optimizeInterventions(2);
    const rows = [['No intervention', [], r.system.baseline], [r.baseline_name, r.baseline.selected, r.baseline.outcome], ['JARASANDHA priority', r.system.selected, r.system.outcome]];
    const root = document.createElement('div');
    root.append(
      createCard(`LOAD SERVED UNDER FAILURE (BUDGET ${r.budget})`,
        createBarChart(rows.map(x => x[0]), [{ data: rows.map(x => x[2].avg_load_served), backgroundColor: ['#6b5f52', '#a67c52', '#c9a84c'] }], { y: { min: 0.5, max: 1 } })),
      createCard('DETAIL', table(['Strategy', 'Hardened', 'Load served', 'Avg. affected'],
        rows.map(x => [x[0], x[1].join(', ') || '—', pct(x[2].avg_load_served), x[2].avg_affected]))),
      text('p', `Advantage over baseline: ${r.advantage_percent} percentage points of load served.`, 'margin-top:8px'),
    );
    return root;
  });
}
