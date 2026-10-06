from backend.graph.network import PowerGrid

def degree_analysis(grid):
    return {node: len(neighbors) for node, neighbors in grid.adj.items()}

def find_articulation_points(grid):
    visited = set()
    articulation_points = set()
    discovery_time = {}
    low = {}
    parent = {}
    time = 0
    
    def dfs_ap(u):
        nonlocal time
        visited.add(u)
        time += 1
        discovery_time[u] = time
        low[u] = time
        children = 0
        
        for v in grid.adj.get(u, []):
            if v not in visited:
                parent[v] = u
                children += 1
                dfs_ap(v)
                low[u] = min(low[u], low[v])
                
                if parent.get(u) is None and children > 1:
                    articulation_points.add(u)
                if parent.get(u) is not None and low[v] >= discovery_time[u]:
                    articulation_points.add(u)
            elif v != parent.get(u):
                low[u] = min(low[u], discovery_time[v])
                
    for node in grid.nodes:
        if node not in visited:
            dfs_ap(node)
            
    return articulation_points

def find_bridges(grid):
    visited = set()
    bridges = set()
    discovery_time = {}
    low = {}
    parent = {}
    time = 0
    
    def dfs_bridge(u):
        nonlocal time
        visited.add(u)
        time += 1
        discovery_time[u] = time
        low[u] = time
        
        for v in grid.adj.get(u, []):
            if v not in visited:
                parent[v] = u
                dfs_bridge(v)
                low[u] = min(low[u], low[v])
                if low[v] > discovery_time[u]:
                    for eid, edata in grid.edges.items():
                        if (edata['from'] == u and edata['to'] == v) or (edata['from'] == v and edata['to'] == u):
                            bridges.add(eid)
            elif v != parent.get(u):
                low[u] = min(low[u], discovery_time[v])
                
    for node in grid.nodes:
        if node not in visited:
            dfs_bridge(node)
            
    return bridges

def betweenness_centrality(grid):
    cb = {v: 0.0 for v in grid.nodes}
    for s in grid.nodes:
        S = []
        P = {w: [] for w in grid.nodes}
        sigma = {w: 0 for w in grid.nodes}
        sigma[s] = 1
        d = {w: -1 for w in grid.nodes}
        d[s] = 0
        Q = [s]
        
        while Q:
            v = Q.pop(0)
            S.append(v)
            for w in grid.adj.get(v, []):
                if d[w] < 0:
                    Q.append(w)
                    d[w] = d[v] + 1
                if d[w] == d[v] + 1:
                    sigma[w] += sigma[v]
                    P[w].append(v)
                    
        delta = {w: 0.0 for w in grid.nodes}
        while S:
            w = S.pop()
            for v in P[w]:
                if sigma[w] != 0:
                    delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w])
            if w != s:
                cb[w] += delta[w]
                
    return {k: v/2 for k, v in cb.items()}

def path_redundancy(grid, node):
    neighbors = grid.get_neighbors(node)
    return max(0, len(neighbors) - 1)

def component_impact(grid, node):
    import copy
    temp_grid = copy.deepcopy(grid)
    temp_grid.remove_node(node)
    if not temp_grid.nodes: return 1.0
    comps = temp_grid.connected_components()
    max_comp_size = max(len(c) for c in comps)
    return 1.0 - (max_comp_size / len(grid.nodes))

def full_analysis(grid):
    return {
        'degrees': degree_analysis(grid),
        'articulation_points': list(find_articulation_points(grid)),
        'bridges': list(find_bridges(grid)),
        'centrality': betweenness_centrality(grid)
    }
