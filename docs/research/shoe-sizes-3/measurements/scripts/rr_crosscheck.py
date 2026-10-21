"""Cross-check each RunRepeat row's value against the page's second rendering of the same
result (the 'Size and fit ... Internal length <shoe> mm <average> mm' comparison table)."""
import csv, html, os, re
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.DictReader(open(os.path.join(BASE, "measurements.csv"), encoding="utf-8")))
bad = agree = none = 0
for r in rows:
    if "euro-hiker" in r["url"]:
        continue
    t = open(os.path.join(BASE, "downloads", "rr", r["url"].rsplit("/", 1)[-1] + ".html"), encoding="utf-8", errors="replace").read()
    t = re.sub(r"<script.*?</script>", " ", t, flags=re.S); t = re.sub(r"<[^>]+>", " ", t); t = html.unescape(re.sub(r"\s+", " ", t))
    m = re.search(r"Size and fit Size .{0,60}? Internal length ([\d.]+) mm ([\d.]+) mm", t)
    if not m:
        none += 1
    elif m.group(1) == r["value"]:
        agree += 1
    else:
        bad += 1; print("MISMATCH", r["id"], r["model"], r["value"], m.group(1))
print("agree", agree, "mismatch", bad, "no table", none)
