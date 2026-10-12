import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { page, table, text, createDisclosure } from '../components/page.js';
import { pct, num } from '../utils/format.js';

export function methodologyPage() {
  return page(
    'Data & methodology',
    async () => {
      const [prov, m] = await Promise.all([
        api.getProvenance(),
        api.getModelMetrics()
      ]);

      const gb = m.gradient_boosting || {};
      const lr = m.logistic_regression || {};

      const root = document.createElement('div');

      // Top Caveat Alert
      const caveatTop = document.createElement('div');
      caveatTop.className = 'card';
      caveatTop.style.cssText = 'border-left: 4px solid var(--color-accent-gold); background: rgba(201, 168, 76, 0.08); padding: var(--spacing-16); margin-bottom: var(--spacing-20);';
      caveatTop.innerHTML = `
        <h3 style="font-size:1.05rem; color:var(--color-accent-gold); margin-bottom:6px;">Scientific Caveat: Synthetic Benchmark Interpretation</h3>
        <p style="font-size:0.88rem; line-height:1.55; color:var(--color-text-primary);">
          High test set metrics (e.g., LightGBM test accuracy of ${pct(gb.accuracy || 0.965, 1)}) reflect accurate learning of the <strong>synthetic labelling rule</strong> implemented in <code>backend/data/generator.py</code>. Because risk labels are constructed directly from thermal loading ratios, overloaded line counts, and disconnected lines that the model also observes as features, this performance does <em>not</em> establish real-world power-grid failure forecasting skill.
        </p>
      `;
      root.appendChild(caveatTop);

      // Section 1: Three Clear Methodological Categories
      const categoriesGrid = document.createElement('div');
      categoriesGrid.className = 'grid-3';

      categoriesGrid.append(
        createCard(
          '1. IMPLEMENTED & MEASURED',
          text(
            'div',
            `
              <ul style="padding-left:16px; font-size:0.84rem; line-height:1.6; color:var(--color-text-secondary);">
                <li>14-bus IEEE topological graph structure (14 substations, 20 lines).</li>
                <li>LightGBM & Logistic Regression trained on scenario-split synthetic benchmark.</li>
                <li>Exact graph connected components & articulation points.</li>
                <li>Deterministic failure simulations & intervention evaluations.</li>
              </ul>
            `
          )
        ),
        createCard(
          '2. PROTOTYPE HEURISTICS & ASSUMPTIONS',
          text(
            'div',
            `
              <ul style="padding-left:16px; font-size:0.84rem; line-height:1.6; color:var(--color-text-secondary);">
                <li>Component priority weights (30% risk, 25% criticality, 20% vulnerability, 25% impact) are manually chosen heuristics.</li>
                <li>Simulated hardening treats a protected node as surviving a node failure.</li>
                <li>Scenarios sample double-node outages proportional to loading risk.</li>
              </ul>
            `
          )
        ),
        createCard(
          '3. OUT OF SCOPE / NOT YET VALIDATED',
          text(
            'div',
            `
              <ul style="padding-left:16px; font-size:0.84rem; line-height:1.6; color:var(--color-text-secondary);">
                <li>Physical AC/DC power flow solving (voltages, reactive power Q, phase angles).</li>
                <li>Dynamic frequency stability & cascading electrical line trips.</li>
                <li>Real-world utility supervisory control and data acquisition (SCADA) telemetry.</li>
              </ul>
            `
          )
        )
      );
      root.appendChild(categoriesGrid);

      // Section 2: Data Provenance & Split
      const dataCard = createCard(
        'DATASET PROVENANCE & BENCHMARK PROPERTIES',
        table(
          ['Parameter', 'Value', 'Source / Verification Note'],
          [
            ['Dataset Name', prov.name, 'Configured in backend/config.py'],
            ['Dataset Type', prov.type, 'Synthetic benchmark'],
            ['Total Rows', `${prov.n_rows} rows`, 'Derived from loaded DataFrame length'],
            ['Total Scenarios', `${prov.n_scenarios} scenarios`, '50 time steps per scenario'],
            ['Time-Step Resolution', `${prov.timestep_minutes} minutes (assumed)`, 'Assumed duration between degradation steps'],
            ['Train / Val / Test Split', '70% train / 15% val / 15% test', 'Verified: Split grouped by scenario_id to prevent temporal leakage'],
            ['Target Classes', '4 tiers: STABLE (0), WATCH (1), HIGH_RISK (2), CRITICAL (3)', 'Defined in TARGET_CLASSES']
          ]
        )
      );
      root.appendChild(dataCard);

      // Section 3: Evaluated Model Metrics on Independent Test Scenarios
      const metricsCard = createCard(
        'EVALUATED MODEL METRICS (TEST SET)',
        table(
          ['Model Architecture', 'Test Accuracy', 'Macro Precision', 'Macro Recall', 'Macro F1', 'Evaluation Basis'],
          [
            ['Majority-class baseline', pct(gb.majority_baseline_accuracy || 0.736, 1), '—', '—', '—', 'Predicts majority CRITICAL class'],
            ['Logistic Regression', pct(lr.accuracy || 0.928, 1), num(lr.macro_precision || 0.68, 3), num(lr.macro_recall || 0.66, 3), num(lr.macro_f1 || 0.67, 3), 'Standardized features, test split'],
            ['LightGBM (Gradient Boosting)', pct(gb.accuracy || 0.965, 1), num(gb.macro_precision || 0.85, 3), num(gb.macro_recall || 0.85, 3), num(gb.macro_f1 || 0.85, 3), 'Multi-class gradient boosted trees']
          ]
        ),
        {
          footer: text(
            'div',
            'Metrics read directly from backend/ml/models/metrics.json produced during model training.',
            'font-size:0.76rem; color:var(--color-text-muted);'
          )
        }
      );
      root.appendChild(metricsCard);

      // Section 4: Documented Research Limitations List
      const limitsList = document.createElement('ul');
      limitsList.style.cssText = 'padding-left:20px; line-height:1.6; font-size:0.86rem; color:var(--color-text-secondary);';
      (prov.limitations || []).forEach(item => {
        const li = document.createElement('li');
        li.style.marginBottom = '6px';
        li.textContent = item;
        limitsList.appendChild(li);
      });

      root.appendChild(createCard('EXPLICIT RESEARCH LIMITATIONS', limitsList));

      return root;
    },
    {
      subtitle: 'Inspect the data source, target, evaluation and limitations.',
      actionHint: 'Review benchmark properties, verified test set metrics, and documented academic caveats.',
      nextStep: {
        title: 'Understand the Product Flow',
        description: 'Walk through the 5-stage conceptual pipeline from forecasting to strategic evaluation.',
        linkText: 'How JARASANDHA Works →',
        linkHref: '#howitworks'
      }
    }
  );
}
