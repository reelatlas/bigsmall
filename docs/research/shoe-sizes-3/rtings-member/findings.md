# The RTINGS member read, in Sean's Chrome: findings (2026-10-21)

The report as the worker returned it, saved by the orchestrator (the `orchestrate` skill, §4). 52 tool calls, 180,171 tokens, about 11 minutes, through the Claude in Chrome extension in Sean's Chrome, under his RTINGS membership (taken 2026-10-21, the hundred-and-thirtieth pass; his email to RTINGS says how the figures are used), reading the Results Table Tool as a person would.

**The answer:** Sean's membership showed every measurement. I recorded all 206 running shoes from the twenty brands that RTINGS has tested. That is 618 cells: internal length, heel width and forefoot width per shoe, all in mm. Eleven of the twenty brands appear in the table. Every internal length sits between 260 and 286 mm. RTINGS says its test size is a men's US 9, but it also says some older shoes were measured on men's US 8 or 13, so the size is not confirmed for every shoe.

## How the page showed the member state

- **Account menu:** on the Results Table Tool, it showed "Membership renews on October 21 2027" and a LOG OUT button.
- **Columns:** I added Internal Length, Internal Heel Width and Internal Forefoot Width through the tool's own "Add Columns" panel. Every cell showed a value such as `275 mm (10.8")`. No cell had a lock, blur, "N/A" or upgrade prompt.
- **Rows:** the table read "308 of 308 running shoes". One press of LOAD MORE showed all 308 rows.
- **Screenshot:** saved as the record.
- **One oddity:** a URL I guessed for a test article gave a 404 page. That page showed a "LOGIN / JOIN NOW" header. The pages after it showed the member header again, so I read it as that error page's own header, not a lost session.

## Size tested and method, in RTINGS' words

- **Test size** ("How we test", https://www.rtings.com/running-shoes/learn/how-we-test, updated Oct 02, 2026). The page itself warns it "isn't fully up to date". It says: "These measurements are specific to our test size (a men's US size 9)."
- **The exception** (Test Bench 0.10 changelog, https://www.rtings.com/running-shoes/tests/changelogs/0-10): "For some shoes we had already reviewed before adding this test bench, measurements were taken on men's US sizes 8 and 13."
  - That sentence is about the 3D scans of the shoe's inside.
  - It does not name the shoes, and it does not say whether the internal length came from the same pair.
  - The changelog calls the internal figures "our existing footbed measurements".
- **Internal length** (the column's tooltip on the Pegasus 41 review, read by hovering): "The footbed's length measured from the heel's back to the toe box's end." Its good-value line: "A typical men's size 9 shoe has an internal length of about 270 mm."
- **Widths:** the heel width is "The width of the footbed at 12% of the internal length". The forefoot width is "Width of the footbed at 75% of the internal length".
- **Instrument:** RTINGS names the Artec Space Spider 3D scanner for shape, and "a mold of the shoe's interior" for fit. It never says which tool takes the internal length.
- **Pairs and variance:** one pair is kept for lab tests ("our tester always uses one dedicated pair of each shoe for lab testing"). No variance is stated for the internal length.
- **Per-shoe size:** I opened 4 reviews, within the limit of 5. Only the Pegasus 41 states its size: "We tested the Nike Pegasus 41 in men's US size 9, as noted on the label." That shoe is on the 0.10 retest list. The Streakfly (a database-only page), Crocs Classic Clog and Brooks Ghost Max 2 reviews state no size.

## Per brand: shoe count and internal length, lowest to highest

| Brand        | Shoes | Internal length (mm)                                               |
| ------------ | ----- | ------------------------------------------------------------------ |
| Asics        | 36    | 260 to 286                                                         |
| Brooks       | 31    | 272 to 283                                                         |
| Nike         | 27    | 264 to 285                                                         |
| HOKA         | 25    | 269 to 282                                                         |
| adidas       | 23    | 272 to 281                                                         |
| New Balance  | 18    | 270 to 283                                                         |
| On           | 18    | 269 to 281                                                         |
| Puma         | 15    | 265 to 283                                                         |
| Salomon      | 5     | 275 to 280                                                         |
| Skechers     | 4     | 273 to 280                                                         |
| Under Armour | 3     | 275 to 276                                                         |
| Crocs        | 1     | 276 (the Classic Clog, which RTINGS lists among its running shoes) |

Converse, Vans, Reebok, Clarks, Dr. Martens, Birkenstock, Timberland and UGG have no shoes in the table.

## What could not be read, and caveats

- **Size not confirmed for 134 of the 206 shoes.** These were reviewed before Test Bench 0.10: they are on its retest list or still on version 0.8.2. Each carries a note in the CSV saying so. No row is above 286 mm, which is far short of what a US 13 would measure, but the table cannot rule out a US 8.
- **No line in the table.** It does not say men's, women's or unisex, so `line` is recorded as not stated and the size as US men's 9 from the methodology page.
- **No method article for internal shape.** /running-shoes/tests redirects to /research, my guessed article URL was a 404, and no changelog is titled for it. The method above comes from tooltips and how-we-test only.
- **Shoe links for only 17 shoes.** The page lists only the rows on screen, so I captured 14 links from the table and 3 from the reviews I opened. The other rows carry the table's URL.
- **Two cells copied as shown, with a flag:**
  - New Balance SuperComp Rebel shows heel 93 mm and forefoot 64 mm, probably swapped at the source.
  - Nike Streakfly shows a heel of 34 mm, far below every other row.

## Summary

1. The answer: all 308 rows were unlocked under the membership. 206 shoes from 11 of the twenty brands give 618 cells, internal lengths 260 to 286 mm. The test size is men's US 9 by RTINGS' own words, with a stated exception (US 8 or 13) for some older shoes.
2. Strongest finding: the test size is men's US 9 ("How we test", https://www.rtings.com/running-shoes/learn/how-we-test).
3. Strongest finding: the internal length is the footbed from the back of the heel to the end of the toe box; the widths are taken at 12% and 75% of that length (the tooltips on https://www.rtings.com/running-shoes/reviews/nike/pegasus-41).
4. Strongest finding: some pre-0.10 shoes were measured on men's US 8 or 13, so 134 rows carry a flag (https://www.rtings.com/running-shoes/tests/changelogs/0-10).
5. Not reached: an internal-shape method article, the pair count and variance, the line of each shoe, and shoe links for 189 shoes.
6. No figure was locked, so nothing was ruled out. No averages or conversions are mine.
7. Eight brands are absent: Converse, Vans, Reebok, Clarks, Dr. Martens, Birkenstock, Timberland and UGG.
8. Tool calls: 52 of 70.
9. Files: `rtings-member/measurements.csv`, `sources.md`, `pages/results-table-rows.txt` (all 308 rows, each page cell joined on one line), `pages/methodology-pages.txt` (the passages on size and internal shape), `screenshots/results-table-internal-shape-member.jpg`, and the script that builds the CSV, `scripts/build_csv.py`.
