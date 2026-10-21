"""SportsShoes.com brand size guides: record footwear tables (those under a 'Footwear' heading)
into charts.csv, cells exactly as printed. Usage: python -I sportsshoes.py slug [slug...]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tables import tables  # noqa: E402
from rec import add_chart_rows  # noqa: E402

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAMES = {"nike": "Nike", "adidas": "adidas", "new-balance": "New Balance", "asics": "Asics", "brooks": "Brooks",
         "salomon": "Salomon", "under-armour": "Under Armour", "skechers": "Skechers"}
for slug in sys.argv[1:]:
    p = os.path.join(BASE, "downloads", f"sportsshoes_{slug}.html")
    url = f"https://www.sportsshoes.com/size-guides/{slug}"
    for i, (h, rows) in enumerate(tables(p)):
        if "footwear" not in h.lower() or "width" in h.lower():
            continue
        r0 = rows[0]
        if len([c for c in r0 if c]) <= 1 and len(rows) > 1:  # a title row above the header
            rows = rows[1:]
        hdr = rows[0]
        out = []
        for k, r in enumerate(rows[1:]):
            for j, (c, v) in enumerate(zip(hdr, r)):
                out.append((NAMES[slug], "SportsShoes.com (retailer)", f"{slug} size guide: table {i} [{h}]",
                            c, f"row {k + 1}: " + " / ".join(f"{a}={b}" for a, b in zip(hdr, r) if a != c)[:120],
                            v, url, "script"))
        print(f"{slug} t{i} [{h}] hdr={hdr} rows={len(rows) - 1} added={add_chart_rows(out)}")
