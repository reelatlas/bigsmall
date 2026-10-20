import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
TOOL = 'script (curl, then python -I html.parser)'
au = tables(load('puma_au')); de = tables(load('puma_eu_de_en')); gb = tables(load('puma_eu_en_gb'))
gde, ggb = grid(de[0]), grid(gb[0])
print('de/en women:'); [print('   %2d: %s' % (k, ' | '.join(r))) for k, r in enumerate(gde)]
print('en_GB women:'); [print('   %2d: %s' % (k, ' | '.join(r))) for k, r in enumerate(ggb)]
def us7(g): return [r for r in g[1:] if r[g[0].index('US')] == '7']
print('US 7 de/en:', us7(gde), '| en_GB:', us7(ggb))
gau = grid(au[1]); assert gau[0] == ['US', 'UK', 'EU', 'Length cm']
check_cells(['A%02d' % i for i in range(51, 60)], gau, 'https://au.puma.com/au/en/help/size-guide', 'puma_au', TOOL,
  lambda rid, r, row, f: "Table headed Men's shoes (US | UK | EU | Length cm, 24 data rows, US 4-18), after Unisex shoes.")
dd = us7(gde); gg = us7(ggb)
diff = 'de/en US 7 row: %s; en_GB US 7 row: %s (header %s).' % (' | '.join(dd[0]) if dd else 'none', ' | '.join(gg[0]) if gg else 'none', ' | '.join(gde[0]))
check_cells(['A61', 'A62', 'A63'], gde, 'https://eu.puma.com/de/en/help/size-guide', 'puma_eu_de_en', TOOL,
  lambda rid, r, row, f: "First table, under International Size Conversions / Women's shoes. " + diff)
check_cells(['A64', 'A65', 'A66'], ggb, 'https://eu.puma.com/en_GB/size-charts.html', 'puma_eu_en_gb', TOOL,
  lambda rid, r, row, f: "First table, under International Size Conversions / Women's shoes. Differs from de/en at US 7: " + diff)
kid = grid(au[11]); uni = grid(au[0]); wau = grid(au[4])
print('AU kids rows 20-23:', kid[20:24]); print('AU unisex rows 8-11:', uni[8:12]); print('AU women US 7:', [r for r in wau if r[0] == '7'])
