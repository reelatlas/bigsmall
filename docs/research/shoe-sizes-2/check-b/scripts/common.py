import csv, json, os, datetime
CB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.join(CB, 'downloads')
RES = os.path.join(CB, 'scripts', 'results.json')
SRC = os.path.join(CB, 'scripts', 'sources.json')
TODAY = '2026-10-20'
COLS = ['id', 'result', 'found_value', 'exact_words', 'url_or_file', 'tool', 'date_checked', 'note']

def mine():
    with open(os.path.join(CB, 'scripts', 'mine.json'), encoding='utf-8') as f:
        return json.load(f)

def _load(p, default):
    if os.path.exists(p):
        with open(p, encoding='utf-8') as f:
            return json.load(f)
    return default

def record(updates):
    res = _load(RES, {})
    for u in updates:
        u = dict(u)
        u.setdefault('date_checked', TODAY)
        res[u['id']] = {c: u.get(c, '') for c in COLS}
    with open(RES, 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=1)
    order = [r['id'] for r in mine()]
    with open(os.path.join(CB, 'check.csv'), 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=COLS)
        w.writeheader()
        for i in order:
            if i in res:
                w.writerow(res[i])
    return res

def log_source(entry):
    src = _load(SRC, [])
    src.append(entry)
    with open(SRC, 'w', encoding='utf-8') as f:
        json.dump(src, f, ensure_ascii=False, indent=1)
    lines = ['# Checker B: sources opened, in order', '',
             'Wave 2 of the brands\' charts research (shoe sizes 2), checker B, ' + TODAY + '.', '']
    for n, e in enumerate(src, 1):
        lines.append(f"{n}. **{e.get('what','')}**: {e.get('url','')}")
        lines.append(f"   - tool: {e.get('tool','')}; file: {e.get('file','')}")
        lines.append(f"   - gave: {e.get('gave','')}")
    with open(os.path.join(CB, 'sources.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
