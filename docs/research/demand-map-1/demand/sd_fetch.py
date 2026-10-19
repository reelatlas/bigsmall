# Fetch seodata.dev keyword pages (US, Google Ads API monthly averages) for each target; parse volume, h1, date, related.
import html, json, os, re, sys, time, urllib.request, urllib.error
root, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
rows = []
seen = set()
for fn in ("targets.txt", "extra.txt"):
    for line in open(os.path.join(root, fn), encoding="utf-8"):
        line = line.strip()
        if not line: continue
        tier, cat, q = line.split("|")
        slug = re.sub(r"[^a-z0-9]+", "-", q.lower()).strip("-")
        if slug in seen: continue
        seen.add(slug)
        url = "https://www.seodata.dev/keyword/" + slug
        rec = {"tier": tier, "cat": cat, "q": q, "url": url}
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                h = r.read().decode("utf-8", "replace")
            open(os.path.join(outdir, slug + ".html"), "w", encoding="utf-8").write(h)
            m = re.search(r'Monthly search volume for &#34;(.*?)&#34; is ([0-9,]+)', h)
            rec["kw"] = html.unescape(m.group(1)) if m else None
            rec["vol"] = int(m.group(2).replace(",", "")) if m else None
            d = re.search(r"updated (\d{4}-\d{2}-\d{2})", h); rec["updated"] = d.group(1) if d else None
            rel = re.findall(r'href="/keyword/[^"]+"[^>]*>([^<]+)</a></td>\s*<td[^>]*>([0-9,]+)</td>', h)
            rec["related"] = [(html.unescape(k), int(v.replace(",", ""))) for k, v in rel]
            rec["status"] = 200
        except urllib.error.HTTPError as e:
            rec["status"] = e.code
            if e.code in (403, 429): print("stop", e.code, q, flush=True); rows.append(rec); break
        except Exception as e:
            rec["status"] = str(e)
        rows.append(rec)
        print(rec.get("status"), q, rec.get("kw"), rec.get("vol"), flush=True)
        time.sleep(1.5)
    else:
        continue
    break
json.dump(rows, open(os.path.join(outdir, "..", "seodata.json"), "w", encoding="utf-8"), indent=1)
print("done", len(rows))
