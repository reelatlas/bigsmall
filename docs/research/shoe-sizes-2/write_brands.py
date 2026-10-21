"""Write the product's brand charts file, `packages/core/data/shoe-brands.json`, from `brands.json`,
the record `brands.py` writes from the keepers (docs/research/shoe-sizes-2.md §9; ADR 0028, ADR
0029): the charts flagged `product: true` by `brands.py`'s `RECOMMENDED`, one or two per brand, every cell as the brand prints
it, keyed by brand id. Core is given the file (`setBrandCharts`): the web app fetches it once Shoe
size opens, the tests and the About page's build hand it over directly. The brands' names, aliases,
shorthand keys, sites, and the facts the note carries are typed once in `packages/core/src/units/shoe-brands.ts`,
never here. Run from the repository root: `python -I docs/research/shoe-sizes-2/write_brands.py`,
then `pnpm format`; `packages/core/test/shoe-brands.test.ts` holds the file to the record cell for
cell."""

from __future__ import annotations

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[3]
RECORD = pathlib.Path(__file__).resolve().parent / "brands.json"
OUT = ROOT / "packages/core/data/shoe-brands.json"

# The file's shape, which the web app checks a fetch by (packages/core/src/units/shoe-brand-charts.ts).
SCHEMA = "bigsmall shoe-brand charts v1"
WRITTEN = (
    "docs/research/shoe-sizes-2/write_brands.py from brands.json, the record of the brands' charts "
    "(docs/research/shoe-sizes-2.md §9): edit the keepers and re-run brands.py, never this"
)

# The record's row keys and the chart's fields they fill; a range's ends are `<key>_low/_high`.
CELLS = (
    ("us_men", "usMen"),
    ("us_women", "usWomen"),
    ("uk", "uk"),
    ("uk_women", "ukWomen"),
    ("eu", "eu"),
    ("jp", "jp"),
)
BASIS = {"foot": "foot", "product": "product", "none": "none", "label": "label"}


def brand_id(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def number(value: float) -> int | float:
    rounded = round(float(value), 4)
    return int(rounded) if rounded == int(rounded) else rounded


def cell(row: dict, key: str) -> int | float | list[int | float] | None:
    value = row.get(key)
    if value is None:
        return None
    low, high = row.get(key + "_low"), row.get(key + "_high")
    if low is not None and high is not None:
        return [number(low), number(high)]
    if key == "jp" and value > 100:  # adidas prints its JP column in millimetres
        value = value / 10
    return number(value)


def write_row(row: dict, basis: str) -> dict | None:
    written: dict = {}
    for key, field in CELLS:
        value = cell(row, key)
        if value is not None:
            written[field] = value
    foot = row.get("foot_mm")
    if basis == "foot" and foot is not None:
        written["foot"] = number(float(foot))
    return written or None


def dumps(value) -> str:
    return json.dumps(value, ensure_ascii=False)


def main() -> None:
    record = json.loads(RECORD.read_text(encoding="utf-8"))
    charts = [c for c in record["charts"] if c.get("product")]
    by_brand: dict[str, list[dict]] = {}
    for chart in charts:
        by_brand.setdefault(chart["brand"], []).append(chart)
    lines = [
        "{",
        f'  "schema": {dumps(SCHEMA)},',
        f'  "written": {dumps(WRITTEN)},',
        f'  "read": {dumps(record["date"])},',
        '  "charts": {',
    ]
    brands = sorted(by_brand, key=str.lower)
    rows_total = 0
    for at, name in enumerate(brands):
        lines.append(f"    {dumps(brand_id(name))}: [")
        entries = sorted(by_brand[name], key=lambda c: ("men", "women", "unisex").index(c["line"]))
        for e, chart in enumerate(entries):
            rows = [r for r in (write_row(row, chart["length"]["basis"]) for row in chart["rows"]) if r]
            rows_total += len(rows)
            source = chart["source"]
            if isinstance(source, list):
                source = "; ".join(source)
            lines.append("      {")
            lines.append(f'        "line": {dumps(chart["line"])},')
            lines.append(f'        "basis": {dumps(BASIS[chart["length"]["basis"]])},')
            lines.append(f'        "title": {dumps(chart["chart"])},')
            lines.append(f'        "source": {dumps(source)},')
            lines.append(f'        "read": {dumps(record["date"])},')
            lines.append('        "rows": [')
            for r, row in enumerate(rows):
                # One row a line, as Prettier keeps an object that fits: `{ "usMen": 4, "uk": 3.5 }`.
                body = ", ".join(f"{dumps(k)}: {dumps(v)}" for k, v in row.items())
                lines.append(f"          {{ {body} }}{',' if r < len(rows) - 1 else ''}")
            lines.append("        ]")
            lines.append("      }" + ("," if e < len(entries) - 1 else ""))
        lines.append("    ]" + ("," if at < len(brands) - 1 else ""))
    lines.extend(["  }", "}", ""])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(charts)} charts, {len(brands)} brands, {rows_total} rows")


if __name__ == "__main__":
    main()
