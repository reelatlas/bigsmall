import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
CSV, DL, TXT, LOG, OUTJ = sys.argv[1:6]
want = [int(x) for x in sys.argv[6].split(',')]
maxrows = int(sys.argv[7]) if len(sys.argv) > 7 else 40
rows, urls = load_rows(CSV)
log = load_log(LOG)


class TableP(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.tables = []; s.stack = []; s.cell = None; s.row = None; s.skip = 0; s.recent = []

    def handle_starttag(s, t, a):
        if t in SKIP:
            s.skip += 1
        if t == 'table':
            s.stack.append(dict(rows=[], before=' / '.join(s.recent[-6:])))
        elif t == 'tr' and s.stack:
            s.row = []
        elif t in ('td', 'th') and s.stack:
            s.cell = []
        elif t == 'br' and s.cell is not None:
            s.cell.append(' ')

    def handle_endtag(s, t):
        if t in SKIP and s.skip:
            s.skip -= 1
        if t in ('td', 'th') and s.stack and s.cell is not None:
            if s.row is None:
                s.row = []
            s.row.append(re.sub(r'\s+', ' ', ''.join(s.cell)).strip()); s.cell = None
        elif t == 'tr' and s.stack and s.row is not None:
            s.stack[-1]['rows'].append(s.row); s.row = None
        elif t == 'table' and s.stack:
            s.tables.append(s.stack.pop())

    def handle_data(s, d):
        if s.skip:
            return
        if s.cell is not None:
            s.cell.append(d)
        else:
            t = re.sub(r'\s+', ' ', d).strip()
            if t:
                s.recent.append(t[:60]); s.recent = s.recent[-12:]


allt = {}
for ui in want:
    u = urls[ui - 1]
    d = log.get(u)
    print(f"===== u{ui} {u}")
    if not d or not d['file']:
        print('  NOFILE'); continue
    h = open(os.path.join(DL, d['file']), 'rb').read().decode('utf-8', 'replace')
    tp = TableP(); tp.feed(h)
    allt[f'u{ui}'] = tp.tables
    print(f"  tables: {len(tp.tables)}")
    for ti, t in enumerate(tp.tables):
        print(f"  -- T{ti} rows={len(t['rows'])} before: {t['before'][-160:]}")
        for ri, rw in enumerate(t['rows'][:maxrows]):
            print(f"     r{ri}: " + ' | '.join(rw))
json.dump(allt, open(OUTJ, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
