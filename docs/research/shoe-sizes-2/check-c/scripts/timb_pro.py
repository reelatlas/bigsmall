# Timberland PRO women's: each inch value converted (2.54) against the cm copy. Reader: python -I.
import sys

lines = open(sys.argv[1], encoding='utf-8').read().splitlines()
start = [i for i, l in enumerate(lines) if l.startswith('## Timberland PRO') and 'Women' in l][0]
blocks = []
for l in lines[start + 1:]:
    if l.startswith('## '):
        break
    if l.startswith('EU'):
        blocks.append([])
    elif l.strip() and blocks:
        blocks[-1].append(l.split())
diffs = []
for a, b in zip(blocks[0], blocks[1]):
    d = float(b[3]) - float(a[3]) * 2.54
    diffs.append(d)
    print('US', a[2], a[3], 'in =', '%.2f' % (float(a[3]) * 2.54), 'cm; cm copy', b[3], 'diff %+.2f' % d)
print('rows', len(diffs), 'cm minus converted inch: min %+.2f max %+.2f' % (min(diffs), max(diffs)))
