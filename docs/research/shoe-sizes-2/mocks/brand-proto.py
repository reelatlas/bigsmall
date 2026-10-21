# An interactive prototype of the Shoe size table with a brand as the second value, for Sean's hands (2026-10-20, the
# hundred-and-sixteenth pass): the 33 product charts of the checked record (../brands.json, written by ../brands.py)
# and ISO/TS 19407's rule as core holds it (ADR 0027), behind a box he can type into. The scale rows show one chart,
# the baseline's (ISO's with no brand, the brand's own cells with one); one row per brand shows the brand's size for
# the same foot, read from its own chart; tapping a row makes it the box's value. Run: python -I brand-proto.py
# (writes brand-proto.html beside it; published as an artifact for his eye). Nothing here is the product's code.
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RECORD = HERE.parent / "brands.json"
OUT = HERE / "brand-proto.html"

# The brands as the product would name them, their home site for the note's citation, the fact the note carries
# (what the numbers cannot show; never fit advice), and the words people type for them.
BRANDS = {
    "adidas": ("adidas.com", "", ["adidas"]),
    "Asics": ("asics.com", "", ["asics"]),
    "Birkenstock": ("birkenstock.com", "Whole EU sizes: two US half sizes share one.", ["birkenstock", "birkenstocks", "birks"]),
    "Brooks": ("brooksrunning.com", "", ["brooks"]),
    "Clarks": ("clarks.com", "Its GB and US pages joined on the UK size they share.", ["clarks", "clark"]),
    "Converse": ("converse.com", "The Chuck Taylor All Star table; the Standard table is not here.", ["converse", "chucks", "chuck taylor", "chuck taylors"]),
    "Crocs": ("crocs.com", "Whole sizes; its EU is a pair, 43–44.", ["crocs"]),
    "Dr. Martens": ("drmartens.com", "Whole sizes, the half sizes US women's only; the brand says sizes differ between silhouettes.", ["dr. martens", "dr martens", "doc martens", "drmartens", "docs"]),
    "HOKA": ("hoka.com", "", ["hoka", "hokas"]),
    "New Balance": ("newbalance.com", "", ["new balance", "newbalance", "nb"]),
    "Nike": ("nike.com", "Its JP is the box's label, not the foot's length.", ["nike", "nikes"]),
    "On": ("on.com", "Its FAQ says its JP label is the foot plus about a centimetre.", ["on", "on running"]),
    "Puma": ("us.puma.com", "Its lengths are its products' measurements, so a foot length finds no Puma size.", ["puma", "pumas"]),
    "Reebok": ("reebok.com", "Prints US sizes and inches alone, no UK or EU.", ["reebok", "reeboks"]),
    "Salomon": ("salomon.com", "", ["salomon"]),
    "Skechers": ("skechers.com", "Prints no foot length.", ["skechers", "sketchers"]),
    "Timberland": ("timberland.com", "", ["timberland", "timberlands", "timbs"]),
    "UGG": ("ugg.com", "", ["ugg", "uggs"]),
    "Under Armour": ("underarmour.com", "Its centimetres are the foot's by its words; its inch column disagrees with them.", ["under armour", "under armor", "underarmour", "ua"]),
    "Vans": ("vans.com", "", ["vans"]),
}

KEYS = ("us_men", "us_women", "uk", "uk_women", "eu", "jp")


def reduce_row(row, basis):
    out = {}
    for key in KEYS:
        value = row.get(key)
        if value is None:
            continue
        low, high = row.get(key + "_low"), row.get(key + "_high")
        if key == "jp" and value > 100:  # adidas prints its JP column in millimetres
            value = value / 10
        out[key] = value
        if low is not None and high is not None:
            out[key + "_lo"], out[key + "_hi"] = low, high
    foot = row.get("foot_mm")
    if basis == "foot" and foot is not None:
        out["foot"] = round(float(foot), 2)
    return out


def main():
    record = json.loads(RECORD.read_text(encoding="utf-8"))
    charts = [c for c in record["charts"] if c.get("product")]
    data = {}
    for name, (site, fact, aliases) in BRANDS.items():
        own = [c for c in charts if c["brand"] == name]
        if not own:
            sys.exit(f"no product chart for {name}")
        data[name] = {
            "name": name,
            "site": site,
            "fact": fact,
            "aliases": aliases,
            "charts": [
                {
                    "line": c["line"],
                    "basis": c["length"]["basis"],
                    "title": c["chart"],
                    "rows": [r for r in (reduce_row(row, c["length"]["basis"]) for row in c["rows"]) if r],
                }
                for c in own
            ],
        }
    used = sum(len(b["charts"]) for b in data.values())
    rows = sum(len(ch["rows"]) for b in data.values() for ch in b["charts"])
    if used != len(charts):
        sys.exit(f"{used} charts used of {len(charts)}")
    html = PAGE.replace("__DATA__", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    OUT.write_text(html, encoding="utf-8", newline="\n")
    print(f"{OUT.name}: {len(data)} brands, {used} charts, {rows} rows, {OUT.stat().st_size} bytes")


PAGE = r"""<title>Shoe Brands Prototype</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
  :root {
    --canvas: #fafaf9; --surface: #ffffff; --raised: #f5f5f4; --ink: #1c1917; --muted: #57534e;
    --accent: #0f766e; --on-accent: #ffffff; --soft: #ccfbf1; --line: #d6d3d1; --edge: #928f8d;
    --flag: #9a3412; --flag-bg: #fff4e8; --flag-line: #f2c9a8;
    --font: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      --canvas: #1c1917; --surface: #292524; --raised: #332f2c; --ink: #fafaf9; --muted: #a8a29e;
      --accent: #2dd4bf; --on-accent: #042f2e; --soft: #134e4a; --line: #44403c; --edge: #78716c;
      --flag: #fdba74; --flag-bg: #3a2112; --flag-line: #7c3f1a;
      color-scheme: dark;
    }
  }
  :root[data-theme='dark'] {
    --canvas: #1c1917; --surface: #292524; --raised: #332f2c; --ink: #fafaf9; --muted: #a8a29e;
    --accent: #2dd4bf; --on-accent: #042f2e; --soft: #134e4a; --line: #44403c; --edge: #78716c;
    --flag: #fdba74; --flag-bg: #3a2112; --flag-line: #7c3f1a;
    color-scheme: dark;
  }
  body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); background: var(--canvas); z-index: 10; }
  body { background: var(--canvas); color: var(--ink); font-family: var(--font); font-size: 15px; line-height: 1.5;
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 20px 56px; }
  main { max-width: 576px; margin: 0 auto; display: grid; gap: 20px; }
  h1 { font-size: 1.45rem; line-height: 1.2; margin: 0 0 4px; text-wrap: balance; }
  h2 { font-size: 1rem; margin: 0 0 4px; text-wrap: balance; }
  p { margin: 0; max-width: 65ch; }
  .lede, .muted { color: var(--muted); }
  .flag { color: var(--flag); background: var(--flag-bg); border: 1px solid var(--flag-line); border-radius: 6px; padding: 1px 8px; font-size: 0.78rem; font-weight: 600; display: inline-block; margin-bottom: 8px; }
  .head { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--canvas); padding-bottom: 8px; display: grid; gap: 8px; }
  .box { background: var(--surface); border: 1px solid var(--edge); border-radius: 12px; padding: 8px 10px; display: grid; gap: 6px; }
  .box input { width: 100%; box-sizing: border-box; border: 0; background: transparent; color: var(--ink); font: inherit; font-size: 1.25rem; padding: 4px 2px; outline: none; min-height: 44px; font-variant-numeric: tabular-nums; }
  .box input:focus-visible { box-shadow: 0 0 0 2px var(--accent); border-radius: 6px; }
  .read { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-height: 28px; font-size: 0.85rem; color: var(--muted); }
  .read .n { color: var(--ink); font-weight: 600; font-size: 1rem; font-variant-numeric: tabular-nums; }
  .chip { border-radius: 999px; background: var(--raised); border: 1px solid var(--line); padding: 2px 10px; font-size: 0.85rem; white-space: nowrap; color: var(--ink); display: inline-flex; align-items: center; gap: 6px; }
  .chip b { color: var(--muted); font-weight: 600; }
  .chip.brand { border-color: var(--accent); }
  .chip button { all: unset; cursor: pointer; color: var(--muted); font-weight: 700; padding: 0 2px; line-height: 1; min-width: 20px; text-align: center; }
  .chip button:hover, .chip button:focus-visible { color: var(--ink); outline: 2px solid var(--accent); border-radius: 50%; }
  .ignored { color: var(--flag); }
  .examples { display: flex; gap: 6px; flex-wrap: wrap; }
  .examples button { all: unset; cursor: pointer; border: 1px solid var(--line); background: var(--surface); color: var(--ink); border-radius: 999px; padding: 6px 12px; font-size: 0.85rem; min-height: 32px; }
  .examples button:hover { border-color: var(--edge); }
  .examples button:focus-visible { outline: 2px solid var(--accent); }
  .table { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 8px; display: grid; gap: 2px; font-variant-numeric: tabular-nums; }
  .sec { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 600; padding: 12px 10px 4px; display: flex; justify-content: space-between; gap: 8px; }
  .sec:first-child { padding-top: 4px; }
  .sec .scale { text-transform: none; letter-spacing: 0; font-weight: 500; }
  .row { all: unset; box-sizing: border-box; display: grid; grid-template-columns: minmax(5.5ch, auto) minmax(3.6ch, auto) minmax(0, 1fr); gap: 12px; align-items: center;
    padding: 8px 10px; border-radius: 8px; min-height: 44px; width: 100%; cursor: pointer; color: var(--ink); text-align: left; }
  .row:hover { background: var(--raised); }
  .row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  .row.inbox { background: var(--soft); }
  .row.cursor { outline: 2px solid var(--accent); outline-offset: -2px; }
  .row[disabled] { cursor: default; } .row[disabled]:hover { background: transparent; }
  .row .val { text-align: right; white-space: nowrap; }
  .row .val .ap { color: var(--muted); font-weight: 400; margin-right: 2px; }
  .row.iso .val, .row.dash .val { color: var(--muted); }
  .row .sym { color: var(--muted); font-weight: 600; text-align: right; white-space: nowrap; }
  .row .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .row .name small { color: var(--muted); font-size: 0.85em; margin-left: 6px; }
  .row .tag { color: var(--muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 6px; font-weight: 600; }
  .row.brandrow .name { font-weight: 500; }
  .row.brandrow.inbox .name { font-weight: 600; }
  .note { font-size: 0.85rem; color: var(--muted); padding: 10px 10px 4px; display: grid; gap: 4px; }
  .note .src { color: var(--ink); }
  @media (max-width: 400px) { .row .name small { display: none; } }
  .doc { display: grid; gap: 6px; }
  ul { margin: 0; padding-left: 18px; max-width: 65ch; } li { margin: 3px 0; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.9em; background: var(--raised); padding: 0 4px; border-radius: 4px; }
</style>

<main>
  <header class="doc">
    <span class="flag">Prototype · 2026-10-20 · the checked record (brands.json) and ISO 19407 as core holds it</span>
    <h1>One foot, every brand</h1>
    <p class="lede">Type a size you fit with its brand (<code>nike 10</code>), a size alone (<code>us 9</code>, <code>eu 43</code>), or your foot's length heel to toe (<code>27 cm</code>). The scale rows show one chart, ISO's or the brand's own; each brand's row is that brand's chart read at the same foot. Tap any row to put it in the box, as in the product.</p>
  </header>

  <div class="head">
    <div class="box">
      <input id="q" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="nike 10 · us 9 · 27 cm · women 8" aria-label="Size, brand, or foot length">
      <div class="read" id="read"></div>
    </div>
  </div>

  <div class="examples" id="examples"></div>

  <div class="table" id="table"></div>

  <section class="doc">
    <h2>What to try</h2>
    <ul>
      <li><strong>You wear a US 9.</strong> <code>us 9</code>: ISO's scales, and under them what each brand's chart makes of that foot. Then <code>nike 9</code> or <code>new balance 9</code> to start from a shoe you actually own, and watch the other brands move.</li>
      <li><strong>You measured your foot.</strong> <code>27 cm</code>: your size at every brand that gives a foot length; the four that give none say so.</li>
      <li><strong>Women's.</strong> <code>nike women 8</code> or <code>women 8</code>: the women's charts answer, a different last at Nike.</li>
      <li><strong>Edges.</strong> <code>converse 10</code> (the brand that runs large), <code>puma 10</code> then <code>27 cm puma</code> (a chart with no foot length), <code>reebok 10</code> (no UK or EU printed), <code>birkenstock eu 42</code> (ranges as printed), <code>nike 10 to eu</code> (a target).</li>
    </ul>
  </section>

  <section class="doc">
    <h2>Not in this prototype</h2>
    <ul>
      <li>The children's scales and their beyond rows; hiding rows and Edit; Display's fractions and sizing up; the shortcuts map and copying on a second tap; the URL.</li>
      <li>The product's own section order (the visitor's system first), aliases beyond those listed, and typo tolerance.</li>
      <li>A brand's exact printed form for a range is drawn here from its two ends (<code>8–8.5</code>); the product would print the brand's text.</li>
      <li>A brand's second line (Converse's Standard table), widths, and the second batch of brands.</li>
    </ul>
  </section>
</main>

<script>
const DATA = __DATA__;
const UK_STEP = 8.47, EU_STEP = 6.67;
const footOf = { us_men: s => (s + 22) * UK_STEP, us_women: s => (s + 21) * UK_STEP, uk: s => (s + 23) * UK_STEP, eu: s => (s - 2) * EU_STEP, jp: s => s * 10, mm: s => s, cm: s => s * 10 };
const isoOf = { us_men: f => f / UK_STEP - 22, us_women: f => f / UK_STEP - 21, uk: f => f / UK_STEP - 23, eu: f => f / EU_STEP + 2, jp: f => f / 10 };
const SCALES = [
  { key: 'us_men', sym: 'US M', name: 'US men', sec: 'US', word: '' },
  { key: 'us_women', sym: 'US W', name: 'US women', sec: 'US', word: 'women' },
  { key: 'uk', sym: 'UK', name: 'British', sec: 'British', word: 'uk' },
  { key: 'eu', sym: 'EU', name: 'European', sec: 'European', word: 'eu' },
  { key: 'jp', sym: 'JP', name: 'Japanese', sec: 'Japanese', word: 'jp' },
  { key: 'mm', sym: 'mm', name: 'Mondopoint', sec: 'Mondopoint', word: 'mm' },
];
const SIZE_KEYS = ['us_men', 'us_women', 'uk', 'eu', 'jp'];
const BRAND_ORDER = Object.keys(DATA);
const ALIASES = [];
for (const b of BRAND_ORDER) for (const a of DATA[b].aliases) ALIASES.push([a.split(' '), b]);
ALIASES.sort((x, y) => y[0].length - x[0].length || y[0].join(' ').length - x[0].join(' ').length);
const EXAMPLES = ['us 9', 'nike 10', '27 cm', 'nike women 8', 'eu 43 new balance', 'converse 10', 'puma 10', '27 cm puma', 'reebok 10', 'birkenstock eu 42', 'on 10', 'nike 10 to eu'];

const half = x => Math.round(x * 2) / 2;
function fmtSize(v) {
  if (v == null) return null;
  const w = Math.floor(v + 1e-9), f = v - w;
  if (Math.abs(f) < 0.01) return String(w);
  if (Math.abs(f - 0.5) < 0.01) return w + '.5';
  if (Math.abs(f - 1 / 3) < 0.02) return w + '⅓';
  if (Math.abs(f - 2 / 3) < 0.02) return w + '⅔';
  return String(Math.round(v * 100) / 100);
}
const fmtCm = f => (Math.round(f / 1) / 10).toFixed(1).replace(/\.0$/, '') + ' cm';

function scaleWord(w) {
  if (['us', 'usa', 'american'].includes(w)) return 'us';
  if (['uk', 'british', 'gb'].includes(w)) return 'uk';
  if (['eu', 'eur', 'euro', 'european', 'europe'].includes(w)) return 'eu';
  if (['jp', 'japan', 'japanese'].includes(w)) return 'jp';
  if (['mm', 'mondopoint', 'millimeters', 'millimetres'].includes(w)) return 'mm';
  if (['cm', 'centimeters', 'centimetres'].includes(w)) return 'cm';
  return null;
}
function genderWord(w) {
  if (['women', 'womens', 'woman', 'ladies', 'female', 'w'].includes(w)) return 'women';
  if (['men', 'mens', 'man', 'male', 'm'].includes(w)) return 'men';
  return null;
}
function scaleOf(text) {
  let scale = null, gender = null;
  for (const w of text.split(/\s+/)) { const s = scaleWord(w), g = genderWord(w); if (s) scale = s; if (g) gender = g; }
  if (!scale && !gender) return null;
  if (!scale || scale === 'us') return gender === 'women' ? 'us_women' : 'us_men';
  return scale;
}

function parse(text) {
  let t = text.toLowerCase().replace(/[’']s\b/g, '').replace(/[’'.]/g, m => (m === '.' ? '.' : '')).replace(/(\d),(\d)/g, '$1.$2');
  t = t.replace(/(\d)([a-z])/g, '$1 $2').replace(/([a-z])(\d)/g, '$1 $2').replace(/\.(?!\d)/g, ' ');
  let words = t.split(/\s+/).filter(Boolean);
  let target = null;
  const ti = Math.max(words.lastIndexOf('to'), words.lastIndexOf('in'));
  if (ti > 0 && ti < words.length - 1) { const sk = scaleOf(words.slice(ti + 1).join(' ')); if (sk) { target = sk; words = words.slice(0, ti); } }
  let brand = null;
  outer: for (const [aw, b] of ALIASES) {
    for (let i = 0; i + aw.length <= words.length; i++) {
      if (aw.every((w, j) => words[i + j] === w)) { brand = b; words.splice(i, aw.length); break outer; }
    }
  }
  let n = null;
  const ni = words.findIndex(w => /^\d+(\.\d+)?$/.test(w));
  if (ni >= 0) { n = parseFloat(words[ni]); words.splice(ni, 1); }
  let scale = null, gender = null; const ignored = [];
  for (const w of words) {
    const s = scaleWord(w), g = genderWord(w);
    if (s) scale = s; else if (g) gender = g; else if (w !== 'size' && w !== 'sizes' && w !== 'shoe') ignored.push(w);
  }
  if (!scale || scale === 'us') scale = gender === 'women' ? 'us_women' : 'us_men';
  return { brand, n, scale, gender, target, ignored };
}

function chartFor(brand, wantWomen) {
  const cs = DATA[brand].charts;
  return cs.find(c => c.line === (wantWomen ? 'women' : 'men')) || cs.find(c => c.line === 'unisex') || cs[0];
}
function cellOf(chart, row, key, wantWomen) {
  if (!row) return null;
  if (key === 'mm') return chart.basis === 'foot' && row.foot != null ? { text: String(Math.round(row.foot)), approx: Math.abs(row.foot - Math.round(row.foot)) > 0.01, sort: row.foot } : null;
  let k = key;
  if (key === 'uk' && wantWomen && row.uk_women != null) k = 'uk_women';
  const v = row[k];
  if (v == null) return null;
  if (row[k + '_lo'] != null) return { text: fmtSize(row[k + '_lo']) + '–' + fmtSize(row[k + '_hi']), approx: false, low: row[k + '_lo'] };
  return { text: fmtSize(v), approx: false, value: v };
}
function findRow(chart, key, n, wantWomen) {
  let k = key;
  if (key === 'uk' && wantWomen && chart.rows.some(r => r.uk_women != null)) k = 'uk_women';
  for (const r of chart.rows) {
    if (r[k] == null) continue;
    if (r[k + '_lo'] != null) { if (n >= r[k + '_lo'] - 1e-9 && n <= r[k + '_hi'] + 1e-9) return r; }
    else if (Math.abs(r[k] - n) < 1e-6) return r;
  }
  return null;
}
function nearestRow(chart, foot, key) {
  let best = null;
  const k = key === 'uk' && chart.rows.some(r => r.uk_women != null) && chart.wantWomen ? 'uk_women' : key;
  for (const r of chart.rows) {
    if (r.foot == null) continue;
    if (k && k !== 'mm' && r[k] == null) continue; // a row the brand prints no such size on (Dr. Martens' women's-only half sizes)
    const d = Math.abs(r.foot - foot);
    if (!best || d < best.d - 1e-9 || (Math.abs(d - best.d) < 1e-9 && r.foot > best.r.foot)) best = { d, r };
  }
  return best ? best.r : null;
}
function rangeText(chart, key, wantWomen) {
  let k = key; if (key === 'uk' && wantWomen && chart.rows.some(r => r.uk_women != null)) k = 'uk_women';
  const vs = chart.rows.map(r => r[k]).filter(v => v != null);
  if (!vs.length) return null;
  return fmtSize(Math.min(...vs)) + ' to ' + fmtSize(Math.max(...vs));
}
const symOf = key => SCALES.find(s => s.key === key)?.sym || key;
const lineWord = ch => (ch.line === 'men' ? ', the men’s' : ch.line === 'women' ? ', the women’s' : '');
const lineAdj = ch => (ch.line === 'men' ? 'men’s ' : ch.line === 'women' ? 'women’s ' : '');
const poss = name => name + (/s$/.test(name) ? '’' : '’s');
const an = name => (/^[aeiou]/i.test(name) ? 'an ' : 'a ') + name;

function resolve(p) {
  const st = { ...p, wantWomen: p.gender === 'women' || p.scale === 'us_women', chart: null, row: null, foot: null, beyond: null, lengthTyped: p.scale === 'mm' || p.scale === 'cm' };
  if (p.n == null) return st;
  if (!p.brand) { st.foot = footOf[p.scale](p.n); return st; }
  st.chart = chartFor(p.brand, st.wantWomen);
  if (st.lengthTyped) {
    st.foot = footOf[p.scale](p.n);
    st.row = st.chart.basis === 'foot' ? nearestRow(st.chart, st.foot, null) : null;
    return st;
  }
  st.row = findRow(st.chart, p.scale, p.n, st.wantWomen);
  if (!st.row) {
    const r = rangeText(st.chart, p.scale, st.wantWomen);
    st.beyond = r ? `${poss(p.brand)} ${lineAdj(st.chart)}chart runs ${symOf(p.scale)} ${r}.` : `${poss(p.brand)} ${lineAdj(st.chart)}chart prints no ${symOf(p.scale)}.`;
    return st;
  }
  if (st.chart.basis === 'foot') st.foot = st.row.foot;
  return st;
}

// What a scale row shows: {text, approx, kind: 'brand' | 'iso' | 'dash', inbox}
function scaleValue(st, s) {
  const typedHere = s.key === st.scale || (st.lengthTyped && s.key === 'mm');
  if (st.n == null) return { kind: 'dash' };
  if (typedHere) {
    const text = st.lengthTyped ? String(Math.round(footOf[st.scale](st.n))) : fmtSize(st.n);
    return { kind: st.brand ? 'brand' : 'iso', text, approx: false, inbox: true };
  }
  if (!st.brand) {
    if (s.key === 'mm') { const m = Math.round(st.foot); return { kind: 'iso', text: String(m), approx: Math.abs(st.foot - m) > 0.01 }; }
    const v = isoOf[s.key](st.foot), h = half(v);
    return { kind: 'iso', text: fmtSize(h), approx: Math.abs(v - h) > 1e-6 };
  }
  if (st.beyond || !st.row) return { kind: 'dash' };
  const cell = cellOf(st.chart, st.row, s.key, st.wantWomen);
  if (cell) {
    const off = st.lengthTyped && st.row.foot != null && Math.abs(st.row.foot - st.foot) > 0.5;
    return { kind: 'brand', text: cell.text, approx: cell.approx || off, tap: cell };
  }
  if (st.foot == null) return { kind: 'dash' };
  if (s.key === 'mm') { const m = Math.round(st.foot); return { kind: 'iso', text: String(m), approx: Math.abs(st.foot - m) > 0.01, grey: true }; }
  const v = isoOf[s.key](st.foot), h = half(v);
  return { kind: 'iso', text: fmtSize(h), approx: Math.abs(v - h) > 1e-6, grey: true };
}

function brandValue(st, brand, dkey) {
  if (st.n == null) return { kind: 'dash' };
  const ch = chartFor(brand, st.wantWomen);
  if (brand === st.brand) {
    if (st.beyond) return { kind: 'dash', ch };
    if (!st.lengthTyped && dkey === st.scale) return { kind: 'brand', text: fmtSize(st.n), approx: false, inbox: true, foot: st.row?.foot ?? null, ch };
    const cell = cellOf(ch, st.row, dkey, st.wantWomen);
    if (!cell) return { kind: 'dash', why: st.row ? `prints no ${symOf(dkey)}` : 'no foot length', ch };
    const off = st.lengthTyped && st.row.foot != null && Math.abs(st.row.foot - st.foot) > 0.5;
    return { kind: 'brand', text: cell.text, approx: off, inbox: !st.lengthTyped, foot: st.row.foot ?? null, ch, tap: cell };
  }
  if (st.foot == null) return { kind: 'dash', why: st.brand ? 'no foot to read from' : '', ch };
  if (ch.basis !== 'foot') return { kind: 'dash', why: 'no foot length', ch };
  ch.wantWomen = st.wantWomen;
  const r = nearestRow(ch, st.foot, dkey);
  const cell = cellOf(ch, r, dkey, st.wantWomen);
  if (!cell) return { kind: 'dash', why: `prints no ${symOf(dkey)}`, ch };
  return { kind: 'brand', text: cell.text, approx: Math.abs(r.foot - st.foot) > 0.5, foot: r.foot, ch, tap: cell };
}

function canonical(brand, scale, gender, n, unitAfter) {
  const parts = [];
  if (brand) parts.push(DATA[brand].aliases[0]);
  if (scale === 'us_women') parts.push('women');
  else if (scale === 'us_men') { if (gender === 'women') parts.push('men'); }
  else if (scale !== 'mm' && scale !== 'cm') parts.push(scale);
  parts.push(n);
  if (scale === 'mm' || scale === 'cm') parts.push(scale);
  return parts.join(' ');
}
function tapValue(v, key) {
  if (v.tap && v.tap.low != null) return fmtSize(v.tap.low);
  return v.text;
}

const q = document.getElementById('q'), readEl = document.getElementById('read'), tableEl = document.getElementById('table'), exEl = document.getElementById('examples');
for (const e of EXAMPLES) { const b = document.createElement('button'); b.type = 'button'; b.textContent = e; b.addEventListener('click', () => { q.value = e; render(); }); exEl.appendChild(b); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const val = v => (v.kind === 'dash' ? '—' : (v.approx ? '<span class="ap" title="about">≈</span>' : '') + esc(v.text));

function render() {
  const p = parse(q.value), st = resolve(p);
  // The box, read back
  let read = '';
  if (p.n != null) read += `<span class="n">${esc(fmtSize(p.n))}</span>`;
  const sc = SCALES.find(s => s.key === p.scale) || (p.scale === 'cm' ? { sym: 'cm', name: 'foot length' } : { sym: p.scale, name: p.scale });
  read += `<span class="chip"><b>${esc(sc.sym)}</b>${esc(sc.name)}</span>`;
  if (p.brand) read += `<span class="chip brand"><b>${esc(p.brand)}</b>${st.chart ? esc(st.chart.line === 'unisex' ? '' : st.chart.line + '’s') : ''}<button type="button" id="unbrand" aria-label="Take the brand out">×</button></span>`;
  if (p.target) read += `<span class="muted">cursor on ${esc(symOf(p.target))}</span>`;
  if (p.ignored.length) read += `<span class="ignored">not read: ${esc(p.ignored.join(' '))}</span>`;
  if (p.n == null && !p.brand) read = '<span class="muted">Read as: nothing yet</span>';
  readEl.innerHTML = read;
  const un = document.getElementById('unbrand');
  if (un) un.addEventListener('click', () => { q.value = canonical(null, p.scale, p.gender, p.n == null ? '' : fmtSize(p.n)).trim(); render(); });

  // The scale rows
  let html = '', sec = null, grey = false;
  const chartName = st.brand && st.chart ? `${st.brand}${st.chart.line === 'unisex' ? '' : ' · ' + st.chart.line + '’s'}` : 'ISO 19407';
  for (const s of SCALES) {
    if (s.sec !== sec) { sec = s.sec; html += `<div class="sec"><span>${esc(sec)}</span>${s.key === 'us_men' ? `<span class="scale">${esc(chartName)}</span>` : ''}</div>`; }
    const v = scaleValue(st, s);
    if (v.grey) grey = true;
    const cls = ['row', v.inbox ? 'inbox' : '', v.kind === 'dash' ? 'dash' : '', v.grey ? 'iso' : '', p.target === s.key ? 'cursor' : ''].filter(Boolean).join(' ');
    const tag = v.grey ? '<span class="tag">ISO</span>' : '';
    const dis = v.kind === 'dash' ? ' disabled' : '';
    html += `<button type="button" class="${cls}" data-scale="${s.key}" data-value="${v.kind === 'dash' ? '' : esc(tapValue(v, s.key))}"${dis}><span class="val">${val(v)}</span><span class="sym">${esc(s.sym)}</span><span class="name">${esc(s.name)}${tag}</span></button>`;
  }
  // The brand rows
  const dkey = SIZE_KEYS.includes(st.scale) ? st.scale : (st.wantWomen ? 'us_women' : 'us_men');
  html += `<div class="sec"><span>Brands</span><span class="scale">the same foot, in ${esc(symOf(dkey))}</span></div>`;
  if (st.brand && st.foot != null) {
    const v = isoOf[dkey](st.foot), h = half(v);
    html += `<button type="button" class="row brandrow iso" data-brand="" data-scale="${dkey}" data-value="${esc(fmtSize(h))}"><span class="val">${(Math.abs(v - h) > 1e-6 ? '<span class="ap" title="about">≈</span>' : '') + esc(fmtSize(h))}</span><span class="sym">${esc(symOf(dkey))}</span><span class="name">ISO 19407<small>${esc(fmtCm(st.foot))}</small></span></button>`;
  }
  for (const b of BRAND_ORDER) {
    const v = brandValue(st, b, dkey);
    const line = v.ch && v.ch.line !== 'unisex' ? ' · ' + v.ch.line + '’s' : '';
    const small = v.kind === 'dash' ? (v.why ? `<small>${esc(v.why)}</small>` : '') : (v.foot != null ? `<small>${esc(fmtCm(v.foot))}</small>` : '');
    const cls = ['row', 'brandrow', v.inbox ? 'inbox' : '', v.kind === 'dash' ? 'dash' : ''].filter(Boolean).join(' ');
    const dis = v.kind === 'dash' ? ' disabled' : '';
    html += `<button type="button" class="${cls}" data-brand="${esc(b)}" data-scale="${dkey}" data-value="${v.kind === 'dash' ? '' : esc(tapValue(v, dkey))}"${dis}><span class="val">${val(v)}</span><span class="sym">${esc(symOf(dkey))}</span><span class="name">${esc(b)}${esc(line)}${small}</span></button>`;
  }
  // The note
  const lines = [];
  if (!st.brand) {
    lines.push('<span class="src">ISO 19407’s sizes from the foot’s length, to the half size.</span> Each brand’s row is the brand’s own chart read at that foot, to its nearest half size.');
    lines.push('Type a brand you fit (<code>nike 10</code>), or measure your foot heel to toe and type its length (<code>27 cm</code>).');
  } else {
    const b = DATA[st.brand];
    lines.push(`<span class="src">${esc(poss(st.brand))} size chart${esc(lineWord(st.chart))}, ${esc(b.site)}, read Oct 2026.</span>${b.fact ? ' ' + esc(b.fact) : ''}`);
    if (st.beyond) lines.push(esc(st.beyond));
    else if (st.lengthTyped && st.chart.basis !== 'foot') lines.push(`${esc(st.brand)} gives no foot length, so a length finds no ${esc(st.brand)} size; type ${esc(an(st.brand))} size for its chart. The brands below are read from the length typed.`);
    else if (st.chart.basis !== 'foot' && st.n != null) lines.push(`${esc(st.brand)} gives no foot length, so no other brand is read from ${esc(an(st.brand))} size. Measure your foot and type its length (<code>27 cm</code>) for every brand.`);
    if (grey) lines.push(`Grey rows are ISO 19407’s from the foot ${esc(st.brand)} gives.`);
  }
  html += `<div class="note">${lines.map(l => `<div>${l}</div>`).join('')}</div>`;
  tableEl.innerHTML = html;
  for (const row of tableEl.querySelectorAll('.row:not([disabled])')) {
    row.addEventListener('click', () => {
      const scale = row.dataset.scale, value = row.dataset.value;
      const brand = row.hasAttribute('data-brand') ? (row.dataset.brand || null) : p.brand;
      if (!value) return;
      q.value = canonical(brand, scale, st.wantWomen ? 'women' : p.gender, value);
      render();
    });
  }
}
q.addEventListener('input', render);
let start = '';
try { start = location.hash.replace(/^#/, '').replace(/-/g, ' '); } catch (e) {}
q.value = /^[a-z0-9 ]+$/.test(start) && start.trim() ? start : '';
render();
</script>
"""

if __name__ == "__main__":
    main()
