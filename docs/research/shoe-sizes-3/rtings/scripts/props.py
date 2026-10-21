"""Extract the data-vue / data-props blocks from an RTINGS page and save each as JSON.
Usage: python -I props.py <page.html> <outdir>
"""
import html, json, os, re, sys

page, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
s = open(page, encoding="utf-8").read()
for i, m in enumerate(re.finditer(r'data-vue="([^"]*)"[^>]*?data-props="([^"]*)"', s)):
    name, raw = m.group(1), html.unescape(m.group(2))
    try:
        obj = json.loads(raw)
    except Exception as e:
        print(i, name, "parse fail", e, len(raw))
        continue
    fn = os.path.join(outdir, f"{i:02d}_{name}.json")
    json.dump(obj, open(fn, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    keys = list(obj.keys()) if isinstance(obj, dict) else type(obj).__name__
    print(i, name, len(raw), keys)
