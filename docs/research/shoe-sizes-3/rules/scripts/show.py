"""Print a saved page's text around each match of a pattern.

usage: python -I show.py FILE PATTERN [BEFORE] [AFTER] [MAXHITS]
FILE is a path under downloads/ (name with extension).
"""
import html
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).resolve().parent.parent


def text_of(raw: str) -> str:
    raw = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", raw)
    raw = re.sub(r"(?s)<[^>]+>", "\n", raw)
    raw = html.unescape(raw)
    raw = re.sub(r"[ \t\r\f\v]+", " ", raw)
    return re.sub(r"\s*\n\s*", "\n", raw)


f, pat = sys.argv[1], sys.argv[2]
before = int(sys.argv[3]) if len(sys.argv) > 3 else 300
after = int(sys.argv[4]) if len(sys.argv) > 4 else 800
maxhits = int(sys.argv[5]) if len(sys.argv) > 5 else 3
raw = (ROOT / "downloads" / f).read_text("utf-8", "replace")
t = text_of(raw) if pat != "RAW" else raw
if pat == "RAW":
    print(raw[:after])
    sys.exit()
last = -10**9
hits = 0
for m in re.finditer(pat, t, re.I):
    if m.start() < last + after:
        continue
    last = m.start()
    hits += 1
    print(f"--- hit {hits} at {m.start()} ---")
    print(t[max(0, m.start() - before): m.start() + after])
    if hits >= maxhits:
        break
print(f"[{hits} hits shown; text length {len(t)}]")
