import csv, sys, collections
src = sys.argv[1]
out = sys.argv[2]
rows = []
with open(src, encoding='utf-8', newline='') as f:
    for r in csv.DictReader(f):
        if r['checker'] == 'A':
            rows.append(r)
with open(out, 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader()
    for r in rows: w.writerow(r)
print(len(rows), 'rows')
bysrc = collections.OrderedDict()
for r in rows:
    bysrc.setdefault((r['source'], r['chart']), []).append(r)
print(len(bysrc), 'source/chart pairs')
lastcheck = None
for (s, c), rs in bysrc.items():
    print('==', s, '|', c)
    for r in rs:
        chk = r['check']
        if chk == lastcheck: chk = '(same)'
        else: lastcheck = r['check']
        print('  ', r['id'], r['kind'], 'row=%s' % r['row'], 'col=%s' % r['column'], 'val=%s' % r['value'], '|', chk)
