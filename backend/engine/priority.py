from backend.config import PRIORITY_WEIGHTS

def calculate_priority(risk, criticality, vulnerability, impact, weights=None):
    if weights is None:
        weights = PRIORITY_WEIGHTS
        
    score = (
        risk * weights.get('risk', 0) +
        criticality * weights.get('criticality', 0) +
        vulnerability * weights.get('vulnerability', 0) +
        impact * weights.get('impact', 0)
    )
    
    return max(0.0, min(1.0, score))

def rank_components(ml_risks, graph_analysis, weights=None):
    if weights is None:
        weights = PRIORITY_WEIGHTS
        
    centrality = graph_analysis.get('centrality', {})
    max_c = max(centrality.values()) if centrality else 1.0
    if max_c == 0: max_c = 1.0
    
    ranking = []
    
    vulnerability_dict = graph_analysis.get('vulnerability', {})
    impact_dict = graph_analysis.get('impact', {})
    
    for node_id in ml_risks.keys():
        r = ml_risks.get(node_id, 0.0)
        c = centrality.get(node_id, 0.0) / max_c
        v = vulnerability_dict.get(node_id, 0.0)
        i = impact_dict.get(node_id, 0.0)
        
        priority = calculate_priority(r, c, v, i, weights)
        
        ranking.append({
            'node_id': node_id,
            'risk': r,
            'criticality': c,
            'vulnerability': v,
            'impact': i,
            'priority_score': priority
        })
        
    ranking.sort(key=lambda x: x['priority_score'], reverse=True)
    return ranking
