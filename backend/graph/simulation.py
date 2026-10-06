import copy
from backend.config import IEEE14_LOADS, IEEE14_GENERATORS


class OutageSimulator:
    """Structural outage simulation on the grid graph (not an electrical power flow)."""

    def __init__(self, baseline_grid):
        self.baseline = baseline_grid
        self.load_mw, self.gen_mw = {}, {}
        for l in IEEE14_LOADS:
            self.load_mw[l['sub']] = self.load_mw.get(l['sub'], 0) + l['p_mw']
        for g in IEEE14_GENERATORS:
            self.gen_mw[g['sub']] = self.gen_mw.get(g['sub'], 0) + g['max_mw']
        self.total_load = sum(self.load_mw.values())
        self.n_nodes = len(baseline_grid.nodes)

    def simulate(self, nodes=(), edges=()):
        """Remove nodes/edges. Load is lost at removed nodes and in islands with no generator."""
        for n in nodes:
            if n not in self.baseline.nodes:
                raise ValueError(f"Node {n} not found.")
        for e in edges:
            if e not in self.baseline.edges:
                raise ValueError(f"Edge {e} not found.")

        grid = copy.deepcopy(self.baseline)
        before = len(grid.connected_components())
        for e in edges:
            grid.remove_edge(e)
        for n in nodes:
            grid.remove_node(n)
        comps = grid.connected_components()

        lost_load = sum(self.load_mw.get(n, 0) for n in nodes)
        lost_gen = sum(self.gen_mw.get(n, 0) for n in nodes)
        affected = list(nodes)
        for c in comps:
            if not any(n in self.gen_mw for n in c):
                lost_load += sum(self.load_mw.get(n, 0) for n in c)
                affected += sorted(c)
        largest = max((len(c) for c in comps), default=0)
        return {
            'affected_nodes': affected,
            'removed_edges': list(edges),
            'components_before': before,
            'components_after': len(comps),
            'connectivity_change': len(comps) - before,
            'largest_component_fraction': round(largest / self.n_nodes, 4),
            'load_lost_mw': round(lost_load, 2),
            'gen_lost_mw': round(lost_gen, 2),
            'load_served_fraction': round(1 - lost_load / self.total_load, 4),
        }

    def simulate_node_outage(self, node_id):
        return self.simulate(nodes=[node_id])

    def simulate_edge_outage(self, edge_id):
        return self.simulate(edges=[edge_id])
