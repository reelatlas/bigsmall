"""cmp_by_key.py A.json chartA B.json chartB keycolA keycolB : compare two charts row by row matched on a key column (H suffix read as .5), printing the differing cells of shared columns."""
import sys, json, collections
import sys; sys.stdout.reconfigure(encoding="utf-8")
def load(f,ch,key):
    rows=collections.defaultdict(dict)
    for r in json.load(open(f,encoding='utf-8')):
        if r['chart']==ch: rows[r['row']][r['column']]=r['value']
    out={}
    for r in rows.values():
        k=r.get(key,'').replace('H','.5')
        if k.startswith('K') and k[1:2].isdigit(): k=k
        out[k]=r
    return out
a=load(sys.argv[1],sys.argv[2],sys.argv[5]); b=load(sys.argv[3],sys.argv[4],sys.argv[6])
print('only in A:',[k for k in a if k not in b]); print('only in B:',[k for k in b if k not in a])
for k in a:
    if k in b:
        for c in a[k]:
            if c in b[k] and c not in (sys.argv[5],) and a[k][c]!=b[k][c]: print(k,c,a[k][c],'vs',b[k][c])
