import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
from nike_charts import charts
us = charts('nike_us_mens')[0][3]; gb = charts('nike_gb_mens')[0][3]
norm = lambda s: str(s).replace('—', ' - ').replace('  ', ' ').replace('(in.)', '(in)').replace('CM/JP', 'CM / JP').lower()
usd = {norm(r[0]): r[1:] for r in us}; gbd = {norm(r[0]): r[1:] for r in gb}
for k in gbd: print('GB row', k, 'equals US:', gbd[k] == usd.get(k))
print('US-only rows:', [k for k in usd if k not in gbd])
# rendered kids tables vs JSON
ts = tables(load('nike_us_kids'))
for i, t in enumerate(ts): print('kids rendered table', i, 'ctx', t['context'][-60:], '| rows:', [r[0]['text'] for r in t['rows']])
bk = [c for c in charts('nike_us_kids') if c[1].get('title') == 'Big Kids (1Y - 7Y)'][0][3]
for t in ts:
    labels = [r[0]['text'] for r in t['rows']]
    if t['rows'][0][1]['text'] == '1Y':
        for r in t['rows']:
            j = [x for x in bk if x[0] == r[0]['text']]
            print('  rendered', r[0]['text'], [c['text'] for c in r[1:]], '== JSON' if j and [str(v) for v in j[0][1:]] == [c['text'] for c in r[1:]] else '(differs or JSON-only)')
