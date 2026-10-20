import csv, sys, json
src, out = sys.argv[1], sys.argv[2]
with open(src, encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
print('header:', list(rows[0].keys()))
print('total rows:', len(rows))
mine = [r for r in rows if r['checker'].strip() == 'B']
print('mine:', len(mine))
with open(out, 'w', encoding='utf-8') as f:
    json.dump(mine, f, ensure_ascii=False, indent=1)
for r in mine:
    print('|'.join([r['id'], r['brand'], r['kind'], r['source'], r['chart'], r['row'], r['column'], r['value'], r['worker'], r['check']]))
