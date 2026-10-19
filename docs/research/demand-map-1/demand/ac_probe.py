# Autocomplete prefix-depth probe: for each target query, the shortest prefix at which
# Google's suggest endpoint (client=firefox, 10 results) offers it. Output JSON in downloads/.
import json, sys, time, urllib.parse, urllib.request
root = sys.argv[1]; gl = sys.argv[2]; out = sys.argv[3]
cache = {}
def suggest(q):
    if q in cache: return cache[q]
    url = "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=%s&q=%s" % (gl, urllib.parse.quote(q))
    for attempt in range(2):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=15) as r:
                data = json.loads(r.read().decode("utf-8", "replace"))
            cache[q] = data[1]; time.sleep(0.35); return data[1]
        except urllib.error.HTTPError as e:
            if e.code == 429: print("429 at", q, flush=True); time.sleep(30)
            else: raise
    raise SystemExit("stopped: rate limited")
res = []
for line in open(root + "/" + (sys.argv[4] if len(sys.argv) > 4 else "targets.txt"), encoding="utf-8"):
    line = line.strip()
    if not line: continue
    tier, cat, t = line.split("|")
    hit = None
    for L in range(1, len(t) + 1):
        p = t[:L]
        if p.endswith(" ") and L < len(t): continue
        s = [x.lower().strip() for x in suggest(p)]
        for i, x in enumerate(s):
            if x == t or x.startswith(t + " "):
                hit = {"prefix": p, "chars": L, "rank": i + 1, "form": x, "list": s}; break
        if hit: break
    full = [x.lower() for x in suggest(t)]
    res.append({"tier": tier, "cat": cat, "q": t, "len": len(t), "hit": hit, "full": full})
    print(tier, cat, t, "->", hit["chars"] if hit else None, flush=True)
json.dump(res, open(out, "w", encoding="utf-8"), indent=1)
print("requests", len(cache))
