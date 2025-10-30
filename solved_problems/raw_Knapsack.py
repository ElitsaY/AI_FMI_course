# --- 0/1 Knapsack problem ----
# Raw Knapsack implementation using Genetic Algorithms 
# Using an idea from YouTube 
# filling a bag of mushrooms, each mushroom is weighted in grams
# link: https://www.youtube.com/watch?v=JK4RklA8dkk 

import random

mushroom_weights = [34, 101, 120, 86, 112, 76, 21, 212, 653, 234, 122, 84, 312, 77, 54, 21]

population_count = 20
# Rounds of evolution
rounds = 20
# In each chromosome, each gene represents whether to include a mushroom or not
chromosomes = [[random.choice([True, False]) for _ in mushroom_weights] for _ in range(population_count)]

class Weighted: 
    max_weight = 1300 # in grams
    #Mushrooms in the bag according to this chromosome
    def __init__(self, mushroom_weights, chromosome): 
        self.chromosome = chromosome
        self.mushrooms_in_bag = [w for w, c in zip(mushroom_weights, chromosome) if c is True]
        self.total_weight = sum(self.mushrooms_in_bag)
        if self.total_weight > self.max_weight: 
            self.total_weight = 0
    
    def __lt__(self, other):
        return self.max_weight - self.total_weight < self.max_weight - other.total_weight



for r in range(rounds):
    print(f"=== Round {r}, population {len(chromosomes)}")
    #Create a list of Weighted instances 
    weighted = [Weighted(mushroom_weights, chromosome) for chromosome in chromosomes]
    
    # Selection
    # Elitism, keeping the 2 best parents
    best = sorted(weighted)[:2]

    print(f"Best weight: {best[0].total_weight}")

    # Crossover
    offspring = [b.chromosome for b in best]
    for i in range((population_count - 2) // 2):
        split_index = random.randint(0, len(offspring) - 1)
        c1 = offspring[0][:split_index] + offspring[1][split_index:]
        c2 = offspring[1][:split_index] + offspring[0][split_index:]

        #mutation
        for i in range(len(c1)):
            #throwing a dice to choose the mutation
            if random.randint(0, 5) == 1: 
                c1[i] = random.choice([True, False])
            if random.randint(0, 5) == 1:
                c2[i] = random.choice([True, False])

        offspring.append(c1)
        offspring.append(c2)
    
    chromosomes = offspring
    





