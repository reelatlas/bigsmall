import csv, sys
sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
STD1 = "Read the page yourself (a script first, the fetcher if the script is refused, never the worker's copy unless both refuse) and quote the sentence that carries the recorded words: confirmed where the page prints them as recorded, corrected with the page's own words where they differ in substance, could not reach where both tools are refused, wrong where the page says no such thing."
STD2 = " Then read second_url the same way and say in the note whether its words agree with the first page's."
def cmp(c):
    return c.replace(STD1, '<STD>').replace(STD2, ' <+2nd>')
CSV, kind, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
with open(CSV, encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
urls = []
for r in rows:
    for k in ('url', 'second_url'):
        u = (r.get(k) or '').strip()
        if u and u not in urls:
            urls.append(u)
sel = [r for r in rows if r['kind'] == kind][a:b]
for r in sel:
    u = urls.index(r['url']) + 1 if r['url'] else '-'
    s2 = urls.index(r['second_url'].strip()) + 1 if r['second_url'].strip() else '-'
    if kind == 'claim':
        print(f"[{r['id']}] {r['brand']} | u{u} 2nd:{s2} | {r['site_region']} | tool:{r['worker_tool']}")
        print(f"  CLAIM: {r['claim']}")
        print(f"  WORDS: {r['exact_words']}")
        print(f"  CHECK: {cmp(r['check'])}")
    else:
        print(f"[{r['id']}] u{u} | {r['chart']} | row {r['row']} | col {r['column']} | val {r['value']} | {cmp(r['check'])}")
