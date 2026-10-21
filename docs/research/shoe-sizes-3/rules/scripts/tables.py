"""List the HTML tables of a saved page, or write one to charts.csv.

usage: python -I tables.py FILE list [HEADER_REGEX]
       python -I tables.py FILE write INDEX BRAND SITE CHART URL [TOOL] [NOTES]
Each table is read cell by cell from its <tr>; the first row is the header. The chart
title (nearest preceding heading text) is printed to help name it.
"""
import csv
import html
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).resolve().parent.parent


def clean(s):
    s = re.sub(r"(?s)<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


raw = (ROOT / "downloads" / sys.argv[1]).read_text("utf-8", "replace")
tables = []
for m in re.finditer(r"(?is)<table.*?</table>", raw):
    rows = []
    for tr in re.findall(r"(?is)<tr.*?</tr>", m.group(0)):
        cells = [clean(c) for c in re.findall(r"(?is)<t[hd][^>]*>(.*?)</t[hd]>", tr)]
        if cells:
            rows.append(cells)
    heads = re.findall(r"(?is)<(?:h\d|div class=\"[^\"]*title[^\"]*\")[^>]*>(.*?)</", raw[max(0, m.start() - 4000):m.start()])
    sect = re.findall(r'id="section-([^"]+)"', raw[max(0, m.start() - 6000):m.start()])
    tables.append((rows, clean(heads[-1]) if heads else "", sect[-1] if sect else ""))

if sys.argv[2] == "list":
    filt = re.compile(sys.argv[3], re.I) if len(sys.argv) > 3 else None
    for i, (rows, title, sect) in enumerate(tables):
        if not rows or (filt and not filt.search(" ".join(rows[0]))):
            continue
        print(f"[{i}] {sect} | {title} | {len(rows) - 1} rows | header {rows[0]} | first {rows[1] if len(rows) > 1 else ''} | last {rows[-1]}")
else:
    idx = int(sys.argv[3])
    brand, site, chart, url = sys.argv[4:8]
    tool = sys.argv[8] if len(sys.argv) > 8 else "script"
    notes = sys.argv[9] if len(sys.argv) > 9 else ""
    rows = tables[idx][0]
    head = rows[0]
    path = ROOT / "charts.csv"
    new = not path.exists()
    cols = ["brand", "site", "chart", "column", "row", "value", "url", "date_read", "tool", "notes"]
    n = 0
    with path.open("a", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        if new:
            w.writeheader()
        for r, cells in enumerate(rows[1:], start=1):
            for c, v in zip(head, cells):
                w.writerow(dict(brand=brand, site=site, chart=chart, column=c, row=r, value=v, url=url,
                                date_read="2026-10-21", tool=tool, notes=notes))
                n += 1
    print(f"wrote {n} cells from table {idx} ({len(rows) - 1} rows)")
