import heapq


def a_star(graph, start, goal, h):
    priority_queue = []
    # node in queue = (f_score, node, path from start to node)
    #the heuristic is consistent
    heapq.heappush(priority_queue, (h[start], start, [start]))
 
    g_score = {node : float('inf') for node in h}
    g_score[start] = 0
    

    while priority_queue:
        _, node, path = heapq.heappop(priority_queue)

        if node == goal:
            return path, g_score[goal]

        for neighbor, edge_cost in graph.get(node, []):
            
            if g_score[node] + edge_cost < g_score[neighbor]:
                
                g_score[neighbor] = g_score[node] + edge_cost
                f_score_node = g_score[neighbor] + h[neighbor]
                
                heapq.heappush(
                    priority_queue,
                    (f_score_node, neighbor, path + [neighbor])
                )

    return None, None


if __name__ == "__main__":
    N, M = map(int, input().split())

    edges = []
    for _ in range(M):
        u, v, cost = input().split()
        cost = int(cost)
        edges.append((u, v, cost))

    heuristic = {}
    for _ in range(N):
        node, h = input().split()
        heuristic[node] = int(h)

    start, goal = input().split()

    graph = {}
    for u, v, cost in edges:
        if u not in graph:
            graph[u] = []
        graph[u].append((v, cost))


    path, total_cost = a_star(graph, start, goal, heuristic)

    if path is None:
        print("-1")
    else:
        separator = ' '
        output_string = separator.join(path)
        print(output_string)
        print(total_cost)