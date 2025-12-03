def crossover(n, p1, p2, cut):
    path = p1[:cut]
    remaining_path = [gene for gene in p2 if gene not in path]
    return path + remaining_path

if __name__ == '__main__':
    n = 5
    p1 = [1, 2, 3, 4, 5]
    p2 = [2, 3, 4, 5, 1]
    cut = 2
    child1 = crossover(n, p1, p2, cut)
    child2 = crossover(n, p2, p1, cut)