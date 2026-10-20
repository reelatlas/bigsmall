# shared writers: each brand script writes parts/<brand>_charts.csv and parts/<brand>_claims.csv; merge.py joins them
import csv, os
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.dirname(HERE)
DL=os.path.join(ROOT,'downloads')
DATE='2026-10-20'
CH=['brand','site','chart','column','row','value','url','date_read','tool','notes']
CL=['claim','evidence_level','url','exact_words','date_read']
class Brand:
    def __init__(s,name):
        s.name=name; s.cells=[]; s.claims=[]
    def table(s,site,chart,header,rows,url,tool,notes='',colnotes=None):
        colnotes=colnotes or {}
        for i,r in enumerate(rows,1):
            for j,col in enumerate(header):
                v=r[j] if j<len(r) else ''
                n=notes; cn=colnotes.get(col,'')
                if cn: n=(n+'; ' if n else '')+cn
                s.cells.append([s.name,site,chart,col,i,'' if v is None else str(v),url,DATE,tool,n])
    def claim(s,claim,level,url,words):
        s.claims.append([claim,level,url,words,DATE])
    def save(s):
        k=s.name.lower().replace('.','').replace(' ','_')
        for fn,hdr,data in((k+'_charts.csv',CH,s.cells),(k+'_claims.csv',CL,s.claims)):
            with open(os.path.join(HERE,'parts',fn),'w',newline='',encoding='utf-8') as f:
                w=csv.writer(f); w.writerow(hdr); w.writerows(data)
        print(s.name,len(s.cells),'cells',len(s.claims),'claims')
