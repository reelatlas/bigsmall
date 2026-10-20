import json, csv, glob, os
B=os.path.dirname(os.path.abspath(__file__))+'/..'
C=['brand','site','chart','column','row','value','url','date_read','tool','notes']
with open(f'{B}/charts.csv','w',newline='',encoding='utf-8') as fh:
    w=csv.DictWriter(fh,C); w.writeheader(); n=0
    for f in sorted(glob.glob(f'{B}/cells/*.json')):
        for r in json.load(open(f,encoding='utf-8')): w.writerow({k:r.get(k,'') for k in C}); n+=1
K=['claim','evidence_level','url','exact_words','date_read']
with open(f'{B}/claims.csv','w',newline='',encoding='utf-8') as fh:
    w=csv.DictWriter(fh,K); w.writeheader(); m=0
    for f in sorted(glob.glob(f'{B}/claims/*.json')):
        for r in json.load(open(f,encoding='utf-8')): w.writerow({k:r.get(k,'') for k in K}); m+=1
print('cells',n,'claims',m)
