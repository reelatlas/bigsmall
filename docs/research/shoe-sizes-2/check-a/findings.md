# Checker A: brands-a's cells and claims (wave 2)

Checker's report, 2026-10-20. Delivered as the checker's reply and saved here by the orchestrator. Rows A01 to A105 of `wave2-check.csv`: Nike, Asics, Converse, Puma, Reebok, Skechers, Under Armour. Cost (the orchestrator's record): 198,865 tokens as the harness counts, 31 tool calls, about 12 minutes.

All 105 of my rows are confirmed as the workers recorded them. Nothing was corrected, wrong or out of reach. I used 31 tool calls.

**Counts:** confirmed 105, corrected 0, could not reach 0, wrong 0.

- 95 rows were read by script: curl, then a parse run with `python -I`.
- The nine Asics Singapore cells (A32–A40) were read through the fetcher, because the script got a 403 "Access Denied" from Akamai. A41 used both: the NZ page by script, the SG page by fetcher.
- I never opened the worker's saved copy, since the fetcher did not fail.

**Corrected, wrong, unreachable:** none. Five rows are confirmed but carry a caveat worth weighing:

- **A67 (Puma):** every value holds, but only Puma's eu.puma.com/de/en page differs from AU. Puma's eu.puma.com/en_GB page prints women's US 7 as UK 4.5 and DE/FR/IT/ES 37.5, exactly as AU does.
  - The de/en women's chart has no US 6.5 row and no 40.5 row, and prints UK 6 at both US 9 (39) and US 9.5 (40).
  - So de/en runs half a US size off en_GB from US 7 to 9.5, and the two agree again at 41 = US 10.
  - Neither European page has a column labelled EU; they have DE, FR, IT and ES.
- **A105 (Under Armour):** the words are on the page exactly as quoted, but they never name the CM column. The reading rests on "If your measurement is between chart numbers, we recommend sizing up."
  - The chart's own Inches column does not match its CM column. At US 7, 9¹¹/₁₆ in is 24.61 cm, 3.9 mm short of the 25 printed beside it.
  - The gap grows to 18.8 mm at US 15 (12¼ in against 33 cm), then drops to 1.6 mm at 15.5 (13⅛ in). The two columns cannot both be the same foot.
- **A68 (Reebok.ca):** the 9" is printed as recorded, but it is not a typo: the inches run 8.8", 9", 9.2" at positions 6 to 8.
  - The odd cell is the US - Women label: "7.5" at position 7, between 6 and 7. Men's 5 plus 1.5 gives 6.5, and 7.5 appears again two positions later with 9.3".
  - reebok.com pairs 9" with men's 5 and women's 6.5.
- **A70 (Reebok.ca unisex):** the 8.5" is as recorded. Its US - Men label is printed "4.5" out of sequence (2, 2.5, 3, 4.5, 4, 4.5, 5), where 3.5 is expected. This one cell is the only difference between that chart and reebok.ca's Men's and Women's chart.
- **A60 (Puma AU):** the kids' chart prints EU "3.5" at Youth US 6.5, between 38 and 39. Calling it a typo for 38.5 is an inference from the neighbouring cells; the page says nothing about it.

**What the check notes asked**

- **Nike (A01–A19):** every cell is as recorded.
  - The page draws the chart sideways (sizes across), so a "row" is a size's position.
  - Foot Length (cm) exists only in `__NEXT_DATA__`, as the Metric toggle. The table in the downloaded HTML is the Imperial view, and its other rows match the JSON exactly.
  - At US men's 9 the page prints two different figures, CM / JP 27 and Foot Length (cm) 26.2, both as recorded.
  - The Big Kids table in the HTML matches its JSON.
  - The GB chart matches the US chart cell for cell; the US chart only adds a US - Kids row (3.5Y–7Y).
  - Nike's cm and inch rows agree within 1.2 mm, which fits two separate roundings of one length.
- **A20 and A21 (Nike claims):** the exact words are:
  - "Please note the CM size displayed on shoe boxes and labels is different than Foot Length (cm)."
  - "…marking the tip of the big toe and the outermost part of the heel. … This measurement represents the length of the foot."
  - "Apply the longer of the two measurements to our size chart to find the right correlating size for the recorded foot length. If the measurement is between sizes, we recommend sizing up."
  - Because A21 also names women, I opened nike.com/size-fit/womens-footwear; it has the same sentences.
- **Asics NZ (A22–A31):** every cell is as recorded. The quarter centimetres in Men's/Unisex Shoe Sizes are 25.75 at US 7.5 (data row 7), 28.25 at US 10.5 (row 13) and 30.75 at US 13.5 (row 19). The same page also prints 28.25 under Work Boots (US 11), and 25.75 (US 9) and 28.75 (US 12.5) under Women's.
- **Asics SG (A32–A40):** I read the page through the fetcher twice.
  - The second read quoted the content in page order. The chart is laid out column by column: four lists (US, EU, CM, UK) of 23 entries each.
  - Positions 1, 12 and 23 give 4 | 36 | 22.5 | 3, then 9H | 43.5 | 27.5 | 8.5, then 15 | 50.5 | 32 | 14, all as recorded.
  - The four values share a row by position only; the fetcher cannot show the row as drawn.
- **A41 (Asics NZ against SG):** every difference named holds. SG's men's chart lists 4H and 14H and NZ's does not; NZ lists 16 and SG stops at 15. Women's US 5 is 22 cm in NZ and 22.5 in SG; 5.5 is 22.5 against 22.75.
  - SG's women's chart also adds US 4 and 4H.
  - SG writes half sizes as "H" and has no column for the other gender's size.
- **Converse (A42–A50):** at US men's 9, Standard Sneakers is 27 cm against Chuck Taylor's 27.5, so 0.5 cm (5 mm) less. Inches are 10.6 against 10.8, UK 8 against 9, US women's 10.5 against 11; EU is 42.5 in both.
  - Exact words: "These sneakers run large — we recommend going down a half size." and "Chuck Taylor All Star runs about a half size large. All other styles: fit may vary — check the product page."
- **Puma:** the AU men's cells are as recorded. The AU unisex chart skips 8.5 (it goes from 8 to 9), and its last column is headed FR. de/en and en_GB differ at US 7, as described under A67.
- **Reebok.com (A72–A76):**
  - At men's 2 the Unisex guide gives women's 3.5 and the Special guide gives 3. Throughout, women's is men's plus 1.5 on the first and plus 1 on the second; the inches are the same at every men's size on both.
  - For A76, the worker's quote stops mid-word. Step 3 reads in full: "Measure your markings in inches. Take the larger of the two foot length values and compare it with our sizing chart."
- **Skechers (A77–A89):**
  - skechers.com's men's chart prints EU 42.5 at US 9, 9.5 and 10. skechers.co.uk prints 42, 42.5 and 43. Those two cells are the only differences across the two sites' four charts.
  - On the Kids' chart, -L is on 10.5 through 3, and on 4, 4.5 and 5.5; 3.5, 5, 6, 6.5 and 7 carry none.
  - The page never says what L means. The site menu's "Little Kids (Sizes 10.5-3.0) Big Kids (Sizes 3.5-7)" would explain L on 10.5 to 3 but not on 4, 4.5 or 5.5; that last point is my own observation, not the page's.
- **Under Armour women's (A101–A104):** at US 5 the US site prints 22.5 cm and UK 3, the UK site 22 cm and UK 2.5; Euro is 35.5 on both.
  - Across the chart, the UK site's CM is 0.5 lower at US 5–6, equal at 6.5–7, and 0.5 higher at 7.5–12. It climbs 0.5 per half size, while the US site prints 23.5 twice and 24 twice.
  - The UK site's UK column is 0.5 lower at US 5–8 and equal from 8.5.

**Summary**

1. All 105 rows are confirmed; no cell or quote needed a correction.
2. Puma's two European pages disagree on women's US 7 to 9.5, and AU agrees with en_GB. So the "Australia against Europe" contrast is a quirk of the de/en page.
3. Under Armour's men's Inches and CM columns disagree by up to 18.8 mm, and the page's words never say which one is the foot.
4. Reebok.ca's typos are in the size labels, not the inches.
5. Nike's foot length in cm exists only in the page's embedded JSON, the Metric toggle.
6. Asics Singapore refused the script with a 403. The fetcher read its column lists, so the row alignment there rests on position.
7. Nothing else was refused. One extra page (Nike women's) was opened for A21.
8. Files are in the checker's scratchpad folder `shoe-sizes-2/check-a/`: `check.csv`, `sources.md` (22 entries, in order), `downloads/` (pages, response headers, fetch log, and the fetcher's transcriptions as .txt; not kept), `scripts/`.
