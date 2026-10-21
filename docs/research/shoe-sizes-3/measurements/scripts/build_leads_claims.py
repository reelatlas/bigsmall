"""From the saved RunRepeat pages: (1) leads.csv rows for each model's 'Size' verdict
(a wear-test judgment, not a measurement); (2) a check of each recorded page for any
statement of a tested size other than men's US 9 (written to scripts_out/size_flags.csv);
(3) claims.csv from sentences read on RunRepeat's own pages (exact words).
"""
import csv, html, os, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.join(BASE, "downloads", "rr")
OUT = os.path.join(BASE, "scripts_out")
rows = list(csv.DictReader(open(os.path.join(BASE, "measurements.csv"), encoding="utf-8")))


def text(p):
    t = open(p, encoding="utf-8", errors="replace").read()
    t = re.sub(r"<script.*?</script>", " ", t, flags=re.S)
    t = re.sub(r"<style.*?</style>", " ", t, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    return html.unescape(re.sub(r"\s+", " ", t))


leads, flags = [], []
SIZE_PAT = re.compile(r"(?i)(women'?s (US )?(size )?\d+(\.5)?|men'?s (US )?(size )?(?!9\b)\d+(\.5)?\b|US (M )?(?!9\b)\d+(\.5)? (men|instead)|we (bought|tested|got)[^.]{0,60}size)")
for r in rows:
    if r["source"] != "RunRepeat lab":
        continue
    slug = r["url"].rsplit("/", 1)[-1]
    tx = text(os.path.join(DL, slug + ".html"))
    m = re.search(r"Size and fit Size (.+?) Internal length", tx)
    if m:
        v = m.group(1)
        # the table gives the shoe's verdict then the average's; split on the repeated phrase set
        opts = ["True to size", "Half a size large", "Half a size small", "Half size large", "Half size small", "Slightly large",
                "Slightly small", "A full size large", "A full size small", "Runs large", "Runs small"]
        first = next((o for o in opts if v.startswith(o)), v)
        leads.append([r["brand"], "RunRepeat lab", f"{r['model']}: Size verdict '{first}' (wear-test judgment beside the internal length)", r["url"], "2026-10-21"])
    for fm in SIZE_PAT.finditer(tx):
        ctx = tx[max(0, fm.start() - 150): fm.end() + 150]
        flags.append([r["id"], r["brand"], r["model"], r["url"], fm.group(0), ctx])

leads += [
    ["(all)", "RTINGS", "RTINGS measures 'Internal Length' from a 3D scan of each shoe's interior (Internal Shape group) and states the tested size on each review (men's US 9 on the pages read); the figure is insider-only, marked isAccessibleForFree False / ld-paywall: not recorded, a lead for a licensed or member read", "https://www.rtings.com/running-shoes/learn/how-we-test", "2026-10-21"],
    ["Converse", "Sportano", "Converse insole-length table by EU size on product pages (a brand-level chart, no measurement statement: a copy, cells not recorded)", "https://sportano.com/p/327631/converse-chuck-taylor-all-star-ox-light-twine-white-black-trainers", "2026-10-21"],
    ["Dr. Martens", "Scheels", "Dr. Martens chart with an inch column said to be insole length ('Inch measurements are of the length of the shoe insole, NOT the length of the foot'): a retailer's chart, no measurement method; a lead", "https://www.scheels.com/size-chart/dr-martens-adults-footwear-size-chart.html", "2026-10-21"],
    ["Dr. Martens", "Footshop", "Dr. Martens chart with a CM column (seen in a search summary only, page not opened): a chart, a lead", "https://www.footshop.cz/en/size-charts/dr-martens", "2026-10-21"],
    ["(all)", "3DBODY.TECH 2021 (Jurca et al., abstract 21.51)", "Abstract (search summary, not opened): from foot scans of over 90,000 shoppers, only 60% of models fitted as a true US 9 medium; derived from purchase data, not interior measurement", "https://proc.3dbody.tech/abstracts/2021/2151jurca.html", "2026-10-21"],
    ["(all)", "3DBODY.TECH 2011 (shoe inner dimension paper)", "Paper on measuring shoe interiors by contrast-filled x-ray; method source, no per-model figures seen", "https://proc.3dbody.tech/papers/2011/11158_12omrcen.pdf", "2026-10-21"],
]
with open(os.path.join(BASE, "leads.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["brand", "publisher", "claim", "url", "date_read"])
    w.writerows(leads)
with open(os.path.join(OUT, "size_flags.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["id", "brand", "model", "url", "match", "context"])
    w.writerows(flags)

# claims: exact sentences read on RunRepeat pages (verified present in the saved copies)
C = [
    ("(all)", "Internal length in the same US men's size 9 ranges from 255 to 281 mm across over 1000 lab-measured shoes",
     "Having measured the internal length of over 1000 shoes in our lab, we discovered that it can range from 255 to 281 mm in the same US size 9!",
     "https://runrepeat.com/guides/how-to-measure-shoe-size", "guide_measure_size.html"),
    ("Asics", "Three ASICS shoes of the same size differ in internal length",
     "Different internal shoe length in three ASICS shoes of the same size (men's US 9)",
     "https://runrepeat.com/guides/how-to-measure-shoe-size", "guide_measure_size.html"),
    ("(all)", "Mondopoint/CM sizes refer to insole length, at least 5 mm over the foot (RunRepeat's statement, not a measurement)",
     "They refer to the shoe's insole length (or internal length), which should be at least 5 mm larger than your actual foot length.",
     "https://runrepeat.com/guides/how-to-measure-shoe-size", "guide_measure_size.html"),
    ("adidas", "adidas internal length at men's US 9 ranges 260.1 to 280.4 mm in RunRepeat's lab",
     "Even though we always measured the internal length of adidas shoes in the same men's US size 9, we've gotten a wild range of numbers, from 260.1 mm to 280.4 mm!",
     "https://runrepeat.com/size-charts/adidas", "../rr_sizecharts/adidas.html"),
    ("Converse", "Chuck 70 toebox narrower than the average sneaker (width, not length)",
     "Please note that the Chuck 70 silhouette has an extremely tapered toebox which is 8-10 mm narrower in the big toe area than the average sneaker!",
     "https://runrepeat.com/size-charts/converse", "../rr_sizecharts/converse.html"),
    ("Timberland", "Some Timberland models run shorter or longer than the expected internal length",
     "Some models can run shorter or longer than the expected internal length, others can have more tapered toebox shapes.",
     "https://runrepeat.com/size-charts/timberland", "../rr_sizecharts/timberland.html"),
    ("(all)", "RunRepeat's note that internal length is not a great measure of fit",
     "Our testing shows that internal length is not a great measure of fit.",
     "https://runrepeat.com/brooks-ghost-16", "rr_ghost16.html"),
]
out = []
for i, (b, c, words, url, fn) in enumerate(C, 1):
    p = os.path.normpath(os.path.join(DL, fn))
    ok = words.replace("'", "") in text(p).replace("’", "").replace("'", "")
    out.append([i, "RunRepeat", b, c, words, url, "2026-10-21" + ("" if ok else " (NOT FOUND in saved copy)")])
with open(os.path.join(BASE, "claims.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["id", "source", "brand", "claim", "exact_words", "url", "date_read"])
    w.writerows(out)
print("leads", len(leads), "flags", len(flags), "claims", [o[-1] for o in out])
