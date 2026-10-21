# Writes brand-mock.html: the brand's chart as the second value, as the converter's table could draw it, eight inputs
# through the checked record (../brands.json, written by ../brands.py) and a Settings panel; the decisions of
# docs/research/shoe-sizes-2.md §5 shown one by one for Sean's eye (2026-10-20). Run with python -I.
import html
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "brand-mock.html"
DATA = json.loads((HERE.parent / "brands.json").read_text(encoding="utf-8"))

# --- ISO/TS 19407 over the foot's length in mm, as the engine holds it (ADR 0027) --------------
UK_STEP, EUR_STEP = 8.47, 6.67
STEP = {"us_men": 0.5, "us_women": 0.5, "uk": 0.5, "eu": 0.5, "mm": 5, "cm": 0.5}


def iso_of(foot):
    return {"us_men": foot / UK_STEP - 22, "us_women": foot / UK_STEP - 21, "uk": foot / UK_STEP - 23, "eu": foot / EUR_STEP + 2, "mm": foot, "cm": foot / 10}


def foot_of(key, size):
    return {"us_men": (size + 22) * UK_STEP, "us_women": (size + 21) * UK_STEP, "uk": (size + 23) * UK_STEP, "eu": (size - 2) * EUR_STEP, "mm": size, "cm": size * 10}[key]


def rounded(x, step):
    r = round(x / step) * step
    return r, abs(r - x) > 1e-9


def fmt(x):
    if x is None:
        return "—"
    s = f"{x:.2f}".rstrip("0").rstrip(".")
    return s


def chart(brand, site, name):
    return next(c for c in DATA["charts"] if c["brand"] == brand and site in c["site"] and c["chart"] == name)


def row(c, key, value):
    return next(r for r in c["rows"] if r.get(key) == value)


# --- the table's units, in the product's sections -----------------------------------------------
UNITS = [
    ("US", [("us_men", "US M", "US men"), ("us_women", "US W", "US women"), ("kids_us", "US C", "US children")]),
    ("Metric", [("eu", "EU", "European"), ("kids_eu", "EU C", "European children"), ("mm", "mm", "Mondopoint"), ("cm", "cm", "Japanese")]),
    ("British", [("uk", "UK", "British"), ("kids_uk", "UK C", "British children")]),
]
BEYOND = {"kids_us": "> 13.5", "kids_eu": "> 38", "kids_uk": "> 13.5"}


def cell(text, approx=False, muted=False):
    cls = " muted" if muted else ""
    mark = '<span class="muted">≈ </span>' if approx else ""
    return f'<span class="val{cls}">{mark}{html.escape(text)}</span>'


def scene(number, title, typed, input_text, chips, brand_head, values, note, shows, brand_approx=()):
    key, size = typed
    foot = foot_of(key, size)
    iso = iso_of(foot)
    parts = [f'<section class="scene"><h2>{number}. {html.escape(title)}</h2>']
    parts.append('<div class="mock">')
    parts.append('<div class="box"><span class="n">' + html.escape(input_text.split(" ")[0]) + "</span>" + "".join(f'<span class="chip"><b>{html.escape(a)}</b>{html.escape(b)}</span>' for a, b in chips) + "</div>")
    parts.append(f'<div class="heads"><span>ISO 19407</span><span class="brandhead">{html.escape(brand_head)}</span><span></span><span></span></div>')
    parts.append('<div class="rows">')
    for section, units in UNITS:
        parts.append(f'<div class="sec">{section}</div>')
        for k, symbol, name in units:
            in_box = k == key
            if k in BEYOND:
                iso_cell = cell(BEYOND[k], muted=True)
            elif in_box:
                iso_cell = cell(fmt(size))
            else:
                r, approx = rounded(iso[k], STEP[k])
                iso_cell = cell(fmt(r), approx)
            b = values.get(k)
            brand_cell = cell("—", muted=True) if b is None else cell(b, approx=k in brand_approx)
            brand_cell = brand_cell.replace('class="val', 'class="val brand', 1)
            parts.append(f'<div class="row{" inbox" if in_box else ""}">{iso_cell}{brand_cell}<span class="sym">{html.escape(symbol)}</span><span class="name">{html.escape(name)}</span></div>')
    parts.append("</div>")
    parts.append(f'<p class="note">ISO 19407’s sizes from the foot’s length, to the half size. A brand’s own chart can differ by up to a size; US women’s run 1 (ISO) to 1.5 (Nike, Clarks) above men’s.</p>')
    parts.append(f'<p class="note brandnote">{html.escape(note[0])}' + (f" {html.escape(note[1])}" if len(note) > 1 and note[1] else "") + "</p>")
    parts.append("</div>")
    parts.append(f'<p class="shows"><strong>Shows</strong> {shows}</p></section>')
    return "".join(parts)


def main():
    nike_m = row(chart("Nike", "nike.com/us", "Men's Footwear"), "us_men", 10)
    nike_w = row(chart("Nike", "nike.com/us", "Women's Footwear"), "us_women", 8)
    nb_m = row(chart("New Balance", "manual", "men"), "eu", 43)
    asics_m = row(chart("Asics", "asics.com/us", "Men's shoes size chart"), "foot_cm", 27)
    birk = row(chart("Birkenstock", "template", "PRINTABLE SIZING TEMPLATE A4: size table"), "eu", 42)
    reebok = row(chart("Reebok", "reebok.com", "Unisex Shoe Size Guide"), "us_men", 10)
    on_m = row(chart("On", "manual", "men"), "us_men", 10)
    conv = row(chart("Converse", "converse.com", "Men's Chuck Taylor All Star"), "us_men", 10)
    reebok_mm = reebok["foot_in"] * 25.4

    scenes = [
        scene(
            1, "A US men’s 10 at Nike: the shape", ("us_men", 10), "10 nike", [("US M", "US men"), ("Nike", "men’s")], "Nike · men’s",
            {"us_men": "10", "us_women": fmt(nike_m["us_women"]), "uk": fmt(nike_m["uk"]), "eu": fmt(nike_m["eu"]), "mm": fmt(nike_m["foot_cm"] * 10), "cm": fmt(nike_m["jp"])},
            ("Nike’s own chart, the men’s (nike.com, 2026-10-20).", "Nike’s CM is the box’s label, not the foot’s length: its 28 sits beside a 27.1 cm foot."),
            "decisions 1, 2, and 3. ISO’s value stays first in every row, as today; the brand’s own cell sits beside it in the brand’s column, named at the top; a row the brand prints nothing for keeps ISO’s value alone (—). Nike says its length is the foot’s, so the Mondopoint row carries Nike’s 271 mm; its Japanese row carries Nike’s CM label, and the note’s second line says why the two disagree.",
        ),
        scene(
            2, "A US women’s 8 at Nike: the women’s line", ("us_women", 8), "nike women 8", [("US W", "US women"), ("Nike", "women’s")], "Nike · women’s",
            {"us_men": fmt(nike_w["us_men"]), "us_women": "8", "uk": fmt(nike_w["uk"]), "eu": fmt(nike_w["eu"]), "mm": fmt(nike_w["foot_cm"] * 10), "cm": fmt(nike_w["jp"])},
            ("Nike’s own chart, the women’s (nike.com, 2026-10-20): a different last from the men’s, so the same label gives another UK size and foot length.",),
            "decisions 1 and 4. “women” with the brand picks the women’s chart: Nike’s women’s page gives a US W 8 a 24.5 cm foot and UK 5.5, where its men’s page gives the same label 24.1 cm and UK 6; ISO gives UK 6 and 245.6 mm. The two lines are kept apart, never merged by length.",
        ),
        scene(
            3, "A European 43 at New Balance: a genderless scale", ("eu", 43), "eu 43 new balance", [("EU", "European"), ("New Balance", "men’s")], "New Balance · men’s",
            {"us_men": fmt(nb_m["us_men"]), "us_women": fmt(nb_m["us_women"]), "uk": fmt(nb_m["uk"]), "eu": "43", "mm": fmt(nb_m["foot_cm"] * 10), "cm": fmt(nb_m["foot_cm"])},
            ("New Balance’s own chart, the men’s (newbalance.com, 2026-10-20); type “women” for the women’s chart, a different last.",),
            "decision 4. A European or British size, or a length, has no gender, so the men’s chart answers unless “women” is typed or picked; New Balance’s EU 43 is its US men’s 9.5 and a 27.5 cm foot, where ISO’s EU 43 is a US 10.5 and 273.5 mm.",
        ),
        scene(
            4, "A 27 cm foot at Asics: a length answered", ("cm", 27), "27 cm asics", [("cm", "Japanese"), ("Asics", "men’s")], "Asics · men’s",
            {"us_men": fmt(asics_m["us_men"]), "uk": fmt(asics_m["uk"]), "eu": fmt(asics_m["eu"]), "mm": fmt(asics_m["foot_cm"] * 10), "cm": "27"},
            ("Asics’ own chart, the men’s (asics.com, 2026-10-20): its CM column is the foot’s by the page’s own measuring steps.",),
            "decision 2. A typed foot length gets the brand’s size only where the brand says its length is the foot’s: a 27 cm foot is Asics’ US 9 and ISO’s US 10 (the centimetre-grid family of §9). Asics’ men’s chart carries no women’s column, so that row is ISO’s alone.",
        ),
        scene(
            5, "A 27 cm foot at Puma: a length not answered", ("cm", 27), "27 cm puma", [("cm", "Japanese"), ("Puma", "men’s")], "Puma · men’s",
            {},
            ("Puma’s chart answers a size, not a foot length: its lengths are its products’ measurements (us.puma.com, 2026-10-20). Type a size for Puma’s chart.",),
            "decision 2, the other way. Puma’s US site heads its lengths Product Measurements, beside heel height and weight, so no row takes them as the foot’s; the brand’s column stays empty until a size is typed, and the note says why.",
        ),
        scene(
            6, "A European 42 at Birkenstock: ranges as printed", ("eu", 42), "eu 42 birkenstock", [("EU", "European"), ("Birkenstock", "")], "Birkenstock",
            {"us_men": birk["text"]["US Men"], "us_women": birk["text"]["US Ladies"], "uk": fmt(birk["uk"]), "eu": "42", "mm": fmt(birk["foot_mm"]), "cm": fmt(birk["foot_mm"] / 10)},
            ("Birkenstock’s own chart (its printable template, 2026-10-20).", "Birkenstock makes whole EU sizes: two US half sizes share one."),
            "decisions 5 and 3. Birkenstock prints a US range per EU size, and the range is shown as the brand prints it, never its middle; the note’s second line is the brand’s own fact.",
        ),
        scene(
            7, "A US men’s 10 at Reebok: scales the chart lacks", ("us_men", 10), "10 reebok", [("US M", "US men"), ("Reebok", "unisex")], "Reebok",
            {"us_men": "10", "us_women": fmt(reebok["us_women"]), "mm": fmt(round(reebok_mm / 5) * 5), "cm": fmt(round(reebok_mm / 5) / 2)},
            ("Reebok’s own chart, its unisex guide (reebok.com, 2026-10-20): US sizes and heel-to-toe inches; it prints no UK or EU, so those rows are ISO’s alone.",),
            "decision 2. Reebok’s chart has US sizes and a heel-to-toe length only: its 10.7 in is the foot’s, shown in mm and cm as the brand’s (≈ where the half size rounds it); the UK and EU rows keep ISO’s value with no second value.",
            brand_approx=("mm", "cm"),
        ),
        scene(
            8, "A US men’s 10 at On: labels only", ("us_men", 10), "10 on", [("US M", "US men"), ("On", "men’s")], "On · men’s",
            {"us_men": "10", "uk": fmt(on_m["uk"]), "eu": fmt(on_m["eu"]), "cm": fmt(on_m["jp"])},
            ("On’s own chart, the men’s (on.com, 2026-10-20): sizes only, no foot length; its Japan column is a size label, so a typed length gets no On value.",),
            "decision 2. On prints no length at all: its sizes answer a typed size, its Japan label fills the Japanese row as the brand’s own size, and the Mondopoint row stays ISO’s.",
        ),
        scene(
            9, "A US men’s 10 at Converse: the brand’s warning", ("us_men", 10), "10 converse", [("US M", "US men"), ("Converse", "Chuck Taylor")], "Converse · Chuck Taylor All Star",
            {"us_men": "10", "us_women": fmt(conv["us_women"]), "uk": fmt(conv["uk"]), "eu": fmt(conv["eu"]), "mm": fmt(conv["foot_cm"] * 10), "cm": fmt(conv["foot_cm"])},
            ("Converse’s own chart, Chuck Taylor All Star, the men’s (converse.com, 2026-10-20).", "Converse says these sneakers run large: go down a half size."),
            "decisions 1 and 3. Converse’s chart is its Chuck Taylor table, the shoe the brand names; its US men’s 10 is UK 10 and a 28.5 cm foot, where ISO’s is UK 9 and 271 mm. The note’s second line is the brand’s own warning, in its words.",
        ),
    ]

    settings = """
<section class="scene"><h2>10. Choosing a brand in Settings</h2>
<div class="mock panel">
  <div class="panelhead"><span>Units</span><span class="muted">Shoe size</span></div>
  <div class="list">
    <div class="item on"><span class="radio"></span><span>ISO 19407 only</span><span class="muted">the default</span></div>
    <div class="item"><span class="radio"></span><span>adidas</span></div>
    <div class="item"><span class="radio"></span><span>Asics</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>Birkenstock</span></div>
    <div class="item"><span class="radio"></span><span>Brooks</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>Clarks</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>Converse</span><span class="muted">Chuck Taylor</span></div>
    <div class="item"><span class="radio"></span><span>Crocs</span></div>
    <div class="item"><span class="radio"></span><span>Dr. Martens</span></div>
    <div class="item"><span class="radio"></span><span>HOKA</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>New Balance</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>Nike</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>On</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>Puma</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>Reebok</span></div>
    <div class="item"><span class="radio"></span><span>Salomon</span></div>
    <div class="item"><span class="radio"></span><span>Skechers</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>Timberland</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>UGG</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>Under Armour</span><span class="muted">men’s · women’s</span></div>
    <div class="item"><span class="radio"></span><span>Vans</span></div>
  </div>
  <p class="note">Remembered in this browser, as the other settings are. A brand typed with the size (“10 nike”) wins over the picked one for that conversion.</p>
</div>
<p class="shows"><strong>Shows</strong> decision 4. Typing is first (the box is the product’s one control); the picker is for discovery and for keeping a brand across conversions. A brand with two lasts lists its lines; the line follows the scale typed (US women’s → the women’s chart), the men’s chart for a genderless scale unless “women” is typed.</p>
</section>
"""

    css = """
<style>
  :root {
    --canvas: #fafaf9; --surface: #ffffff; --raised: #f5f5f4; --ink: #1c1917; --muted: #57534e;
    --accent: #0f766e; --on-accent: #ffffff; --soft: #ccfbf1; --line: #d6d3d1; --edge: #928f8d;
    --mock: #9a3412; --mock-bg: #fff4e8; --mock-line: #f2c9a8;
    --font: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      --canvas: #1c1917; --surface: #292524; --raised: #332f2c; --ink: #fafaf9; --muted: #a8a29e;
      --accent: #2dd4bf; --on-accent: #042f2e; --soft: #134e4a; --line: #44403c; --edge: #78716c;
      --mock: #fdba74; --mock-bg: #3a2112; --mock-line: #7c3f1a;
      color-scheme: dark;
    }
  }
  :root[data-theme='dark'] {
    --canvas: #1c1917; --surface: #292524; --raised: #332f2c; --ink: #fafaf9; --muted: #a8a29e;
    --accent: #2dd4bf; --on-accent: #042f2e; --soft: #134e4a; --line: #44403c; --edge: #78716c;
    --mock: #fdba74; --mock-bg: #3a2112; --mock-line: #7c3f1a;
    color-scheme: dark;
  }
  body { background: var(--canvas); color: var(--ink); font-family: var(--font); font-size: 15px; line-height: 1.5;
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 24px 48px; }
  main { max-width: 576px; margin: 0 auto; display: grid; gap: 28px; }
  h1 { font-size: 1.5rem; line-height: 1.2; margin: 0 0 6px; text-wrap: balance; }
  h2 { font-size: 1.05rem; margin: 0 0 6px; text-wrap: balance; }
  p { margin: 0; max-width: 65ch; }
  .lede { color: var(--muted); }
  .muted { color: var(--muted); font-weight: 400; }
  .scene { display: grid; gap: 8px; }
  .mock { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 12px; display: grid; gap: 8px; }
  .box { display: flex; align-items: center; gap: 8px; border: 1px solid var(--edge); border-radius: 10px; padding: 8px 10px; font-variant-numeric: tabular-nums; flex-wrap: wrap; }
  .box .n { font-size: 1.25rem; flex: 1; }
  .chip { border-radius: 999px; background: var(--raised); border: 1px solid var(--line); padding: 2px 10px; font-size: 0.85rem; white-space: nowrap; }
  .chip b { color: var(--muted); font-weight: 600; margin-right: 4px; }
  .heads, .row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto minmax(0, 1.2fr); gap: 10px; align-items: center; }
  .heads { padding: 2px 10px 0; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 600; }
  .heads span { text-align: right; } .brandhead { color: var(--accent); }
  .rows { display: grid; gap: 2px; font-variant-numeric: tabular-nums; }
  .sec { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 600; padding: 10px 10px 2px; }
  .row { padding: 8px 10px; border-radius: 8px; min-height: 40px; }
  .row.inbox { background: var(--soft); }
  .row .val { text-align: right; white-space: nowrap; }
  .row .brand { color: var(--accent); font-weight: 600; }
  .row .brand.muted { color: var(--muted); font-weight: 400; }
  .row .sym { color: var(--muted); font-weight: 600; text-align: right; min-width: 3.2em; }
  .row .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .note { font-size: 0.85rem; color: var(--muted); padding: 4px 10px 0; }
  .brandnote { color: var(--ink); }
  .shows { font-size: 0.9rem; color: var(--muted); } .shows strong { color: var(--ink); }
  .flag { color: var(--mock); background: var(--mock-bg); border: 1px solid var(--mock-line); border-radius: 6px; padding: 1px 8px; font-size: 0.78rem; font-weight: 600; display: inline-block; }
  .panel { max-width: 360px; }
  .panelhead { display: flex; justify-content: space-between; font-weight: 600; padding: 2px 4px 6px; border-bottom: 1px solid var(--line); }
  .list { display: grid; gap: 2px; }
  .item { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; padding: 8px 6px; border-radius: 8px; min-height: 40px; }
  .item.on { background: var(--soft); }
  .radio { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--edge); display: inline-block; }
  .item.on .radio { border-color: var(--accent); background: radial-gradient(circle, var(--accent) 45%, transparent 50%); }
  ul { margin: 0; padding-left: 18px; max-width: 65ch; } li { margin: 2px 0; }
</style>
"""

    page = (
        "<title>Brand as Second Value</title>\n"
        '<meta name="claude:viewport-fit-sides" content="cover">\n'
        + css
        + """
<main>
  <header class="scene">
    <span class="flag">Mock · 2026-10-20 · drawn from the checked record (brands.json)</span>
    <h1>The brand’s chart as the second value</h1>
    <p class="lede">What the converter’s Shoe size table could show once a brand is chosen (docs/research/shoe-sizes-2.md §5, decisions 1 to 7). ISO 19407’s value stays first in every row, as today; the brand’s own cell sits beside it in a second column headed with the brand and its line; a dash means the brand prints nothing for that row, so ISO’s value stands alone. The brand’s values are the brand’s cells as published on its own site, never computed; every input below is read from the record that wave 2 checked. The children’s rows show the beyond values the product shows today for an adult size.</p>
  </header>
"""
        + "".join(scenes)
        + settings
        + """
  <section class="scene">
    <h2>Not in this mock</h2>
    <ul>
      <li>The words are drafts: the brand line and the six warning lines (decision 3) are yours to edit.</li>
      <li>The brand column’s width follows the single units’ sizing rule, as a pair does; the fit at phone width is the build’s to measure, not drawn here.</li>
      <li>The kids’ tables, the wide lines, the widths, and a brand’s other regions stay in the record (docs/PLAN.md §2).</li>
    </ul>
  </section>
</main>
"""
    )
    OUT.write_text(page, encoding="utf-8", newline="\n")
    print("wrote", OUT, len(page), "chars")


main()
