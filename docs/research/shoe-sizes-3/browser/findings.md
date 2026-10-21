# The browser worker, the refused pages through Sean's Chrome: findings (2026-10-21)

The report as the worker returned it, saved by the orchestrator (the `orchestrate` skill, §4). 81 tool calls as the harness counted them (the worker counted 83), 203,145 tokens, about 31 minutes, through the Claude in Chrome extension in Sean's Chrome, in a tab of its own.

The pass is done in 83 tool calls. I stopped browsing at 79, and the last four calls went on writing the files and closing my tab. Sixteen of the 22 pages rendered and five refused. Three brands print a foot length per size that I recorded: HOKA, UGG and Crocs. No size finder returned a size.

**Rendered:** On (both genders), Skechers US, HOKA, New Balance (FAQ and size guide), UGG, adidas (chart and both blogs), Crocs (chart and FAQ), Reebok EU, Asics US and MY, and Birkenstock MY.

**Refused by the extension's site permissions:** skechers.com.au, support.newbalance.com, reebok.co.uk (it loaded, but reading it was denied) and clarks.co.uk.

**Moved or gone:**

- HOKA's size-chart.html is a not-found page; the live guide is `/en/us/sizing-information.html`.
- New Balance's `/size-chart/` is a 404; the live page is `/size-guide.html`.
- UGG's size-chart.html is an empty not-found page; the live page is `/sizing-information.html`.
- Asics US's `/shoe-size-guide` gives "No Search Results"; the live page is `/aligned-size-charts/`.

**Charts that print a foot length per size:**

- **HOKA:** labelled "Foot Length (CM)" and "(IN)", with a width row in mm.
- **UGG:** "Heel to Toe (IN)"; the Big Kids chart adds "Heel to Toe (MM)".
- **Crocs:** "Heel to Toe Length" in inches and in cm, for adults and kids.

On's chart has no foot-length column. New Balance prints "Length (cm)" but never says whose length it is.

## Per brand

**On** (product-page "Size chart" panel)

- "True to size." appears on the men's Cloudmonster and on the women's Cloud 6.
- The Cloudmonster women's URL redirects to the men's page, so I read the women's chart from the first women's product, the Cloud 6.
- Charts:
  - Men's: US, BR, MX, EU, JP, UK, 16 sizes.
  - Women's: the same six rows, 14 sizes.
- There is no foot-length column and no measuring text. The MX row equals the JP row cell for cell. I recorded the BR and MX rows in case the chart we already hold lacks them.

**Skechers US** (size-chart page)

- "Skechers Performance running and walking footwear sizes may vary"
- "Skechers Women's Wide Fit is equivalent to Women's W or D width."
- The tables are USA, UK and EU only, with no CM and no measuring text. Charts are already held, so I did not transcribe them.

**HOKA** (sizing-information page)

- "In a straight line from the middle of the heel to the longest toe, measure the length of each foot."
- "Foot length will determine your shoe size - round up or down to the closest size within 2mm."
- Use the larger foot.
- Charts:
  - Women: foot length cm and in, width, US, UK, Europe, Japan (CM), Mexico (CM), China; 15 sizes, foot length 22.0 to 27.9 cm.
  - Men: the same rows, 21 sizes, 23.0 to 31.5 cm.
  - All Gender: 22 sizes, but only 21 foot-length and width cells. I recorded them as printed, without lining them up. One US cell is printed "M7½/W88½".
  - Kids: 8 youth sizes with foot length in cm and inches.
- I did not read the Wide tables.

**New Balance** (FAQ and size guide)

- "Our shoes generally run true to size and align with standard industry sizing. If a style runs smaller or larger, we note that on the product page…"
- "Choose the larger size if your feet are between sizes."
- Tips: try shoes on late in the afternoon, buy for the larger foot, and leave toe-box room to wiggle the toes.
- The Find-your-size tables are in the page file only, because "Length" is not tied to the foot.
- The printable measuring tools are PDF downloads, which I did not download.

**UGG** (sizing-information page)

- "All sizes on our site are shown in standard measurements for the United States."
- Measuring: stand on a line with the heel and longest toe centred, then "Taking the larger of the two measurements, use the conversion chart to find your correct shoe size."
- Charts:
  - Women's: 18 sizes.
  - Men's: 24.
  - All-Gender: 24.
  - Big Kids: 12, in inches and mm.
- I did not read the Wide, Toddler, Baby or Kids' tables.

**adidas** (size chart and the US and UK blogs)

- The chart's rows are labelled "Heel-toe (INCH)" and "Heel-toe (cm)". The chart is already held, so it is in the page file only.
- "For a tight fit, go one size down. For a loose fit, go one size up."
- "Measure the distance from the tip of your big toe to the outermost part of your heel." Measure at the end of the day, in your usual socks.
- Walking shoes: a thumb's width of room. Running shoes: half a thumb's width.
- Go "up a half or even full size" for exercise.
- There is no finder that takes a foot length.

**Crocs** (size chart and FAQ)

- "Tip: If you're in between sizes, round up. For wide feet order your normal size."
- Kids: "round up. Juniors size 3 and up can also shop our adult sizes."
- Charts:
  - Adult: 16 sizes, 20 to 35 cm in whole centimetres, plus inches, US W/M, UK W/M, EU ranges, Japan and Korea.
  - Kids: 19 sizes, 9 to 24.2 cm, plus inches, US, UK, EU, Japan and Korea.
- The FAQ only points to the size chart.

**Reebok EU** (Club C 85 product page)

- The size guide is Europe, UK and US only, 26 sizes, with no words and no CM. I put it in the page file only.

**Asics**

- The US page does not tell you to add 1 to 1.5 cm. It says: "Repeat the steps for your other foot and compare the measurements with our size chart below."
- It also says: "For running shoes, we generally recommend sizing up a half size from your casual shoe size."
- The MY page has charts with a CM row and no measuring text:
  - Men's: 19 sizes.
  - Women's: 15.
  - Kids': 33, 12 to 25.5 cm.
- On the MY men's chart the UK row is printed "6H, 7H…" after 6.

**Birkenstock** (MY fit guide)

- "Stand straight on the paper with your heels against the wall… mark the longest toe of each foot."
- The footbed comes in two widths, regular and narrow.

## The size finders

- **Birkenstock:** the calculator asks for each foot's length (from 221 mm) and width (from 81 mm), then "CALCULATE SIZE". I tried 24 to 28 cm with a 95 mm width, but values set by script did not register and the form answered "Please select a width". No result.
- **Clarks kids:** blocked by the extension's site permissions.
- **adidas, Reebok and Skechers US:** no finder on the pages.
- **HOKA and UGG:** they offer True Fit, which works from a sign-in and a profile, not a foot length, so I did not use it.

## What could not be reached, and what would help

- Granting the extension access to skechers.com.au, support.newbalance.com, reebok.co.uk and clarks.co.uk would open the Skechers AU CM figures, the New Balance fit article, Reebok UK's size guide and the Clarks kids' calculator.
- Birkenstock's calculator needs no account. It takes four dropdowns chosen by hand, so you could probe it in a minute, or a later pass could spend about 5 calls per foot length.
- New Balance's PDFs need your yes to download.
- No login wall stood in front of any chart.

## Summary

1. The answer: 16 of 22 pages rendered and 5 refused. HOKA, UGG and Crocs print a foot length per size. No finder returned a size.
2. HOKA prints "Foot Length (CM)" for every size and says to "round up or down to the closest size within 2mm" (`hoka.com/en/us/sizing-information.html`).
3. Asics US says to compare the measured foot with the chart, with no 1 to 1.5 cm addition (`asics.com/us/en-us/aligned-size-charts/`).
4. Crocs prints heel-to-toe in whole centimetres, 20 to 35 cm, and says to round up between sizes (`crocs.com/size-chart`). UGG prints heel-to-toe inches for each size (`ugg.com/sizing-information.html`).
5. Not reached: Skechers AU, the New Balance support article, Reebok UK and Clarks (all extension permissions), and the Birkenstock calculator (it did not take values set by script).
6. On's chart has no foot length. Its MX row equals JP, and it adds a BR row.
7. Two problems: the screenshot of On's women's chart failed to save. And my first tab group (tab 78474443) was taken out of my control mid-run, so I could not close that tab; it may still be open in your Chrome.
8. Tool calls: 83 of the 90 budget.
9. Files: `browser/charts.csv` (1,829 cells), `claims.csv` (55 claims), `finders.csv` (11 rows), `sources.md`, `pages/` (22 files), `screenshots/` (10 images), `work/` (the generator `gen.py` and its two text bundles).
10. Nothing in the repository was written. Nothing personal was typed anywhere, and nothing was submitted or accepted.
