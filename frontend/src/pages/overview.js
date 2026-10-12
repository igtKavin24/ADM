import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { createRiskBadge } from '../components/riskBadge.js';
import { page, stat, text } from '../components/page.js';
import { state } from '../state.js';

export function overviewPage() {
  return page(
    'Overview',
    async () => {
      const caseId = state.getCaseId();
      const [forecast, vuln, netMetrics] = await Promise.all([
        api.getForecastById(caseId),
        api.getVulnerabilities(caseId),
        api.getNetworkMetrics()
      ]);

      const ranked = vuln.vulnerabilities;
      const top = ranked[0];

      // Accurately count components with incident line loading risk >= 0.80
      const highLoadingCount = ranked.filter(r => r.risk_score >= 0.8).length;

      const root = document.createElement('div');

      // 1. Workflow Progression Strip
      const workflowStrip = document.createElement('div');
      workflowStrip.style.cssText = `
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-card);
        padding: var(--spacing-16) var(--spacing-20);
        margin-bottom: var(--spacing-20);
      `;
      workflowStrip.innerHTML = `
        <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--color-text-muted); margin-bottom:8px; font-weight:700;">
          Decision Support Workflow
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; font-size:0.86rem;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="background:var(--color-accent-gold); color:#000; border-radius:50%; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700;">1</span>
            <strong style="color:var(--color-accent-gold-light);">Forecast Risk</strong>
          </div>
          <span style="color:var(--color-text-muted);">→</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="background:var(--color-bg-surface); border:1px solid var(--color-border); color:var(--color-text-secondary); border-radius:50%; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; font-size:0.75rem;">2</span>
            <span>Understand Topology</span>
          </div>
          <span style="color:var(--color-text-muted);">→</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="background:var(--color-bg-surface); border:1px solid var(--color-border); color:var(--color-text-secondary); border-radius:50%; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; font-size:0.75rem;">3</span>
            <span>Test Outage</span>
          </div>
          <span style="color:var(--color-text-muted);">→</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="background:var(--color-bg-surface); border:1px solid var(--color-border); color:var(--color-text-secondary); border-radius:50%; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; font-size:0.75rem;">4</span>
            <span>Prioritise & Harden</span>
          </div>
          <span style="color:var(--color-text-muted);">→</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="background:var(--color-bg-surface); border:1px solid var(--color-border); color:var(--color-text-secondary); border-radius:50%; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; font-size:0.75rem;">5</span>
            <span>Evaluate Evidence</span>
          </div>
        </div>
      `;
      root.appendChild(workflowStrip);

      // 2. Summary Grid (4 truthfully labelled KPI cards)
      const grid = document.createElement('div');
      grid.className = 'grid-4';

      const riskBadgeWrapper = document.createElement('div');
      riskBadgeWrapper.append(
        createRiskBadge(forecast.risk_level),
        text('div', forecast.horizon, 'margin-top:6px; font-size:0.8rem; color:var(--color-text-secondary);')
      );

      grid.append(
        createCard(
          'GRID BENCHMARK',
          stat(
            `#${caseId}`,
            'Selected Synthetic Case',
            `IEEE 14-bus (${netMetrics.topology.nodes} nodes, ${netMetrics.topology.edges} lines)`
          )
        ),
        createCard(
          'STATE FORECAST',
          riskBadgeWrapper,
          {
            footer: text('div', 'Model-predicted class score', 'font-size:0.75rem; color:var(--color-text-muted);')
          }
        ),
        createCard(
          'STRESSED ELEMENTS',
          stat(
            highLoadingCount,
            'Components with Risk Score ≥ 0.80',
            'Based on max loading ratio of incident lines'
          )
        ),
        createCard(
          'HEURISTIC PRIORITY #1',
          stat(
            top.name,
            `Score: ${top.priority_score.toFixed(3)}`,
            `${top.type} substation`
          )
        )
      );
      root.appendChild(grid);

      // 3. Top Strategic Vulnerability & Recommended Action
      const detailBody = document.createElement('div');
      detailBody.innerHTML = `
        <p style="font-size:0.95rem; line-height:1.6; margin-bottom:var(--spacing-16); color:var(--color-text-primary);">
          ${top.explanation}
        </p>
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          <a href="#forecast" class="btn btn-primary" style="text-decoration:none;">
            Inspect ML Forecast →
          </a>
          <a href="#investigate" class="btn btn-secondary" style="text-decoration:none;">
            View Component Ranking
          </a>
        </div>
      `;
      root.appendChild(createCard(`CRITICAL SUBSTATION FOCUS: ${top.name}`, detailBody));

      // 4. "What these results can and cannot tell you" Transparency Block
      const limitsBox = document.createElement('div');
      limitsBox.className = 'card';
      limitsBox.style.background = 'rgba(0, 0, 0, 0.2)';
      limitsBox.innerHTML = `
        <div class="card-header" style="color:var(--color-accent-gold-light); font-size:0.95rem;">
          What these results can and cannot tell you
        </div>
        <div class="card-body" style="font-size:0.85rem; color:var(--color-text-secondary); line-height:1.55;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
            <div>
              <strong style="color:#8bc39d;">✓ What this screen shows:</strong>
              <ul style="padding-left:18px; margin-top:6px;">
                <li>Classifies a selected synthetic grid case (line loading & imbalance features).</li>
                <li>Ranks 14 IEEE substations by prototype loading, centrality, and impact heuristics.</li>
              </ul>
            </div>
            <div>
              <strong style="color:#e57373;">✕ What this screen does not claim:</strong>
              <ul style="padding-left:18px; margin-top:6px;">
                <li>Does not monitor real-world utility feeds or validate real outage forecasting skill.</li>
                <li>Does not solve physical power flows, voltages, or frequency stability.</li>
              </ul>
            </div>
          </div>
        </div>
      `;
      root.appendChild(limitsBox);

      return root;
    },
    {
      subtitle: 'A starting point for exploring one synthetic grid case.',
      actionHint: 'Review the high-level system indicators and click "Inspect ML Forecast" to examine the model predictions.',
      showCaseSelector: true,
      rebuildOnCaseChange: true,
      nextStep: {
        title: 'Examine Failure-Risk Forecast',
        description: 'Review the classifier output, class score breakdown, and SHAP feature drivers for this case.',
        linkText: 'Proceed to Risk Forecast →',
        linkHref: '#forecast'
      }
    }
  );
}
