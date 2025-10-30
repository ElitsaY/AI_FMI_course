# --- Traveling Salesman Problem ---

# Raw TSP implementation using Genetic Algorithms
# still in progress
# https://www.youtube.com/watch?v=Wgn_aPH3OEk&t=692s

import random
import math

initial_population_size = 100


#generating the initial population
def generate_random_paths(total_destinations):
    population = []
    for _ in range(initial_population_size):
        random_path = list(range(1, total_destinations))
        random.shuffle(random_path)
        random_path = [0] + random_path
        population.append(random_path)
    return population

def total_distance(points, path):
    return sum(math.dist(points[path[i]], points[path[i + 1]]) for i in range(len(path) - 1))

#selection 
def choose_survivors(points, old_generation):
    survivors = [] # half the size of the old generation 
    random.shuffle(old_generation)
    midway = len(old_generation) // 2
    for i in range(midway):
        if total_distance(points, old_generation[i]) < total_distance(points, old_generation[midway + i]):
            survivors.append(old_generation[i])
        else: 
            survivors.append(old_generation[i + midway])
    return survivors


def create_offsprings(parent_a, parent_b):
    offspting = []
    start = random.randint(0, len(parent_a)  - 1)
    finish = random.randint(start, len(parent_a))
    sub_path_from_a = parent_a[start:finish]
    remaining_path_from_b = list([item for item in parent_b if item not in sub_path_from_a])
    for i in range(0, len(parent_a)):
        if start <= i < finish:
            offspting.append(sub_path_from_a.pop(0))
        else: 
            offspting.append(remaining_path_from_b.pop(0))

    return offspting

#crossover
def apply_crossover(survivors):
    offsprings = []
    midway = len(survivors) // 2
    for i in range(midway): 
        parent_a, parent_b = survivors[i], survivors[i + midway]
        #double the population
        for _ in range(2):
            offsprings.append(create_offsprings(parent_a, parent_b))
            offsprings.append(create_offsprings(parent_b, parent_a))
    return offsprings

#mutation
def apply_mutations(generation):
    gen_wt_mutations = []
    for path in generation:
        if random.randint(0, 1000) < 9:
            index1, index2 = random.randint(1, len(path) - 1), random.randint(1, len(path) - 1)
            path[index1], path[index2] = path[index2], path[index1]
        else:
            gen_wt_mutations.append(path)
    return gen_wt_mutations

# evolution cycle
def generate_new_population(points, old_generation):
    survivors = choose_survivors(points, old_generation)
    crossovers = apply_crossover(survivors)
    new_population = apply_mutations(crossovers)
    return new_population

def main():
    points = {
        0: (0, 0),        # City 0: Start/End (Home Base)
        1: (10, 50),      # City 1
        2: (50, 10),      # City 2
        3: (100, 10),     # City 3
        4: (150, 50),     # City 4
        5: (100, 100),    # City 5
        6: (50, 150),     # City 6
        7: (10, 100),     # City 7
        8: (200, 0),      # City 8 (Outlier)
        9: (0, 150)       # City 9
    }
    total_destinations = 10
    initial_population = generate_random_paths(total_destinations)
    #print(initial_population)
    new_population = generate_new_population(points, initial_population)
    for path in new_population: 
        print(path, total_distance(points, path))

    #print([0, 1, 7, 9, 6, 5, 4, 3, 8, 2], total_distance(points, [0, 1, 7, 9, 6, 5, 4, 3, 8, 2]))

if __name__ == "__main__":
    main()