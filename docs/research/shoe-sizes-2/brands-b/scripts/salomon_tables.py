# usage: python -I salomon_tables.py PAGE.html OUT.json
# decodes the Next.js flight data (self.__next_f.push strings), walks every JSON value,
# and keeps each dict that has a 'header' list (a size table) with its sibling keys and the nearest titled ancestors
import sys, re, json
sys.stdout.reconfigure(encoding='utf-8')
src = open(sys.argv[1], encoding='utf-8', errors='replace').read()
chunks = []
for m in re.finditer(r'self\.__next_f\.push\(\[1,("(?:[^"\x5c]|\x5c.)*")\]\)', src, re.S):
    try:
        chunks.append(json.loads(m.group(1)))
    except Exception:
        pass
flight = ''.join(chunks)
dec = json.JSONDecoder()
found = []
def walk(v, path):
    if isinstance(v, dict):
        if isinstance(v.get('header'), list):
            found.append({'path': path, 'obj': v})
        lab = [str(v.get(k)) for k in ('title', 'name', 'label', 'category', 'gender', 'internalName') if isinstance(v.get(k), (str, list))]
        for k, x in v.items():
            walk(x, path + ([k + ('=' + '/'.join(lab) if lab else '')]))
    elif isinstance(v, list):
        for i, x in enumerate(v):
            walk(x, path + [str(i)])
for line in flight.split('\n'):
    m = re.match(r'^([0-9a-z]+):', line)
    if not m:
        continue
    body = line[m.end():]
    i = 0
    while i < len(body) and body[i] not in '[{':
        i += 1
    if i >= len(body):
        continue
    try:
        v, _ = dec.raw_decode(body[i:])
    except Exception:
        continue
    walk(v, [m.group(1)])
out = []
for f in found:
    o = f['obj']
    hdr = [h.get('title') for h in o['header']]
    others = {k: v for k, v in o.items() if k != 'header'}
    out.append({'path': f['path'][-6:], 'header': hdr, 'header_raw': o['header'], 'others': others})
json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for i, t in enumerate(out):
    keys = list(t['others'].keys())
    print(i, t['header'], keys, ' > '.join(t['path'])[:300])
