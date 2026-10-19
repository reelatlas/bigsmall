"""Fetch Google's public query suggestions for shoe-size prefixes; write JSON to downloads/suggest/."""
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

out_dir = Path(sys.argv[1])
out_dir.mkdir(parents=True, exist_ok=True)
prefixes = [
    "us 11 ", "11 us ", "m us 11", "size 11 in ", "eu 45 to ", "eu 45 ", "uk 9 to ",
    "27 cm shoe", "27cm ", "women's 8 in ", "womens 8 in mens", "mens 10 in womens",
    "shoe size ", "shoe size conversion ", "us 10.5 ", "size 44 ", "44 eu ", "jp 27",
    "mondopoint ", "kids shoe size ", "toddler shoe size ", "11.5 mens in ",
    "9 uk in ", "uk 8 ", "eu 42 ", "size 9 women's in ",
]
results = {}
for p in prefixes:
    url = "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=" + urllib.parse.quote(p)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read().decode("utf-8", "replace"))
            results[p] = data[1]
    except Exception as e:  # record the failure, never retry around a block
        results[p] = "error: " + repr(e)
    time.sleep(0.5)
(out_dir / "google-suggest.json").write_text(json.dumps(results, indent=1, ensure_ascii=False), encoding="utf-8")
for p, s in results.items():
    print(repr(p), "->", s)
