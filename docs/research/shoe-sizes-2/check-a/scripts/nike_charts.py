import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
def charts(name):
    t = load(name)
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json"[^>]*>(.*?)</script>', t, re.S)
    data = json.loads(m.group(1))
    cards = data['props']['pageProps']['initialState']['appData']['cards']
    out = []
    for cid, c in cards.items():
        if isinstance(c, dict) and c.get('sizeCharts'):
            for sc in c['sizeCharts']:
                meta = {k: v for k, v in sc.items() if k != 'data'}
                rows = [[(cell.get('value') if isinstance(cell, dict) else cell) for cell in r] for r in sc['data']]
                out.append((cid, {k: c.get(k) for k in c if k not in ('sizeCharts',) and isinstance(c.get(k), str)}, meta, rows))
    return out
if __name__ == '__main__':
    for name in sys.argv[1:]:
        for cid, cmeta, meta, rows in charts(name):
            print('==', name, cid, json.dumps(cmeta, ensure_ascii=False)[:300], json.dumps(meta, ensure_ascii=False)[:300])
            for r in rows: print('   ', ' | '.join(str(x) for x in r))
