"""Dump every <table> of a saved HTML file: rows of cell text, with the nearest preceding heading/caption."""
import sys, json
from html.parser import HTMLParser
sys.stdout.reconfigure(encoding="utf-8")
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.tables=[]; s.stack=[]; s.cell=None; s.row=None; s.lasthead=''; s.inhead=False; s.headbuf=''; s.skip=0
    def handle_starttag(s,t,a):
        if t in('script','style'): s.skip+=1
        if t=='table': s.stack.append({'head':s.lasthead,'rows':[]})
        elif t=='tr' and s.stack: s.row=[]
        elif t in('td','th') and s.stack: s.cell=''
        elif t in('h1','h2','h3','h4','h5','caption','summary'): s.inhead=True; s.headbuf=''
        elif t=='br' and s.cell is not None: s.cell+=' '
    def handle_endtag(s,t):
        if t in('script','style'): s.skip-=1
        if t in('td','th') and s.cell is not None and s.row is not None: s.row.append(' '.join(s.cell.split())); s.cell=None
        elif t=='tr' and s.row is not None and s.stack: s.stack[-1]['rows'].append(s.row); s.row=None
        elif t=='table' and s.stack: s.tables.append(s.stack.pop())
        elif t in('h1','h2','h3','h4','h5','caption','summary') and s.inhead:
            s.inhead=False; h=' '.join(s.headbuf.split())
            if h: s.lasthead=h
            if s.stack and t=='caption': s.stack[-1]['head']=h
    def handle_data(s,d):
        if s.skip: return
        if s.cell is not None: s.cell+=d
        if s.inhead: s.headbuf+=d
p=P(); p.feed(open(sys.argv[1],encoding='utf-8',errors='replace').read())
for i,t in enumerate(p.tables):
    print(f'### table {i} head={t["head"]!r} rows={len(t["rows"])}')
    for r in t['rows']: print(' | '.join(r))
