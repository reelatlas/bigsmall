import sys, os, re, json
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


def rx(ui, pat, n=2, width=220, src='v'):
    p = get(ui)
    k = p[src + 'k']
    hits = [m.start() for m in re.finditer(pat, k, flags=re.I)][:n]
    print(f"  u{ui} /{pat}/ [{src}] " + (' || '.join('..' + k[max(0, j - width // 3): j + width] + '..' for j in hits) if hits else '(none)'))


print('== Brooks fragments: headings and the guide link')
rx(57, r"(?<!wo)men's running shoes"); rx(2, r'Herren-Laufschuhe'); rx(2, r'Damen-Laufschuhe', n=1)
print('  u57 start:', get(57)['vk'][:300])
h1 = get(1)['html']
for m in re.finditer(r'View guide', h1):
    seg = h1[max(0, m.start() - 700): m.start()]
    hrefs = re.findall(r'href="([^"]+)"', seg)
    print('  u1 hrefs before View guide:', hrefs[-3:])
print('== NB PDF layout lines')
lay = open(os.path.join(TXT, log[urls[36]]['file'][:-4] + '.txt'), encoding='utf-8', errors='replace').read()
for i, line in enumerate(lay.splitlines()):
    if re.search(r'Standard Running|Length in cm|PLACE HEEL|SIZING & CONVERSION|WIDTH GUIDE| cm\b', line):
        print(f'  L{i}: {line.strip()[:200]}')
print('== Puma AU women chart, adidas text, Timberland chart')
rx(17, r'Length cm', n=4, width=90)
p32 = get(32)['vk']; j = p32.find("Men's and women's adidas footwear sizing")
print('  u32 seg:', p32[j: j + 1500])
rx(53, r'\bInch\b', n=2, width=200); rx(53, r'USA', n=1, width=200)
print('== Crocs embedded chart data, On tester page, On adult page, Brooks AU table')
for pat in (r'Heel to Toe Length', r'"M4', r'W6', r'sizeChart', r'22\.5'):
    rx(56, pat, n=1, width=200, src='r')
rx(24, r'Place a piece of paper flat on the ground', n=1, width=300, src='r')
rx(22, r'True to size', n=3, width=80)
rx(12, r'Japan Men', n=1, width=300)
rx(35, r'FOOT LENGTH \(CM\)', n=1, width=200); rx(51, r'Foot Length', n=2, width=160)
