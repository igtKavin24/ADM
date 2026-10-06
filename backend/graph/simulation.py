import copy
from backend.graph.network import PowerGrid

class OutageSimulator:
    def __init__(self, baseline_grid):
        self.baseline = baseline_grid
        
    def simulate_node_outage(self, node_id):
        if node_id not in self.baseline.nodes:
            raise ValueError(f"Node {node_id} not found.")
            
        sim_grid = copy.deepcopy(self.baseline)
        
        comps_before = len(sim_grid.connected_components())
        sim_grid.remove_node(node_id)
        comps_after = len(sim_grid.connected_components())
        
        return {
            'affected_nodes': [node_id],
            'connectivity_change': comps_after - comps_before,
            'load_lost_mw': 0, 
            'gen_lost_mw': 0, 
            'components_before': comps_before,
            'components_after': comps_after
        }
        
    def simulate_edge_outage(self, edge_id):
        if edge_id not in self.baseline.edges:
            raise ValueError(f"Edge {edge_id} not found.")
            
        sim_grid = copy.deepcopy(self.baseline)
        
        comps_before = len(sim_grid.connected_components())
        sim_grid.remove_edge(edge_id)
        comps_after = len(sim_grid.connected_components())
        
        return {
            'affected_edges': [edge_id],
            'connectivity_change': comps_after - comps_before,
            'load_lost_mw': 0,
            'gen_lost_mw': 0,
            'components_before': comps_before,
            'components_after': comps_after
        }
