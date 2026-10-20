# usage: python -I tables.py FILE.html [OUT.json] -> prints every <table> with the text just before it; optional JSON dump
import sys, re, json
sys.stdout.reconfigure(encoding='utf-8')
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.tables=[]; s.stack=[]; s.cell=None; s.row=None; s.skip=0; s.text=[]; s.ctx=[]
    def handle_starttag(s,t,a):
        if t in('script','style','noscript'): s.skip+=1
        if t=='table':
            s.stack.append([]); s.ctx.append(re.sub(r'\s+',' ',' '.join(s.text))[-300:])
        elif t=='tr' and s.stack: s.row=[]
        elif t in('td','th') and s.row is not None: s.cell=[]
        elif t=='br' and s.cell is not None: s.cell.append(' ')
    def handle_endtag(s,t):
        if t in('script','style','noscript'): s.skip=max(0,s.skip-1)
        if t in('td','th') and s.cell is not None and s.row is not None:
            s.row.append(re.sub(r'\s+',' ',''.join(s.cell)).strip()); s.cell=None
        elif t=='tr' and s.row is not None and s.stack:
            s.stack[-1].append(s.row); s.row=None
        elif t=='table' and s.stack: s.tables.append((s.ctx.pop(),s.stack.pop()))
    def handle_data(s,d):
        if s.skip: return
        if s.cell is not None: s.cell.append(d)
        elif not s.stack and d.strip(): s.text.append(d.strip())
src=open(sys.argv[1],encoding='utf-8',errors='replace').read()
p=P(); p.feed(src)
print('TABLES',len(p.tables))
for i,(c,t) in enumerate(p.tables):
    print('--- table',i+1,'rows',len(t),'| before:',c[-160:])
    for r in t: print(' | '.join(r))
if len(sys.argv)>2: json.dump([{'before':c,'rows':t} for c,t in p.tables],open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,indent=0)
