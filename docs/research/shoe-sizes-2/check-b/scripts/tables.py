import html, re
from html.parser import HTMLParser
class TP(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables = []; self.stack = []; self.heading = ''; self._h = None; self._cell = None; self._row = None
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript'): self.skip += 1; return
        if tag in ('h1','h2','h3','h4','h5','h6','caption'): self._h = []
        if tag == 'table':
            t = {'heading': self.heading, 'rows': []}; self.tables.append(t); self.stack.append(t)
        elif tag == 'tr' and self.stack:
            self._row = []; self.stack[-1]['rows'].append(self._row)
        elif tag in ('td','th') and self._row is not None:
            self._cell = []; a = dict(attrs); self._span = (a.get('colspan') or '1', a.get('rowspan') or '1')
        elif tag == 'br' and self._cell is not None:
            self._cell.append(' ')
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript'): self.skip = max(0, self.skip-1); return
        if tag in ('h1','h2','h3','h4','h5','h6','caption') and self._h is not None:
            txt = ' '.join(''.join(self._h).split())
            if txt:
                self.heading = txt
                if tag == 'caption' and self.stack: self.stack[-1]['caption'] = txt
            self._h = None
        if tag in ('td','th') and self._cell is not None and self._row is not None:
            txt = ' '.join(''.join(self._cell).split())
            if self._span != ('1', '1'): txt += '{cs=%s,rs=%s}' % self._span
            self._row.append(txt); self._cell = None
        elif tag == 'tr': self._row = None
        elif tag == 'table' and self.stack: self.stack.pop()
    def handle_data(self, d):
        if self.skip: return
        if self._h is not None: self._h.append(d)
        if self._cell is not None: self._cell.append(d)
def tables(text):
    p = TP(); p.feed(text); return p.tables
def visible_text(text):
    t = re.sub(r'(?is)<(script|style|noscript)\b.*?</\1>', ' ', text)
    t = re.sub(r'(?s)<[^>]+>', ' ', t)
    return ' '.join(html.unescape(t).split())
