import sys, os, re, json, glob, subprocess, shutil
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
if sec == 'pdf':
    pdf = os.path.join(common.DL, 'birk_template_us_a4.pdf')
    print('renderers:', {e: shutil.which(e) for e in ['pdftopng', 'pdftoppm', 'pdftohtml', 'gswin64c', 'gs', 'magick', 'mutool', 'qpdf']})
    for mode in ['-raw', '-table', '-lineprinter']:
        out = os.path.join(common.DL, f'birk_template{mode}.txt')
        r = subprocess.run(['pdftotext', mode, pdf, out], capture_output=True, text=True)
        print('=====', mode, 'rc', r.returncode)
        if os.path.exists(out):
            lines = open(out, encoding='utf-8', errors='replace').read().splitlines()
            keep = [l for l in lines if re.search(r'\d-\d|US |UK|MM|EU|Ladies|Men|Children|7,0|260', l)]
            for l in keep[:40]:
                print('  |', ascii(l.rstrip()[:260]))

if sec == 'crocs':
    page = open(os.path.join(common.DL, 'crocs_js', '37cn2zrwdt121.js'), encoding='utf-8', errors='replace').read()
    for pat in [r'"link"\)', r'S\("link"\)', r'howToMeasure|how-to-measure|measure', r'href:']:
        for m in list(re.finditer(pat, page))[:3]:
            print('PAGE', pat, '@', m.start(), ascii(page[max(0, m.start() - 400):m.start() + 400]))
    raw = open(os.path.join(common.DL, 'crocs_sizechart.html'), encoding='utf-8', errors='replace').read()
    for pat in [r'how-to-measure[^"\\]*', r'measure[^"\\]{0,40}\.html', r'/[a-z-]*measur[a-z-]*']:
        print('HTML', pat, sorted(set(re.findall(pat, raw, re.I)))[:10])

if sec == 'salomon':
    fl = flight(open(os.path.join(common.DL, 'salomon_us_sizingchart.html'), encoding='utf-8', errors='replace').read())
    dec = json.JSONDecoder()
    for m in re.finditer(r'"id":"pageSizingChart"', fl):
        kk = fl.find('"fields":{', m.start())
        try:
            o, e = dec.raw_decode(fl, kk + len('"fields":'))
        except Exception:
            continue
        body = ' '.join(texts(o.get('content'), [])) + ' ' + str(o.get('paragraph') or '')
        if '+0.5' in body or '107mm' in body or (o.get('slug') in ('unisex-footwear', 'footwear', 'footwear-men', 'footwear-women')):
            w = [s for s in re.split(r'(?<=[.:])\s+', body) if re.search(r'wide|width|\+0\.5', s, re.I)]
            print('ENTRY', ascii(o.get('title')), ascii(o.get('slug')), ascii(o.get('gender')), 'wide sentences:', ascii(w[:6]))
