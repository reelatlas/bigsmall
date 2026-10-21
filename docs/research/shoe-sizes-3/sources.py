"""The sources pass's data file (docs/research/shoe-sizes-3.md, wave 3; docs/RESEARCH.md §4).

Reads the keepers by their values, never by a row's index, and writes the doc's §9 tables between
its markers, so a correction regenerates the record and nothing is typed twice:

  the brands' charts         ../shoe-sizes-2/brands.json, the charts' record (brands.py): the product's
                             charts, each brand's foot at a US men's 9 where its chart gives one, and
                             Puma's product lengths
  RunRepeat's lab            measurements/measurements.csv, 168 internal lengths, a caliper on the cut
                             shoe, men's US 9 (wave 1, checker B: all confirmed)
  RTINGS' lab                rtings-member/measurements.csv, 206 internal lengths, a scanned footbed,
                             men's US 9, read under Sean's membership (wave 1d)
  the brands' other pages    rules/charts.csv (Brooks UK's foot lengths, Reebok AU's scales),
                             browser-2/charts.csv (Skechers AU's CM column, Clarks UK's foot lengths),
                             browser/charts.csv (HOKA, UGG, Crocs, On, and Asics MY read live)
  the compiled charts        leads/charts.csv, third parties' copies, a cross-check and nothing more
  the wearers' reports       leads/zappos_fit.csv, a flag beside the numbers and never a figure

The model (the doc's §2): a measurement counts when its source measured the shoe itself, at a stated
size, by a stated method (the measured-fact rule, docs/RESEARCH.md §2); each lab is calibrated on its
own, since the two measure differently (a caliper on a cut shoe; a scanned footbed). Per lab, per
brand: the median internal length at US 9 with its spread, a brand with fewer than three shoes marked
thin. The pack: the median of the brands' medians. The calibration: for the brands whose charts say
their length is the foot's, the allowance, the median internal length less the chart's foot at the
same size; the brands fall into two families by their charts (a foot within half a size of ISO's
262.6 mm at a US 9; a foot a size above it), so the allowance is a family's, never one number. The
no-foot brands' feet are read through each family's allowance and set beside what the brand's own
page or rule gives and ISO's label, and Asics's two readings of its one chart, and Puma's product
lengths, are read the same way.

Run from anywhere:  python -I docs/research/shoe-sizes-3/sources.py          prints the tables
                    python -I docs/research/shoe-sizes-3/sources.py --write  writes them into the
                    doc's §9 between its markers and the CSVs beside this file (labs.csv, feet.csv)
"""

from __future__ import annotations

import csv
import json
import re
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RECORD = HERE.parent / "shoe-sizes-2" / "brands.json"
DOC = HERE.parent / "shoe-sizes-3.md"
START = "<!-- sources.py: tables -->"
END = "<!-- /sources.py -->"

# ISO/TS 19407 over the foot's length in mm, as the engine holds it (ADR 0027; brands.py).
UK_STEP = 8.47


def foot_of_usm(size: float) -> float:
    return (size + 22) * UK_STEP


ISO9 = foot_of_usm(9)  # 262.57 mm, the foot ISO's rule gives a US men's 9
HALF = UK_STEP / 2  # half a size, 4.2 mm
THIN = 3  # fewer shoes than this is thin (docs/RESEARCH.md §2)

# The brands whose charts are the question (the doc's §5), and the families' names.
QUESTION = ("Brooks", "Skechers", "Puma", "On", "Asics")
ISO_FAMILY = "ISO’s grid"
ABOVE_FAMILY = "a size above"

VULGAR = {"½": " 1/2", "⅓": " 1/3", "⅔": " 2/3", "¼": " 1/4", "¾": " 3/4"}


def number(text) -> float | None:
    """A cell's number as a source prints it: 27, 27.5, 21,5, 37 1/3, 9" 1/16, 49½; X and a dash
    are none. A range or a pair gives its first number."""
    if text is None:
        return None
    if isinstance(text, (int, float)):
        return float(text)
    t = str(text).strip()
    if t in ("", "X", "-", "--", "—", "–", "n/a", "N/A"):
        return None
    for k, v in VULGAR.items():
        t = t.replace(k, v)
    t = re.sub(r"^(\d+)H$", r"\1.5", t)  # a half size marked H (Asics MY and SG print 4H)
    t = t.replace('"', " ").replace("”", " ").replace("″", " ").replace(",", ".")
    m = re.fullmatch(r"\s*(\d+(?:\.\d+)?)(?:\s+(\d+)/(\d+))?\s*", t)
    if m:
        value = float(m.group(1))
        if m.group(2):
            value += int(m.group(2)) / int(m.group(3))
        return value
    m = re.search(r"\d+(?:\.\d+)?", t)
    return float(m.group()) if m else None


def fmt(x: float | None, places: int = 1) -> str:
    if x is None:
        return "–"
    s = f"{x:.{places}f}"
    return s


def signed(x: float | None, places: int = 1) -> str:
    if x is None:
        return "–"
    return f"{x:+.{places}f}"


def md_table(headers: list[str], rows: list[list[str]]) -> str:
    """A Markdown table padded as Prettier pads one, so a re-run leaves the doc unchanged."""
    widths = [max(len(h), *(len(r[i]) for r in rows)) if rows else len(h) for i, h in enumerate(headers)]
    widths = [max(w, 3) for w in widths]

    def line(cells):
        return "| " + " | ".join(c.ljust(w) for c, w in zip(cells, widths)) + " |"

    out = [line(headers), "| " + " | ".join("-" * w for w in widths) + " |"]
    out.extend(line(r) for r in rows)
    return "\n".join(out)


# --- the charts' record -----------------------------------------------------------------------
record = json.loads(RECORD.read_text(encoding="utf-8"))
CHARTS = record["charts"]


def record_chart(brand: str, line: str) -> dict | None:
    """The product's chart for a brand and a line, the unisex chart standing in for either."""
    for want in (line, "unisex"):
        for c in CHARTS:
            if c["brand"] == brand and c["product"] and c["line"] == want:
                return c
    return None


def any_chart(brand: str, site: str, line: str, basis: str | None = None) -> dict | None:
    for c in CHARTS:
        if c["brand"] == brand and c["site"] == site and c["line"] == line and (basis is None or c["length"]["basis"] == basis):
            return c
    return None


def row_at(chart: dict | None, key: str, size: float) -> dict | None:
    if chart is None:
        return None
    for r in chart["rows"]:
        v = r.get(key)
        if isinstance(v, (int, float)) and abs(float(v) - size) < 1e-9:
            return r
    return None


def foot_at_usm9(chart: dict | None) -> float | None:
    r = row_at(chart, "us_men", 9.0)
    return float(r["foot_mm"]) if r and r.get("foot_mm") is not None else None


# --- the keepers' chart CSVs (brand, site, chart, column, row, value, ...) ----------------------
def live_chart(folder: str, brand: str, chart: str) -> list[dict[str, str]]:
    """A chart from a keeper's charts.csv as rows (each a column -> value map), by the chart's name."""
    rows: dict[int, dict[str, str]] = {}
    with (HERE / folder / "charts.csv").open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            if r["brand"] == brand and r["chart"] == chart:
                rows.setdefault(int(r["row"]), {})[r["column"]] = r["value"]
    return [rows[k] for k in sorted(rows)]


def live_at(rows: list[dict[str, str]], key_col: str, size: float, col: str) -> float | None:
    for r in rows:
        if number(r.get(key_col)) == size:
            return number(r.get(col))
    return None


# --- the labs ---------------------------------------------------------------------------------
def load_labs() -> list[dict]:
    out = []
    with (HERE / "measurements" / "measurements.csv").open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            size = float(r["size_label"])
            counted = size == 9.0
            out.append(
                dict(
                    lab="RunRepeat",
                    brand=r["brand"],
                    model=r["model"],
                    size=size,
                    value=float(r["value"]),
                    counted=counted,
                    reason="" if counted else f"measured at a US {size:g}, not the lab's US 9",
                    flag="" if "methodology" not in r["line"] else "the size by the methodology page alone",
                    url=r["url"],
                )
            )
    with (HERE / "rtings-member" / "measurements.csv").open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            if not r["measured_as"].startswith("internal length"):
                continue
            pre = "before Test Bench 0.10" in r["notes"]
            out.append(
                dict(
                    lab="RTINGS",
                    brand=r["brand"],
                    model=r["model"],
                    size=float(r["size_label"]),
                    value=float(r["value"]),
                    counted=not pre,
                    reason="reviewed before test bench 0.10, the size not stated per shoe (RTINGS: some such shoes were measured at a US 8 or 13)" if pre else "",
                    flag="",
                    url=r["url"],
                )
            )
    return out


LABS = ("RunRepeat", "RTINGS")


def stats(values: list[float]) -> dict:
    v = sorted(values)
    return dict(n=len(v), median=statistics.median(v), low=v[0], high=v[-1])


def by_brand(rows: list[dict], lab: str, include_aside: bool = False) -> dict[str, dict]:
    groups: dict[str, list[float]] = {}
    for r in rows:
        if r["lab"] != lab or (not r["counted"] and not include_aside):
            continue
        groups.setdefault(r["brand"], []).append(r["value"])
    return {b: stats(v) for b, v in groups.items()}


def pack(brands: dict[str, dict]) -> float:
    return statistics.median([s["median"] for s in brands.values() if s["n"] >= THIN])


# --- the calibration ---------------------------------------------------------------------------
def calibration_brands() -> list[dict]:
    """Every brand whose product chart says its length is the foot's and prints a foot at a US men's
    9 on its men's or unisex chart; Asics's basis is this pass's question, so it is shown and never
    counted in a family's allowance."""
    out = []
    for brand in sorted({c["brand"] for c in CHARTS if c["product"]}, key=str.lower):
        chart = record_chart(brand, "men")
        if chart is None or chart["length"]["basis"] != "foot":
            continue
        foot = foot_at_usm9(chart)
        if foot is None:
            continue
        family = ISO_FAMILY if abs(foot - ISO9) <= HALF else (ABOVE_FAMILY if foot > ISO9 else "below")
        out.append(dict(brand=brand, foot=foot, family=family, under_test=brand == "Asics", chart=chart))
    return out


def allowances(cal: list[dict], brands: dict[str, dict]) -> dict[str, float | None]:
    out = {}
    for c in cal:
        s = brands.get(c["brand"])
        out[c["brand"]] = (s["median"] - c["foot"]) if s else None
    return out


def family_allowance(cal: list[dict], brands: dict[str, dict], family: str) -> tuple[float | None, list[str]]:
    vals, names = [], []
    for c in cal:
        s = brands.get(c["brand"])
        if c["family"] == family and not c["under_test"] and s and s["n"] >= THIN:
            vals.append(s["median"] - c["foot"])
            names.append(c["brand"])
    return (statistics.median(vals) if vals else None), names


# --- the candidates the brands' own pages give at a US men's 9 ----------------------------------
def candidates() -> dict[str, dict]:
    brooks_uk = live_chart("rules", "Brooks", "Men's running shoes, Shoe size comparison")
    skechers_au = live_chart("browser-2", "Skechers", "Size & Fit Guide, MEN, Footwear")
    puma_product = any_chart("Puma", "us.puma.com", "men", "product")
    puma_au = any_chart("Puma", "au.puma.com", "men", "product")
    on_men = record_chart("On", "men")
    asics_us = record_chart("Asics", "men")
    brooks_cm = live_at(brooks_uk, "US", 9.0, "Foot Length (CM)")
    skechers_cm = live_at(skechers_au, "US MEN’S", 9.0, "CM")
    puma_row = row_at(puma_product, "us_men", 9.0)
    puma_au_row = row_at(puma_au, "us_men", 9.0)
    on_row = row_at(on_men, "us_men", 9.0)
    asics_foot = foot_at_usm9(asics_us)
    return {
        "Brooks": dict(
            what="its UK chart’s Foot Length (CM), as printed",
            foot=brooks_cm * 10 if brooks_cm is not None else None,
            source="brooksrunning.com/en_gb, Men’s running shoes, US 9",
        ),
        "Skechers": dict(
            what="its AU chart’s CM column, read by the page’s steps",
            foot=skechers_cm * 10 if skechers_cm is not None else None,
            source="skechers.com.au, Size & Fit Guide, men, US 9",
        ),
        "Puma": dict(
            what="its product measurement, the shoe’s and not the foot’s",
            foot=float(puma_row["product_mm"]) if puma_row else None,
            source="us.puma.com, Product Measurements, US 9"
            + (f"; au.puma.com Length cm {puma_au_row['foot_mm'] / 10:g}" if puma_au_row and puma_au_row.get("foot_mm") else ""),
        ),
        "On": dict(
            what="its rule, the Japan label less 1 cm",
            foot=(float(on_row["jp"]) - 1) * 10 if on_row and on_row.get("jp") is not None else None,
            source=f"on.com, JP {on_row['jp']:g} at US 9, the FAQ’s centimetre" if on_row else "",
        ),
        "Asics": dict(
            what="its US page’s reading, the CM column as the foot’s",
            foot=asics_foot,
            source="asics.com/us, CM at US 9",
            alt_what="its NZ and AU pages’ rule, the foot plus 1 to 1.5 cm",
            alt=(asics_foot - 15, asics_foot - 10) if asics_foot is not None else None,
        ),
    }


# --- the cross-checks: the live reads of 2026-10-21 against the record ---------------------------
# Each: a name, the keeper folder, the brand, the chart's name in the keeper, the keeper's key column,
# the record's key, the record chart's line, and the columns to compare (keeper column -> (record key,
# kind, factor)): kind mm compares in millimetres, in in inches, size as a size.
LIVE_CHECKS = [
    ("HOKA men, live against the record", "browser", "HOKA", "Sizing Information: Men, Footwear, Regular", "US", "us_men", "men",
     {"Foot Length (CM)": ("foot_mm", "mm", 10), "Foot Length (IN)": ("foot_in", "in", 1), "UK": ("uk", "size", 1), "Europe": ("eu", "size", 1), "Japan (CM)": ("jp", "size", 1)}),
    ("HOKA women, live against the record", "browser", "HOKA", "Sizing Information: Women, Footwear, Regular", "US", "us_women", "women",
     {"Foot Length (CM)": ("foot_mm", "mm", 10), "Foot Length (IN)": ("foot_in", "in", 1), "UK": ("uk", "size", 1), "Europe": ("eu", "size", 1), "Japan (CM)": ("jp", "size", 1)}),
    ("UGG men, live against the record", "browser", "UGG", "Size Information: Footwear, Men's", "US Men's", "us_men", "men",
     {"Heel to Toe (IN)": ("foot_in", "in", 1), "UK": ("uk", "size", 1), "EU": ("eu", "size", 1), "Japan (CM)": ("jp", "size", 1)}),
    ("UGG women, live against the record", "browser", "UGG", "Size Information: Footwear, Women's", "US Women's", "us_women", "women",
     {"Heel to Toe (IN)": ("foot_in", "in", 1), "UK": ("uk", "size", 1), "EU": ("eu", "size", 1), "Japan (CM)": ("jp", "size", 1)}),
    ("Crocs, live against the record", "browser", "Crocs", "Size Chart: Adult", "US Men", "us_men", "unisex",
     {"Heel to Toe Length (Centimeters)": ("foot_mm", "mm", 10), "Heel to Toe Length (Inches)": ("foot_in", "in", 1), "UK Men": ("uk_men", "size", 1), "Japan": ("jp", "size", 1)}),
    ("On men, live against the record", "browser", "On", "Size Guide - Mens Shoes (Cloudmonster product page, Size chart)", "US", "us_men", "men",
     {"EU": ("eu", "size", 1), "JP": ("jp", "size", 1), "UK": ("uk", "size", 1)}),
    ("On women, live against the record", "browser", "On", "Size Guide - Womens Shoes (Cloud 6 product page, Size chart)", "US", "us_women", "women",
     {"EU": ("eu", "size", 1), "JP": ("jp", "size", 1), "UK": ("uk", "size", 1)}),
    ("Clarks men, live against the record", "browser-2", "Clarks", "MENS CLARKS SHOE SIZES", "Clarks UK Size", "uk", "men",
     {"Foot Length (Millimetres)": ("foot_mm", "mm", 1), "Clarks EU Size": ("eu", "size", 1), "Standard EU Size": ("eu_standard", "size", 1)}),
    ("Clarks women, live against the record", "browser-2", "Clarks", "WOMENS CLARKS SHOE SIZES", "Clarks UK Size", "uk", "women",
     {"Foot Length (Millimetres)": ("foot_mm", "mm", 1), "Clarks EU Size": ("eu", "size", 1), "Standard EU Size": ("eu_standard", "size", 1)}),
    ("Asics MY men against its US chart", "browser", "Asics", "Shoe Size Guide: MEN'S/UNISEX SHOE SIZES", "US", "us_men", "men",
     {"CM": ("foot_mm", "mm", 10), "EURO": ("eu", "size", 1), "UK": ("uk", "size", 1)}),
    ("Asics MY women against its US chart", "browser", "Asics", "Shoe Size Guide: WOMEN'S SHOE SIZES", "US", "us_women", "women",
     {"CM": ("foot_mm", "mm", 10), "EURO": ("eu", "size", 1), "UK": ("uk", "size", 1)}),
    ("Skechers AU men against its US chart", "browser-2", "Skechers", "Size & Fit Guide, MEN, Footwear", "US MEN’S", "us_men", "men",
     {"EU": ("eu", "size", 1), "UK": ("uk", "size", 1)}),
    ("Skechers AU women against its US chart", "browser-2", "Skechers", "Size & Fit Guide, WOMEN, Footwear", "US WOMEN’S", "us_women", "women",
     {"EU": ("eu", "size", 1), "UK": ("uk", "size", 1)}),
    ("Brooks UK men against its US chart", "rules", "Brooks", "Men's running shoes, Shoe size comparison", "US", "us_men", "men",
     {"UK": ("uk", "size", 1), "Europe": ("eu", "size", 1)}),
    ("Brooks UK women against its US chart", "rules", "Brooks", "Women's running shoes, Shoe size comparison", "US", "us_women", "women",
     {"UK": ("uk", "size", 1), "EU": ("eu", "size", 1)}),
    ("Reebok AU men against its US chart", "rules", "Reebok", "Men's Size Guides, Men's Footwear", "US", "us_men", "unisex",
     {"INCH": ("foot_in", "in", 1)}),
    ("Reebok AU women against its US chart", "rules", "Reebok", "Women's Size Guides, Women's Footwear", "US", "us_women", "unisex",
     {"INCH": ("foot_in", "in", 1)}),
]

TOLERANCE = {"mm": (0.5, 1.5), "in": (0.005, 0.1), "size": (0.01, 0.34)}


def check_live(spec) -> dict:
    name, folder, brand, chart_name, key_col, record_key, line, cols = spec
    rows = live_chart(folder, brand, chart_name)
    chart = record_chart(brand, line)
    compared = equal = near = 0
    off: list[str] = []
    for r in rows:
        size = number(r.get(key_col))
        if size is None:
            continue
        rec = row_at(chart, record_key, size)
        if rec is None:
            continue
        for col, (rk, kind, factor) in cols.items():
            live = number(r.get(col))
            ours = rec.get(rk)
            if live is None or ours is None or isinstance(ours, list):
                continue
            compared += 1
            diff = abs(live * factor - float(ours))
            eq, nr = TOLERANCE[kind]
            if diff <= eq:
                equal += 1
            elif diff <= nr:
                near += 1
            else:
                unit = {"mm": " mm", "in": " in", "size": ""}[kind]
                off.append(f"{key_col.split(' ')[0]} {size:g} {col}: {live * factor:g} against {float(ours):g}{unit}")
    return dict(name=name, rows=len(rows), compared=compared, equal=equal, near=near, off=off)


# --- the compiled charts (a cross-check and nothing more) ----------------------------------------
BRAND_NAMES = {c["brand"].lower(): c["brand"] for c in CHARTS}
BRAND_NAMES.update({"dr martens": "Dr. Martens", "hoka one one": "HOKA"})


def column_kind(name: str) -> str | None:
    n = name.lower().strip()
    if "women" in n:
        return "us_women"
    if "men" in n and "us" in n:
        return "us_men"
    if n in ("us", "us size", "usa"):
        return "us"
    if n == "uk" or n.startswith("uk "):
        return "uk"
    if "inch" in n:
        return "in"
    if "mm" in n or "millimet" in n:
        return "mm"
    if "cm" in n or "centimet" in n:
        return "cm"
    if "foot" in n or "heel" in n or "length" in n:
        return "len"
    return None


def check_compiled() -> list[dict]:
    charts: dict[tuple[str, str, str], dict[str, dict[str, str]]] = {}
    with (HERE / "leads" / "charts.csv").open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):  # a row is keyed by its text as kept: a number, or a heading on RunRepeat's walks
            charts.setdefault((r["source"], r["brand"], r["chart"]), {}).setdefault(r["row"], {})[r["column"]] = r["value"]
    out = []
    for (source, brand_raw, chart_name), rows in charts.items():
        brand = BRAND_NAMES.get(brand_raw.lower())
        if brand is None or source == "RunRepeat":
            continue  # RunRepeat's pages are cross-brand walks on a 1 cm grid, flagged by the worker
        columns = {c for row in rows.values() for c in row}
        kinds = {c: column_kind(c) for c in columns}
        title = chart_name.lower()
        if any(w in title for w in ("child", "kids", "babies", "junior")):
            continue  # the record's charts are the adults'; the kids' charts are a later pass
        line = "women" if "women" in title or "female" in title else ("men" if "men" in title or "male" in title else None)
        # The key: the title's line first, a bare US column read by the title, UK last.
        wanted = {"women": ("us_women", "us", "uk"), "men": ("us_men", "us", "uk"), None: ("us_men", "us_women", "us", "uk")}[line]
        key_col = next((c for k in wanted for c in sorted(columns) if kinds[c] == k), None)
        lengths = [c for c, k in kinds.items() if k in ("in", "mm", "cm", "len")]
        if key_col is None or not lengths:
            continue
        key = kinds[key_col]
        if key == "us":
            key = "us_women" if line == "women" else "us_men"
        if line is None:
            line = "women" if key == "us_women" else "men"
        chart = record_chart(brand, line)
        if chart is None:
            continue
        compared = equal = near = 0
        off: list[str] = []
        for row in rows.values():
            size = number(row.get(key_col))
            rec = row_at(chart, key, size) if size is not None else None
            if rec is None or rec.get("foot_mm") is None:
                continue
            for col in lengths:
                v = number(row.get(col))
                if v is None:
                    continue
                kind = kinds[col]
                if kind == "len":
                    kind = "mm" if v > 100 else ("cm" if v > 15 else "in")
                if kind == "in" and rec.get("foot_in") is not None:
                    # The brand's own inches where it prints a second grid (Dr. Martens, Converse).
                    diff_in = abs(v - float(rec["foot_in"]))
                    compared += 1
                    if diff_in <= 0.06:
                        equal += 1
                    elif diff_in <= HALF / 25.4:
                        near += 1
                    else:
                        off.append(f"{key.replace('_', ' ').replace('us', 'US')} {size:g}: {v:g} against {float(rec['foot_in']):.2f} in")
                    continue
                mm = v * {"in": 25.4, "cm": 10, "mm": 1}[kind]
                diff = abs(mm - float(rec["foot_mm"]))
                compared += 1
                if diff <= 1.5:
                    equal += 1
                elif diff <= HALF:
                    near += 1
                else:
                    off.append(f"{key.replace('_', ' ').replace('us', 'US')} {size:g}: {mm:.0f} against {float(rec['foot_mm']):.0f} mm")
        if compared:
            out.append(dict(source=source, brand=brand, chart=chart_name, key=key, compared=compared, equal=equal, near=near, off=off))
    return out


# --- the pages saved as text on 2026-10-21, their charts against the record ---------------------
def page_text(name: str) -> list[str]:
    return (HERE / "browser" / "pages" / name).read_text(encoding="utf-8").splitlines()


def numbers_in(line: str) -> list[float]:
    """Every number on a line, a mixed fraction read as one (36 2/3, 10 5/8), quotes and units dropped."""
    out = []
    for m in re.finditer(r"\d+(?:\.\d+)?(?:\s+\d+/\d+)?", line.replace('"', " ")):
        out.append(number(m.group()))
    return [v for v in out if v is not None]


def compare_cells(name: str, cells: list[tuple[float, dict]], chart: dict | None, key: str, cols: dict[str, tuple[str, str, float]]) -> dict:
    """cells: (size on the key, {column: value}) per row; cols as LIVE_CHECKS' maps."""
    compared = equal = near = 0
    off: list[str] = []
    for size, row in cells:
        rec = row_at(chart, key, size)
        if rec is None:
            continue
        for col, (rk, kind, factor) in cols.items():
            live, ours = row.get(col), rec.get(rk)
            if live is None or ours is None or isinstance(ours, list):
                continue
            compared += 1
            diff = abs(live * factor - float(ours))
            eq, nr = TOLERANCE[kind]
            if diff <= eq:
                equal += 1
            elif diff <= nr:
                near += 1
            else:
                unit = {"mm": " mm", "in": " in", "size": ""}[kind]
                off.append(f"{key.replace('_', ' ').replace('us', 'US')} {size:g} {col}: {live * factor:g} against {float(ours):g}{unit}")
    return dict(name=name, rows=len(cells), compared=compared, equal=equal, near=near, off=off)


def check_texts() -> list[dict]:
    out = []
    # New Balance, newbalance.com size guide: "Men's US | Women's US | cm | in | UK | EU", then the women's chart.
    men: list[tuple[float, dict]] = []
    women: list[tuple[float, dict]] = []
    section = None
    for line in page_text("newbalance-size-guide.txt"):
        if line.startswith("Men's US Size | Women's US Size"):
            section = "men"
            continue
        if line.startswith("Women's US Size | Men's US Size"):
            section = "women"
            continue
        if line.startswith("Kids US Size"):
            section = None
        if section and re.match(r"^\d", line):
            nums = numbers_in(line)
            if len(nums) < 6:
                continue
            row = {"cm": nums[2], "in": nums[3], "uk": nums[-2], "eu": nums[-1]}
            (men if section == "men" else women).append((nums[0], row))
    cols = {"cm": ("foot_mm", "mm", 10), "in": ("foot_in", "in", 1), "uk": ("uk", "size", 1), "eu": ("eu", "size", 1)}
    out.append(compare_cells("New Balance men, live text against the record", men, record_chart("New Balance", "men"), "us_men", cols))
    out.append(compare_cells("New Balance women, live text against the record", women, record_chart("New Balance", "women"), "us_women", cols))
    # Asics US, the men's chart: "US UK EU CM" rows.
    cells = []
    on = False
    for line in page_text("asics-us-aligned-size-charts.txt"):
        if line.strip() == "US UK EU CM":
            on = True
            continue
        if on and line.startswith("Men's Shoes Width"):
            break
        if on:
            nums = numbers_in(line)
            if len(nums) == 4:
                cells.append((nums[0], {"uk": nums[1], "eu": nums[2], "cm": nums[3]}))
    out.append(
        compare_cells(
            "Asics US men, live text against the record", cells, record_chart("Asics", "men"), "us_men",
            {"cm": ("foot_mm", "mm", 10), "uk": ("uk", "size", 1), "eu": ("eu", "size", 1)},
        )
    )
    # adidas, one line a scale, the columns aligned by position.
    scales: dict[str, list[float | None]] = {}
    for line in page_text("adidas-size-chart-men-shoes.txt"):
        for head, key in (("Heel-toe (INCH)", "in"), ("US - Men", "us_men"), ("US - Women", "us_women"), ("EU", "eu"), ("UK", "uk"), ("Heel-toe (cm)", "cm")):
            if line.startswith(head + " "):
                body = line[len(head):].replace(" cm", "")
                tokens = re.findall(r"\d+(?:\.\d+)?(?: \d/\d)?|--", body)
                scales[key] = [number(x) for x in tokens]
    n = min(len(v) for v in scales.values()) if scales else 0
    cells = [(scales["us_men"][i], {k: scales[k][i] for k in ("in", "eu", "uk", "cm")}) for i in range(n) if scales["us_men"][i] is not None]
    out.append(
        compare_cells(
            "adidas, live text against the record", cells, record_chart("adidas", "men"), "us_men",
            {"cm": ("foot_mm", "mm", 10), "in": ("foot_in", "in", 1), "eu": ("eu", "size", 1), "uk": ("uk", "size", 1)},
        )
    )
    return out


# --- the wearers' reports, a flag ---------------------------------------------------------------
def zappos() -> list[dict]:
    groups: dict[str, dict] = {}
    with (HERE / "leads" / "zappos_fit.csv").open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            brand = BRAND_NAMES.get(r["brand"].lower(), r["brand"])
            g = groups.setdefault(brand, dict(products=0, answered=0, true=0, larger=0, smaller=0))
            g["products"] += 1
            counts = {k: int(r[k] or 0) for k in ("true_to_size", "half_larger", "full_larger", "half_smaller", "full_smaller")}
            g["answered"] += sum(counts.values())
            g["true"] += counts["true_to_size"]
            g["larger"] += counts["half_larger"] + counts["full_larger"]
            g["smaller"] += counts["half_smaller"] + counts["full_smaller"]
    return [dict(brand=b, **g) for b, g in sorted(groups.items(), key=lambda kv: kv[0].lower())]


# --- the tables --------------------------------------------------------------------------------
def build() -> tuple[str, list[dict], list[dict]]:
    labs = load_labs()
    brands = {lab: by_brand(labs, lab) for lab in LABS}
    every_rt = by_brand(labs, "RTINGS", include_aside=True)
    packs = {lab: pack(brands[lab]) for lab in LABS}
    cal = calibration_brands()
    fam = {lab: {f: family_allowance(cal, brands[lab], f) for f in (ISO_FAMILY, ABOVE_FAMILY)} for lab in LABS}
    cand = candidates()
    blocks: list[str] = []
    feet_rows: list[dict] = []

    # Table 1: the labs, brand by brand.
    names = sorted({b for lab in LABS for b in brands[lab]}, key=str.lower)
    rows = []
    for b in names:
        cells = [b]
        for lab in LABS:
            s = brands[lab].get(b)
            if s:
                thin = " (thin)" if s["n"] < THIN else ""
                cells += [f"{s['n']}{thin}", fmt(s["median"]), f"{s['low']:g} to {s['high']:g}", signed(s["median"] - packs[lab])]
            else:
                cells += ["–", "–", "–", "–"]
        c = every_rt.get(b)
        cells.append(f"{c['n']}, {fmt(c['median'])}" if c else "–")
        rows.append(cells)
        feet_rows.append(dict(brand=b, **{f"{lab.lower()}_{k}": (brands[lab][b][k] if b in brands[lab] else None) for lab in LABS for k in ("n", "median", "low", "high")}))
    rows.append(["The pack (the brands’ medians’ median)", "", fmt(packs["RunRepeat"]), "", "", "", fmt(packs["RTINGS"]), "", "", ""])
    counted = {lab: sum(1 for r in labs if r["lab"] == lab and r["counted"]) for lab in LABS}
    aside_rr = [r for r in labs if r["lab"] == "RunRepeat" and not r["counted"]]
    aside_rt = sum(1 for r in labs if r["lab"] == "RTINGS" and not r["counted"])
    blocks.append(
        f"**Table 1, the labs at a US men’s 9, brand by brand.** Internal length in mm, each lab on its own, screened by the measured rule (a shoe counts at a stated size): RunRepeat’s caliper on the cut shoe, {counted['RunRepeat']} shoes counted and {len(aside_rr)} set aside ("
        + "; ".join(f"{r['brand']} {r['model']}, {r['reason']}" for r in aside_rr)
        + f"); RTINGS’ scanned footbed, {counted['RTINGS']} shoes counted, reviewed on its test bench 0.10 or later, which states the size, and {aside_rt} set aside, reviewed before it, where RTINGS says some were measured at a US 8 or 13; the last column is every RTINGS shoe, the set-aside ones included, for the eye. A brand with fewer than three shoes is thin. The offset is the brand’s median less the pack’s.\n\n"
        + md_table(
            ["Brand", "RunRepeat n", "median", "spread", "offset", "RTINGS n", "median", "spread", "offset", "RTINGS, every shoe: n, median"],
            rows,
        )
    )

    # Table 2: the calibration.
    rows = []
    for c in cal:
        cells = [c["brand"], fmt(c["foot"]), c["family"] + (" (under test)" if c["under_test"] else "")]
        for lab in LABS:
            s = brands[lab].get(c["brand"])
            if s:
                thin = " (thin)" if s["n"] < THIN else ""
                cells += [f"{s['n']}{thin}", fmt(s["median"]), signed(s["median"] - c["foot"])]
            else:
                cells += ["–", "–", "–"]
        rows.append(cells)
    for f in (ISO_FAMILY, ABOVE_FAMILY):
        cells = [f"The family’s allowance, {f}", "", ""]
        for lab in LABS:
            a, names_in = fam[lab][f]
            cells += [", ".join(names_in), "", signed(a)]
        rows.append(cells)
    blocks.append(
        f"**Table 2, the calibration.** The brands whose charts say their length is the foot’s, each with the foot its men’s or unisex chart gives a US men’s 9 (the charts’ record, shoe-sizes-2/brands.json), its family by that foot against ISO’s {ISO9:.1f} mm (within half a size, {HALF:.1f} mm, or a size above), and per lab the allowance, the median internal length less the chart’s foot. A family’s allowance is the median over its brands with three shoes or more, Asics set aside as the brand under test.\n\n"
        + md_table(["Brand", "chart’s foot at US 9", "family", "RunRepeat n", "median", "allowance", "RTINGS n", "median", "allowance"], rows)
    )

    # Table 3: the no-foot brands and Asics.
    rows = []
    for b in QUESTION:
        cd = cand[b]
        cells = [b, cd["what"], fmt(cd["foot"])]
        for lab in LABS:
            s = brands[lab].get(b)
            if s:
                iso_a, _ = fam[lab][ISO_FAMILY]
                abv_a, _ = fam[lab][ABOVE_FAMILY]
                cells += [f"{s['n']}, {fmt(s['median'])}", fmt(s["median"] - iso_a) if iso_a is not None else "–", fmt(s["median"] - abv_a) if abv_a is not None else "–"]
            else:
                cells += ["–", "–", "–"]
        cells.append(fmt(ISO9))
        rows.append(cells)
        if cd.get("alt"):
            lo, hi = cd["alt"]
            rows.append([b, cd["alt_what"], f"{lo:.1f} to {hi:.1f}", "", "", "", "", "", "", fmt(ISO9)])
    blocks.append(
        "**Table 3, the brands in question at a US men’s 9.** What the brand’s own page or rule gives for the foot, then per lab the brand’s shoes (n, median internal length) and the foot read through each family’s allowance, and ISO’s label. A reading is corroborated where it sits within half a size of a family’s foot.\n\n"
        + md_table(["Brand", "the brand’s page gives", "mm", "RunRepeat n, median", "foot by ISO’s grid", "foot by a size above", "RTINGS n, median", "foot by ISO’s grid", "foot by a size above", "ISO’s label"], rows)
    )

    # Table 4: Puma's column at every size.
    puma = any_chart("Puma", "us.puma.com", "men", "product")
    iso_rr = fam["RunRepeat"][ISO_FAMILY][0]
    rows = []
    for r in puma["rows"] if puma else []:
        size, product = r.get("us_men"), r.get("product_mm")
        if not isinstance(size, (int, float)) or product is None:
            continue
        label = foot_of_usm(float(size))
        less = float(product) - iso_rr if iso_rr is not None else None
        rows.append([f"{size:g}", fmt(float(product)), fmt(label), fmt(less), signed(less - label) if less is not None else "–"])
    blocks.append(
        f"**Table 4, Puma’s product lengths at every size** (us.puma.com, Product Measurements, men’s), beside ISO’s label for the size and the foot the length would give through the ISO family’s RunRepeat allowance ({fmt(iso_rr)} mm): the two agree at a 9 and part at the ends, since Puma’s column steps a centimetre a size against ISO’s {UK_STEP} mm.\n\n"
        + md_table(["US men’s", "Puma’s length", "ISO’s label", "length less the allowance", "difference"], rows)
    )

    # Table 5: the cross-checks.
    rows = []
    checks = [check_live(spec) for spec in LIVE_CHECKS] + check_texts()
    for c in checks:
        rows.append([c["name"], str(c["rows"]), str(c["compared"]), str(c["equal"]), str(c["near"]), str(len(c["off"])), "; ".join(c["off"][:4]) + (" …" if len(c["off"]) > 4 else "")])
    rows.append(["In all", str(sum(c["rows"] for c in checks)), str(sum(c["compared"] for c in checks)), str(sum(c["equal"] for c in checks)), str(sum(c["near"] for c in checks)), str(sum(len(c["off"]) for c in checks)), ""])
    blocks.append(
        "**Table 5, the live reads of 2026-10-21 against the record.** Each chart read in Sean’s Chrome (wave 1c and 1e, as cells or as the page’s saved text) or by worker A (Brooks UK, Reebok AU), cell by cell against the chart the product carries (the charts’ record of 2026-10-20), joined on the size the two share: equal (a length within 0.5 mm or 0.005 in, a size exact), near (within 1.5 mm, 0.1 in, or a third of a size), or off, the off cells listed.\n\n"
        + md_table(["Check", "rows", "cells", "equal", "near", "off", "the off cells"], rows)
    )

    # Table 6: the compiled charts.
    rows = []
    compiled = check_compiled()
    for c in compiled:
        rows.append([c["source"], c["brand"], c["chart"][:60] + ("…" if len(c["chart"]) > 60 else ""), str(c["compared"]), str(c["equal"]), str(c["near"]), str(len(c["off"])), "; ".join(c["off"][:3]) + (" …" if len(c["off"]) > 3 else "")])
    rows.append(["In all", "", f"{len(compiled)} charts", str(sum(c["compared"] for c in compiled)), str(sum(c["equal"] for c in compiled)), str(sum(c["near"] for c in compiled)), str(sum(len(c["off"]) for c in compiled)), ""])
    blocks.append(
        "**Table 6, the compiled charts against the record** (Sean’s call, source 3: a cross-check and never a source). Every third-party chart worker C kept that names one of the twenty brands and prints a US or UK size beside a length, its length against the record’s foot at the same size: equal within 1.5 mm, near within half a size, off beyond it. RunRepeat’s own pages are left out, cross-brand walks on a 1 cm grid and flagged so by the worker.\n\n"
        + md_table(["Source", "Brand", "Chart", "cells", "equal", "near", "off", "the off cells"], rows)
    )

    # Table 7: the wearers' reports.
    rows = []
    for z in zappos():
        a = z["answered"]
        rows.append([z["brand"], str(z["products"]), str(a), f"{100 * z['true'] / a:.0f} %" if a else "–", f"{100 * z['larger'] / a:.0f} %" if a else "–", f"{100 * z['smaller'] / a:.0f} %" if a else "–"])
    blocks.append(
        "**Table 7, the wearers’ reports, a flag** (Sean’s call, source 4: never a figure). Zappos’ customer fit counts per product, two or three products a brand, summed by the site’s own answers (“Felt true to size”, “Felt a half size larger than marked”, and so on): the share who felt it true to size, larger than marked (it runs large), or smaller than marked (it runs small).\n\n"
        + md_table(["Brand", "products", "wearers answering", "true to size", "felt larger", "felt smaller"], rows)
    )

    return "\n\n".join(blocks), labs, feet_rows


def write_doc(block: str) -> None:
    text = DOC.read_text(encoding="utf-8")
    a, b = text.find(START), text.find(END)
    if a < 0 or b < 0 or b < a:
        print(f"markers missing in {DOC.name}: {START} … {END}")
        sys.exit(1)
    new = text[: a + len(START)] + "\n\n" + block + "\n\n" + text[b:]
    DOC.write_text(new, encoding="utf-8", newline="\n")


def main() -> None:
    block, labs, feet = build()
    if "--write" in sys.argv:
        write_doc(block)
        with (HERE / "labs.csv").open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["lab", "brand", "model", "size", "value", "counted", "reason", "flag", "url"], lineterminator="\n")
            w.writeheader()
            w.writerows(labs)
        with (HERE / "feet.csv").open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(feet[0].keys()), lineterminator="\n")
            w.writeheader()
            w.writerows(feet)
        print(f"wrote {DOC.name} §9 between markers, labs.csv ({len(labs)} rows), feet.csv ({len(feet)} rows)")
    else:
        print(block)


if __name__ == "__main__":
    main()
