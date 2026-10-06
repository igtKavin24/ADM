import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { page, select, button, stat, text, table } from '../components/page.js';
import { pct } from '../utils/format.js';

export function intervenePage() {
  return page('STRATEGIC INTERVENTION', async () => {
    const data = await api.getInterventions();
    const out = document.createElement('div');
    const boxes = [];
    const list = document.createElement('div');
    data.candidates.forEach(c => {
      const label = document.createElement('label');
      label.style.cssText = 'display:block;padding:4px 0;cursor:pointer';
      const cb = Object.assign(document.createElement('input'), { type: 'checkbox', value: c.id });
      boxes.push(cb);
      label.append(cb, ` ${c.name} — priority ${c.priority_score} (cost ${c.cost})`);
      list.appendChild(label);
    });
    const budget = select(Array.from({ length: data.max_budget }, (_, i) => [i + 1, `Budget ${i + 1}`]), data.default_budget);

    const summary = r => {
      const grid = document.createElement('div');
      grid.className = 'grid-3';
      grid.append(
        createCard('LOAD SERVED GAIN', stat(`+${pct(r.load_served_gain)}`, `${pct(r.baseline.avg_load_served)} → ${pct(r.outcome.avg_load_served)}`)),
        createCard('AFFECTED SUBSTATIONS', stat(`-${r.affected_reduction}`, `${r.baseline.avg_affected} → ${r.outcome.avg_affected} per event`)),
        createCard('COST', stat(r.total_cost, 'Substations hardened')),
      );
      return grid;
    };
    const show = fn => async () => { try { out.replaceChildren(await fn()); } catch (e) { out.replaceChildren(text('p', e.message)); } };

    const evaluate = show(async () => {
      const ids = boxes.filter(b => b.checked).map(b => Number(b.value));
      if (!ids.length) throw new Error('Select at least one intervention.');
      return summary(await api.evaluateInterventions(ids));
    });
    const recommend = show(async () => {
      const r = await api.optimizeInterventions(Number(budget.value));
      const div = document.createElement('div');
      div.append(text('p', `Recommended: ${r.system_recommendation.map(c => c.name).join(', ')}`, 'margin-bottom:12px'), summary(r.system));
      return div;
    });

    const root = document.createElement('div');
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.append(button('EVALUATE SELECTION', evaluate), budget, button('RECOMMEND', recommend, false));
    root.append(createCard('CANDIDATE INTERVENTIONS', list), controls, out,
      text('p', 'Hardened substations are assumed to survive a failure event. Effects are averaged over simulated risk-weighted double failures.', 'note'));
    return root;
  });
}
