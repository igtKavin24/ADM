import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { page, table, text } from '../components/page.js';
import { pct, num } from '../utils/format.js';

export function methodologyPage() {
  return page('METHODOLOGY', async () => {
    const [prov, m] = await Promise.all([api.getProvenance(), api.getModelMetrics()]);
    const gb = m.gradient_boosting;
    const root = document.createElement('div');
    const limits = document.createElement('ul');
    limits.style.paddingLeft = '20px';
    prov.limitations.forEach(l => limits.appendChild(text('li', l, 'margin-bottom:6px')));
    root.append(
      createCard('DATA', table(['Item', 'Value'], [['Dataset', prov.name], ['Type', prov.type], ['Rows / scenarios', `${prov.n_rows} / ${prov.n_scenarios}`], ['Step length', `${prov.timestep_minutes} min`], ['Split', 'By scenario: 70% train / 15% val / 15% test']])),
      createCard('MODEL (TEST SET)', table(['Model', 'Accuracy', 'Macro F1'], [
        ['Majority-class baseline', pct(gb.majority_baseline_accuracy), '—'],
        ['Logistic regression', pct(m.logistic_regression.accuracy), num(m.logistic_regression.macro_f1)],
        ['Gradient boosting (LightGBM)', pct(gb.accuracy), num(gb.macro_f1)]])),
      createCard('PRIORITY FORMULA', text('p', `Priority = ${Object.entries(prov.priority_weights).map(([k, v]) => `${v}·${k}`).join(' + ')}`)),
      createCard('LIMITATIONS', limits),
    );
    return root;
  });
}
