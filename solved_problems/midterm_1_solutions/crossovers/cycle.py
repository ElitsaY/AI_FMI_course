
def crossover(n, p1, p2):
 
    child = [-1]*n
    
    indices_in_cycle = [False] * n
    
    # gene in p1 -> index of gene in p1
    p1_pos_map = {gene: i for i, gene in enumerate(p1)}
    
    cycle_count = 0 
    
    for i in range(n):
        if not indices_in_cycle[i]:
            # cycle starts at i
            cycle_count += 1
            
            current_cycle_indices = []
            start_index = i
            current_index = i
            
            while True:
                current_cycle_indices.append(current_index)
                indices_in_cycle[current_index] = True
                
                gene_from_p2 = p2[current_index]
                
                # find where that gene is in P1
                next_index = p1_pos_map[gene_from_p2]
                
              
                if next_index == start_index:
                    break
                
                current_index = next_index
            
            take_from_p1 = (cycle_count % 2 != 0) 
            
            for index in current_cycle_indices:
                if take_from_p1:
                    child[index] = p1[index]
                else:
                    child[index] = p2[index]
    
    return child

if __name__ == '__main__':
    n = 4
    p1 = [1, 2, 3, 4]
    p2 = [4, 2, 3, 1]
    child1 = crossover(n, p1, p2)
    child2 = crossover(n, p2, p1)