import heapq

def beam_search(graph, start, goal, h, beam_width):
    
    beam = [(start, [start], 0)]
    
    while beam:
        new_beam = []
        for node, path, cost_so_far in beam:
            
            if node == goal:
                return path, cost_so_far
            
            #each node in beam has at most b children
            for neighbor, edge_cost in graph.get(node, []):
                new_beam.append(
                    (neighbor, path + [neighbor], cost_so_far + edge_cost)
                )
                
        new_beam.sort(key=lambda x: h[x[0]])
        beam = new_beam[:beam_width]
            
    
    return None, -1


if __name__ == "__main__":
    N, M = map(int, input().split())

    edges = []
    for _ in range(M):
        u, v, cost = input().split()
        cost = int(cost)
        edges.append((u, v, cost))

    h = {}
    for _ in range(N):
        node, value = input().split()
        h[node] = int(value)

    start, goal = input().split()
    l = int(input())

    graph = {}
    for u, v, cost in edges:
        if u not in graph:
            graph[u] = []
        graph[u].append((v, cost))

    path, cost = beam_search(graph, start, goal, h, l)

    if path is None:
        print("-1")
    else:
        print(" ".join(path))
        print(cost)