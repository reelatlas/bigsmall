import sys, os, re, json, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
CSV, DL, TXT, LOG, MODE = sys.argv[1:6]
rows, urls = load_rows(CSV)
log = load_log(LOG)
R = {r['id']: r for r in rows}
cache = {}


def get(u):
    if u not in cache:
        p = page(u, log, DL, TXT)
        if p:
            p['vk'] = keep(p['vis']); p['vl'] = p['vk'].lower()
            p['rk'] = keep(p['raw']); p['rl'] = p['rk'].lower()
        cache[u] = p
    return cache[u]


def frags_of(r):
    return [f.strip() for f in re.split(r'\.\.\.|…', r['exact_words']) if len(f.strip()) >= 3]


def diff(fr, p):
    fw = keep(fr.replace('�', ' ')).split()
    fl = [w.lower() for w in fw]
    pos, src = -1, 'v'
    for src in ('v', 'r'):
        kl = p[src + 'l']
        for i in range(max(1, len(fl) - 2)):
            j = kl.find(' '.join(fl[i:i + 3]))
            if j >= 0:
                pos = max(0, j - len(' '.join(fw[:i])) - 40)
                break
        if pos >= 0:
            break
    if pos < 0:
        return 'NO ANCHOR'
    k = p[src + 'k']
    win = k[pos: pos + len(' '.join(fw)) + 250]
    ww = win.split(); wl = [w.lower() for w in ww]
    sm = difflib.SequenceMatcher(None, fl, wl, autojunk=False)
    blocks = [b for b in sm.get_matching_blocks() if b.size]
    if not blocks:
        return 'NO MATCH'
    b0, b1 = blocks[0].b, blocks[-1].b + blocks[-1].size
    ops = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal' or (tag == 'insert' and (j2 <= b0 or j1 >= b1)):
            continue
        ops.append(f"{tag}: rec[{' '.join(fw[i1:i2])}] page[{' '.join(ww[j1:j2])}]")
    head = f"src={src} PAGE: {' '.join(ww[b0:b1])}"
    return head + ('\n        ' + '\n        '.join(ops) if ops else '\n        IDENTICAL after normalising')


def kw(p, word, n=1, width=240):
    out = []
    for src in ('v', 'r'):
        k = p[src + 'k']; kl = p[src + 'l']
        start = 0
        while len(out) < n:
            j = kl.find(word.lower(), start)
            if j < 0:
                break
            out.append(f"[{src}] ..{k[max(0, j - width // 3): j + width]}..")
            start = j + len(word)
        if out:
            break
    return out or ['(none)']


DIFFS = [('A-C028', 'url', None), ('A-C049', 'url', None), ('A-C053', 'url', None), ('A-C053', 'second_url', None),
         ('A-C055', 'url', 0), ('A-C058', 'url', 1), ('A-C060', 'url', None), ('A-C060', 'second_url', None),
         ('A-C067', 'second_url', 3), ('A-C068', 'url', 0), ('A-C072', 'url', 0), ('A-C073', 'url', 1),
         ('A-C075', 'url', None), ('A-C005', 'second_url', None), ('A-C010', 'second_url', None),
         ('A-C011', 'second_url', None), ('A-C040', 'second_url', 2), ('A-C041', 'second_url', None),
         ('A-C065', 'second_url', None), ('A-C032', 'second_url', None), ('A-C007', 'second_url', None)]

KW = [(4, ['Foot Length', '1.5 sizes', 'unisex']), (5, ['unisex', 'all gender']), (7, ['half', 'holes']),
      (9, ['shorter']), (17, ['Product Measurements', 'Length cm', 'Unisex']),
      (19, ['Length cm', 'Length (cm)', 'Unisex']), (21, ['measure', 'length', 'between', 'unisex', 'foot']),
      (23, ['Brannock', 'ruler']), (27, ['Heel-Toe', 'length of the foot', 'between sizes', 'Club C']),
      (38, ['heel-to-toe', 'friend']), (39, ['afternoon', 'larger measurement']), (40, ['desired standards']),
      (42, ['longest toe', 'right-hand']), (43, ['Foot Length', 'approximate']), (46, ['starting point']),
      (48, ['next size up', 'based on']), (49, ['(in mm)', 'Narrow']), (53, ['big toe', 'line up']),
      (55, ['gone', 'no longer', 'size chart', 'foot length', 'measure']),
      (56, ['foot length', 'measure', 'loading', "men's", 'size chart'])]

if MODE == 'diff':
    for cid, key, idx in DIFFS:
        r = R[cid]; u = r[key].strip(); p = get(u)
        fs = frags_of(r)
        sel = range(len(fs)) if idx is None else [idx]
        for i in sel:
            print(f"{cid} {key} u{urls.index(u) + 1} frag{i}: {diff(fs[i], p) if p else 'NOFILE'}")
else:
    for ui, words in KW:
        u = urls[ui - 1]; p = get(u)
        print(f"== u{ui} {u[:90]}")
        if not p:
            print('   NOFILE'); continue
        for w in words:
            n = 2 if ui in (21, 55, 56) else 1
            for line in kw(p, w, n=n):
                print(f"  <{w}> {line}")
