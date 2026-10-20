# usage: survey.py <page> <regex for context to dump fully> : prints every table's context + header, and full dumps for matching contexts
import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
ts = tables(load(sys.argv[1])); pat = sys.argv[2] if len(sys.argv) > 2 else None
for i, t in enumerate(ts):
    g = grid(t)
    print('#%d rows=%d ctx=[%s] hdr=%s' % (i, len(g), t['context'][-140:], ' | '.join(g[0]) if g else ''))
    if pat and re.search(pat, t['context'], re.I):
        for k, r in enumerate(g): print('     %2d: %s' % (k, ' | '.join(r)))
