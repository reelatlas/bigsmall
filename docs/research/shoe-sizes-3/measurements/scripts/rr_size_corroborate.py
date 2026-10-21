"""For each RunRepeat row, read the saved page for any sentence stating a size
("men's US size 9", "a men's US 9", "women's US size 7") and write what the page says into
line / notes. Adds the Timberland Euro Hiker row, whose old-format review states its size
in a sentence. Renumbers ids. Run with python -I.
"""
import csv, html, os, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MCSV = os.path.join(BASE, "measurements.csv")
DL = os.path.join(BASE, "downloads", "rr")
rows = list(csv.DictReader(open(MCSV, encoding="utf-8")))
fields = list(rows[0].keys())
PAT = re.compile(r"(?i)\b(men|women)['’]?s (?:U\.?S\.? )?(?:size )?(\d{1,2}(?:\.5)?)\b")


def text(p):
    t = open(p, encoding="utf-8", errors="replace").read()
    t = re.sub(r"<script.*?</script>", " ", t, flags=re.S)
    t = re.sub(r"<style.*?</style>", " ", t, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    return html.unescape(re.sub(r"\s+", " ", t))


if not any("timberland-euro-hiker" in r["url"] for r in rows):
    rows.append({"id": "", "source": "RunRepeat lab", "brand": "Timberland", "model": "Euro Hiker",
                 "line": "men's", "size_label": "7.5", "size_scale": "US men's", "value": "257.9",
                 "unit": "mm", "measured_as": "internal length",
                 "url": "https://runrepeat.com/timberland-euro-hiker", "date_read": "2026-10-21",
                 "tool": "script (urllib)",
                 "notes": "old-format review, figure and size in a sentence: \"In a men's US size 7.5, we measured the internal length of the boot at 257.9 mm.\"; not the lab's usual US 9"})

for r in rows:
    if r["source"] != "RunRepeat lab" or "euro-hiker" in r["url"]:
        continue
    slug = r["url"].rsplit("/", 1)[-1]
    tx = text(os.path.join(DL, slug + ".html"))
    found = {}
    for m in PAT.finditer(tx):
        k = (m.group(1).lower(), m.group(2))
        if k not in found:
            found[k] = tx[max(0, m.start() - 90): m.end() + 40].strip()
    base = re.sub(r"; page states:.*$", "", r["notes"])
    base = base.replace("size per methodology page (always men's US 9), not stated on this page",
                        "size per the methodology page (\"We always test in men's US 9\")")
    if found:
        desc = " | ".join(f"{g}'s {s}: \"...{c}...\"" for (g, s), c in list(found.items())[:4])
        r["notes"] = base + "; page states: " + desc
        if ("men", "9") in found and not any(g == "men" and s != "9" for g, s in found):
            r["line"] = "men's"
        elif any(g == "men" and s != "9" for g, s in found):
            r["line"] = "men's (page names another men's size too: check)"
    else:
        r["notes"] = base + "; page states no size: the methodology page's men's US 9 is the only statement"
        r["line"] = "men's (from the methodology page)"

for i, r in enumerate(rows, 1):
    r["id"] = str(i)
with open(MCSV, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)
from collections import Counter
print(Counter(r["line"] for r in rows))
for r in rows:
    if "check" in r["line"]:
        print(r["id"], r["brand"], r["model"], r["notes"][-400:].encode("ascii", "replace").decode())
