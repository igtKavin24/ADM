import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { createBarChart } from '../components/chart.js';
import { page, table, select, button, text, createDisclosure } from '../components/page.js';
import { pct, num } from '../utils/format.js';

export function experimentPage() {
  return page(
    'Experiment lab',
    async () => {
      const meta = await api.getExperiments();
      const names = Object.fromEntries(meta.strategies.map(s => [s.id, s.name]));
      const out = document.createElement('div');

      const budgetSelect = select(
        Array.from({ length: meta.max_budget }, (_, i) => [i + 1, `Budget: ${i + 1} Substations`]),
        meta.default_budget
      );

      const scenarioSelect = select(
        [
          [50, '50 Scenarios (Fast)'],
          [100, '100 Scenarios'],
          [200, '200 Scenarios (Default)'],
          [500, '500 Scenarios (High Sample)']
        ],
        200
      );

      const root = document.createElement('div');

      const runExperiment = async () => {
        out.replaceChildren(text('p', 'Simulating repeated synthetic failure scenarios...', 'color:var(--color-text-secondary);'));
        try {
          const budgetVal = Number(budgetSelect.value);
          const scenarioVal = Number(scenarioSelect.value);

          const r = await api.runExperiment({
            budget: budgetVal,
            n_scenarios: scenarioVal
          });

          const container = document.createElement('div');

          // Simulation generator disclosure
          const notice = document.createElement('div');
          notice.className = 'assumption-notice';
          notice.innerHTML = `
            <strong>Implemented Scenario Generator:</strong> Each scenario samples two failed substations with selection probability proportional to <code>(incident_line_risk + 0.05)</code>. Random selection uses a single seeded draw. All metrics are computed as mean values across the <strong>${r.n_scenarios}</strong> evaluated cases.
          `;
          container.appendChild(notice);

          const ids = Object.keys(r.results);
          const chartLabels = ['No intervention', ...ids.map(i => names[i] || i)];
          const chartValues = [r.baseline.avg_load_served, ...ids.map(i => r.results[i].avg_load_served)];

          // Bar Chart with 0-based scale
          const chartCard = createCard(
            `AVERAGE SIMULATED STATIC LOAD SERVED (${r.n_scenarios} SCENARIOS, BUDGET ${r.budget})`,
            createBarChart(
              chartLabels,
              [{
                label: 'Avg. Static Load Served',
                data: chartValues,
                backgroundColor: ['#6b5f52', '#827361', '#9e8c75', '#b8a68b', '#c9a84c', '#e0c273']
              }],
              { y: { min: 0, max: 1 } }
            ),
            {
              footer: text(
                'div',
                'Zero-based y-axis. Results reflect static connectivity island calculations under synthetic double-node failures.',
                'font-size:0.76rem; color:var(--color-text-muted);'
              )
            }
          );
          container.appendChild(chartCard);

          // Results Table
          const tableRows = [
            [
              'No intervention (Baseline)',
              'None (0)',
              pct(r.baseline.avg_load_served, 1),
              pct(r.baseline.avg_connectivity, 1),
              `${num(r.baseline.avg_affected, 2)} buses`,
              '0.0 pp'
            ],
            ...ids.map(i => [
              names[i] || i,
              r.results[i].protected.map(id => `Sub_${id}`).join(', '),
              pct(r.results[i].avg_load_served, 1),
              pct(r.results[i].avg_connectivity, 1),
              `${num(r.results[i].avg_affected, 2)} buses`,
              `+${(r.results[i].load_served_gain * 100).toFixed(2)} pp`
            ])
          ];

          const tableCard = createCard(
            'EXPERIMENTAL RESULTS MATRIX',
            table(
              ['Strategy', 'Hardened Elements', 'Avg. Load Served', 'Avg. Largest Island', 'Avg. Affected Buses', 'Gain vs Baseline'],
              tableRows
            )
          );
          container.appendChild(tableCard);

          // Neutral empirical summary
          const bestStrategyId = ids.reduce((best, curr) =>
            r.results[curr].avg_load_served > r.results[best].avg_load_served ? curr : best
          , ids[0]);

          const summaryCard = document.createElement('div');
          summaryCard.className = 'card';
          summaryCard.style.cssText = 'background:var(--color-bg-surface); padding:var(--spacing-16);';
          summaryCard.innerHTML = `
            <div style="font-size:0.92rem; line-height:1.55;">
              <strong style="color:var(--color-accent-gold-light);">Empirical Observation:</strong>
              Under the tested parameters (${r.n_scenarios} scenarios, budget ${r.budget}), the strategy with the largest measured mean load served was <strong>${names[bestStrategyId]}</strong> (${pct(r.results[bestStrategyId].avg_load_served, 1)}).
              These outcomes evaluate topological graph survival on the synthetic IEEE 14-bus model and do not constitute proof of field utility performance.
            </div>
          `;
          container.appendChild(summaryCard);

          out.replaceChildren(container);
        } catch (err) {
          out.replaceChildren(text('p', `Experiment Error: ${err.message}`, 'color:var(--color-risk-critical);'));
        }
      };

      const controls = document.createElement('div');
      controls.className = 'controls';
      controls.append(
        text('label', 'Budget:', 'font-size:0.86rem; color:var(--color-text-secondary);'),
        budgetSelect,
        text('label', 'Sample Scenarios:', 'font-size:0.86rem; color:var(--color-text-secondary);'),
        scenarioSelect,
        button('Run experiment', runExperiment)
      );

      root.append(controls, out);
      runExperiment();

      return root;
    },
    {
      subtitle: 'Test the strategies across repeated synthetic scenarios.',
      actionHint: 'Configure the protection budget and scenario count, then click "Run experiment" to measure average preservation.',
      nextStep: {
        title: 'Inspect Data Provenance & Methodology',
        description: 'Review the underlying benchmark generation, model training splits, test metrics, and research limitations.',
        linkText: 'View Methodology →',
        linkHref: '#methodology'
      }
    }
  );
}
