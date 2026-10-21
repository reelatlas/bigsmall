"""Dump text lines a..b of a saved HTML download (tags stripped), joined compactly.
Usage: python -I dump.py <file> <a> <b> [sep]
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract import text_of  # noqa: E402

p, a, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
sep = sys.argv[4] if len(sys.argv) > 4 else "\n"
t = text_of(open(p, encoding="utf-8", errors="replace").read())
lines = [l.strip() for l in t.split("\n") if l.strip()]
print(sep.join(f"{i}:{lines[i]}" for i in range(a, min(b, len(lines)))))
