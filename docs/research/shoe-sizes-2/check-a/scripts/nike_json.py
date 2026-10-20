import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
name = sys.argv[1]
t = load(name)
m = re.search(r'<script id="__NEXT_DATA__" type="application/json"[^>]*>(.*?)</script>', t, re.S)
data = json.loads(m.group(1))
json.dump(data, open(os.path.join(B, 'scripts', '..', name + '.next.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
hits = []
def walk(o, path):
    if isinstance(o, dict):
        for k, v in o.items(): walk(v, path + [k])
    elif isinstance(o, list):
        for i, v in enumerate(o): walk(v, path + [i])
    elif isinstance(o, str) and re.search(r'foot length|cm\s*/\s*jp|big kids', o, re.I) and len(o) < 200:
        hits.append((path, o))
walk(data, [])
for p, s in hits[:40]:
    print('/'.join(map(str, p)), '=>', s)
