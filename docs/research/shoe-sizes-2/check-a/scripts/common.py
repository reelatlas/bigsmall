# shared helpers: table extraction (stdlib html.parser), recording to check.csv and sources.md
import csv, os, re, html, json
from html.parser import HTMLParser
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(B, 'downloads')
FIELDS = ['id', 'result', 'found_value', 'exact_words', 'url_or_file', 'tool', 'date_checked', 'note']
DATE = '2026-10-20'

class TP(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables = []; self.stack = []; self.cell = None; self.lasttext = []; self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript', 'template'): self.skip += 1; return
        if tag == 'table':
            ctx = ' / '.join(t for t in self.lasttext[-4:])
            self.stack.append({'context': ctx, 'rows': [], 'attrs': dict(attrs)})
        elif tag == 'tr' and self.stack:
            self.stack[-1]['rows'].append([])
        elif tag in ('td', 'th') and self.stack:
            if not self.stack[-1]['rows']: self.stack[-1]['rows'].append([])
            self.cell = {'tag': tag, 'text': '', 'attrs': dict(attrs)}
        elif tag in ('br',) and self.cell is not None:
            self.cell['text'] += ' '
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript', 'template'): self.skip = max(0, self.skip - 1); return
        if tag in ('td', 'th') and self.cell is not None and self.stack:
            self.cell['text'] = re.sub(r'\s+', ' ', self.cell['text']).strip()
            self.stack[-1]['rows'][-1].append(self.cell); self.cell = None
        elif tag == 'table' and self.stack:
            t = self.stack.pop(); t['rows'] = [r for r in t['rows'] if r]; self.tables.append(t)
    def handle_data(self, data):
        if self.skip: return
        if self.cell is not None: self.cell['text'] += data
        else:
            s = re.sub(r'\s+', ' ', data).strip()
            if s: self.lasttext.append(s[:80])

def load(name):
    return open(os.path.join(D, name + '.html'), encoding='utf-8', errors='replace').read()

def tables(htmltext):
    p = TP(); p.feed(htmltext); return p.tables

def dump(t, i, maxrows=999):
    print('#%d ctx=[%s] rows=%d' % (i, t['context'][-160:], len(t['rows'])))
    for k, r in enumerate(t['rows'][:maxrows]):
        print('  %2d: %s' % (k, ' | '.join(c['text'] for c in r)))

def text_of(htmltext):
    t = re.sub(r'(?is)<(script|style|noscript)[^>]*>.*?</\1>', ' ', htmltext)
    t = re.sub(r'(?s)<[^>]+>', ' ', t)
    return re.sub(r'\s+', ' ', html.unescape(t))

def record(rows):
    path = os.path.join(B, 'check.csv'); ex = {}
    if os.path.exists(path):
        with open(path, encoding='utf-8', newline='') as f:
            for r in csv.DictReader(f): ex[r['id']] = r
    for r in rows:
        r = dict(r); r.setdefault('date_checked', DATE); ex[r['id']] = {k: r.get(k, '') for k in FIELDS}
    with open(path, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=FIELDS); w.writeheader()
        for i in sorted(ex, key=lambda x: int(x[1:])): w.writerow(ex[i])
    print('recorded', [r['id'] for r in rows])

def source(text):
    with open(os.path.join(B, 'sources.md'), 'a', encoding='utf-8') as f: f.write(text.rstrip() + '\n\n')

def myrows():
    out = {}
    with open(os.path.join(B, 'my-rows.csv'), encoding='utf-8', newline='') as f:
        for r in csv.DictReader(f): out[r['id']] = r
    return out

def norm(v):
    s = str(v).strip().replace(',', '.').replace(' ', ' ')
    s = re.sub(r'\s*(cm|in\.?|")$', '', s, flags=re.I).strip()
    try: return repr(float(s))
    except ValueError: return re.sub(r'\s+', ' ', s).lower()

def verdict(recorded, found):
    if found is None: return 'wrong'
    return 'confirmed' if norm(recorded) == norm(found) else 'corrected'

def grid(t):
    return [[c['text'] for c in r] for r in t['rows']]

def check_cells(ids, g, url, page, tool, note_fn=None, header_row=0):
    """g: list of rows of strings, g[header_row] the header; data row i (from 1) = g[header_row + i]."""
    R = myrows(); out = []; hdr = g[header_row]
    for rid in ids:
        r = R[rid]; i = int(r['row']); col = r['column']
        cols = [k for k, h in enumerate(hdr) if h == col] or [k for k, h in enumerate(hdr) if h.strip().lower() == col.strip().lower()]
        row = g[header_row + i] if header_row + i < len(g) else None
        found = row[cols[0]] if (row is not None and cols and cols[0] < len(row)) else None
        lab = ' ; '.join('%s %s' % (h, row[k]) for k, h in enumerate(hdr) if row is not None and k < len(row))
        v = verdict(r['value'], found)
        note = 'Data row %d (header excluded) reads: %s.' % (i, ' | '.join(row) if row else 'none')
        if found is not None and norm(found) == norm(r['value']) and found.strip() != r['value'].strip(): note += ' Printed as "%s".' % found
        if note_fn: note += ' ' + note_fn(rid, r, row, found)
        out.append(dict(id=rid, result=v, found_value=found if found is not None else '', exact_words=lab, url_or_file=url + ' ; downloads/' + page + '.html', tool=tool, note=note.strip()))
    record(out)
    for o in out: print('  ', o['id'], o['result'], repr(o['found_value']), '| rec', repr(R[o['id']]['value']))
    return out
