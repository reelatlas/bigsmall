"""Extract every <table> in a saved HTML file as lists of rows of cell text.
Usage: python -I tables.py <file> [--brief]
Prints: TABLE n (rows x cols) then each row joined by ' | '.
Also importable: tables(path) -> list of (caption_or_prev_heading, rows)
"""
import html, re, sys
from html.parser import HTMLParser


class TP(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []  # (heading, rows)
        self.stack = []
        self.cell = None
        self.row = None
        self.last_heading = ""
        self.hbuf = None
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        if tag == "table":
            self.stack.append([])
        elif tag == "tr" and self.stack:
            self.row = []
        elif tag in ("td", "th") and self.stack:
            self.cell = []
        elif tag in ("h1", "h2", "h3", "h4", "caption"):
            self.hbuf = []
        elif tag == "br" and self.cell is not None:
            self.cell.append(" ")

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.skip:
            self.skip -= 1
        if tag in ("td", "th") and self.cell is not None and self.row is not None:
            self.row.append(re.sub(r"\s+", " ", "".join(self.cell)).strip())
            self.cell = None
        elif tag == "tr" and self.row is not None and self.stack:
            if self.row:
                self.stack[-1].append(self.row)
            self.row = None
        elif tag == "table" and self.stack:
            rows = self.stack.pop()
            self.out.append((self.last_heading, rows))
        elif tag in ("h1", "h2", "h3", "h4", "caption") and self.hbuf is not None:
            self.last_heading = re.sub(r"\s+", " ", "".join(self.hbuf)).strip()
            self.hbuf = None

    def handle_data(self, d):
        if self.skip:
            return
        if self.cell is not None:
            self.cell.append(d)
        if self.hbuf is not None:
            self.hbuf.append(d)


def tables(path):
    p = TP()
    p.feed(open(path, encoding="utf-8", errors="replace").read())
    return p.out


if __name__ == "__main__":
    for i, (h, rows) in enumerate(tables(sys.argv[1])):
        w = max((len(r) for r in rows), default=0)
        print(f"TABLE {i} [{h}] ({len(rows)}x{w})")
        lim = 4 if "--brief" in sys.argv else 999
        for r in rows[:lim]:
            print("  " + " | ".join(r))
