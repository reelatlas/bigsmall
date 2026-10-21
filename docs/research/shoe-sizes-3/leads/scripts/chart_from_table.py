"""Record one HTML table of a saved download into charts.csv, every cell exactly as printed.
Usage: python -I chart_from_table.py <file> <table_index> <brand> <source> <chart_name> <url> <v|h> [key_col] [tool]
  v: first row is the header, each later row is a size row; key_col (default 0) names the row.
  h: first column holds the labels (sizes run across); the table is transposed first.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tables import tables  # noqa: E402
from rec import add_chart_rows  # noqa: E402

f, ti, brand, source, chart, url, orient = sys.argv[1:8]
key = int(sys.argv[8]) if len(sys.argv) > 8 else 0
tool = sys.argv[9] if len(sys.argv) > 9 else "script"
rows = tables(f)[int(ti)][1]
if orient == "h":
    w = max(len(r) for r in rows)
    rows = [r + [""] * (w - len(r)) for r in rows]
    rows = [list(c) for c in zip(*rows)]
hdr = rows[0]
out = []
for i, r in enumerate(rows[1:]):
    label = f"{hdr[key]}={r[key]}" if key < len(r) else f"row{i}"
    for j, (h, v) in enumerate(zip(hdr, r)):
        if j == key:
            continue
        out.append((brand, source, chart, h, f"{label} (row {i + 1})", v, url, tool))
print(f"{chart}: {add_chart_rows(out)} cells added; header = {hdr}")
