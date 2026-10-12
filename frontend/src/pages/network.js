import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { createNetworkGraph, loadingRiskColor, priorityScoreColor } from '../components/networkGraph.js';
import { page, stat, text, table } from '../components/page.js';
import { pct, num } from '../utils/format.js';
import { state } from '../state.js';

export function networkPage() {
  return page(
    'Network map',
    async () => {
      const caseId = state.getCaseId();
      const [net, vuln] = await Promise.all([
        api.getNetwork(),
        api.getVulnerabilities(caseId)
      ]);

      const byId = Object.fromEntries(vuln.vulnerabilities.map(v => [v.id, v]));
      const risks = Object.fromEntries(vuln.vulnerabilities.map(v => [v.id, v.risk_score]));
      const priorities = Object.fromEntries(vuln.vulnerabilities.map(v => [v.id, v.priority_score]));

      let currentEncoding = state.getNetworkEncoding();
      let selectedComponent = state.getSelectedComponentId() !== null ? byId[state.getSelectedComponentId()] : null;

      const root = document.createElement('div');

      // Encoding mode selector bar & Legend
      const modeBar = document.createElement('div');
      modeBar.className = 'card';
      modeBar.style.cssText = 'padding:12px 16px; margin-bottom:var(--spacing-16); background:var(--color-bg-surface);';

      modeBar.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <label style="font-size:0.86rem; font-weight:600; color:var(--color-text-secondary);">Node Visual Encoding:</label>
            <select id="encoding-select" class="input" style="padding:4px 10px;">
              <option value="risk" ${currentEncoding === 'risk' ? 'selected' : ''}>Component Loading Risk (Max incident-line ratio)</option>
              <option value="priority" ${currentEncoding === 'priority' ? 'selected' : ''}>Structural Priority Score (Weighted heuristic)</option>
            </select>
          </div>
          <div id="legend-container" style="display:flex; align-items:center; gap:16px; font-size:0.8rem;"></div>
        </div>
      `;

      const updateLegend = (enc) => {
        const legendDiv = modeBar.querySelector('#legend-container');
        if (enc === 'risk') {
          legendDiv.innerHTML = `
            <span style="color:var(--color-text-muted); font-weight:600;">Thresholds:</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#4a8259;"></span> <60% loading</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#d4a942;"></span> 60%–79% loading</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#cc5643;"></span> ≥80% loading</span>
          `;
        } else {
          legendDiv.innerHTML = `
            <span style="color:var(--color-text-muted); font-weight:600;">Priority:</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#4a8259;"></span> Low (<0.45)</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#d4a942;"></span> Moderate (0.45–0.69)</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#cc5643;"></span> High (≥0.70)</span>
          `;
        }
      };

      updateLegend(currentEncoding);
      root.appendChild(modeBar);

      // Main Layout: Graph on Left/Top, Inspector Panel on Right/Bottom
      const mainGrid = document.createElement('div');
      mainGrid.style.cssText = 'display:grid; grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr); gap:var(--spacing-16); margin-bottom:var(--spacing-20);';

      const graphBox = document.createElement('div');
      graphBox.style.cssText = 'height:540px; background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:var(--radius-card); position:relative;';

      const inspectorCard = document.createElement('div');
      inspectorCard.className = 'card';
      inspectorCard.style.cssText = 'height:540px; display:flex; flex-direction:column; overflow-y:auto;';

      const renderInspector = (nodeData) => {
        if (!nodeData) {
          inspectorCard.innerHTML = `
            <div class="card-header">Substation Inspector</div>
            <div class="card-body" style="color:var(--color-text-secondary); text-align:center; padding:var(--spacing-32) var(--spacing-16);">
              <div style="font-size:2rem; margin-bottom:8px; opacity:0.6;">🔍</div>
              <p><strong>No component selected.</strong></p>
              <p style="font-size:0.84rem; margin-top:6px; color:var(--color-text-muted);">
                Click any substation node in the diagram or choose a row in the table below to inspect its attributes.
              </p>
            </div>
          `;
          return;
        }

        const v = byId[nodeData.id];
        inspectorCard.innerHTML = `
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <span>${nodeData.name} (${nodeData.type})</span>
            <span class="badge ${v.risk_score >= 0.8 ? 'risk-high' : v.risk_score >= 0.6 ? 'risk-watch' : 'risk-stable'}">
              Rank #${v.rank}
            </span>
          </div>
          <div class="card-body" style="font-size:0.88rem; line-height:1.5;">
            <div style="margin-bottom:12px;">
              <div style="font-size:0.75rem; text-transform:uppercase; color:var(--color-text-muted); font-weight:700;">Strategic Assessment</div>
              <p style="margin-top:4px; color:var(--color-text-primary);">${v.explanation}</p>
            </div>

            <div style="border-top:1px solid var(--color-border); padding-top:10px; margin-bottom:12px;">
              <table style="width:100%; font-size:0.84rem; border-collapse:collapse;">
                <tr><td style="padding:4px 0; color:var(--color-text-secondary);">Incident Loading Risk:</td><td style="text-align:right; font-weight:600; color:var(--color-accent-gold);">${pct(v.risk_score, 1)}</td></tr>
                <tr><td style="padding:4px 0; color:var(--color-text-secondary);">Betweenness Criticality:</td><td style="text-align:right; font-weight:600;">${num(v.criticality, 3)}</td></tr>
                <tr><td style="padding:4px 0; color:var(--color-text-secondary);">Vulnerability (Lack of alt.):</td><td style="text-align:right; font-weight:600;">${num(v.vulnerability, 3)}</td></tr>
                <tr><td style="padding:4px 0; color:var(--color-text-secondary);">Consequence Impact:</td><td style="text-align:right; font-weight:600;">${num(v.impact, 3)}</td></tr>
                <tr><td style="padding:4px 0; color:var(--color-text-secondary);">Combined Priority Score:</td><td style="text-align:right; font-weight:700; color:var(--color-accent-gold);">${num(v.priority_score, 3)}</td></tr>
                <tr><td style="padding:4px 0; color:var(--color-text-secondary);">Articulation Point:</td><td style="text-align:right;">${v.is_articulation_point ? '⚠️ Yes (Splits grid)' : 'No'}</td></tr>
                <tr><td style="padding:4px 0; color:var(--color-text-secondary);">Bus / Voltage:</td><td style="text-align:right;">Bus ${nodeData.bus} (${nodeData.voltage_kv} kV)</td></tr>
              </table>
            </div>

            <div style="margin-top:auto; padding-top:8px;">
              <a href="#whatif" class="btn btn-primary btn-sm" style="width:100%; text-decoration:none; text-align:center;">
                Simulate ${nodeData.name} Outage →
              </a>
            </div>
          </div>
        `;
      };

      const graphInstance = createNetworkGraph(net, graphBox, {
        risks,
        priorities,
        encoding: currentEncoding,
        selectedId: selectedComponent ? selectedComponent.id : null,
        onClick: (node) => {
          selectedComponent = byId[node.id];
          state.setSelectedComponentId(node.id);
          graphInstance.setSelected(node.id);
          renderInspector(node);
        }
      });

      // Handle encoding toggle change
      const encSelect = modeBar.querySelector('#encoding-select');
      encSelect.onchange = (e) => {
        currentEncoding = e.target.value;
        state.setNetworkEncoding(currentEncoding);
        updateLegend(currentEncoding);
        graphInstance.setEncoding(currentEncoding);
      };

      renderInspector(selectedComponent);
      mainGrid.append(graphBox, inspectorCard);
      root.appendChild(mainGrid);

      // Accessible Substation Table Fallback
      const tableRows = net.nodes.map(n => {
        const v = byId[n.id];
        return [
          n.id,
          n.name,
          n.type,
          `${n.voltage_kv} kV`,
          pct(v.risk_score, 1),
          num(v.priority_score, 3),
          `#${v.rank}`,
          v.is_articulation_point ? 'Yes (Split risk)' : 'No'
        ];
      });

      const accessibleTableCard = createCard(
        'ACCESSIBLE SUBSTATION INVENTORY & TABLE ALTERNATIVE',
        table(
          ['ID', 'Name', 'Type', 'Voltage', 'Incident Loading Risk', 'Priority Score', 'Rank', 'Articulation Point'],
          tableRows,
          (idx) => {
            const node = net.nodes[idx];
            selectedComponent = byId[node.id];
            state.setSelectedComponentId(node.id);
            graphInstance.setSelected(node.id);
            renderInspector(node);
          }
        ),
        {
          footer: text(
            'div',
            'Click or press Enter on any row to inspect that component in the panel above.',
            'font-size:0.78rem; color:var(--color-text-muted);'
          )
        }
      );

      root.appendChild(accessibleTableCard);

      return root;
    },
    {
      subtitle: 'Explore connections, incident line loadings, and inspect individual substations.',
      actionHint: 'Click any node to inspect its structural centrality and loading risk. Use the dropdown to toggle between loading risk and heuristic priority.',
      showCaseSelector: true,
      rebuildOnCaseChange: true,
      nextStep: {
        title: 'Investigate Component Ranking Heuristic',
        description: 'See the full mathematical decomposition of risk, centrality, vulnerability, and impact for every substation.',
        linkText: 'Inspect Component Ranking →',
        linkHref: '#investigate'
      }
    }
  );
}
