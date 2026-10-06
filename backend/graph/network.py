import copy
from collections import deque
from backend.config import IEEE14_SUBSTATIONS, IEEE14_LINES

class PowerGrid:
    def __init__(self):
        self.nodes = {}
        self.edges = {}
        self.adj = {}

    def build_from_config(self):
        for sub in IEEE14_SUBSTATIONS:
            self.add_node(sub['id'], copy.deepcopy(sub))
        for line in IEEE14_LINES:
            self.add_edge(line['id'], line['from'], line['to'], copy.deepcopy(line))
        return self
        
    def add_node(self, node_id, data):
        self.nodes[node_id] = data
        if node_id not in self.adj:
            self.adj[node_id] = set()
            
    def add_edge(self, edge_id, from_node, to_node, data):
        self.edges[edge_id] = data
        data['from'] = from_node
        data['to'] = to_node
        data['id'] = edge_id
        self.adj[from_node].add(to_node)
        self.adj[to_node].add(from_node)
        
    def remove_node(self, node_id):
        if node_id in self.nodes:
            del self.nodes[node_id]
        if node_id in self.adj:
            for neighbor in list(self.adj[node_id]):
                self.adj[neighbor].remove(node_id)
            del self.adj[node_id]
        edges_to_remove = [eid for eid, edata in self.edges.items() 
                           if edata['from'] == node_id or edata['to'] == node_id]
        for eid in edges_to_remove:
            del self.edges[eid]
            
    def remove_edge(self, edge_id):
        if edge_id in self.edges:
            edata = self.edges[edge_id]
            u, v = edata['from'], edata['to']
            if u in self.adj and v in self.adj[u]:
                self.adj[u].remove(v)
            if v in self.adj and u in self.adj[v]:
                self.adj[v].remove(u)
            del self.edges[edge_id]
            
    def get_neighbors(self, node):
        return list(self.adj.get(node, []))
        
    def bfs(self, start):
        visited = set([start])
        queue = deque([(start, 0)])
        distances = {start: 0}
        
        while queue:
            curr, dist = queue.popleft()
            for neighbor in self.adj.get(curr, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    distances[neighbor] = dist + 1
                    queue.append((neighbor, dist + 1))
        return visited, distances
        
    def dfs(self, start, visited=None):
        if visited is None:
            visited = set()
        visited.add(start)
        order = [start]
        for neighbor in self.adj.get(start, []):
            if neighbor not in visited:
                order.extend(self.dfs(neighbor, visited))
        return order
        
    def connected_components(self):
        visited = set()
        components = []
        for node in self.nodes:
            if node not in visited:
                comp, _ = self.bfs(node)
                components.append(comp)
                visited.update(comp)
        return components
        
    def is_connected(self):
        if not self.nodes: return True
        start_node = next(iter(self.nodes.keys()))
        comp, _ = self.bfs(start_node)
        return len(comp) == len(self.nodes)
        
    def shortest_path(self, start, end):
        visited = set([start])
        queue = deque([(start, [start])])
        
        while queue:
            curr, path = queue.popleft()
            if curr == end:
                return path
            for neighbor in self.adj.get(curr, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))
        return None
        
    def all_paths(self, start, end, max_depth, current_path=None):
        if current_path is None:
            current_path = [start]
            
        if start == end:
            return [current_path]
            
        if len(current_path) > max_depth:
            return []
            
        paths = []
        for neighbor in self.adj.get(start, []):
            if neighbor not in current_path:
                paths.extend(self.all_paths(neighbor, end, max_depth, current_path + [neighbor]))
        return paths

def build_from_config():
    grid = PowerGrid()
    for sub in IEEE14_SUBSTATIONS:
        grid.add_node(sub['id'], copy.deepcopy(sub))
    for line in IEEE14_LINES:
        grid.add_edge(line['id'], line['from'], line['to'], copy.deepcopy(line))
    return grid
