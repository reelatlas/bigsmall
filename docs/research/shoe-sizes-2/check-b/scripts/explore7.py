import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common, tables

sec = sys.argv[1]
if sec == 'pdfcols':
    lines = open(os.path.join(common.DL, 'birk_template-table.txt'), encoding='utf-8', errors='replace').read().splitlines()
    def cells(line, label):
        i = line.find(label)
        if i < 0:
            return None
        body = line[i + len(label):]
        off = i + len(label)
        return [(m.start() + off, m.end() + off, m.group()) for m in re.finditer(r'\S+', body)]
    eu = mm = ukl = lad = men = chi = None
    for l in lines:
        s = l.strip()
        if s.startswith('EU ') and eu is None: eu = cells(l, 'EU')
        elif s.startswith('MM ') and mm is None and '150' in l and '2M2M5' not in l: mm = cells(l, 'MM')
        elif s.startswith('US Children'): chi = cells(l, 'US Children')
        elif s.startswith('US Ladies'): lad = cells(l, 'US Ladies')
        elif s.startswith('US Men'): men = cells(l, 'US Men')
        elif s.startswith('UK ') and ukl is None: ukl = cells(l, 'UK')
    def col_of(c):
        # the EU column whose span overlaps or is nearest to this cell's span
        best = min(eu, key=lambda e: abs((e[0] + e[1]) / 2 - (c[0] + c[1]) / 2))
        return best[2]
    for name, row in [('MM', mm), ('US Children', chi), ('US Ladies', lad), ('US Men', men), ('UK', ukl)]:
        if row:
            print(name, ascii([(col_of(c), c[2]) for c in row]))
    print('EU count', len(eu), 'MM count', len(mm or []), 'UK count', len(ukl or []))

if sec == 'drmsaved':
    p = r'C:\Users\seanr\AppData\Local\Temp\claude\c--Users-seanr-Projects-bigsmall\d4404652-7fd8-4dc0-84d9-cf2a5b88bd28\scratchpad\shoe-sizes-2\brands-b\downloads\drm_us_sizeguide.html'
    raw = open(p, encoding='utf-8', errors='replace').read()
    print('saved copy chars', len(raw), 'title', ascii(re.findall(r'<title>([^<]*)', raw)[:1]))
    ts = tables.tables(raw)
    print('tables', len(ts))
    for t in ts[:3]:
        rows = [r for r in t['rows'] if r]
        print('--- heading', ascii(t['heading']), 'rows', len(rows))
        for k, r in enumerate(rows[:12]):
            print('   ', k, ascii(r))
    i = raw.find('25.5')
    print('raw around 25.5:', ascii(raw[max(0, i - 700):i + 900]) if i >= 0 else 'no 25.5')

if sec == 'crocscms':
    page = open(os.path.join(common.DL, 'crocs_js', '37cn2zrwdt121.js'), encoding='utf-8', errors='replace').read()
    for pat in [r'fetch\(', r'mediaBlock', r'contentSlot|cms|amplience|contentful', r'sizeChartPage']:
        hits = [m.start() for m in re.finditer(pat, page, re.I)]
        print('PAGE', pat, 'hits', len(hits))
        for h in hits[:2]:
            print('    ', ascii(page[max(0, h - 250):h + 350]))
