import json, sys, time, urllib.request, urllib.parse
out = sys.argv[1]
qs = [l.rstrip("\n") for l in open(sys.argv[2], encoding="utf-8") if l.strip()]
res = {}
for q in qs:
    try:
        url = "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=" + urllib.parse.quote(q)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        raw = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", "replace")
        s = json.loads(raw)[1]
        res[q] = [x for x in s if x.startswith("=")] or ["(no calculator answer) first: " + (s[0] if s else "none")]
    except Exception as e:
        res[q] = ["ERR " + repr(e)[:100]]
    time.sleep(0.5)
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for q, v in res.items(): print(repr(q), "->", v[0])
