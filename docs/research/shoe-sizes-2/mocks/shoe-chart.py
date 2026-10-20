# Writes shoe-chart.html: ISO's chart as the engine holds it, every brand's own chart from wave 1
# against it, and two mocks of how the converter could show a brand. Data from
# docs/research/shoe-sizes-2/<worker>/charts.csv (unchecked until wave 2). Run with python -I.
import csv, html, pathlib, re, statistics, sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).with_name("shoe-chart.html")

# --- ISO/TS 19407 over the foot's length in mm (ADR 0027) ---------------------------------------
def iso_eu(f): return f / 6.67 + 2
def iso_uk(f): return f / 8.47 - 23
def iso_usm(f): return iso_uk(f) + 1
def iso_usw(f): return iso_uk(f) + 2
def iso_jp(f): return f / 10
def half(x): return round(x * 2) / 2

# --- the charts to draw -------------------------------------------------------------------------
# (brand, site, chart, columns, how the brand describes its length, label)
SELECT = [
    ("Nike", "nike.com/us", "Men's Footwear", {"foot": ("Foot Length (cm)", "cm"), "usm": "US - Men", "usw": "US - Women", "uk": "UK", "eu": "EU", "jp": "CM / JP"}, "the foot, stated; the box’s CM differs", "Men’s"),
    ("Nike", "nike.com/us", "Women's Footwear", {"foot": ("Foot Length (cm)", "cm"), "usw": "US - Women", "usm": "US - Men", "uk": "UK", "eu": "EU", "jp": "CM / JP"}, "the foot, stated", "Women’s"),
    ("Under Armour", "underarmour.com/en-us", "Men's Shoes Size Chart", {"foot": ("CM", "cm"), "usm": "US Men", "uk": "UK", "eu": "Euro"}, "“the true foot”, stated", "Men’s"),
    ("Under Armour", "underarmour.com/en-us", "Women's Shoes Size Chart", {"foot": ("CM", "cm"), "usw": "US Women", "uk": "UK", "eu": "Euro"}, "“the true foot”, stated", "Women’s"),
    ("Reebok", "reebok.com", "Men's Shoes Size Guide", {"foot": ("Heel-Toe Measurement (in)", "in"), "usm": "U.S. Size"}, "heel to toe, stated; US sizes only", "Men’s"),
    ("Reebok", "reebok.com", "Women's Shoes Size Guide", {"foot": ("Heel-Toe Measurement (in)", "in"), "usw": "U.S. Size"}, "heel to toe, stated; US sizes only", "Women’s"),
    ("Clarks", "clarks.com/en-gb", "Mens Clarks Shoe Sizes", {"foot": ("Foot Length (Millimetres)(MMs)", "mm"), "uk": "Clarks UK Size", "eu": "Clarks EU Size"}, "the foot, a ruler; “do not correlate” with its gauge", "Men’s"),
    ("Clarks", "clarks.com/en-gb", "Womens Clarks Shoe Sizes", {"foot": ("Foot Length (Millimetres)(MMs)", "mm"), "uk": "Clarks UK Size", "eu": "Clarks EU Size"}, "the foot, a ruler", "Women’s"),
    ("Salomon", "salomon.com/en-us", "Men's Footwear", {"foot": ("FOOT LENGTH (CM)", "cm"), "usm": "US  ", "uk": "UK", "eu": "EUR", "jp": "JP"}, "the foot, in socks, stated", "Men’s"),
    ("Salomon", "salomon.com/en-us", "Women's Footwear", {"foot": ("FOOT LENGTH (CM)", "cm"), "usw": "US ", "uk": "UK", "eu": "EUR", "jp": "JP"}, "the foot, in socks, stated", "Women’s"),
    ("Crocs", "crocs.com (default.json, the US and default chart)", "Adults", {"foot": ("Heel to Toe Length (mm)", "mm"), "usm": "US Men", "usw": "US Women", "uk": "UK Men", "eu": "EU", "jp": "Japan"}, "heel to toe; its cm column sits 1 cm lower", "Adults, the mm column"),
    ("Birkenstock", "birkenstock.com (US printable template PDF)", "PRINTABLE SIZING TEMPLATE A4: size table", {"foot": ("MM", "mm"), "usm": "US Men", "usw": "US Ladies", "uk": "UK", "eu": "EU"}, "the foot, on its template; two US half sizes per EU size", "Template"),
    ("Dr. Martens", "drmartens.com/us", "Women's and Men's", {"foot": ("Foot length", "cm"), "usm": "US Men's", "usw": "US Women's", "uk": "UK", "eu": "EU"}, "headed “Foot length”, no unit printed; read by the fetcher", "Adults"),
    ("Asics", "asics.com/nz", "Men's/Unisex Shoe Sizes", {"foot": ("CM", "cm"), "usm": "US", "usw": "US Women", "uk": "UK", "eu": "EU"}, "a CM column, meaning unstated", "Men’s / unisex"),
    ("Converse", "converse.ca", "Men - Standard Sneakers", {"foot": ("cm", "cm"), "usm": "US Men's", "usw": "US Women's", "uk": "UK", "eu": "EU"}, "a cm column, meaning unstated", "Men’s, standard"),
    ("Puma", "au.puma.com", "Men's shoes", {"foot": ("Length cm", "cm"), "usm": "US", "uk": "UK", "eu": "EU"}, "a length column, meaning unstated", "Men’s"),
]

VULGAR = {"½": " 1/2", "¼": " 1/4", "¾": " 3/4", "⅓": " 1/3", "⅔": " 2/3", "⅛": " 1/8", "⅜": " 3/8", "⅝": " 5/8", "⅞": " 7/8"}
SUP = str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹", "0123456789")
SUB = str.maketrans("₀₁₂₃₄₅₆₇₈₉", "0123456789")


def num(s):
    """A cell as a number: decimals with a point or a comma, mixed fractions, vulgar fractions, a range's middle, letters dropped."""
    if s is None:
        return None
    t = s.strip().strip('"').replace("⁄", "/").translate(SUP).translate(SUB)
    for k, v in VULGAR.items():
        t = t.replace(k, v)
    t = re.sub(r"[A-Za-z\"″]+", " ", t).strip()
    if not t:
        return None
    m = re.fullmatch(r"(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)", t)
    if m:
        return (num(m.group(1)) + num(m.group(2))) / 2
    m = re.fullmatch(r"(\d+)\s+(\d+)\s*/\s*(\d+)", t)
    if m:
        return int(m.group(1)) + int(m.group(2)) / int(m.group(3))
    m = re.fullmatch(r"(\d+)\s*/\s*(\d+)", t)
    if m:
        return int(m.group(1)) / int(m.group(2))
    m = re.fullmatch(r"(\d+)[.,](\d+)", t)
    if m:
        return float(f"{m.group(1)}.{m.group(2)}")
    m = re.fullmatch(r"\d+", t)
    return float(t) if m else None


def load():
    charts = {}
    for w in ("brands-a", "brands-b"):
        p = ROOT / f"docs/research/shoe-sizes-2/{w}/charts.csv"
        for r in csv.DictReader(p.open(encoding="utf-8")):
            charts.setdefault((r["brand"], r["site"], r["chart"]), {}).setdefault(int(r["row"]), {})[r["column"]] = r["value"]
    return charts


def rows_of(charts, brand, site, chart, cols):
    byrow = charts[(brand, site, chart)]
    out = []
    for i in sorted(byrow):
        cells = byrow[i]
        col, unit = cols["foot"]
        f = num(cells.get(col))
        if f is None:
            continue
        foot = f * 10 if unit == "cm" else f * 25.4 if unit == "in" else f
        row = {"foot": foot}
        for key in ("usm", "usw", "uk", "eu", "jp"):
            if key in cols:
                row[key] = num(cells.get(cols[key]))
        row["d_eu"] = row["eu"] - iso_eu(foot) if row.get("eu") is not None else None
        row["d_uk"] = row["uk"] - iso_uk(foot) if row.get("uk") is not None else None
        row["d_usm"] = row["usm"] - iso_usm(foot) if row.get("usm") is not None else None
        row["d_usw"] = row["usw"] - iso_usw(foot) if row.get("usw") is not None else None
        out.append(row)
    return out


def fmt(x, places=1):
    if x is None:
        return "—"
    s = f"{x:.{places}f}"
    return s.rstrip("0").rstrip(".") if "." in s else s


def signed(x, places=1):
    if x is None:
        return "—"
    s = fmt(abs(x), places)
    return ("+" if x > 0.049 else "−" if x < -0.049 else "±") + s


def size(x):
    return "—" if x is None else fmt(x, 2) if x * 2 != int(x * 2) else fmt(half(x), 1)


# --- SVG strip of deltas over the foot ----------------------------------------------------------
X0, X1 = 205, 325   # mm
Y0, Y1 = -1.6, 1.6  # sizes
W, H = 320, 96
PAD_L, PAD_R, PAD_T, PAD_B = 28, 8, 8, 18


def sx(f): return PAD_L + (f - X0) / (X1 - X0) * (W - PAD_L - PAD_R)
def sy(d): return PAD_T + (Y1 - d) / (Y1 - Y0) * (H - PAD_T - PAD_B)


def strip(rows):
    parts = [f'<svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="The chart’s sizes against ISO’s, by foot length" class="strip">']
    for d in (-1, 0, 1):
        y = sy(d)
        cls = "zero" if d == 0 else "grid"
        parts.append(f'<line x1="{PAD_L}" x2="{W - PAD_R}" y1="{y:.1f}" y2="{y:.1f}" class="{cls}"/>')
        parts.append(f'<text x="{PAD_L - 4}" y="{y + 3.5:.1f}" class="tick" text-anchor="end">{signed(d, 0) if d else "ISO"}</text>')
    for f in (220, 250, 280, 310):
        parts.append(f'<text x="{sx(f):.1f}" y="{H - 4}" class="tick" text-anchor="middle">{f}</text>')
    for key, cls in (("d_eu", "eu"), ("d_uk", "uk"), ("d_usm", "us"), ("d_usw", "usw")):
        pts = [(r["foot"], r[key]) for r in rows if r.get(key) is not None and X0 <= r["foot"] <= X1]
        if len(pts) < 2:
            continue
        d = " ".join(f'{"M" if i == 0 else "L"}{sx(f):.1f} {sy(max(Y0, min(Y1, v))):.1f}' for i, (f, v) in enumerate(pts))
        parts.append(f'<path d="{d}" class="line {cls}"/>')
    parts.append("</svg>")
    return "".join(parts)


def summary(rows, key):
    vals = [r[key] for r in rows if r.get(key) is not None and 220 <= r["foot"] <= 300]
    if not vals:
        return None
    return statistics.mean(vals), min(vals), max(vals)


def main():
    charts = load()
    drawn = []
    for brand, site, chart, cols, length, label in SELECT:
        rows = rows_of(charts, brand, site, chart, cols)
        drawn.append({"brand": brand, "site": site, "chart": chart, "label": label, "length": length, "rows": rows, "cols": cols})

    # 1. ISO's chart as the engine holds it.
    iso = []
    for f in range(215, 315, 5):
        iso.append(f"<tr><th scope=\"row\">{f}</th><td>{fmt(iso_jp(f), 1)}</td><td>{size(iso_eu(f))}</td><td>{size(iso_uk(f))}</td><td>{size(iso_usm(f))}</td><td>{size(iso_usw(f))}</td></tr>")

    # 2. One size, every chart: a US men's 10 and a US women's 8.
    def anchor(key, target):
        out = []
        for d in drawn:
            if key not in d["cols"]:
                continue
            hit = next((r for r in d["rows"] if r.get(key) == target), None)
            if not hit:
                continue
            iso_foot = (target + (22 if key == "usm" else 21)) * 8.47
            out.append((d, hit, iso_foot))
        return out

    def anchor_table(key, target, title):
        iso_foot = (target + (22 if key == "usm" else 21)) * 8.47
        head = f"<tr><th>Chart</th><th>Foot it gives</th><th>vs ISO’s {fmt(iso_foot, 0)} mm</th><th>EU</th><th>UK</th><th>{'US W' if key == 'usm' else 'US M'}</th><th>JP</th></tr>"
        body = []
        other = "usw" if key == "usm" else "usm"
        for d, hit, isof in anchor(key, target):
            diff = hit["foot"] - isof
            body.append(
                f"<tr><th scope=\"row\">{html.escape(d['brand'])} <span class=\"muted\">{d['label']}</span></th>"
                f"<td>{fmt(hit['foot'], 0)} mm</td><td class=\"{'up' if diff > 2 else 'down' if diff < -2 else ''}\">{signed(diff, 0)} mm, {signed(diff / 8.47, 1)} size</td>"
                f"<td>{size(hit.get('eu'))} <span class=\"muted\">ISO {size(iso_eu(hit['foot']))}</span></td>"
                f"<td>{size(hit.get('uk'))} <span class=\"muted\">ISO {size(iso_uk(hit['foot']))}</span></td>"
                f"<td>{size(hit.get(other))}</td><td>{fmt(hit.get('jp'), 1)}</td></tr>"
            )
        iso_row = (f"<tr class=\"iso\"><th scope=\"row\">ISO 19407 <span class=\"muted\">the engine</span></th><td>{fmt(iso_foot, 0)} mm</td><td>±0</td>"
                   f"<td>{size(iso_eu(iso_foot))}</td><td>{size(iso_uk(iso_foot))}</td><td>{size(iso_usw(iso_foot) if key == 'usm' else iso_usm(iso_foot))}</td><td>{fmt(iso_jp(iso_foot), 1)}</td></tr>")
        return f"<h3>{title}</h3><div class=\"scroll\"><table class=\"data\">{head}{iso_row}{''.join(body)}</table></div>"

    # 3. The deltas over the foot, a strip per chart, and a line of summary each.
    strips = []
    for d in drawn:
        s = {k: summary(d["rows"], k) for k in ("d_eu", "d_uk", "d_usm", "d_usw")}
        words = []
        for k, name in (("d_eu", "EU"), ("d_uk", "UK"), ("d_usm", "US M"), ("d_usw", "US W")):
            if s[k]:
                mean, lo, hi = s[k]
                words.append(f"{name} {signed(mean, 1)} <span class=\"muted\">({signed(lo, 1)} to {signed(hi, 1)})</span>")
        strips.append(
            f"<figure class=\"card\"><figcaption><strong>{html.escape(d['brand'])}</strong> <span class=\"muted\">{d['label']} · {d['length']}</span></figcaption>"
            f"{strip(d['rows'])}<p class=\"sum\">{' · '.join(words) if words else 'US sizes only: no EU or UK to compare'}</p></figure>"
        )

    # 4. The mocks: Nike's row for a US men's 10, as the converter could show it.
    nike = next(d for d in drawn if d["brand"] == "Nike" and d["label"] == "Men’s")
    ten = next(r for r in nike["rows"] if r.get("usm") == 10)
    iso_f = (10 + 22) * 8.47

    def row(value, symbol, name, approx=False, in_box=False):
        return (f"<div class=\"row{' inbox' if in_box else ''}\"><span class=\"val\">{'<span class=\"muted\">≈ </span>' if approx else ''}{value}</span>"
                f"<span class=\"sym\">{symbol}</span><span class=\"name\">{name}</span></div>")

    iso_rows = "".join([
        row("10", "US M", "US men", in_box=True), row(size(iso_usw(iso_f)), "US W", "US women"), row("> 13.5", "US C", "US children"),
        row(size(iso_eu(iso_f)), "EU", "European", approx=True), row(fmt(half(iso_f / 5) * 5 if False else round(iso_f / 5) * 5, 0), "mm", "Mondopoint", approx=True), row(size(iso_jp(iso_f)), "cm", "Japanese", approx=True),
        row(size(iso_uk(iso_f)), "UK", "British"),
    ])
    nike_rows = "".join([
        row("10", "US M", "US men", in_box=True), row(size(ten.get("usw")), "US W", "US women"),
        row(size(ten.get("eu")), "EU", "European"), row(fmt(ten["foot"], 0), "mm", "Foot length"), row(fmt(ten.get("jp"), 1), "cm", "CM / JP"),
        row(size(ten.get("uk")), "UK", "British"),
    ])
    s_eu = summary(nike["rows"], "d_eu")
    hint = f"Nike marks EU about {fmt(abs(s_eu[0]), 1)} size {'above' if s_eu[0] > 0 else 'below'} ISO (from {signed(s_eu[1], 1)} to {signed(s_eu[2], 1)} across its chart); its women’s are men’s + 1.5."

    page = f"""<title>Shoe Sizes Against ISO</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
  /* Layout: one reading column, the product's own tokens from the earlier mocks; tables and strips in cards. */
  :root {{
    --canvas: #fafaf9; --surface: #ffffff; --raised: #f5f5f4; --ink: #1c1917; --muted: #57534e;
    --accent: #0f766e; --on-accent: #ffffff; --soft: #ccfbf1; --line: #d6d3d1; --edge: #928f8d;
    --eu: #0f766e; --uk: #b45309; --us: #1d4ed8; --usw: #be185d; --mock: #9a3412; --mock-bg: #fff4e8; --mock-line: #f2c9a8;
    --font: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  }}
  @media (prefers-color-scheme: dark) {{
    :root:not([data-theme='light']) {{
      --canvas: #1c1917; --surface: #292524; --raised: #332f2c; --ink: #fafaf9; --muted: #a8a29e;
      --accent: #2dd4bf; --on-accent: #042f2e; --soft: #134e4a; --line: #44403c; --edge: #78716c;
      --eu: #2dd4bf; --uk: #fbbf24; --us: #93c5fd; --usw: #f9a8d4; --mock: #fdba74; --mock-bg: #3a2112; --mock-line: #7c3f1a;
      color-scheme: dark;
    }}
  }}
  :root[data-theme='dark'] {{
    --canvas: #1c1917; --surface: #292524; --raised: #332f2c; --ink: #fafaf9; --muted: #a8a29e;
    --accent: #2dd4bf; --on-accent: #042f2e; --soft: #134e4a; --line: #44403c; --edge: #78716c;
    --eu: #2dd4bf; --uk: #fbbf24; --us: #93c5fd; --usw: #f9a8d4; --mock: #fdba74; --mock-bg: #3a2112; --mock-line: #7c3f1a;
    color-scheme: dark;
  }}
  body {{ background: var(--canvas); color: var(--ink); font-family: var(--font); font-size: 15px; line-height: 1.5;
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 24px 48px; }}
  main {{ max-width: 720px; margin: 0 auto; display: grid; gap: 28px; }}
  h1 {{ font-size: 1.6rem; line-height: 1.2; margin: 0 0 6px; text-wrap: balance; }}
  h2 {{ font-size: 1.15rem; margin: 0 0 4px; text-wrap: balance; }}
  h3 {{ font-size: 0.95rem; margin: 18px 0 6px; color: var(--muted); font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; }}
  p {{ margin: 0; max-width: 65ch; }}
  .lede {{ color: var(--muted); }}
  .muted {{ color: var(--muted); font-weight: 400; }}
  section {{ display: grid; gap: 8px; }}
  .scroll {{ overflow-x: auto; max-width: 100%; }}
  table.data {{ border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; font-size: 0.92rem; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }}
  table.data th, table.data td {{ padding: 6px 10px; text-align: right; white-space: nowrap; border-top: 1px solid var(--line); }}
  table.data th {{ font-weight: 600; }}
  table.data thead th, table.data tr:first-child th {{ border-top: 0; color: var(--muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em; }}
  table.data th[scope=row] {{ text-align: left; }}
  table.data tr.iso {{ background: var(--soft); }}
  td.up {{ color: var(--uk); }} td.down {{ color: var(--us); }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }}
  .card {{ margin: 0; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; display: grid; gap: 4px; min-width: 0; }}
  figcaption {{ font-size: 0.92rem; }}
  .sum {{ font-size: 0.82rem; font-variant-numeric: tabular-nums; }}
  .strip {{ display: block; max-width: 100%; height: auto; }}
  .strip .grid {{ stroke: var(--line); stroke-width: 1; }} .strip .zero {{ stroke: var(--edge); stroke-width: 1.2; }}
  .strip .tick {{ fill: var(--muted); font-size: 9px; font-family: var(--font); }}
  .strip .line {{ fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }}
  .strip .eu {{ stroke: var(--eu); }} .strip .uk {{ stroke: var(--uk); }} .strip .us {{ stroke: var(--us); }} .strip .usw {{ stroke: var(--usw); }}
  .legend {{ display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.85rem; }}
  .legend span::before {{ content: ''; display: inline-block; width: 18px; height: 3px; border-radius: 2px; margin-right: 6px; vertical-align: middle; background: var(--c); }}
  .mock {{ background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 12px; display: grid; gap: 8px; }}
  .box {{ display: flex; align-items: center; gap: 8px; border: 1px solid var(--edge); border-radius: 10px; padding: 8px 10px; font-variant-numeric: tabular-nums; }}
  .box .n {{ font-size: 1.25rem; flex: 1; }}
  .chip {{ border-radius: 999px; background: var(--raised); border: 1px solid var(--line); padding: 2px 10px; font-size: 0.85rem; white-space: nowrap; }}
  .chip b {{ color: var(--muted); font-weight: 600; margin-right: 4px; }}
  .pill {{ border-radius: 999px; background: var(--soft); color: var(--ink); padding: 2px 10px; font-size: 0.85rem; white-space: nowrap; }}
  .rows {{ display: grid; gap: 2px; font-variant-numeric: tabular-nums; }}
  .row {{ display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.3fr); gap: 10px; padding: 8px 10px; border-radius: 8px; min-height: 40px; align-items: center; }}
  .row.inbox {{ background: var(--soft); }}
  .row .val {{ text-align: right; }} .row .sym {{ color: var(--muted); font-weight: 600; text-align: right; min-width: 3.2em; }} .row .name {{ overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
  .note {{ font-size: 0.85rem; color: var(--muted); padding: 4px 10px 0; }}
  .flag {{ color: var(--mock); background: var(--mock-bg); border: 1px solid var(--mock-line); border-radius: 6px; padding: 1px 8px; font-size: 0.78rem; font-weight: 600; display: inline-block; }}
  ul {{ margin: 0; padding-left: 18px; max-width: 65ch; }} li {{ margin: 2px 0; }}
</style>
<main>
  <header>
    <span class="flag">Mock · 2026-10-20 · wave 1 data, unchecked</span>
    <h1>Shoe sizes against ISO: the engine’s chart, the brands’ own charts, and two ways to show a brand</h1>
    <p class="lede">ISO 19407 brings every scale to one base, the foot’s length in millimetres; the converter holds its rule. Each brand publishes its own chart, and where the brand gives a foot length per size, its chart can be laid over ISO’s: the difference, in sizes, is the delta. Everything below is computed from the cells the two workers recorded on the brands’ own sites; nothing is checked yet.</p>
  </header>

  <section>
    <h2>1. ISO’s chart, as the engine holds it</h2>
    <p class="lede">The foot in mm (Mondopoint) and the size each scale marks for it, to the half size as ISO’s table rounds: EU = foot / 6.67 + 2, UK = foot / 8.47 − 23, US men = UK + 1, US women = UK + 2, JP = the foot in cm.</p>
    <div class="scroll"><table class="data"><thead><tr><th>Foot, mm</th><th>JP, cm</th><th>EU</th><th>UK</th><th>US M</th><th>US W</th></tr></thead><tbody>{''.join(iso)}</tbody></table></div>
  </section>

  <section>
    <h2>2. One size, every chart</h2>
    <p class="lede">What each brand says the same marked size fits, against ISO. A brand whose foot is longer than ISO’s for the same size runs big: its 10 is ISO’s 10½ or 11. The EU and UK columns show the brand’s own marking beside what ISO would mark for that very foot.</p>
    {anchor_table("usm", 10, "A US men’s 10")}
    {anchor_table("usw", 8, "A US women’s 8")}
  </section>

  <section>
    <h2>3. The deltas across each chart</h2>
    <p class="lede">Each strip is one chart laid over ISO: the foot along the bottom (mm), and how many sizes above or below ISO’s marking the brand’s sits, per scale. A flat line is a constant offset; a stair step is a brand marking in 5 mm grid steps against ISO’s 4.2; a slope is a brand whose sizes run bigger or smaller as the foot grows. The line under each strip is the mean over 220 to 300 mm, with the range in brackets: what a one-line hint could say.</p>
    <div class="legend"><span style="--c: var(--eu)">EU</span><span style="--c: var(--uk)">UK</span><span style="--c: var(--us)">US men</span><span style="--c: var(--usw)">US women</span></div>
    <div class="grid">{''.join(strips)}</div>
  </section>

  <section>
    <h2>4. Two ways to show a brand</h2>
    <p class="lede">Both from Nike’s men’s chart at a US 10, as the converter’s table could draw them.</p>
    <h3>A. A hint under ISO’s table</h3>
    <div class="mock">
      <div class="box"><span class="n">10</span><span class="chip"><b>US M</b>US men</span></div>
      <div class="rows">{iso_rows}</div>
      <p class="note">ISO 19407’s sizes from the foot’s length, to the half size. {hint}</p>
    </div>
    <p class="lede">The hint is one computed sentence per brand. It is true on average and wrong at the ends: Nike’s EU delta runs from {signed(s_eu[1], 1)} to {signed(s_eu[2], 1)} across the chart, so a visitor at either end gets a half size of error.</p>
    <h3>B. The brand’s chart as the second value</h3>
    <div class="mock">
      <div class="box"><span class="n">10</span><span class="chip"><b>US M</b>US men</span><span class="pill">Nike ▾</span></div>
      <div class="rows">{nike_rows}</div>
      <p class="note">Nike’s men’s chart (nike.com, 2026-10-20): the foot measured heel to toe, the box’s CM a different number. Nike recommends sizing up between sizes.</p>
    </div>
    <p class="lede">The brand’s own cells, named as the brand’s, as Cooking names an ingredient: exact to what the brand publishes, with the brand’s own words under the table, and no averaging. The pill is where a visitor picks the brand once; ISO stays the default when none is picked.</p>
  </section>

  <section>
    <h2>5. What the data allows</h2>
    <ul>
      <li><strong>Eight brands</strong> give a foot length per size and say it is the foot’s (Nike, Under Armour, Reebok, Clarks, Birkenstock, Salomon, Crocs, Dr. Martens): a chart can be shown and a delta computed for each. Reebok has US sizes only.</li>
      <li><strong>Three</strong> give a length of unstated meaning (Asics, Converse, Puma): drawn above with that caveat; a chart could still be shown as the brand’s, a delta against ISO only if the length is the foot’s.</li>
      <li><strong>Two</strong> give offsets alone (Skechers, Brooks): a chart, no delta.</li>
      <li><strong>Seven</strong> could not be reached on any of their sites (Adidas, New Balance, Vans, UGG, Hoka, Timberland, On).</li>
      <li>Before any of it ships, wave 2’s checker re-reads the cells from the pages (the fetcher-read ones first), and the kept charts go into <code>brands.py</code>, from which the code and this page are written.</li>
    </ul>
  </section>
</main>
"""
    OUT.write_text(page, encoding="utf-8")
    print("wrote", OUT, len(page), "chars")


main()
