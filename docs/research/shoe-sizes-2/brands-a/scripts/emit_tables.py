"""emit_tables.py BRAND SITE URL HTMLFILE OUTJSON TOOL "chart1|chart2|..." [NOTES]
Every <table> of the file in order, first row the header; one cell per (column,row). A chart name '-' skips that table; 'T:name' reads a transposed table (systems as rows)."""
import sys, json
from html.parser import HTMLParser
brand,site,url,f,out,tool,charts=sys.argv[1:8]; notes=sys.argv[8] if len(sys.argv)>8 else ''
class P(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.t=[]; s.cur=None; s.row=None; s.cell=None; s.skip=0
    def handle_starttag(s,t,a):
        if t in('script','style'): s.skip+=1
        elif t=='table': s.cur=[]
        elif t=='tr' and s.cur is not None: s.row=[]
        elif t in('td','th') and s.row is not None: s.cell=''
        elif t=='br' and s.cell is not None: s.cell+=' '
    def handle_endtag(s,t):
        if t in('script','style'): s.skip=max(0,s.skip-1)
        elif t in('td','th') and s.cell is not None: s.row.append(' '.join(s.cell.split())); s.cell=None
        elif t=='tr' and s.row is not None: s.cur.append(s.row); s.row=None
        elif t=='table' and s.cur is not None: s.t.append(s.cur); s.cur=None
    def handle_data(s,d):
        if s.cell is not None and not s.skip: s.cell+=d
p=P(); p.feed(open(f,encoding='utf-8',errors='replace').read())
names=charts.split('|'); rows=[]
for name,tb in zip(names,p.t):
    if name=='-': continue
    if name.startswith('T:'):
        name=name[2:]
        for r in tb:
            for i,v in enumerate(r[1:],1):
                rows.append(dict(brand=brand,site=site,chart=name,column=r[0],row=i,value=v,url=url,date_read='2026-10-20',tool=tool,notes=('chart printed with systems as rows and sizes as columns; row = size position; '+notes).strip('; ')))
        continue
    head=tb[0]
    for i,r in enumerate(tb[1:],1):
        for col,v in zip(head,r):
            rows.append(dict(brand=brand,site=site,chart=name,column=col,row=i,value=v,url=url,date_read='2026-10-20',tool=tool,notes=notes if v else ('blank in the chart; '+notes).strip('; ')))
json.dump(rows,open(out,'w',encoding='utf-8'),ensure_ascii=False,indent=0)
print(out,len(p.t),'tables',len(rows),'cells')
