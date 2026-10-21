import csv, os, re, html, unicodedata, subprocess
from html.parser import HTMLParser

SKIP = {'script', 'style', 'noscript', 'svg'}
BLOCK = {'br', 'p', 'div', 'li', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'section', 'ul', 'ol',
         'dt', 'dd', 'button', 'a', 'label', 'option', 'summary', 'details', 'thead', 'tbody'}


NL = {'br', 'p', 'div', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'section', 'ul', 'ol', 'dt', 'dd',
      'summary', 'details', 'thead', 'tbody', 'header', 'footer', 'nav', 'main', 'article', 'aside', 'form',
      'figure', 'figcaption', 'button', 'option'}


class TP(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.skip = 0
        s.parts = []
        s.title = ''
        s.intitle = False

    def handle_starttag(s, t, a):
        if t in SKIP:
            s.skip += 1
        if t == 'title':
            s.intitle = True
        if t in ('td', 'th'):
            s.parts.append(' | ')
        elif t in NL:
            s.parts.append('\n')
        elif t in BLOCK:
            s.parts.append(' ')

    def handle_startendtag(s, t, a):
        if t == 'br':
            s.parts.append('\n')

    def handle_endtag(s, t):
        if t in SKIP and s.skip:
            s.skip -= 1
        if t == 'title':
            s.intitle = False
        if t in NL or t in ('td', 'th'):
            s.parts.append('\n')
        elif t in BLOCK:
            s.parts.append(' ')

    def handle_data(s, d):
        if s.intitle:
            s.title += d
        elif not s.skip:
            s.parts.append(d)


# Cyrillic look-alikes some pages print inside English words (matching only; reported in notes)
CYR = str.maketrans({'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x',
                     'у': 'y', 'М': 'M', 'А': 'A', 'Е': 'E', 'О': 'O', 'Р': 'P',
                     'С': 'C', 'Т': 'T', 'Н': 'H', 'К': 'K', 'В': 'B', 'і': 'i'})
REPL = (('’', "'"), ('‘', "'"), ('“', '"'), ('”', '"'), ('–', '-'), ('—', '-'),
        ('­', ''), ('​', ''), ('′', "'"), ('″', '"'), ('|', ' '))


def keep(s):
    s = unicodedata.normalize('NFKC', s).translate(CYR)
    for a, b in REPL:
        s = s.replace(a, b)
    return re.sub(r'\s+', ' ', s).strip()


def rawtext(raw):
    s = re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1), 16)), raw)
    s = s.replace('\\/', '/').replace('\\"', '"').replace('\\n', ' ').replace('\\t', ' ').replace('\\r', ' ')
    s = html.unescape(html.unescape(s))
    return re.sub(r'<[^>]+>', ' ', s)


def load_rows(p):
    with open(p, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    urls = []
    for r in rows:
        for k in ('url', 'second_url'):
            u = (r.get(k) or '').strip()
            if u and u not in urls:
                urls.append(u)
    return rows, urls


def load_log(p):
    log = {}
    with open(p, encoding='utf-8', newline='') as f:
        for d in csv.DictReader(f):
            if d['file'] or d['url'] not in log:
                log[d['url']] = d
    return log


def pdf_text(fp, TXT, layout=False):
    base = os.path.basename(fp)[:-4]
    out = os.path.join(TXT, base + ('.txt' if layout else '.raw.txt'))
    if not os.path.exists(out):
        cmd = ['pdftotext'] + (['-layout'] if layout else []) + [fp, out]
        subprocess.run(cmd, check=False)
    return open(out, encoding='utf-8', errors='replace').read()


def page(url, log, DL, TXT):
    d = log.get(url)
    if not d or not d['file']:
        return None
    fp = os.path.join(DL, d['file'])
    if fp.endswith('.pdf'):
        t = pdf_text(fp, TXT)
        pdf_text(fp, TXT, layout=True)
        return dict(file=d['file'], code=d['code'], title='(pdf)', vis=t, raw=t, html='')
    h = open(fp, 'rb').read().decode('utf-8', 'replace')
    p = TP()
    p.feed(h)
    return dict(file=d['file'], code=d['code'], title=p.title.strip(), vis=''.join(p.parts), raw=rawtext(h), html=h)
