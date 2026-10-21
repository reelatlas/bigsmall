"""RunRepeat brand size-chart pages: the chart cells are a copy of the brand's chart and are
NOT recorded. Only sentences that speak of the lab's own measurements (internal length,
'our lab', 'we measured', 'tested') are extracted for review as candidate claims.
Writes ../scripts_out/sizechart_sentences.csv.
"""
import csv, html, os, re, time, urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.join(BASE, "downloads", "rr_sizecharts")
OUT = os.path.join(BASE, "scripts_out")
os.makedirs(DL, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
UA = "bigsmall-research-script/1.0 (shoe internal length study)"
SLUGS = {"Nike": "nike", "adidas": "adidas", "New Balance": "new-balance", "Puma": "puma",
         "Asics": "asics", "Converse": "converse", "Vans": "vans", "Skechers": "skechers",
         "Reebok": "reebok", "Under Armour": "under-armour", "Clarks": "clarks",
         "Dr. Martens": "dr-martens", "Birkenstock": "birkenstock", "Timberland": "timberland",
         "UGG": "ugg", "Crocs": "crocs", "HOKA": "hoka", "On": "on", "Brooks": "brooks",
         "Salomon": "salomon"}
KEY = re.compile(r"(?i)(our lab|we measured|we('ve| have) measured|internal length|in the lab|lab[- ]tested|lab data|we tested|measured in|mm (longer|shorter|wider|narrower))")
rows = []
log = []
for brand, slug in SLUGS.items():
    url = f"https://runrepeat.com/size-charts/{slug}"
    p = os.path.join(DL, slug + ".html")
    status = "cached"
    if not os.path.exists(p):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                open(p, "w", encoding="utf-8").write(r.read().decode("utf-8", errors="replace"))
                status = str(r.status)
        except Exception as e:  # noqa
            log.append([url, f"error {e}"])
            continue
        time.sleep(1.5)
    t = open(p, encoding="utf-8", errors="replace").read()
    t = re.sub(r"<script.*?</script>", " ", t, flags=re.S)
    t = re.sub(r"<style.*?</style>", " ", t, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    t = html.unescape(re.sub(r"\s+", " ", t))
    n = 0
    for s in re.split(r"(?<=[.!?])\s+", t):
        if 25 < len(s) < 600 and KEY.search(s):
            rows.append([brand, url, s.strip()])
            n += 1
    log.append([url, status + f", {n} candidate sentences"])
with open(os.path.join(OUT, "sizechart_sentences.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["brand", "url", "sentence"])
    w.writerows(rows)
with open(os.path.join(BASE, "pages_log.csv"), "a", newline="", encoding="utf-8") as f:
    csv.writer(f).writerows([[u, s, "size-chart page (chart is a copy, cells not recorded)"] for u, s in log])
for l in log:
    print(l)
