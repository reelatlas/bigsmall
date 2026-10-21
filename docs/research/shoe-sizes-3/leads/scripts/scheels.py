"""Scheels brand size-chart pages: record each brand table into charts.csv and print its notes.
Usage: python -I scheels.py <slug> [<slug> ...]
"""
import os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tables import tables  # noqa: E402
from extract import text_of  # noqa: E402
from rec import add_chart_rows  # noqa: E402

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = {"nike": "Nike", "adidas": "adidas", "new-balance": "New Balance", "puma": "Puma", "asics": "Asics",
         "converse": "Converse", "vans": "Vans", "skechers": "Skechers", "reebok": "Reebok",
         "under-armour": "Under Armour", "clarks": "Clarks", "birkenstock": "Birkenstock",
         "timberland": "Timberland", "ugg": "UGG", "crocs": "Crocs", "on": "On", "brooks": "Brooks",
         "salomon": "Salomon", "hoka": "HOKA", "drmartens": "Dr. Martens"}
for slug in sys.argv[1:]:
    p = os.path.join(BASE, "downloads", f"scheels_{slug}.html")
    raw = open(p, encoding="utf-8", errors="replace").read()
    m = re.search(r"<title[^>]*>(.*?)</title>", raw, re.S)
    title = m.group(1).strip() if m else ""
    url = f"https://www.scheels.com/size-chart/{slug}-adults-footwear-size-chart.html"
    tb = tables(p)
    print(f"##### {slug}: {title} | tables={len(tb)}")
    if title == "Size Chart" or not tb:
        print("   no brand chart on this URL")
        continue
    lines = [l.strip() for l in text_of(raw).split("\n") if l.strip()]
    for l in lines:
        if re.search(r"(half size|whole size|recommend|run|fit|true to size|inches|measure|\*)", l, re.I) and 25 < len(l) < 400:
            print("   >", l)
    for i, (h, rows) in enumerate(tb):
        hdr = rows[0]
        print(f"   TABLE {i} [{h}] {len(rows)}x{len(hdr)}: {hdr} | first: {rows[1] if len(rows) > 1 else ''}")
        out = []
        for k, r in enumerate(rows[1:]):
            for j, (c, v) in enumerate(zip(hdr, r)):
                if j == 0:
                    continue
                out.append((BRAND.get(slug, slug), "Scheels (retailer)", f"{title}: table {i} [{h}]", c,
                            f"{hdr[0]}={r[0]} (row {k + 1})", v, url, "script"))
        print("   cells added:", add_chart_rows(out))
