# The follow-up browser read, the four sites Sean allowed: findings (2026-10-21)

The report as the worker returned it, saved by the orchestrator (the `orchestrate` skill, §4). 41 tool calls, 126,516 tokens, about 10 minutes, through the Claude in Chrome extension in Sean's Chrome, after he allowed the four sites the first browser read had been refused.

Two of the four sites rendered and two never did. Skechers AU and Clarks UK rendered in full. New Balance's support article and Reebok UK could not be reached.

Two sites print a length per size. Skechers AU has a CM column on all four of its charts, but never says whether it is the foot's length or the shoe's. Clarks prints a column headed "Foot Length (Millimetres)" on its women's, men's and kids' charts.

The Clarks calculator could not be probed in centimetres. It takes readings from a Clarks foot gauge, which its page says "are not in standard millimetres (mm)", so 15–23 cm cannot be typed in as foot lengths. As a stand-in I typed 150, 170, 190, 210 and 230 as gauge numbers. With width 120, length 150 gave 8.5 G, 170 gave 10 F and 190 gave 12.5 D; 210 and 230 gave "No size was found". With width 160, length 210 gave 2 G and 230 gave 4.5 D. In these probes the length set the size number and the width set the letter: 150 with width 100 gave 8.5 D.

## Skechers AU

**Statements, size guide** (https://www.skechers.com.au/size-guide):

- On measuring: "Stand with your heel against a wall. With a ruler or measuring tape, measure from the wall to the tip of your biggest toe in centimetres. Use our CM size matrix on the product page of the brand you're interested in and add that item to cart."
- On variation: "Sizes can vary by style and by brand…"
- On sizing across brands: "Generally sizing tends to be standard across brands, although sizes can vary slightly depending on the style, shape and material of the shoe."
- On choosing: "The size of the pair that you already own is a good guide!"
- On running large or small: "Certain brands or styles can run a size larger or smaller…", noted on the product page when known.
- On True Fit: "No measuring required".
- The page has no unit switch. The CM column is always shown.

**Statements, help article** (help.skechers.com.au, article 1500009182222):

- "AUSTRALIAN SIZING Is the same as US sizing."
- The size selector switches between "US, UK, EU sizing, and centimeters".
- On fit: "snug at the heel and midfoot, with wiggle room around the toes".

**Charts** (each tab opened by clicking):

- **Men:** US MEN'S, EU, UK, CM. 19 rows, from 6 / 38.5 / 5 / 24.3 to 16 / 51 / 15 / 32.5. The CM steps are uneven: 13.5 is 31.2, 14 is 31.5 and 15 is 32.
- **Women:** US WOMEN'S, EU, UK, CM. 16 rows, from 5 / 35 / 2 / 22 to 12 / 42 / 9 / 29, then 13 / 43 / 10 / 31.5.
- **Kids:** US KIDS PRE-SCHOOL, US KIDS GRADE-SCHOOL, EU, UK, CM. 10 rows, printed with sizes 1–7 first and 11–13 last. Size 1 is 32 / 13 / 20 and 13 is 30 / 12 / 19.
- **Infants:** US KIDS INFANT, EU, UK, CM. 6 rows, from 5 / 20.5 / 4 / 11 to 10 / 26.5 / 9 / 16.

## Clarks UK

clarks.co.uk redirects to clarks.com/en-gb.

**Statements, fit guide** (https://www.clarks.com/en-gb/fitguide):

- The length column on every chart is headed "Foot Length (Millimetres)".
- On measuring: "take the length in millimetres from the tip of your longest toe to your heel", heel against a straight edge.
- On both feet: "Remember to measure both feet, making a note of the longest."
- On the gauge: "\*These measurements do not correlate to measuring with a Clarks foot gauge."
- Width letters: women D standard, E wide, EE extra wide. Men G standard, H wide. Kids E narrow, F standard, G wide, H extra wide.

**Statements, size calculator** (https://www.clarks.com/en-gb/size-calculator):

- Gauge readings "are not in standard millimetres (mm)".
- "If you found a slight difference between feet, enter the largest length and width measurements."
- Its own hints give the ranges it takes: length "between 97-281", width "between 67-227".

**Statement, measure at home** (https://www.clarks.com/en-gb/measureandfit-at-home):

- An in-store fitting is recommended first, with the at-home gauge as the fallback.

**Charts** (fit guide):

- **Women:** Clarks UK Size, Clarks EU Size, Standard EU Size, Foot Length (Millimetres). 13 rows, from 3 / 35½ / 36 / 221 to 9 / 43 / 43 / 272.
- **Men:** the same four columns. 16 rows, from 5 / 38 / 38 / 237 to 14 / 49½ / 49 / 314. There is no 11½ row.
- **Kids & Babies:** Clarks UK Size, Clarks EU Size, Foot Length (Millimetres). 43 rows, from 2 / 17½ / 101 through 13½ / 32½ / 198, then 1 / 33 / 202 up to 10 / 44½ / 278.
- Where the adult and kids charts share a UK size, their lengths differ by about a millimetre. UK 5 is 237 on the adult charts and 236 on the kids', and UK 3 is 219 for kids and 221 for women.

## Could not be reached

- **New Balance support article.** Twice "Navigation to this domain is not allowed", then two tries that ended on a Chrome error page. No text.
- **Reebok UK.** "Permission denied for reading pages on this domain", then the error page, then "Permission denied for this action on this domain" after a 10-second wait. The size guide was never reached.
- **Clarks gauge guides.** The two step-by-step guides are static files on clarks.a.bigcontent.io and may download, so I did not open them.

No site permission card appeared. Clarks refused its first try and worked after the 10-second wait.

## Summary

1. **Answer:** Skechers AU and Clarks UK rendered; New Balance and Reebok UK did not. Clarks prints a stated foot length per size for women, men and kids. Skechers prints an unlabelled CM column on all four charts.
2. **Strongest finding:** Clarks' kids' chart has 43 rows from UK 2 at 101 mm to UK 10 at 278 mm, headed "Foot Length (Millimetres)" (clarks.com/en-gb/fitguide).
3. **Second:** Skechers AU prints CM for men, women, kids and infants, and tells shoppers to measure the foot in centimetres. It never says the CM is the foot's (skechers.com.au/size-guide).
4. **Third:** Clarks' calculator works in gauge units that "are not in standard millimetres" and do "not correlate" with its ruler chart (size-calculator and fitguide). Its outputs therefore cannot be read as foot lengths.
5. **Also:** Skechers AU says "Australian sizing is the same as US sizing" (help.skechers.com.au).
6. **Not reached:** New Balance's support article, Reebok UK, and the Clarks gauge guides.
7. **Recorded:** 459 chart cells, 20 claims and 10 calculator rows.
8. **Tool calls:** 41 of the 50 budget. My tabs are closed.
9. **Files:** `browser-2/charts.csv`, `claims.csv`, `finders.csv`, `sources.md`, `pages/` (7 texts), `screenshots/` (8 images), and the script that wrote them, `scripts/browser-2-write.py`.
