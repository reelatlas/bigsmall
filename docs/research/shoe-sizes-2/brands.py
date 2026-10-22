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
DATE = "2026-10-21"

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
    t = str(text).replace("″", '"').strip().strip('"').strip()  # 10 3/8″ and "8 1/7"" are inches: the mark is dropped, the unit stays in the heading
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
    if t == "men":
        return "us_men"  # Puma's unisex table: MEN beside WOMEN
    if t == "women":
        return "us_women"
    if t == "uk men":
        return "uk_men"
    if t == "uk women":
        return "uk_women"
    if t in ("uk", "uk size", "clarks uk size"):
        return "uk"
    if t in ("eu", "euro", "eur", "fr", "de", "europe", "europe unisex", "clarks eu size", "birkenstock size"):
        return "eu"
    if t in ("it", "es"):
        return None  # Puma's EU pages repeat one European number under DE, FR, IT, ES
    if t in ("cm / jp", "cm/jp", "jp", "japan"):
        return "jp"
    if t == "japan men (cm)":
        return "jp_men"
    if t == "japan women (cm)":
        return "jp_women"
    if t in ("cm", "length cm", "foot length (cm)", "heel to toe length (centimeters)", "foot length", "length (cm)", "heel to toe length (cm)"):
        return "foot_cm"
    if t in ("in", "inches", "foot length (in)", "foot length (in.)", "foot length (inch)", "heel-toe measurement (in)", "heel-toe measurement", "heel-toe measurements", "heel to toe length (inches)", "length (in)", "heel to toe length (in)"):
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
    if "standard" in n:
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
    "Under Armour": ("label", "the page: 'We start with the true foot, which means we measure from heel to toe. That measurement (in centimeters) is then translated into our standard sizes' (Sean's re-read, 2026-10-20), but the CM column is the standard centimetre label, 27 at a US 9 on a round-centimetre grid, and measured inside its 9 is every brand's 9 (shoe-sizes-3.md §5, decision 10; ADR 0030): the product reads its sizes by ISO's label; the inch column, the page's conversion, disagrees by 3.9 to 18.8 mm and is never read as the foot"),
    "Reebok": ("foot", "Heel-Toe Measurement in inches, heel to longest toe"),
    "Clarks": ("foot", "Foot Length in mm, a ruler on the foot; the page says it does not correlate with a Clarks foot gauge"),
    "Birkenstock": ("foot", "the foot on its printable template, mm; its GB and EU pages give a range per size"),
    "Crocs": ("foot", "Heel to Toe Length; the cm field is what the page shows, the mm field Korea's own and a centimetre apart on the first rows"),
    "Salomon": ("foot", "Foot length in cm and inches, the foot in socks"),
    "Dr. Martens": ("foot", "Foot length under the page's cm or in toggle, heels against a wall, the longest toe marked; the inch toggle a second grid, not a conversion"),
    "Puma": ("product", "a length the US site's size guide heads Product Measurements, beside heel height, weight, and width, under an inches/cm toggle, equal size for size to the AU chart's Length cm: the product's, not the foot's (Sean's capture, 2026-10-20)"),
    "Asics": ("label", "a CM column, its centimetre label: the NZ and AU pages say to add 1 to 1.5 cm to the foot to read it, so the foot is the label less a centimetre (shoe-sizes-3.md §5, decision 5; ADR 0030); the US page's steps compare the foot with the chart and add a half size for running shoes"),
    "Converse": ("foot", "the US page's How to Find Your Size: the longest part of the foot marked on paper, heel against a wall, measured as the heel-to-toe length, and the kids' column headed Foot Length (Sean's capture, 2026-10-20); the CA page prints the same cells without the words"),
    "Skechers": ("none", "no length on any chart"),
    "Brooks": ("foot", "Foot Length (CM) per size on its UK site, brooksrunning.com/en_gb, its IE and DE charts cell-equal, the home page printing the same sizes without the column (shoe-sizes-3.md §5, decision 1); its AU help centre's Japan columns are labels"),
    "adidas": ("foot", "heel-to-toe foot length in inches and cm"),
    "New Balance": ("label", "heel to longest toe, cm and inches, with ball widths, the page says; but the column is the standard centimetre label, 27 at a US 9 on a round-centimetre grid, and measured inside its 9 is every brand's 9 (shoe-sizes-3.md §5, decision 10; ADR 0030): the product reads its sizes by ISO's label"),
    "Vans": ("label", "heel to longest toe, inches and cm, the page says, its JP column equal to the cm: the standard centimetre label on a round-centimetre grid, and measured inside its 9 is every brand's 9 (shoe-sizes-3.md §5, decision 10; ADR 0030): the product reads its sizes by ISO's label"),
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
    if used & {"product_cm", "product_in"}:
        return BASIS["Puma"]
    if not used & {"foot_cm", "foot_in", "foot_mm", "foot_from_mm"}:
        return ("label", "size labels only (Japan cm)") if used & {"jp", "jp_men", "jp_women"} else ("none", "no length")
    return BASIS[brand]


# --- the product's recommended charts (decision 1 of the doc's §5): brand -> (site part, chart) ----
RECOMMENDED = {
    ("adidas", "manual", "adult"),
    ("Asics", "asics.com/us", "Men's shoes size chart"),
    ("Asics", "asics.com/us", "Women's shoes size chart"),
    ("Birkenstock", "template", "PRINTABLE SIZING TEMPLATE A4: size table"),
    ("Brooks", "composed", "Men's, composed"),
    ("Brooks", "composed", "Women's, composed"),
    ("Clarks", "composed", "Men's, composed"),
    ("Clarks", "composed", "Women's, composed"),
    ("Converse", "converse.com", "Men's Chuck Taylor All Star"),
    ("Converse", "converse.com", "Women's Chuck Taylor"),
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
    ("Puma", "us.puma.com", "Men's shoes"),
    ("Puma", "us.puma.com", "Women's shoes"),
    ("Reebok", "composed", "Men's, composed"),
    ("Reebok", "composed", "Women's, composed"),
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
    # The kids' charts (§5, decision 11; ADR 0031): one per brand, composed from its home site's
    # age bands by KIDS below; Brooks prints none.
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
    if key == "us_by_line":
        key = {"men": "us_men", "women": "us_women", "kids": "us_kids"}.get(line, "us_pair")
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
        if row.get("product_cm") is not None:
            row["product_mm"] = round(row["product_cm"] * 10, 2)  # the product's length, never the foot's (Puma)
        elif row.get("product_in") is not None:
            row["product_mm"] = round(row["product_in"] * 25.4, 2)
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
        if chart["brand"] == "Asics" and row.get("foot_cm") is not None:
            row["label"] = row["foot_cm"]  # its CM column is its centimetre label, read by its rule and never listed as a scale (shoe-sizes-3.md §5, decision 5; ADR 0030)
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


SOURCES_PASS = HERE.parent / "shoe-sizes-3"


def load_sources_pass():
    """The charts the sources pass read on the brands' other sites and checked at its wave 2
    (docs/research/shoe-sizes-3.md §7 and §8): Brooks' UK charts with their foot lengths, Reebok's
    AU charts with their UK and EU. The same shape as a worker's charts.csv."""
    groups = {}
    with (SOURCES_PASS / "rules" / "charts.csv").open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            if not (r["site"].startswith("brooksrunning.com/en_gb") or r["site"].startswith("reebok.com.au")):
                continue
            g = groups.setdefault((r["brand"], r["site"], r["chart"]), {"rows": {}, "columns": [], "url": r["url"], "date": r["date_read"], "tool": r["tool"], "notes": set()})
            g["rows"].setdefault(int(r["row"]), {})[r["column"]] = r["value"]
            if r["column"] not in g["columns"]:
                g["columns"].append(r["column"])
            if r["notes"]:
                g["notes"].add(r["notes"])
    charts = []
    for (brand, site, chart), g in groups.items():
        line, _ = classify(chart)
        keys = {h: key_of(h, line, chart) for h in g["columns"]}
        texts = [g["rows"][i] for i in sorted(g["rows"])]
        read = f"worker A of the sources pass, {g['date']}, {g['tool']}, checked at its wave 2 (shoe-sizes-3.md §8)" + (f"; notes: {' | '.join(sorted(g['notes']))}" if g["notes"] else "")
        charts.append(finish(make_chart(brand, site, chart, g["columns"], keys, texts, g["url"], read)))
    return charts


def scales_only(chart):
    """A copy of a chart with its sizes alone, its lengths left as text: for a join that takes a page's scales and never its lengths (Reebok AU, another grid than the home page's)."""
    keep = {"us_men", "us_women", "uk", "eu", "text"}
    copy = dict(chart)
    copy["rows"] = [{k: v for k, v in row.items() if k in keep} for row in chart["rows"]]
    return copy


MANUAL_KEYS = {
    "us_men": "us_men", "us_women": "us_women", "us_kids": "us_kids", "us_youth": "us_kids", "us_numeric": "us_numeric", "us": "us_by_line",
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


def parse_pasted(folder, transpose=False):
    """A pasted-text file's tables by heading: (header, rows, the page's words above the table); a row is a tab line, the first the header.
    A transposed page (Crocs) prints a line per scale and a column per size: each line's first cell is its heading, a line with another
    count of cells (a spanning age band) is kept as words, and a length heading takes the table's unit from its title."""
    text = (HERE / "manual" / "sources" / folder / "pasted-text.txt").read_text(encoding="utf-8")
    tables = {}
    for block in re.split(r"^## ", text, flags=re.M)[1:]:
        lines = [ln for ln in block.splitlines() if ln.strip()]
        title = lines[0].strip()
        rows = [ln.split("\t") for ln in lines[1:] if "\t" in ln]
        words = [ln.strip() for ln in lines[1:] if "\t" not in ln]
        if not rows:
            continue
        if transpose:
            count = max(len(r) - 1 for r in rows)
            kept = [r for r in rows if len(r) - 1 == count]
            words += [" | ".join(r) for r in rows if len(r) - 1 != count]
            unit = title[-5:] if title.endswith((" (in)", " (cm)")) else ""
            header = [(r[0] + unit) if "length" in r[0].lower() else r[0] for r in kept]
            rows = [header] + [[r[i + 1] for r in kept] for i in range(count)]
        tables[title] = (rows[0], rows[1:], words)
    return tables


# Sean's home-site captures after wave 3 (2026-10-20): the pages every fetch refused, pasted and screenshotted.
PASTED = [
    {
        "folder": "brooks",
        "brand": "Brooks",
        "site": "brooksrunning.com",
        "source": "brooksrunning.com, the Women's, Men's, and All gender size guides, their Shoes tab",
        "skip": "width",
    },
    {
        "folder": "puma-us",
        "brand": "Puma",
        "site": "us.puma.com",
        "source": "us.puma.com, the Size guide panel on product pages (a men's shoe, a women's shoe, Speedcat Ballet Suede Big Kids Sneakers 406132)",
        "skip": None,
        "join": (" (in)", " (cm)"),
    },
    {
        "folder": "asics-us",
        "brand": "Asics",
        "site": "asics.com/us",
        "source": "asics.com/us, Customer Service, ASICS Size & Fit Guide, ASICS Size Guide, the Gender menu (Men, Women, Kids), the Shoes product type",
        "skip": "width",
    },
    {
        "folder": "converse-us",
        "brand": "Converse",
        "site": "converse.com",
        "source": "converse.com/size-chart-guide (Men's and Women's, Chuck Sneakers and Standard Sneakers, under the inches and cm toggles; Kids'; Babies & Toddlers)",
        "join": (" (in)", " (cm)"),
    },
    {
        "folder": "crocs",
        "brand": "Crocs",
        "site": "crocs.com/size-chart",
        "source": "crocs.com/size-chart as rendered (Adult and Kids' under the Inches and Centimeters toggles)",
        "join": (" (in)", " (cm)"),
        "transpose": True,
    },
    # Sean's re-reads of pages the workers had fetched and wave 2 had confirmed: kept to compare, never recommended over the checked charts
    {"folder": "skechers", "brand": "Skechers", "site": "skechers.com (re-read)", "source": "skechers.com/size-chart/, the four tabs", "skip": "perfect fit"},
    {"folder": "reebok", "brand": "Reebok", "site": "reebok.com (re-read)", "source": "reebok.com/pages/size-guides, Men's, Women's, and Unisex Shoes"},
    {"folder": "under-armour", "brand": "Under Armour", "site": "underarmour.com (re-read)", "source": "underarmour.com/en-us/t/size-guide/, mens-, womens-, boys-, and girls-footwear"},
]


def pasted_key(heading, line, chart, unit=None):
    """A pasted table's heading as a key: the product measurement tables' columns by name, the rest by key_of."""
    h = heading.strip()
    if h in ("Heel Height", "Weight", "Width"):
        return None
    if h == "Length":
        return None if line == "kids" else f"product_{unit or 'in'}"
    if h == "Size":
        return "us_by_line"
    return key_of(h, line, chart)


def load_pasted(spec):
    tables = parse_pasted(spec["folder"], spec.get("transpose", False))
    brand, site = spec["brand"], spec["site"]
    read = f"Sean's browser, {DATE}: the page text highlighted and copied (manual/sources/{spec['folder']}/)"
    charts = []
    done = set()
    for title, (header, rows, words) in tables.items():
        if title in done or (spec.get("skip") and spec["skip"] in title.lower()):
            continue
        line, _ = classify(title)
        join = spec.get("join")
        if join and title.endswith(join[0]):
            other = title[: -len(join[0])] + join[1]
            if other not in tables:
                raise KeyError(other)
            done.add(other)
            name = title[: -len(join[0])]
            header_cm, rows_cm, _ = tables[other]
            if header == header_cm:
                # Puma's product measurements: the same columns under each toggle, so every column after the size carries its unit
                by_size = {r[0]: r for r in rows_cm}
                columns = [header[0]] + [f"{c} (in)" for c in header[1:]] + [f"{c} (cm)" for c in header_cm[1:]]
                texts = []
                for r in rows:
                    cm = by_size.get(r[0], [])
                    cells = {header[0]: r[0]}
                    cells.update({f"{c} (in)": (r[i + 1] if i + 1 < len(r) else "") for i, c in enumerate(header[1:])})
                    cells.update({f"{c} (cm)": (cm[i + 1] if i + 1 < len(cm) else "") for i, c in enumerate(header_cm[1:])})
                    texts.append(cells)
                keys = {header[0]: "us_by_line"}
                for c in header[1:]:
                    keys[f"{c} (in)"] = pasted_key(c, line, name, "in")
                for c in header_cm[1:]:
                    keys[f"{c} (cm)"] = pasted_key(c, line, name, "cm")
            else:
                # Converse and Crocs: only the length column differs between the toggles, so the cm table adds its columns, joined on the first size column
                key_col = next(c for c in header if "length" not in c.lower())
                extra = [c for c in header_cm if c not in header]
                columns = header + extra
                at = header_cm.index(key_col)
                by_key = {r[at]: r for r in rows_cm if at < len(r)}
                texts = []
                for r in rows:
                    cells = dict(zip(header, r + [""] * (len(header) - len(r))))
                    cm = by_key.get(cells[key_col], [])
                    for c in extra:
                        i = header_cm.index(c)
                        cells[c] = cm[i] if i < len(cm) else ""
                    texts.append(cells)
                keys = {c: pasted_key(c, line, name) for c in columns}
            chart = make_chart(brand, site, name, columns, keys, texts, spec["source"], read + "; the inches and cm toggles joined on the size")
        else:
            texts = [dict(zip(header, r + [""] * (len(header) - len(r)))) for r in rows]
            keys = {h: pasted_key(h, line, title) for h in header}
            chart = make_chart(brand, site, title, header, keys, texts, spec["source"], read)
        chart["words"] = words
        chart["pasted"] = True
        done.add(title)
        charts.append(finish(chart))
    return charts


def load_dr_martens():
    tables = {k: (h, r) for k, (h, r, _) in parse_pasted("dr-martens").items()}
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
    for c in charts:
        c["pasted"] = True
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
    # The sources pass (docs/research/shoe-sizes-3.md §5, decisions 1 and 7; ADR 0030): Brooks' UK
    # foot column and Reebok's AU scales onto the home charts, each on the US size the pages share.
    brooks_note = "the UK page's Foot Length (CM) joined with the home page's chart on the US size they share, their UK and EU cells equal on every row (shoe-sizes-3.md §9, Table 5); the home page prints no length"
    uk_men = find(charts, "Brooks", "brooksrunning.com/en_gb", "Men's running shoes, Shoe size comparison")
    uk_women = find(charts, "Brooks", "brooksrunning.com/en_gb", "Women's running shoes, Shoe size comparison")
    home_men = find(charts, "Brooks", "brooksrunning.com", "Men's shoes")
    home_women = find(charts, "Brooks", "brooksrunning.com", "Women's shoes")
    out.append(compose("Brooks", "Men's, composed", [uk_men, home_men], "us_men", brooks_note))
    out.append(compose("Brooks", "Women's, composed", [uk_women, home_women], "us_women", brooks_note))
    # Reebok per line: its AU men's and women's charts disagree on EU at the women's 5 to 7.5 (a
    # half to a full size), so each line's home guide takes its own AU chart's UK and EU.
    reebok_note = "the home page's {line} guide, US sizes and inches, joined with the AU page's {line} chart's UK and EU on the US size they share; the AU page's lengths, another grid (27 cm at a US men's 9 against the home page's 10.3 in), left as text and never read (shoe-sizes-3.md §5, decision 7)"
    reebok_men = find(charts, "Reebok", "reebok.com", "Men's Shoes Size Guide")
    reebok_women = find(charts, "Reebok", "reebok.com", "Women's Shoes Size Guide")
    au_men = scales_only(find(charts, "Reebok", "reebok.com.au", "Men's Size Guides, Men's Footwear"))
    au_women = scales_only(find(charts, "Reebok", "reebok.com.au", "Women's Size Guides, Women's Footwear"))
    out.append(compose("Reebok", "Men's, composed", [reebok_men, au_men], "us_men", reebok_note.format(line="men's")))
    out.append(compose("Reebok", "Women's, composed", [reebok_women, au_women], "us_women", reebok_note.format(line="women's")))
    return [finish(c) for c in out]


# --- the kids' charts (docs/research/shoe-sizes-2.md §5, decision 11; ADR 0031) -------------------------
# One kids' chart per brand from its home site's age bands, in age order. A part is (site, chart,
# options): `youth` where the band starts past the restart (1Y on); `inches` where the band's cm
# column is a label grid and its inch column the foot (Nike's Little Kids: 140, 150, 160, 165 ...
# a round centimetre a size at round numbers, equal to its CM/JP label column, while its inches
# step the barleycorn and agree with the Babies and Big Kids bands where they overlap; ADR 0030's
# grid test); `pairs` False where a table's paired rows (UGG's baby booties, 0/1, 2/3) are left
# out; `only` the keys taken from a part joined onto the rows (`on`: the key the pages share, a
# children's or youth key alike); `out` the cells left out of the product chart with why.
KIDS = [
    ("Nike", [
        ("nike.com/us", "Kids' Footwear - Babies & Toddlers (1C - 10C)", {}),
        ("nike.com/us", "Kids' Footwear - Little Kids (8C - 3Y)", {"inches": True}),
        ("nike.com/us", "Kids' Footwear - Big Kids (1Y - 7Y)", {"youth": True}),
    ], "the three bands of nike.com's kids' page; the Little Kids band's cm column is its CM/JP label (140 at 8C against 150 on the Babies band and 15.08 in on its own inch column; the live page prints it so, read in Sean's browser on 2026-10-21, its Foot Length (cm) row equal to its CM / JP row cell for cell), so that band's inches are its foot (ADR 0030's grid test), equal to the Babies band's cm where the two overlap"),
    ("adidas", [
        ("manual", "kids_0_3", {}),
        ("manual", "kids_4_7", {}),
        ("manual", "kids_8_16", {"youth": True}),
    ], "the three bands of adidas.com's kids' charts, Sean's capture; its US column heads 1k to 13.5k then 1 to 7.5"),
    ("New Balance", [
        ("manual", "kids_0_4", {}),
        ("manual", "kids_4_8", {"out": [(2.5, "uk", "UK 5 printed between UK 1.5 and 2.5, out of the chart's own order; printed so on the live page too, read in Sean's browser on 2026-10-21")]}),
        ("manual", "kids_8_12", {"youth": True}),
    ], "the three bands of newbalance.com's kids' guide, Sean's capture; its length column the standard centimetre label as its adults' (ADR 0030); one cell left out, UK 5 at a 2.5Y, printed out of the column's order"),
    ("Vans", [
        ("manual", "infants", {}),
        ("manual", "toddlers", {}),
        ("manual", "kids", {}),
        ("manual", "youth", {"youth": True}),
    ], "the four bands of vans.com's kids' tab, Sean's capture; its length column the standard centimetre label as its adults' (ADR 0030); the youth band's last two rows print UK and EU alone"),
    ("UGG", [
        ("manual", "baby", {"pairs": False}),
        ("manual", "toddlers", {}),
        ("manual", "big_kids", {}),
    ], "the three kids' tables of ugg.com's size chart, Sean's capture, the baby table's paired rows (0/1, 2/3, 4/5, 6/7, its booties) left out; the kids' PDF, a label grid, not read"),
    ("HOKA", [("manual", "kids", {"youth": True})], "hoka.com's kids' table, Sean's capture: youth sizes 3.5 to 7 with the foot alone"),
    ("Timberland", [
        ("manual", "infant", {}),
        ("manual", "toddler", {}),
        ("manual", "youth", {}),
        ("manual", "junior", {"youth": True}),
    ], "the four bands of timberland.com's kids' charts, Sean's capture"),
    ("On", [("manual", "kids", {})], "on.com's kids' Size & Fit panel, Sean's capture, its length a measured foot that equals its Japan label"),
    ("Dr. Martens", [("pasted", "Kid's Sizing", {})], "drmartens.com's Kid's Sizing tab, Sean's pasted text: size labels alone, its Japan column a centimetre label; the first row printed twice"),
    ("Puma", [
        ("us.puma.com", "Kids' sizing: Toddler shoes", {}),
        ("us.puma.com", "Kids' sizing: Little kids' shoes", {}),
        ("us.puma.com", "Kids' sizing: Junior shoes", {"youth": True}),
    ], "the three bands of us.puma.com's kids' sizing panel, Sean's read; no length"),
    ("Asics", [("asics.com/us", "Kids shoes chart", {})], "asics.com/us's kids' chart, Sean's read: K4 to K13 then 1 to 7, its CM column the centimetre label its NZ and AU rule reads (decision 5 of the sources pass)"),
    ("Converse", [
        ("converse.com", "Babies & toddlers shoes", {}),
        ("converse.com", "Kids' shoes", {}),
    ], "converse.com's two kids' tables, Sean's read: US sizes and the foot's length alone"),
    ("Crocs", [("crocs.com/size-chart", "Kids'", {})], "crocs.com's Kids' chart as rendered, Sean's read: C1 to C13 then J1 to J6, its EU a pair"),
    ("Skechers", [
        ("skechers.com (re-read)", "Infant & Toddler", {}),
        ("skechers.com (re-read)", "Kids'", {}),
    ], "skechers.com's two kids' tabs, Sean's re-read: 10.5-L to 3-L then whole youth sizes; no length"),
    ("Under Armour", [("underarmour.com (re-read)", "Boys' Shoes", {})], "underarmour.com's boys' chart, Sean's re-read: 1K to 13.5K then 1 to 7; its CM column the standard centimetre label as its adults' (ADR 0030); the girls' chart prints the same sizes"),
    ("Reebok", [
        ("reebok.com", "TODDLER & BABY SHOES SIZING", {}),
        ("reebok.com", "PRESCHOOL/LITTLE KIDS SHOES SIZING", {}),
        ("reebok.com", "GRADE SCHOOL/BIG KIDS SHOES SIZING", {"youth": True}),
    ], "the three bands of reebok.com's kids' size guide: US sizes and heel-to-toe inches alone"),
    ("Salomon", [("salomon.com/en-us", "Kid's Footwear", {})], "salomon.com's kids' chart: 9 (Kid) to 13 (Kid) then 1 to 8"),
    ("Clarks", [
        ("clarks.com/en-gb", "Kids & Babies Clarks Shoe Sizes", {}),
        ("clarks.com.au", "Kids: Baby/Toddler", {"on": "uk", "only": ("us_kids",)}),
        ("clarks.com.au", "Kids: Junior Kids", {"on": "uk", "only": ("us_kids",)}),
        ("clarks.com.au", "Kids: Senior Kids", {"on": "uk", "only": ("us_kids",), "youth": True}),
    ], "the GB page's kids' chart (UK, EU, mm) with the AU page's US kids' sizes joined on the UK size they share, the AU page's CM column, unexplained, left as text; the GB chart runs on past the junior sizes to UK 10"),
    ("Birkenstock", [
        ("birkenstock.com (Sites-EU-Site en_NL)", "Kids: EU sizes and measurements (in mm)", {}),
        ("birkenstock.com/gb", "Kids: UK sizes and measurements (in mm)", {"on": "foot_mm", "only": ("uk",)}),
        ("birkenstock.com/us", "Size Conversion Chart: Kids", {"on": "eu", "only": ("us_kids",)}),
    ], "the EU page's kids' sizes and feet, the GB page's UK sizes joined on the foot the two print alike, and the US page's US pairs (6–6.5 to 3–3.5) joined on the EU size"),
]

# The keys a row keeps from a part; the derived ones are rebuilt by finish.
DERIVED = {"foot_in_mm", "foot_from_inches", "uk_from_men", "label", "product_mm", "foot_mm_korea", "disagree", "youth"}
# A children's key and the youth key it becomes past the restart (the US and UK scales restart at
# 1 after 13.5; ISO's children's scales to the restart, its adult scales from it; EU is one scale
# with no restart, written as the children's or the adult European by the row's US, else UK, kind).
YOUTH_KEY = {"us_kids": "us_men", "uk": "uk", "eu": "eu"}
CHILD_KEY = {"us_kids": "us_kids", "uk": "uk_kids", "eu": "eu_kids"}


def kids_key(row, base):
    """A row's cell on a base scale, under its children's or its youth key: (key, value) or None."""
    for key in (CHILD_KEY.get(base, base), YOUTH_KEY.get(base, base)):
        if row.get(key) is not None:
            return key, row[key]
    return None


def rename(row, old, new):
    for suffix in ("", "_low", "_high"):
        if old + suffix in row:
            row[new + suffix] = row.pop(old + suffix)


def split_kids(part, options, site):
    """A band's rows with each cell under its children's or youth key: youth from the first row the US
    column drops at (the restart), or from the start where the band begins past it; the UK column by
    its own drop, one row later than the US at most brands (a 1Y is a UK 13.5)."""
    rows = []
    youth = bool(options.get("youth"))
    # A band starting at 1Y still prints that row's UK as the children's 13.5 (Nike's Big Kids),
    # the UK restarting a row later, so the UK's own drop says, unless the band starts past it.
    first_uk = next((row.get("uk") for row in part["rows"] if row.get("uk") is not None), None)
    uk_youth = youth and (first_uk is None or first_uk < 10)
    prev_us = prev_uk = None
    only = options.get("only")
    on = options.get("on")
    if only and on:
        only = (*only, on, CHILD_KEY.get(on, on))  # the key the join rests on travels with the cells taken
    out = {(size, key): why for size, key, why in options.get("out", [])}
    for row in part["rows"]:
        text = row.get("text") or {}
        if options.get("pairs") is False and any("/" in str(v) for k, v in text.items() if k.startswith("us")):
            continue
        r = {}
        for key, value in row.items():
            if key == "text" or key in DERIVED or value is None:
                continue
            if key == "foot_mm" and (row.get("foot_cm") is not None or row.get("foot_in") is not None):
                continue  # derived from the cm or the inches at finish
            if only and not any(key == k or key.startswith(k + "_") for k in only):
                continue
            r[key] = value
        if options.get("inches"):
            r.pop("foot_cm", None)
            r.pop("foot_mm", None)
        us = row.get("us_kids")
        if us is not None:
            if prev_us is not None and us < prev_us - 1e-9:
                youth = True
            prev_us = us
            for key, why in [(k, w) for (s, k), w in out.items() if abs(s - us) < 1e-9]:
                if key in r:
                    r.pop(key, None)
                    r.setdefault("left_out", []).append(f"{key} at US {us:g}: {why}")
        uk = row.get("uk")
        if uk is not None:
            if prev_uk is not None and uk < prev_uk - 1e-9:
                uk_youth = True
            prev_uk = uk
        if us is None and uk is not None and not options.get("youth"):
            youth = uk_youth  # no US column: the UK's restart says
        if youth:
            rename(r, "us_kids", "us_men")
        if not uk_youth:
            rename(r, "uk", "uk_kids")
        r["youth"] = youth
        r["text"] = {f"{site}: {h}": v for h, v in text.items()}
        rows.append(r)
    return rows


def kind_of(row):
    """Youth where the row has a youth US cell, children's where a children's one, else by its UK."""
    if row.get("us_men") is not None or row.get("us_men_low") is not None:
        return True
    if row.get("us_kids") is not None or row.get("us_kids_low") is not None:
        return False
    return row.get("uk") is not None and row.get("uk_kids") is None


def same_cells(a, b):
    """Whether two rows agree on every scale they share (the foot within a millimetre)."""
    for key in set(a) & set(b):
        if key in ("text", "youth", "left_out"):
            continue
        tolerance = 1.0 if key.startswith("foot") else 1e-9
        if isinstance(a[key], (int, float)) and isinstance(b[key], (int, float)) and abs(a[key] - b[key]) > tolerance:
            return False
    return True


def compose_kids(charts, brand, specs, note):
    """One kids' chart from a brand's bands and joined pages: the bands appended in age order, a size
    printed twice kept once where the bands agree (their cells unioned), the first kept and the
    disagreement recorded where they differ; a joined page's cells put on the rows sharing its key."""
    rows = []
    parts = []
    dropped = []
    for site, chart, options in specs:
        part = find(charts, brand, site, chart)
        parts.append(part)
        split = split_kids(part, options, part["site"])
        on = options.get("on")
        if on:
            for r in split:
                hit = kids_key(r, on)
                if hit is None:
                    continue
                key, value = hit
                # The row under the same key first (a UK 2.5 is a baby's and a junior's), the other
                # kind's only where the page joined has no restart to say (Birkenstock's EU page).
                target = next((x for x in rows if x.get(key) is not None and abs(x[key] - value) < 1e-9), None) or next(
                    (x for x in rows if any(x.get(k) is not None and abs(x[k] - value) < 1e-9 for k in (CHILD_KEY.get(on, on), YOUTH_KEY.get(on, on)))), None
                )
                if target is None:
                    dropped.append(f"{part['site']} {chart}: no row shares {key} {value:g}")
                    continue
                for k, v in r.items():
                    if k in ("text", "youth"):
                        continue
                    if k == "left_out":
                        target.setdefault("left_out", []).extend(v)
                    elif target.get(k) is None:
                        target[k] = v
                    elif isinstance(v, (int, float)) and abs(target[k] - v) > 1e-9:
                        target.setdefault("disagree", []).append(f"{k}: {target[k]} against {part['site']}'s {v}")
                target["text"].update(r["text"])
                if r["youth"] and not target["youth"]:
                    target["youth"] = True
            continue
        for r in split:
            key = kids_key(r, "us_kids") or kids_key(r, "uk")
            twin = next((x for x in rows if key is not None and x.get(key[0]) is not None and abs(x[key[0]] - key[1]) < 1e-9 and x["youth"] == r["youth"]), None)
            if twin is None:
                rows.append(r)
            elif same_cells(twin, r):
                for k, v in r.items():
                    if k not in twin or twin[k] is None:
                        twin[k] = v
                twin["text"].update(r["text"])
                dropped.append(f"{chart}: {key[0]} {key[1]:g} printed again, equal")
            else:
                twin.setdefault("disagree", []).append(f"{chart} prints {key[0]} {key[1]:g} as " + ", ".join(f"{k} {v}" for k, v in r.items() if k not in ("text", "youth") and isinstance(v, (int, float)) and twin.get(k) != v))
                twin["text"].update(r["text"])
    # EU under the children's or the adult key by the row's kind, found from its US, else its UK.
    for r in rows:
        youth = kind_of(r)
        r["youth"] = youth
        if youth:
            rename(r, "eu_kids", "eu")
        else:
            rename(r, "eu", "eu_kids")
    rows.sort(key=lambda r: (r.get("foot_mm") if r.get("foot_mm") is not None else (r.get("foot_cm") * 10 if r.get("foot_cm") is not None else (r.get("foot_in") * 25.4 if r.get("foot_in") is not None else (r.get("eu_kids") if r.get("eu_kids") is not None else r.get("eu", 0)) * 10))))
    chart = {
        "brand": brand,
        "site": "composed",
        "chart": "Kids, composed",
        "line": "kids",
        "kind": "composed",
        "length": parts[0]["length"],
        "columns": sorted({c for p in parts for c in p["columns"]}),
        "source": [f"{p['site']}: {p['chart']} ({p['source']})" for p in parts],
        "read": note,
        "rows": rows,
        "dropped": dropped,
    }
    return finish(chart)


def composed_kids(charts):
    return [compose_kids(charts, brand, specs, note) for brand, specs, note in KIDS]


KIDS_HEAD = "| Brand | Pages | Rows | Children · youth | Length | Scales | Left out |\n|---|---|---|---|---|---|---|\n"


def kids_table(charts):
    """The kids' composed charts' table (the doc's §9)."""
    lines = []
    for c in sorted((c for c in charts if c["line"] == "kids" and c.get("product")), key=lambda c: BRAND_ORDER.index(c["brand"])):
        rows = c["rows"]
        children = sum(1 for r in rows if not r.get("youth"))
        scales = [s for s, keys in (("US C", ("us_kids",)), ("US M", ("us_men",)), ("US W", ("us_women",)), ("UK C", ("uk_kids",)), ("UK", ("uk",)), ("EU C", ("eu_kids",)), ("EU", ("eu",)), ("JP", ("jp",)), ("CM label", ("label",)), ("foot", ("foot_mm",))) if any(r.get(k) is not None or r.get(k + "_low") is not None for r in rows for k in keys)]
        if c["length"]["basis"] != "foot" and "foot" in scales:
            scales.remove("foot")
        left = "; ".join(x for r in rows for x in r.get("left_out", [])) or ("; ".join(c.get("dropped", [])) if any("no row" in d for d in c.get("dropped", [])) else "—")
        lines.append(f"| {c['brand']} | {len(c['source'])} | {len(rows)} | {children} · {len(rows) - children} | {summarize(c)['length']} | {', '.join(scales)} | {left} |")
    note = (
        "\n\nThe kids' charts recommended for the product (§5, decision 11; ADR 0031), one per brand, composed from its home site's age bands in age order (Pages), a size printed twice kept once where the bands agree. "
        "Children · youth: the rows before and from the chart's restart at 1 (US and UK sizes run to 13.5 and start again), the children's rows on ISO's children's scales (US C, UK C, EU C) and the youth rows on its adult scales (youth sizes are men's sizes, ISO's Table 3), the EU column written by the row's kind. "
        "Length as the brand's adults' (ADR 0030). Left out: a cell printed out of its column's order, kept out of the product chart (the live page prints it so, read on 2026-10-21: the brand's own slip). Brooks prints no kids' chart.\n"
    )
    return KIDS_HEAD + "\n".join(lines) + note


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
    if chart.get("pasted"):
        return f"{chart['chart']} ({site}, Sean's pasted text)"
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
        "length": {"foot": "the foot's", "unstated": "unstated", "uncertain": "uncertain", "label": "a size label", "none": "none", "misaligned": "misaligned", "product": "the product's"}[basis],
        "grid": plain(g, 1) if g is not None else "—",
        "ref": ref_text,
        "o_eu": stat(o_eu) if any(v is not None for v in o_eu) else "—",
        "o_uk": stat(o_uk) if any(v is not None for v in o_uk) else "—",
        "d_us": stat(d_us) if basis in ("foot", "unstated", "uncertain", "label") and any(v is not None for v in d_us) else "—",
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
        f"\n\nThe {len(product)} charts recommended for the product (§5, decision 1), one per brand and gender line; the other {len(rest)} adult charts kept (a brand's other regions, lines, and pages) follow in `deltas.md`, and the {len(kids) - sum(1 for c in kids if c.get('product'))} kids' charts read ({sum(1 for c in kids if c.get('product'))} composed for the product, the table after this one) and {len(other)} others (socks, sandals, boots) are in `brands.json` alone. "
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
        f.write('"keys": {"foot_mm": "the brand\'s length in mm, from its mm or cm column, else its inches (foot_from_inches)", "foot_in_mm": "its inch column in mm, kept beside the metric one", "us_men": "US men\'s", "us_women": "US women\'s", "us_kids": "US children\'s, the label\'s number (a composed kids\' chart: the rows before its restart at 1; us_men from it, youth sizes being men\'s)", "uk_kids, eu_kids": "a composed kids\' chart\'s children\'s rows on the British and European children\'s scales (ISO\'s Table 3), uk and eu from the restart", "uk": "British (uk_men where a brand prints men\'s and women\'s UK)", "eu": "European (eu_standard: Clarks\' standard EU beside its own)", "jp": "the Japan or CM column, a label unless the brand\'s words make it the foot", "*_low, *_high": "a range\'s ends, the middle in the key", "text": "every cell as printed, by the chart\'s own heading"},\n')
        f.write('"charts": [\n')
        for i, c in enumerate(charts):
            head = {k: v for k, v in c.items() if k != "rows"}
            f.write("{" + json.dumps(head, ensure_ascii=False)[1:-1] + ',\n"rows": [\n')
            f.write(",\n".join(json.dumps(r, ensure_ascii=False) for r in c["rows"]))
            f.write("\n]}" + ("," if i < len(charts) - 1 else "") + "\n")
        f.write("]}\n")


def compare(a, b, on, keys=("us_men", "us_women", "uk", "eu", "foot_mm", "product_mm")):
    """The cells two charts print differently for the same size, joined on one key; the rows one chart lacks are counted apart."""
    rows_b = {r.get(on): r for r in b["rows"] if r.get(on) is not None}
    differ, shared, only_a = [], 0, 0
    for r in a["rows"]:
        k = r.get(on)
        if k is None:
            continue
        s = rows_b.get(k)
        if s is None:
            only_a += 1
            continue
        shared += 1
        for key in keys:
            if r.get(key) is not None and s.get(key) is not None and abs(r[key] - s[key]) > 1e-9:
                differ.append(f"{on} {plain(k)}: {key} {plain(r[key], 2)} against {plain(s[key], 2)}")
    return f"{label_of(a)} against {label_of(b)}: {shared} sizes shared, {only_a} only in the first, {len(rows_b) - shared} only in the second, {len(differ)} cells differ" + ("; " + "; ".join(differ[:8]) if differ else "")


COMPARISONS = [
    (("Asics", "asics.com/us", "Men's shoes size chart"), ("Asics", "asics.com/nz", "Men's/Unisex Shoe Sizes"), "us_men"),
    (("Asics", "asics.com/us", "Women's shoes size chart"), ("Asics", "asics.com/nz", "Women's Shoe Sizes"), "us_women"),
    (("Brooks", "brooksrunning.com", "Men's shoes"), ("Brooks", "support.brooksrunning.com.au", "Size Conversion Chart"), "us_men"),
    (("Brooks", "brooksrunning.com", "Women's shoes"), ("Brooks", "support.brooksrunning.com.au", "Size Conversion Chart"), "us_women"),
    (("Puma", "us.puma.com", "Men's shoes"), ("Puma", "eu.puma.com/en_GB", "International Size Conversions - men's shoes (table 6)"), "us_men"),
    (("Puma", "us.puma.com", "Men's shoes"), ("Puma", "au.puma.com", "Men's shoes"), "us_men"),
    (("Puma", "us.puma.com", "Women's shoes"), ("Puma", "au.puma.com", "Women's shoes"), "us_women"),
    (("Puma", "us.puma.com", "Women's shoes"), ("Puma", "eu.puma.com/en_GB", "International Size Conversions - women's shoes (table 1 of the page)"), "us_women"),
    (("Puma", "us.puma.com", "Men's product measurements"), ("Puma", "au.puma.com", "Men's shoes"), "us_men"),
    (("Puma", "us.puma.com", "Women's product measurements"), ("Puma", "au.puma.com", "Women's shoes"), "us_women"),
    (("Converse", "converse.com", "Men's Chuck Taylor All Star"), ("Converse", "converse.ca", "Men - Chuck Taylor All Star"), "us_men"),
    (("Converse", "converse.com", "Women's Chuck Taylor"), ("Converse", "converse.ca", "Women - Chuck Taylor All Star"), "us_women"),
    (("Converse", "converse.com", "Men's Standard"), ("Converse", "converse.ca", "Men - Standard Sneakers"), "us_men"),
    (("Converse", "converse.com", "Women's Standard"), ("Converse", "converse.ca", "Women - Standard Sneakers"), "us_women"),
    (("Crocs", "crocs.com/size-chart", "Adult"), ("Crocs", "default.json", "Adults"), "us_men"),
    (("Skechers", "skechers.com (re-read)", "Men's"), ("Skechers", "skechers.com/us", "Men's"), "us_men"),
    (("Skechers", "skechers.com (re-read)", "Women's"), ("Skechers", "skechers.com/us", "Women's"), "us_women"),
    (("Reebok", "reebok.com (re-read)", "Unisex Shoes Size Guide"), ("Reebok", "reebok.com", "Unisex Shoe Size Guide"), "us_men"),
    (("Reebok", "reebok.com (re-read)", "Men's Shoes Size Guide"), ("Reebok", "reebok.com", "Men's Shoes Size Guide"), "us_men"),
    (("Reebok", "reebok.com (re-read)", "Women's Shoes Size Guide"), ("Reebok", "reebok.com", "Women's Shoes Size Guide"), "us_women"),
    (("Under Armour", "underarmour.com (re-read)", "Men's Shoes"), ("Under Armour", "underarmour.com/en-us", "Men's Shoes Size Chart"), "us_men"),
    (("Under Armour", "underarmour.com (re-read)", "Women's Shoes"), ("Under Armour", "underarmour.com/en-us", "Women's Shoes Size Chart"), "us_women"),
    (("Reebok", "composed", "Women's, composed"), ("Reebok", "reebok.com", "Unisex Shoe Size Guide"), "us_women", ("foot_in",)),
    (("Reebok", "composed", "Men's, composed"), ("Reebok", "reebok.com", "Unisex Shoe Size Guide"), "us_men", ("foot_in",)),
    (("Reebok", "reebok.com.au", "Men's Size Guides, Men's Footwear"), ("Reebok", "reebok.com.au", "Women's Size Guides, Women's Footwear"), "uk", ("eu",)),
]


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    charts = load_workers() + load_manual() + load_dr_martens() + load_sources_pass()
    for spec in PASTED:
        charts += load_pasted(spec)
    charts += composed(charts)
    charts += composed_kids(charts)
    RECOMMENDED.update((brand, "composed", "Kids, composed") for brand, _specs, _note in KIDS)
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
            kids = f", {sum(1 for r in c['rows'] if not r.get('youth'))} children's and {sum(1 for r in c['rows'] if r.get('youth'))} youth, {len(c.get('dropped', []))} repeats dropped" if c["line"] == "kids" else ""
            print(f"{c['brand']} {c['chart']}: {len(c['rows'])} rows{kids}, {len(dis)} disagreements" + (": " + "; ".join(dis[:6]) if dis else ""))
            for d in c.get("dropped", []):
                if "no row" in d:
                    print(f"  unjoined: {d}")
            for x in (x for r in c["rows"] for x in r.get("left_out", [])):
                print(f"  left out: {x}")
    print(kids_table(charts))
    for a, b, on, *keys in COMPARISONS:
        print(compare(find(charts, *a), find(charts, *b), on, *keys))
    if "--write" in sys.argv:
        write_json(charts, HERE / "brands.json")
        write_deltas_csv(charts, HERE / "deltas.csv")
        (HERE / "deltas.md").write_text(
            f"<!-- written by brands.py, {DATE}: the first table is pasted into docs/research/shoe-sizes-2.md §9 between its markers; edit the keepers, never this -->\n\n"
            f"## The product's charts\n\n{product_md}\n## The product's kids' charts\n\n{kids_table(charts)}\n## Every other adult chart kept\n\n{rest_md}\n",
            encoding="utf-8",
            newline="\n",
        )
        print("written: brands.json, deltas.csv, deltas.md")


if __name__ == "__main__":
    main()
