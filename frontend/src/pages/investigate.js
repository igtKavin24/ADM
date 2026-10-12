import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { page, table, text, createDisclosure } from '../components/page.js';
import { num, pct } from '../utils/format.js';
import { state } from '../state.js';

export function investigatePage() {
  return page(
    'Component ranking',
    async () => {
      const caseId = state.getCaseId();
      const data = await api.getVulnerabilities(caseId);
      const rows = data.vulnerabilities;
      const w = data.weights;

      let selectedIndex = 0;
      if (state.getSelectedComponentId() !== null) {
        const found = rows.findIndex(r => r.id === state.getSelectedComponentId());
        if (found !== -1) selectedIndex = found;
      }

      const root = document.createElement('div');

      // Top Context Card distinguishing state forecast vs component priority
      const contextCard = document.createElement('div');
      contextCard.className = 'card';
      contextCard.style.cssText = 'background:var(--color-bg-surface); padding:var(--spacing-16); margin-bottom:var(--spacing-16);';
      contextCard.innerHTML = `
        <div style="font-size:0.9rem; line-height:1.55; color:var(--color-text-secondary);">
          <strong style="color:var(--color-accent-gold-light);">Calculation Distinction:</strong>
          The global ML model classifies overall grid failure risk for state #${caseId}. In contrast, this table ranks individual substations using the prototype's <strong>graph/loading heuristic formula</strong>:
          <div style="margin-top:6px; font-family:monospace; color:var(--color-accent-gold); font-size:0.86rem; background:rgba(0,0,0,0.25); padding:6px 10px; border-radius:4px;">
            Priority = (${w.risk} × Incident Loading Risk) + (${w.criticality} × Betweenness Centrality) + (${w.vulnerability} × Lack of Alternatives) + (${w.impact} × Static Consequence Proxy)
          </div>
          <div style="margin-top:6px; font-size:0.78rem; color:var(--color-text-muted);">
            * ${data.weight_type}. These weights are prototype defaults, not learned by gradient descent or validated by field utilities.
          </div>
        </div>
      `;
      root.appendChild(contextCard);

      // Selected Substation Explanation Card
      const whyCard = document.createElement('div');
      whyCard.className = 'card';
      whyCard.style.borderLeft = '3px solid var(--color-accent-gold)';

      const updateExplanation = (idx) => {
        const item = rows[idx];
        state.setSelectedComponentId(item.id);
        whyCard.innerHTML = `
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <span>Rank #${item.rank}: ${item.name} (${item.type} substation)</span>
            <span style="font-size:0.82rem; color:var(--color-accent-gold); font-weight:700;">
              Priority Score: ${num(item.priority_score, 4)}
            </span>
          </div>
          <div class="card-body">
            <p style="font-size:0.92rem; line-height:1.6; margin-bottom:12px;">
              ${item.explanation}
            </p>
            <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:0.82rem; color:var(--color-text-secondary);">
              <span><strong>Incident Line Loading:</strong> ${pct(item.risk_score, 1)}</span>
              <span><strong>Betweenness Centrality:</strong> ${num(item.criticality, 3)}</span>
              <span><strong>Vulnerability:</strong> ${num(item.vulnerability, 3)}</span>
              <span><strong>Consequence Share:</strong> ${num(item.impact, 3)}</span>
              <span><strong>Articulation Point:</strong> ${item.is_articulation_point ? 'Yes (Splits grid)' : 'No'}</span>
            </div>
          </div>
        `;
      };

      updateExplanation(selectedIndex);
      root.appendChild(whyCard);

      // Component Table with Non-Expert Friendly Column Headings
      const tableHeaders = [
        'Rank',
        'Component',
        'Type',
        'Incident Loading Risk',
        'Betweenness Centrality',
        'Lack of Alternatives',
        'Consequence Share',
        'Priority Score'
      ];

      const tableData = rows.map(r => [
        `#${r.rank}`,
        r.name,
        r.type,
        pct(r.risk_score, 1),
        num(r.criticality, 3),
        num(r.vulnerability, 3),
        num(r.impact, 3),
        num(r.priority_score, 4)
      ]);

      const tEl = table(tableHeaders, tableData, (idx) => {
        updateExplanation(idx);
      });

      const rankingCard = createCard(
        'SUBSTATION HEURISTIC PRIORITY RANKING',
        tEl,
        {
          footer: text(
            'div',
            'Click any row or navigate with keyboard (Enter/Space) to view its mathematical breakdown above.',
            'font-size:0.78rem; color:var(--color-text-muted);'
          )
        }
      );
      root.appendChild(rankingCard);

      // Methodological Details Disclosure
      const formulaDetails = `
        <p style="margin-bottom:8px;">
          <strong>Term Definitions:</strong>
        </p>
        <ul style="padding-left:20px; line-height:1.6; font-size:0.84rem; color:var(--color-text-secondary);">
          <li><strong>Incident Loading Risk (${w.risk * 100}% weight):</strong> Maximum thermal loading ratio among all transmission lines directly connected to this substation (capped at 1.0).</li>
          <li><strong>Betweenness Centrality (${w.criticality * 100}% weight):</strong> Fraction of all shortest graph paths passing through this node, normalized to the maximum centrality in the network.</li>
          <li><strong>Lack of Alternatives (${w.vulnerability * 100}% weight):</strong> Evaluates path redundancy. Articulation points (nodes whose removal cuts the grid into disconnected components) receive 1.0; other nodes are scored by 1 minus neighbor redundancy.</li>
          <li><strong>Consequence Share (${w.impact * 100}% weight):</strong> Ratio of total installed generation capacity or active connected load located at this bus, scaled to 0–1.</li>
        </ul>
      `;
      root.appendChild(createDisclosure('View metric definitions & weighting details', formulaDetails));

      return root;
    },
    {
      subtitle: 'See how the prototype’s loading and graph measures combine into a heuristic priority score.',
      actionHint: 'Click any row to inspect why that substation is ranked at its position.',
      showCaseSelector: true,
      rebuildOnCaseChange: true,
      nextStep: {
        title: 'Test Outage Consequence in What-If',
        description: 'Simulate the structural removal of a substation or line to measure graph disconnections and static load losses.',
        linkText: 'Run What-If Outage →',
        linkHref: '#whatif'
      }
    }
  );
}
