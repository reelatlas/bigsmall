"""The orchestrator's checks over Sean's manual capture (2026-10-20, the hundred-and-eleventh pass):
structure (parallel arrays of one length), inch against cm, sizes and lengths rising, label twins,
repeated lengths, the women's offset, and the deltas against ISO/TS 19407 (the engine's rule) at a
few sizes. Prints the anomalies, every one a quirk the README names, then a delta line per chart.

    python -I -X utf8 checks.py brand-charts.json
"""
import json, math, re, sys

PATH = sys.argv[1]
d = json.load(open(PATH, encoding="utf-8"))
problems = []


def num(x):
    if x is None:
        return None
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x).strip().lower().replace("k", "").replace("c", "").replace("y", "")
    m = re.match(r"^(\d+)\s+(\d+)/(\d+)$", s)
    if m:
        return int(m[1]) + int(m[2]) / int(m[3])
    try:
        return float(s)
    except ValueError:
        return None


def iso_foot_mm_from_us_men(us):
    uk = us - 1
    return (uk + 23) * 8.466  # one barleycorn a size, ISO/TS 19407 (the engine's rule)


def iso_foot_mm_from_us_women(us):
    uk = us - 2
    return (uk + 23) * 8.466


def iso_eu_from_foot(mm):
    return mm / 6.667 + 2


for key, b in d["brands"].items():
    for t, table in b["charts"].items():
        cols = {k: v for k, v in table.items() if isinstance(v, list)}
        lens = {len(v) for v in cols.values()}
        if len(lens) != 1:
            problems.append(f"{key}.{t}: array lengths differ {sorted(lens)}")
            continue
        n = lens.pop()
        if "columns" in table and table["columns"] != n:
            problems.append(f"{key}.{t}: columns={table['columns']} but arrays have {n}")
        cm, inch = cols.get("heel_toe_cm"), cols.get("heel_toe_in")
        # cm against inch
        if cm and inch:
            for i, (c, j) in enumerate(zip(cm, inch)):
                if c is None or j is None:
                    continue
                if abs(c - j * 2.54) > 0.2:
                    problems.append(f"{key}.{t}[{i}]: cm {c} vs in {j} (= {j*2.54:.1f} cm)")
        # monotony of lengths and sizes
        for c, v in cols.items():
            if c.endswith("_label") or c in ("jp", "mx", "cn", "br"):
                continue
            vals = [num(x) for x in v]
            prev = None
            for i, x in enumerate(vals):
                if x is None:
                    continue
                if prev is not None and x < prev - 1e-9:
                    # kids scales restart at 1 after 13.5: allowed where the drop is from >= 13 to <= 1.5
                    if not (prev >= 12.5 and x <= 1.5):
                        problems.append(f"{key}.{t}.{c}[{i}]: {x} after {prev} (not rising)")
                prev = x
        # label twins
        for c, v in cols.items():
            if not c.endswith("_label"):
                continue
            twin = cols.get(c[: -len("_label")])
            if not twin:
                problems.append(f"{key}.{t}.{c}: label without a numeric twin")
                continue
            for i, (lab, x) in enumerate(zip(v, twin)):
                if lab is None or x is None:
                    continue
                ln = num(lab)
                if ln is None or abs(ln - x) > 0.011:
                    problems.append(f"{key}.{t}.{c}[{i}]: label {lab!r} vs value {x}")
        # repeated lengths on adjacent sizes
        if cm:
            for i in range(1, n):
                if cm[i] is not None and cm[i] == cm[i - 1]:
                    problems.append(f"{key}.{t}.heel_toe_cm[{i}]: {cm[i]} repeats the row before")
        # women against men
        um, uw = cols.get("us_men"), cols.get("us_women")
        if um and uw:
            diffs = {round(num(w) - num(m), 2) for m, w in zip(um, uw) if m is not None and w is not None and num(m) is not None and num(w) is not None}
            if len(diffs) > 1:
                problems.append(f"{key}.{t}: us_women - us_men varies {sorted(diffs)}")

print("ANOMALIES:" if problems else "no anomalies")
for p in problems:
    print(" ", p)

print()
print("ISO deltas (brand's foot length minus ISO's for the same US size; brand EU minus ISO EU from the brand's own foot):")
for key, b in d["brands"].items():
    for t, table in b["charts"].items():
        cols = {k: v for k, v in table.items() if isinstance(v, list)}
        cm = cols.get("heel_toe_cm")
        if not cm:
            continue
        for sex, col, rule in (("M", "us_men", iso_foot_mm_from_us_men), ("W", "us_women", iso_foot_mm_from_us_women)):
            us = cols.get(col)
            if not us:
                continue
            picks = []
            for i, (s, c) in enumerate(zip(us, cm)):
                sn = num(s)
                if sn is None or c is None:
                    continue
                if (sex == "M" and sn in (7, 10, 13)) or (sex == "W" and sn in (6, 8, 10)):
                    foot = c * 10
                    iso = rule(sn)
                    eu = cols.get("eu")
                    eu_v = num(eu[i]) if eu else None
                    eu_iso = iso_eu_from_foot(foot)
                    picks.append(f"US {sex} {sn:g}: foot {foot:.0f} mm, ISO {iso:.0f} ({foot-iso:+.0f}); EU {eu_v if eu_v is not None else '-'} vs ISO {eu_iso:.1f} ({(eu_v-eu_iso):+.1f})" if eu_v is not None else f"US {sex} {sn:g}: foot {foot:.0f} mm, ISO {iso:.0f} ({foot-iso:+.0f})")
            if picks:
                print(f"  {key}.{t}: " + " | ".join(picks))
