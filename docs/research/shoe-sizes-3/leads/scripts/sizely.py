"""size.ly brand-to-brand converter pages: record the foot-length tables into charts.csv
(brand = the second brand of each row pair, and the first brand's columns too) and print the claims.
Usage: python -I -X utf8 sizely.py pair [pair...]"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tables import tables  # noqa: E402
from extract import text_of  # noqa: E402
from rec import add_chart_rows  # noqa: E402

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for pair in sys.argv[1:]:
    p = os.path.join(BASE, "downloads", f"sizely_{pair}.html")
    url = f"https://www.size.ly/shoe-size-recommender/{pair}"
    raw = open(p, encoding="utf-8", errors="replace").read()
    print(f"##### {pair}")
    for l in (x.strip() for x in text_of(raw).split("\n")):
        if re.search(r"(is about a|fits about|runs about|tracked|Updated|Matched by)", l) and len(l) < 400:
            print("  >", l)
    for i, (h, rows) in enumerate(tables(p)):
        if "foot length" not in h.lower():
            continue
        hdr = rows[0]
        out = []
        for k, r in enumerate(rows[1:]):
            key = " / ".join(f"{a}={b}" for a, b in zip(hdr, r))
            for c, v in zip(hdr, r):
                brand = c.rsplit(" ", 1)[0] if c.split(" ")[-1] in ("US", "EU", "UK") else "(foot)"
                out.append((brand, "size.ly (sizing-tool company)", h, c, f"row {k + 1}: {key}", v, url, "script"))
        print(f"  TABLE {i} [{h}] hdr={hdr} rows={len(rows) - 1} added={add_chart_rows(out, flag='third-party converter matched by foot length from brands charts')}")
