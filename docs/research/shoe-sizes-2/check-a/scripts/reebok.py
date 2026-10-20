import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
TOOL = 'script (curl, then python -I html.parser)'
def T(g):  # transpose a chart whose sizes run across: first column holds the headings
    return [[r[0] for r in g]] + [[r[k] if k < len(r) else '' for r in g] for k in range(1, max(len(r) for r in g))]
mw = grid(tables(load('reebok_ca_mw'))[0]); un = grid(tables(load('reebok_ca_unisex'))[0])
print('ca M&W vs unisex, differing positions:', [(k, mw[i][0], mw[i][k], un[i][k]) for i in range(3) for k in range(1, len(mw[i])) if mw[i][k] != un[i][k]])
print('ca M&W positions 5-10:', [(k, mw[0][k], mw[1][k], mw[2][k]) for k in range(5, 11)])
print('ca unisex positions 2-7:', [(k, un[0][k], un[1][k], un[2][k]) for k in range(2, 8)])
ru = grid(tables(load('reebok_com_unisex'))[0]); rs = grid(tables(load('reebok_com_special'))[0])
same_in = all(norm(a[2]) == norm(b[2]) and a[0] == b[0] for a, b in zip(ru[1:], rs[1:]))
wdiff = sorted(set(round(float(b[1]) - float(a[0]), 2) for a, b in zip(rs[1:], rs[1:]) if b[1] not in ('—',)))
print('com unisex vs special: same men sizes and inches throughout:', same_in, '| women-men on unisex:', sorted(set(float(r[1]) - float(r[0]) for r in ru[1:] if r[1] != '—')), '| on special:', sorted(set(float(r[1]) - float(r[0]) for r in rs[1:] if r[1] != '—')))
n68 = ('Chart transposed (sizes run across); data position 7 reads Heel-toe measurement 9" | US - Men 5 | US - Women 7.5. The inches run 8.8", 9", 9.2" at positions 6-8, so 9" is in sequence, not a typo; what is out of sequence is the US - Women label: 7.5 at position 7 between 6 and 7 (7.5 recurs at position 9 with 9.3"), where US men 5 implies 6.5; reebok.com pairs 9" with US men 5 / women 6.5.')
check_cells(['A68', 'A69'], T(mw), 'https://reebok.ca/pages/mens-and-womens-footwear-size-chart', 'reebok_ca_mw', TOOL, lambda rid, r, row, f: n68)
n70 = ('Chart transposed; data position 4 reads Heel-toe measurement 8.5" | US - Men 4.5 | US - Women 5. The US - Men row runs 2, 2.5, 3, 4.5, 4, 4.5, 5: the 4.5 at position 4 is out of sequence (3.5 expected; 4.5 recurs at position 6 with 8.8"), and reebok.com pairs 8.5" with US men 3.5 / women 5. This chart equals the Men\'s and Women\'s chart in every cell but that one (3.5 there).')
check_cells(['A70', 'A71'], T(un), 'https://reebok.ca/pages/unisex-footwear-size-chart', 'reebok_ca_unisex', TOOL, lambda rid, r, row, f: n70)
check_cells(['A72', 'A73'], ru, 'https://www.reebok.com/pages/unisex-shoe-size-guide', 'reebok_com_unisex', TOOL,
  lambda rid, r, row, f: 'Table headed U.S. Men Size | U.S. Women Size | Heel-Toe Measurement (in), 34 rows, men 2-18.5; women = men + 1.5 throughout.')
check_cells(['A74', 'A75'], rs, 'https://www.reebok.com/pages/special-unisex-shoe-size-guide', 'reebok_com_special', TOOL,
  lambda rid, r, row, f: 'Table headed Unisex Shoes Size Guide; women = men + 1 throughout, against + 1.5 on the Unisex Shoe Size Guide (3 against 3.5 at men 2); the inches are the same at every men\'s size on both guides (some printed with a space before the inch mark, e.g. 8.5 ").')
gd = tables(load('reebok_com_guides')); steps = grid(gd[3])
for s in steps[1]: print('STEP:', s)
print('headers with Heel-Toe:', [grid(t)[0] for t in gd if any('Heel-Toe' in h for h in grid(t)[0])])
