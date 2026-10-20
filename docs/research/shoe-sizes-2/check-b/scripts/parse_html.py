import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common, tables
def load(n): return open(os.path.join(common.DL, n), encoding='utf-8', errors='replace').read()
def show(name, idxs, maxrows=60):
    ts = tables.tables(load(name))
    for i in idxs:
        t = ts[i]; rows = [r for r in t['rows'] if r]
        print(f'--- {name} T{i} heading={t["heading"]!r} caption={t.get("caption","")!r}')
        for k, r in enumerate(rows[:maxrows]): print(f'   [{k}]', ascii(r))
def find(name, needles, width=260):
    raw = load(name); vis = tables.visible_text(raw)
    for nd in needles:
        hits = [m.start() for m in re.finditer(re.escape(nd), vis)]
        rawhits = len(re.findall(re.escape(nd), raw))
        print(f'*** {name} needle={nd!r} visible_hits={len(hits)} raw_hits={rawhits}')
        for h in hits[:2]: print('     ', ascii(vis[max(0,h-width):h+width]))
show('clarks_gb_fitguide.html', [0, 2, 4])
show('clarks_us_mens.html', [0])
show('clarks_us_womens.html', [0])
show('clarks_au_sizeguide.html', [0, 1])
show('birk_us_fitguide.html', [0])
show('birk_gb_sizechart.html', [0, 1])
show('salomon_sg_men.html', [0])
show('brooks_au_conversion.html', [0])
find('clarks_gb_fitguide.html', ['foot gauge'])
find('clarks_ie_fitguide.html', ['foot gauge', 'correlate'])
find('clarks_us_womens.html', ['swelling'])
find('clarks_us_mens.html', ['swelling'])
find('birk_us_fitguide.html', ['European sizes', '+ 31', '+ 33'])
find('birk_gb_sizechart.html', ['Adults', 'in mm', 'UK sizes'], 200)
find('brooks_au_howknow.html', ['two-dimensional', 'lasts', 'approximate'])
find('salomon_sg_men.html', ['Sizing Guide'], 150)
