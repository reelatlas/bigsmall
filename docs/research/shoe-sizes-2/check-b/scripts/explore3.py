import sys, os, re, json, html, subprocess, shutil, concurrent.futures
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common, tables, fetch

def load(n):
    return open(os.path.join(common.DL, n), encoding='utf-8', errors='replace').read()

def flight(raw):
    out = []
    for m in re.finditer(r'self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)', raw):
        try:
            out.append(json.loads('"' + m.group(1) + '"'))
        except Exception:
            out.append('')
    return ''.join(out)

def ctx(label, text, needles, width=300, maxhits=2):
    for nd in needles:
        hits = [m.start() for m in re.finditer(re.escape(nd), text)]
        print(f'*** {label} needle={nd!r} hits={len(hits)}')
        for h in hits[:maxhits]:
            print('     ', ascii(text[max(0, h - width):h + width]))

def enclosing_string(t, i):
    a = i
    while a > 0:
        a -= 1
        if t[a] == '"' and t[a - 1] != '\\':
            break
    b = i
    while b < len(t) - 1:
        b += 1
        if t[b] == '"' and t[b - 1] != '\\':
            break
    return a, b

sec = sys.argv[1] if len(sys.argv) > 1 else 'all'

if sec in ('all', 'au'):
    raw = load('clarks_au_sizeguide.html')
    pos = [m.start() for m in re.finditer(r'<table', raw)]
    for k in range(min(3, len(pos))):
        lo = raw.rfind('</table>', 0, pos[k]) if k else max(0, pos[k] - 6000)
        seg = raw[lo:pos[k]]
        attrs = re.findall(r'<(div|section|li|button|a|span)\b([^>]*)>', seg)
        print(f'AU T{k} tags before:', ascii([(t, a.strip()[:120]) for t, a in attrs][-8:]))

if sec in ('all', 'crocs'):
    for name in ['crocs_default.json', 'crocs_gb.json']:
        d = json.loads(load(name))
        print('=====', name)
        for key in ['adults', 'kids']:
            print('  --', key, 'rows', len(d[key]))
            for n, r in enumerate(d[key], 1):
                flag = ''
                try:
                    if 'cm' in r and 'mm' in r and abs(float(r['cm']) * 10 - float(r['mm'])) > 0.01:
                        flag = ' <cm*10 != mm>'
                except Exception:
                    flag = ' <non-numeric>'
                print(f'    [{n}]', ascii(r) + flag)
    raw = load('crocs_sizechart.html')
    srcs = sorted(set(re.findall(r'<script[^>]+src="(/_next/[^"]+)"', raw)))
    os.makedirs(os.path.join(common.DL, 'crocs_js'), exist_ok=True)
    jobs = [('crocs_js/' + s.rsplit('/', 1)[1], 'https://www.crocs.com' + s, 'en-US,en;q=0.9', '*/*') for s in srcs]
    with concurrent.futures.ThreadPoolExecutor(8) as ex:
        res = list(ex.map(lambda j: fetch.get(*j), jobs))
    print('crocs js fetched:', sum(1 for r in res if r.get('status') == 200), 'of', len(res), 'bytes', sum(r.get('bytes', 0) for r in res))
    json.dump(res, open(os.path.join(common.CB, 'scripts', 'fetch_log_crocs_js.json'), 'w'), indent=1)
    for r in res:
        p = os.path.join(common.DL, r['name'])
        if r.get('status') != 200 or not os.path.exists(p):
            continue
        t = open(p, encoding='utf-8', errors='replace').read()
        for nd in ['korea.json', 'inchToCm', 'adultLength', 'longest toe', 'Heel-to-Toe', 'heel to', 'Trace']:
            for m in list(re.finditer(re.escape(nd), t))[:2]:
                h = m.start()
                print(f'### {r["name"]} {nd!r} @{h}:', ascii(t[max(0, h - 500):h + 700]))

if sec in ('all', 'salomon'):
    fl = flight(load('salomon_us_sizingchart.html'))
    dec = json.JSONDecoder()
    seen = set()
    for pat in ['{"rows":[', '{"header":[']:
        for m in re.finditer(re.escape(pat), fl):
            try:
                obj, end = dec.raw_decode(fl, m.start())
            except Exception:
                continue
            dump = json.dumps(obj, ensure_ascii=False)
            if '9.5 M / 10.5 W' in dump and dump not in seen:
                seen.add(dump)
                print('===== salomon chart object at', m.start(), 'end', end)
                print('   before:', ascii(fl[max(0, m.start() - 700):m.start()]))
                print('   after:', ascii(fl[end:end + 300]))
                print('   header:', ascii(obj.get('header')))
                for n, row in enumerate(obj.get('rows', []), 1):
                    print(f'   [{n}]', ascii([c.get('title') for c in row]), ascii({k: v for k, v in row[0].items() if k not in ('type', 'title')}))
    for nd in ['socks that you would normally wear', 'more than 107mm', 'longer distance']:
        done = set()
        for m in re.finditer(re.escape(nd), fl):
            a, b = enclosing_string(fl, m.start())
            if (a, b) in done:
                continue
            done.add((a, b))
            s = fl[a + 1:b]
            print(f'~~~ {nd!r} string@{a} len {b - a}:', ascii(s[:1400]))
            print('      before:', ascii(fl[max(0, a - 250):a]))
            print('      after:', ascii(fl[b:b + 250]))

if sec in ('all', 'pdf'):
    pdf = os.path.join(common.DL, 'birk_template_us_a4.pdf')
    for exe in ['pdftotext', 'pdftoppm', 'pdfinfo', 'pdfimages']:
        print(exe, shutil.which(exe))
    out = os.path.join(common.DL, 'birk_template_layout.txt')
    subprocess.run(['pdftotext', '-layout', pdf, out], check=False)
    print(open(out, encoding='utf-8', errors='replace').read())
    out2 = os.path.join(common.DL, 'birk_template_bbox.html')
    r = subprocess.run(['pdftotext', '-bbox', pdf, out2], capture_output=True, text=True)
    print('bbox rc', r.returncode, r.stderr[:200])
    if shutil.which('pdfinfo'):
        print(subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout)
    if shutil.which('pdftoppm'):
        r = subprocess.run(['pdftoppm', '-r', '110', '-png', pdf, os.path.join(common.DL, 'birk_template')], capture_output=True, text=True)
        print('pdftoppm rc', r.returncode, r.stderr[:200], [f for f in os.listdir(common.DL) if f.startswith('birk_template')])
