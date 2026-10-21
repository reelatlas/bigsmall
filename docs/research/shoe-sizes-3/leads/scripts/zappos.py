"""Zappos customer fit ratings: for each search term, read the search page, take the first
products whose brand matches, read each product's review page, and pull the aggregate
'sizeRatingCounts' (customers' own fit answers) as printed in the page's data.
Writes downloads/zappos_*.html and appends to zappos_fit.csv. Read-only; no login.
Usage: python -I -X utf8 zappos.py
"""
import csv, os, re, sys, time, urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.join(BASE, "downloads")
OUT = os.path.join(BASE, "zappos_fit.csv")
UA = "bigsmall-research-script/1.0 (size-chart reading; read-only)"
TERMS = [("Nike", "nike-sneakers"), ("adidas", "adidas-sneakers"), ("New Balance", "new-balance-sneakers"),
         ("PUMA", "puma-sneakers"), ("ASICS", "asics-running-shoes"), ("Converse", "converse-chuck-taylor"),
         ("Vans", "vans-sneakers"), ("SKECHERS", "skechers-sneakers"), ("Reebok", "reebok-sneakers"),
         ("Under Armour", "under-armour-shoes"), ("Clarks", "clarks-shoes"), ("Birkenstock", "birkenstock-sandals"),
         ("Timberland", "timberland-boots"), ("UGG", "ugg-boots"), ("Crocs", "crocs-clogs"),
         ("Dr. Martens", "dr-martens-boots"), ("Hoka", "hoka-running-shoes"), ("On", "on-running-shoes"),
         ("Brooks", "brooks-running-shoes"), ("Salomon", "salomon-shoes")]
PER = 2


def get(url, name):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            b = r.read()
    except Exception as e:
        print("  ERR", url, e)
        return ""
    open(os.path.join(DL, name), "wb").write(b)
    time.sleep(1.5)
    return b.decode("utf-8", "replace")


new = not os.path.exists(OUT)
f = open(OUT, "a", newline="", encoding="utf-8")
w = csv.writer(f)
if new:
    w.writerow(["brand", "product", "product_id", "review_url", "total_reviews", "true_to_size",
                "half_larger", "full_larger", "half_smaller", "full_smaller", "date_read", "tool"])
for brand, term in TERMS:
    s = get(f"https://www.zappos.com/{term}", f"zappos_search_{term}.html")
    ids = []
    for m in re.finditer(r'"brandName":"([^"]*)"[^{}]{0,400}?"productId":"(\d+)"', s):
        if m.group(1).lower() == brand.lower() and m.group(2) not in ids:
            ids.append(m.group(2))
    if not ids:
        for m in re.finditer(r'"productId":"(\d+)"[^{}]{0,400}?"brandName":"([^"]*)"', s):
            if m.group(2).lower() == brand.lower() and m.group(1) not in ids:
                ids.append(m.group(1))
    print(f"{brand}: {len(ids)} matching products on search page")
    for pid in ids[:PER]:
        url = f"https://www.zappos.com/product/review/{pid}"
        r = get(url, f"zappos_review_{pid}.html")
        m = re.search(r'"sizeRatingCounts":\{([^}]*)\}', r)
        pn = re.search(r'"productName":"([^"]+)"', r)
        tot = re.search(r'"totalReviews":"?(\d+)', r)
        if not m:
            print("   no size ratings", pid)
            continue
        d = dict(re.findall(r'"([^"]+)":"(\d+)"', m.group(1)))
        row = [brand, pn.group(1) if pn else "", pid, url, tot.group(1) if tot else "",
               d.get("Felt true to size", ""), d.get("Felt a half size larger than marked", ""),
               d.get("Felt a full size larger than marked", ""), d.get("Felt a half size smaller than marked", ""),
               d.get("Felt a full size smaller than marked", ""), "2026-10-21", "script"]
        w.writerow(row)
        f.flush()
        print("   ", row[:10])
f.close()
