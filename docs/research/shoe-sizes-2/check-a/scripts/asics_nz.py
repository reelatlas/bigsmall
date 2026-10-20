import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
ts = tables(load('asics_nz'))
for k in (0, 1, 2, 4): dump(ts[k], k)
print('quarter-cm cells (x.25 / x.75) in shoe tables 0-4:')
for k in range(5):
    g = grid(ts[k])
    for i, row in enumerate(g):
        for j, c in enumerate(row):
            if re.fullmatch(r'\d+\.(25|75)', c): print('   table', k, 'data row', i, 'col', g[0][j], '=', c, '| row:', ' | '.join(row))
TOOL = 'script (curl, then python -I html.parser)'
check_cells(['A%02d' % i for i in range(22, 31)], grid(ts[0]), 'https://www.asics.com/nz/en-nz/size-guide', 'asics_nz', TOOL,
            lambda rid, r, row, f: "Table headed Men's/Unisex Shoe Sizes (US | UK | EU | CM | US Women).")
