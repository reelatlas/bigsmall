import json, sys, time, urllib.request, urllib.parse
out = sys.argv[1]
prefixes = [l.strip("\n") for l in open(sys.argv[2], encoding="utf-8") if l.strip()]
eps = {
 "google": "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=",
 "bing": "https://api.bing.com/osjson.aspx?query=",
 "ddg": "https://duckduckgo.com/ac/?type=list&q=",
}
res = {}
for p in prefixes:
    res[p] = {}
    for name, base in eps.items():
        try:
            req = urllib.request.Request(base + urllib.parse.quote(p), headers={"User-Agent": "Mozilla/5.0"})
            raw = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", "replace")
            data = json.loads(raw)
            res[p][name] = data[1] if isinstance(data, list) and len(data) > 1 else data
        except Exception as e:
            res[p][name] = "ERR " + repr(e)[:120]
        time.sleep(0.4)
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("done", len(res))
