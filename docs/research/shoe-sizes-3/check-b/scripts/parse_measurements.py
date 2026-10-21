"""Checker B: read each saved review page and pull out the internal length RunRepeat prints for the model.

Two places on every review page:
  (1) the lab section <section id="internal-length">: "Test results" rows (model | value mm, Average | value mm);
  (2) the comparison table: the <tr> whose <th> is "Internal length" (its <td>s, read against the table's header row).
Also: every size mention in the page's visible text (for the note), and any members-only wording.

Usage: python -I parse_measurements.py <rows.csv> <downloads_dir> <fetch_log.csv> <out_parsed.csv> <out_sizes.txt>
"""
import csv
import os
import re
import sys
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding="utf-8")
rows_csv, down_dir, log_csv, out_parsed, out_sizes = sys.argv[1:6]


def fname(url):
    path = re.sub(r"^https?://(www\.)?runrepeat\.com/?", "", url).strip("/")
    path = path.replace("/", "__") or "home"
    path = re.sub(r"[^A-Za-z0-9_.-]", "_", path)
    return path + ".html"


class Visible(HTMLParser):
    """Visible text, script/style skipped, img alt kept as [alt: ...]."""

    BLOCK = {"p", "div", "li", "tr", "br", "h1", "h2", "h3", "h4", "h5", "td", "th", "figcaption", "section", "table", "ul", "ol"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript", "template"):
            self.skip += 1
        a = dict(attrs)
        if tag == "img" and a.get("alt") and not self.skip:
            self.parts.append(f" [alt: {a['alt']}] ")
        if tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "template") and self.skip:
            self.skip -= 1
        if tag in ("td", "th"):
            self.parts.append(" | ")
        if tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)

    def text(self):
        t = "".join(self.parts)
        t = re.sub(r"[ \t\r\f\v ]+", " ", t)
        t = re.sub(r"\n\s*\n*", "\n", t)
        return t


class Tables(HTMLParser):
    """Every table as a list of rows; each row a list of (tag, text)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables, self.stack, self.row, self.cell, self.skip = [], [], None, None, 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        if tag == "table":
            self.stack.append([])
        elif tag == "tr" and self.stack:
            self.row = []
        elif tag in ("td", "th") and self.row is not None:
            self.cell = [tag, ""]

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.skip:
            self.skip -= 1
        if tag in ("td", "th") and self.cell is not None and self.row is not None:
            self.row.append((self.cell[0], re.sub(r"\s+", " ", self.cell[1]).strip()))
            self.cell = None
        elif tag == "tr" and self.row is not None and self.stack:
            self.stack[-1].append(self.row)
            self.row = None
        elif tag == "table" and self.stack:
            self.tables.append(self.stack.pop())

    def handle_data(self, data):
        if self.cell is not None and not self.skip:
            self.cell[1] += data


def section_rows(raw):
    """The 'Test results' rows of the internal-length lab section, as (label, value) pairs."""
    m = re.search(r'<section id="internal-length"[^>]*>(.*?)</section>', raw, re.S)
    if not m:
        return None, ""
    v = Visible()
    v.feed(m.group(1))
    txt = v.text()
    flat = re.sub(r"\s*\n\s*", " / ", txt).strip()
    after = txt.split("Test results", 1)
    pairs = []
    if len(after) == 2:
        body = after[1].split("Compared to", 1)[0]
        cells = [c.strip() for c in re.split(r"[|\n]", body) if c.strip()]
        i = 0
        while i < len(cells) - 1:
            if re.fullmatch(r"\d+(?:\.\d+)?\s*mm", cells[i + 1]):
                pairs.append((cells[i], cells[i + 1]))
                i += 2
            else:
                i += 1
    return pairs, flat


SIZE_RX = re.compile(
    r"(?:\b(?:men'?s|women'?s|mens|womens)\s+(?:US\s*|UK\s*|EU\s*)?(?:size\s*)?\d{1,2}(?:\.5|½)?\b)"
    r"|(?:\b(?:US|UK|EU)\s*(?:men'?s\s*|women'?s\s*|M\s*|W\s*)?(?:size\s*)?\d{1,2}(?:\.5|½)?\b)"
    r"|(?:\bsize\s+(?:US\s*)?\d{1,2}(?:\.5|½)?\b)"
    r"|(?:\b\d{1,2}(?:\.5)?\s*(?:US|UK)\b)",
    re.I,
)
MEMBER_RX = re.compile(
    r"members?[- ]only|for (?:our )?members|premium members?|become a member|join (?:runrepeat )?(?:premium|pro|membership)"
    r"|unlock (?:this|the|all|our|full|lab)|log ?in to (?:see|view|unlock)|sign ?in to (?:see|view|unlock)|paywall"
    r"|exclusive (?:to|for) (?:members|subscribers)|subscribers only|members get",
    re.I,
)
SECTION_LOCK_RX = re.compile(r"lock|blur|member|premium|paywall|restricted", re.I)
PROSE_RX = re.compile(r"[^.!?\n]*internal length[^.!?\n]*?\d{3}(?:\.\d)?\s?mm[^.!?\n]*[.!?]?", re.I)

status = {}
with open(log_csv, newline="", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        status[r["url"]] = r

with open(rows_csv, newline="", encoding="utf-8-sig") as f:
    rows = [r for r in csv.DictReader(f) if r["kind"] == "measurement"]

out = open(out_parsed, "w", newline="", encoding="utf-8")
w = csv.writer(out)
w.writerow(["id", "brand", "model", "recorded", "file", "http", "section_pairs", "section_value", "section_avg", "table_header", "table_row", "table_value", "n_internal_rows", "size_matches", "member_hits", "section_text", "prose_sentences", "prose_values", "section_lock_words", "section_tag"])
sz = open(out_sizes, "w", encoding="utf-8")
headers_seen = {}
for r in rows:
    fn = fname(r["url"])
    path = os.path.join(down_dir, fn)
    st = status.get(r["url"], {}).get("status", "not fetched")
    if not os.path.exists(path):
        w.writerow([r["id"], r["brand"], r["model"], r["value"], fn, st] + [""] * 10)
        continue
    raw = open(path, "rb").read().decode("utf-8", errors="replace")
    pairs, flat = section_rows(raw)
    sec_val = sec_avg = ""
    if pairs:
        non_avg = [p for p in pairs if p[0].strip().lower() != "average"]
        avg = [p for p in pairs if p[0].strip().lower() == "average"]
        sec_val = non_avg[0][1] if non_avg else ""
        sec_avg = avg[0][1] if avg else ""
    tp = Tables()
    tp.feed(raw)
    trow, theader, n_rows = "", "", 0
    for t in tp.tables:
        for row in t:
            if row and row[0][0] == "th" and row[0][1] == "Internal length":
                n_rows += 1
                if not trow:
                    trow = " | ".join(c[1] for c in row)
                    # header: the first row of the table with more than one cell
                    for hr in t:
                        if len(hr) > 1:
                            theader = " | ".join(c[1] for c in hr)
                            break
    tval = ""
    m = re.match(r"Internal length \| ([\d.]+ mm)", trow)
    if m:
        tval = m.group(1)
    v = Visible()
    v.feed(raw)
    text = v.text()
    sm = []
    for m in SIZE_RX.finditer(text):
        ctx = text[max(0, m.start() - 160): m.end() + 120].replace("\n", " / ")
        sm.append(m.group(0))
        sz.write(f"{r['id']}\t{r['model']}\t{m.group(0)}\t{ctx}\n")
    mh = [m.group(0) for m in MEMBER_RX.finditer(text)]
    sm_html = re.search(r'<section id="internal-length"[^>]*>(.*?)</section>', raw, re.S)
    sec_lock = sorted({x.lower() for x in SECTION_LOCK_RX.findall(sm_html.group(0))}) if sm_html else []
    sec_open = re.search(r'<section id="internal-length"[^>]*>', raw)
    # sentences outside the lab section and the table that give an internal length in mm
    # (split only at . ! ? followed by space and a capital, so "7.5," stays inside its sentence)
    sents = []
    for block in text.split("\n"):
        sents.extend(re.split(r"(?<=[.!?])\s+(?=[A-Z\[])", block))
    prose = [s.strip() for s in sents if re.search(r"internal length", s, re.I) and re.search(r"\d{3}(?:\.\d)?\s?mm", s) and "|" not in s]
    prose_vals = [re.search(r"(\d{3}(?:\.\d)?)\s?mm", s).group(1) for s in prose]
    w.writerow([
        r["id"], r["brand"], r["model"], r["value"], fn, st,
        " ; ".join(f"{a}={b}" for a, b in (pairs or [])), sec_val, sec_avg, theader, trow, tval, n_rows,
        " ; ".join(sm), " ; ".join(mh), flat[:600],
        " || ".join(prose), " ; ".join(prose_vals), " ; ".join(sec_lock), sec_open.group(0) if sec_open else "",
    ])
out.close()
sz.close()
print("parsed", len(rows))
