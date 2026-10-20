import sys, os, re, json, glob, subprocess, html
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common

def flight(raw):
    out = []
    for m in re.finditer(r'self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)', raw):
        try:
            out.append(json.loads('"' + m.group(1) + '"'))
        except Exception:
            out.append('')
    return ''.join(out)

def texts(node, acc):
    if isinstance(node, dict):
        if node.get('nodeType') == 'text':
            acc.append(node.get('value', ''))
        for v in node.values():
            if isinstance(v, (dict, list)):
                texts(v, acc)
    elif isinstance(node, list):
        for v in node:
            texts(v, acc)
    return acc

sec = sys.argv[1]
if sec == 'crocs':
    page = open(os.path.join(common.DL, 'crocs_js', '37cn2zrwdt121.js'), encoding='utf-8', errors='replace').read()
    i = page.find('regionData:d,unit:o')
    print('RENDER:', ascii(page[i - 600:i + 3600]))
    j = page.find('var V=') if 'var V=' in page else page.find('V={')
    for pat in [r'\bU=\[', r'\bV=\{', r'\bH=\{']:
        for m in list(re.finditer(pat, page))[:1]:
            print('DEF', pat, ascii(page[m.start():m.start() + 500]))
    raw = open(os.path.join(common.DL, 'crocs_sizechart.html'), encoding='utf-8', errors='replace').read()
    fl = flight(raw)
    for label, t in [('html', raw), ('flight', fl)]:
        for pat in [r'easur', r'\btoes?\b', r'paper', r'trac']:
            hits = [m.start() for m in re.finditer(pat, t, re.I)]
            print(f'{label} /{pat}/ hits {len(hits)}')
            for h in hits[:3]:
                print('    ', ascii(t[max(0, h - 200):h + 300]))
    for p in glob.glob(os.path.join(common.DL, 'crocs_js', '*.js')):
        t = open(p, encoding='utf-8', errors='replace').read()
        for pat in [r'easure your', r'longest', r'Heel-to']:
            for m in list(re.finditer(pat, t, re.I))[:1]:
                print('JS', os.path.basename(p), pat, ascii(t[max(0, m.start() - 200):m.start() + 300]))

if sec == 'salomon':
    fl = flight(open(os.path.join(common.DL, 'salomon_us_sizingchart.html'), encoding='utf-8', errors='replace').read())
    dec = json.JSONDecoder()
    target = fl.find('"slug":"unisex-footwear"')
    ct = fl.rfind('"id":"pageSizingChart"', 0, target)
    k = fl.find('"fields":{', ct)
    obj, end = dec.raw_decode(fl, k + len('"fields":'))
    print('entry span', k, end, 'target', target)
    for key in ['administrativeTitle', 'title', 'subtitle', 'gender', 'slug', 'sizeGrid', 'productLine', 'sizeToOrder']:
        print(f'  {key}:', ascii(obj.get(key)))
    print('  content texts:', ascii(' || '.join(t for t in texts(obj.get('content'), []) if t.strip())))
    print('  paragraph:', ascii(obj.get('paragraph')))
    sg = obj.get('sizingGuideJson') or {}
    print('  header:', ascii(sg.get('header')))
    rows = sg.get('rows', [])
    print('  rows', len(rows), 'row 12:', ascii(rows[11] if len(rows) > 11 else None))
    # list every sizing-chart entry title with footwear in its slug or productLine, and its gender
    titles = []
    for m in re.finditer(r'"id":"pageSizingChart"', fl):
        kk = fl.find('"fields":{', m.start())
        try:
            o, e = dec.raw_decode(fl, kk + len('"fields":'))
        except Exception:
            continue
        titles.append((o.get('title'), o.get('slug'), o.get('gender'), o.get('productLine')))
    print('entries:', len(titles))
    for t in titles:
        if t[3] and any('Footwear' in x for x in t[3]) or (t[1] and 'foot' in t[1]):
            print('   ', ascii(t))
    vis = re.sub(r'(?is)<(script|style)\b.*?</\1>', ' ', open(os.path.join(common.DL, 'salomon_us_sizingchart.html'), encoding='utf-8', errors='replace').read())
    vis = ' '.join(html.unescape(re.sub(r'(?s)<[^>]+>', ' ', vis)).split())
    i = vis.find('FOOT LENGTH')
    print('VISIBLE HTML around first chart:', ascii(vis[max(0, i - 1200):i + 400]) if i >= 0 else 'no FOOT LENGTH in visible HTML')

if sec == 'pdf':
    pdf = os.path.join(common.DL, 'birk_template_us_a4.pdf')
    out = os.path.join(common.DL, 'birk_template_layout.txt')
    subprocess.run(['pdftotext', '-layout', pdf, out], check=False)
    for line in open(out, encoding='utf-8', errors='replace').read().splitlines():
        if line.strip():
            print('L|', ascii(line.rstrip()))
    out2 = os.path.join(common.DL, 'birk_template_bbox.html')
    r = subprocess.run(['pdftotext', '-bbox', pdf, out2], capture_output=True, text=True)
    print('bbox rc', r.returncode, ascii(r.stderr[:200]))
    if os.path.exists(out2):
        b = open(out2, encoding='utf-8', errors='replace').read()
        pages = re.findall(r'<page width="([\d.]+)" height="([\d.]+)">', b)
        print('pages', pages)
        words = [(float(a), float(c), float(bb), float(d), html.unescape(w)) for a, bb, c, d, w in
                 re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', b)]
        print('words', len(words))
        json.dump(words, open(os.path.join(common.CB, 'scripts', 'birk_words.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        rows = {}
        for x0, x1, y0, y1, w in words:
            rows.setdefault(round(y0), []).append((x0, w))
        for y in sorted(rows):
            print(f'y={y:4d}', ascii(' '.join(f'{w}@{x:.0f}' for x, w in sorted(rows[y]))))
