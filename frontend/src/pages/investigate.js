import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { page, table, text } from '../components/page.js';
import { num } from '../utils/format.js';

export function investigatePage() {
  return page('INVESTIGATE VULNERABILITIES', async () => {
    const data = await api.getVulnerabilities();
    const rows = data.vulnerabilities;
    const root = document.createElement('div');
    const why = text('p', rows[0].explanation);
    const t = table(
      ['#', 'Substation', 'Type', 'Risk', 'Criticality', 'Vulnerability', 'Impact', 'Priority'],
      rows.map(r => [r.rank, r.name, r.type, num(r.risk_score), num(r.criticality), num(r.vulnerability), num(r.impact), num(r.priority_score)]),
      i => { why.textContent = rows[i].explanation; },
    );
    const w = data.weights;
    root.append(
      createCard('WHY IT RANKS HERE', why),
      createCard('PRIORITY RANKING', t),
      text('p', `${data.formula}. Weights: risk ${w.risk}, criticality ${w.criticality}, vulnerability ${w.vulnerability}, impact ${w.impact} (${data.weight_type}). Click a row for its explanation.`, 'note'),
    );
    return root;
  });
}
