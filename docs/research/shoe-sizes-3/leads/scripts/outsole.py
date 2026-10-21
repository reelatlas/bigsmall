"""Outsole.nl brand size charts: record '<Brand> shoes -> Men/Women' tables into charts.csv
and print the fit sentences and dates. Usage: python -I -X utf8 outsole.py slug [slug...]"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tables import tables  # noqa: E402
from extract import text_of  # noqa: E402
from rec import add_chart_rows  # noqa: E402

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
N = {"nb": "New Balance", "adidas": "adidas", "asics": "Asics", "converse": "Converse", "hoka": "HOKA",
     "nike": "Nike", "on-running": "On", "puma": "Puma", "reebok": "Reebok", "salomon": "Salomon",
     "skechers": "Skechers", "under-armour": "Under Armour", "vans": "Vans"}
FIT = re.compile(r"(true to (size|length)|runs? (small|large|big|long|short|narrow|wide)|fits? (small|large|big|"
                 r"true|narrow|roomy|slightly)|half (a )?size|size (up|down)|our advice|compare|stick with)", re.I)
for slug in sys.argv[1:]:
    p = os.path.join(BASE, "downloads", f"outsole_{slug}.html")
    full = "new-balance" if slug == "nb" else slug
    url = f"https://www.outsole.nl/en/shoe-size-charts/{full}-shoes-size-chart-women-men/"
    raw = open(p, encoding="utf-8", errors="replace").read()
    dm = re.findall(r'"date(?:Modified|Published)":"([^"]{10})', raw)
    print(f"##### {slug} dates={sorted(set(dm))}")
    seen = set()
    for l in (x.strip() for x in text_of(raw).split("\n")):
        if FIT.search(l) and 40 < len(l) < 600 and l not in seen and "Snelle" not in l:
            seen.add(l)
            print("  >", l)
    for i, (h, rows) in enumerate(tables(p)):
        if "➡" not in h:
            continue
        hdr = rows[0]
        out = []
        for k, r in enumerate(rows[1:]):
            for j, (c, v) in enumerate(zip(hdr, r)):
                if j == 0:
                    continue
                out.append((N[slug], "Outsole.nl (retailer)", h, c, f"{hdr[0]}={r[0]} (row {k + 1})", v, url, "script"))
        print(f"  TABLE {i} [{h}] hdr={hdr} rows={len(rows) - 1} added={add_chart_rows(out)}")
