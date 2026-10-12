import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { createBarChart } from '../components/chart.js';
import { page, table, select, text, createDisclosure } from '../components/page.js';
import { pct, num } from '../utils/format.js';

export function comparePage() {
  return page(
    'Strategy comparison',
    async () => {
      const budgetOptions = [
        [1, 'Budget 1 Substation'],
        [2, 'Budget 2 Substations (Default)'],
        [3, 'Budget 3 Substations'],
        [4, 'Budget 4 Substations'],
        [5, 'Budget 5 Substations']
      ];

      const budgetSelect = select(budgetOptions, 2);
      const out = document.createElement('div');
      const root = document.createElement('div');

      const renderComparison = async () => {
        out.replaceChildren(text('p', 'Simulating scenario comparison...', 'color:var(--color-text-secondary);'));
        try {
          const budgetVal = Number(budgetSelect.value);
          const r = await api.optimizeInterventions(budgetVal);

          const rows = [
            ['No intervention (Do nothing)', [], r.system.baseline],
            [`Baseline: ${r.baseline_name}`, r.baseline.selected, r.baseline.outcome],
            ['JARASANDHA combined heuristic', r.system.selected, r.system.outcome]
          ];

          const container = document.createElement('div');

          // Simulation assumptions disclosure
          const notice = document.createElement('div');
          notice.className = 'assumption-notice';
          notice.innerHTML = `
            <strong>Identical scenario conditions:</strong> All three options are evaluated over the exact same <strong>200 synthetic double-substation failure scenarios</strong> under a protection budget of <strong>${r.budget} substation(s)</strong>.
          `;
          container.appendChild(notice);

          // Bar Chart with 0-based scale for scientific honesty
          const chartData = rows.map(x => x[2].avg_load_served);
          const chartCard = createCard(
            `AVERAGE SIMULATED STATIC LOAD SERVED (BUDGET ${r.budget})`,
            createBarChart(
              rows.map(x => x[0]),
              [{
                label: 'Simulated Static Load Served',
                data: chartData,
                backgroundColor: ['#6b5f52', '#a67c52', '#c9a84c']
              }],
              { y: { min: 0, max: 1 } } // Explicitly starts at zero to avoid visual exaggeration
            ),
            {
              footer: text(
                'div',
                'Chart axis starts at 0.0 to prevent visual exaggeration of fractional differences.',
                'font-size:0.76rem; color:var(--color-text-muted);'
              )
            }
          );
          container.appendChild(chartCard);

          // Detailed Comparison Table
          const tableCard = createCard(
            'COMPARATIVE EVIDENCE & OUTCOMES',
            table(
              ['Strategy Name', 'Hardened Substations', 'Avg. Static Load Served', 'Avg. Affected Substations'],
              rows.map(x => [
                x[0],
                x[1].map(id => `Sub_${id}`).join(', ') || 'None (0)',
                pct(x[2].avg_load_served, 1),
                `${num(x[2].avg_affected, 2)} buses`
              ])
            )
          );
          container.appendChild(tableCard);

          // Neutral conclusion banner
          const diffPP = ( (r.system.outcome.avg_load_served - r.baseline.outcome.avg_load_served) * 100 ).toFixed(2);
          const conclusionCard = document.createElement('div');
          conclusionCard.className = 'card';
          conclusionCard.style.cssText = 'background:var(--color-bg-surface); padding:var(--spacing-16);';
          conclusionCard.innerHTML = `
            <div style="font-size:0.92rem; line-height:1.55;">
              <strong style="color:var(--color-accent-gold-light);">Measured Difference:</strong>
              Under the prototype's double-failure model, the JARASANDHA heuristic yields a
              <strong>${diffPP >= 0 ? '+' : ''}${diffPP} percentage-point difference</strong> in the simulated static-load-served estimate compared to the highest-degree heuristic (${pct(r.system.outcome.avg_load_served, 1)} vs ${pct(r.baseline.outcome.avg_load_served, 1)}).
            </div>
            <div style="font-size:0.78rem; color:var(--color-text-muted); margin-top:6px;">
              * Note: In network topologies where high-degree hubs coincide with critical flow bottlenecks, simpler degree heuristics may achieve comparable outcomes.
            </div>
          `;
          container.appendChild(conclusionCard);

          out.replaceChildren(container);
        } catch (err) {
          out.replaceChildren(text('p', `Comparison Error: ${err.message}`, 'color:var(--color-risk-critical);'));
        }
      };

      budgetSelect.onchange = renderComparison;

      const controls = document.createElement('div');
      controls.className = 'controls';
      controls.append(
        text('label', 'Select Protection Budget:', 'font-size:0.86rem; color:var(--color-text-secondary);'),
        budgetSelect
      );

      root.append(controls, out);
      renderComparison();

      return root;
    },
    {
      subtitle: 'Compare strategies under the same scenario assumptions.',
      actionHint: 'Adjust the budget selector to see how no intervention, degree-based selection, and JARASANDHA compare.',
      nextStep: {
        title: 'Run Controlled Experiments in the Lab',
        description: 'Test all five candidate strategies across repeated configurable synthetic failure scenarios.',
        linkText: 'Open Experiment Lab →',
        linkHref: '#experiment'
      }
    }
  );
}
