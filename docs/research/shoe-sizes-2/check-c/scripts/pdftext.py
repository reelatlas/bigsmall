# Pure-Python text extraction for a Chrome-printed PDF: zlib streams, ToUnicode CMaps,
# text placed by Tm/Td under the CTM, grouped into lines by device y.
# A reader of a source file: run with python -I. Usage: python -I pdftext.py file.pdf
import re
import sys
import zlib


def parse_objs(data):
    objs = {}
    for m in re.finditer(rb'(?<![0-9])(\d+)\s+(\d+)\s+obj\b(.*?)\bendobj', data, re.S):
        num = int(m.group(1))
        body = m.group(3)
        sm = re.search(rb'\bstream\r?\n', body)
        if sm:
            d = body[:sm.start()]
            raw = body[sm.end():]
            e = raw.rfind(b'endstream')
            if e >= 0:
                raw = raw[:e]
            if b'/FlateDecode' in d:
                try:
                    raw = zlib.decompressobj().decompress(raw)
                except Exception:
                    raw = b''
            objs[num] = (d, raw)
        else:
            objs[num] = (body, None)
    for num, (d, raw) in list(objs.items()):
        if raw and b'/ObjStm' in d:
            n = int(re.search(rb'/N\s+(\d+)', d).group(1))
            first = int(re.search(rb'/First\s+(\d+)', d).group(1))
            head = raw[:first].split()
            pairs = [(int(head[2 * i]), int(head[2 * i + 1])) for i in range(n)]
            for i, (onum, off) in enumerate(pairs):
                end = pairs[i + 1][1] if i + 1 < n else len(raw) - first
                objs.setdefault(onum, (raw[first + off:first + end], None))
    return objs


def u16(h):
    h = h.decode()
    if len(h) % 2:
        h += '0'
    return bytes.fromhex(h).decode('utf-16-be', 'replace')


def parse_cmap(raw):
    m = {}
    nb = 2
    cs = re.search(rb'begincodespacerange\s*<([0-9A-Fa-f]+)>', raw)
    if cs:
        nb = len(cs.group(1)) // 2
    for block in re.findall(rb'beginbfchar(.*?)endbfchar', raw, re.S):
        for s, d in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>', block):
            m[int(s, 16)] = u16(d)
    for block in re.findall(rb'beginbfrange(.*?)endbfrange', raw, re.S):
        for lo, hi, rest in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(\[[^\]]*\]|<[0-9A-Fa-f]*>)', block):
            lo = int(lo, 16)
            hi = int(hi, 16)
            if rest.startswith(b'['):
                for i, dh in enumerate(re.findall(rb'<([0-9A-Fa-f]*)>', rest)):
                    m[lo + i] = u16(dh)
            else:
                base = bytes.fromhex(rest[1:-1].decode())
                bi = int.from_bytes(base, 'big')
                for c in range(lo, hi + 1):
                    m[c] = (bi + c - lo).to_bytes(len(base), 'big').decode('utf-16-be', 'replace')
    return m, nb


def entry(objs, d, key):
    m = re.search(rb'/' + key + rb'\s+(\d+)\s+0\s+R', d)
    if m:
        return objs.get(int(m.group(1)), (b'', None))[0]
    m = re.search(rb'/' + key + rb'\s*<<', d)
    if not m:
        return b''
    i = m.end() - 2
    depth = 0
    j = i
    while j < len(d):
        if d[j:j + 2] == b'<<':
            depth += 1
            j += 2
            continue
        if d[j:j + 2] == b'>>':
            depth -= 1
            j += 2
            if depth == 0:
                return d[i:j]
            continue
        j += 1
    return d[i:]


def mul(m1, m2):
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return [a1 * a2 + b1 * c2, a1 * b2 + b1 * d2, c1 * a2 + d1 * c2, c1 * b2 + d1 * d2,
            e1 * a2 + f1 * c2 + e2, e1 * b2 + f1 * d2 + f2]


ESC = {b'n': b'\n', b'r': b'\r', b't': b'\t', b'b': b'\b', b'f': b'\f',
       b'(': b'(', b')': b')', b'\\': b'\\'}


def _esc(m):
    g = m.group(1)
    if g in ESC:
        return ESC[g]
    if re.fullmatch(rb'[0-7]{1,3}', g):
        return bytes([int(g, 8) & 255])
    return g


def unescape(s):
    return re.sub(rb'\\([0-7]{1,3}|.)', _esc, s, flags=re.S)


TOK = re.compile(
    rb'<([0-9A-Fa-f\s]*)>'
    rb'|\(((?:\\.|[^\\()])*)\)'
    rb'|(\[)|(\])'
    rb'|/([^\s/\[\]()<>{}%]+)'
    rb'|([-+]?(?:\d+\.?\d*|\.\d+))'
    rb'|([A-Za-z*"\x27][A-Za-z0-9*]*)',
    re.S)


def run(path):
    data = open(path, 'rb').read()
    objs = parse_objs(data)
    cmaps = {}
    for n, (d, raw) in objs.items():
        mm = re.search(rb'/ToUnicode\s+(\d+)\s+0\s+R', d)
        if mm and int(mm.group(1)) in objs and objs[int(mm.group(1))][1]:
            cmaps[n] = parse_cmap(objs[int(mm.group(1))][1])
    roots = [n for n, (d, r) in objs.items()
             if re.search(rb'/Type\s*/Pages\b', d) and b'/Parent' not in d]
    order = []

    def walk(n):
        d = objs[n][0]
        if re.search(rb'/Type\s*/Pages\b', d):
            km = re.search(rb'/Kids\s*\[(.*?)\]', d, re.S)
            for k in re.findall(rb'(\d+)\s+0\s+R', km.group(1)):
                walk(int(k))
        else:
            order.append(n)

    for r in roots:
        walk(r)
    print('##', path.replace('\\', '/').split('/')[-1], 'pages:', len(order),
          'fonts with ToUnicode:', len(cmaps))
    for pno, pn in enumerate(order, 1):
        pd = objs[pn][0]
        res = entry(objs, pd, b'Resources')
        fd = entry(objs, res, b'Font')
        fonts = {nm: cmaps.get(int(fn))
                 for nm, fn in re.findall(rb'/([^\s/<>\[\]()]+)\s+(\d+)\s+0\s+R', fd)}
        cm = re.search(rb'/Contents\s+(\d+)\s+0\s+R', pd)
        if cm:
            refs = [int(cm.group(1))]
        else:
            am = re.search(rb'/Contents\s*\[(.*?)\]', pd, re.S)
            refs = [int(x) for x in re.findall(rb'(\d+)\s+0\s+R', am.group(1))] if am else []
        content = b''
        for r in refs:
            d, raw = objs.get(r, (b'', None))
            if raw is None:
                for x in re.findall(rb'(\d+)\s+0\s+R', d):
                    content += (objs.get(int(x), (b'', b''))[1] or b'') + b'\n'
            else:
                content += raw + b'\n'
        st = {'ctm': [1, 0, 0, 1, 0, 0], 'tm': [1, 0, 0, 1, 0, 0], 'lm': [1, 0, 0, 1, 0, 0],
              'font': None}
        stack = []
        items = []
        ops = []
        arr = None

        def dec(v):
            b = v[1]
            f = fonts.get(st['font'])
            if not f:
                return b.decode('latin-1')
            m, nb = f
            return ''.join(m.get(int.from_bytes(b[i:i + nb], 'big'), '?')
                           for i in range(0, len(b) - nb + 1, nb))

        def show(v):
            if v[0] == 'arr':
                s = ''.join(dec(x) if x[0] in ('hex', 'lit') else (' ' if x[1] < -250 else '')
                            for x in v[1])
            else:
                s = dec(v)
            p = mul(st['tm'], st['ctm'])
            items.append((round(-p[5], 1), p[4], s))

        for m in TOK.finditer(content):
            hx, lit, lb, rbk, name, num, op = m.groups()
            if hx is not None:
                h = re.sub(rb'\s', b'', hx)
                if len(h) % 2:
                    h += b'0'
                val = ('hex', bytes.fromhex(h.decode()))
            elif lit is not None:
                val = ('lit', unescape(lit))
            elif lb:
                arr = []
                continue
            elif rbk:
                ops.append(('arr', arr or []))
                arr = None
                continue
            elif name is not None:
                val = ('name', name)
            elif num is not None:
                val = ('num', float(num))
            else:
                o = op
                try:
                    if o == b'q':
                        stack.append(st['ctm'])
                    elif o == b'Q':
                        st['ctm'] = stack.pop() if stack else [1, 0, 0, 1, 0, 0]
                    elif o == b'cm':
                        st['ctm'] = mul([x[1] for x in ops[-6:]], st['ctm'])
                    elif o == b'BT':
                        st['tm'] = st['lm'] = [1, 0, 0, 1, 0, 0]
                    elif o == b'Tf':
                        st['font'] = ops[-2][1]
                    elif o == b'Tm':
                        st['tm'] = st['lm'] = [x[1] for x in ops[-6:]]
                    elif o in (b'Td', b'TD'):
                        st['lm'] = mul([1, 0, 0, 1, ops[-2][1], ops[-1][1]], st['lm'])
                        st['tm'] = st['lm']
                    elif o == b'T*':
                        st['lm'] = mul([1, 0, 0, 1, 0, -1], st['lm'])
                        st['tm'] = st['lm']
                    elif o in (b'Tj', b'TJ', b"'", b'"'):
                        show(ops[-1])
                except Exception:
                    pass
                ops = []
                continue
            if arr is not None:
                arr.append(val)
            else:
                ops.append(val)
        items.sort()
        lines = []
        for y, x, s in items:
            if lines and abs(lines[-1][0] - y) < 2:
                lines[-1][1].append((x, s))
            else:
                lines.append([y, [(x, s)]])
        print('--- page', pno, '(%d text runs)' % len(items))
        for y, cells in lines:
            cells = sorted(cells)
            gaps = sorted(b[0] - a[0] for a, b in zip(cells, cells[1:]) if b[0] > a[0])
            limit = 2.2 * gaps[len(gaps) // 2] if gaps else 0
            merged = []
            for x, s in cells:
                if merged and x - merged[-1][2] < limit:
                    merged[-1][1] += s
                    merged[-1][2] = x
                else:
                    merged.append([x, s, x])
            print(' | '.join(m[1].strip() for m in merged))


for p in sys.argv[1:]:
    run(p)
