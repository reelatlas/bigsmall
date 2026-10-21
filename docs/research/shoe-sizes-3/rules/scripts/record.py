"""Append rows to claims.csv, charts.csv, leads.csv, and lines to sources.md from a JSON file.

usage: python -I record.py batch.json
batch.json: {"claims": [...], "charts": [...], "leads": [...], "sources": ["md line", ...]}
Claims get ids C001.. in order; a claim's "agrees_with" may name another claim's
"key" field in the same or an earlier batch, resolved to its id.
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COLS = {
    "claims": ["id", "brand", "kind", "claim", "exact_words", "url", "site_region", "page_kind",
               "date_read", "tool", "agrees_with", "notes"],
    "charts": ["brand", "site", "chart", "column", "row", "value", "url", "date_read", "tool", "notes"],
    "leads": ["brand", "publisher", "claim", "url", "date_read"],
}
KEYS = ROOT / "scripts" / "claim_keys.json"


def main(p):
    batch = json.loads(Path(p).read_text(encoding="utf-8"))
    keys = json.loads(KEYS.read_text(encoding="utf-8")) if KEYS.exists() else {}
    for name, cols in COLS.items():
        rows = batch.get(name, [])
        if not rows:
            continue
        path = ROOT / f"{name}.csv"
        new = not path.exists()
        n = 0
        if name == "claims" and not new:
            with path.open(encoding="utf-8", newline="") as f:
                n = sum(1 for _ in csv.reader(f)) - 1
        with path.open("a", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols)
            if new:
                w.writeheader()
            for r in rows:
                r = dict(r)
                r.setdefault("date_read", "2026-10-21")
                if name == "claims":
                    n += 1
                    cid = f"C{n:03d}"
                    if r.get("key"):
                        keys[r["key"]] = cid
                    r["id"] = cid
                    aw = r.get("agrees_with", "")
                    r["agrees_with"] = keys.get(aw, aw)
                w.writerow({c: r.get(c, "") for c in cols})
        print(name, len(rows))
    # second pass: resolve agrees_with keys that point forward within the batch
    KEYS.write_text(json.dumps(keys, indent=1), encoding="utf-8")
    cpath = ROOT / "claims.csv"
    if cpath.exists():
        with cpath.open(encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f))
        changed = False
        for r in rows:
            if r["agrees_with"] in keys:
                r["agrees_with"] = keys[r["agrees_with"]]
                changed = True
        if changed:
            with cpath.open("w", encoding="utf-8", newline="") as f:
                w = csv.DictWriter(f, fieldnames=COLS["claims"])
                w.writeheader()
                w.writerows(rows)
    if batch.get("sources"):
        sp = ROOT / "sources.md"
        with sp.open("a", encoding="utf-8") as f:
            if sp.stat().st_size == 0:
                f.write("# Sources opened, in order (shoe-sizes-3, rules worker, 2026-10-21)\n\n")
            for line in batch["sources"]:
                f.write(f"- {line}\n")
        print("sources", len(batch["sources"]))


if __name__ == "__main__":
    main(sys.argv[1])
