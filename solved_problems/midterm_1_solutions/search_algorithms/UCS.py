import heapq


def ucs(graph, start, goal):
    priority_queue = []
    heapq.heappush(priority_queue, (0, start, [start]))
    visited = set()
    optimal_path_cost = {node : float('inf') for node in graph}
    optimal_path_cost[start] = 0

    while priority_queue:
        cost, node, path = heapq.heappop(priority_queue)

        if node in visited:
            continue

        visited.add(node)

        if node == goal:
            return path, cost

        for neighbor, edge_cost in graph.get(node, []):
            if neighbor not in visited or cost + edge_cost < optimal_path_cost[neighbor]:
                optimal_path_cost[neighbor] = cost + edge_cost
                heapq.heappush(
                    priority_queue,
                    (cost + edge_cost, neighbor, path + [neighbor])
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


    path, total_cost = ucs(graph, start, goal)

    if path is None:
        print("-1")
    else:
        separator = ' '
        output_string = separator.join(path)
        print(output_string)
        print(total_cost)
      