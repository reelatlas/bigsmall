# Checker A, the brands' words and cells: report (2026-10-21)

The report as the checker returned it, saved by the orchestrator (the `orchestrate` skill, §4). 43 tool calls, 299,070 tokens, about 24 minutes. The rows: `docs/research/shoe-sizes-3/wave2-check.csv` (168 rows over 58 pages, written by `wave2-select.py`).

**Counts.** All 168 rows checked. Nothing was found wrong.

|             | confirmed | corrected | could not reach | wrong |
| ----------- | --------- | --------- | --------------- | ----- |
| Claims (78) | 74        | 1         | 3               | 0     |
| Cells (90)  | 90        | 0         | 0               | 0     |

## Rows corrected or not reached

- **A-C078, Crocs size chart: corrected.** My script did reach the page (HTTP 200). The chart's numbers load in the browser, so the visible page shows "Loading…". But the page's embedded data carries:
  - "Tip: If you're in between sizes, round up . For wide feet order your normal size."
  - "Tip: If your child is between sizes, round up . Juniors size 3 and up can also shop our adult sizes."
  - The length column's label "Heel to Toe Length", with an Inches/Centimeters toggle.
- **A-C035, On's sizing FAQ: could not reach.** The script got an empty shell and the fetcher an empty page. The worker's two copies (`on-us-faq-sizing.html`, `on-us-faq-product.html`) are empty shells too.
- **A-C043, Reebok UK size charts: could not reach.** The connection timed out twice and the fetcher got ECONNREFUSED. The worker holds no copy of this page.
- **A-C077, HOKA size chart: could not reach.** The script got HTTP 410 with "We're Sorry... The page you have requested does not exist or is no longer available." The fetcher hit a header overflow. The worker's copy is an "Access Denied" page, which counts as a refusal.

## Confirmed, with caveats

- **A-C076 (Timberland FAQ) rests only on the worker's saved copy** (`tim-us-howtomeasure.html`), flagged `worker copy`. The live page returned 403 to both my script and the fetcher.
- **Four quotes leave text out without an ellipsis.** The meaning is unchanged:
  - A-C058 drops "Repeat with the other foot, as right and left sizes may be different. Step 3".
  - A-C060 drops "Be sure you're putting your full weight on your foot while tracing."
  - A-C068 joins "most run true to size" to the in-between-sizes sentence, which sits further down the page.
  - A-C076 drops "This will help you determine your foot size."
- **A-C055 (New Balance PDF):** the recorded words hold, but the summary's last clause isn't supported by the PDF's text. "US Men's Standard Running Size" is the heading of the width guide's size row, not of the length scale. The heel scale shows the numbers 4 to 20 and a cm ruler, and the conversion table's column is "Length in cm".
- **A-C070 (Birkenstock US):** the mm chart is as recorded. The fit calculator is not on this page; the sentence comes from the Malaysian page: "This calculation is based on our size chart".
- **A-C030 (Puma, nothing on shoe fit) holds** on the DE page, and on the AU, US, AE and VN pages too: their measuring sections are for clothing only. The SG page is not in the file.
- **Typos and errors that are the pages' own, kept as printed:**
  - adidas Bahrain prints garbled characters ("1.Step on Ð° piece", "2.Ðœark"), A-C049.
  - Reebok CA says "Measure your marketing", A-C041.
  - Dr. Martens US says "try ordering your usual faq", A-C067.
  - Birkenstock Malaysia says "If are unsure", A-C071.
  - Salomon prints decimals with commas (21,5).
  - Seen in passing, not in a row: Reebok CA's chart prints US Women 7.5 between 6 and 7.
- **The worker's garbled characters (�)** stand for the page's dashes, apostrophes and "®" (A-C004, A-C007, A-C014, A-C016, A-C024). I quote them as the pages print them.
- **Brooks help-centre claims** recorded from the Zendesk search JSON (A-C007, A-C008, A-C009, A-C012, A-C014, A-C015, A-C017) are confirmed from the articles' own pages instead.

## Cells: all 90 exact

- **Brooks UK:** women's rows 1, 9, 17; men's rows 1, 11, 20; all-gender EU and US charts rows 1, 11, 20, including the X cells. The German men's chart matches the UK men's chart cell for cell, all 20 rows.
- **Reebok Canada winter boots:** women's rows 1, 4, 7 and men's rows 1, 5, 8, including "5 - 5 ½".
- **Reebok Australia:** men's rows 1, 13, 24 and women's rows 1, 8, 14. The same charts repeat in the page's other tabs with identical cells.

## Claims with a second page: do the two agree?

**They agree:**

- **Brooks**
  - A-C001: the German page has the same foot-length column, as "Fußlänge (CM)".
  - A-C002: the UK page has the column too (its default chart is the women's).
  - A-C005 and A-C006: the half-size-up advice ("thumb width" on one, "thumb's width" on the other).
  - A-C007: 1/2" to 1" of space.
  - A-C010 and A-C011: "a half size" and "1/2 size" to one size larger.
- **Puma**, A-C023 to A-C025: unisex runs in men's sizes; women go 1.5 sizes down ("smaller" on the AU page).
- **On**
  - A-C031: "True to size" on both.
  - A-C033: the tester page holds the kids' measuring steps in its embedded data.
- **Reebok**, A-C040 and A-C041: the same measuring steps in the US and Canada.
- **Nike**, A-C044 to A-C047: identical.
- **Asics**, A-C051 and A-C052: identical, add 1 to 1.5 cm.
- **Salomon**, A-C053 and A-C054: the women's page says "just in front of" where the men's says "just before".
- **Converse**, A-C057 and A-C058: half a size down.
- **Under Armour**
  - A-C060: identical.
  - A-C061: the US page lacks "Measurements are desired standards, some variability may occur."
- **Dr. Martens**
  - A-C065: the US page adds a US Men's column.
  - A-C066 to A-C068: the same, apart from "usual faq".

**They differ:**

- **Brooks**
  - A-C008: the AU page says about 1/2 inch and has no advice about holes.
  - A-C009: the US page says 1/2" to 1".
  - A-C012: the US size guide has no 1.5-size conversion.
  - A-C013: the help article has no all-gender line.
- **Puma**
  - A-C026: the UAE shoe charts have no length column; its only length table is headed "Product Measurements".
  - A-C027: the AU page shows "Length cm" with no such heading.
- **On**
  - A-C032: the adult page says only "True to size".
  - A-C034: the kids' page has no Brannock advice.
- **Reebok**
  - A-C036: the US page heads its column "Heel-Toe Measurement (in)" and compares "foot length values". Same meaning in other words, and no CM column.
  - A-C037: a different measuring method.
- **Converse**, A-C056: the product page measures differently.
- **Clarks**
  - A-C062: the US page has no note that CM is foot length.
  - A-C063: the AU page has no measuring method.
- **Birkenstock**, A-C071: the US page has no calculator words.
- **Timberland**
  - A-C075: the FAQ traces the foot in socks, big toe to the back of the heel.
  - A-C076: the size chart uses a wall method.

## What the check notes asked that I could not do

- I could not read On's FAQ, Reebok UK or HOKA at all. I could read Timberland's FAQ only through the worker's copy.
- Pages named in the summaries but not in the file were not checked:
  - Brooks: Ireland, Switzerland, and the US men's and all-gender charts.
  - Puma Singapore.
  - Crocs Australia and UK, and Crocs' US FAQ.
  - reebok.eu.
- For A-C055 I could not check the scale's label against the PDF's drawing, only its text.

## Summary

1. The record holds: 164 of 168 rows confirmed, 1 corrected, 3 could not reach, none wrong.
2. Strongest finding: all 90 cells are exact. The Brooks UK and German foot-length columns are as recorded, the German men's chart equals the UK one cell for cell, and the US chart has no foot-length column.
3. Second: Crocs' size-chart page is not empty to a script. Its embedded data has the "round up" tips and the "Heel to Toe Length" label, so A-C078 is corrected.
4. Third: four quotes drop text without an ellipsis (meaning unchanged). A-C055's last clause isn't supported by the PDF text, and A-C070's calculator sentence comes from the Malaysian page.
5. Not reached by either tool: On's FAQ, Reebok UK, HOKA, and Timberland's FAQ (the last read from the worker's copy).
6. Tool calls: 43 of 80.
7. Verdicts: `check-a/check.csv`; pages opened: `check-a/sources.md`; downloads in `check-a/downloads/`; scripts (`write_check.py` builds `check.csv` from `notes.txt`) in `check-a/scripts/`.
