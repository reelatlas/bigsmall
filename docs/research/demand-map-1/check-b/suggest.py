import os, sys, json, time, datetime, urllib.request, urllib.error, urllib.parse
sys.stdout.reconfigure(encoding="utf-8")
BASE = os.path.dirname(os.path.abspath(__file__))
DL = os.path.join(BASE, "downloads")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")
P1, P2 = chr(0x2032), chr(0x2033)
Q = [
 ("B28", "nm to ft lbs"),
 ("B29", "5 10 in cm"),
 ("B29", """5'10 in cm"""),
 ("B30", "180 cm to feet"),
 ("B31", "1 cup flour in grams"),
 ("B31", "cups to grams"),
 ("B32", """5'11" in cm"""),
 ("B32", """5'11 in cm"""),
 ("B32", """5' 11" in cm"""),
 ("B32", "5" + P1 + "11" + P2 + " in cm"),
 ("B32", """5' 11'' in cm"""),
 ("B32", "5 ft 11 in in cm"),
 ("B32", "5 ft 11 in to cm"),
 ("B32", "5 ft 11 in cm"),
 ("B32", "5ft11in to cm"),
 ("B32", "5 feet 11 inches to cm"),
 ("B32", "5 foot 11 in cm"),
 ("B32", "5 ft. 11 in. in cm"),
 ("B32", "5 feet and 11 inches in cm"),
 ("B32", "five foot eleven in cm"),
 ("B33", "5.11 ft in cm"),
 ("B34", "5-11"),
 ("B34", "5-11 in cm"),
 ("B34", "5 11 in cm"),
 ("B35", "11 in in ft"),
 ("B35", "5 ft 11 in in inches"),
 ("B35", "5 in cm"),
 ("B36", """5' 10 3/8" in cm"""),
 ("B36", "5 ft 11 3/4 in in cm"),
 ("B36", "5 foot 11 and a half in cm"),
]
out = []
for k, (row, q) in enumerate(Q):
    url = "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=" + urllib.parse.quote(q, safe="")
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json,text/javascript,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9"})
    rec = {"row": row, "query": q, "url": url, "time": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read(); rec["status"] = r.status; ct = r.headers.get("Content-Type") or ""
    except urllib.error.HTTPError as e:
        data = e.read() or b""; rec["status"] = e.code; ct = e.headers.get("Content-Type") or ""
    except Exception as e:
        data = b""; rec["status"] = None; rec["error"] = repr(e); ct = ""
    rec["content_type"] = ct
    fn = "suggest_%02d.json" % (k + 1)
    open(os.path.join(DL, fn), "wb").write(data)
    rec["file"] = fn
    cs = "utf-8"
    if "charset=" in ct.lower():
        cs = ct.lower().split("charset=")[1].split(";")[0].strip()
    try:
        j = json.loads(data.decode(cs, "replace"))
        rec["echo"] = j[0]
        rec["suggestions"] = j[1]
        rec["calc"] = [s for s in j[1] if s.startswith("= ")]
    except Exception as e:
        rec["parse_error"] = repr(e); rec["head"] = data[:200].decode("utf-8", "replace")
    out.append(rec)
    print(row, "|", repr(q), "| status", rec.get("status"), "| echo", repr(rec.get("echo")), "| calc:", rec.get("calc"), "| n:", len(rec.get("suggestions") or []), "| first:", (rec.get("suggestions") or [])[:3])
    if k < len(Q) - 1:
        time.sleep(1.2)
json.dump(out, open(os.path.join(BASE, "suggest_results.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
