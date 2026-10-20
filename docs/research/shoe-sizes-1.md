# Shoe sizes: ISO/TS 19407's tables as the engine holds them

v0.1, 2026-10-20. The research record for the Shoe size category (ADR 0027), the `research` skill's steps run for a conventional fact: one body's table, transcribed, checked blind, and held by a test. The demand map's shoe-sizes worker gathered the sources and the model on 2026-10-19 (`docs/research/demand-map-1/shoe-sizes/`), and its checker confirmed or corrected every load-bearing claim (`docs/research/demand-map-1/check-a/`); this round turned the standard's tables into data.

## 1. Scope and kind

- **The facts.** How a shoe size in one system reads in another: the European, British, US men's, US women's, Mondopoint, and Japanese scales for adults, and the European, British, and US scales for children.
- **The kind.** Conventional (docs/RESEARCH.md §1): a body's table, ISO's, cited to it; a brand's chart is named as the brand's and never averaged in. Two facts inside it are defined: Mondopoint is the foot's length in millimetres (ISO 9407) and the Japanese scale that length in centimetres, both exact. The arithmetic ISO prints for the adult scales is recomputed on our own and held to its own table.

## 2. Sources

- **ISO/TS 19407:2015, "Footwear — Sizing — Conversion of sizing systems"**, read in full through GOST R 57425-2017, its Russian adoption, which its foreword says is modified only by changing certain references (https://files.stroyinf.ru/Data2/1/4293746/4293746756.pdf, 11 pages, read 2026-10-19 by the worker and again 2026-10-20 here). Its §2.2 gives the scales and the formulas; its Table 1 the adults' technical conversion by foot length; its Table 2 the adults' simplified marking, three gradings rounded to the half size; its Table 3 the children's conversion.
- **ISO 19407:2023**, which replaced it (approved 2023-06-22; SIS's abstract): three tables on foot length for Mondopoint, European, and UK, with China, Japan, Korea, and the US. Its text is paywalled and unread, so whether its numbers differ from 2015's is unknown (the demand map's A01 to A03).
- **ISO 9407:2019**, Mondopoint: the foot's length in millimetres (BSI's scope; China's adoption GB/T 43293-2022, read in an excerpt: "the shoe size shall be expressed by the indicated value of foot length … the unit is millimeter").
- **Set aside** (the worker's and the checker's reading, 2026-10-19): the Brannock device's chart (US men's half a size above UK, measured on the image: a brand's device, not a body), Nike's, Adidas's, Clarks's, Zappos's, KEEN's, and Luft's charts (brands and retailers, each named where the line under the table or a unit's note cites it, none a source for a figure), Wikipedia's table (uncited on the rounding and the women's offset), bakame's open-source converter (prior art for the model, not a source), Haflinger's rule (a brand's).

## 3. The rule as applied

- **The base** is the foot's length in millimetres, Mondopoint. Every adult scale is a straight line over it with the steps as the standard prints them: UK adult = (lf + 2 × 8.47)/8.47 − 25 and EUR = (lf + 2 × 6.67)/6.67 (§2.2 b and c), the shoe two sizes longer than the foot; US men's = UK + 1 and US women's = UK + 2 (§2.2 d). In core: affine units, base = (size + offset) × step, the offsets 23 (UK), 22 (US men's), 21 (US women's), and −2 (EU); Mondopoint linear with factor 1 and the Japanese scale with factor 10.
- **The printed steps, not the exact barleycorn and Paris point** (25.4/3 and 20/3 mm): the checker's recomputation (A15) reproduces 321 of Table 2's 324 values with the printed steps and 317 with the exact ones, so the engine holds what the standard prints, as its formulas do.
- **Every converted size is written to its scale's step**, the half size (Mondopoint to 5 mm), to the nearest as the table rounds (88 of its 162 non-US values sit below the formula's value, so it does not round up), a tie away from zero, the project's rule; the table's own exact ties go both ways (A16), which the test allows for by naming the misses.
- **Children's sizes are Table 3**: straight lines between its rows' (foot length, size) points, each scale's rows up to where it restarts at 1 (the UK after 13.5 at 195 mm, the US after its 13.5 at 192 mm; the European scale does not restart and runs 19.5 to 38, 120 to 236 mm). The adult formulas do not reproduce the table: its feet carry a growth allowance of their own, 3.3 mm above the adult rule at EUR 19.5 and 4.1 mm below it at EUR 38 (the adult rule's two-size allowance is 13.3 mm whatever the foot; the children's is nearer 7.5 % of the last). Each children's unit has a range, the rows' feet half a row's step past each end, as a shoe fits a foot half a step either way (Table 1, note a): 118.5 to 194 mm for US children's, to 196.5 for British, to 238 for European; outside it a row says Out of range.
- **After the restart** the table's sizes are the adult scales': the US youth sizes 1 to 5 (195 to 230 mm) within a third of a size of US men's at the table's rows, the UK junior sizes 1 to 5 (200 to 236 mm) within 0.53 of British, the table's rows standing for European sizes' feet rather than these; so youth and junior sizes need no unit of their own, and the units' notes say so.

## 4. The transcription and its check

- **Read from the page images.** The PDF is a scan whose text layer keeps the digits and loses the Cyrillic and every blank cell (a row of Table 3 with a blank reads as a shorter row of numbers, which column is missing unsaid). The pages were rendered to PNG at 2200 px with Windows' own PDF engine (`Windows.Data.Pdf` from PowerShell; poppler's `pdftoppm`, which the file reader needs, is not on this machine, though `pdftotext` is) and read by eye, the text layer as the second reading of the digits; the blanks are the image's. The data is `shoe-sizes-1/tables.py`: Table 2's three gradings (81 rows, 324 converted values) and Table 3 (38 rows), with the formulas and the recomputation (`python -I tables.py`).
- **Checked blind.** A checker agent, given the three page images and nothing else, transcribed both tables into CSVs with a script of its own (`shoe-sizes-1/check/`, its report in `check.md`), checked that US men's is UK + 1 and US women's UK + 2 in every row and that each grading steps evenly, and found no cell it was unsure of. Compared cell by cell with `tables.py` (2026-10-20): every cell agrees, 324 of Table 2's and 266 of Table 3's.
- **Written once.** `write_tables.py` writes core's copies from `tables.py`: `packages/core/src/units/shoe-size-tables.ts`, Table 3 for the children's scales, and `packages/core/test/iso-19407-table2.ts`, Table 2 for the test. Neither is edited by hand.

## 5. What the test holds

`packages/core/test/shoe-size.test.ts`:

- Table 2's 324 values from the formulas with the printed steps, 321 reproduced and exactly three not, each ISO's rounding at the edge: UK 2 → EUR printed 34 where the formula gives 33.747 (0.0067 steps from the boundary), UK 8 → Mondo printed 260 where it gives 262.57 (0.014), UK 15 → EUR printed 50 where it gives 50.255 (0.0097). A change to a step, an offset, or the rounding fails it.
- US men's one size and US women's two above UK, exactly, at every half size from 2 to 15.
- Table 3 row for row in both directions, each scale up to its restart; after it, the adult scales within the slack above.
- The ranges, and the line carried on outside them so round trips hold everywhere.
- The step on every scale, the prefix on every unit, which units are exact and which by convention; `roundToStep`'s rounding, ties, noise, and Display's directions.
- The grammar: a scale before its number, a bare "us" as men's, "size" and "kids" as the category, the matches' order, "men's" and "mens" one key and the lone foot mark its own, and a query's "to" or "in" tail read by its head. The golden rows (`test/golden/shoe-size.ts`) pin the formulas at the standard's own points and the children's table at 150 mm.

The web's tests (`apps/web/test/converter-state.test.ts`, "shoe sizes"; `formulas.test.ts`) hold the rows written to their step with ≈, the box's own as typed, the children's rows from the table and Out of range beyond it, the sections, the note, the announcement, and the formulas page's "by convention"; the browser test in `table.spec.ts` types "us 11" and reads the table.

## 6. What is thin, and what would settle it

- **The 2023 edition.** ISO 19407:2023 may have changed the 2015 numbers; its text, or a national adoption of it readable in full, would settle it. Until then the 2015 text, read in full, is the body, and the line under the table and the About page cite it.
- **Korea.** The 2023 abstract names the Republic of Korea; its sizes are millimetres by common knowledge, but no source read says so. A lead for an alias on Mondopoint beside China's (whose GB/T 43293 does say millimetres).
- **The women's offset.** ISO's +1 is the anchor; Nike, Clarks, and KEEN count +1.5 and Zappos's FAQ +2 (the checker's A20 to A22). Whether it becomes a setting is Sean's call; the line under the table names the spread.
- **Brands' charts.** Half a size to a size from ISO (ISO's own note; Nike's and Clarks's EU a size above at UK 7). They join as the second value, each named as the brand's, when asked for (ADR 0027).
- **The junior UK sizes.** Table 3 puts UK 3.5 at 220 mm where the adult rule gives 2.97: the standard's own tables disagree by half a size there. The engine holds the adult rule for sizes from 1 up, and the children's table only for the scale before its restart.

## 7. Re-opening

Edit `tables.py` (a cell, a row, a step), run `python -I docs/research/shoe-sizes-1/tables.py` to see what the formulas reproduce, `python -I docs/research/shoe-sizes-1/write_tables.py` to write core's copies, `pnpm format`, and `pnpm test`: the test names every cell the formulas no longer reproduce. A new chart (a brand's, the 2023 edition's) goes beside the tables as its own data, never into them.

## 8. Cost

The blind checker: one agent, 6 tool calls, about 103,000 tokens as the harness counts, six minutes. The orchestrator read the pages itself and typed the data; the rendering and the comparison are the session's scripts (`render-pdf.ps1`, `compare-tables.py`, not kept).
