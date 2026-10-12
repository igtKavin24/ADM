import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { createRiskBadge } from '../components/riskBadge.js';
import { createBarChart } from '../components/chart.js';
import { page, stat, table, createDisclosure, text } from '../components/page.js';
import { pct, num } from '../utils/format.js';
import { state } from '../state.js';

const CLASS_NAMES = ['STABLE', 'WATCH', 'HIGH_RISK', 'CRITICAL'];

export function forecastPage() {
  return page(
    'Risk forecast',
    async () => {
      const caseId = state.getCaseId();
      const f = await api.getForecastById(caseId);

      const root = document.createElement('div');

      // Top Status Bar
      const head = document.createElement('div');
      head.className = 'card';
      head.style.cssText = 'background:var(--color-bg-surface); padding:var(--spacing-16); margin-bottom:var(--spacing-20);';
      head.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--color-text-muted); font-weight:700;">
              Predicted Risk Class (State #${f.state_id})
            </div>
            <div style="display:flex; align-items:center; gap:12px; margin-top:6px;">
              <span id="badge-container"></span>
              <span style="font-size:0.95rem; color:var(--color-text-secondary);">${f.horizon}</span>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--color-text-muted);">Model Family</div>
            <div style="font-size:0.9rem; color:var(--color-accent-gold); font-weight:600;">LightGBM Classifier v${f.model_version}</div>
          </div>
        </div>
      `;
      head.querySelector('#badge-container').appendChild(createRiskBadge(f.risk_level));
      root.appendChild(head);

      // Main Analytics Grid
      const grid = document.createElement('div');
      grid.className = 'grid-2';

      // 1. Uncalibrated Class Scores
      const probs = CLASS_NAMES.map((_, i) => f.probabilities[i] ?? 0);
      const probChartCard = createCard(
        'MODEL CLASS SCORES (UNCALIBRATED)',
        createBarChart(
          CLASS_NAMES.map(c => c.replace('_', ' ')),
          [{ label: 'Class Score', data: probs, backgroundColor: '#c9a84c' }],
          { y: { min: 0, max: 1 } }
        ),
        {
          footer: text(
            'div',
            'Uncalibrated model output from predict_proba(). Does not represent real-world blackout probability.',
            'font-size:0.76rem; color:var(--color-text-muted);'
          )
        }
      );

      // 2. Local Explanations (SHAP)
      const shapCard = createCard(
        'LOCAL FEATURE DRIVERS (SHAP)',
        table(
          ['Grid Feature', 'SHAP Contribution'],
          f.top_contributions.map(c => [
            c.feature,
            `${c.score >= 0 ? '+' : ''}${num(c.score, 4)}`
          ])
        ),
        {
          footer: text(
            'div',
            'Features with positive values increase the predicted risk tier.',
            'font-size:0.76rem; color:var(--color-text-muted);'
          )
        }
      );

      // 3. Grid Operational State
      const stateCard = createCard(
        'BENCHMARK GRID STATE FEATURES',
        table(
          ['Operational Measure', 'Benchmark Value', 'Interpretation'],
          [
            ['Max line loading (max_rho)', pct(f.features.max_rho, 1), f.features.max_rho >= 1.0 ? 'Over thermal rating' : 'Within limit'],
            ['Overloaded lines count', f.features.n_overloaded, `${f.features.n_overloaded} of 20 lines >100%`],
            ['Disconnected lines count', f.features.n_disconnected, `${f.features.n_disconnected} lines tripped`],
            ['Total generation / load', `${num(f.features.total_gen, 1)} / ${num(f.features.total_load, 1)} MW`, `Net balance: ${num(f.features.gen_load_balance, 1)} MW`],
          ]
        )
      );

      // 4. Most Stressed Substations (Incident-line Loading Risk)
      const stressedCard = createCard(
        'MOST STRESSED SUBSTATIONS (LINE LOADING)',
        table(
          ['Substation', 'Type', 'Incident Line Loading Risk'],
          f.vulnerable_components.map(c => [
            c.name,
            c.type,
            pct(c.risk_score, 1)
          ])
        ),
        {
          footer: text(
            'div',
            'Note: Calculated from the highest loading ratio among incident lines. Not directly predicted by ML.',
            'font-size:0.76rem; color:var(--color-text-muted);'
          )
        }
      );

      grid.append(probChartCard, shapCard, stateCard, stressedCard);
      root.appendChild(grid);

      // Diagnostic Benchmark Label Disclosure
      const benchmarkLabelDetails = `
        <p style="margin-bottom:8px;">
          <strong>Dataset Row Label:</strong> <span class="badge risk-watch">${f.actual_risk_level.replace('_', ' ')}</span>
        </p>
        <p style="font-size:0.82rem; color:var(--color-text-muted); line-height:1.45;">
          <strong>Scientific Caveat:</strong> In the synthetic benchmark generator, dataset target labels are assigned by a deterministic rule based on the exact same loading features visible to the classifier. High agreement between predicted class and benchmark label reflects adherence to this labelling rule, not proof of independent real-world forecasting skill.
        </p>
      `;
      root.appendChild(createDisclosure('Show benchmark diagnostic label & scientific caveat', benchmarkLabelDetails));

      return root;
    },
    {
      subtitle: 'See what the model predicts for the selected benchmark case.',
      actionHint: 'Review uncalibrated class scores and top SHAP feature drivers, then proceed to the network map.',
      showCaseSelector: true,
      rebuildOnCaseChange: true,
      nextStep: {
        title: 'Inspect Grid Network Topology',
        description: 'Explore the 14-bus electrical connections and inspect incident-line loading across all substations.',
        linkText: 'Open Network Map →',
        linkHref: '#network'
      }
    }
  );
}
