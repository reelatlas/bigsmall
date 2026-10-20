import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common, tables
for name in sys.argv[1:]:
    raw = open(os.path.join(common.DL, name), encoding='utf-8', errors='replace').read()
    ts = tables.tables(raw)
    print('=====', name, 'chars', len(raw), 'tables', len(ts), 'next_f' , raw.count('self.__next_f.push'), 'NEXT_DATA', raw.count('__NEXT_DATA__'))
    for i, t in enumerate(ts):
        rows = [r for r in t['rows'] if r]
        print(f'  T{i} heading={t["heading"][:70]!r} caption={t.get("caption","")[:50]!r} nrows={len(rows)}')
        for r in rows[:2]: print('     ', ascii(r)[:220])
