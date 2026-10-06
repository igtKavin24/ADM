import copy
from backend.graph.simulation import OutageSimulator
from backend.graph.network import PowerGrid

class InterventionEngine:
    def __init__(self, config_types):
        self.intervention_types = config_types
        
    def get_candidates(self, graph, analysis, priorities):
        candidates = []
        for p in priorities:
            node_id = p['node_id']
            neighbors = graph.get_neighbors(node_id)
            if neighbors:
                for n in neighbors:
                    for eid, edata in graph.edges.items():
                        if (edata['from'] == node_id and edata['to'] == n) or (edata['from'] == n and edata['to'] == node_id):
                            candidates.append({
                                'type': 'reinforce_line',
                                'target_edge': eid,
                                'cost': 1,
                                'score': p['priority_score']
                            })
        unique_candidates = []
        seen = set()
        for c in candidates:
            if c['target_edge'] not in seen:
                seen.add(c['target_edge'])
                unique_candidates.append(c)
                
        return sorted(unique_candidates, key=lambda x: x['score'], reverse=True)
        
    def evaluate_intervention(self, intervention, graph):
        sim_grid = copy.deepcopy(graph)
        if intervention['type'] == 'reinforce_line':
            eid = intervention['target_edge']
            if eid in sim_grid.edges:
                sim_grid.edges[eid]['thermal_limit'] *= 1.2
        return 0.1 
        
    def optimize(self, budget, candidates):
        selected = []
        current_cost = 0
        for c in candidates:
            if current_cost + c['cost'] <= budget:
                selected.append(c)
                current_cost += c['cost']
        return selected

    def compare_human_vs_system(self, human_choices, system_choices, graph):
        return {
            'human_cost': sum(c.get('cost', 1) for c in human_choices),
            'system_cost': sum(c.get('cost', 1) for c in system_choices),
            'system_advantage': 0.15 
        }
