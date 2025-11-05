import random 

population_size = 500
# Rounds of evolution
rounds = 1000

class QueensBoard:
    def __init__(self, queens_positions, n):
        self.queens_positions = queens_positions
        self.conflict_row = [0] * n
        self.diagonal_positive_conflicts = [0] * (2*n - 1)
        self.diagonal_negative_conflicts = [0] * (2*n - 1)

        for i in range(n):
            self.conflict_row[queens_positions[i]] += 1
            self.diagonal_negative_conflicts[queens_positions[i] + i] += 1
            self.diagonal_positive_conflicts[n - 1 - queens_positions[i] + i] +=  1

        self.conflicts_count = 0
        for queens_in_row in self.conflict_row:
            self.conflicts_count += queens_in_row - 1 if queens_in_row > 1 else 0
        for queens_in_diag_neg in self.diagonal_negative_conflicts:
            self.conflicts_count += queens_in_diag_neg - 1 if queens_in_diag_neg > 1 else 0
        for queens_in_diag_pos in self.diagonal_positive_conflicts:
            self.conflicts_count += queens_in_diag_pos - 1 if queens_in_diag_pos > 1 else 0
    
    def __lt__(self, other):
        return self.conflicts_count < other.conflicts_count

    
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


def choose_survivors(population):
    survivors = []
    random.shuffle(population)
    midway = len(population) // 2
    for i in range(midway):
        if population[i].conflicts_count < population[i + midway].conflicts_count:
            survivors.append(population[i])
        else:
            survivors.append(population[i + midway])
    return survivors
            

def main():
    n = 20
    population = []
    for _ in range(population_size):
        queens_positions = list(range(n))
        random.shuffle(queens_positions)
        population.append(queens_positions)

    #print(population)

    for r in range(rounds):
        queens_population = [QueensBoard(q, n) for q in population]

        #elitism
        best = choose_survivors(queens_population)

        if sorted(best)[0].conflicts_count == 0:
            print(f"Solution at {best[0].queens_positions} round {r}")
            break

        # print(f"====Round {r} === smallest conflict {sorted(best)[0].conflicts_count}")
        offspring = [b.queens_positions for b in best]

        # for q in sorted(queens_population):
        #     print(f"pos: {q.queens_positions} conf: {q.conflicts_count}")

        midway = len(best) // 2
        #crossover
        for i in range(len(best) // 2):
            child1 = create_offsprings(offspring[i], offspring[i + midway])
            child2 = create_offsprings(offspring[i + midway], offspring[i])
            #mutation

            if random.randint(0, 10) == 0:
                queen1 = random.randint(0, n -1)
                queen2 = random.randint(0, n -1)
                child1[queen1], child1[queen2] = child1[queen2], child1[queen1]
            
            if random.randint(0, 10) == 1:
                queen1 = random.randint(0, n -1)
                queen2 = random.randint(0, n -1)
                child2[queen1], child2[queen2] = child2[queen2], child2[queen1]

            offspring.append(child1)
            offspring.append(child2)

        population = offspring


if __name__ == "__main__":
    main()
