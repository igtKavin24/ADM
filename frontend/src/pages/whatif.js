import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { page, select, button, stat, text } from '../components/page.js';
import { pct, num } from '../utils/format.js';
import { state } from '../state.js';

export function whatIfPage() {
  return page(
    'What-if outage',
    async () => {
      const net = await api.getNetwork();

      const opts = {
        node: net.nodes.map(n => [n.id, `${n.name} (${n.type} substation)`]),
        edge: net.edges.map(e => [e.id, `Line ${e.id} (Sub_${e.source} ↔ Sub_${e.target})`])
      };

      const kind = select([['node', 'Substation (Node)'], ['edge', 'Transmission Line (Edge)']]);
      const target = select(opts.node);

      // Pre-select component if one was clicked on network or investigate page
      if (state.getSelectedComponentId() !== null) {
        target.value = state.getSelectedComponentId();
      }

      kind.onchange = () => {
        target.replaceChildren(...opts[kind.value].map(([v, l]) => new Option(l, v)));
      };

      const out = document.createElement('div');
      const root = document.createElement('div');

      const run = async () => {
        out.replaceChildren(text('p', 'Simulating graph modification...', 'color:var(--color-text-secondary);'));
        try {
          const r = await api.simulateOutage({ type: kind.value, id: Number(target.value) });
          const compName = kind.value === 'node'
            ? net.nodes.find(n => n.id === Number(target.value))?.name
            : `Line ${target.value}`;

          const resultContainer = document.createElement('div');

          // Structural simulation explicit disclaimer banner
          const disclaimer = document.createElement('div');
          disclaimer.className = 'assumption-notice';
          disclaimer.innerHTML = `
            <strong>Structural simulation only:</strong> This test evaluates topological graph connectivity and estimates static load associated with disconnected components. It does <em>not</em> run an AC/DC electrical power flow solver or simulate frequency/voltage transients.
          `;
          resultContainer.appendChild(disclaimer);

          // KPI Cards
          const grid = document.createElement('div');
          grid.className = 'grid-4';
          grid.append(
            createCard(
              'ESTIMATED LOAD LOST',
              stat(
                `${num(r.load_lost_mw, 1)} MW`,
                'Static load disconnected',
                `Of total demand (${( (1 - r.load_served_fraction) * 100 ).toFixed(1)}%)`
              )
            ),
            createCard(
              'GENERATION REMOVED',
              stat(
                `${num(r.gen_lost_mw, 1)} MW`,
                'Capacity at failed node',
                'Installed capacity removed'
              )
            ),
            createCard(
              'STATIC LOAD SERVED',
              stat(
                pct(r.load_served_fraction, 1),
                'Estimated load preserved',
                'Under structural assumptions'
              )
            ),
            createCard(
              'GRAPH ISLANDS',
              stat(
                `${r.components_before} → ${r.components_after}`,
                'Connected components',
                r.connectivity_change > 0 ? `+${r.connectivity_change} split island(s)` : 'Network remains single island'
              )
            )
          );
          resultContainer.appendChild(grid);

          // Consequence Narrative
          const summaryCard = createCard(
            `CONSEQUENCE ANALYSIS: OUTAGE OF ${compName.toUpperCase()}`,
            text(
              'div',
              `
                <p style="font-size:0.92rem; line-height:1.6; margin-bottom:10px;">
                  Simulating the outage of <strong>${compName}</strong> changes the number of connected components from ${r.components_before} to ${r.components_after}.
                  ${r.affected_nodes.length ? `Affected/disconnected substations: <strong>${r.affected_nodes.map(id => `Sub_${id}`).join(', ')}</strong>.` : 'No additional downstream substations were disconnected.'}
                </p>
                <p style="font-size:0.84rem; color:var(--color-text-secondary); line-height:1.5;">
                  The largest surviving connected component contains <strong>${pct(r.largest_component_fraction, 1)}</strong> of the network substations. Static unserved load is calculated at failed nodes and in generator-less islands.
                </p>
              `
            )
          );
          resultContainer.appendChild(summaryCard);

          out.replaceChildren(resultContainer);
        } catch (e) {
          out.replaceChildren(text('p', `Simulation Error: ${e.message}`, 'color:var(--color-risk-critical);'));
        }
      };

      const resetBaseline = () => {
        out.replaceChildren();
      };

      const controls = document.createElement('div');
      controls.className = 'controls';
      controls.append(
        text('label', 'Outage Component Type:', 'font-size:0.86rem; color:var(--color-text-secondary);'),
        kind,
        text('label', 'Select Component:', 'font-size:0.86rem; color:var(--color-text-secondary);'),
        target,
        button('Run structural scenario', run),
        button('Reset scenario', resetBaseline, false)
      );

      root.append(controls, out);

      // Run initial scenario for immediate reviewer clarity
      run();

      return root;
    },
    {
      subtitle: 'Temporarily remove one component in a structural graph scenario and review the resulting connectivity changes.',
      actionHint: 'Choose a substation or transmission line, run the structural scenario, and inspect the resulting islanding and static load impact.',
      nextStep: {
        title: 'Plan Hardening Interventions',
        description: 'Under a fixed simulation budget, choose or automatically suggest which substations to harden to prevent disconnects.',
        linkText: 'Open Intervention Planner →',
        linkHref: '#intervene'
      }
    }
  );
}
