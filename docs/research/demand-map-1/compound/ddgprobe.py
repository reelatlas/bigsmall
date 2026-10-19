import json, sys, time, urllib.request, urllib.parse
qs = [l.rstrip("\n") for l in open(sys.argv[2], encoding="utf-8") if l.strip()]
res = {}
for q in qs:
    try:
        url = "https://api.duckduckgo.com/?format=json&no_html=1&q=" + urllib.parse.quote(q)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        d = json.loads(urllib.request.urlopen(req, timeout=15).read().decode("utf-8", "replace"))
        res[q] = {"AnswerType": d.get("AnswerType"), "Answer": str(d.get("Answer"))[:200], "Type": d.get("Type")}
    except Exception as e:
        res[q] = {"err": repr(e)[:100]}
    time.sleep(0.6)
json.dump(res, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for q, v in res.items():
    print(ascii(q), "->", ascii(v))
