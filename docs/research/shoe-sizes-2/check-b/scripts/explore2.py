import sys, os, re, json, html
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common, tables

def load(n):
    return open(os.path.join(common.DL, n), encoding='utf-8', errors='replace').read()

def strip(seg):
    seg = re.sub(r'(?is)<(script|style|noscript)\b.*?</\1>', ' ', seg)
    return ' '.join(html.unescape(re.sub(r'(?s)<[^>]+>', ' ', seg)).split())

def flight(raw):
    out = []
    for m in re.finditer(r'self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)', raw):
        try:
            out.append(json.loads('"' + m.group(1) + '"'))
        except Exception as e:
            out.append('')
    return ''.join(out)

def ctx(label, text, needles, width=300, maxhits=2):
    for nd in needles:
        hits = [m.start() for m in re.finditer(re.escape(nd), text)]
        print(f'*** {label} needle={nd!r} hits={len(hits)}')
        for h in hits[:maxhits]:
            print('     ', ascii(text[max(0, h - width):h + width]))

# 1. Clarks AU: labels before each table
raw = load('clarks_au_sizeguide.html')
pos = [m.start() for m in re.finditer(r'<table', raw)]
for k, p in enumerate(pos):
    print(f'AU T{k} text before:', ascii(strip(raw[max(0, p - 3000):p])[-300:]))
for m in re.finditer(r'>\s*((?:WO)?MEN\S{0,2}|(?:Wo)?[Mm]en\S{0,2}|BABY[^<]{0,20}|KIDS[^<]{0,20})\s*<', raw):
    print('  AU label at', m.start(), ascii(m.group(1)), 'next table index:', sum(1 for q in pos if q < m.start()))

# 2. Crocs JSON
for name in ['crocs_default.json', 'crocs_gb.json']:
    d = json.loads(load(name))
    print('=====', name, type(d).__name__, list(d.keys())[:20] if isinstance(d, dict) else len(d))
    print(ascii(json.dumps(d)[:1500]))

# 3. Salomon flight data
raw = load('salomon_us_sizingchart.html')
fl = flight(raw)
print('===== salomon flight chars', len(fl), 'chunks', raw.count('self.__next_f.push'))
ctx('salomon', fl, ['Unisex', 'UNISEX', 'FOOT LENGTH', '43 1/3', 'socks', 'wall', '107', '+0.5'], 250, 3)

# 4. Crocs page
raw = load('crocs_sizechart.html')
srcs = re.findall(r'<script[^>]+src="([^"]+)"', raw)
print('===== crocs scripts', len(srcs))
for s in srcs: print('   ', s)
fl = flight(raw)
print('crocs flight chars', len(fl))
vis = strip(raw)
ctx('crocs-visible', vis, ['Heel', 'heel', 'longest toe', 'trace', 'Trace', 'size-chart'], 300, 2)
ctx('crocs-flight', fl, ['Heel', 'longest toe', 'korea', 'size-chart', 'Centimeters', 'mm'], 300, 2)
ctx('crocs-raw', raw, ['korea.json', 'default.json'], 200, 2)
