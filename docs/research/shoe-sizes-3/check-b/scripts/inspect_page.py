"""Checker B: show where a saved page carries a phrase, in its visible text and in its raw HTML.

Usage: python -I inspect_page.py <file.html> <regex> [max_hits] [width]
Visible text skips script/style but keeps img alt, figcaption, and title attributes, marked [alt: ...].
"""
import re
import sys
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding="utf-8")

path, pattern = sys.argv[1], sys.argv[2]
max_hits = int(sys.argv[3]) if len(sys.argv) > 3 else 12
width = int(sys.argv[4]) if len(sys.argv) > 4 else 220

raw = open(path, "rb").read().decode("utf-8", errors="replace")


class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript", "template"):
            self.skip += 1
        a = dict(attrs)
        if tag == "img" and a.get("alt"):
            self.parts.append(f" [alt: {a['alt']}] ")
        if tag in ("p", "div", "li", "tr", "br", "h1", "h2", "h3", "h4", "td", "th", "figcaption", "section"):
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "template") and self.skip:
            self.skip -= 1
        if tag in ("td", "th"):
            self.parts.append(" | ")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


t = Text()
t.feed(raw)
text = "".join(t.parts)
text = re.sub(r"[ \t\r\f\v]+", " ", text)
text = re.sub(r"\n\s*\n+", "\n", text)

rx = re.compile(pattern, re.I)
print(f"== {path}")
print(f"raw bytes {len(raw)}; visible text chars {len(text)}")
hits = list(rx.finditer(text))
print(f"-- visible-text hits: {len(hits)}")
for m in hits[:max_hits]:
    s = text[max(0, m.start() - width): m.end() + width].replace("\n", " / ")
    print("  >>", s)
rhits = list(rx.finditer(raw))
print(f"-- raw-HTML hits: {len(rhits)}")
for m in rhits[:max_hits]:
    s = raw[max(0, m.start() - width): m.end() + width]
    s = re.sub(r"\s+", " ", s)
    print("  ##", s)
