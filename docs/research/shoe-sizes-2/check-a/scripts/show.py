import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
src = sys.argv[1]
ids = set(sys.argv[2].split(','))
last = None
with open(src, encoding='utf-8', newline='') as f:
    for r in csv.DictReader(f):
        n = int(r['id'][1:])
        lo, hi = [int(x) for x in sys.argv[2].split('-')]
        if lo <= n <= hi:
            chk = r['check']
            if chk == last: chk = '(same)'
            else: last = r['check']
            print(r['id'], r['kind'], r['source'], '|', r['chart'], '| row=%s col=%s val=%s' % (r['row'], r['column'], r['value']), '|', chk)
