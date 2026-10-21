"""Read a saved Zendesk help-centre search JSON (or article JSON) and print each article's
title, URL, and its body text (or the sizing sentences of it).

usage: python -I zd.py FILE [full|keys] [TITLE_FILTER_REGEX]
"""
import html
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).resolve().parent.parent
KEYS = re.compile(r"(measur|foot|true to size|runs?|size up|size down|half|between|thumb|"
                  r"recommend|suggest|cm|inch|mm|length|fit)", re.I)

data = json.loads((ROOT / "downloads" / sys.argv[1]).read_text("utf-8"))
mode = sys.argv[2] if len(sys.argv) > 2 else "keys"
filt = re.compile(sys.argv[3], re.I) if len(sys.argv) > 3 else None
arts = data.get("results") or data.get("articles") or ([data["article"]] if "article" in data else [])
for a in arts:
    title = a.get("title") or a.get("name")
    if filt and not filt.search(title or ""):
        continue
    body = a.get("body") or ""
    txt = re.sub(r"(?s)<br\s*/?>|</(p|li|div|h\d|tr)>", "\n", body)
    txt = html.unescape(re.sub(r"(?s)<[^>]+>", " ", txt))
    txt = re.sub(r"[ \t]+", " ", txt)
    txt = re.sub(r"\s*\n\s*", "\n", txt).strip()
    print(f"### {title} | {a.get('html_url')} | updated {a.get('updated_at') or a.get('edited_at')}")
    if mode == "full":
        print(txt)
    else:
        for line in txt.split("\n"):
            if KEYS.search(line):
                print("  -", line[:500])
    imgs = re.findall(r'<img[^>]+src="([^"]+)"', body)
    if imgs:
        print("  [images]", imgs[:5])
