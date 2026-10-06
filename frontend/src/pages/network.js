import { api } from '../api.js';
import { createNetworkGraph } from '../components/networkGraph.js';
import { page, text } from '../components/page.js';
import { pct } from '../utils/format.js';

export function networkPage() {
  return page('NETWORK TOPOLOGY', async () => {
    const [net, vuln] = await Promise.all([api.getNetwork(), api.getVulnerabilities()]);
    const byId = Object.fromEntries(vuln.vulnerabilities.map(v => [v.id, v]));
    const risks = Object.fromEntries(vuln.vulnerabilities.map(v => [v.id, v.risk_score]));

    const root = document.createElement('div');
    const box = document.createElement('div');
    box.style.cssText = 'height:520px;background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:var(--radius-card)';
    const info = text('p', 'Click a substation for details. Colour = line loading (green <60%, gold <80%, red ≥80%).', 'margin-top:12px;color:var(--color-text-secondary)');
    createNetworkGraph(net, box, {
      risks,
      onClick: n => {
        const v = byId[n.id];
        info.textContent = `${n.name} (${n.type}) — loading ${pct(v.risk_score, 0)}, priority #${v.rank}. ${v.explanation}`;
      },
    });
    root.append(box, info);
    return root;
  });
}
