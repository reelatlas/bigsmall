import csv, sys, collections
p = sys.argv[1]
with open(p, encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
print("columns:", list(rows[0].keys()))
print("rows:", len(rows))
print("kinds:", collections.Counter(r['kind'] for r in rows))
urls = collections.OrderedDict()
for r in rows:
    for k in ('url', 'second_url'):
        u = (r.get(k) or '').strip()
        if u:
            urls.setdefault(u, []).append((r['id'], r['brand'], k))
print("distinct urls:", len(urls))
for i, (u, lst) in enumerate(urls.items(), 1):
    print(f"{i:02d} | {lst[0][1]} | n={len(lst)} | {u} | ids={','.join(x[0]+('*' if x[2]=='second_url' else '') for x in lst)}")
