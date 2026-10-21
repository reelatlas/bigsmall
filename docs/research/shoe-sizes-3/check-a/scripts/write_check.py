import sys, os, re, csv, json, unicodedata, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
CSV, DL, TXT, LOG, BASE, WDIR = sys.argv[1:7]
rows, urls = load_rows(CSV)
log = load_log(LOG)
DATE = '2026-10-21'
T = {}
for f in ('tables_brooks.json', 'tables_reebok.json'):
    T.update(json.load(open(os.path.join(BASE, f), encoding='utf-8')))
NOTES = {}
for line in open(os.path.join(BASE, 'scripts', 'notes.txt'), encoding='utf-8'):
    line = line.rstrip('\n')
    if not line or line.startswith('#'):
        continue
    p = line.split('¦') + [''] * 5
    NOTES[p[0]] = dict(result=p[1], tool=p[2], fv=p[3], note=p[4])

pc = {}


def P(key):
    if key not in pc:
        if isinstance(key, str):
            h = open(os.path.join(WDIR, key[2:]), 'rb').read().decode('utf-8', 'replace')
            tp = TP(); tp.feed(h)
            pc[key] = dict(vis=''.join(tp.parts), raw=rawtext(h))
        else:
            pc[key] = page(urls[key - 1], log, DL, TXT)
    return pc[key]


def lower1(s):
    return ''.join(c.lower() if len(c.lower()) == 1 else c for c in s)


def keep_map(s):
    out, idx, prev = [], [], True
    for i, ch in enumerate(s):
        n = unicodedata.normalize('NFKC', ch).translate(CYR)
        for a, b in REPL:
            n = n.replace(a, b)
        for c in n:
            if c.isspace():
                if prev:
                    continue
                c = ' '; prev = True
            else:
                prev = False
            out.append(c); idx.append(i)
    return lower1(''.join(out)), idx


mc = {}


def M(key, src):
    if (key, src) not in mc:
        s = P(key)[src]
        low, idx = keep_map(s)
        mc[(key, src)] = (s, low, idx)
    return mc[(key, src)]


def frag_pat(f):
    return '.{0,4}'.join(re.escape(lower1(keep(x))) for x in f.split('�')).replace('\\ ', ' ').replace(' ', ' ?')


def sentence_orig(s, oa, ob):
    st = oa
    while st > 0 and oa - st < 300:
        if s[st - 1] in '|\n' or (s[st - 1] in '.!?' and s[st].isspace()):
            break
        st -= 1
    en = ob
    if s[ob - 1] not in '.!?':
        while en < len(s) and en - ob < 300:
            if s[en] in '|\n' or (s[en] in '.!?' and (en + 1 >= len(s) or s[en + 1].isspace())):
                break
            en += 1
        if en < len(s) and s[en] in '.!?':
            en += 1
    return re.sub(r'\s+', ' ', s[st:en]).strip(' |')


def find_quote(key, frag):
    pat = frag_pat(frag)
    for src in ('vis', 'raw'):
        s, low, idx = M(key, src)
        m = re.search(pat, low)
        if m:
            return sentence_orig(s, idx[m.start()], idx[m.end() - 1] + 1), src
    return None, None


def rxify(t):
    return re.escape(t).replace('\\ ', ' ').replace(' ', r'[\s|]+').replace("'", "['’]")


def span(key, a, b=None, src='vis', ext=False):
    s = P(key)[src]
    ma = re.search(rxify(a), s)
    if not ma:
        return None
    end = ma.end()
    if b is not None:
        mb = re.search(rxify(b), s[ma.start():])
        if not mb:
            return None
        end = ma.start() + mb.end()
    if ext:
        while end < len(s) and s[end] not in '.!?':
            end += 1
        end = min(len(s), end + 1)
    return re.sub(r'\s+', ' ', s[ma.start():end]).strip(' |')


W1 = 'W:tim-us-howtomeasure.html'
EX = {
    'A-C001': [(1, 'Foot Length (CM) US UK EU')],
    'A-C002': [(2, 'Schuhgrößenvergleich'), (2, 'Fußlänge (CM) US UK Europa')],
    'A-C003': [(1, 'Need help? Read our foot measurement guide', 'View guide.')],
    'A-C017': [(12, 'US Men US Women UK Men UK Women Europe Unisex Japan Men (cm) Japan Women (cm)')],
    'A-C018': [(13, 'Skechers Performance running and walking footwear sizes may vary')],
    'A-C019': [(14, 'Print this Guide on', 'any similar option.'), (14, 'With a ruler, check', 'are accurate.'),
               (14, 'PLACE HEEL AT ZERO MARKER'), (14, 'If the child', 'a better fit.')],
    'A-C022': [(16, 'Download our printer-friendly fit guide', "Men's Fit Guide")],
    'A-C026': [(17, "Men's shoes US UK EU Length cm"), (17, "Women's shoes US UK EU Length cm")],
    'A-C027': [(19, 'Product Measurements Size Length (cm)', '11 27.5')],
    'A-C028': [(18, "Kids' Sizing Toddler Shoes", '5.5 in')],
    'A-C029': [(20, 'JPN/CM = Japanese Sizing / CM Measurements')],
    'A-C030': [(21, 'Getting the right fit for your clothes', 'gives you', 'vis', True)],
    'A-C031': [(22, 'Size chart True to size'), (22, 'Size & Fit True to size.')],
    'A-C035': [], 'A-C043': [],
    'A-C036': [(26, "Men's Footwear US UK EU CM INCH"), ('AUTO', 1), ('AUTO', 2)],
    'A-C048': [(32, "Men's and women's adidas footwear sizing", 'Heel-toe (INCH)'), (32, 'Heel-toe (cm)', '22.1 cm')],
    'A-C049': [(32, 'For the best fit', 'to get the right size.')],
    'A-C053': [(35, 'Make sure you are wearing the same socks', 'FOOT LENGTH (INCH)')],
    'A-C054': [('AUTO', 0), (36, 'FOOT LENGTH (CM) FOOT LENGTH (INCH)')],
    'A-C055': [(37, 'Measure in the late afternoon', 'bigger than the other.'),
               (37, 'FIND YOUR SIZE', 'full weight on your foot.')],
    'A-C058': [(39, 'This style runs large', 'half size down.'),
               (39, 'Have a friend mark the longest part', 'you marked for each foot.')],
    'A-C060': [(40, 'FOOT: We start with the true foot', 'later in the day is recommended.')],
    'A-C065': [(45, "Women's and Men's", "US Women's")],
    'A-C066': [(46, 'How to Measure Size guide Foot length')],
    'A-C068': [(46, 'The size of our boots, shoes and sandals', 'most run true to size.'),
               (46, 'If you are in-between sizes', 'is the way to go.'),
               (46, 'If you go with a larger size', 'adds half a size.')],
    'A-C070': [(48, 'US sizes and measurements (in mm)', '81 84')],
    'A-C072': [(50, 'If your kid', 'measure the width.'), (50, 'Have your kid stand on the size chart', 'measure their left foot.')],
    'A-C073': [('AUTO', 0), (51, 'Unisex Shoes US Men US Women US Boy UK EU JP Foot Length')],
    'A-C075': [(53, 'Place a piece of paper', 'to get the right size!')],
    'A-C076': [(W1, 'For the most accurate measurement', 'center back of your heel.'),
               (W1, 'Once you know how to measure boot size', 'measurements of our boots.')],
    'A-C077': [(55, "We're Sorry", 'no longer available.')],
    'A-C078': [(56, '"adults":{"header":"Shoe Size Chart"', 'order your normal size."', 'raw'),
               (56, '"kids":{"header":"Kids Size Chart"', 'shop our adult sizes."', 'raw'),
               (56, '"table":{"adultLength"', '"footLength":"Heel to Toe Length"', 'raw')],
}


def fileref(u):
    u = u.strip()
    d = log.get(u)
    return f"{u} [downloads/{d['file']}]" if d and d['file'] else f"{u} [no file]"


def frags(r):
    return [f.strip() for f in re.split(r'\.\.\.|…', r['exact_words']) if len(f.strip()) >= 3]


out, warn = [], []
for r in rows:
    if r['kind'] != 'claim':
        continue
    cid, ui = r['id'], urls.index(r['url'].strip()) + 1
    n = NOTES[cid]
    fs = frags(r)
    quotes, srcs = [], set()
    specs = EX.get(cid, [('AUTO', i) for i in range(len(fs))])
    for sp in specs:
        if sp[0] == 'AUTO':
            q, src = find_quote(ui, fs[sp[1]])
            if src == 'raw':
                srcs.add('embedded data')
        else:
            key, a = sp[0], sp[1]
            b = sp[2] if len(sp) > 2 else None
            src = sp[3] if len(sp) > 3 else 'vis'
            q = span(key, a, b, src, sp[4] if len(sp) > 4 else False)
            if src == 'raw':
                srcs.add('embedded data')
        if not q:
            warn.append(f'{cid}: no quote for {sp}')
        elif q not in quotes:
            quotes.append(q)
    ex = ' ... '.join(quotes)
    pdf = r['url'].strip().lower().endswith('.pdf')
    tool = n['tool'] or ('script (curl; pdftotext)' if pdf else 'script (curl; html.parser)')
    if srcs and 'embedded' not in tool:
        tool += '; quoted from embedded data'
    uf = fileref(r['url'])
    if r['second_url'].strip():
        uf += '; 2nd: ' + fileref(r['second_url'])
    if cid == 'A-C076':
        uf += '; worker copy: scratchpad/shoe-sizes-3/rules/downloads/tim-us-howtomeasure.html'
    out.append([cid, n['result'], n['fv'], ex, uf, tool, DATE, n['note']])

CH = {"Women's running shoes, Shoe size comparison": ('u1', 0),
      "Men's running shoes, Shoe size comparison": ('u57', 0),
      "All gender shoes, EU Shoe size comparison": ('u58', 0),
      "All gender shoes, US Shoe size comparison": ('u58', 1),
      "Winter Boots Sizing, Women's Boots": ('u28', 1),
      "Winter Boots Sizing, Men's Boots": ('u28', 2),
      "Men's Size Guides, Men's Footwear": ('u26', 0),
      "Women's Size Guides, Women's Footwear": ('u26', 3)}
dup = {('u26', 0): [11, 20, 25], ('u26', 3): [12, 21, 26]}
for r in rows:
    if r['kind'] != 'cell':
        continue
    key = next((k for k in CH if r['chart'].strip().startswith(k)), None)
    if not key:
        out.append([r['id'], 'could not reach', '', '', fileref(r['url']), 'script', DATE, 'chart not matched by name']); warn.append(r['id']); continue
    uk, ti = CH[key]
    t = T[uk][ti]['rows']
    hdr = t[0]
    col = hdr.index(r['column'].strip()) if r['column'].strip() in hdr else None
    ri = int(r['row'])
    if col is None or ri >= len(t):
        out.append([r['id'], 'wrong', '', ' | '.join(hdr), fileref(r['url']), 'script', DATE, 'column or row not in the chart']); warn.append(r['id']); continue
    val = t[ri][col]
    res = 'confirmed' if val.strip() == r['value'].strip() else 'corrected'
    note = f"Row {ri} of the chart counting from the first row under the header, as the worker counted; the page's value as printed."
    if (uk, ti) in dup:
        same = all(T[uk][j]['rows'] == t for j in dup[(uk, ti)])
        note += f" The same chart repeats in the page's other tabs (tables {dup[(uk, ti)]}) {'with identical cells' if same else 'WITH DIFFERENT CELLS'}."
    if uk == 'u1':
        note += " The page's default chart, under 'Women's running shoes size guides'."
    out.append([r['id'], res, val, f"{' | '.join(hdr)} / {' | '.join(t[ri])}", fileref(r['url']),
                'script (curl; html.parser table read)', DATE, note])

order = {r['id']: i for i, r in enumerate(rows)}
out.sort(key=lambda x: order[x[0]])
with open(os.path.join(BASE, 'check.csv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f)
    w.writerow(['id', 'result', 'found_value', 'exact_words', 'url_or_file', 'tool', 'date_checked', 'note'])
    w.writerows(out)
kinds = {r['id']: r['kind'] for r in rows}
cnt = collections.Counter((kinds[o[0]], o[1]) for o in out)
print('rows written:', len(out), dict(cnt))
print('warnings:', warn)
for o in out:
    if o[1] != 'confirmed' or kinds[o[0]] == 'claim':
        print(f"{o[0]} {o[1]} | {o[3][:150]}")
