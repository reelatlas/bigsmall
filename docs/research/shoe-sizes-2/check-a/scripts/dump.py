import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
name = sys.argv[1]; which = sys.argv[2] if len(sys.argv) > 2 else 'all'; maxrows = int(sys.argv[3]) if len(sys.argv) > 3 else 999
ts = tables(load(name))
print(name, len(ts), 'tables')
for i, t in enumerate(ts):
    if which == 'all' or str(i) in which.split(','): dump(t, i, maxrows)
