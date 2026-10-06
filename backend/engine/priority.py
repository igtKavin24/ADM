from backend.config import (PRIORITY_WEIGHTS, IEEE14_LINES, IEEE14_LOADS, IEEE14_GENERATORS)


def calculate_priority(risk, criticality, vulnerability, impact, weights=None):
    w = weights or PRIORITY_WEIGHTS
    score = (risk * w['risk'] + criticality * w['criticality']
             + vulnerability * w['vulnerability'] + impact * w['impact'])
    return max(0.0, min(1.0, score))


def node_risks(state, node_ids):
    """Risk of a node = highest loading ratio (capped at 1) among its incident lines."""
    risks = {n: 0.0 for n in node_ids}
    for line in IEEE14_LINES:
        rho = min(float(state.get(f"rho_{line['id']}", 0.0)), 1.0)
        for end in (line['from'], line['to']):
            if end in risks:
                risks[end] = max(risks[end], rho)
    return risks


def node_impact(node_ids):
    """Consequence of losing a node: its share of load or generation capacity, scaled to 0-1."""
    load = {n: 0.0 for n in node_ids}
    gen = {n: 0.0 for n in node_ids}
    for l in IEEE14_LOADS:
        load[l['sub']] += l['p_mw']
    for g in IEEE14_GENERATORS:
        gen[g['sub']] += g['max_mw']
    tl, tg = sum(load.values()), sum(gen.values())
    raw = {n: max(load[n] / tl, gen[n] / tg) for n in node_ids}
    top = max(raw.values()) or 1.0
    return {n: raw[n] / top for n in node_ids}


def explain(c):
    reasons = []
    if c['risk_score'] > 0.7:
        reasons.append(f"high line loading ({c['risk_score'] * 100:.0f}% of thermal limit)")
    if c['criticality'] > 0.5:
        reasons.append(f"high network centrality ({c['criticality'] * 100:.0f}% of the maximum betweenness)")
    if c['is_articulation_point']:
        reasons.append("being an articulation point whose loss splits the grid")
    if c['impact'] > 0.7:
        reasons.append("large load or generation share")
    reasons = reasons or ["moderate risk and structural importance"]
    return f"{c['name']} ranks #{c['rank']} (score {c['priority_score']}) due to: {', '.join(reasons)}."


def rank_nodes(grid, analysis, state):
    """Rank every substation by the weighted priority score."""
    ids = list(grid.nodes)
    risks = node_risks(state, ids)
    impact = node_impact(ids)
    max_c = max(analysis['centrality'].values()) or 1.0
    max_red = max(len(grid.get_neighbors(n)) - 1 for n in ids) or 1
    art = set(analysis['articulation_points'])

    rows = []
    for n in ids:
        crit = analysis['centrality'][n] / max_c
        vuln = 1.0 if n in art else 1 - max(0, len(grid.get_neighbors(n)) - 1) / max_red
        rows.append({
            'id': n, 'name': grid.nodes[n]['name'], 'type': grid.nodes[n]['type'],
            'risk_score': round(risks[n], 4), 'criticality': round(crit, 4),
            'vulnerability': round(vuln, 4), 'impact': round(impact[n], 4),
            'is_articulation_point': n in art, 'degree': analysis['degrees'][n],
            'priority_score': round(calculate_priority(risks[n], crit, vuln, impact[n]), 4),
        })
    rows.sort(key=lambda r: r['priority_score'], reverse=True)
    for i, r in enumerate(rows, 1):
        r['rank'] = i
        r['explanation'] = explain(r)
    return rows
