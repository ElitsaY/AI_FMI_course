def crossover(n, p1, p2, cut1, cut2):
    child = [None] * n

    child[cut1:cut2] = p1[cut1:cut2]

    mapping1 = {}  

    for i in range(cut1, cut2):
        city_p1 = p1[i]
        city_p2 = p2[i]
        mapping1[city_p1] = city_p2 


    def apply_mapping(city, mapping):
        if city in mapping:
            return apply_mapping(mapping[city], mapping)
        
        return city

    for i in range(n):
        if i < cut1 or i >= cut2:
            city_p2 = p2[i] 
            
            if city_p2 in p1[cut1 : cut2]:
                mapped_city = apply_mapping(city_p2, mapping1)
                child[i] = mapped_city
            else:
                child[i] = city_p2

    return child


if __name__ == '__main__':
    n = 4
    p1 = [1, 2, 3, 4]
    p2 = [4, 2, 3, 1]
    cut1 = 1
    cut2 = 3
    child1 = crossover(n, p1, p2, cut1, cut2)
    child2 = crossover(n, p2, p1, cut1, cut2)