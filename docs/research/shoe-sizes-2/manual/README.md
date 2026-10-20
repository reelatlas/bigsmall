# Brand shoe-size charts — manual capture (Sean, 2026-10-20)

Captured by hand from each brand's own size guide (paste + screenshots), for the
brands the fetcher could not read (docs/research/shoe-sizes-2.md). Artifact for
eyeballing: https://claude.ai/artifact/XPjhYC6PkmBrD8P8BtCaUa

## Files

- `brand-charts.json` — the data. `brands.<key>` per brand:
  - `source`, `measurement` (basis, how_to_measure_*, in_between_sizes, fit_note,
    widths, **quirks** — site typos and cross-table contradictions, kept as published)
  - `charts.<table>` — one table per age/gender/line; parallel arrays, index i = one
    size across every array; `columns` = length; `null` = '-' / 'N/A' on the site.
    `*_label` keeps the brand's text (fractions, '10.5C', '5D'); numeric twin beside it.
  - `widths.<table>` (New Balance) — ball width per US size, `w_<letter>_cm/in`.
- `brand-charts-check.html` — the artifact page (same JSON embedded, brand tabs,
  row-length check per table).

## Brands (7): adidas, new_balance, vans, ugg, hoka, timberland, on

## Field names

heel_toe_cm / heel_toe_in = foot length as the brand prints it; jp = Japan (cm label);
mx = Mexico (cm); cn = China (mm); br = Brazil; us_men / us_women / us_kids / us_youth /
us_boy; uk; eu (+ eu_label for thirds).

## Things code must handle (full list in each brand's quirks)

- Men's and women's charts disagree on EU/UK at the same foot length for UGG, On,
  Timberland, HOKA (different lasts). Never merge by cm across genders.
- US women = men + 1 (adidas, UGG, Timberland, On) or + 1.5 (New Balance, Vans).
- HOKA and On kids: measured foot length ≠ JP label (1/6-in grid vs 0.5-cm label).
- Inch vs cm columns disagree on some tables (adidas > US-M 15, Timberland PRO women,
  HOKA men's regular width); cm is canonical except where the quirk says otherwise.
- HOKA all-gender regular: length rows misaligned on the site; use its size rows only.
