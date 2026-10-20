"""Step between consecutive rows of every length column (cm or in), per chart: min, median, max, in mm."""
import json, glob, os, re, statistics, collections, sys
sys.stdout.reconfigure(encoding='utf-8')
B=os.path.dirname(os.path.abspath(__file__))+'/..'
U={'¼':.25,'½':.5,'¾':.75,'⅛':.125,'⅔':2/3,'⅚':5/6}
def num(v):
    v=v.replace('"','').replace('”','').strip()
    if not v or v in('-','—','--'): return None
    for k,x in U.items():
        if k in v: return float(v.replace(k,'').strip() or 0)+x
    sup=str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁄','01234567890123456789/')
    v=v.translate(sup)
    m=re.fullmatch(r'(\d+)\s*(\d+)\s*/\s*(\d+)',v) or re.fullmatch(r'(\d+)\s+(\d+)/(\d+)',v)
    if m: return int(m[1])+int(m[2])/int(m[3])
    try: return float(v)
    except: return None
LEN=re.compile(r'(?i)foot length|heel-toe|length cm|^cm$|^inches$|^in$|^cm / jp$|^cm/jp$')
for f in sorted(glob.glob(f'{B}/cells/*.json')):
    g=collections.defaultdict(dict)
    for r in json.load(open(f,encoding='utf-8')):
        if LEN.search(r['column']): g[(r['site'],r['chart'],r['column'])][r['row']]=r['value']
    for (s,ch,col),rows in g.items():
        xs=[num(rows[i]) for i in sorted(rows)]; xs=[x for x in xs if x is not None]
        unit=25.4 if (re.search(r'(?i)in',col) and not re.search(r'(?i)cm',col)) or 'Heel-Toe' in col or 'Heel-toe' in col else 10
        d=[round((b-a)*unit,2) for a,b in zip(xs,xs[1:])]
        if d: print(f'{os.path.basename(f)} | {ch} | {col} | n={len(xs)} | step mm min {min(d)} median {statistics.median(d)} max {max(d)} | first {xs[0]} last {xs[-1]}')
