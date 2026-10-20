import csv, sys
path = sys.argv[1]
with open(path, encoding='utf-8', newline='') as f:
    rows = [x for x in csv.DictReader(f) if x['checker'] == 'C']
lastb = lastsrc = lastchk = None
for x in rows:
    if x['brand'] != lastb:
        print('\n### BRAND', x['brand'])
        lastb = x['brand']
    if x['source'] != lastsrc:
        print('  SRC:', x['source'])
        lastsrc = x['source']
    if x['check'] != lastchk:
        print('  CHECK:', x['check'])
        lastchk = x['check']
    chart = x['chart'].split(' (')[0]
    print('   ', x['id'], x['kind'], chart, 'r' + x['row'], x['column'], '=', repr(x['value']), x['worker'])
