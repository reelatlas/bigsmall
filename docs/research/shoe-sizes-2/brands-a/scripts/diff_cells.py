import sys, json
a=json.load(open(sys.argv[1],encoding='utf-8')); b=json.load(open(sys.argv[2],encoding='utf-8'))
ka={(r['chart'],r['column'],r['row']):r['value'] for r in a}; kb={(r['chart'],r['column'],r['row']):r['value'] for r in b}
d=[(k,ka.get(k),kb.get(k)) for k in sorted(set(ka)|set(kb),key=str) if ka.get(k)!=kb.get(k)]
print(len(ka),len(kb),'differ:',len(d))
for x in d: print(x)
