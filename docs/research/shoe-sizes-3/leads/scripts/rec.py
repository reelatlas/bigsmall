"""Shared recorders: append rows to leads.csv and charts.csv (headers written once).
Lead ids are L0001.. assigned in order; a lead already present (same url + exact_words) is skipped.
"""
import csv, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEADS = os.path.join(BASE, "leads.csv")
CHARTS = os.path.join(BASE, "charts.csv")
LH = ["id", "brand", "source", "kind", "claim", "exact_words", "url", "date_read", "tool",
      "agree", "disagree", "foot_length_printed"]
CH = ["brand", "source", "chart", "column", "row", "value", "url", "date_read", "tool", "flag"]
DATE = "2026-10-21"


def _rows(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def add_lead(brand, source, kind, claim, exact, url, tool="script", agree="", disagree="", foot="no"):
    rows = _rows(LEADS)
    for r in rows:
        if r["url"] == url and r["exact_words"] == exact and r["brand"] == brand:
            return r["id"]
    new = not rows and not os.path.exists(LEADS)
    lid = f"L{len(rows) + 1:04d}"
    with open(LEADS, "a", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(LH)
        w.writerow([lid, brand, source, kind, claim, exact, url, DATE, tool, agree, disagree, foot])
    return lid


def add_chart_rows(rows, flag="third-party chart"):
    """rows: iterable of (brand, source, chart, column, row, value, url, tool)."""
    existing = {(r["brand"], r["source"], r["chart"], r["column"], r["row"], r["url"]) for r in _rows(CHARTS)}
    new = not os.path.exists(CHARTS)
    n = 0
    with open(CHARTS, "a", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(CH)
        for b, s, c, col, row, v, u, t in rows:
            if (b, s, c, col, row, u) in existing:
                continue
            w.writerow([b, s, c, col, row, v, u, DATE, t, flag])
            n += 1
    return n
