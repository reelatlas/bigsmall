"""(1) Add the three Zappos review pages read earlier to zappos_fit.csv from their saved data.
(2) Rename chart labels in charts.csv to the section headings printed on the pages."""
import csv, os, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.join(BASE, "downloads")
rows = list(csv.reader(open(os.path.join(BASE, "zappos_fit.csv"), encoding="utf-8")))
have = {r[2] for r in rows[1:]}
with open(os.path.join(BASE, "zappos_fit.csv"), "a", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    for name, pid in [("zappos_arizona_rev", "7209856"), ("zappos_cloudmonster_rev", "9700021"), ("zappos_desert_rev7", "105990")]:
        if pid in have:
            continue
        r = open(os.path.join(DL, name + ".html"), encoding="utf-8", errors="replace").read()
        m = re.search(r'"sizeRatingCounts":\{([^}]*)\}', r)
        d = dict(re.findall(r'"([^"]+)":"(\d+)"', m.group(1))) if m else {}
        pn = re.search(r'"productName":"([^"]+)"', r)
        br = re.findall(r'"brandName":"([^"]+)"', r)
        tot = re.search(r'"totalReviews":"?(\d+)', r)
        url = {"7209856": "https://www.zappos.com/product/review/7209856/page/4",
               "9700021": "https://www.zappos.com/product/review/9700021",
               "105990": "https://www.zappos.com/product/review/105990/page/7"}[pid]
        row = [br[0] if br else "", pn.group(1) if pn else "", pid, url, tot.group(1) if tot else "",
               d.get("Felt true to size", ""), d.get("Felt a half size larger than marked", ""),
               d.get("Felt a full size larger than marked", ""), d.get("Felt a half size smaller than marked", ""),
               d.get("Felt a full size smaller than marked", ""), "2026-10-21", "script"]
        w.writerow(row)
        print(row)

p = os.path.join(BASE, "charts.csv")
data = list(csv.reader(open(p, encoding="utf-8")))
REN = {
    "Converse Adults' Footwear Size Chart: table 0 [Converse Adults' Footwear Size Chart]": "Converse Adults' CHUCK TAYLOR ALL STAR Sizing Guide",
    "Converse Adults' Footwear Size Chart: table 1 [Converse Adults' Footwear Size Chart]": "Converse WOMEN's STANDARD Footwear Sizing Guide",
    "Converse Adults' Footwear Size Chart: table 2 [Converse Adults' Footwear Size Chart]": "Converse MEN'S Standard Footwear Sizing Guide",
    "Vans Adults' Footwear Size Chart: table 0 [Vans Adults' Footwear Size Chart]": "Vans MEN'S Footwear Sizing Information",
    "Vans Adults' Footwear Size Chart: table 1 [Vans Adults' Footwear Size Chart]": "Vans WOMEN'S Footwear Sizing Information",
    "Timberland Adults' Footwear Size Chart: table 0 [Timberland Adults' Footwear Size Chart]": "Timberland MEN'S Footwear Sizing Guide",
    "Timberland Adults' Footwear Size Chart: table 1 [Timberland Adults' Footwear Size Chart]": "Timberland WOMEN'S Footwear Sizing Guide",
    "salomon size guide: table 0 [Salomon]": "Salomon: Men's Footwear",
    "salomon size guide: table 3 [Salomon]": "Salomon: Women's Footwear",
}
n = 0
for r in data[1:]:
    c = r[2].replace("&#x27;", "'")
    if c in REN:
        r[2] = REN[c]
        n += 1
    else:
        r[2] = c
with open(p, "w", newline="", encoding="utf-8") as f:
    csv.writer(f).writerows(data)
print("renamed", n)
