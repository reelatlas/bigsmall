# Checker B: brands-b's cells and claims (wave 2)

Checker's report, 2026-10-20. Delivered as the checker's reply and saved here by the orchestrator. Rows B01 to B68 of `wave2-check.csv`: Clarks, Dr. Martens, Birkenstock, Crocs, Salomon, Brooks. Cost (the orchestrator's record): 271,621 tokens as the harness counts, 34 tool calls, about 18 minutes.

**Checker B, wave 2 of the brands' charts: 62 of my 68 rows confirmed, 2 corrected, 4 could not reach, none wrong.** Every value I could read matched the worker's.

## Corrected and unreachable rows

**B21, B22 (Dr. Martens US, row 5, UK 6.5) and B25, B26 (row 9, UK 9.5): could not reach which US column is blank.**

- My script got Cloudflare's 403 bot check.
- The fetcher's first transcription put 8.5 and 11.5 under US Men's and the blank under US Women's, as the worker had.
- Asked again, the fetcher said its source is flattened text with no cell boundaries: "The source does not show which position is empty."
- The worker's saved copy, opened only after that, is Cloudflare's "Help us verify real visitors" page, with no chart.
- What is certain: the rows read 25.5 | 9.2 | 6.5 | 40 | 8.5 and 28.5 | 9.8 | 9.5 | 44 | 11.5.
- An inference, not a reading: in every full row, US Men's is UK + 1 and US Women's is UK + 2. By that, 8.5 and 11.5 belong under US Women's and the blank under US Men's, the reverse of what was recorded. These four rows need checking in a real browser before they ship.

**B51 (Crocs, claim): corrected.** The worker's quoted step, "3. Measure the point from your heel to your longest toe. This is your Heel-to-Toe length.", is not on crocs.com/size-chart.

- It is not in the HTML, the Next.js data with its English strings, or any of the page's 42 scripts.
- The fetcher also found "no numbered steps, heel-to-toe instructions, tracing or paper-based directions".
- The modal's "Learn how to measure" link points back to /size-chart itself.
- The page's own words: the column label "Heel to Toe Length"; the meta description "Find the perfect size for your Crocs shoes with our size chart. Measure your foot and find the right size for your Crocs shoes."; and the tip "Tip: If you're in between sizes, round up. For wide feet order your normal size."
- So "heel to toe" and "measure your foot" stand; "measured by tracing" has no support.

**B57 (Salomon, claim): corrected in scope.** The words are in the page's data: "If the width is more than 107mm (4.21’’), your foot is wide. To have a better fit, you can: - order the wide version of the model if it available - or, you can add +0.5 to your order size."

- They appear only in two kids' charts: "Kid's Snowboard Boots (Project BOA)" and "(Whipstar)".
- The Unisex, Men's, Women's and Kid's Footwear entries say nothing about width.

## What the check notes asked

**Clarks**

- **GB men's UK 10:** Clarks EU 44½, Standard EU 45, 280 mm. **Women's UK 5:** EU 38 in both columns, 237 mm.
- **Kids' row 7** is the infant 5: EU 21, 126 mm, as recorded.
  - The kids' chart runs 2 to 13½, then restarts at 1 and runs to 10.
  - Its second UK 5 (row 33) reads EU 38, 236 mm. That is the row a millimetre under the women's 237, so the check's expectation fits row 33, not row 7.
- **B08:** "*These measurements do not correlate to measuring with a Clarks foot gauge." It sits at the end of the measuring steps, above the kids' chart, on both the IE and GB pages.
- **US men's rows 1, 8 and 14:** every cell as recorded (7/6/9.7, 10½/9½/10.9, 15/14/12.4).
- **Swelling advice:** on the women's page, under "Account for Foot Swelling". The men's page has none.
- **AU:** the chart sits in the page's Womens tab: UK 4 | EU 37 | US 6.5 | CM 22.9. Aside: the AU men's table has no CM column; its fourth heading reads "UK" and repeats the UK sizes.

**Dr. Martens (read through the fetcher)**

- **The blank columns:** unresolved, as above.
- **Row 6 (UK 7):** 26 | 9.3 | 7 | 41 | 8 | 9. The fetcher says the "Foot length" heading carries no unit, and neither does "Foot width".
- **DK page** (heading "DR. MARTENS SIZING GUIDE"): UK 7 | EUR 41 | US WOMEN 9 | US MEN 8 | JAPAN 26.
  - There are no blanks, so the 65 flattened values fall into 13 rows of five without ambiguity.
  - Women come before men here, there are whole sizes only, and EUR skips 40 and 44.
- **B33:** as quoted. The page also says "DM's can differ in size depending on the style."

**Birkenstock**

- **US page:** the URL now redirects to /us/us-service-fittingguide.html.
  - Women's "6 - 6 1/2" sits against 37 and men's "10 - 10 1/2" against 43, as recorded.
  - The formula is word for word, with curly apostrophes (Women’s, Men’s), and the chart agrees with it.
- **GB Adults** ("UK sizes and measurements (in mm)"): size 7 reads Length 251 to 260 on both its Narrow and Regular lines. Sizes use comma decimals and jump from 5,5 to 7.
- **PDF layout:** I could not render a page image; there is no PDF renderer on this machine. I read the text layer two ways with pdftotext (Xpdf 4.06):
  - Stream order (`-raw`) gives each row after its label: US Ladies 4-4.5 to 11-11.5 (8 values), US Men 7-7.5 to 17-17.5 (11 values).
  - Position (`-table`) puts US Children under EU 24 to 34, US Ladies under EU 35 to 42, and US Men under EU 40 to 50.
  - EU 40 is the 17th column: MM 260, UK 7,0, US Ladies 9-9.5, US Men 7-7.5. The worker's reading of which US row is which holds.

**Crocs**

- **default.json, adults, row 9 (US men's 10):** cm 28, mm 280, EU 43-44, UK Men 9, US Women 12.
  - At this row the two length fields agree.
  - They differ by a centimetre in rows 1 to 6 (cm 20 to 25 against mm 210 to 260) and by half a centimetre in row 7 (26 against 265).
  - The Korea field is one centimetre above the cm field in every row (290mm here).
- **Which length field the page shows**, from the page script `37cn2zrwdt121.js`:
  - The chart file is chosen by the page's locale: Korea, Japan and GB each have their own, five European locales share `emea.json`, and everything else falls back to `default.json`, loaded with `fetch(`/size-chart/${e}`)`.
  - en-US, en-CA, fr-CA and en-AU open in inches, with a toggle that offers only inches and cm. ko-KR shows mm with no toggle. Every other locale shows cm with no toggle.
  - So default.json's mm field is never displayed; mm appears only for Korea, from korea.json.
- **Kids, C6:** default.json reads EU 21-22, Korea 130; gb.json reads EU 22-23, Korea 155.
  - gb.json's EU runs above default's from C6 on: one size at C6, two at C10, three at J1.
  - gb.json's Korea is higher from C4 to C13 and the same from J1.

**Salomon**

- **US "Unisex Footwear"** (in the page's Next.js data; gender men and women), row 12: 27 cm (10,6 in) | UK 9 | EUR 43 1/3 | US 9.5 M / 10.5 W | JP 27,5. JP is the foot length plus 0.5 in all 23 rows. The server HTML holds no table.
- **B56:** socks, heel against the wall, and the longer foot are all in that entry's own steps.
- **SG, last row:** UK 14.5 | EUR 50 2/3 | JP 33 | US 15 M | 32,5 cm (comma decimal) | 12,8 in.

**Brooks**

- **Row 14:** the worker's count includes an empty row and a repeated header mid-table. US men's 9 reads US Women 10.5 | UK Men 8 | UK Women 8.5 | EU 42.5 | Japan Men 27 | Japan Women 28.
- **B67:** every repeat and skip named is there. Also: Europe jumps 36.5 to 37.5 and 39 to 40, and Japan Women is blank from US women's 13.
- **B68:** word for word, ® included.

## Summary

1. 62 of 68 confirmed, 2 corrected, 4 could not reach, none wrong.
2. **Strongest finding 1:** on Dr. Martens' two half-size rows, the column of 8.5 and 11.5 can't be read. The chart's own pattern puts them under US Women's, the opposite of what was recorded.
3. **Strongest finding 2:** the Crocs page never shows default.json's mm field: inches (toggle to cm) for US, Canada and Australia, cm elsewhere, mm only for Korea. Its cm/mm gap is in rows 1 to 7, not at US men's 10.
4. **Strongest finding 3:** two claims are out of context. Crocs' measuring step is not on its page, and Salomon's +0.5 wide-foot advice belongs only to kids' snowboard boots.
5. The Birkenstock PDF's text layer, by stream order and by position, agrees with the worker's US Ladies and US Men columns; no page image could be rendered.
6. The 403s, the bot check and the fetcher's flattened text were taken as given; nothing was bypassed.
7. Could not reach: which US column is blank on Dr. Martens US rows 5 and 9.
8. Tool calls: 34 of 80.
9. Results and source log: the checker's scratchpad folder `shoe-sizes-2/check-b/`: `check.csv`, `sources.md`.
10. Downloads and scripts: `check-b/downloads/` (not kept), `check-b/scripts/`.
