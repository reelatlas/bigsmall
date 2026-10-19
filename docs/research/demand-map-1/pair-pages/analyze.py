import sys, re, json, html as H, csv, os
sys.stdout.reconfigure(encoding="utf-8")
from html.parser import HTMLParser
from urllib.parse import urlparse, urljoin
listf, pagedir, outjson = sys.argv[1], sys.argv[2], sys.argv[3]
REV = {'cm to inches': r'inch(es)?[-_+/]?(to)?[-_+/]?(cm|centimet)', 'kg to lbs': r'(lbs?|pound)s?[-_+/](to[-_+/])?(kg|kilo)',
 "5'10 in cm": r'(cm|centimet\w*)[-_+/](to[-_+/])?(f(ee)?t|feet|height)', 'cups of flour in grams': r'(gram|g)s?[-_+/](flour[-_+/])?to[-_+/](cup)',
 'nm to ft lbs': r'(ft|foot)[-+_]?(lb|pound)\w*[-_+/](to[-_+/])?(n|newton)', 'min/km to mph': r'(mph|speed)[-_+/]to[-_+/](pace|min)',
 'celsius to fahrenheit': r'fahrenheit[-_+/]to[-_+/]celsius', 'shoe size us to eu': r'(eu|europe\w*)[-_+/]to[-_+/](us|americ)'}
class P(HTMLParser):
    def __init__(s, base):
        super().__init__(convert_charrefs=True); s.base=base; s.skip=0; s.chrome=0; s.stack=[]
        s.title=''; s.intitle=False; s.desc=''; s.canon=''; s.heads=[]; s.curh=None; s.htxt=''
        s.tables=[]; s.intable=0; s.row=None; s.cell=None; s.inputs=0; s.selects=0; s.buttons=0
        s.words=[]; s.mainwords=[]; s.inmain=0; s.ld=[]; s.inld=False; s.ldbuf=''; s.links=[]; s.itemtypes=set(); s.ina=None
    def handle_starttag(s,t,a):
        a=dict(a)
        if 'itemtype' in a: s.itemtypes.add(a['itemtype'].split('/')[-1])
        if t=='script' and (a.get('type') or '').lower()=='application/ld+json': s.inld=True; s.ldbuf=''; return
        if t in ('script','style','noscript','svg','template'): s.skip+=1; return
        if t in ('nav','header','footer','aside'): s.chrome+=1
        if t in ('main','article'): s.inmain+=1
        if t=='title': s.intitle=True
        if t=='meta':
            n=(a.get('name') or a.get('property') or '').lower()
            if n=='description' and not s.desc: s.desc=a.get('content','')
        if t=='link' and 'canonical' in (a.get('rel') or ''): s.canon=a.get('href','')
        if t in ('h1','h2','h3'): s.curh=t; s.htxt=''
        if t=='table': s.intable+=1; s.tables.append([])
        if t=='tr' and s.intable: s.row=[]
        if t in ('td','th') and s.row is not None: s.cell=''
        if t=='input' and (a.get('type') or 'text').lower() in ('text','number','tel','search',''): s.inputs+=1
        if t=='select': s.selects+=1
        if t=='a' and a.get('href'): s.ina=urljoin(s.base,a['href']); s.atext=''
    def handle_endtag(s,t):
        if t=='script' and s.inld:
            s.inld=False; s.ld.append(s.ldbuf); return
        if t in ('script','style','noscript','svg','template'):
            if s.skip: s.skip-=1
            return
        if t in ('nav','header','footer','aside') and s.chrome: s.chrome-=1
        if t in ('main','article') and s.inmain: s.inmain-=1
        if t=='title': s.intitle=False
        if t==s.curh: s.heads.append((t,re.sub(r'\s+',' ',s.htxt).strip())); s.curh=None
        if t in ('td','th') and s.cell is not None and s.row is not None: s.row.append(re.sub(r'\s+',' ',s.cell).strip()); s.cell=None
        if t=='tr' and s.row is not None and s.tables: s.tables[-1].append(s.row); s.row=None
        if t=='table' and s.intable: s.intable-=1
        if t=='a' and s.ina: s.links.append((s.ina,re.sub(r'\s+',' ',s.atext).strip())); s.ina=None
    def handle_data(s,d):
        if s.inld: s.ldbuf+=d; return
        if s.skip: return
        if s.intitle: s.title+=d
        if s.curh: s.htxt+=d
        if s.cell is not None: s.cell+=d
        if s.ina: s.atext+=d
        w=d.split()
        if not s.chrome: s.words+=w
        if s.inmain and not s.chrome: s.mainwords+=w
def ldtypes(bufs):
    out=[]
    def walk(o):
        if isinstance(o,dict):
            t=o.get('@type')
            if t: out.extend(t if isinstance(t,list) else [t])
            for v in o.values(): walk(v)
        elif isinstance(o,list):
            for v in o: walk(v)
    for b in bufs:
        try: walk(json.loads(b))
        except Exception: out.append('unparsed')
    return sorted(set(out))
res=[]
rows=[l.rstrip('\n').split('\t') for l in open(listf,encoding='utf-8') if l.strip()]
for i,(q,r,u) in enumerate(rows,1):
    f=os.path.join(pagedir,'p%02d.html'%i)
    s=open(f,encoding='utf-8',errors='replace').read() if os.path.exists(f) else ''
    if len(s)<2000: res.append(dict(i=i,query=q,rank=r,url=u,error='empty or blocked (%d bytes)'%len(s))); continue
    p=P(u); 
    try: p.feed(s)
    except Exception as e: pass
    host=urlparse(u).netloc
    internal=[(l,t) for l,t in p.links if urlparse(l).netloc==host]
    rev=[l for l,t in internal if re.search(REV[q],urlparse(l).path+'?'+urlparse(l).query,re.I)]
    tabs=[]
    for tb in p.tables:
        if len(tb)<2: continue
        first=[r_[0] for r_ in tb if r_][:4]; last=[r_[0] for r_ in tb if r_][-2:]
        tabs.append(dict(rows=len(tb),cols=max(len(r_) for r_ in tb),head=tb[0][:4],first=first,last=last))
    res.append(dict(i=i,query=q,rank=r,url=u,title=H.unescape(p.title.strip()),desc=p.desc,canon=p.canon,
      heads=p.heads[:40],tables=tabs[:6],ntables=len(tabs),inputs=p.inputs,selects=p.selects,
      words_body=len(p.words),words_main=len(p.mainwords),ld=ldtypes(p.ld),micro=sorted(p.itemtypes),
      n_internal=len(set(l for l,t in internal)),reverse=sorted(set(rev))[:3]))
json.dump(res,open(outjson,'w',encoding='utf-8'),indent=1,ensure_ascii=False)
for x in res:
    if 'error' in x: print(x['i'],x['url'],x['error']); continue
    print('\n###',x['i'],x['query'],x['rank'],x['url'])
    print('T:',x['title'],'| D:',x['desc'][:200])
    print('H:',' > '.join(f"{h}:{t[:50]}" for h,t in x['heads'][:25]))
    print('tables',x['ntables'],[ (t['rows'],t['head'][:3],t['first'][:4],t['last']) for t in x['tables'][:3]])
    print('inputs',x['inputs'],'selects',x['selects'],'words body/main',x['words_body'],x['words_main'],'LD',x['ld'],'micro',x['micro'],'internal',x['n_internal'],'rev',x['reverse'][:2])
