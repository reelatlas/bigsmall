"""Checker C for the sources pass (shoe-sizes-3): the browser-2 Skechers AU
adult charts. Every cell the worker transcribed from Skechers Australia's
size guide (MEN and WOMEN, footwear) is checked against the worker's saved
copies of the page, its text and two screenshots, row by row, each row
keyed by its US size, never by its row number.

The screenshots were read by eye (the Read tool shows images); that reading
is written out below as SHOT. The page text is parsed from the saved file.
Where both show a cell and disagree, the screenshot is trusted: a page text
can interleave columns, while the screenshot shows each cell in its column.

Run:  python -X utf8 -I check.py <repo root> <output folder>
Writes <output folder>/check.csv, one row per cell, and, when Pillow is
present, zoom/<chart>-columns.png: each screenshot's four columns cut out
and set side by side at twice the size, for a second read of every cell.
ASCII-only source: the typographic apostrophe is built from U+2019.
"""
import csv
import os
import re
import sys

if len(sys.argv) != 3:
    sys.exit("usage: check.py <repo root> <output folder>")
REPO, OUT = sys.argv[1], sys.argv[2]

B2 = "docs/research/shoe-sizes-3/browser-2"
CHARTS_REL = B2 + "/charts.csv"
PAGE_REL = B2 + "/pages/skechers-au-size-guide.txt"
SHOT_REL = {
    "MEN": B2 + "/screenshots/skechers-au-size-guide-men.jpg",
    "WOMEN": B2 + "/screenshots/skechers-au-size-guide-women.jpg",
}


def at_repo(rel):
    return os.path.join(REPO, *rel.split("/"))


APOS = chr(0x2019)
TABS = ("MEN", "WOMEN")
CHART = {
    "MEN": "Size & Fit Guide, MEN, Footwear",
    "WOMEN": "Size & Fit Guide, WOMEN, Footwear",
}
COLS = {
    "MEN": ["US MEN" + APOS + "S", "EU", "UK", "CM"],
    "WOMEN": ["US WOMEN" + APOS + "S", "EU", "UK", "CM"],
}

# The screenshots read by eye, row by row: (US, EU, UK, CM).
SHOT = {
    # skechers-au-size-guide-men.jpg: the frame ends under the US 14 row with
    # no table border below it, so US 15 and US 16 are out of frame.
    "MEN": [
        ("6", "38.5", "5", "24.3"),
        ("6.5", "39", "5.5", "24.5"),
        ("7", "39.5", "6", "25"),
        ("7.5", "40", "6.5", "25.5"),
        ("8", "41", "7", "26"),
        ("8.5", "41.5", "7.5", "26.5"),
        ("9", "42", "8", "27"),
        ("9.5", "42.5", "8.5", "27.5"),
        ("10", "43", "9", "28"),
        ("10.5", "44", "9.5", "28.5"),
        ("11", "45", "10", "29"),
        ("11.5", "45.5", "10.5", "29.5"),
        ("12", "46", "11", "30"),
        ("12.5", "47", "11.5", "30.5"),
        ("13", "47.5", "12", "31"),
        ("13.5", "48", "12.5", "31.2"),
        ("14", "48.5", "13", "31.5"),
    ],
    # skechers-au-size-guide-women.jpg: the table's bottom border shows under
    # US 13, so the whole table is in frame.
    "WOMEN": [
        ("5", "35", "2", "22"),
        ("5.5", "35.5", "2.5", "22.5"),
        ("6", "36", "3", "23"),
        ("6.5", "36.5", "3.5", "23.5"),
        ("7", "37", "4", "24"),
        ("7.5", "37.5", "4.5", "24.5"),
        ("8", "38", "5", "25"),
        ("8.5", "38.5", "5.5", "25.5"),
        ("9", "39", "6", "26"),
        ("9.5", "39.5", "6.5", "26.5"),
        ("10", "40", "7", "27"),
        ("10.5", "40.5", "7.5", "27.5"),
        ("11", "41", "8", "28"),
        ("11.5", "41.5", "8.5", "28.5"),
        ("12", "42", "9", "29"),
        ("13", "43", "10", "31.5"),
    ],
}
OUT_OF_FRAME = {"MEN": "row out of the screenshot's frame (it ends at US 14)", "WOMEN": ""}
STEP_WORDS = {0.5: "a half size", 1.0: "a whole size"}


def agree(a, b):
    """'exact', 'number' (same value, written differently), or '' (differs)."""
    if a == b:
        return "exact"
    try:
        return "number" if float(a) == float(b) else ""
    except (TypeError, ValueError):
        return ""


def load_record():
    rec = {t: {} for t in TABS}
    meta = {t: set() for t in TABS}
    odd = []
    with open(at_repo(CHARTS_REL), encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            if r["brand"] != "Skechers":
                continue
            tab = next((t for t in TABS if r["chart"] == CHART[t]), None)
            if tab is None:
                continue
            if r["column"] not in COLS[tab]:
                odd.append((tab, r["row"], r["column"], "column name not as expected"))
            cells = rec[tab].setdefault(int(r["row"]), {})
            if r["column"] in cells:
                odd.append((tab, r["row"], r["column"], "duplicate cell"))
            cells[r["column"]] = r["value"]
            meta[tab].add((r["site"], r["url"], r["date_read"], r["tool"]))
    return rec, meta, odd


def load_text():
    with open(at_repo(PAGE_REL), encoding="utf-8") as f:
        text = f.read().replace("\r\n", "\n")
    parts = re.split(r"^===== tab (\w+) \(clicked\) =====$", text, flags=re.M)
    tabs = {parts[i]: parts[i + 1] for i in range(1, len(parts) - 1, 2)}
    return text, tabs


def parse_table(body):
    lines = [ln.strip() for ln in body.split("\n")]
    i = lines.index("FOOTWEAR")
    rows, j = [], i + 2
    while lines[j] != "HOW TO MEASURE FOOTWEAR":
        rows.append(lines[j].split())
        j += 1
    return {"label": lines[i], "head": lines[i + 1], "rows": rows, "after": lines[j]}


record, meta, odd = load_record()
text, tabs = load_text()
out = []
print("=== record ===")
for tab in TABS:
    print(tab, "rows:", len(record[tab]), "cells:", sum(len(v) for v in record[tab].values()),
          "meta:", sorted(meta[tab]))
print("odd record rows:", odd or "none")
print("page text URL lines:", sorted(set(ln.strip() for ln in text.split("\n") if ln.startswith("URL:"))))

for tab in TABS:
    cols = COLS[tab]
    shot_file = SHOT_REL[tab].rsplit("/", 1)[1]
    page_file = PAGE_REL.rsplit("/", 1)[1] + " (" + tab + " tab)"
    tbl = parse_table(tabs[tab])
    print("\n=== %s ===" % tab)
    print("text label line:", repr(tbl["label"]), "| heading line:", repr(tbl["head"]),
          "| after table:", repr(tbl["after"]))
    print("text heading equals the CSV's column names joined:", tbl["head"] == " ".join(cols))
    print("non-ASCII in text heading:", [(c, "U+%04X" % ord(c)) for c in tbl["head"] if ord(c) > 127])
    print("non-ASCII in CSV US column name:", [(c, "U+%04X" % ord(c)) for c in cols[0] if ord(c) > 127])
    bad = [r for r in tbl["rows"] if len(r) != 4]
    print("text rows:", len(tbl["rows"]), "| not four tokens:", bad or "none")
    t_by = {r[0]: r for r in tbl["rows"] if len(r) == 4}
    t_order = [r[0] for r in tbl["rows"]]
    s_by = {r[0]: r for r in SHOT[tab]}
    s_order = [r[0] for r in SHOT[tab]]
    dis = [(u, cols[k], t_by[u][k], s_by[u][k]) for u in s_order if u in t_by
           for k in range(4) if agree(t_by[u][k], s_by[u][k]) != "exact"]
    print("screenshot rows:", len(s_order), "| text vs screenshot disagreements:", dis or "none")
    print("screenshot rows absent from text:", [u for u in s_order if u not in t_by] or "none")
    rec = record[tab]
    nums = sorted(rec)
    r_order = [rec[n].get(cols[0]) for n in nums]
    print("record US order:", r_order)
    print("duplicate US sizes - record:", len(r_order) != len(set(r_order)),
          "| text:", len(t_order) != len(set(t_order)))
    missing = [u for u in t_order if u not in r_order] + \
              [u for u in s_order if u not in r_order and u not in t_order]
    print("source rows missing from the record:", missing or "none")
    for idx, n in enumerate(nums):
        us = rec[n].get(cols[0])
        for k, col in enumerate(cols):
            recorded = rec[n].get(col)
            tv = t_by[us][k] if us in t_by else None
            sv = s_by[us][k] if us in s_by else None
            notes = []
            if sv is not None and tv is not None:
                src_val = sv
                if agree(sv, tv) == "exact":
                    src = shot_file + " + " + page_file
                else:
                    src = shot_file + " (page text: " + tv + ")"
                    notes.append("page text and screenshot disagree; screenshot trusted")
            elif tv is not None:
                src_val, src = tv, page_file + " only"
                if OUT_OF_FRAME[tab]:
                    notes.append(OUT_OF_FRAME[tab])
            elif sv is not None:
                src_val, src = sv, shot_file + " only"
                notes.append("row absent from the page text")
            else:
                src_val, src = "", "neither source shows the row"
            if src_val == "":
                verdict = "could not read"
            else:
                a = agree(recorded, src_val)
                verdict = "confirmed" if a else "corrected"
                if a == "number":
                    notes.append("same number, written differently")
            if k == 0:
                for name, order in (("page text", t_order), ("screenshot", s_order)):
                    if us in order and order.index(us) != idx:
                        notes.append("%s has it as row %d of the table" % (name, order.index(us) + 1))
            if col == "CM" and idx > 0 and verdict == "confirmed":
                pu, pc = r_order[idx - 1], rec[nums[idx - 1]].get("CM")
                du, dc = float(us) - float(pu), float(src_val) - float(pc)
                if du > 0 and abs(dc / du - 1.0) > 0.25:
                    notes.append("as printed: %+.1f cm from US %s, %s up"
                                 % (dc, pu, STEP_WORDS.get(du, "%g sizes" % du)))
            out.append({
                "chart": CHART[tab], "us_size": us, "column": col, "recorded": recorded,
                "verdict": verdict, "source_value": src_val, "source": src,
                "note": "; ".join(notes),
            })
    for u in missing:
        out.append({
            "chart": CHART[tab], "us_size": u, "column": "(row)", "recorded": "",
            "verdict": "missing from record",
            "source_value": " ".join(t_by.get(u, s_by.get(u, ()))),
            "source": page_file, "note": "row in the source, not in charts.csv",
        })

print("\n=== verdicts ===")
for tab in TABS:
    mine = [o for o in out if o["chart"] == CHART[tab]]
    vs = [o["verdict"] for o in mine]
    print(CHART[tab], {v: vs.count(v) for v in sorted(set(vs))}, "of", len(vs))
    one = [o for o in mine if o["verdict"] == "confirmed" and o["source"].endswith(" only")]
    print("  confirmed on one source only:", len(one), sorted(set(o["us_size"] for o in one)))
print("not confirmed:", [o for o in out if o["verdict"] != "confirmed"] or "none")
print("notes:")
for o in out:
    if o["note"] and not o["note"].startswith("row out of"):
        print(" ", o["chart"].split(",")[1].strip(), "US", o["us_size"], o["column"], "|", o["note"])

print("\n=== words on what CM measures ===")
for tab in TABS:
    for ln in tabs[tab].split("\n"):
        if re.search(r"\bCM\b|centimet|foot length|insole|\blength\b", ln, re.I):
            print(tab, "|", ln.strip()[:240])
START = "Stand with your heel against a wall"
hits = [ln.strip() for ln in text.split("\n") if START in ln]
print("lines holding the sentence:", len(hits), "| distinct:", len(set(hits)))
for ln in sorted(set(hits)):
    print("non-ASCII in it:", [(c, "U+%04X" % ord(c)) for c in ln if ord(c) > 127] or "none")
    for s in re.split(r"(?<=\.)\s+", ln):
        print("  SENTENCE:", s)
print("'CM size matrix' occurrences in the page text:", text.count("CM size matrix"))

os.makedirs(OUT, exist_ok=True)
fields = ["chart", "us_size", "column", "recorded", "verdict", "source_value", "source", "note"]
with open(os.path.join(OUT, "check.csv"), "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(out)
print("\nwrote check.csv:", len(out), "rows")

try:
    from PIL import Image
except ImportError as e:
    print("Pillow not present; no zoomed crops:", e)
else:
    zd = os.path.join(OUT, "zoom")
    os.makedirs(zd, exist_ok=True)
    centres = (0.233, 0.407, 0.581, 0.754)  # column centres, fractions of the frame's width
    half = 0.05
    for tab in TABS:
        im = Image.open(at_repo(SHOT_REL[tab])).convert("RGB")
        W, H = im.size
        top = int(0.465 * H)
        strips = [im.crop((int((c - half) * W), top, int((c + half) * W), H)) for c in centres]
        sw = strips[0].width
        comp = Image.new("RGB", (sw * 4 + 30, H - top), "white")
        for i, s in enumerate(strips):
            comp.paste(s, (i * (sw + 10), 0))
        comp = comp.resize((comp.width * 2, comp.height * 2), Image.LANCZOS)
        name = tab.lower() + "-columns.png"
        comp.save(os.path.join(zd, name))
        print(tab, "screenshot", W, "x", H, "-> zoom/" + name, comp.size)
