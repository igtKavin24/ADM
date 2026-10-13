import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { createNetworkGraph, loadingRiskColor, priorityScoreColor } from '../components/networkGraph.js';
import { page, stat, text, table } from '../components/page.js';
import { pct, num } from '../utils/format.js';
import { state } from '../state.js';
import { busLabel, lineLabel, busLabelsMap, lineLabelsMap } from '../utils/labels.js';

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

      // Build canonical label maps from network response
      const busLblMap  = net.metadata?.bus_labels  || busLabelsMap(net.nodes);
      const lineLblMap = net.metadata?.line_labels || lineLabelsMap(net.edges);

      let currentEncoding = state.getNetworkEncoding();
      let selectedComponent = state.getSelectedComponentId() !== null ? byId[state.getSelectedComponentId()] : null;

      const root = document.createElement('div');

      // ── Encoding mode selector bar & Legend ──────────────────────────────
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
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#4a8259;"></span> &lt;60% loading</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#d4a942;"></span> 60%–79% loading</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#cc5643;"></span> ≥80% loading</span>
          `;
        } else {
          legendDiv.innerHTML = `
            <span style="color:var(--color-text-muted); font-weight:600;">Priority:</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#4a8259;"></span> Low (&lt;0.45)</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#d4a942;"></span> Moderate (0.45–0.69)</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:50%; background:#cc5643;"></span> High (≥0.70)</span>
          `;
        }
      };

      updateLegend(currentEncoding);
      root.appendChild(modeBar);

      // ── Main Layout: Graph + Inspector ────────────────────────────────────
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
        const lbl = busLblMap[nodeData.id] || nodeData.name;
        inspectorCard.innerHTML = `
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <span>${lbl} · ${nodeData.type}</span>
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
                <tr><td style="padding:4px 0; color:var(--color-text-secondary);">Bus / Voltage:</td><td style="text-align:right;">${lbl} (${nodeData.voltage_kv} kV)</td></tr>
              </table>
            </div>

            <div style="margin-top:auto; padding-top:8px;">
              <a href="#whatif" class="btn btn-primary btn-sm" style="width:100%; text-decoration:none; text-align:center;">
                Simulate ${lbl} Outage →
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

      // ── DC Cascade Simulation Panel ────────────────────────────────────────
      const cascadeCard = document.createElement('div');
      cascadeCard.className = 'card';
      cascadeCard.style.marginBottom = 'var(--spacing-20)';

      cascadeCard.innerHTML = `
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <span>DC Power-Flow Cascade Simulation</span>
          <span class="badge" style="background:var(--color-bg-surface); color:var(--color-text-muted); font-size:0.72rem;">Research prototype · DC-only</span>
        </div>
        <div class="card-body">
          <p style="font-size:0.84rem; color:var(--color-text-secondary); margin-bottom:var(--spacing-16);">
            Select a bus or line to trip, then simulate how thermal-limit violations cascade through the benchmark grid.
            <strong>Model note:</strong> DC active-power flow only; results are illustrative and not from a certified solver.
          </p>

          <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:var(--spacing-16); align-items:flex-end;">
            <div>
              <label style="font-size:0.8rem; color:var(--color-text-muted); display:block; margin-bottom:4px;">Trip type</label>
              <select id="cascade-type" class="input" style="padding:4px 10px;">
                <option value="bus">Bus (substation)</option>
                <option value="line">Line (transmission)</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.8rem; color:var(--color-text-muted); display:block; margin-bottom:4px;">Component</label>
              <select id="cascade-component" class="input" style="padding:4px 10px; min-width:180px;">
                ${net.nodes.map(n => `<option value="${n.id}">${busLblMap[n.id] || n.name} (${n.type})</option>`).join('')}
              </select>
            </div>
            <button id="cascade-run-btn" class="btn btn-primary">Run Cascade</button>
            <button id="cascade-reset-btn" class="btn btn-secondary" style="display:none;">Reset</button>
          </div>

          <div id="cascade-status" style="font-size:0.84rem; color:var(--color-text-muted); margin-bottom:var(--spacing-12);"></div>

          <!-- Round navigator -->
          <div id="cascade-navigator" style="display:none;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:var(--spacing-12);">
              <button id="cascade-prev-btn" class="btn btn-secondary btn-sm">← Prev</button>
              <span id="cascade-round-label" style="font-size:0.86rem; font-weight:600; color:var(--color-text-primary);"></span>
              <button id="cascade-next-btn" class="btn btn-secondary btn-sm">Next →</button>
              <span style="font-size:0.8rem; color:var(--color-text-muted); margin-left:auto;">
                Scroll the graph above to see cascade state
              </span>
            </div>

            <!-- Legend for cascade overlay -->
            <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:0.79rem; color:var(--color-text-secondary); margin-bottom:var(--spacing-12);">
              <span style="display:inline-flex; align-items:center; gap:5px;">
                <span style="width:12px; height:12px; border-radius:50%; background:#ff2020; display:inline-block;"></span> Tripped this round
              </span>
              <span style="display:inline-flex; align-items:center; gap:5px;">
                <span style="width:12px; height:12px; border-radius:50%; background:#3a3d4a; display:inline-block; opacity:0.5;"></span> Already tripped
              </span>
              <span style="display:inline-flex; align-items:center; gap:5px;">
                <span style="width:30px; height:3px; background:#ff2020; display:inline-block;"></span> Tripped line
              </span>
              <span style="display:inline-flex; align-items:center; gap:5px;">
                <span style="width:30px; height:3px; background:#3a3d4a; display:inline-block; border-top:2px dashed #555;"></span> Dead line
              </span>
            </div>

            <!-- Round detail panel -->
            <div id="cascade-round-detail" style="background:var(--color-bg-surface); border:1px solid var(--color-border); border-radius:var(--radius-card); padding:12px 16px; font-size:0.84rem;"></div>
          </div>
        </div>
      `;

      root.appendChild(cascadeCard);

      // Wire up cascade logic
      const typeSelect      = cascadeCard.querySelector('#cascade-type');
      const compSelect      = cascadeCard.querySelector('#cascade-component');
      const runBtn          = cascadeCard.querySelector('#cascade-run-btn');
      const resetBtn2       = cascadeCard.querySelector('#cascade-reset-btn');
      const statusEl        = cascadeCard.querySelector('#cascade-status');
      const navigatorEl     = cascadeCard.querySelector('#cascade-navigator');
      const roundLabelEl    = cascadeCard.querySelector('#cascade-round-label');
      const prevBtn         = cascadeCard.querySelector('#cascade-prev-btn');
      const nextBtn         = cascadeCard.querySelector('#cascade-next-btn');
      const roundDetailEl   = cascadeCard.querySelector('#cascade-round-detail');

      let cascadeResult = null;
      let currentRoundIdx = 0;

      // Rebuild component options when type changes
      typeSelect.onchange = () => {
        const t = typeSelect.value;
        if (t === 'bus') {
          compSelect.innerHTML = net.nodes.map(n => `<option value="${n.id}">${busLblMap[n.id] || n.name} (${n.type})</option>`).join('');
        } else {
          compSelect.innerHTML = net.edges.map(e => `<option value="${e.id}">${lineLblMap[e.id] || ('Line ' + (e.id+1))} (${busLblMap[e.source] || e.source} ↔ ${busLblMap[e.target] || e.target})</option>`).join('');
        }
      };

      function renderRound(idx) {
        const rnd = cascadeResult.rounds[idx];
        currentRoundIdx = idx;
        prevBtn.disabled = idx <= 0;
        nextBtn.disabled = idx >= cascadeResult.rounds.length - 1;

        roundLabelEl.textContent = `${rnd.label || ('Round ' + rnd.round)}  (${idx + 1} / ${cascadeResult.rounds.length})`;

        // Apply cascade overlay to graph
        graphInstance.setCascadeRound(rnd);

        // Render detail
        const trippedBuses = (rnd.tripped_buses || []).map(b => b.label).join(', ') || '—';
        const trippedLines = (rnd.tripped_lines || []).map(l => l.label).join(', ') || '—';
        const overloaded   = (rnd.overloaded_lines || []);

        roundDetailEl.innerHTML = `
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:10px;">
            <div>
              <div style="font-size:0.72rem; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:3px;">Buses tripped</div>
              <div style="font-weight:600; color:${rnd.tripped_buses.length ? '#ff4040' : 'var(--color-text-primary)'};">${trippedBuses}</div>
            </div>
            <div>
              <div style="font-size:0.72rem; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:3px;">Lines tripped</div>
              <div style="font-weight:600; color:${rnd.tripped_lines.length ? '#ff4040' : 'var(--color-text-primary)'};">${trippedLines}</div>
            </div>
            <div>
              <div style="font-size:0.72rem; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:3px;">Cumulative shed</div>
              <div style="font-weight:700; color:var(--color-accent-gold);">${rnd.load_shed_mw.toFixed(1)} MW</div>
            </div>
          </div>
          ${overloaded.length ? `
            <div style="border-top:1px solid var(--color-border); padding-top:8px;">
              <div style="font-size:0.72rem; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:6px;">Overloaded lines detected (before trip)</div>
              <table style="width:100%; font-size:0.82rem; border-collapse:collapse;">
                <thead>
                  <tr style="color:var(--color-text-muted);">
                    <th style="text-align:left; padding:3px 6px;">Line</th>
                    <th style="text-align:right; padding:3px 6px;">Flow (MW)</th>
                    <th style="text-align:right; padding:3px 6px;">Limit (MW)</th>
                    <th style="text-align:right; padding:3px 6px;">Overload</th>
                  </tr>
                </thead>
                <tbody>
                  ${overloaded.map(ol => `
                    <tr>
                      <td style="padding:3px 6px; font-weight:600;">${ol.label}</td>
                      <td style="padding:3px 6px; text-align:right; color:#ff9040;">${ol.flow_mw.toFixed(1)}</td>
                      <td style="padding:3px 6px; text-align:right;">${ol.thermal_limit}</td>
                      <td style="padding:3px 6px; text-align:right; color:#ff4040; font-weight:700;">${((Math.abs(ol.flow_mw) / ol.thermal_limit - 1) * 100).toFixed(0)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          <div style="margin-top:8px; font-size:0.79rem; color:var(--color-text-muted);">
            Active after round: ${rnd.active_buses.length} buses, ${rnd.active_lines.length} lines
          </div>
        `;
      }

      runBtn.onclick = async () => {
        const type = typeSelect.value;
        const id   = parseInt(compSelect.value, 10);
        runBtn.disabled = true;
        runBtn.textContent = 'Simulating…';
        statusEl.textContent = '';
        navigatorEl.style.display = 'none';
        graphInstance.setCascadeRound(null); // reset overlay

        try {
          const res = await fetch('/api/simulation/cascade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, id }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          cascadeResult = await res.json();

          const shed    = cascadeResult.total_load_shed_mw;
          const total   = cascadeResult.total_load_mw;
          const pctShed = total > 0 ? (shed / total * 100).toFixed(1) : '0.0';
          const nRounds = cascadeResult.rounds.length;
          statusEl.innerHTML = `
            <span style="color:var(--color-accent-gold); font-weight:600;">
              ${cascadeResult.converged ? '✓ Cascade converged' : '⚠ Max rounds reached'} —
              ${nRounds} round(s), ${shed.toFixed(1)} MW shed (${pctShed}% of total load).
            </span>
          `;

          resetBtn2.style.display = 'inline-flex';
          navigatorEl.style.display = 'block';
          renderRound(0);
        } catch (e) {
          statusEl.innerHTML = `<span style="color:#ff4040;">Error: ${e.message}</span>`;
        } finally {
          runBtn.disabled = false;
          runBtn.textContent = 'Run Cascade';
        }
      };

      prevBtn.onclick = () => { if (currentRoundIdx > 0) renderRound(currentRoundIdx - 1); };
      nextBtn.onclick = () => { if (cascadeResult && currentRoundIdx < cascadeResult.rounds.length - 1) renderRound(currentRoundIdx + 1); };

      resetBtn2.onclick = () => {
        cascadeResult = null;
        currentRoundIdx = 0;
        navigatorEl.style.display = 'none';
        resetBtn2.style.display = 'none';
        statusEl.textContent = '';
        graphInstance.setCascadeRound(null);
      };

      // ── Accessible Substation Table ────────────────────────────────────────
      const tableRows = net.nodes.map(n => {
        const v = byId[n.id];
        return [
          busLblMap[n.id] || n.name,
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
          ['Bus', 'Type', 'Voltage', 'Incident Loading Risk', 'Priority Score', 'Rank', 'Articulation Point'],
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
      subtitle: 'Explore connections, incident line loadings, inspect substations, and simulate DC cascade failures.',
      actionHint: 'Click any node to inspect its structural centrality. Use the Cascade Simulation panel to step through overload-driven trip sequences.',
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
