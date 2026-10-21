"""Checker B: find each claim's and method statement's words on the page itself.

For each row: the recorded words split at the worker's separators (ellipsis, dash, bullet, arrow, pipe);
each segment looked for in the page's visible text (normalized: case, quotes, dashes, spaces), then in the raw HTML;
where a segment is missing, the page's own text around its best 4-word window is printed for a reading.
Also writes every sentence on the given pages that speaks of how internal length is measured.

Usage: python -I check_claims.py <rows.csv> <downloads_dir> <out_claims.csv> <out_method.txt>
"""
import csv
import html
import os
import re
import sys
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding="utf-8")
rows_csv, down_dir, out_csv, out_method = sys.argv[1:5]


def fname(url):
    path = re.sub(r"^https?://(www\.)?runrepeat\.com/?", "", url).strip("/")
    path = path.replace("/", "__") or "home"
    path = re.sub(r"[^A-Za-z0-9_.-]", "_", path)
    return path + ".html"


class Visible(HTMLParser):
    BLOCK = {"p", "div", "li", "tr", "br", "h1", "h2", "h3", "h4", "h5", "td", "th", "figcaption", "section", "table", "ul", "ol", "span"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript", "template"):
            self.skip += 1
        a = dict(attrs)
        if tag == "img" and a.get("alt") and not self.skip:
            self.parts.append(f"\n[alt: {a['alt']}]\n")
        if tag in self.BLOCK and tag != "span":
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "template") and self.skip:
            self.skip -= 1
        if tag in self.BLOCK and tag != "span":
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)

    def text(self):
        t = "".join(self.parts)
        t = re.sub(r"[ \t\r\f\v ]+", " ", t)
        t = re.sub(r"\n\s*\n*", "\n", t)
        return t


def norm(s):
    s = html.unescape(s)
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    s = re.sub(r"[‐-―−]", "-", s)
    s = s.replace(" ", " ")
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


SEP = re.compile(r"\s*(?:…|\.\.\.|—|–|•|·|→|\|)\s*")

with open(rows_csv, newline="", encoding="utf-8-sig") as f:
    rows = [r for r in csv.DictReader(f) if r["kind"] != "measurement"]

pages = {}


def page(url):
    if url not in pages:
        p = os.path.join(down_dir, fname(url))
        if not os.path.exists(p):
            pages[url] = None
        else:
            raw = open(p, "rb").read().decode("utf-8", errors="replace")
            v = Visible()
            v.feed(raw)
            vt = v.text()
            pages[url] = (raw, vt, norm(vt), norm(re.sub(r"<[^>]+>", " ", raw)))
    return pages[url]


out = open(out_csv, "w", newline="", encoding="utf-8")
w = csv.writer(out)
w.writerow(["id", "url", "file", "segments_found", "segments_missing", "where", "page_lines", "exact_char_match", "n_segments"])
for r in rows:
    pg = page(r["url"])
    print("=" * 100)
    print(r["id"], r["kind"], "|", r["url"])
    print("RECORDED:", r["exact_words"])
    if pg is None:
        print("  page not saved")
        w.writerow([r["id"], r["url"], fname(r["url"]), "", "", "not saved", ""])
        continue
    raw, vt, nvt, nraw = pg
    segs = [s for s in SEP.split(r["exact_words"]) if s.strip()]
    found, missing, where, lines = [], [], [], []
    vlines = vt.split("\n")
    for s in segs:
        ns = norm(s)
        if ns in nvt:
            found.append(s)
            where.append("visible")
            for ln in vlines:
                if ns in norm(ln) or (len(ns) > 60 and ns[:60] in norm(ln)):
                    lines.append(ln.strip())
                    break
            else:
                # spans lines: show the joined context
                i = nvt.find(ns)
                lines.append("[across blocks] " + nvt[max(0, i - 80): i + len(ns) + 80])
        elif ns in nraw:
            found.append(s)
            where.append("raw HTML only")
            i = nraw.find(ns)
            lines.append("[raw] " + nraw[max(0, i - 200): i + len(ns) + 200])
        else:
            missing.append(s)
            where.append("missing")
            words = ns.split()
            best = None
            for k in range(len(words) - 3):
                win = " ".join(words[k:k + 4])
                if win in nvt:
                    best = win
                    break
            if best:
                i = nvt.find(best)
                lines.append("[near, visible] " + nvt[max(0, i - 250): i + 400])
            else:
                for k in range(len(words) - 3):
                    win = " ".join(words[k:k + 4])
                    if win in nraw:
                        i = nraw.find(win)
                        lines.append("[near, raw] " + nraw[max(0, i - 250): i + 400])
                        break
                else:
                    lines.append("[no 4-word window of this segment on the page]")
    for s, wh, ln in zip(segs, where, lines):
        print(f"  SEG [{wh}]: {s}")
        print(f"     PAGE: {ln[:900]}")
    # character-for-character test: only runs of spaces collapsed, no case/quote/dash folding
    flat_vt = re.sub(r"\s+", " ", vt)
    exact = ["yes" if re.sub(r"\s+", " ", s.strip()) in flat_vt else "no" for s in segs]
    print("  EXACT (spaces collapsed only):", exact, "| segments:", len(segs))
    w.writerow([r["id"], r["url"], fname(r["url"]), " || ".join(found), " || ".join(missing), " ; ".join(where), " || ".join(lines), " ; ".join(exact), len(segs)])
out.close()

# every sentence on these pages about how internal length is measured
MRX = re.compile(r"internal length|insole length|caliper|gel mold|gel mould|cut (?:it|them|the shoe)s? (?:open|in half)|in half|measure", re.I)
with open(out_method, "w", encoding="utf-8") as mf:
    for url in sorted({r["url"] for r in rows}):
        pg = page(url)
        if pg is None:
            continue
        vt = pg[1]
        mf.write("#" * 80 + "\n" + url + "\n")
        for ln in vt.split("\n"):
            if MRX.search(ln) and len(ln.strip()) > 25:
                mf.write("  - " + ln.strip() + "\n")
print("done")
