"""RunRepeat lab pages: read the 'Internal length' test result of each model.

Usage: python -I rr_scrape.py <brand> <limit> <catalog_url> [<catalog_url> ...]
Downloads go to ../downloads/rr/, rows are appended to ../measurements.csv,
every page opened is logged to ../pages_log.csv.
"""
import csv, html, os, re, sys, time, urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.join(BASE, "downloads", "rr")
os.makedirs(DL, exist_ok=True)
UA = "bigsmall-research-script/1.0 (shoe internal length study)"
MCSV = os.path.join(BASE, "measurements.csv")
LOG = os.path.join(BASE, "pages_log.csv")
FIELDS = ["id", "source", "brand", "model", "line", "size_label", "size_scale", "value",
          "unit", "measured_as", "url", "date_read", "tool", "notes"]


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


def text(s):
    s = re.sub(r"<script.*?</script>", " ", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return html.unescape(re.sub(r"\s+", " ", s))


def next_id():
    if not os.path.exists(MCSV):
        with open(MCSV, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(FIELDS)
        return 1
    rows = list(csv.DictReader(open(MCSV, encoding="utf-8")))
    return len(rows) + 1


def log(url, status, gave):
    new = not os.path.exists(LOG)
    with open(LOG, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["url", "status", "gave"])
        w.writerow([url, status, gave])


def main():
    brand, limit, cats = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
    prefix = re.sub(r"[^a-z0-9]+", "-", brand.lower()).strip("-")
    slugs = []
    for cu in cats:
        if cu.startswith("slug:"):
            if cu[5:] not in slugs:
                slugs.append(cu[5:])
            continue
        name = re.sub(r"[^a-z0-9]+", "_", cu.split("runrepeat.com/")[-1]) + ".html"
        t, st = get(cu, os.path.join(DL, "cat_" + name))
        if not t:
            log(cu, st, "catalog not read")
            continue
        found = re.findall(r"runrepeat\.com(?:\\u002F|/)(" + prefix + r"-[a-z0-9-]+)", t)
        n0 = len(slugs)
        for s in found:
            if s not in slugs and not s.endswith(("-review", "-vs")) and "-vs-" not in s:
                slugs.append(s)
        log(cu, st, f"catalog: {len(slugs)-n0} model slugs")
    seen_existing = set()
    if os.path.exists(MCSV):
        for r in csv.DictReader(open(MCSV, encoding="utf-8")):
            seen_existing.add(r["url"])
    got = 0
    nid = next_id()
    with open(MCSV, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        for s in slugs:
            if got >= limit:
                break
            url = "https://runrepeat.com/" + s
            if url in seen_existing:
                continue
            t, st = get(url, os.path.join(DL, s + ".html"))
            if not t:
                log(url, st, "not read")
                continue
            if re.search(r"(?i)captcha|verify you are human|cf-chl", t[:20000]):
                log(url, st, "bot check page: refusal")
                continue
            tx = text(t)
            m = re.search(r"Internal length Note: .{0,300}?Test results (.{1,80}?) ([\d.]+) mm Average ([\d.]+) mm", tx)
            title = re.search(r"<title>(.*?)</title>", t, re.S)
            title = html.unescape(title.group(1)).strip() if title else s
            if not m:
                log(url, st, "no internal length result on page")
                continue
            model = m.group(1).strip()
            val = m.group(2)
            avg = m.group(3)
            size_verdict = re.search(r"Size and fit Size (.{3,40}?) (?:True|Half|Slightly|Small|Large|Runs|One)", tx)
            notes = (f"page title: {title}; RunRepeat average shown beside it: {avg} mm; "
                     "size per methodology page (always men's US 9), not stated on this page")
            w.writerow([nid, "RunRepeat lab", brand, model, "men's (assumed from method)", "9",
                        "US men's", val, "mm", "Internal length", url, "2026-10-21",
                        "script (urllib)", notes])
            nid += 1
            got += 1
            log(url, st, f"internal length {val} mm ({model})")
    print(brand, "slugs", len(slugs), "recorded", got)


if __name__ == "__main__":
    main()
