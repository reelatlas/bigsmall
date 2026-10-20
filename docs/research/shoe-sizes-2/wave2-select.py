"""Selects wave 2's rows into wave2-check.csv (docs/research/shoe-sizes-2.md §4, the checkers).

Three checkers. A and B get cells and claims from the workers' charts.csv and claims.csv
(brands-a, brands-b), each cell copied exactly as the worker recorded it, with the page to
re-download and what to confirm; C gets cells from Sean's manual capture (manual/brand-charts.json)
against the sources he kept beside it (manual/sources/<brand>/), and its quirks as claims. The
checkers never see the workers' notes or the capture's README: this file is all they get.

    python -I -X utf8 wave2-select.py
"""
import csv
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
COLS = ["id", "checker", "brand", "kind", "source", "chart", "row", "column", "value", "worker", "check"]
out: list[dict] = []
counts = {"A": 0, "B": 0, "C": 0}


def add(checker, brand, kind, source, chart, row, column, value, worker, check):
    counts[checker] += 1
    out.append(
        {
            "id": f"{checker}{counts[checker]:02}",
            "checker": checker,
            "brand": brand,
            "kind": kind,
            "source": source,
            "chart": chart,
            "row": row,
            "column": column,
            "value": "" if value is None else str(value),
            "worker": worker,
            "check": check,
        }
    )


# ---- the workers' charts and claims --------------------------------------------------------

def load_charts(worker):
    rows = list(csv.DictReader(open(ROOT / worker / "charts.csv", encoding="utf-8", newline="")))
    charts = {}
    for r in rows:
        key = (r["brand"], r["site"], r["chart"])
        chart = charts.setdefault(key, {"url": r["url"], "tool": r["tool"], "rows": {}})
        chart["rows"].setdefault(r["row"], {})[r["column"]] = r["value"]
    return charts


def load_claims(worker):
    return list(csv.DictReader(open(ROOT / worker / "claims.csv", encoding="utf-8", newline="")))


CHARTS = {w: load_charts(w) for w in ("brands-a", "brands-b")}
CLAIMS = {w: load_claims(w) for w in ("brands-a", "brands-b")}


def find_chart(worker, brand, site_part, chart_part):
    hits = [
        k for k in CHARTS[worker] if k[0] == brand and site_part in k[1] and chart_part in k[2]
    ]
    if len(hits) > 1:
        hits = [k for k in hits if k[2] == chart_part] or hits
    if len(hits) != 1:
        raise SystemExit(f"chart {brand} | {site_part} | {chart_part}: {len(hits)} hits {hits}")
    return hits[0]


def same(a, b):
    a, b = str(a).strip(), str(b).strip()
    if a == b:
        return True
    try:
        return abs(float(a) - float(b)) < 1e-9
    except ValueError:
        return False


def cells(checker, worker, brand, site_part, chart_part, columns, where=None, rows="ends", check=""):
    """Cells of one chart: `where` = (column, value) names a row; else first, middle, last rows."""
    key = find_chart(worker, brand, site_part, chart_part)
    chart = CHARTS[worker][key]
    order = sorted(chart["rows"], key=int)
    if where:
        picked = [r for r in order if same(chart["rows"][r].get(where[0], ""), where[1])]
        if not picked:
            raise SystemExit(f"{key}: no row where {where[0]} = {where[1]}")
        picked = picked[:1]
    elif rows == "ends":
        picked = sorted({order[0], order[len(order) // 2], order[-1]}, key=int)
    else:
        picked = list(rows)
    tool = chart["tool"]
    flag = " The worker read this page through the harness's fetcher (a script was refused): re-read it the same way, and from the worker's saved copy named in the brief only if the fetcher fails, saying so." if "fetcher" in tool.lower() or "WebFetch" in tool else ""
    for r in picked:
        for c in columns:
            if c not in chart["rows"][r]:
                raise SystemExit(f"{key} row {r}: no column {c!r}; has {list(chart['rows'][r])}")
            add(checker, brand, "cell", chart["url"], key[2] + f" [{key[1]}]", r, c, chart["rows"][r][c], worker, check + flag)


BRANDS = ["Nike", "Asics", "Converse", "Puma", "Reebok", "Skechers", "Under Armour", "Clarks", "Dr. Martens", "Birkenstock", "Crocs", "Salomon", "Brooks"]


def claim(checker, worker, number, check):
    row = CLAIMS[worker][number - 1]
    brand = next((b for b in BRANDS if b in row["claim"][:40]), row["claim"].split(" ")[0])
    add(checker, brand, "claim", row["url"], "", "", "", row["claim"], worker, check + f' The worker quoted: "{row["exact_words"][:300]}".')


# ---- Checker A: brands-a ----------------------------------------------------------------------

A = "brands-a"
cells("A", A, "Nike", "nike.com/us", "Men's Footwear", ["Foot Length (cm)", "EU", "UK"], check="Re-download the page; the chart is in its embedded JSON (__NEXT_DATA__) and the rendered table alike; confirm each cell at this row.")
cells("A", A, "Nike", "nike.com/us", "Men's Footwear", ["CM / JP", "Foot Length (cm)"], where=("US - Men", "9"), check="The CM/JP label and the foot length at US men's 9 are two different figures on the page: confirm both as recorded.")
cells("A", A, "Nike", "nike.com/us", "Big Kids", ["Foot Length (cm)", "CM / JP"], check="Confirm the foot length and the CM/JP label at this row of the Big Kids chart.")
cells("A", A, "Nike", "nike.com/gb", "Men's Footwear", ["Foot length (cm)", "EU"], where=("US—Men", "9"), check="The GB chart's cells at US men's 9: confirm, and say whether they equal the US chart's.")
claim("A", A, 1, "Find the page's own sentence saying the CM/JP size on boxes differs from foot length; quote it.")
claim("A", A, 2, "Find the between-sizes advice on the page; quote it.")
cells("A", A, "Asics", "asics.com/nz", "Men's/Unisex Shoe Sizes", ["CM", "EU", "UK"], check="Re-download the NZ size guide and confirm each cell at this row.")
claim("A", A, 44, "Find a quarter-centimetre CM value (25.75, 28.25, or 30.75) on the NZ chart and say which row carries it.")
cells("A", A, "Asics", "asics.com/sg", "Men's/Unisex Sizes", ["CM", "EU", "UK"], check="Confirm each cell at this row, and that the four values sit on one row of the page.")
claim("A", A, 45, "Confirm the NZ and SG differences named: SG lists 4H and 14H, NZ lists 16; women's US 5 is 22 cm in NZ and 22.5 in SG.")
cells("A", A, "Converse", "converse.ca", "Men - Chuck Taylor All Star", ["cm", "UK", "EU", "US Women's"], where=("US Men's", "9"), check="Re-download converse.ca's size guide and confirm the Chuck Taylor men's row at US 9.")
cells("A", A, "Converse", "converse.ca", "Men - Standard Sneakers", ["cm", "UK", "EU", "US Women's"], where=("US Men's", "9"), check="Confirm the Standard Sneakers men's row at US 9; say by how much its cm differs from the Chuck Taylor row's.")
claim("A", A, 48, "Find the page's words on Chuck Taylor running large and sizing down; quote them.")
cells("A", A, "Puma", "au.puma.com", "Men's shoes", ["Length cm", "EU", "UK"], check="Re-download the AU size guide and confirm each cell at this row.")
claim("A", A, 39, "Confirm the AU kids chart prints EU 3.5 at Youth US 6.5, as a typo recorded as printed.")
cells("A", A, "Puma", "eu.puma.com/de/en", "Women's shoes", ["UK", "FR", "DE"], where=("US", "7"), check="Re-download eu.puma.com/de/en's size guide and confirm the women's row at US 7.")
cells("A", A, "Puma", "eu.puma.com/en_GB", "women's shoes", ["UK", "FR", "DE"], where=("US", "7"), check="Re-download eu.puma.com/en_GB's size charts and confirm the women's row at US 7; say whether it differs from the de/en page's.")
claim("A", A, 41, "Confirm the AU against EU difference for women at US 7: AU UK 4.5, EU 37.5, 23.5 cm; EU de/en UK 4, EU 37.")
cells("A", A, "Reebok", "reebok.ca", "Men's and Women's Footwear Size Chart", ["Heel-toe measurement", "US - Men"], where=("US - Women", "7.5"), check="Confirm the heel-toe inches printed at US women's 7.5 (the worker calls 9\" a typo between 8.8\" and 9.2\").")
cells("A", A, "Reebok", "reebok.ca", "Unisex Footwear Size Chart", ["Heel-toe measurement", "US - Women"], where=("US - Men", "4.5"), check="Confirm the heel-toe inches printed at US men's 4.5 on the unisex chart.")
cells("A", A, "Reebok", "reebok.com", "Unisex Shoe Size Guide", ["U.S. Women Size", "Heel-Toe Measurement (in)"], where=("U.S. Men Size", "2"), check="Confirm the women's size and the inches at US men's 2 on the Unisex Shoe Size Guide.")
cells("A", A, "Reebok", "reebok.com", "Special Unisex", ["U.S. Women Size", "Heel-Toe Measurement (in)"], where=("U.S. Men Size", "2"), check="Confirm the women's size and the inches at US men's 2 on the Special Unisex guide; the two guides should differ (3.5 against 3).")
claim("A", A, 29, "Find the page's words that the measurement is the foot's, heel to longest toe, the larger foot; quote them.")
cells("A", A, "Skechers", "skechers.com/us", "Men's", ["USA", "EU"], rows=["6", "7", "8"], check="Confirm the EU cells at US 9, 9.5, and 10 on the US men's chart (the worker found 42.5 three times).")
cells("A", A, "Skechers", "skechers.co.uk", "Men's", ["USA", "EU"], rows=["6", "7", "8"], check="Confirm the EU cells at US 9, 9.5, and 10 on the UK men's chart (42, 42.5, 43 per the worker).")
claim("A", A, 17, "Confirm which US sizes on the Kids' chart carry the -L suffix and which do not.")
cells("A", A, "Under Armour", "underarmour.com/en-us", "Men's Shoes Size Chart", ["CM", "Euro", "UK"], check="Re-download the US men's chart and confirm each cell at this row.")
cells("A", A, "Under Armour", "underarmour.com/en-us", "Men's Shoes Size Chart", ["Inches", "CM"], where=("US Men", "7"), check="Confirm the inches and the CM at US men's 7 (the worker says 9 11/16 in beside 25 cm, which do not agree).")
cells("A", A, "Under Armour", "underarmour.com/en-us", "Women's Shoes Size Chart", ["CM", "UK"], where=("US Women", "5"), check="Confirm the US women's row at US 5.")
cells("A", A, "Under Armour", "underarmour.co.uk/en-gb", "Women's Shoes Size Chart", ["CM", "UK"], where=("US Women", "5"), check="Confirm the UK site's women's row at US 5; say whether it differs from the US site's (the worker: 22 cm and UK 2.5 against 22.5 and 3).")
claim("A", A, 21, "Find the page's words that the CM column is the true foot measured heel to toe; quote them.")

# ---- Checker B: brands-b ----------------------------------------------------------------------

B = "brands-b"
cells("B", B, "Clarks", "clarks.com/en-gb", "Mens Clarks Shoe Sizes", ["Clarks EU Size", "Standard EU Size", "Foot Length (Millimetres)(MMs)"], where=("Clarks UK Size", "10"), check="Re-download the GB fit guide and confirm the men's row at UK 10, both EU columns and the length.")
cells("B", B, "Clarks", "clarks.com/en-gb", "Womens Clarks Shoe Sizes", ["Foot Length (Millimetres)(MMs)", "Clarks EU Size"], where=("Clarks UK Size", "5"), check="Confirm the women's length at UK 5.")
cells("B", B, "Clarks", "clarks.com/en-gb", "Kids & Babies", ["Foot Length (Millimetres)(MMs)", "Clarks EU Size"], where=("Clarks UK Size", "5"), check="Confirm the kids' length at UK 5; it should differ from the women's by a millimetre.")
claim("B", B, 19, "Find the page's words that the mm chart does not match measuring with a Clarks foot gauge; quote them.")
cells("B", B, "Clarks", "clarks.com/en-us", "Men's Shoe Size Chart", ["Foot Length (IN)", "UK Size"], check="Re-download the US men's fit guide and confirm each cell at this row.")
claim("B", B, 26, "Find the US page's advice on sizing up for swelling; quote it.")
cells("B", B, "Clarks", "clarks.com.au", "Womens", ["US", "CM", "EU"], where=("UK", "4"), check="Re-download the AU size guide and confirm the women's row at UK 4.")
cells("B", B, "Dr. Martens", "drmartens.com/us", "Women's and Men's", ["Foot length", "EU", "US Men's", "US Women's"], where=("UK", "6.5"), check="A half-size row with a blank: confirm which column is blank on the page and the other cells' values.")
cells("B", B, "Dr. Martens", "drmartens.com/us", "Women's and Men's", ["Foot length", "EU", "US Men's", "US Women's"], where=("UK", "9.5"), check="The other half-size row with a blank: confirm which column is blank and the other cells.")
cells("B", B, "Dr. Martens", "drmartens.com/us", "Women's and Men's", ["Foot length", "EU", "US Men's"], where=("UK", "7"), check="Confirm the row at UK 7, and that the 'Foot length' column carries no unit in its heading.")
cells("B", B, "Dr. Martens", "drmartens.com/dk", "DR. MARTENS SIZING GUIDE", ["EUR", "US MEN", "JAPAN"], where=("UK", "7"), check="Confirm the DK/EU page's row at UK 7.")
claim("B", B, 42, "Find the page's words on sizes differing by silhouette; quote them.")
cells("B", B, "Birkenstock", "birkenstock.com/us", "Size Conversion Chart: Women", ["U.S. Size"], where=("BIRKENSTOCK Size", "37"), check="Re-download the US fit guide and confirm the US sizes printed against BIRKENSTOCK size 37.")
cells("B", B, "Birkenstock", "birkenstock.com/us", "Size Conversion Chart: Men", ["U.S. Size"], where=("BIRKENSTOCK Size", "43"), check="Confirm the US sizes printed against BIRKENSTOCK size 43 on the men's chart.")
claim("B", B, 1, "Find the US page's formula (women's US + 31, men's US + 33) in its own words; quote it.")
cells("B", B, "Birkenstock", "birkenstock.com/gb", "Adults: UK sizes", ["Length From", "Length To"], where=("Size", "7"), check="Re-download the GB size chart and confirm the mm range at UK size 7 (the chart's sizes are UK, written with a comma decimal).")
cells("B", B, "Birkenstock", "printable template", "PRINTABLE SIZING TEMPLATE", ["MM", "US Ladies", "US Men", "UK"], where=("EU", "40"), check="Re-download the template PDF into your own downloads folder and read its size table yourself: confirm the MM, UK, and both US values on the EU 40 row; the worker inferred which US column is which from the text layer, so say what the PDF's layout shows.")
cells("B", B, "Crocs", "default.json", "Adults", ["Heel to Toe Length (Centimeters)", "Heel to Toe Length (mm)", "EU", "UK Men", "US Women"], where=("US Men", "10"), check="Re-download crocs.com/size-chart/default.json and confirm the adults' row at US men's 10, both length fields included (the worker found the cm and the mm about a centimetre apart).")
claim("B", B, 35, "Confirm the page loads region files, and say, from the page's HTML or script, which of the two length fields (cm, mm) the rendered chart displays.")
cells("B", B, "Crocs", "default.json", "Kids", ["EU", "Korea"], where=("US", "C6"), check="Confirm the kids' EU and Korea at C6 in default.json, and compare gb.json's same row (the worker: default EU 21-22, gb 22-23).")
claim("B", B, 31, "Find Crocs' words that the length is the foot's, heel to toe, traced; quote them.")
cells("B", B, "Salomon", "salomon.com/en-us", "Unisex Footwear", ["FOOT LENGTH (CM)", "EUR", "US", "JP"], where=("UK", "9"), check="Re-download salomon.com/en-us/sizingchart (the chart sits in the page's Next.js flight data) and confirm the unisex row at UK 9; JP should be the foot length plus 0.5.")
claim("B", B, 57, "Find Salomon's measuring words (socks on, heel against a wall, the longer foot); quote them.")
claim("B", B, 58, "Find the wide-foot advice (add half a size); quote it.")
cells("B", B, "Salomon", "sg.salomon.com", "Men Size Guide", ["US", "FOOT LENGTH (CM)", "EUR"], where=("UK", "14.5"), check="Re-download sg.salomon.com's men's size guide and confirm its last row at UK 14.5.")
cells("B", B, "Brooks", "support.brooksrunning.com.au", "Size Conversion Chart", ["US Women", "UK Men", "UK Women", "Europe Unisex", "Japan Men (cm)", "Japan Women (cm)"], where=("US Men", "9"), check="Re-download the Brooks Australia help-centre chart and confirm the row at US men's 9.")
claim("B", B, 16, "Confirm the Japan columns' repeats and skips named (Japan Men 23 at US M 4 and 4.5, 25 at 6.5 and 7; Japan Women 27 to 28 between W 10 and 10.5).")
claim("B", B, 12, "Find the page's words that a measure only approximates shoe size and that lasts differ; quote them.")

# ---- Checker C: the manual capture against Sean's sources ----------------------------------------

MANUAL = json.load(open(ROOT / "manual/brand-charts.json", encoding="utf-8"))["brands"]
SRC = "manual/sources"


def index_where(table, field, value):
    for i, x in enumerate(table[field]):
        if x is not None and same(x, value):
            return i
    raise SystemExit(f"no row where {field} = {value}")


def manual(brand_key, brand, table_key, where, fields, sources, check):
    """A table of the capture: `charts.<key>`, or `widths/<key>` for a brand's width tables."""
    group, _, name = table_key.partition("/") if "/" in table_key else ("charts", "", table_key)
    table = MANUAL[brand_key][group][name]
    i = index_where(table, where[0], where[1])
    for f in fields:
        if f not in table:
            raise SystemExit(f"{brand_key}.{table_key}: no field {f}")
        add("C", brand, "cell", sources, f"{name} (manual/brand-charts.json brands.{brand_key}.{group}.{name})", str(i), f, table[f][i], "manual", check)


def quirk(brand_key, brand, text, sources, check):
    add("C", brand, "claim", sources, "", "", "", text, "manual", check)


s = f"{SRC}/adidas/pasted-text.txt; {SRC}/adidas/screenshot-01.png to -06.png"
manual("adidas", "adidas", "adult", ("us_men", 10), ["heel_toe_cm", "heel_toe_in", "eu_label", "uk", "jp", "us_women"], s, "The adult chart's column at US men's 10: confirm every value against the pasted adult table (the men's and women's pages print the same table) and a screenshot of it.")
manual("adidas", "adidas", "adult", ("us_men", 17), ["heel_toe_cm", "heel_toe_in"], s, "Above US men's 15 the inch and cm columns do not agree (13.0 in beside 32.6 cm): confirm both are printed so.")
manual("adidas", "adidas", "kids_4_7", ("us", "1"), ["heel_toe_cm", "uk", "eu"], s, "The kids 4-7 column at US 1: confirm against the pasted kids cm table.")
s = f"{SRC}/new-balance/size-guide-page-text.txt; {SRC}/new-balance/Size_Guide_-_New_Balance.pdf; {SRC}/new-balance/width-guide-page-text.txt; {SRC}/new-balance/Size_Guide_width_-_New_Balance.pdf; {SRC}/new-balance/screenshot-01.png to -05.png (the printable tools)"
manual("new_balance", "New Balance", "men", ("us_men", 9.5), ["us_women", "heel_toe_cm", "heel_toe_in_label", "uk", "eu"], s, "The men's/unisex chart's row at US men's 9.5: confirm against the size-guide page text and the PDF.")
manual("new_balance", "New Balance", "women", ("us_women", 9.5), ["us_men", "heel_toe_cm", "uk", "eu"], s, "The women's chart's row at US women's 9.5: confirm; it should give 26.5 cm and EU 41 where the men's chart's women's column gives 26.0 and 41.5 for the same size.")
manual("new_balance", "New Balance", "kids_4_8", ("us_kids", 2.5), ["uk", "heel_toe_cm", "eu"], s, "Little Kid US 2.5: confirm the UK value printed (the capture records '5' as a site typo where the pattern says 2).")
manual("new_balance", "New Balance", "widths/men", ("us_men", 10), ["w_D_cm", "w_D_in_label", "w_2E_cm"], s, "The width guide at US men's 10: confirm the Standard D and Wide 2E ball widths against the width-guide page text.")
s = f"{SRC}/vans/pasted-text.txt; {SRC}/vans/screenshot-01.png to -12.png"
manual("vans", "Vans", "adult", ("us_men", 10), ["us_women", "uk", "eu", "jp", "heel_toe_in", "heel_toe_cm"], s, "The unisex adult row at US men's 10: confirm against the pasted inch and cm tables.")
manual("vans", "Vans", "toddlers", ("us_kids", "10C"), ["heel_toe_in", "heel_toe_cm", "uk", "eu"], s, "Toddlers 10C: confirm the inch and cm printed (the capture says 6.2 in beside 16 cm).")
manual("vans", "Vans", "youth", ("us_youth", 3.5), ["heel_toe_cm", "uk", "eu"], s, "Youth 3.5: confirm against the pasted youth table.")
s = f"{SRC}/ugg/pasted-text.txt; {SRC}/ugg/screenshot-01.png to -09.png; the kids PDF guide is {SRC}/ugg/screenshot-10.png"
manual("ugg", "UGG", "women", ("us_women", 8), ["heel_toe_in", "uk", "eu", "jp", "cn"], s, "The women's row at US 8: confirm against the pasted women's table.")
manual("ugg", "UGG", "men", ("us_men", 7), ["heel_toe_in", "uk", "eu", "jp"], s, "The men's row at US 7: confirm; its EU should be a size above the women's at the same length (40 against 39).")
manual("ugg", "UGG", "all_gender", ("us_men", 7), ["us_women", "eu", "jp"], s, "The all-gender row at US men's 7: confirm, EU included (a third mapping, 39.5 per the capture).")
manual("ugg", "UGG", "baby", ("us_label", "2/3"), ["heel_toe_mm", "eu", "uk", "size"], s, "The baby table's combined size 2/3: confirm it is printed as one row with these values.")
manual("ugg", "UGG", "kids_pdf_guide", ("us_label", "4"), ["eu_label", "heel_toe_cm", "uk", "group"], s, "Read screenshot-10.png (the kids PDF guide) yourself: confirm the toddler size 4 row; the capture was transcribed from the image.")
manual("ugg", "UGG", "women_wide", ("us_label", "8D"), ["ball_width_in", "heel_toe_in", "eu"], s, "The women's wide row at 8D: confirm against the pasted wide table.")
s = f"{SRC}/hoka/pasted-text.txt (inch cells wrap over two lines); {SRC}/hoka/screenshot-01.png to -22.png"
manual("hoka", "HOKA", "women", ("us_women", 8), ["heel_toe_in_label", "heel_toe_cm", "jp", "eu_label", "uk", "w_regular_mm"], s, "The women's regular column at US 8: confirm, the inch fraction read across its two pasted lines and against a screenshot.")
manual("hoka", "HOKA", "men", ("us_men", 10), ["heel_toe_in_label", "heel_toe_cm", "jp", "eu_label", "uk", "w_regular_mm", "w_regular_in_label"], s, "The men's regular column at US 10: confirm; the capture says the men's regular width inch row is about 4 mm wider than its mm row on every column.")
manual("hoka", "HOKA", "women", ("us_women", 9), ["uk", "uk_wide_chart_as_published"], s, "At US women's 9 the Wide table prints UK 6.5 where the Regular table prints 7.5, per the capture: confirm both from the screenshots or the pasted text.")
quirk("hoka", "HOKA", "The all-gender Regular table has 22 size columns (M4/W5 to M15/W16, with a gap M14 to M15) but only 21 length and width values, left-aligned, so M4/W5 shows 23.0 cm (the men's table's US 5 value) and M15/W16 has no length; its label at M7½ reads 'M7½/W88½'.", s, "Count the size columns and the length values on the all-gender regular table in the screenshots and the pasted text yourself; say whether the values are left-aligned as described and what M4/W5 shows.")
manual("hoka", "HOKA", "kids", ("us_youth", 3.5), ["heel_toe_cm", "heel_toe_in"], s, "Kids youth 3.5: confirm against the pasted kids table.")
s = f"{SRC}/timberland/pasted-text.txt (each table twice, inch then cm); {SRC}/timberland/screenshot-01.png to -18.png"
manual("timberland", "Timberland", "men", ("us_men", 10), ["eu", "uk", "heel_toe_in", "heel_toe_cm"], s, "The men's row at US 10: confirm against both pasted copies (inch and cm).")
manual("timberland", "Timberland", "women", ("us_women", 8), ["eu", "uk", "heel_toe_cm"], s, "The women's row at US 8: confirm; at 25 cm the women's EU and UK should sit below the men's (39 and 6 against 40 and 6.5).")
manual("timberland", "Timberland", "pro_women", ("us_women", 5), ["heel_toe_in", "heel_toe_cm", "eu", "uk"], s, "PRO women's US 5: confirm the inch and the cm as printed (8.5 in beside 22.5 cm per the capture, which do not agree).")
manual("timberland", "Timberland", "junior", ("us_kids", 4), ["eu", "uk", "heel_toe_cm"], s, "Junior US 4: confirm against the pasted junior table.")
manual("timberland", "Timberland", "toddler", ("us_kids", 4.5), ["heel_toe_cm", "heel_toe_in", "eu"], s, "Toddler 4.5: confirm the cm repeats the size before (12) while the inches differ.")
s = f"{SRC}/on/pasted-text.txt; {SRC}/on/screenshot-01.png to -06.png"
manual("on", "On", "men", ("us_men", 10), ["br", "mx", "eu", "jp", "uk"], s, "The men's row at US 10: confirm against the pasted men's table and a screenshot.")
manual("on", "On", "men", ("us_men", 8.5), ["br"], s, "At men's 8.5 the BR column reads N/A on the site, stored as null: confirm.")
manual("on", "On", "women", ("us_women", 8), ["br", "mx", "eu", "jp", "uk"], s, "The women's row at US 8: confirm; at the same length the women's EU should sit a size below the men's.")
manual("on", "On", "kids", ("us_kids", 1), ["heel_toe_cm", "heel_toe_in", "eu", "uk", "br"], s, "The kids row at US 1: confirm against the pasted kids cm and inch tables.")
quirk("on", "On", "The panel text says 'True to size' for all three charts and gives no adult measuring instructions.", s, "Confirm from the pasted text or the screenshots.")

# ---- write ---------------------------------------------------------------------------------------

with open(ROOT / "wave2-check.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=COLS)
    w.writeheader()
    w.writerows(out)
print({k: v for k, v in counts.items()}, "rows:", len(out))
