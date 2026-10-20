import sys, os, re, json, glob
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

raw = open(os.path.join(common.DL, 'crocs_sizechart.html'), encoding='utf-8', errors='replace').read()
fl = flight(raw)
texts = {'html': raw, 'flight': fl}
for p in glob.glob(os.path.join(common.DL, 'crocs_js', '*.js')):
    texts[os.path.basename(p)] = open(p, encoding='utf-8', errors='replace').read()

def show(label, t, pat, before=300, after=900, maxhits=2, flags=re.I):
    for m in list(re.finditer(pat, t, flags))[:maxhits]:
        h = m.start()
        print(f'### {label} /{pat}/ @{h}:', ascii(t[max(0, h - before):h + after]))

for k, t in texts.items():
    for pat in [r'longest', r'heel[- ]to[- ]toe', r'measure the', r'trac(e|ing) (your|the|around)', r'step 3|3\. ']:
        if k.endswith('.js') and pat.startswith('step'):
            continue
        show(k, t, pat, 250, 500, 2)

page = texts.get('37cn2zrwdt121.js', '')
for pat in [r'defaultUnit', r'showToggle', r'\.inches', r'unit\]', r'Length']:
    show('page-chunk', page, pat, 200, 700, 3, 0)
for k, t in texts.items():
    if not k.endswith('.js'):
        continue
    for pat in [r'[,\[]756141[,:]\s*(?:\(?\w+\)?\s*=>|function)', r'[,\[]230323[,:]\s*(?:\(?\w+\)?\s*=>|function)']:
        show(k, t, pat, 50, 1600, 1, 0)
