import os, re, sys, html, json
sys.stdout.reconfigure(encoding="utf-8")
BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
from extract import load_text
names = ["kg-to-lbs", "cm-to-inches", "inches-to-cm", "5-10-in-cm", "cups-to-grams", "nm-to-ft-lbs", "psi-to-bar", "shoe-size-converter"]
out = {}
for nm in names:
    p = os.path.join(BASE, "downloads", "seodata_" + nm + ".html")
    raw, t, n = load_text(p)
    md = re.search(r'<meta[^>]+name="description"[^>]+content="([^"]*)"', raw, re.I)
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", raw, re.S | re.I)
    a = t.find("Keyword · US")
    b = t.find("For AI agents")
    seg = t[a:b] if a >= 0 and b > a else t[:1500]
    print("=" * 70)
    print(nm, "| META:", html.unescape(md.group(1)) if md else None)
    print("H1:", html.unescape(h1.group(1)).strip() if h1 else None)
    print(seg)
    out[nm] = {"meta": html.unescape(md.group(1)) if md else None, "h1": html.unescape(h1.group(1)).strip() if h1 else None, "seg": seg}
json.dump(out, open(os.path.join(BASE, "seodata_extract.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
