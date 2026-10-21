import sys, os, re, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
CSV, DL, TXT, LOG, BASE = sys.argv[1:6]
rows, urls = load_rows(CSV)
log = load_log(LOG)
cache = {}


def get(ui):
    u = urls[ui - 1]
    if u not in cache:
        p = page(u, log, DL, TXT)
        if p:
            p['vk'] = keep(p['vis']); p['vl'] = p['vk'].lower()
            p['rk'] = keep(p['raw']); p['rl'] = p['rk'].lower()
        cache[u] = p
    return cache[u]


def kw(ui, word, n=1, width=260, src_order=('v', 'r')):
    p = get(ui)
    out = []
    for src in src_order:
        k = p[src + 'k']; kl = p[src + 'l']
        start = 0
        while len(out) < n:
            j = kl.find(word.lower(), start)
            if j < 0:
                break
            out.append(f"[{src}] ..{k[max(0, j - width // 3): j + width]}..")
            start = j + len(word)
        if out:
            break
    print(f"  u{ui} <{word}> " + (' || '.join(out) if out else '(none)'))


class TableP(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.tables = []; s.stack = []; s.cell = None; s.row = None; s.skip = 0

    def handle_starttag(s, t, a):
        if t in SKIP: s.skip += 1
        if t == 'table': s.stack.append([])
        elif t == 'tr' and s.stack: s.row = []
        elif t in ('td', 'th') and s.stack: s.cell = []

    def handle_endtag(s, t):
        if t in SKIP and s.skip: s.skip -= 1
        if t in ('td', 'th') and s.stack and s.cell is not None:
            if s.row is None: s.row = []
            s.row.append(re.sub(r'\s+', ' ', ''.join(s.cell)).strip()); s.cell = None
        elif t == 'tr' and s.stack and s.row is not None:
            s.stack[-1].append(s.row); s.row = None
        elif t == 'table' and s.stack:
            s.tables.append(s.stack.pop())

    def handle_data(s, d):
        if not s.skip and s.cell is not None: s.cell.append(d)


print('== 1. Brooks chart labels and the guide link')
kw(1, "Women's running shoes"); kw(57, "Men's running shoes"); kw(58, 'All gender shoes')
h1 = get(1)['html']
for m in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>\s*View guide', h1):
    print('  u1 View guide href:', m.group(1))
for m in re.finditer(r'href="([^"]*emea-support[^"]*)"', h1):
    print('  u1 emea link:', m.group(1)); break
kw(2, 'Daumen'); kw(2, 'halbe')
tb = json.load(open(os.path.join(BASE, 'tables_brooks.json'), encoding='utf-8'))
a, b = tb['u2'][0]['rows'][1:], tb['u57'][0]['rows'][1:]
print('  u2 vs u57 men rows equal:', a == b, len(a), len(b))
print('== 2. Sentences with replacement chars in the worker words')
kw(3, 'Write down this number', width=120); kw(5, 'thumbnail', width=120); kw(11, 'Brannock', width=200)
kw(11, 'Australia', n=2); kw(10, 'Children', width=120); kw(5, 'women', width=150)
print('== 3. PDFs')
for ui in (14, 37, 50):
    t = re.sub(r'\s+', ' ', get(ui)['vis'])
    print(f'  u{ui} PDF TEXT: {t[:2600]}')
print('== 4. Puma pages: foot-measuring words and shoe chart headers')
for ui in (17, 18, 19, 20, 21):
    for w in ('heel', 'toe', 'foot length', 'between sizes', 'measure your feet', 'measuring your feet'):
        kw(ui, w, width=160, src_order=('v',))
kw(17, "Women's shoes", width=120); kw(19, "Men's shoes", width=200); kw(19, 'Women', width=200)
kw(21, "Men's shoes", width=200); kw(21, 'Length', n=3, width=120); kw(20, 'JPN/CM', width=200)
print('== 5. adidas tables (u32)')
tp = TableP(); tp.feed(get(32)['html'])
for ti, t in enumerate(tp.tables[:6]):
    print(f'  T{ti} rows={len(t)}')
    for r in t[:8]:
        print('    ' + ' | '.join(c[:14] for c in r[:12]))
kw(32, 'Heel-toe', n=2, width=200)
print('== 6. Converse, Clarks, Dr. Martens, Birkenstock, Crocs, Skechers AU')
kw(38, "If you're between sizes", width=300); kw(38, 'socks', width=200)
kw(42, 'measure', n=2, width=200); kw(42, 'heel', width=200)
kw(46, 'in-between sizes', n=2, width=200); kw(45, 'in-between sizes', n=2, width=200)
kw(48, 'calculat', n=2, width=200); kw(48, 'fit calculator', width=200)
for w in ('round up', 'foot length', 'inches', '"cm"', 'heel', 'Learn how to measure'):
    kw(56, w, n=1, width=200, src_order=('r',))
kw(13, 'may vary', width=200); kw(15, 'AUSTRALIAN SIZING', width=150)
kw(16, 'Fit Guide', n=2, width=150)
print('== 7. Reebok UK retry')
p = subprocess.run(['curl', '-sS', '-L', '--compressed', '--connect-timeout', '30', '--max-time', '60', '-A',
                    'bigsmall-research-checker/1.0 (research script verifying published shoe size charts)',
                    '-o', os.path.join(DL, '29_retry_www_reebok_co_uk_help_section_size_charts.html'),
                    '-w', '%{http_code}\t%{url_effective}\t%{size_download}', urls[28]],
                   capture_output=True, text=True)
print('  retry:', p.stdout, p.stderr[:200])
