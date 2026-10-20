import sys, os, re, json
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

fl = flight(open(os.path.join(common.DL, 'salomon_us_sizingchart.html'), encoding='utf-8', errors='replace').read())
dec = json.JSONDecoder()
target = int(sys.argv[1]) if len(sys.argv) > 1 else 365393
k = fl.rfind('"fields":{', 0, target)
obj, end = dec.raw_decode(fl, k + len('"fields":'))
print('fields keys:', list(obj.keys()))
for key in ['administrativeTitle', 'title', 'subtitle', 'gender', 'slug', 'sizeGrid', 'productLine', 'sizeToOrder']:
    print(f'  {key}:', ascii(obj.get(key)))
print('  content texts:', ascii(' | '.join(t for t in texts(obj.get('content'), []) if t.strip())))
print('  paragraph:', ascii(obj.get('paragraph')))
sg = obj.get('sizingGuideJson') or {}
print('  header:', ascii(sg.get('header')))
print('  rows:', len(sg.get('rows', [])), 'row 12:', ascii(sg.get('rows', [[]] * 12)[11]))
# the page's own heading for this route, and which entry the route shows
for pat in [r'"slug":"unisex-footwear"', r'sizingchart', r'"defaultChart', r'"selected']:
    hits = [m.start() for m in re.finditer(pat, fl)]
    print('route/pattern', pat, 'hits', len(hits), hits[:6])
wide = [m.start() for m in re.finditer(re.escape('more than 107mm'), fl)]
print('wide-foot hits', wide)
for w in wide:
    kk = fl.rfind('"fields":{', 0, w)
    try:
        o, e = dec.raw_decode(fl, kk + len('"fields":'))
        print('   in entry', ascii(o.get('title')), ascii(o.get('slug')), ascii(o.get('gender')))
    except Exception as ex:
        print('   decode failed', ex)
