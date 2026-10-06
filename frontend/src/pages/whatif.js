import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { page, select, button, stat, text } from '../components/page.js';
import { pct } from '../utils/format.js';

export function whatIfPage() {
  return page('WHAT-IF OUTAGE SIMULATION', async () => {
    const net = await api.getNetwork();
    const opts = { node: net.nodes.map(n => [n.id, n.name]), edge: net.edges.map(e => [e.id, `Line ${e.id} (${e.source} → ${e.target})`]) };
    const kind = select([['node', 'Substation'], ['edge', 'Transmission line']]);
    const target = select(opts.node);
    kind.onchange = () => target.replaceChildren(...opts[kind.value].map(([v, l]) => new Option(l, v)));
    const out = document.createElement('div');

    const run = async () => {
      try {
        const r = await api.simulateOutage({ type: kind.value, id: Number(target.value) });
        const grid = document.createElement('div');
        grid.className = 'grid-4';
        grid.append(
          createCard('LOAD LOST', stat(`${r.load_lost_mw} MW`, 'Unserved load')),
          createCard('GENERATION LOST', stat(`${r.gen_lost_mw} MW`, 'Capacity removed')),
          createCard('LOAD SERVED', stat(pct(r.load_served_fraction), 'Of total demand')),
          createCard('ISLANDS', stat(`${r.components_before} → ${r.components_after}`, 'Connected components')),
        );
        out.replaceChildren(grid, text('p', `Affected substations: ${r.affected_nodes.length ? r.affected_nodes.join(', ') : 'none'}`),
          text('p', r.terminology_note, 'note'));
      } catch (e) { out.replaceChildren(text('p', e.message)); }
    };

    const root = document.createElement('div');
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.append(kind, target, button('SIMULATE FAILURE', run));
    root.append(controls, out);
    return root;
  });
}
