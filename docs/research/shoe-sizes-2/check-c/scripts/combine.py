# Combine results-*.txt (fields joined by '||') into check.csv, in id order.
import csv, glob, os, sys
out = sys.argv[1]
cols = ['id', 'result', 'found_value', 'exact_words', 'url_or_file', 'tool', 'date_checked', 'note']
rows = []
for p in sorted(glob.glob(os.path.join(out, 'results-*.txt'))):
    with open(p, encoding='utf-8') as f:
        for line in f:
            line = line.rstrip('\n')
            if not line.strip() or line.startswith('#'):
                continue
            parts = line.split('||')
            if len(parts) != len(cols):
                sys.exit('bad field count %d in %s: %s' % (len(parts), p, line[:80]))
            rows.append(dict(zip(cols, [x.strip() for x in parts])))
rows.sort(key=lambda r: int(r['id'][1:]))
ids = [r['id'] for r in rows]
assert len(ids) == len(set(ids)), 'duplicate ids'
with open(os.path.join(out, 'check.csv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    w.writerows(rows)
from collections import Counter
print(len(rows), 'rows;', dict(Counter(r['result'] for r in rows)))
