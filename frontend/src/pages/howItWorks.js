import { createCard } from '../components/card.js';
import { page, text } from '../components/page.js';

const STAGES = [
  {
    step: '1',
    name: 'FORECAST RISK',
    input: 'Synthetic grid state features: max line thermal loading ratio, overloaded lines count, disconnected lines, net generation/load balance.',
    calculation: 'Multi-class LightGBM classifier estimates one of 4 risk tiers (Stable, Watch, High Risk, Critical) alongside local SHAP feature contributions.',
    output: 'State-level risk class and time-to-failure horizon (~1–5 steps).',
    meaning: 'Indicates whether the current benchmark state exhibits signs of severe thermal overloading or imbalance.',
    cannotProve: 'Does not establish forecasting skill on a live utility grid because benchmark labels derive directly from synthetic loading rules.'
  },
  {
    step: '2',
    name: 'UNDERSTAND TOPOLOGY',
    input: 'IEEE 14-bus connectivity graph (14 substation nodes, 20 transmission line edges, installed generation & load capacities).',
    calculation: 'Graph theory algorithms compute betweenness centrality, neighbor redundancy, and graph cut articulation points.',
    output: 'Structural criticality rankings and identification of single points of failure.',
    meaning: 'Reveals which substations act as critical topological bottlenecks where power must traverse.',
    cannotProve: 'Does not calculate AC reactive power flows, bus voltages (pu), or phase angle limits.'
  },
  {
    step: '3',
    name: 'SIMULATE STRUCTURAL OUTAGE',
    input: 'Selection of a single substation or transmission line to remove from a cloned copy of the graph.',
    calculation: 'Graph connected components calculation measures island formation, remaining largest component fraction, and unserved static load.',
    output: 'Simulated island count, disconnected buses, and static load lost in generator-less islands.',
    meaning: 'Tests whether the grid remains topologically connected if a specific asset fails.',
    cannotProve: 'Does not model dynamic transient stability, generator governor response, or cascading line overload trips.'
  },
  {
    step: '4',
    name: 'PRIORITISE RESILIENCE INVESTMENTS',
    input: 'Calculated incident-line loading risk, betweenness centrality, lack of redundancy, and static generation/load shares.',
    calculation: 'Weighted heuristic formula: Priority = (0.30 × Risk) + (0.25 × Criticality) + (0.20 × Vulnerability) + (0.25 × Impact).',
    output: 'Standardized 0–1 component priority ranking and rank-order explanations.',
    meaning: 'Ranks which substations combine high incident loading with structural indispensability.',
    cannotProve: 'Weights are prototype heuristics; this is not an optimal mathematical dispatch or utility-grade investment solution.'
  },
  {
    step: '5',
    name: 'EVALUATE CANDIDATE STRATEGIES',
    input: 'Candidate protection set under a fixed budget (e.g. harden 2 substations) tested against 200 double-failure scenarios.',
    calculation: 'Repeated Monte Carlo simulation where protected substations survive simulated failure events.',
    output: 'Average static load served, largest connected island fraction, and percentage-point advantage over baselines.',
    meaning: 'Demonstrates whether combining loading risk and topology outperforms single-factor selection heuristics.',
    cannotProve: 'Outcomes are conditioned on the assumed double-failure model; they do not guarantee real-world blackout prevention.'
  }
];

export function howItWorksPage() {
  return page(
    'How JARASANDHA works',
    () => {
      const root = document.createElement('div');

      const introCard = document.createElement('div');
      introCard.className = 'card';
      introCard.style.cssText = 'background:var(--color-bg-surface); padding:var(--spacing-16); margin-bottom:var(--spacing-20);';
      introCard.innerHTML = `
        <p style="font-size:0.95rem; line-height:1.6; color:var(--color-text-primary);">
          JARASANDHA structures the complex problem of power-grid resilience into five transparent, explainable stages.
          Each stage takes specific inputs, executes documented calculations, and generates interpretable decision-support indicators.
        </p>
      `;
      root.appendChild(introCard);

      const flowContainer = document.createElement('div');
      flowContainer.style.cssText = 'display:flex; flex-direction:column; gap:var(--spacing-20);';

      STAGES.forEach(s => {
        const stageEl = document.createElement('div');
        stageEl.className = 'card';
        stageEl.style.borderLeft = '4px solid var(--color-accent-gold)';

        stageEl.innerHTML = `
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:var(--color-accent-gold); color:#000; border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:0.82rem;">${s.step}</span>
              <span style="font-size:1.1rem; letter-spacing:1px;">${s.name}</span>
            </div>
          </div>
          <div class="card-body" style="font-size:0.88rem; line-height:1.6;">
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:12px;">
              <div>
                <strong style="color:var(--color-accent-gold-light);">Input:</strong>
                <p style="color:var(--color-text-secondary); margin-top:2px;">${s.input}</p>
              </div>
              <div>
                <strong style="color:var(--color-accent-gold-light);">Calculation:</strong>
                <p style="color:var(--color-text-secondary); margin-top:2px;">${s.calculation}</p>
              </div>
              <div>
                <strong style="color:var(--color-accent-gold-light);">Output:</strong>
                <p style="color:var(--color-text-secondary); margin-top:2px;">${s.output}</p>
              </div>
            </div>

            <div style="border-top:1px solid var(--color-border); padding-top:10px; display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
              <div>
                <strong style="color:#8bc39d;">✓ What it means:</strong>
                <p style="color:var(--color-text-primary); margin-top:2px;">${s.meaning}</p>
              </div>
              <div>
                <strong style="color:#e57373;">✕ What it cannot prove:</strong>
                <p style="color:var(--color-text-muted); margin-top:2px;">${s.cannotProve}</p>
              </div>
            </div>
          </div>
        `;
        flowContainer.appendChild(stageEl);
      });

      root.appendChild(flowContainer);

      return root;
    },
    {
      subtitle: 'Follow the five-step workflow from risk forecasting to strategic evaluation.',
      actionHint: 'Review each stage to understand inputs, calculations, interpretation, and scientific boundaries.',
      nextStep: {
        title: 'Begin with System Overview',
        description: 'Explore the live prototype by inspecting the selected synthetic grid benchmark state.',
        linkText: 'Return to Overview →',
        linkHref: '#overview'
      }
    }
  );
}
