# Checker C: the manual capture against Sean's sources (wave 2)

Checker's report, 2026-10-20. Delivered as the checker's reply and saved here by the orchestrator. Rows C01 to C114 of `wave2-check.csv`: adidas, New Balance, Vans, UGG, HOKA, Timberland, On, checked against `manual/sources/<brand>/`. Cost (the orchestrator's record): 284,938 tokens as the harness counts, 45 tool calls, about 18 minutes.

I confirmed all 114 of my rows against the source files; nothing needed a correction.

**Counts:** confirmed 114, corrected 0, could not read 0, wrong 0.

**Corrected, wrong or unreadable rows:** none. Every row index matched the size its note names. Two rows were read in a roundabout way:

- **New Balance's two PDFs** won't render in the Read tool (pdftoppm isn't installed). I pulled their text out with my own pure-Python script, run with `python -I`. Each PDF is 4 pages with the same tables as its page-text file, and every New Balance row reads the same in both.
- **HOKA's all-gender table (C78):** I opened the left end of the inch view and both ends of the cm view. The inch row's count at the right end rests on the pasted text.

**What the check notes asked**

adidas

- **US men's 10 (C01–C06):** 10.7", women's 11, EU 44, UK 9.5, JP 280 and 27.1 cm. They read the same in both pasted adult tables (the men's and women's pages are identical) and in screenshot-01.
- **C07–C08:** row 24 is US men's 17, printed 13.0" beside 32.6 cm. The two columns first disagree at US 16 (12.7" is 32.26 cm, beside 31.8) and stay apart up to US 20 (14.0" is 35.56 cm, beside 35.2). At US 15 (12.4" beside 31.4) they still agree.
- **Kids 4–7 at US 1:** 19.5 cm, UK 13.5k, EU 32.

New Balance

- **Men's 9.5 (C12–C16):** "9.5 | 11 | 27.5 | 10 7/8 | 9 | 43" in both the page text and the PDF.
- **Women's chart against the men's chart's women's column (C17–C20):** they disagree, as the note expected. Both charts pair women's 9.5 with men's 8 and UK 7.5. The women's chart gives 26.5 cm, 10 3/8 in and EU 41; the men's chart gives 26 cm (printed "26", not "26.0"), 10 1/4 in and EU 41.5.
- **Little Kid 2.5 (C21):** UK is printed 5 in both the page text and the PDF. The table's pattern (1.5 → 1, 2 → 1.5, 3 → 2.5) and the men's chart both point to 2.
- **Width at men's 10 (C24–C26):** D is 10.6 cm and 4 1/8 in; 2E is 10.9 cm. Aside: the 2E inch value beside 10.9 cm is printed 4 1/2, which is 11.43 cm.

Vans

- **Men's 10:** women's 11.5, UK 9, EU 43, JP 28, 11.0 in and 28 cm, in both toggles.
- **Toddlers 10C:** 6.2 in and 16 cm are both printed that way, in the pasted text and in screenshots 05 (inch) and 06 (cm). 6.2 in is 15.75 cm, so the toggles differ by 0.1 in.
- **Youth 3.5:** 21.5 cm, UK 2.5, EU 34.5.

UGG

- **Women's 8 and men's 7:** both 9.8 in, JP 25 and UK 6, with EU 39 against 40, as expected.
- **All-gender men's 7:** women's 8, EU 39.5, JP 25. The third mapping is printed.
- **Baby 2/3:** printed as one row of its own, "2/3 | S | 4.3 | 110.2 | 2 | 18 | 11 | 11 | 110". 0/1, 4/5 and 6/7 are single rows in the same way.
- **Kids PDF, toddler 4 (C56–C59):** I read screenshot-10 myself: US 4, UK 3, EU 19, 11.5, China 115, 4.53 in, in the TODDLERS band.
  - One naming point: the guide heads the 11.5 column "(CM) JAPAN / MEXICO" and calls only the inch column "ACTUAL INCHES".
  - 4.53 in is 11.51 cm, so the value holds, but labelling it `heel_toe_cm` is the capture's reading of a size-label column.
- **Women's wide 8D:** 4.2, 9.8, EU 39.

HOKA

- **Women's 8:** 9" 41/64, read across its two pasted lines and in screenshot-01 (24.49 cm, beside the cm toggle's 24.5). JP 25, EU 40, UK 6.5, 93 mm.
- **Men's 10:** 10" 45/64 (27.19 cm, beside 27.2), JP 28, EU 44, UK 9.5, 102 mm and 4" 11/64 (screenshot-15).
- **The width remark holds:** the men's regular inch width runs above its mm row on all 21 columns.
  - The gap is 3.8 to 4.2 mm on 17 columns and 4.9 to 5.1 mm at US 12 to 13.5. At US 10 the inch value is 105.97 mm, beside 102.
  - Foot lengths agree within 0.02 cm, and the women's widths within 0.2 mm.
- **US women's 9:** UK 7.5 in the Regular table, 6.5 in the Wide table. The 6.5 appears in both pasted toggles and in screenshot-05, between 7 (US 8.5) and 8 (US 9.5).
- **All-gender table (C78):** confirmed as claimed. My own count:
  - 22 size columns, M4/W5 to M15/W16, with no M14½. UK, EU, JP, Mexico and China have 22 values each. Foot length and width have 21 each, in both toggles.
  - The values are left-aligned. Screenshots 07 and 09 show 9" 1/16 and 23.0 cm under M4/W5, whose JP is 22 and UK 3½.
  - Screenshot 10 shows the 31.5 cm length and the 113 mm width ending under M14/W15. M15/W16 prints UK 14½, EU 50⅔, JP and Mexico 33 and China 330, but no length or width.
  - The 21 lengths are the men's regular table's, value for value in both units. Each column therefore carries the men's length for one full size above its label (M7/W8 shows men's US 8's 25.6).
  - "M7½/W88½" is printed that way in the pasted text and in three screenshots.
- **Kids youth 3.5:** 22 cm and 8.66 in, printed with two apostrophes as the inch mark.

Timberland

- **Men's 10:** EU 44, UK 9.5, 11 in and 28 cm, in both pasted copies.
- **Women's 8:** EU 39, UK 6, 25 cm, against the men's 25 cm row "40 | 6.5 | 7 | 25", as expected.
- **PRO women's 5:** 8.5 in and 22.5 cm are both printed that way (pasted text, screenshots 17 and 18). The whole PRO women's table disagrees: on all 15 rows the cm copy sits 0.36 to 1.08 cm above the converted inch.
- **Junior 4:** EU 36, UK 3.5, 22.5 cm. US 4.5 also prints 22.5 cm.
- **Toddler 4.5:** 12 cm repeats size 4's 12, while the inches go from 4.7 to 4.8.

On

- **Men's 10:** BR N/A, Mexico 28, EU 44, JP 28, UK 9.5 (screenshots 03 and 04). Men's 8.5 also shows BR N/A, so storing both as null is right. Aside: BR is also N/A at 11 and 14, and 47 is printed for both 13.5 and 15.
- **Women's 8:** BR N/A, Mexico 25, EU 39, JP 25, UK 6 (screenshot 06). On's adult tables print no foot length, so I used JP/Mexico 25 as the length. At that size the men's 7 is EU 40 and UK 6.5, so the women's EU sits a size below, as expected.
- **Kids US 1:** 19.7 cm, 7.8 in, EU 32, UK 13.5 (no k), BR 30 (screenshot 01).
- **C114 claim:** confirmed from the screenshots, not only the pasted headings. Every panel opens with "True to size.", and only the kids panel has "How to measure your kid's feet". The men's panel goes from heading to table to a divider; the women's goes from the table straight to "SHIPPING &amp; RETURNS".

**Summary**

1. **Answer:** all 114 rows are confirmed against the sources; none were corrected, unreadable or wrong.
2. **Strongest finding:** HOKA's all-gender table really is misaligned. It has 22 size columns but only 21 left-aligned lengths, taken from the men's table, and M15/W16 is empty.
3. **Strongest finding:** several brands' own tables print inch and cm values that disagree:
   - adidas from US 16 up;
   - Timberland PRO women's throughout (0.36 to 1.08 cm);
   - HOKA's men's regular width (about 4 to 5 mm);
   - Vans toddlers 10C (0.1 in).
4. **Strongest finding:** New Balance's women's chart and its men's chart disagree for the same size (26.5 cm and EU 41 against 26 and 41.5). Its Little Kid 2.5 prints UK 5 in both the page and the PDF.
5. **Not read:** the New Balance PDFs as images (read as extracted text instead), and the right end of HOKA's all-gender inch view (rests on the pasted text). Screenshots I skipped because the pasted text covered the row are listed in `sources.md`.
6. **Gotcha for the next run:** long Bash heredocs (about 9 KB and up) failed here with an unmatched-quote error, even with no backslashes in them. The Write tool worked.
7. **Tool calls:** 45 of the 70 budgeted.
8. **check.csv** and **sources.md:** the checker's scratchpad folder `shoe-sizes-2/check-c/`.
9. **Scripts and extracted PDF text:** `check-c/scripts/` (the PDF extractor and the HOKA and Timberland comparisons); the PDFs' text in `check-c/nb-size-pdf.txt` and `nb-width-pdf.txt` (not kept: the PDFs sit in `manual/sources/new-balance/`).
