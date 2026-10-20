"""The brands' charts as one data file (docs/research/shoe-sizes-2.md, wave 3; docs/RESEARCH.md §4).

Reads every chart kept at wave 1 and checked at wave 2, by its values and never by a row's index
(docs/LEARNINGS.md, 2026-10-20): the workers' cells (brands-a/charts.csv, brands-b/charts.csv),
Sean's manual capture of the seven brands the fetcher could not reach (manual/brand-charts.json),
and the Dr. Martens tables he pasted (manual/sources/dr-martens/pasted-text.txt), which replace the
worker's fetcher-read US page. Brings them to one shape, computes every adult chart's deltas against
ISO/TS 19407's rule as the engine holds it (packages/core/src/units/shoe-size.ts, ADR 0027), and
writes, beside itself:

  brands.json   every chart, brand by brand: its line, its length's basis, its rows, the product's
                recommended charts flagged (the research doc's §5, decision 1)
  deltas.csv    one row per adult row: the brand's cells beside ISO's, the deltas in sizes and mm
  deltas.md     the summary table the research doc's §9 carries between its markers

Run: python -I brands.py            prints the summary
     python -I brands.py --write    writes the three files too

Nothing downstream is edited by hand: a correction goes into the keepers (a worker's charts.csv, the
manual JSON, the pasted text) and this is re-run; the doc's table is pasted from deltas.md.

The cells' notations, each read as the brand prints it: a comma decimal (21,5), a mixed fraction
(43 1/3, 9 11/16), a vulgar or superscript fraction (49½, 11¹⁄₁₆), a half marked H (Asics SG 9H), a
zero-padded size (Clarks AU 010), a unit on the number (290mm), a range (4 - 4 1/2, 43-44, 221 to
225 mm), a pair of US or UK sizes in one cell (Crocs M10 | W12, Salomon 9.5 M / 10.5 W), a kids'
label (10.5C, 1Y, K5, 10.5-L, 8.5(Kid)), and a blank (-, --, —, n/a). A range keeps its ends and its
text, its middle standing in for the deltas; a pair splits into the men's and the women's sizes.
"""

import csv
import json
import re
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATE = "2026-10-20"

# --- ISO/TS 19407 over the foot's length in mm, as the engine holds it (ADR 0027) --------------
UK_STEP = 8.47  # a UK or US size, the barleycorn as the standard prints it
EUR_STEP = 6.67  # a European size, the Paris point as the standard prints it


def iso_eu(foot):
    return foot / EUR_STEP + 2


def iso_uk(foot):
    return foot / UK_STEP - 23


def iso_usm(foot):
    return iso_uk(foot) + 1


def iso_usw(foot):
    return iso_uk(foot) + 2


def foot_of_usm(size):
    return (size + 22) * UK_STEP


def foot_of_usw(size):
    return (size + 21) * UK_STEP


def foot_of_uk(size):
    return (size + 23) * UK_STEP


def half(x):
    return round(x * 2) / 2


# --- cells ---------------------------------------------------------------------------------------
NONE = {"", "-", "--", "—", "–", "n/a", "na", "none", "null", "N/A"}
VULGAR = {"½": " 1/2", "¼": " 1/4", "¾": " 3/4", "⅓": " 1/3", "⅔": " 2/3", "⅛": " 1/8", "⅜": " 3/8", "⅝": " 5/8", "⅞": " 7/8"}
DIGITS = str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉", "01234567890123456789")
NUMBER = r"\d+(?:[.,]\d+)?(?: \d+/\d+)?"


def clean(text):
    """The printed cell as plain text: superscript and vulgar fractions as 'n/d', one space between parts."""
    t = str(text).strip().strip('"').replace("″", '"')
    t = re.sub(r"(\d)([⁰¹²³⁴⁵⁶⁷⁸⁹])", r"\1 \2", t)  # 11¹⁄₁₆ -> 11 ¹⁄₁₆
    t = t.replace("⁄", "/").translate(DIGITS)
    for k, v in VULGAR.items():
        t = t.replace(k, v)
    return re.sub(r"\s+", " ", t).strip()


def number(text):
    """One number from a cell, None for a blank or a word: 10, 10.5, 21,5, 49 1/2, 43 1/3, 010, 9H, 290mm, 9.35"."""
    if text is None:
        return None
    t = clean(text)
    if t in NONE or t.lower() in NONE:
        return None
    m = re.fullmatch(r"(\d+)H", t)
    if m:
        return int(m.group(1)) + 0.5
    m = re.fullmatch(r"(\d+) (\d+)/(\d+)", t)
    if m:
        return int(m.group(1)) + int(m.group(2)) / int(m.group(3))
    m = re.fullmatch(r"(\d+)/(\d+)", t)
    if m:
        return int(m.group(1)) / int(m.group(2))
    m = re.fullmatch(r"(\d+)[.,](\d+) ?(?:mm|cm|in|\")?", t)
    if m:
        return float(f"{m.group(1)}.{m.group(2)}")
    m = re.fullmatch(r"(\d+) ?(?:mm|cm|in|\")?", t)
    if m:
        return float(m.group(1))
    return None


def span(text):
    """A range's two ends, None where the cell is not one: 4 - 4 1/2, 6-6.5, 43-44, 3.5 - 5.0."""
    t = clean(text)
    m = re.fullmatch(rf"({NUMBER}) ?- ?({NUMBER})", t)
    if not m:
        return None
    low, high = number(m.group(1)), number(m.group(2))
    return (low, high) if low is not None and high is not None else None


def pair(text):
    """A men's and a women's size printed in one cell: M10 | W12, 4M / 5 W, 9.5 M / 10.5 W, 7 M, W1."""
    t = clean(text)
    if not re.search(r"[MW]", t) or re.search(r"[A-LN-VX-Za-z]", t.replace("M", "").replace("W", "")):
        return None
    men = re.search(r"M ?(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?) ?M\b", t)
    women = re.search(r"W ?(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?) ?W\b", t)
    m = number(men.group(1) or men.group(2)) if men else None
    w = number(women.group(1) or women.group(2)) if women else None
    return (m, w) if m is not None or w is not None else None


def labelled(text):
    """A kids' size with its letters dropped: 10.5C -> 10.5, 1Y -> 1, K5 -> 5, 10.5-L -> 10.5, 8.5(Kid) -> 8.5, 13.5k -> 13.5."""
    t = clean(text)
    if t in NONE or t.lower() in NONE:
        return None
    m = re.search(r"\d+(?:[.,]\d+)?", t)
    return number(m.group(0)) if m else None


# --- headings --------------------------------------------------------------------------------------
def key_of(heading, line, chart):
    """A chart's own column heading as one of the data file's keys, None for a column kept as text only."""
    t = re.sub(r"\s+", " ", heading.replace("—", " - ").replace("’", "'")).strip().lower()
    if "standard eu" in t:
        return "eu_standard"
    if re.match(r"^u\.?s\.?( - | |-)?(men|m\b)", t):
        return "us_men"
    if re.match(r"^u\.?s\.?( - | |-)?(women|ladies|w\b)", t):
        return "us_women"
    if re.match(r"^u\.?s\.?( - | |-)?(kids|youth|children|toddler|preschool|grade school|boy)", t):
        return "us_kids"
    if t in ("us", "usa", "u.s. size", "us size", "canada/us"):
        return {"men": "us_men", "women": "us_women", "kids": "us_kids"}.get(line, "us_pair")
    if t == "uk men":
        return "uk_men"
    if t == "uk women":
        return "uk_women"
    if t in ("uk", "uk size", "clarks uk size"):
        return "uk"
    if t in ("eu", "euro", "eur", "fr", "de", "europe unisex", "clarks eu size", "birkenstock size"):
        return "eu"
    if t in ("it", "es"):
        return None  # Puma's EU pages repeat one European number under DE, FR, IT, ES
    if t in ("cm / jp", "cm/jp", "jp", "japan"):
        return "jp"
    if t == "japan men (cm)":
        return "jp_men"
    if t == "japan women (cm)":
        return "jp_women"
    if t in ("cm", "length cm", "foot length (cm)", "heel to toe length (centimeters)", "foot length"):
        return "foot_cm"
    if t in ("in", "inches", "foot length (in)", "foot length (in.)", "foot length (inch)", "heel-toe measurement (in)", "heel-toe measurement", "heel-toe measurements", "heel to toe length (inches)"):
        return "foot_in"
    if t in ("mm", "foot length (millimetres)(mms)", "heel to toe length (mm)"):
        return "foot_mm"
    if t == "length from":
        return "foot_from_mm"
    if t == "length to":
        return "foot_to_mm"
    if t == "size":
        c = chart.lower()
        return "uk" if "uk sizes" in c else "eu" if "eu sizes" in c else "label"
    if t == "korea":
        return "kr"
    if t == "au":
        return "au"
    if t == "foot width":
        return "width_cm"
    if t in ("age group", "age (months)", "age"):
        return "age"
    return None


def classify(chart):
    """A chart's line (men, women, unisex, kids, other) and kind (main, wide, pro, boots, sandals, socks, chuck, standard, all-gender, template, ranges, special) from its name."""
    n = chart.lower().replace("’", "'")
    kind = "main"
    if "sock" in n:
        return "other", "socks"
    if "sandal" in n:
        return "men", "sandals"
    if "boot" in n:
        kind = "boots"
    if n.startswith("pro_") or "timberland pro" in n:
        kind = "pro"
    if "wide" in n:
        kind = "wide"
    if "chuck taylor" in n:
        kind = "chuck"
    if "standard sneakers" in n:
        kind = "standard"
    if "special" in n:
        kind = "special"
    if "all gender" in n or "all_gender" in n or "all-gender" in n:
        return "unisex", "all-gender"
    if "template" in n:
        return "unisex", "template"
    if "sizes and measurements" in n:
        kind = "ranges"
    if re.search(r"kid|toddler|infant|baby|babies|youth|junior|boy|grade school|preschool|child", n):
        return "kids", kind
    if re.search(r"women'?s? and men|men'?s? and women", n):
        return "unisex", kind
    if "women" in n or "ladies" in n:
        return "women", kind
    if re.search(r"\bmen", n):
        return "men", kind
    return "unisex", kind


# --- what each brand says its length is (docs/research/shoe-sizes-2.md §7 and §8) -----------------
BASIS = {
    "Nike": ("foot", "Foot Length in cm and inches, the foot's; the CM/JP column is the box's label, which the page says differs from the foot length"),
    "Under Armour": ("uncertain", "the page says it measures the true foot heel to toe in centimetres, but never names the column, and its inch and cm columns disagree by 3.9 to 18.8 mm"),
    "Reebok": ("foot", "Heel-Toe Measurement in inches, heel to longest toe"),
    "Clarks": ("foot", "Foot Length in mm, a ruler on the foot; the page says it does not correlate with a Clarks foot gauge"),
    "Birkenstock": ("foot", "the foot on its printable template, mm; its GB and EU pages give a range per size"),
    "Crocs": ("foot", "Heel to Toe Length; the cm field is what the page shows, the mm field Korea's own and a centimetre apart on the first rows"),
    "Salomon": ("foot", "Foot length in cm and inches, the foot in socks"),
    "Dr. Martens": ("foot", "Foot length under the page's cm or in toggle, heels against a wall, the longest toe marked; the inch toggle a second grid, not a conversion"),
    "Puma": ("unstated", "a Length cm column the page never explains"),
    "Asics": ("unstated", "a CM column the page never explains"),
    "Converse": ("unstated", "cm and in columns the page never labels foot or shoe"),
    "Skechers": ("none", "no length on any chart"),
    "Brooks": ("label", "Japan (cm) columns, size labels, no measured length"),
    "adidas": ("foot", "heel-to-toe foot length in inches and cm"),
    "New Balance": ("foot", "heel to longest toe, cm and inches, with ball widths"),
    "Vans": ("foot", "heel to longest toe, inches and cm; its JP column equals the cm"),
    "UGG": ("foot", "heel to longest toe in inches; its Japan and Mexico columns are cm labels"),
    "HOKA": ("foot", "the foot traced, middle of the heel to the longest toe, on a sixth-of-an-inch grid; its Japan column is the Mondopoint label"),
    "Timberland": ("foot", "heel against a wall to the longest toe, inches and cm"),
    "On": ("label", "adults: no length, the Japan and Mexico columns the Mondopoint label; kids: a measured length that equals the label"),
}


def basis_of(brand, site, chart, line, kind, keys):
    if brand == "HOKA" and kind == "all-gender":
        return "misaligned", "22 size columns over 21 left-aligned lengths, the men's table's shifted a size: only its size rows count"
    if brand == "UGG" and "pdf" in chart:
        return "label", "the kids PDF heads its cm column (CM) JAPAN / MEXICO, a size label"
    if brand == "On" and line == "kids":
        return "foot", "a measured foot length in cm and inches, on a sixth-of-an-inch grid, equal to the Japan label"
    used = set(keys.values())
    if brand == "Clarks" and "clarks.com.au" in site:
        return ("unstated", "a CM column the AU page never explains") if "foot_cm" in used else ("none", "no length")
    if not used & {"foot_cm", "foot_in", "foot_mm", "foot_from_mm"}:
        return ("label", "size labels only (Japan cm)") if used & {"jp", "jp_men", "jp_women"} else ("none", "no length")
    return BASIS[brand]


# --- the product's recommended charts (decision 1 of the doc's §5): brand -> (site part, chart) ----
RECOMMENDED = {
    ("adidas", "manual", "adult"),
    ("Asics", "asics.com/nz", "Men's/Unisex Shoe Sizes"),
    ("Asics", "asics.com/nz", "Women's Shoe Sizes"),
    ("Birkenstock", "template", "PRINTABLE SIZING TEMPLATE A4: size table"),
    ("Brooks", "support.brooksrunning.com.au", "Size Conversion Chart"),
    ("Clarks", "composed", "Men's, composed"),
    ("Clarks", "composed", "Women's, composed"),
    ("Converse", "converse.ca", "Men - Chuck Taylor All Star"),
    ("Converse", "converse.ca", "Women - Chuck Taylor All Star"),
    ("Crocs", "default.json", "Adults"),
    ("Dr. Martens", "pasted", "Women's and Men's, cm toggle"),
    ("HOKA", "manual", "men"),
    ("HOKA", "manual", "women"),
    ("New Balance", "manual", "men"),
    ("New Balance", "manual", "women"),
    ("Nike", "nike.com/us", "Men's Footwear"),
    ("Nike", "nike.com/us", "Women's Footwear"),
    ("On", "manual", "men"),
    ("On", "manual", "women"),
    ("Puma", "au.puma.com", "Men's shoes"),
    ("Puma", "au.puma.com", "Women's shoes"),
    ("Reebok", "reebok.com", "Unisex Shoe Size Guide"),
    ("Salomon", "salomon.com/en-us", "Unisex Footwear"),
    ("Skechers", "skechers.com/us", "Men's"),
    ("Skechers", "skechers.com/us", "Women's"),
    ("Timberland", "manual", "men"),
    ("Timberland", "manual", "women"),
    ("UGG", "manual", "women"),
    ("UGG", "manual", "men"),
    ("Under Armour", "underarmour.com/en-us", "Men's Shoes Size Chart"),
    ("Under Armour", "underarmour.com/en-us", "Women's Shoes Size Chart"),
    ("Vans", "manual", "adult"),
}

MANUAL_NAMES = {"adidas": "adidas", "new_balance": "New Balance", "vans": "Vans", "ugg": "UGG", "hoka": "HOKA", "timberland": "Timberland", "on": "On"}


# --- a chart ---------------------------------------------------------------------------------------
def make_chart(brand, site, chart, columns, keys, texts, source, read, extra_text_keys=()):
    """One chart from its rows' texts: `texts` a list of {heading: printed text}; `keys` heading -> key."""
    line, kind = classify(chart)
    rows = []
    for cells in texts:
        row = {"text": {}}
        for heading, text in cells.items():
            if text is None:
                continue
            printed = str(text).strip()
            if printed and printed.lower() != heading.lower():
                row["text"][heading] = printed
            key = keys.get(heading)
            if key is None or not printed or printed.lower() == heading.lower():
                continue
            read_cell(row, key, printed, line)
        numeric = {k: v for k, v in row.items() if k != "text" and v is not None}
        if numeric:
            rows.append(row)
    basis, words = basis_of(brand, site, chart, line, kind, keys)
    return {
        "brand": brand,
        "site": site,
        "chart": chart,
        "line": line,
        "kind": kind,
        "length": {"basis": basis, "words": words},
        "columns": columns,
        "source": source,
        "read": read,
        "rows": rows,
    }


def read_cell(row, key, printed, line):
    if key in ("us_pair", "uk", "us_men", "us_women", "uk_men", "uk_women"):
        p = pair(printed)
        if p is not None:
            m, w = p
            base = "us" if key.startswith("us") else "uk"
            if m is not None:
                row[f"{base}_men"] = m
            if w is not None:
                row[f"{base}_women"] = w
            return
        if key == "us_pair":
            key = "us_men"
    if key == "label":
        return
    value = number(printed)
    if value is None:
        ends = span(printed)
        if ends is not None:
            row[f"{key}_low"], row[f"{key}_high"] = ends
            value = (ends[0] + ends[1]) / 2
        elif key == "us_kids" or line == "kids" or re.fullmatch(r"\d.*", clean(printed)):
            value = labelled(printed)
    if value is not None:
        row[key] = value


def finish(chart):
    """The foot in mm per row from the chart's length columns, and ISO's sizes beside the brand's."""
    for row in chart["rows"]:
        if row.get("foot_from_mm") is not None and row.get("foot_to_mm") is not None:
            row["foot_mm"] = (row["foot_from_mm"] + row["foot_to_mm"]) / 2
        if chart["brand"] == "Crocs" and row.get("foot_mm") is not None and row.get("foot_cm") is not None:
            row["foot_mm_korea"] = row.pop("foot_mm")  # the mm field is Korea's own and never displayed elsewhere (§8)
        if row.get("foot_mm") is None and row.get("foot_cm") is not None:
            row["foot_mm"] = round(row["foot_cm"] * 10, 2)
        if row.get("foot_in") is not None:
            row["foot_in_mm"] = round(row["foot_in"] * 25.4, 2)
            if row.get("foot_mm") is None:
                row["foot_mm"] = row["foot_in_mm"]
                row["foot_from_inches"] = True
        if row.get("uk") is None and row.get("uk_men") is not None:
            row["uk"] = row["uk_men"]
            row["uk_from_men"] = True
    return chart


# --- sources -------------------------------------------------------------------------------------------
def load_workers():
    charts = []
    for worker in ("brands-a", "brands-b"):
        groups = {}
        with (HERE / worker / "charts.csv").open(encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                g = groups.setdefault((r["brand"], r["site"], r["chart"]), {"rows": {}, "columns": [], "url": r["url"], "date": r["date_read"], "tool": r["tool"], "notes": set()})
                g["rows"].setdefault(int(r["row"]), {})[r["column"]] = r["value"]
                if r["column"] not in g["columns"]:
                    g["columns"].append(r["column"])
                if r["notes"]:
                    g["notes"].add(r["notes"])
        for (brand, site, chart), g in groups.items():
            if brand == "Dr. Martens" and site == "drmartens.com/us" and chart == "Women's and Men's":
                continue  # superseded by Sean's pasted text (the doc's §8)
            line, _ = classify(chart)
            keys = {h: key_of(h, line, chart) for h in g["columns"]}
            texts = [g["rows"][i] for i in sorted(g["rows"])]
            read = f"worker {'A' if worker == 'brands-a' else 'B'}, {g['date']}, {g['tool']}" + (f"; notes: {' | '.join(sorted(g['notes']))}" if g["notes"] else "")
            charts.append(finish(make_chart(brand, site, chart, g["columns"], keys, texts, g["url"], read)))
    return charts


MANUAL_KEYS = {
    "us_men": "us_men", "us_women": "us_women", "us_kids": "us_kids", "us_youth": "us_kids", "us_numeric": "us_numeric",
    "uk": "uk", "eu": "eu", "jp": "jp", "mx": "mx", "cn": "cn", "br": "br", "au": "au",
    "heel_toe_cm": "foot_cm", "heel_toe_in": "foot_in", "heel_toe_mm": "foot_mm", "ball_width_in": "width_in",
}


def load_manual():
    data = json.loads((HERE / "manual" / "brand-charts.json").read_text(encoding="utf-8"))
    charts = []
    for key, b in data["brands"].items():
        brand = MANUAL_NAMES[key]
        for name, table in b["charts"].items():
            columns = [c for c, v in table.items() if isinstance(v, list)]
            count = table.get("columns") or max(len(table[c]) for c in columns)
            line, kind = classify(name)
            texts = []
            for i in range(count):
                cells = {}
                for c in columns:
                    v = table[c][i] if i < len(table[c]) else None
                    cells[c] = "" if v is None else str(v)
                texts.append(cells)
            keys = {}
            for c in columns:
                k = MANUAL_KEYS.get(c)
                if k == "us_numeric":
                    k = {"men": "us_men", "women": "us_women", "kids": "us_kids"}.get(line, "us_men")
                if c == "us_label" or c.endswith("_label") or c in ("age", "group", "size", "uk_wide_chart_as_published") or c.startswith("w_"):
                    k = None
                keys[c] = k
            chart = make_chart(brand, "manual", name, columns, keys, texts, b["source"], f"Sean with Claude chat, {DATE}; sources in manual/sources/{key.replace('_', '-')}/")
            chart["measurement"] = b.get("measurement", {})
            charts.append(finish(chart))
    return charts


def load_dr_martens():
    text = (HERE / "manual" / "sources" / "dr-martens" / "pasted-text.txt").read_text(encoding="utf-8")
    tables = {}
    for block in re.split(r"^## ", text, flags=re.M)[1:]:
        lines = [ln for ln in block.splitlines() if ln.strip()]
        title = lines[0].strip()
        rows = [ln.split("\t") for ln in lines[1:] if "\t" in ln]
        if rows:
            tables[title] = (rows[0], rows[1:])
    charts = []
    source = "https://www.drmartens.com/us/en/about/size-guide"
    read = f"Sean's browser, {DATE}: the page text highlighted and copied, with four screenshots (manual/sources/dr-martens/)"
    cm_title = next(t for t in tables if "cm toggle" in t)
    in_title = next(t for t in tables if "in toggle" in t)
    headers, cm_rows = tables[cm_title]
    _, in_rows = tables[in_title]
    inches = {(r[2], r[3]): r for r in in_rows}  # by UK and EU
    columns = ["Foot length (cm)", "Foot length (in)", "Foot width (cm)", "Foot width (in)", "UK", "EU", "US Men's", "US Women's"]
    texts = []
    for r in cm_rows:
        i = inches[(r[2], r[3])]
        texts.append({"Foot length (cm)": r[0], "Foot length (in)": i[0], "Foot width (cm)": r[1], "Foot width (in)": i[1], "UK": r[2], "EU": r[3], "US Men's": r[4], "US Women's": r[5]})
    keys = {"Foot length (cm)": "foot_cm", "Foot length (in)": "foot_in", "Foot width (cm)": "width_cm", "Foot width (in)": None, "UK": "uk", "EU": "eu", "US Men's": "us_men", "US Women's": "us_women"}
    charts.append(finish(make_chart("Dr. Martens", "pasted", "Women's and Men's, cm toggle", columns, keys, texts, source, read + "; the inch toggle's values joined on UK and EU")))
    kids_title = next(t for t in tables if "Kid" in t)
    headers, rows = tables[kids_title]
    texts = [dict(zip(headers, r)) for r in rows]
    keys = {h: key_of(h, "kids", kids_title) for h in headers}
    charts.append(finish(make_chart("Dr. Martens", "pasted", "Kid's Sizing", headers, keys, texts, source, read)))
    return charts


def compose(brand, chart_name, parts, on, note):
    """One chart from a brand's pages that split its columns, joined on a column the pages share."""
    merged = {}
    order = []
    for part in parts:
        for row in part["rows"]:
            k = row.get(on)
            if k is None:
                continue
            if k not in merged:
                merged[k] = {"text": {}}
                order.append(k)
            for key, value in row.items():
                if key == "text":
                    for h, t in value.items():
                        merged[k]["text"][f"{part['site']}: {h}"] = t
                elif key in ("foot_in_mm", "foot_from_inches", "uk_from_men", "disagree") or (key == "foot_mm" and row.get("foot_from_inches")):
                    continue  # derived at finish, from the parts' own columns
                elif merged[k].get(key) is None:
                    merged[k][key] = value
                elif isinstance(value, (int, float)) and abs(merged[k][key] - value) > 1e-9:
                    merged[k].setdefault("disagree", []).append(f"{key}: {merged[k][key]} against {part['site']}'s {value}")
    rows = [merged[k] for k in sorted(order)]
    line, kind = classify(chart_name)
    return {
        "brand": brand,
        "site": "composed",
        "chart": chart_name,
        "line": line,
        "kind": "composed",
        "length": parts[0]["length"],
        "columns": sorted({c for p in parts for c in p["columns"]}),
        "source": [f"{p['site']}: {p['chart']} ({p['source']})" for p in parts],
        "read": note,
        "rows": rows,
    }


def find(charts, brand, site_part, chart):
    for c in charts:
        if c["brand"] == brand and site_part in c["site"] and c["chart"] == chart:
            return c
    raise KeyError((brand, site_part, chart))


def composed(charts):
    out = []
    gb_men = find(charts, "Clarks", "clarks.com/en-gb", "Mens Clarks Shoe Sizes")
    gb_women = find(charts, "Clarks", "clarks.com/en-gb", "Womens Clarks Shoe Sizes")
    us_men = find(charts, "Clarks", "clarks.com/en-us", "Men's Shoe Size Chart")
    us_women = find(charts, "Clarks", "clarks.com/en-us", "Women's Shoe Size Chart (US & UK)")
    out.append(compose("Clarks", "Men's, composed", [gb_men, us_men], "uk", "the GB page's UK, Clarks EU, standard EU, and mm joined with the US page's US sizes on the UK size they share; the US page's inches kept as text"))
    out.append(compose("Clarks", "Women's, composed", [gb_women, us_women], "uk", "the GB page's UK, Clarks EU, standard EU, and mm joined with the US page's US sizes on the UK size they share; the US page's inches kept as text"))
    return [finish(c) for c in out]


# --- deltas --------------------------------------------------------------------------------------------
def delta_row(chart, row):
    """The brand's cells beside ISO's for one adult row: by the foot (where the chart has one) and by the US size."""
    d = {}
    f = row.get("foot_mm")
    usm, usw, uk, eu = row.get("us_men"), row.get("us_women"), row.get("uk"), row.get("eu")
    if f is not None:
        d["iso_eu"], d["iso_uk"], d["iso_usm"], d["iso_usw"] = iso_eu(f), iso_uk(f), iso_usm(f), iso_usw(f)
        if eu is not None:
            d["d_eu"] = eu - d["iso_eu"]
        if uk is not None:
            d["d_uk"] = uk - d["iso_uk"]
        if usm is not None:
            d["d_usm"] = usm - d["iso_usm"]
        if usw is not None:
            d["d_usw"] = usw - d["iso_usw"]
        if row.get("foot_in_mm") is not None and not row.get("foot_from_inches"):
            d["in_minus_cm_mm"] = row["foot_in_mm"] - f
    if usm is not None:
        iso_f = foot_of_usm(usm)
        if eu is not None:
            d["o_eu_m"] = eu - iso_eu(iso_f)
        if uk is not None:
            d["o_uk_m"] = uk - (usm - 1)
        if f is not None:
            d["o_foot_m"] = f - iso_f
    if usw is not None:
        iso_f = foot_of_usw(usw)
        if eu is not None:
            d["o_eu_w"] = eu - iso_eu(iso_f)
        if uk is not None:
            d["o_uk_w"] = uk - (usw - 2)
        if f is not None:
            d["o_foot_w"] = f - iso_f
    if usm is not None and usw is not None:
        d["w_minus_m"] = usw - usm
    return d


def adult(chart):
    return chart["line"] in ("men", "women", "unisex") and chart["kind"] in ("main", "composed", "template", "chuck", "wide", "all-gender", "pro", "special", "standard", "ranges")


def stat(values, places=1):
    vals = [v for v in values if v is not None]
    if not vals:
        return "—"
    lo, hi, mean = min(vals), max(vals), statistics.mean(vals)
    if abs(hi - lo) < 0.05:
        return signed(mean, places)
    return f"{signed(lo, places)} to {signed(hi, places)} ({signed(mean, places)})"


def signed(x, places=1):
    s = f"{abs(x):.{places}f}"
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    if abs(x) < 0.5 * 10 ** -places:
        return "0"
    return ("+" if x > 0 else "−") + s


def plain(x, places=1):
    if x is None:
        return "—"
    s = f"{x:.{places}f}"
    return s.rstrip("0").rstrip(".") if "." in s else s


def grid(chart):
    """The chart's foot step per half size in mm, the slope across its rows in the common range (Reebok alternates 0.1 and 0.2 in, so a median would mislead): 4.2 is ISO's barleycorn, 5 a centimetre grid."""
    rows = [r for r in chart["rows"] if r.get("foot_mm") is not None and common(r)]
    for key in ("uk", "us_men", "us_women", "eu"):
        pts = sorted({(r[key], r["foot_mm"]) for r in rows if r.get(key) is not None})
        if len(pts) >= 3 and pts[-1][0] > pts[0][0]:
            per_size = (pts[-1][1] - pts[0][1]) / (pts[-1][0] - pts[0][0])
            return per_size * (0.5 if key != "eu" else 0.75)  # a European size is three quarters of a UK one, so to the half UK size
    return None


def at_size(chart, key, size):
    for r in chart["rows"]:
        if r.get(key) == size:
            return r
    return None


def common(row):
    """A row in the range most adults buy in, where the charts are compared: US men's 6 to 13, US women's 5 to 11, UK 4 to 12, EU 36 to 47."""
    return any(
        row.get(key) is not None and lo <= row[key] <= hi
        for key, lo, hi in (("us_men", 6, 13), ("us_women", 5, 11), ("uk", 4, 12), ("eu", 36, 47))
    )


def label_of(chart):
    site = chart["site"]
    if site == "composed":
        return chart["chart"]
    if site == "manual":
        return f"{chart['chart']}, Sean's capture"
    if site == "pasted":
        return f"{chart['chart']}, Sean's pasted text"
    return f"{chart['chart']} ({site})"


def summarize(chart):
    rows = chart["rows"]
    deltas = [delta_row(chart, r) for r in rows if common(r)]
    line = chart["line"]
    basis = chart["length"]["basis"]
    has_foot = any(r.get("foot_mm") is not None for r in rows)
    women = line == "women"
    ref = at_size(chart, "us_women", 8) if women else at_size(chart, "us_men", 10)
    ref_text = "—"
    if ref is not None and ref.get("foot_mm") is not None:
        iso_f = foot_of_usw(8) if women else foot_of_usm(10)
        ref_text = f"{plain(ref['foot_mm'], 0)} ({signed(ref['foot_mm'] - iso_f, 0)})"
    o_eu = [d.get("o_eu_w" if women else "o_eu_m") for d in deltas]
    o_uk = [d.get("o_uk_w" if women else "o_uk_m") for d in deltas]
    d_us = [d.get("d_usw" if women else "d_usm") for d in deltas]
    w_m = sorted({d["w_minus_m"] for d in deltas if "w_minus_m" in d})
    g = grid(chart) if has_foot else None
    return {
        "brand": chart["brand"],
        "chart": label_of(chart),
        "rows": len(rows),
        "length": {"foot": "the foot's", "unstated": "unstated", "uncertain": "uncertain", "label": "labels only", "none": "none", "misaligned": "misaligned"}[basis],
        "grid": plain(g, 1) if g is not None else "—",
        "ref": ref_text,
        "o_eu": stat(o_eu) if any(v is not None for v in o_eu) else "—",
        "o_uk": stat(o_uk) if any(v is not None for v in o_uk) else "—",
        "d_us": stat(d_us) if basis in ("foot", "unstated", "uncertain") and any(v is not None for v in d_us) else "—",
        "w_m": ", ".join(plain(v) for v in w_m) if w_m else "—",
        "product": chart.get("product", False),
    }


BRAND_ORDER = ["adidas", "Asics", "Birkenstock", "Brooks", "Clarks", "Converse", "Crocs", "Dr. Martens", "HOKA", "New Balance", "Nike", "On", "Puma", "Reebok", "Salomon", "Skechers", "Timberland", "UGG", "Under Armour", "Vans"]
LINE_ORDER = {"unisex": 0, "men": 1, "women": 2}


HEAD = "| Brand | Chart | Rows | Length | mm a half size | Foot at US M 10 (W 8) | EU − ISO at the same US size | UK − ISO at the same US size | US size − ISO at the same foot | W − M |\n|---|---|---|---|---|---|---|---|---|---|\n"


def rows_of_table(charts):
    lines = []
    for c in charts:
        s = summarize(c)
        lines.append(f"| {s['brand']} | {s['chart']} | {s['rows']} | {s['length']} | {s['grid']} | {s['ref']} | {s['o_eu']} | {s['o_uk']} | {s['d_us']} | {s['w_m']} |")
    return HEAD + "\n".join(lines)


def table(charts):
    """The recommended charts' table (the doc's §9), then every other adult chart's, then the columns explained."""
    adults = [c for c in charts if adult(c)]
    adults.sort(key=lambda c: (BRAND_ORDER.index(c["brand"]), not c.get("product", False), LINE_ORDER.get(c["line"], 3), c["site"], c["chart"]))
    product = [c for c in adults if c.get("product")]
    rest = [c for c in adults if not c.get("product")]
    kids = [c for c in charts if c["line"] == "kids"]
    other = [c for c in charts if not adult(c) and c["line"] != "kids"]
    note = (
        f"\n\nThe {len(product)} charts recommended for the product (§5, decision 1), one per brand and gender line; the other {len(rest)} adult charts kept (a brand's other regions, lines, and pages) follow in `deltas.md`, and the {len(kids)} kids' charts and {len(other)} others (socks, sandals, boots) are in `brands.json` alone. "
        "Length: what the brand says its length column is (§7, §8). "
        "mm a half size: the chart's foot step, the median over its rows; ISO's barleycorn is 4.2, a centimetre grid 5. "
        "Foot at US M 10: the brand's foot length for its US men's 10 (a women's chart: US women's 8) and its difference from ISO's 271 mm (245.6 for W 8); a positive number means the chart gives a longer foot the same size, so a measured foot gets a smaller size from the brand than from ISO. "
        "EU − ISO and UK − ISO: the brand's European or British size beside its US size, minus the size ISO's rule gives that US size, the range over the chart's rows in the range most adults buy in (US men's 6 to 13, US women's 5 to 11, UK 4 to 12, EU 36 to 47) and the mean in brackets; a visitor who types a US size and reads our EU row meets this difference. "
        "US size − ISO at the same foot: the brand's US size for a row's foot length minus ISO's, for the charts with a length; the mirror of the foot column, in sizes. "
        "W − M: the brand's US women's minus US men's on one row; ISO's is 1. A range's middle stands in for a range (Birkenstock's US sizes, Crocs' EU pairs); Clarks' composed charts are its GB and US pages joined on the UK size they share.\n"
    )
    return rows_of_table(product) + note, rows_of_table(rest)


def write_deltas_csv(charts, path):
    fields = ["brand", "site", "chart", "line", "kind", "basis", "foot_mm", "foot_in_mm", "us_men", "us_women", "uk", "eu", "jp", "iso_eu", "iso_uk", "iso_usm", "iso_usw", "d_eu", "d_uk", "d_usm", "d_usw", "o_eu_m", "o_uk_m", "o_foot_m", "o_eu_w", "o_uk_w", "o_foot_w", "w_minus_m", "in_minus_cm_mm", "product"]
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, lineterminator="\n")
        w.writeheader()
        for c in charts:
            if not adult(c):
                continue
            for r in c["rows"]:
                d = delta_row(c, r)
                out = {"brand": c["brand"], "site": c["site"], "chart": c["chart"], "line": c["line"], "kind": c["kind"], "basis": c["length"]["basis"], "product": "yes" if c.get("product") else ""}
                for k in ("foot_mm", "foot_in_mm", "us_men", "us_women", "uk", "eu", "jp"):
                    out[k] = "" if r.get(k) is None else plain(r[k], 2)
                for k in fields:
                    if k in d:
                        out[k] = plain(d[k], 3)
                w.writerow(out)


def write_json(charts, path):
    with path.open("w", encoding="utf-8", newline="\n") as f:
        f.write('{\n"schema": "bigsmall shoe-size brands v1 (docs/research/shoe-sizes-2/brands.py)",\n')
        f.write(f'"date": "{DATE}",\n"iso": {{"eu": "foot / 6.67 + 2", "uk": "foot / 8.47 - 23", "us_men": "uk + 1", "us_women": "uk + 2", "japan": "foot / 10", "source": "ISO/TS 19407:2015, as packages/core/src/units/shoe-size.ts holds it (ADR 0027)"}},\n')
        f.write('"keys": {"foot_mm": "the brand\'s length in mm, from its mm or cm column, else its inches (foot_from_inches)", "foot_in_mm": "its inch column in mm, kept beside the metric one", "us_men": "US men\'s", "us_women": "US women\'s", "us_kids": "US children\'s, the label\'s number", "uk": "British (uk_men where a brand prints men\'s and women\'s UK)", "eu": "European (eu_standard: Clarks\' standard EU beside its own)", "jp": "the Japan or CM column, a label unless the brand\'s words make it the foot", "*_low, *_high": "a range\'s ends, the middle in the key", "text": "every cell as printed, by the chart\'s own heading"},\n')
        f.write('"charts": [\n')
        for i, c in enumerate(charts):
            head = {k: v for k, v in c.items() if k != "rows"}
            f.write("{" + json.dumps(head, ensure_ascii=False)[1:-1] + ',\n"rows": [\n')
            f.write(",\n".join(json.dumps(r, ensure_ascii=False) for r in c["rows"]))
            f.write("\n]}" + ("," if i < len(charts) - 1 else "") + "\n")
        f.write("]}\n")


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    charts = load_workers() + load_manual() + load_dr_martens()
    charts += composed(charts)
    for c in charts:
        c["product"] = any(c["brand"] == b and s in c["site"] and c["chart"] == n for b, s, n in RECOMMENDED)
    found = {(b, s, n) for b, s, n in RECOMMENDED for c in charts if c["brand"] == b and s in c["site"] and c["chart"] == n}
    missing = RECOMMENDED - found
    if missing:
        raise SystemExit(f"recommended charts not found: {sorted(missing)}")
    cells = sum(len(r["text"]) for c in charts for r in c["rows"])
    print(f"{len(charts)} charts, {sum(len(c['rows']) for c in charts)} rows, {cells} cells; {sum(1 for c in charts if c['product'])} recommended for the product")
    product_md, rest_md = table(charts)
    print(product_md)
    for c in charts:
        if c["kind"] == "composed":
            dis = [x for r in c["rows"] for x in r.get("disagree", [])]
            print(f"{c['brand']} {c['chart']}: {len(c['rows'])} rows, {len(dis)} disagreements" + (": " + "; ".join(dis[:6]) if dis else ""))
    if "--write" in sys.argv:
        write_json(charts, HERE / "brands.json")
        write_deltas_csv(charts, HERE / "deltas.csv")
        (HERE / "deltas.md").write_text(
            f"<!-- written by brands.py, {DATE}: the first table is pasted into docs/research/shoe-sizes-2.md §9 between its markers; edit the keepers, never this -->\n\n"
            f"## The product's charts\n\n{product_md}\n## Every other adult chart kept\n\n{rest_md}\n",
            encoding="utf-8",
            newline="\n",
        )
        print("written: brands.json, deltas.csv, deltas.md")


if __name__ == "__main__":
    main()
