#implementation written during the Computer Science students'class
import numpy as np
population_size = 10
evolution_rounds = 5

def count_conflicts(queens_positions, n):
    conflicts_row = [0] * n
    conflicts_pos_diag = [0] * (2*n - 1)
    conflicts_neg_diag = [0] * (2*n - 1)

    for col in range(n):
        row = queens_positions[col]
        conflicts_row[row] += 1
        conflicts_pos_diag[row + col] += 1
        conflicts_neg_diag[row - col + n - 1] += 1
    
    conflicts_count = 0

    for conflict in conflicts_row:
        conflicts_count += (conflict-1) if conflict > 1 else 0
    
    for conflict in conflicts_pos_diag:
        conflicts_count += (conflict-1) if conflict > 1 else 0

    for conflict in conflicts_neg_diag:
        conflicts_count += (conflict-1) if conflict > 1 else 0

    return conflicts_count
    
def tournament_selection(population):
    m = len(population)  
    survivors = [] 
    midway = (m // 2)    
    for i in range(midway):
        if count_conflicts(population[i]) < count_conflicts(population[i+midway]):
            survivors.append(population[i])
        else:
            survivors.append(population[i+midway])
    return survivors

def crossover(parent_a, parent_b, n):
    start = np.random.randint(0, n-1)
    finish = np.random.randint(start, n)

    subpath_from_a = parent_a[start:finish]
    remaining_path_from_b = [gene for gene in parent_b if gene not in subpath_from_a]
    child = []
    for i in range(n):
        if start <= i < finish:
            child.append(subpath_from_a.pop(0))
        else:
            child.append(remaining_path_from_b.pop(0))

def main():
    n = 5
    population = []
    for i in range(population_size):
        queens_positions = list(range(n))
        np.random.shuffle(queens_positions)
        population.append(queens_positions)
    
    # print(count_conflicts(list([3,2,3,2]), 4))
    for r in range(evolution_rounds):
        parents = tournament_selection(population)
        midway = n // 4
        for i in range(midway):
            child_1 = crossover(parents[i], parents[i+midway], n)
            child_2 = crossover(parents[i+midway], parents[i], n)

            if np.random.randint(0, 100) < 10:
                start = np.random.randint(0, n-1)
                finish = np.random.randint(start, n-1)
                child_1[start], child_1[finish] = child_1[finish], child_1[start]

            if np.random.randint(0, 100) < 10:
                start = np.random.randint(0, n-1)
                finish = np.random.randint(start, n-1)
                child_2[start], child_2[finish] = child_2[finish], child_2[start]

            parents.append(child_1)
            parents.append(child_2)

    population = parents



if __name__ == "__main__":
    main()