"""Write core's copy of the brands' charts from `brands.json`, the record `brands.py` writes from the
keepers (docs/research/shoe-sizes-2.md §9; ADR 0028): the 33 charts flagged `product: true`, one or
two per brand, every cell as the brand prints it, keyed by brand id. The brands' names, aliases,
sites, and the facts the note carries are typed once in `packages/core/src/units/shoe-brands.ts`,
never here. Run from the repository root: `python -I docs/research/shoe-sizes-2/write_brands.py`,
then `pnpm format`; `packages/core/test/shoe-brands.test.ts` holds the written charts to the record
cell for cell."""

from __future__ import annotations

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[3]
RECORD = pathlib.Path(__file__).resolve().parent / "brands.json"
OUT = ROOT / "packages/core/src/units/shoe-brands-data.ts"

HEADER = (
    "// Written by docs/research/shoe-sizes-2/write_brands.py from brands.json, the record of the brands'\n"
    "// charts (docs/research/shoe-sizes-2.md §9): edit the keepers and re-run brands.py, never this.\n"
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


def number(value: float) -> str:
    text = f"{value:.4f}".rstrip("0").rstrip(".")
    return text if text else "0"


def cell(row: dict, key: str) -> str | None:
    value = row.get(key)
    if value is None:
        return None
    low, high = row.get(key + "_low"), row.get(key + "_high")
    if low is not None and high is not None:
        return f"[{number(low)}, {number(high)}]"
    if key == "jp" and value > 100:  # adidas prints its JP column in millimetres
        value = value / 10
    return number(value)


def write_row(row: dict, basis: str) -> str | None:
    parts = []
    for key, field in CELLS:
        written = cell(row, key)
        if written is not None:
            parts.append(f"{field}: {written}")
    foot = row.get("foot_mm")
    if basis == "foot" and foot is not None:
        parts.append(f"foot: {number(float(foot))}")
    if not parts:
        return None
    return "      { " + ", ".join(parts) + " }"


def ts(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def main() -> None:
    record = json.loads(RECORD.read_text(encoding="utf-8"))
    charts = [c for c in record["charts"] if c.get("product")]
    by_brand: dict[str, list[dict]] = {}
    for chart in charts:
        by_brand.setdefault(chart["brand"], []).append(chart)
    order = sorted(by_brand, key=str.lower)
    blocks = []
    for name in order:
        entries = []
        for chart in sorted(by_brand[name], key=lambda c: ("men", "women", "unisex").index(c["line"])):
            rows = [r for r in (write_row(row, chart["length"]["basis"]) for row in chart["rows"]) if r]
            source = chart["source"]
            if isinstance(source, list):
                source = "; ".join(source)
            entries.append(
                "  {\n"
                f"    line: '{chart['line']}',\n"
                f"    basis: '{BASIS[chart['length']['basis']]}',\n"
                f"    title: {ts(chart['chart'])},\n"
                f"    source: {ts(source)},\n"
                f"    read: '{record['date']}',\n"
                "    rows: [\n" + ",\n".join(rows) + ",\n    ],\n"
                "  }"
            )
        blocks.append(f"  '{brand_id(name)}': [\n" + ",\n".join(entries) + ",\n  ]")
    text = f"""{HEADER}
/** The line a chart is printed for: a men's or a women's page, or one chart for everyone. */
export type BrandLine = 'men' | 'women' | 'unisex';

/**
 * What the chart's length column is, by the brand's own words (docs/research/shoe-sizes-2.md §7
 * to §9): the foot's, measured heel to toe; the product's (Puma's measurements); a size label
 * (On's Japan column); or none printed.
 */
export type LengthBasis = 'foot' | 'product' | 'label' | 'none';

/**
 * One row of a brand's chart, every cell as the brand prints it: a size on each scale the chart
 * has (a range where the brand prints one, its two ends), the British women's where the brand
 * prints men's and women's UK apart (Crocs), the Japan or CM column as a label in centimetres,
 * and the foot's length in mm where the brand says its length is the foot's.
 */
export interface BrandChartRow {{
  usMen?: number | readonly [number, number];
  usWomen?: number | readonly [number, number];
  uk?: number;
  ukWomen?: number;
  eu?: number | readonly [number, number];
  jp?: number;
  foot?: number;
}}

/** A brand's chart as published: its line, its length's basis, its name on the page, its page, and its rows. */
export interface BrandChart {{
  line: BrandLine;
  basis: LengthBasis;
  title: string;
  source: string;
  /** The date the page was read, ISO 8601. */
  read: string;
  rows: readonly BrandChartRow[];
}}

/** The product's charts by brand id (docs/research/shoe-sizes-2.md §5, decision 1): {len(charts)} charts, {len(order)} brands. */
export const BRAND_CHARTS: Readonly<Record<string, readonly BrandChart[]>> = {{
{",\n".join(blocks)},
}};
"""
    OUT.write_text(text, encoding="utf-8", newline="\n")
    rows = sum(len(c["rows"]) for c in charts)
    print(f"written: {OUT.relative_to(ROOT)} ({len(order)} brands, {len(charts)} charts, {rows} rows)")


if __name__ == "__main__":
    main()
