from backend.engine.experiment import make_scenarios, evaluate, select_targets
from backend.config import RANDOM_SEED
import numpy as np


def get_candidates(ranking, limit=8):
    return [{
        'id': r['id'], 'name': f"Harden {r['name']}", 'target': r['name'],
        'type': 'harden_substation', 'cost': 1, 'priority_score': r['priority_score'],
    } for r in ranking[:limit]]


def evaluate_selection(simulator, ranking, selected_ids, n_scenarios=200):
    scenarios = make_scenarios(ranking, n_scenarios)
    base = evaluate(simulator, [], scenarios)
    res = evaluate(simulator, selected_ids, scenarios)
    return {
        'selected': res['protected'], 'total_cost': len(res['protected']),
        'baseline': base, 'outcome': res,
        'load_served_gain': round(res['avg_load_served'] - base['avg_load_served'], 4),
        'affected_reduction': round(base['avg_affected'] - res['avg_affected'], 3),
    }


def optimize(simulator, ranking, budget, n_scenarios=200):
    """Recommend the top-priority substations and compare against a highest-degree baseline."""
    rng = np.random.RandomState(RANDOM_SEED)
    system = select_targets('jarasandha_optimized', budget, ranking, rng)
    baseline = select_targets('degree_based', budget, ranking, rng)
    sys_eval = evaluate_selection(simulator, ranking, system, n_scenarios)
    base_eval = evaluate_selection(simulator, ranking, baseline, n_scenarios)
    return {
        'budget': budget,
        'system_recommendation': [c for c in get_candidates(ranking, len(ranking)) if c['id'] in system],
        'system': sys_eval, 'baseline': base_eval, 'baseline_name': 'Highest-degree substations',
        'advantage_percent': round((sys_eval['outcome']['avg_load_served']
                                    - base_eval['outcome']['avg_load_served']) * 100, 2),
    }
