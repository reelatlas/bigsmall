"""
The Shoe size strings inventory (docs/research/strings-1.md, the strings and states pass, the dry
run of the launch inventory): every piece of text Shoe size shows, by surface, with the words as
the product shows them today, where each shows, and the file that holds it.

The inventory is data, here: each item names its file and a literal the generator asserts is
still in that file, so a string changed in code fails this script until the inventory follows.
The scales' names, symbols, notes, and sources and the brands' names, sites, and facts are read
from core's own files; the charts' spans and cells from `packages/core/data/shoe-brands.json`;
the About page's lines from the built site (`apps/web/dist/about/index.html`), kept in
`about-lines.json` for a run without a build. The examples' sizes are illustrative; the words
are exact.

Writes `inventory.html`, the page for Sean's eye (published as an artifact; his words save to
its store as he types), and pastes §3's table into docs/research/strings-1.md between
`<!-- inventory.py: table -->` and `<!-- /inventory.py -->`.

Run from anywhere: python -X utf8 -I docs/research/strings-1/inventory.py
"""

from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
DOC = ROOT / "docs" / "research" / "strings-1.md"
PAGE = HERE / "inventory.html"
ABOUT_CACHE = HERE / "about-lines.json"
MARK_OPEN = "<!-- inventory.py: table -->"
MARK_CLOSE = "<!-- /inventory.py -->"


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


# --- core: the scales -------------------------------------------------------------------------

SHOE_TS = "packages/core/src/units/shoe-size.ts"
shoe = read(SHOE_TS)

consts: dict[str, str] = {}
for m in re.finditer(r"^const (\w+) = (?:'([^']*)'|`([^`]*)`);$", shoe, re.M):
    name, plain, template = m.groups()
    value = plain if plain is not None else template
    value = re.sub(r"\$\{(\w+)\}", lambda k: consts[k.group(1)], value)
    consts[name] = value

category_note = re.search(r"^  note: '(.*)',$", shoe, re.M).group(1)
category_aliases = re.findall(
    r"'([^']*)'|\"([^\"]*)\"",
    re.search(r"^  aliases: \[(.*?)\],$", shoe, re.M | re.S).group(1),
)
category_aliases = [a or b for a, b in category_aliases]


def unit_blocks(text: str) -> list[dict]:
    starts = list(re.finditer(r"^    id: '([^']+)',$", text, re.M))
    units = []
    for n, m in enumerate(starts):
        end = starts[n + 1].start() if n + 1 < len(starts) else len(text)
        block = text[m.start() : end]

        def field(key: str) -> str | None:
            found = re.search(r"^    %s: '(.*)',$" % key, block, re.M)
            return found.group(1) if found else None

        source = re.search(r"^    source: (\w+),$", block, re.M).group(1)
        aliases = re.search(r"aliases: \[(.*?)\]", block, re.S).group(1)
        aliases = [a or b for a, b in re.findall(r"'([^']*)'|\"([^\"]*)\"", aliases)]
        units.append(
            {
                "id": m.group(1),
                "name": field("name"),
                "plural": field("plural"),
                "symbol": field("symbol"),
                "note": field("note"),
                "source": consts[source],
                "aliases": aliases,
            }
        )
    return units


UNITS = unit_blocks(shoe)
U = {u["id"]: u for u in UNITS}
assert len(UNITS) == 10, len(UNITS)

# --- core: the brands -------------------------------------------------------------------------

BRANDS_TS = "packages/core/src/units/shoe-brands.ts"
brands_ts = read(BRANDS_TS)
BRANDS = []
for m in re.finditer(
    r"brand\('([^']+)', '([^']+)', '([^']+)', \[([^\]]*)\](?:, \{(.*?)\})?\)", brands_ts, re.S
):
    bid, name, site, aliases, options = m.groups()
    options = options or ""
    fact = re.search(r"fact: '([^']*)'", options)
    minus = re.search(r"labelMinusCm: (\d+)", options)
    BRANDS.append(
        {
            "id": bid,
            "name": name,
            "site": site,
            "fact": fact.group(1) if fact else None,
            "labelMinusCm": int(minus.group(1)) if minus else None,
        }
    )
B = {b["id"]: b for b in BRANDS}
assert len(BRANDS) == 20, len(BRANDS)

# --- the charts -------------------------------------------------------------------------------

CHARTS = json.loads(read("packages/core/data/shoe-brands.json"))["charts"]
chart_count = sum(len(charts) for charts in CHARTS.values())


def chart_of(brand: str, line: str) -> dict | None:
    return next((c for c in CHARTS[brand] if c["line"] == line), None)


def adults_chart(brand: str) -> dict:
    return chart_of(brand, "men") or chart_of(brand, "unisex") or CHARTS[brand][0]


def fmt(value) -> str:
    if isinstance(value, list):
        return "–".join(fmt(v) for v in value)
    return str(int(value)) if float(value).is_integer() else str(value)


def poss(name: str) -> str:
    return name + ("’" if name.endswith("s") else "’s")


MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def month_year(iso: str) -> str:
    year, month = iso.split("-")[:2]
    return f"{MONTHS[int(month) - 1]} {year}"


nike_men = chart_of("nike", "men")
nike_kids = chart_of("nike", "kids")
nike_span = (min(r["usMen"] for r in nike_men["rows"]), max(r["usMen"] for r in nike_men["rows"]))
kids_span = (
    min(r["usKids"] for r in nike_kids["rows"] if "usKids" in r),
    max(r["usKids"] for r in nike_kids["rows"] if "usKids" in r),
)
read_month = month_year(nike_men["read"])

puma_men = adults_chart("puma")
puma_nine = next(r for r in puma_men["rows"] if r.get("usMen") == 9)
CELL_ORDER = [
    ("usWomen", "US W"),
    ("usKids", "US C"),
    ("uk", "UK"),
    ("ukKids", "UK C"),
    ("eu", "EU"),
    ("euKids", "EU C"),
    ("jp", "JP"),
]
puma_cells = ", ".join(f"{sym} {fmt(puma_nine[key])}" for key, sym in CELL_ORDER if key in puma_nine)

lacking_jp = [b for b in BRANDS if not any("jp" in r for r in adults_chart(b["id"])["rows"])]
no_jp = next((b for b in lacking_jp if adults_chart(b["id"])["basis"] == "foot"), lacking_jp[0])
no_jp_line = adults_chart(no_jp["id"])["line"]

# --- the About page, as rendered --------------------------------------------------------------


def about_lines() -> dict:
    built = ROOT / "apps" / "web" / "dist" / "about" / "index.html"
    if built.exists():
        text = html.unescape(re.sub(r"<[^>]+>", "\n", built.read_text(encoding="utf-8")))
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        start = next(
            n for n, line in enumerate(lines) if line.startswith(f"{len(UNITS)} units in Mondopoint")
        )
        summary = lines[start]
        body = []
        rest = lines[start + 1 :]
        for n, line in enumerate(rest):
            following = rest[n + 1] if n + 1 < len(rest) else ""
            if line.startswith("Visits are counted"):
                break
            # The next category's name line comes right before its own summary.
            if re.match(r"^\d+ (units in|ingredients)", following):
                break
            body.append(line)
        assert len(body) % 4 == 0, len(body)
        groups = [body[n : n + 4] for n in range(0, len(body), 4)]
        data = {"summary": summary, "lines": groups, "from": "apps/web/dist/about/index.html"}
        ABOUT_CACHE.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        return data
    return json.loads(ABOUT_CACHE.read_text(encoding="utf-8"))


ABOUT = about_lines()
about_by_name = {name: (formula, basis, source) for name, formula, basis, source in ABOUT["lines"]}
assert len(ABOUT["lines"]) == len(UNITS) + chart_count, (len(ABOUT["lines"]), chart_count)


def about_line(name: str) -> str:
    formula, basis, source = about_by_name[name]
    return f"{name} · {formula} · {basis} · {source}"


# --- the items --------------------------------------------------------------------------------

STATE = "apps/web/src/features/converter/state.ts"
TABLE = "apps/web/src/components/ConversionTable.tsx"
LAYOUT = "apps/web/src/features/converter/TableLayout.tsx"
CHIP = "apps/web/src/components/UnitChip.tsx"
FIELD = "apps/web/src/components/ValueField.tsx"
MATCHES = "apps/web/src/components/UnitMatches.tsx"
SETTINGS = "apps/web/src/features/converter/settings.ts"
FETCH = "apps/web/src/features/converter/useBrandCharts.ts"
FORMULAS = "apps/web/src/features/formulas/formulas.ts"
FORMULAS_PAGE = "apps/web/src/features/formulas/Formulas.astro"
REPORT = "apps/web/src/features/feedback/report.ts"
URL = "apps/web/src/features/converter/url.ts"

SURFACES = [
    ("The box", "The box at the top of the converter, Shoe size in it; the chips and the pills in it."),
    ("The matches, while typing", "Under the box while a unit or a brand is being typed, in the table's place."),
    ("The scales' rows", "The table under the box: ISO's ten scales, each in its system's section."),
    ("The brands' rows", "One row per brand at the same foot, under the scales, or first while the box holds a brand's size."),
    ("The line above the rows", "Between the box and the table, with a brand in the box, while the whole table waits."),
    ("The line under the table, with a brand", "The note's place under the table once a brand is in the box: facts only, never fit advice."),
    ("The lists in the table's place", "The brand's pill opens every brand; the unit's chip with a brand opens the brand's scales; a brand with no scale shows its scales to choose from."),
    ("The About page, Formulas", "bigsmall.work/about, the Formulas tab, the Shoe size group: a line per scale and per chart, as rendered."),
    ("Elsewhere", "Text that names shoes outside the converter's Shoe size views."),
]

KIND_LABEL = {
    "placeholder": "placeholder",
    "chip": "chip",
    "spoken": "spoken, not shown",
    "list": "a list",
    "heading": "heading",
    "message": "message",
    "row": "rows",
    "status": "status line",
    "note": "note",
    "console": "console only",
    "about": "About page",
    "text": "text",
}


def row(value: str, symbol: str, name: str, detail: str = "") -> dict:
    return {"value": value, "symbol": symbol, "name": name, "detail": detail}


def item(key, surface, where, kind, shown, src, lit=None, flag=None, state="", recommended=None):
    return {
        "key": key,
        "surface": surface,
        "where": where,
        "kind": kind,
        "shown": shown,
        "src": src,
        "lit": lit,
        "flag": flag,
        "state": state,
        # The session's recommended output beside the words as printed, where Sean asked to see both
        # before deciding (the About page's chart lines, 2026-10-21).
        "recommended": recommended,
    }


def chip(uid: str) -> str:
    return f"{U[uid]['symbol']} {U[uid]['name']}"


units_rows = [row("", u["symbol"], u["name"]) for u in UNITS]


def recommended_about(name: str, source: str) -> str:
    """A chart's About line with the source as recommended, its formula and basis as rendered."""
    formula, basis, _source = about_by_name[name]
    return f"{name} · {formula} · {basis} · {source}"


READ = {
    "adidas": chart_of("adidas", "unisex")["read"],
    "nike-men": nike_men["read"],
    "nike-kids": nike_kids["read"],
    "on-men": chart_of("on", "men")["read"],
    "on-kids": chart_of("on", "kids")["read"],
}

# The recommended shape (docs/research/strings-1.md §5, decision 2): the site, then the page in the
# page's own words, then the date read; a composed kids' chart names its pages as one; the rule
# sentence only on a chart whose length is a label; the record keeps its titles and keys in fields
# of its own. Sean keeps the lines as printed on the page beside these, to decide (2026-10-21).
RECOMMENDED_CHARTS = [
    recommended_about(
        "adidas, one chart",
        f"adidas.com, its size chart, read {READ['adidas']}; its length the foot’s.",
    ),
    recommended_about(
        "Nike, the men’s chart",
        f"nike.com, Men's Footwear, read {READ['nike-men']}; its length the foot’s.",
    ),
    recommended_about(
        "Nike, the kids’ chart",
        f"nike.com, Kids' Footwear, its three age bands as one chart (Babies & Toddlers, Little Kids, Big Kids), read {READ['nike-kids']}; its length the foot’s.",
    ),
    recommended_about(
        "On, the men’s chart",
        f"on.com, the Size & Fit panel of its men's shoes, read {READ['on-men']}; its length a size label, not the foot. Its FAQ says its JP label is the foot plus about a centimetre. The foot is read as its centimetre label less 1 cm, the brand’s own rule.",
    ),
    recommended_about(
        "On, the kids’ chart",
        f"on.com, the Size & Fit panel of its kids' shoes, read {READ['on-kids']}; its length the foot’s. Its FAQ says its JP label is the foot plus about a centimetre.",
    ),
]

ITEMS = [
    # The box
    item(
        "box.placeholder",
        "The box",
        "The empty box before a unit, then with one; every category's.",
        "placeholder",
        ["Number or unit", "Number"],
        LAYOUT,
        "? 'Number' : 'Number or unit'",
        state="empty",
    ),
    item(
        "box.chip",
        "The box",
        "The unit's chip: its symbol, then its name; the symbol alone with Symbol only or where the box needs the room. The ten scales' names and symbols are in the scales' rows below.",
        "chip",
        [chip("us-men"), chip("eu"), chip("foot-cm")],
        SHOE_TS,
        None,
        state="a scale in the box",
    ),
    item(
        "box.pill",
        "The box",
        "The brand's pill beside the scale: its name, a chevron, its ×.",
        "chip",
        ["Nike", "New Balance", "Dr. Martens"],
        CHIP,
        None,
        state="a brand in the box",
    ),
    item(
        "box.spoken",
        "The box",
        "The chip's and the pill's spoken labels, their × buttons', and the box's own ×; every category's shape.",
        "spoken",
        ["Unit: US men", "Brand: Nike", "Remove US men", "Remove Nike", "Clear number", "Clear text"],
        [CHIP, FIELD],
        ["`${what}: ${name}`", "`Remove ${name}`", "'Clear text' : 'Clear number'"],
    ),
    # The matches
    item(
        "match.scale",
        "The matches, while typing",
        "A scale matched: its symbol and name as every unit's, the category spoken after it, and “in the box” where it is.",
        "list",
        [row("", "US M", "US men", "(spoken: , Shoe size, in the box)")],
        MATCHES,
        ", in the box",
        state="typing a scale",
    ),
    item(
        "match.brand",
        "The matches, while typing",
        "A brand typed with the size, at either end: one match, the scale's name, a middle dot, the brand's name, the size in the number's place; a bare size at a brand is US men's; a brand alone brings no scale.",
        "list",
        [row("10", "US M", "US men · Nike"), row("8", "US W", "US women · Nike"), row("43", "EU", "European · New Balance"), row("", "", "Nike")],
        MATCHES,
        "secondText(match, ' · ', match.brand.name)",
        state="typing a brand",
    ),
    item(
        "match.group",
        "The matches, while typing",
        "The heading over the matches of a category, with its count; a brand's match sits under Shoe size's.",
        "heading",
        ["Shoe size"],
        MATCHES,
        "match.group) || match.category.name",
    ),
    item(
        "match.category",
        "The matches, while typing",
        "The category's own row among the matches, taking the whole category.",
        "list",
        ["Shoe size  all its units"],
        MATCHES,
        "all its units",
    ),
    item(
        "match.spoken",
        "The matches, while typing",
        "What the live region says of the matches; every category's.",
        "spoken",
        ["3 matches", "1 match", "Only hidden units match", "No unit matches"],
        STATE,
        "'Only hidden units match'",
    ),
    item(
        "match.none",
        "The matches, while typing",
        "In the table's place when a typed unit matches nothing; every category's.",
        "message",
        ["No unit matches “nikee 10”. Try ml, feet, or °F."],
        STATE,
        "Try ml, feet, or °F.",
        state="no match",
    ),
    # The scales' rows
    item(
        "rows.sections",
        "The scales' rows",
        "The sections' headings, by system; every category's. Shoe size's rows fall in these three.",
        "heading",
        ["US (customary)", "UK (imperial)", "Metric"],
        SETTINGS,
        "us: 'US (customary)'",
    ),
    item(
        "rows.units",
        "The scales' rows",
        "The ten scales, each row's symbol and name, in the table's order; named without a possessive (Sean, 2026-10-20).",
        "row",
        units_rows,
        SHOE_TS,
        None,
        state="a scale size",
    ),
    item(
        "rows.approx",
        "The scales' rows",
        "The mark before a size that moved to the half size, and before a brand's nearest row; the box's own row echoes what was typed.",
        "row",
        [row("≈ 44", "EU", "European"), row("27.5", "JP", "Japanese")],
        TABLE,
        None,
    ),
    item(
        "rows.beyond",
        "The scales' rows",
        "A foot past a children's scale: where the scale ends in place of a size, in the muted ink, written as Display writes a size, and after the name where the foot stands; a click takes the scale with the number cleared.",
        "row",
        [row("> 13.5", "US C", "US children", "above its range"), row("< 4", "US C", "US children", "below its range"), row("> 13 1/2", "US C", "US children", "above its range")],
        STATE,
        "'above its range' : 'below its range'",
        state="beyond",
    ),
    item(
        "rows.own-beyond",
        "The scales' rows",
        "A size outside its own scale in the box (US C 20): every other row a dash, a click taking its unit with the number as typed, and the live region saying the scale's span.",
        "row",
        [row("—", "EU", "European"), row("", "", "(spoken: US children runs 4 to 13.5)")],
        STATE,
        "runs ${span}",
        state="outside its own scale",
    ),
    item(
        "rows.spoken",
        "The scales' rows",
        "What the live region says once a size converts: the amount as typed with the unit's name, the row count, and the category; every category's shape.",
        "spoken",
        ["11 US men in 10 units of shoe size", "27 Foot length in 10 units of shoe size"],
        STATE,
        "units of ${kind}",
    ),
    item(
        "rows.note",
        "The scales' rows",
        "The line under the table with no brand in the box: what the sizes rest on and how to anchor.",
        "note",
        [category_note],
        SHOE_TS,
        None,
        flag="The last sentence reads as a measurement where the room is derived (the shoe's inside less the foot the chart assigns); the precise wording is “the charts differ in the foot they give that size” (docs/TESTING.md, 2026-10-21).",
    ),
    item(
        "rows.unit-notes",
        "The scales' rows",
        "A note written in core for each scale.",
        "note",
        [f"{u['name']}: {u['note']}" for u in UNITS],
        SHOE_TS,
        None,
        flag="Shown nowhere in the product today: the About page lists each scale's formula and source, not its note. Show them there, or drop them.",
    ),
    # The brands' rows
    item(
        "brands.heading",
        "The brands' rows",
        "The section's heading, the scale after it following the box's (US W, EU, JP, …).",
        "heading",
        ["Brands, the same foot in US M", "Brands, the same foot in EU"],
        STATE,
        ", the same foot in ",
    ),
    item(
        "brands.heading-waiting",
        "The brands' rows",
        "The heading with no brand in the box while the charts are on their way, and after the fetch failed; no commas in a status line (Sean, 2026-10-21).",
        "status",
        ["Brand charts loading…", "Brand charts not loaded"],
        STATE,
        "'Brand charts loading…'",
        state="loading, failed",
    ),
    item(
        "brands.line",
        "The brands' rows",
        "After a brand's name on EU, UK, JP, mm, and cm, the chart's line where the scale does not say it; nothing on US M and US W; nothing at a brand with one chart for everyone.",
        "row",
        [row("≈ 44", "EU", "Nike", "men"), row("≈ 42", "EU", "Nike", "women"), row("≈ 44", "EU", "adidas")],
        STATE,
        "men: 'men',",
        state="women's",
    ),
    item(
        "brands.kids",
        "The brands' rows",
        "After the name on every scale where the brand's kids' chart answered: a children's size, or a youth size the adults' chart lacks.",
        "row",
        [row("10", "US C", "Nike", "kids"), row("3", "US M", "Nike", "kids")],
        STATE,
        "kids: 'kids',",
        state="kids'",
    ),
    item(
        "brands.rule",
        "The brands' rows",
        "A row filled by the brand's own rule for the foot (On, Asics: the centimetre label less a centimetre).",
        "row",
        [row("≈ 9.5", "US M", "On", "by its own rule"), row("≈ 44", "EU", "Asics", "men · by its own rule")],
        STATE,
        "'by its own rule'",
        state="by its own rule",
    ),
    item(
        "brands.label",
        "The brands' rows",
        "A row filled as ISO's label on the brand's own scale, read through its row (Skechers, Puma, New Balance, Under Armour, Vans).",
        "row",
        [row("≈ 9", "US M", "Puma", "by ISO’s label"), row("≈ 10", "US C", "Puma", "kids · by ISO’s label")],
        STATE,
        "'by ISO’s label'",
        state="by ISO's label",
    ),
    item(
        "brands.no-scale",
        "The brands' rows",
        f"The brand lacks the scale in focus: its size on its own scale, that scale's symbol on the row, the words saying which it lacks ({no_jp['name']} prints no JP).",
        "row",
        [row("≈ 9.5", "US M", no_jp["name"], ("men · " if no_jp_line == "men" else "") + "prints no JP")],
        STATE,
        "`prints no ${scaleUnit.symbol}`",
        state="no scale",
    ),
    item(
        "brands.off",
        "The brands' rows",
        "The foot is past the chart's ends: a dash, and the words; a child's foot asked on a children's scale at a brand with no kids' chart (Brooks) says the line too.",
        "row",
        [row("—", "US M", "Brooks", "off its chart"), row("—", "US C", "Brooks", "men · off its chart")],
        STATE,
        "'off its chart'",
        state="off its chart",
    ),
    item(
        "brands.dash",
        "The brands' rows",
        "Every brand row while the charts load or after the fetch failed, with no words; a brand in the box leaves the scale rows dashes too.",
        "row",
        [row("—", "US M", "adidas"), row("—", "US M", "Asics")],
        STATE,
        "NO_VALUE = '—'",
        state="loading, failed",
    ),
    item(
        "brands.range",
        "The brands' rows",
        "A brand's size printed as a range, its two ends each written as Display writes a size; a printed third stands as printed whatever Display says.",
        "row",
        [row("10–10.5", "US M", "Birkenstock"), row("10–10 1/2", "US M", "Birkenstock", "(with Fraction)"), row("44 2/3", "EU", "adidas", "(as printed)")],
        TABLE,
        None,
        state="a brand size",
    ),
    item(
        "brands.spoken",
        "The brands' rows",
        "What the live region says once a brand's size converts.",
        "spoken",
        ["10 US men at Nike in 10 units of shoe size"],
        STATE,
        "at ${brand.name} in",
    ),
    # The line above the rows
    item(
        "above.loading",
        "The line above the rows",
        "A brand in the box while its chart is on its way: every row a dash and this line above them.",
        "status",
        ["Nike’s chart loading…", "Crocs’ chart loading…"],
        STATE,
        "chart loading…`",
        state="loading",
    ),
    item(
        "above.failed",
        "The line above the rows",
        "A brand in the box after the fetch failed: the rows stay dashes.",
        "status",
        ["Brand charts not loaded. Reload to try again."],
        STATE,
        "'Brand charts not loaded. Reload to try again.'",
        state="failed",
    ),
    item(
        "console.fetch",
        "The line above the rows",
        "Why the fetch failed, in the browser's console alone.",
        "console",
        ["404 fetching the brands’ charts", "The brands’ charts file has another shape."],
        FETCH,
        ["fetching the brands’ charts", "'The brands’ charts file has another shape.'"],
        state="failed",
    ),
    # The line under the table, with a brand
    item(
        "note.chart",
        "The line under the table, with a brand",
        "The first sentence: whose chart, which line where the brand prints its lines apart, where, and when.",
        "note",
        [
            f"Nike’s size chart, the men’s, nike.com, read {read_month}.",
            f"Nike’s size chart, the women’s, nike.com, read {read_month}.",
            f"Nike’s size chart, the kids’, nike.com, read {read_month}.",
            f"adidas’s size chart, adidas.com, read {read_month}.",
        ],
        STATE,
        "size chart${line}, ${brand.site}, read ",
        state="a brand size",
    ),
    item(
        "note.fact",
        "The line under the table, with a brand",
        "The second sentence, at the brands that have one: the fact its chart alone would hide, written in core.",
        "note",
        [f"{b['name']}: {b['fact']}" for b in BRANDS if b["fact"]],
        BRANDS_TS,
        None,
    ),
    item(
        "note.span",
        "The line under the table, with a brand",
        "A size past the chart in the box: its span on that scale.",
        "note",
        [
            f"Nike’s men’s chart runs US M {fmt(nike_span[0])} to {fmt(nike_span[1])}.",
            f"Nike’s kids’ chart runs US C {fmt(kids_span[0])} to {fmt(kids_span[1])}.",
        ],
        STATE,
        "chart runs ${unit.symbol}",
        state="off its chart",
    ),
    item(
        "note.no-scale",
        "The line under the table, with a brand",
        "A scale the chart does not print, in the box.",
        "note",
        [f"{poss(no_jp['name'])} chart prints no Japanese.", "Brooks’ chart prints no US children."],
        STATE,
        "chart prints no ${unit.plural}.",
        flag="The scale's plural stands in for its name: “no Japanese”, “no US children”.",
        state="no scale",
    ),
    item(
        "note.labelled",
        "The line under the table, with a brand",
        "A brand with no foot length, its size read as ISO's label on the same scale, with what it prints for it.",
        "note",
        [f"Puma gives no foot length, so its 9 is read as ISO’s US men 9; it prints {puma_cells} for it."],
        STATE,
        "gives no foot length, so its ",
        state="by ISO's label",
    ),
    item(
        "note.rule",
        "The line under the table, with a brand",
        "A brand read by its own rule.",
        "note",
        ["On gives no foot length; its foot here is its centimetre label less 1 cm, by its own rule."],
        STATE,
        "by its own rule.`",
        state="by its own rule",
    ),
    item(
        "note.length",
        "The line under the table, with a brand",
        "A length typed with a brand that prints no foot length: the row is ISO's label read through the chart.",
        "note",
        ["Puma gives no foot length; its row is ISO’s label for the foot, read through its own chart."],
        STATE,
        "read through its own chart.",
        state="a length",
    ),
    # The lists in the table's place
    item(
        "list.brands",
        "The lists in the table's place",
        "The brand's pill opened: one heading, every brand by name, the one in the box marked; the live region counts them.",
        "list",
        ["Brands", "(spoken: 20 brands to choose from)"],
        STATE,
        ["const BRANDS_HEADING = 'Brands'", "brands to choose from"],
        state="the chooser",
    ),
    item(
        "list.scales-heading",
        "The lists in the table's place",
        "The unit's chip opened with a brand: the brand's scales by chart, the chart in play first, then its other charts, each under its own heading.",
        "heading",
        ["Nike’s chart, the men’s", "Nike’s chart, the women’s", "Nike’s chart, the kids’", "adidas’s chart"],
        STATE,
        "chart${each.line === 'unisex' ? '' : `, the ${LINE_POSS[each.line]}`}",
        state="the chip's headings",
    ),
    item(
        "list.scales-ask",
        "The lists in the table's place",
        "The same list in the table's place while the brand has no scale (its chip emptied, or a brand alone): the heading asks.",
        "heading",
        ["Nike’s chart, the men’s: choose the scale to read it on"],
        STATE,
        ": choose the scale to read it on",
        state="no scale",
    ),
    item(
        "list.scales-entry",
        "The lists in the table's place",
        "Each scale as a row, its symbol and name, with the row's size on it; the one in the box marked; the number as typed where the brand has no row for the box.",
        "list",
        [row("44", "EU", "European"), row("9", "UK", "British"), row("", "US W", "US women")],
        STATE,
        None,
    ),
    item(
        "list.scales-spoken",
        "The lists in the table's place",
        "The live region's count for the chip's list.",
        "spoken",
        ["6 scales of Nike’s chart to choose from", "9 scales of Nike’s charts to choose from"],
        STATE,
        "scales of ${poss(brand.name)} chart",
    ),
    # The About page
    item(
        "about.intro",
        "The About page, Formulas",
        "The tab's one line, over every category.",
        "about",
        ["Each conversion in its category’s base unit and the source it was checked against."],
        FORMULAS_PAGE,
        "Each conversion in its category’s base unit and the source it was checked against.",
    ),
    item(
        "about.summary",
        "The About page, Formulas",
        "After the group's name, closed.",
        "about",
        [ABOUT["summary"]],
        FORMULAS,
        "brands’ charts`",
        flag="Reads as 53 brands; it is 53 charts of 20 brands.",
    ),
    item(
        "about.scales",
        "The About page, Formulas",
        "A line per scale: its name, its formula in Mondopoint, the basis tag, and the source it was checked against.",
        "about",
        [about_line(u["name"]) for u in UNITS],
        FORMULAS,
        "by a table,",
        flag="“mm = (EU + -2) × 6.67” writes a negative offset as “+ -2”; the sign belongs in the formula (“EU − 2”). “mm, the base unit” is Mondopoint's whole formula.",
    ),
    item(
        "about.charts",
        "The About page, Formulas",
        f"A line per chart, {chart_count} in all: the brand and its line, how many sizes and which scales, the basis tag, then the chart's title and source as the record holds them, the date read, what its length is, the brand's fact, and its rule. Five shown.",
        "about",
        [about_line(n) for n in ("adidas, one chart", "Nike, the men’s chart", "Nike, the kids’ chart", "On, the men’s chart", "On, the kids’ chart")],
        FORMULAS,
        ["'one chart'", "'the kids’ chart'", "the brand’s own rule.`"],
        flag="The title and the source print the record's own words: “adult”, “manual: kids_0_3 (…)”, “Kids, composed”, a URL, a page's menu path. On's rule sentence follows its kids' chart too, whose length is the foot's. Kept as it prints at Sean's ask (2026-10-21), the recommended output beside it for his decision: the site, then the page in the page's own words, then the date read; a composed kids' chart names its pages as one; the rule sentence only where the length is a label; the record keeps its titles and keys in fields of its own.",
        recommended=RECOMMENDED_CHARTS,
    ),
    item(
        "about.length-basis",
        "The About page, Formulas",
        "What a chart's length column is, after the date read.",
        "about",
        ["its length the foot’s", "its length the product’s", "its length a size label, not the foot", "no length printed"],
        FORMULAS,
        "'no length printed'",
    ),
    item(
        "about.scale-names",
        "The About page, Formulas",
        "The scales a chart can print, as the About page names them in a chart's line.",
        "about",
        ["US men, US women, UK, UK women, EU, JP, US children, UK children, EU children, the CM label, the foot in mm"],
        FORMULAS,
        "'the CM label'",
    ),
    item(
        "about.copy-all",
        "The About page, Formulas",
        "Copy all's plain text: its opening line, a group's heading, a scale's line, a chart's line.",
        "console",
        [
            "bigsmall: every conversion factor and formula, each with the standard it was checked against (https://bigsmall.work/about/).",
            "## Shoe size (base unit: Mondopoint, mm)",
            "US men (US M): mm = (US M + 22) × 8.47, by convention. Source: …",
            "Nike, the men’s chart: 38 sizes: …, by convention. Source: …",
        ],
        FORMULAS,
        ["## ${category.name} (base unit:", ", by convention. Source: ${source}"],
    ),
    # Elsewhere
    item(
        "feedback.example",
        "Elsewhere",
        "The Feedback form's example for an idea, one of five drawn at random into the empty message.",
        "text",
        ["Add shoe sizes, US to EU"],
        REPORT,
        "'Add shoe sizes, US to EU'",
        flag="Shoe sizes exist now; the example is stale.",
    ),
    item(
        "category.name",
        "Elsewhere",
        "The category's name on the start's tile, in the menu, over the matches, and spoken in the live region; the words that reach it when typed.",
        "text",
        ["Shoe size", "typed: " + ", ".join(category_aliases)],
        SHOE_TS,
        "name: 'Shoe size'",
    ),
    item(
        "url.params",
        "Elsewhere",
        "The address bar: the scale, the number, the brand, and the women's line; not words, listed so nothing is missed.",
        "console",
        ["?a=us-men&v=10&brand=nike", "?a=eu&v=39&brand=nike&line=women"],
        URL,
        "brand: 'brand'",
    ),
]

# --- the literal assertions -------------------------------------------------------------------

sources: dict[str, str] = {}
for it in ITEMS:
    srcs = it["src"] if isinstance(it["src"], list) else [it["src"]]
    lits = it["lit"] if isinstance(it["lit"], list) else ([it["lit"]] if it["lit"] else [])
    for lit in lits:
        found = False
        for src in srcs:
            text = sources.setdefault(src, read(src))
            if lit in text:
                found = True
                break
        if not found:
            sys.exit(
                f"{it['key']}: the literal {lit!r} is in none of {srcs}; the words changed, so the inventory must follow"
            )

# --- the words as text ------------------------------------------------------------------------


def shown_text(it: dict) -> str:
    return variants_text(it["shown"])


def variants_text(variants: list) -> str:
    parts = []
    for variant in variants:
        if isinstance(variant, dict):
            bits = [variant["value"], variant["symbol"], variant["name"]]
            text = " ".join(b for b in bits if b)
            if variant["detail"]:
                text += f"  {variant['detail']}"
            parts.append(f"“{text}”")
        else:
            parts.append(f"“{variant}”")
    return ", ".join(parts)


def md_cell(text: str) -> str:
    return text.replace("|", "\\|").replace("\n", " ")


def table_md() -> str:
    head = "| Key | Where it shows | The words today | Sean's words |\n| --- | --- | --- | --- |\n"
    rows = []
    for it in ITEMS:
        where = f"{it['surface']}: {it['where']}"
        if it["flag"]:
            where += f" Flag: {it['flag']}"
        if it.get("recommended"):
            where += f" Recommended: {variants_text(it['recommended'])}"
        rows.append(f"| `{it['key']}` | {md_cell(where)} | {md_cell(shown_text(it))} |  |")
    return head + "\n".join(rows) + "\n"


def paste(doc: Path, body: str) -> None:
    text = doc.read_text(encoding="utf-8")
    open_at = text.index(MARK_OPEN) + len(MARK_OPEN)
    close_at = text.index(MARK_CLOSE)
    doc.write_text(text[:open_at] + "\n\n" + body + "\n" + text[close_at:], encoding="utf-8")


# --- the page ---------------------------------------------------------------------------------


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def render_shown(it: dict) -> str:
    kind = it["kind"]
    out = []
    for variant in it["shown"]:
        if isinstance(variant, dict):
            detail = f' <span class="detail">{esc(variant["detail"])}</span>' if variant["detail"] else ""
            out.append(
                f'<div class="row"><span class="val">{esc(variant["value"])}</span>'
                f'<span class="sym">{esc(variant["symbol"])}</span>'
                f'<span class="name">{esc(variant["name"])}{detail}</span></div>'
            )
        else:
            out.append(f'<div class="line k-{kind}">{esc(variant)}</div>')
    return "".join(out)


def render_item(it: dict) -> str:
    srcs = it["src"] if isinstance(it["src"], list) else [it["src"]]
    flag = f'<p class="flag">{esc(it["flag"])}</p>' if it["flag"] else ""
    state = f'<span class="state">{esc(it["state"])}</span>' if it["state"] else ""
    spoken = " spoken" if it["kind"] == "spoken" else ""
    key = esc(it["key"])
    recommended = ""
    if it.get("recommended"):
        recommended = (
            '<div class="eyebrow"><span class="kind">Recommended, yours to keep or rework</span></div>'
            '<div class="shown recommended">'
            + "".join(f'<div class="line k-{it["kind"]}">{esc(v)}</div>' for v in it["recommended"])
            + "</div>"
        )
    return (
        f'<article class="item" id="i-{key}">'
        f'<div class="eyebrow"><span class="key">{key}</span>'
        f'<span class="kind">{esc(KIND_LABEL[it["kind"]])}</span>{state}</div>'
        f'<div class="shown{spoken}">{render_shown(it)}</div>'
        f'<p class="meta">{esc(it["where"])} <span class="src">{esc(", ".join(srcs))}</span></p>'
        f"{flag}"
        f"{recommended}"
        f'<label for="w-{key}">Your words</label>'
        f'<textarea id="w-{key}" data-key="{key}" rows="2" placeholder="Empty keeps the words"></textarea>'
        f'<span class="saved" id="s-{key}" aria-live="polite"></span>'
        f"</article>"
    )


def render_sections() -> str:
    out = []
    for n, (name, where) in enumerate(SURFACES, 1):
        items = [it for it in ITEMS if it["surface"] == name]
        if not items:
            continue
        out.append(
            f'<section id="s{n}"><h2>{esc(name)}</h2><p class="where-s">{esc(where)}</p>'
            + "".join(render_item(it) for it in items)
            + "</section>"
        )
    return "".join(out)


TEMPLATE = r"""<title>Shoe size words</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
  /* One reading column, bigsmall's own greys and teal (the Daylight theme's tokens, as the mocks), the
     product's system face; every item: the words as shown, where, and a field for Sean's. */
  :root {
    --bg: #f6f6f2;
    --surface: #ffffff;
    --ink: #1c1c1c;
    --muted: #6f6f6f;
    --line: #e2e2dd;
    --head: #f3f3ef;
    --accent-soft: #c9f5ec;
    --accent: #0f766e;
    --danger: #b4452a;
    --ok: #2a7a3b;
    --sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      --bg: #121212;
      --surface: #1c1c1c;
      --ink: #ececec;
      --muted: #9c9c9c;
      --line: #2e2e2e;
      --head: #232323;
      --accent-soft: #1f4f45;
      --accent: #6fd9c8;
      --danger: #f0917a;
      --ok: #7fcf8f;
      color-scheme: dark;
    }
  }
  :root[data-theme='dark'] {
    --bg: #121212;
    --surface: #1c1c1c;
    --ink: #ececec;
    --muted: #9c9c9c;
    --line: #2e2e2e;
    --head: #232323;
    --accent-soft: #1f4f45;
    --accent: #6fd9c8;
    --danger: #f0917a;
    --ok: #7fcf8f;
    color-scheme: dark;
  }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font: 16px/1.45 var(--sans);
    padding-block: 0 64px;
    padding-left: max(16px, env(safe-area-inset-left, 0px));
    padding-right: max(16px, env(safe-area-inset-right, 0px));
  }
  body::before {
    content: '';
    position: fixed;
    inset: 0 0 auto;
    height: env(safe-area-inset-top, 0px);
    z-index: 10;
    background: var(--bg);
  }
  .top {
    position: sticky;
    top: env(safe-area-inset-top, 0px);
    z-index: 5;
    background: var(--bg);
    border-bottom: 1px solid var(--line);
    padding-block: 10px;
    margin-inline: calc(-1 * max(16px, env(safe-area-inset-left, 0px))) calc(-1 * max(16px, env(safe-area-inset-right, 0px)));
    padding-left: max(16px, env(safe-area-inset-left, 0px));
    padding-right: max(16px, env(safe-area-inset-right, 0px));
  }
  .top .in {
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
  }
  h1 {
    font-size: 1.25rem;
    margin: 0;
    text-wrap: balance;
  }
  .bar {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.875rem;
    color: var(--muted);
    flex-wrap: wrap;
  }
  button {
    font: inherit;
    font-size: 0.875rem;
    min-height: 40px;
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    cursor: pointer;
  }
  button:hover {
    border-color: var(--accent);
  }
  button:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  #flash {
    min-width: 6ch;
  }
  main {
    max-width: 720px;
    margin: 0 auto;
    display: grid;
    gap: 44px;
    padding-top: 20px;
  }
  .lede {
    display: grid;
    gap: 10px;
  }
  .lede p {
    margin: 0;
    max-width: 65ch;
    color: var(--muted);
  }
  .lede nav {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    font-size: 0.875rem;
  }
  a {
    color: var(--accent);
  }
  section {
    display: grid;
    gap: 14px;
  }
  h2 {
    font-size: 1.05rem;
    margin: 0;
  }
  .where-s {
    margin: 0;
    max-width: 65ch;
    color: var(--muted);
  }
  .item {
    display: grid;
    gap: 8px;
    border-top: 1px solid var(--line);
    padding-top: 14px;
  }
  .eyebrow {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    align-items: baseline;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .eyebrow .key {
    font-family: var(--mono);
    text-transform: none;
    letter-spacing: 0;
    color: var(--ink);
    font-size: 0.8125rem;
  }
  .eyebrow .state {
    margin-left: auto;
    background: var(--head);
    border-radius: 999px;
    padding: 1px 8px;
    text-transform: none;
    letter-spacing: 0;
  }
  .shown {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 10px 12px;
    display: grid;
    gap: 6px;
    min-width: 0;
    overflow-x: auto;
  }
  .shown.spoken {
    background: transparent;
    border-style: dashed;
    font-style: italic;
  }
  .shown.recommended {
    border-color: var(--accent);
  }
  .line {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .k-placeholder,
  .k-status,
  .k-note,
  .k-heading {
    color: var(--muted);
  }
  .k-heading {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .k-note {
    font-size: 0.9375rem;
    max-width: 65ch;
  }
  .k-chip {
    display: inline-block;
    justify-self: start;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 2px 10px;
    background: var(--head);
  }
  .k-console,
  .k-about {
    font-size: 0.875rem;
  }
  .k-console {
    font-family: var(--mono);
  }
  .k-message {
    font-weight: 500;
  }
  .row {
    display: grid;
    grid-template-columns: 7ch 4.5ch minmax(0, 1fr);
    gap: 0 12px;
    align-items: baseline;
    font-variant-numeric: tabular-nums;
  }
  .row .val {
    text-align: right;
    white-space: nowrap;
  }
  .row .sym {
    color: var(--muted);
    font-weight: 600;
    font-size: 0.875rem;
  }
  .row .name {
    min-width: 0;
  }
  .row .detail {
    color: var(--muted);
    font-size: 0.875rem;
    margin-left: 0.4em;
  }
  .meta {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--muted);
    max-width: 70ch;
  }
  .meta .src {
    font-family: var(--mono);
    font-size: 0.75rem;
  }
  .flag {
    margin: 0;
    font-size: 0.875rem;
    padding: 8px 10px;
    border-left: 3px solid var(--danger);
    background: var(--head);
    border-radius: 0 6px 6px 0;
    max-width: 65ch;
  }
  label {
    font-size: 0.8125rem;
    color: var(--muted);
  }
  textarea {
    font: inherit;
    font-size: 0.9375rem;
    width: 100%;
    box-sizing: border-box;
    min-height: 44px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    resize: vertical;
  }
  .saved {
    font-size: 0.75rem;
    color: var(--muted);
    min-height: 1em;
  }
  .saved.ok {
    color: var(--ok);
  }
  .saved.err {
    color: var(--danger);
  }
  .general {
    border-top: 1px solid var(--line);
    padding-top: 14px;
    display: grid;
    gap: 8px;
  }
  #clip {
    min-height: 120px;
    font-family: var(--mono);
    font-size: 0.8125rem;
  }
</style>
<header class="top">
  <div class="in">
    <h1>Shoe size words</h1>
    <div class="bar">
      <span id="count" aria-live="polite"></span>
      <span id="mode"></span>
      <button type="button" id="copy">Copy my rewrites</button>
      <span id="flash" aria-live="polite"></span>
    </div>
  </div>
</header>
<main id="main">
  <div class="lede">
    <p>Every piece of text Shoe size shows today, by where it shows: the words as the product writes them, then a field for yours. An empty field keeps the words. What you type saves to this page as you go, and Copy my rewrites puts it on the clipboard for chat. The sizes in the examples are illustrative; the words are exact.</p>
    <nav aria-label="Surfaces">__NAV__</nav>
    <div class="general">
      <label for="w-general">Anything general: rules to keep across the words, or what to change everywhere</label>
      <textarea id="w-general" data-key="general" rows="3" placeholder="For example: no possessives in the rows; every status line without a period"></textarea>
      <span class="saved" id="s-general" aria-live="polite"></span>
    </div>
  </div>
  __SECTIONS__
  <textarea id="clip" hidden aria-label="Your rewrites, as text"></textarea>
</main>
<script>
  (function () {
    var fields = Array.prototype.slice.call(document.querySelectorAll('textarea[data-key]'));
    var count = document.getElementById('count');
    var mode = document.getElementById('mode');
    var flashEl = document.getElementById('flash');
    var local = {
      get: function () {
        try {
          return JSON.parse(localStorage.getItem('shoe-words') || '{}');
        } catch (e) {
          return {};
        }
      },
      set: function (obj) {
        try {
          localStorage.setItem('shoe-words', JSON.stringify(obj));
        } catch (e) {}
      },
    };
    var words = local.get();
    var col = null;
    var writable = true;
    var chains = {};
    var timers = {};

    function tally() {
      var n = fields.filter(function (f) {
        return f.dataset.key !== 'general' && f.value.trim();
      }).length;
      count.textContent = n + ' of ' + (fields.length - 1) + ' rewritten';
    }
    function apply(obj) {
      fields.forEach(function (f) {
        var v = obj[f.dataset.key] || '';
        if (document.activeElement !== f && f.value !== v) f.value = v;
      });
      tally();
    }
    function setMode(text) {
      mode.textContent = text;
    }
    function status(key, text, cls) {
      var el = document.getElementById('s-' + key);
      if (!el) return;
      el.textContent = text;
      el.className = 'saved' + (cls ? ' ' + cls : '');
    }
    function write(key, value) {
      var prev = chains[key] || Promise.resolve();
      var next = prev.then(function () {
        var ref = col.doc(key);
        var op = value.trim() ? ref.set({ words: value, at: new Date().toISOString() }) : ref.delete();
        return op.then(
          function () {
            status(key, value.trim() ? 'Saved' : '', 'ok');
          },
          function (e) {
            if (e && e.code === 'invalid_argument') {
              writable = false;
              setMode('Read-only for you here; use Copy my rewrites');
            }
            status(key, 'Not saved here; it stays in this browser', 'err');
          }
        );
      });
      chains[key] = next.catch(function () {});
    }
    function save(key, value) {
      if (value.trim()) words[key] = value;
      else delete words[key];
      local.set(words);
      tally();
      if (!col || !writable) return;
      status(key, 'Saving…');
      clearTimeout(timers[key]);
      timers[key] = setTimeout(function () {
        write(key, value);
      }, 700);
    }
    fields.forEach(function (f) {
      f.addEventListener('input', function () {
        save(f.dataset.key, f.value);
      });
    });
    apply(words);
    setMode('Kept in this browser');

    function flash(text) {
      flashEl.textContent = text;
      setTimeout(function () {
        flashEl.textContent = '';
      }, 2500);
    }
    function fallback(text) {
      var ta = document.getElementById('clip');
      ta.value = text;
      ta.hidden = false;
      ta.focus();
      ta.select();
      flash('Select and copy the text at the foot');
    }
    document.getElementById('copy').addEventListener('click', function () {
      var lines = fields
        .filter(function (f) {
          return f.value.trim();
        })
        .map(function (f) {
          return f.dataset.key + ': ' + f.value.trim().replace(/\s*\n\s*/g, ' ⏎ ');
        });
      var text = lines.length ? lines.join('\n') : '(no rewrites yet)';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () {
            flash('Copied');
          },
          function () {
            fallback(text);
          }
        );
      } else fallback(text);
    });

    (function () {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      window.claude.use('db').then(function (db) {
        if (!db) return;
        col = db.collection('rewrites');
        setMode('Saving to this page');
        col.onSnapshot(
          function (snap) {
            var obj = {};
            snap.docs.forEach(function (d) {
              var data = d.data();
              if (data && typeof data.words === 'string') obj[d.id] = data.words;
            });
            words = obj;
            local.set(words);
            apply(words);
          },
          function () {
            col = null;
            setMode('Saving is off here; use Copy my rewrites');
          }
        );
      });
    })();
  })();
</script>
"""


def nav_html() -> str:
    return " ".join(
        f'<a href="#s{n}">{esc(name)}</a>'
        for n, (name, _where) in enumerate(SURFACES, 1)
        if any(it["surface"] == name for it in ITEMS)
    )


def main() -> None:
    keys = [it["key"] for it in ITEMS]
    assert len(keys) == len(set(keys)), "a key repeats"
    page = TEMPLATE.replace("__NAV__", nav_html()).replace("__SECTIONS__", render_sections())
    PAGE.write_text(page, encoding="utf-8")
    paste(DOC, table_md())
    print(
        f"{len(ITEMS)} items over {len(SURFACES)} surfaces; {len(UNITS)} scales, {len(BRANDS)} brands, "
        f"{chart_count} charts; the About lines from {ABOUT['from']}"
    )
    print(f"wrote {PAGE.relative_to(ROOT)} and {DOC.relative_to(ROOT)} §3")


if __name__ == "__main__":
    main()
