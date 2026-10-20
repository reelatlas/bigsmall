# joins parts/*_charts.csv and parts/*_claims.csv into ../charts.csv and ../claims.csv
import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import csv,glob,os
from csvlib import HERE,ROOT,CH,CL
for suf,hdr,out in(('_charts.csv',CH,'charts.csv'),('_claims.csv',CL,'claims.csv')):
    rows=[]
    for p in sorted(glob.glob(os.path.join(HERE,'parts','*'+suf))):
        with open(p,encoding='utf-8') as f: r=list(csv.reader(f)); rows+=r[1:]
    with open(os.path.join(ROOT,out),'w',newline='',encoding='utf-8') as f:
        w=csv.writer(f); w.writerow(hdr); w.writerows(rows)
    print(out,len(rows))
