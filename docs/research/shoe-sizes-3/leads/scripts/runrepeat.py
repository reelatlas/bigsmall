"""RunRepeat size-chart pages: print the sizing narrative, record the cross-brand
'Shoe length (MM)' comparison tables into charts.csv, and print dates.
Usage: python -I runrepeat.py
"""
import glob, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tables import tables  # noqa: E402
from extract import text_of  # noqa: E402
from rec import add_chart_rows  # noqa: E402

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = re.compile(r"(true to size|runs? (small|large|big|long|short)|half[- ]size|size (up|down)|"
                 r"consistent with|differ|smaller|larger|bigger|sizing scheme|same size|"
                 r"women's size is|verdict)", re.I)

for p in sorted(glob.glob(os.path.join(BASE, "downloads", "runrepeat_*.html"))):
    slug = os.path.basename(p)[10:-5]
    if slug == "hub":
        continue
    url = f"https://runrepeat.com/size-charts/{slug}"
    raw = open(p, encoding="utf-8", errors="replace").read()
    dm = re.search(r'"dateModified":"([^"]*)"', raw)
    print(f"##### {slug}  modified={dm.group(1)[:10] if dm else '?'}")
    lines = [l.strip() for l in text_of(raw).split("\n") if l.strip()]
    for i, l in enumerate(lines[20:200]):
        if KEY.search(l) and len(l) > 40:
            print("  >", l[:330])
    rows = []
    for h, tb in tables(p):
        if tb and tb[0] and re.match(r"(shoe length|foot length|mm$)", tb[0][0].strip().lower()):
            hdr = tb[0][0].strip()
            brands = tb[0][1:]
            section = ""
            for r in tb[1:]:
                if len(r) == 1:
                    section = r[0]
                    continue
                for b, v in zip(brands, r[1:]):
                    rows.append((b, "RunRepeat", f"{slug} page: {h}", f"{section} ({b})",
                                 f"{hdr}: {r[0]}", v, url, "script"))
            print("  TABLE:", h, "|", " / ".join(" ".join(r) for r in tb[:9]))
    print("  chart rows added:", add_chart_rows(rows, flag="third-party cross-brand comparison; first column header as printed in row"))
