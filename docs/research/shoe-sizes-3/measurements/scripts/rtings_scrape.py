"""RTINGS running-shoe reviews: read 'Internal Length' (Internal Shape group) and the
size sentence ("We bought and tested ... in men's US size 9, as noted on the label").

Usage: python -I rtings_scrape.py <brands comma list> <limit per brand> <url-list-file>
Only results served with "unblurred":true and a rendered value are recorded.
"""
import csv, html, os, re, sys, time, urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.join(BASE, "downloads", "rtings")
os.makedirs(DL, exist_ok=True)
UA = "bigsmall-research-script/1.0 (shoe internal length study)"
MCSV = os.path.join(BASE, "measurements.csv")
LOG = os.path.join(BASE, "pages_log.csv")

BRANDS = {"nike": "Nike", "adidas": "adidas", "new-balance": "New Balance", "puma": "Puma",
          "asics": "Asics", "converse": "Converse", "vans": "Vans", "skechers": "Skechers",
          "reebok": "Reebok", "under-armour": "Under Armour", "clarks": "Clarks",
          "dr-martens": "Dr. Martens", "birkenstock": "Birkenstock", "timberland": "Timberland",
          "ugg": "UGG", "crocs": "Crocs", "hoka": "HOKA", "on": "On", "brooks": "Brooks",
          "salomon": "Salomon"}


def get(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 10000:
        return open(path, encoding="utf-8", errors="replace").read(), "cached"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            data = r.read().decode("utf-8", errors="replace")
            code = r.status
    except Exception as e:  # noqa
        return None, f"error {e}"
    open(path, "w", encoding="utf-8").write(data)
    time.sleep(1.5)
    return data, str(code)


def log(url, status, gave):
    with open(LOG, "a", newline="", encoding="utf-8") as f:
        csv.writer(f).writerow([url, status, gave])


def main():
    want = sys.argv[1].split(",")
    limit = int(sys.argv[2])
    urls = [u.strip() for u in open(sys.argv[3], encoding="utf-8") if u.strip()]
    rows = list(csv.DictReader(open(MCSV, encoding="utf-8")))
    have = {r["url"] for r in rows}
    nid = len(rows) + 1
    counts = {}
    with open(MCSV, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        for url in urls:
            m = re.search(r"/running-shoes/reviews/([a-z0-9-]+)/([a-z0-9-]+)", url)
            if not m or m.group(1) not in BRANDS or m.group(1) not in want:
                continue
            bslug = m.group(1)
            if counts.get(bslug, 0) >= limit or url in have:
                continue
            t, st = get(url, os.path.join(DL, bslug + "_" + m.group(2) + ".html"))
            if not t:
                log(url, st, "not read")
                continue
            u = html.unescape(t)
            i = u.find('"name":"Internal Length"')
            if i < 0:
                log(url, st, "no Internal Length test on page")
                continue
            seg = u[i:i + 1500]
            rv = re.search(r'"rendered_value":"([^"]*)"', seg)
            ub = re.search(r'"unblurred":(\w+)', seg)
            if not rv or not rv.group(1) or not ub or ub.group(1) != "true":
                log(url, st, "Internal Length present but blurred or empty: not recorded")
                continue
            val = re.match(r"([\d.]+) mm", rv.group(1))
            tx = re.sub(r"<script.*?</script>", " ", u, flags=re.S)
            tx = re.sub(r"<[^>]+>", " ", tx)
            tx = re.sub(r"\s+", " ", tx)
            ss = re.search(r"We (?:bought and )?tested[^.]{0,160}?in (?:a |the )?(men|women)'?s?'? (?:U\.?S\.?|US) size ([\d.]+)[^.]*\.", tx)
            title = re.search(r"<title>(.*?)</title>", t, re.S)
            title = html.unescape(title.group(1)).strip() if title else ""
            model = re.sub(r"\s*(Running Shoe )?Review.*$", "", title).strip()
            if ss:
                line = ss.group(1) + "'s"
                size = ss.group(2)
                note = f"size sentence on page: \"{ss.group(0).strip()}\""
            else:
                line, size = "unstated on page", ""
                note = "no size sentence found on page; not usable until the size is read"
            w.writerow([nid, "RTINGS", BRANDS[bslug], model, line, size,
                        "US " + line if ss else "", val.group(1) if val else rv.group(1),
                        "mm", "Internal Length (Internal Shape, 3D scan)", url, "2026-10-21",
                        "script (urllib)", note + f"; rendered value: {rv.group(1)}; field flagged insider_only on the page but served unblurred"])
            nid += 1
            counts[bslug] = counts.get(bslug, 0) + 1
            log(url, st, f"Internal Length {rv.group(1)}; size {line} {size}")
    print(counts)


if __name__ == "__main__":
    main()
