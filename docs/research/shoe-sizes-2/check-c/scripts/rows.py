import csv, sys
path = sys.argv[1]
with open(path, encoding='utf-8', newline='') as f:
    r = csv.DictReader(f)
    rows = [x for x in r if x['checker'] == 'C']
print(len(rows))
for x in rows:
    print('|'.join([x['id'], x['brand'], x['kind'], x['source'], x['chart'], x['row'], x['column'], x['value'], x['worker'], x['check']]))
