import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
W, CSV = sys.argv[1], sys.argv[2]
rows, urls = load_rows(CSV)
R = {r['id']: r for r in rows}
names = sorted(os.listdir(W))
print('worker download files:', len(names))
pat = re.compile(r'tim-us-howtomeasure|on-us-faq', re.I)
sel = [n for n in names if pat.search(n)]
BOT = ['access to this page has been denied', 'px-captcha', 'press & hold', 'verify you are human', 'datadome',
       'just a moment', 'are you a robot']
for n in sel:
    fp = os.path.join(W, n)
    if os.path.isdir(fp):
        print('  DIR', n); continue
    b = open(fp, 'rb').read()
    h = b.decode('utf-8', 'replace')
    p = TP(); p.feed(h)
    vis = keep(''.join(p.parts))
    bots = [x for x in BOT if x in h.lower()]
    print(f"  {n} bytes={len(b)} vis={len(vis)} title={p.title.strip()[:70]!r} bot={bots}")
    if 'tim-us-howtomeasure' in n.lower():
        vl = vis.lower(); rk = keep(rawtext(h)); rl = rk.lower()
        for cid in ('A-C076', 'A-C075'):
            for f in [x.strip() for x in re.split(r'\.\.\.', R[cid]['exact_words']) if len(x.strip()) > 3]:
                fk = keep(f).lower()
                where = 'vis' if fk in vl else 'raw' if fk in rl else None
                if where:
                    j = (vl if where == 'vis' else rl).find(fk)
                    src = vis if where == 'vis' else rk
                    print(f"    {cid} FOUND-{where}: ..{src[max(0, j - 80): j + len(fk) + 120]}..")
                else:
                    w = fk.split(); sh = [' '.join(w[i:i + 4]) for i in range(max(1, len(w) - 3))]
                    hit = [s for s in sh if s in vl or s in rl]
                    ctx = ''
                    if hit:
                        j = vl.find(hit[0]) if hit[0] in vl else -1
                        ctx = vis[max(0, j - 100): j + 400] if j >= 0 else ''
                    print(f"    {cid} PART {len(hit)}/{len(sh)} for [{f[:50]}] ctx: {ctx}")
