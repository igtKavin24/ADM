import numpy as np
from backend.config import RANDOM_SEED

STRATEGIES = [
    {"id": "random", "name": "Random Selection", "description": "Harden randomly chosen substations."},
    {"id": "degree_based", "name": "Highest Degree", "description": "Harden the most connected substations."},
    {"id": "centrality_based", "name": "Betweenness Centrality", "description": "Harden the biggest structural bottlenecks."},
    {"id": "ml_risk", "name": "ML Risk Only", "description": "Harden substations on the most heavily loaded lines."},
    {"id": "jarasandha_optimized", "name": "JARASANDHA Combined", "description": "Weighted risk + topology + consequence priority."},
]
_SORT_KEY = {
    'degree_based': 'degree', 'centrality_based': 'criticality',
    'ml_risk': 'risk_score', 'jarasandha_optimized': 'priority_score',
}


def select_targets(strategy, budget, ranking, rng):
    if strategy == 'random':
        return [int(n) for n in rng.choice([r['id'] for r in ranking], size=budget, replace=False)]
    top = sorted(ranking, key=lambda r: r[_SORT_KEY[strategy]], reverse=True)[:budget]
    return [r['id'] for r in top]


def make_scenarios(ranking, n_scenarios, n_failures=2, seed=RANDOM_SEED):
    """Failure scenarios: n_failures substations fail, more likely where risk is higher."""
    rng = np.random.RandomState(seed)
    ids = [r['id'] for r in ranking]
    w = np.array([r['risk_score'] + 0.05 for r in ranking])
    return [[int(n) for n in rng.choice(ids, size=n_failures, replace=False, p=w / w.sum())]
            for _ in range(n_scenarios)]


def evaluate(simulator, protected, scenarios):
    """Average outcome over scenarios; hardened substations survive their failure."""
    protected = set(protected)
    served, conn, affected = [], [], []
    for failed in scenarios:
        r = simulator.simulate(nodes=[n for n in failed if n not in protected])
        served.append(r['load_served_fraction'])
        conn.append(r['largest_component_fraction'])
        affected.append(len(r['affected_nodes']))
    return {
        'protected': sorted(protected),
        'avg_load_served': round(float(np.mean(served)), 4),
        'avg_connectivity': round(float(np.mean(conn)), 4),
        'avg_affected': round(float(np.mean(affected)), 3),
    }


def run_comparison(simulator, ranking, budget, n_scenarios, strategy_ids=None):
    scenarios = make_scenarios(ranking, n_scenarios)
    rng = np.random.RandomState(RANDOM_SEED)
    baseline = evaluate(simulator, [], scenarios)
    results = {}
    for s in STRATEGIES:
        if strategy_ids and s['id'] not in strategy_ids:
            continue
        res = evaluate(simulator, select_targets(s['id'], budget, ranking, rng), scenarios)
        res['load_served_gain'] = round(res['avg_load_served'] - baseline['avg_load_served'], 4)
        res['cost'] = budget
        results[s['id']] = res
    return {'budget': budget, 'n_scenarios': n_scenarios, 'baseline': baseline, 'results': results}
