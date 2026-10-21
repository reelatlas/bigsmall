import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
CSV, DL, TXT, LOG, OUTJ = sys.argv[1:6]
rows, urls = load_rows(CSV)
log = load_log(LOG)
cache = {}


def get(u):
    if u not in cache:
        p = page(u, log, DL, TXT)
        if p:
            p['vk'] = keep(p['vis'])
            p['vl'] = p['vk'].lower()
            p['rk'] = keep(p['raw'])
            p['rl'] = p['rk'].lower()
        cache[u] = p
    return cache[u]


print('PAGES')
for i, u in enumerate(urls, 1):
    p = get(u)
    print(f"u{i:02d}", 'NOFILE' if not p else f"{p['code']} vis={len(p['vk'])} raw={len(p['rk'])} title={p['title'][:70]!r}")


def sentence(k, a, b):
    s = a
    while s > 0 and a - s < 400 and not (k[s - 1] in '.!?' and k[s] == ' '):
        s -= 1
    e = b
    while e < len(k) and e - b < 400 and k[e] not in '.!?':
        e += 1
    return k[s:e + 1].strip()


def frag_pat(f):
    pieces = [re.escape(keep(x).lower()) for x in f.split('�')]
    return '.{0,4}'.join(pieces).replace('\\ ', ' ').replace(' ', ' ?')


out = {}
print('CLAIMS')
for r in rows:
    if r['kind'] != 'claim':
        continue
    res = {}
    frags = [f.strip() for f in re.split(r'\.\.\.|…', r['exact_words']) if len(f.strip()) >= 3]
    for key in ('url', 'second_url'):
        u = r[key].strip()
        if not u:
            continue
        p = get(u)
        tag = f"u{urls.index(u) + 1}"
        if not p:
            res[key] = dict(tag=tag, status='NOFILE')
            continue
        fl = []
        for f in frags:
            pat = frag_pat(f)
            hit = None
            for where in ('v', 'r'):
                m = re.search(pat, p[where + 'l'])
                if m:
                    hit = (where, m.start(), m.end())
                    break
            if hit:
                k = p[hit[0] + 'k']
                fl.append(dict(f=f[:60], st='OK-' + ('vis' if hit[0] == 'v' else 'raw'),
                               sent=sentence(k, hit[1], hit[2])))
            else:
                w = keep(f.replace('�', ' ')).lower().split()
                sh = [' '.join(w[i:i + 4]) for i in range(max(1, len(w) - 3))]
                found = [s for s in sh if s in p['vl'] or s in p['rl']]
                ctx = ''
                if found:
                    src = 'vl' if found[0] in p['vl'] else 'rl'
                    j = p[src].find(found[0])
                    k = p[src[0] + 'k']
                    ctx = k[max(0, j - 200): j + 400]
                fl.append(dict(f=f[:60], st=f'PART {len(found)}/{len(sh)}', ctx=ctx))
        res[key] = dict(tag=tag, frags=fl)
    out[r['id']] = res
    line = r['id'] + ' '
    for key in ('url', 'second_url'):
        if key in res:
            x = res[key]
            line += f" {x['tag']}:" + (x['status'] if 'status' in x else ','.join(f['st'] for f in x['frags']) or 'NOFRAGS')
    print(line)
json.dump(out, open(OUTJ, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
