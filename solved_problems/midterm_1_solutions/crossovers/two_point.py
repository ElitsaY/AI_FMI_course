

def crossover(n, p1, p2, cut1, cut2):
    path = p1[cut1:cut2]
    
    remaining_right = [p for p in p2[cut2:] if p not in path]
    remaining_left =  [p for p in p2[:cut2] if p not in path]
    
    remaining = remaining_right + remaining_left
            
 
    child = [path.pop(0) if cut1 <= i < cut2 else i for i in range(n)]
    
    for i in range(n - cut2):
        child[i + cut2] = remaining.pop(0)
        
    for i in range(cut1):
        child[i] = remaining.pop(0)
       
    
    return child

if __name__ == '__main__':
    n = 5
    p1 = [1, 2, 3, 4, 5]
    p2 = [2, 3, 4, 5, 1]
    cut1 = 1
    cut2 = 4
    child1 = crossover(n, p1, p2, cut1, cut2)
    child2 = crossover(n, p2, p1, cut1, cut2)