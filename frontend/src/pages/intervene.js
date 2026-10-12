import { api } from '../api.js';
import { createCard } from '../components/card.js';
import { page, select, button, stat, text, createDisclosure } from '../components/page.js';
import { pct, num } from '../utils/format.js';

export function intervenePage() {
  return page(
    'Intervention planner',
    async () => {
      const data = await api.getInterventions();
      const out = document.createElement('div');
      const boxes = [];

      const candidateList = document.createElement('div');
      candidateList.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:10px;';

      data.candidates.forEach(c => {
        const itemCard = document.createElement('label');
        itemCard.style.cssText = `
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-btn);
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.15s;
        `;

        const cb = Object.assign(document.createElement('input'), {
          type: 'checkbox',
          value: c.id
        });
        boxes.push(cb);

        const info = document.createElement('div');
        info.innerHTML = `
          <div style="font-weight:600; font-size:0.88rem; color:var(--color-text-primary);">${c.name}</div>
          <div style="font-size:0.75rem; color:var(--color-text-secondary);">
            Priority score: <strong>${num(c.priority_score, 3)}</strong> • Cost: 1 prototype budget unit
          </div>
        `;

        itemCard.append(cb, info);
        itemCard.addEventListener('mouseover', () => itemCard.style.background = 'var(--color-bg-hover)');
        itemCard.addEventListener('mouseout', () => itemCard.style.background = 'var(--color-bg-surface)');
        candidateList.appendChild(itemCard);
      });

      const budgetSelect = select(
        Array.from({ length: data.max_budget }, (_, i) => [i + 1, `Max ${i + 1} substations (${i + 1} budget units)`]),
        data.default_budget
      );

      const budgetStatus = document.createElement('div');
      budgetStatus.style.cssText = 'font-size:0.84rem; color:var(--color-accent-gold-light); font-weight:600; margin-top:8px;';

      const updateBudgetStatus = () => {
        const count = boxes.filter(b => b.checked).length;
        const max = Number(budgetSelect.value);
        budgetStatus.textContent = `Selected: ${count} of ${max} allocated budget units (${max - count >= 0 ? max - count : 0} remaining).`;
        if (count > max) {
          budgetStatus.style.color = '#ff9e9e';
          budgetStatus.textContent += ' ⚠️ Selection exceeds chosen budget.';
        } else {
          budgetStatus.style.color = 'var(--color-accent-gold-light)';
        }
      };

      boxes.forEach(b => b.addEventListener('change', updateBudgetStatus));
      budgetSelect.addEventListener('change', updateBudgetStatus);
      updateBudgetStatus();

      const summaryGrid = (r, strategyTitle = 'Evaluated Selection') => {
        const container = document.createElement('div');

        // Simulation Assumptions Disclosure
        const notice = document.createElement('div');
        notice.className = 'assumption-notice';
        notice.innerHTML = `
          <strong>Simulation assumptions:</strong> In this prototype, a protected substation is modelled as surviving a simulated double-substation failure event. Results are averaged over <strong>200 synthetic risk-weighted failure scenarios</strong>. Displayed cost represents hardened substation count (1 unit per substation), not monetary currency.
        `;
        container.appendChild(notice);

        const grid = document.createElement('div');
        grid.className = 'grid-3';
        grid.append(
          createCard(
            'LOAD SERVED GAIN',
            stat(
              `+${pct(r.load_served_gain, 1)}`,
              'Percentage-point improvement',
              `${pct(r.baseline.avg_load_served, 1)} baseline → ${pct(r.outcome.avg_load_served, 1)} protected`
            )
          ),
          createCard(
            'AFFECTED SUBSTATIONS',
            stat(
              `-${num(r.affected_reduction, 2)}`,
              'Fewer affected buses per event',
              `${num(r.baseline.avg_affected, 2)} baseline → ${num(r.outcome.avg_affected, 2)} protected`
            )
          ),
          createCard(
            'BUDGET UNITS CONSUMED',
            stat(
              `${r.total_cost}`,
              'Substations hardened',
              `Hardened: ${r.selected.map(id => `Sub_${id}`).join(', ') || 'None'}`
            )
          )
        );
        container.appendChild(grid);
        return container;
      };

      const showAction = fn => async () => {
        out.replaceChildren(text('p', 'Evaluating failure scenarios under prototype assumptions...', 'color:var(--color-text-secondary);'));
        try {
          out.replaceChildren(await fn());
        } catch (e) {
          out.replaceChildren(text('p', `Action Error: ${e.message}`, 'color:var(--color-risk-critical);'));
        }
      };

      const evaluateUserSelection = showAction(async () => {
        const ids = boxes.filter(b => b.checked).map(b => Number(b.value));
        if (!ids.length) {
          throw new Error('Please check at least one substation before evaluating.');
        }
        const res = await api.evaluateInterventions(ids);
        return summaryGrid(res, 'User Custom Selection');
      });

      const suggestSelection = showAction(async () => {
        const budgetVal = Number(budgetSelect.value);
        const r = await api.optimizeInterventions(budgetVal);
        
        // Auto-check suggested boxes in UI
        const suggestedIds = new Set(r.system_recommendation.map(c => c.id));
        boxes.forEach(b => {
          b.checked = suggestedIds.has(Number(b.value));
        });
        updateBudgetStatus();

        const div = document.createElement('div');
        const headerNote = document.createElement('div');
        headerNote.style.cssText = 'background:rgba(201,168,76,0.1); border:1px solid var(--color-border); border-radius:var(--radius-btn); padding:10px 14px; margin-bottom:12px; font-size:0.88rem;';
        headerNote.innerHTML = `
          <strong>JARASANDHA Heuristic Recommendation:</strong> Hardening <strong>${r.system_recommendation.map(c => c.name).join(', ')}</strong> (Top ${budgetVal} highest heuristic priority substations).
        `;
        div.append(headerNote, summaryGrid(r.system, 'Heuristic Recommended Selection'));
        return div;
      });

      const root = document.createElement('div');
      const controls = document.createElement('div');
      controls.className = 'controls';
      controls.append(
        text('label', 'Protection Budget:', 'font-size:0.86rem; color:var(--color-text-secondary);'),
        budgetSelect,
        button('Suggest a selection', suggestSelection, true),
        button('Evaluate my selection', evaluateUserSelection, false)
      );

      const candidateCard = createCard('CANDIDATE SUBSTATIONS FOR HARDENING', candidateList, {
        footer: budgetStatus
      });

      root.append(candidateCard, controls, out);

      // Pre-run suggestion for immediate reviewer visibility
      suggestSelection();

      return root;
    },
    {
      subtitle: 'Compare candidate protections under a stated simulation budget.',
      actionHint: 'Allocate a protection budget and click "Suggest a selection" or choose candidate substations manually to evaluate resilience gains.',
      nextStep: {
        title: 'Compare Strategies Against Baselines',
        description: 'Benchmark JARASANDHA’s heuristic against standard graph degree baselines under identical scenario conditions.',
        linkText: 'Compare Strategies →',
        linkHref: '#compare'
      }
    }
  );
}
