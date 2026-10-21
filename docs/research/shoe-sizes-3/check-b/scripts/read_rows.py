"""Read the checker-B rows and summarize them (checker B: every row of the file)."""
import csv
import sys
from collections import Counter, OrderedDict

src = sys.argv[1]
out_urls = sys.argv[2]

with open(src, newline="", encoding="utf-8-sig") as f:
    rows = list(csv.DictReader(f))

print("columns:", list(rows[0].keys()))
print("rows:", len(rows))
print("kinds:", Counter(r.get("kind", "") for r in rows))
urls = OrderedDict()
for r in rows:
    urls.setdefault(r["url"], []).append(r["id"])
print("distinct urls:", len(urls))
with open(out_urls, "w", encoding="utf-8", newline="") as f:
    for u, ids in urls.items():
        f.write(u + "\t" + ",".join(ids) + "\n")

# show the non-measurement rows in full
for r in rows:
    if r.get("kind") != "measurement":
        print("----")
        for k, v in r.items():
            if v:
                print(f"{k}: {v}")

# show the measurement rows compactly
print("==== measurements ====")
for r in rows:
    if r.get("kind") == "measurement":
        print(
            "|".join(
                [
                    r.get("id", ""),
                    r.get("brand", ""),
                    r.get("model", ""),
                    r.get("line", ""),
                    r.get("size_label", ""),
                    r.get("size_scale", ""),
                    r.get("value", ""),
                    r.get("unit", ""),
                    r.get("measured_as", ""),
                    r.get("worker_tool", ""),
                    r.get("url", ""),
                ]
            )
        )
# show distinct check notes for measurements
print("==== measurement check notes (distinct) ====")
for note, n in Counter(r.get("check", "") for r in rows if r.get("kind") == "measurement").items():
    print(n, "x", note)
