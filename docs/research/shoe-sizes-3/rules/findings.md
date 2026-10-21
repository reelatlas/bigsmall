# Worker A, the brands' rules: findings (2026-10-21)

The report as the worker returned it, saved by the orchestrator (the `orchestrate` skill, §4). 116 tool calls as the harness counted them (the worker counted 121), 249,002 tokens, about 19 minutes.

All twenty brands were tried. Seventeen gave statements in their own words on their own sites, and three gave nothing usable: HOKA and Crocs refused, and Puma's guides had no shoe-fitting statement. The pass ran 121 tool calls.

## The answer

- **A rule tying the label to the foot.** Only Asics states one outright. On its NZ and AU sites, word for word: measure heel to longest toe in cm, then "add 1-1.5 centimeters to the length. This will give you the correct length to match with our shoe size guide." So Asics's chart CM is not the bare foot.
- **Other declared relations between labels:**
  - Brooks: men's to women's +1.5; all-gender sizes are men's; children's sizes run on the men's scale.
  - Puma: unisex sizes are men's; women order 1.5 sizes smaller.
  - Vans: women's to men's is 1.5 sizes down.
  - Birkenstock: women's US + 31 = EU, men's US + 33 = EU.
- **Brands that say their length column is the foot's:**
  - Nike: Foot Length rows, and "the CM size displayed on shoe boxes and labels is different than Foot Length (cm)".
  - Under Armour: "We start with the true foot … That measurement (in centimeters) is then translated into our standard sizes".
  - Clarks AU: "CM Measurements are for Foot Length, not Shoe Length". Clarks US: find the foot length in the right-hand column.
  - Dr. Martens: the chart is headed Foot length and Foot width.
  - Vans: the chart's column is Foot Length.
  - Salomon SG: FOOT LENGTH (CM) and (INCH), measured in socks.
  - Brooks UK, IE and DE: Foot Length (CM).
  - Reebok AU: "This measurement represents the length of the foot … apply … to our size chart". Reebok US and CA: a heel-toe inch column.
  - adidas BH: Heel-toe rows in inches and cm.
  - Birkenstock: millimetre ranges that its calculator reads as the foot.
- **Brands whose length column is not the foot's, or is unstated:**
  - Puma: AE calls it "Product Measurements … Length (cm)"; AU's "Length cm" is unlabelled.
  - Converse: a plain cm/in column, with no word on whose length.
  - Timberland: an Inch column, not named.
- **A scale the main chart lacks, printed somewhere of the brand's own:**
  - Brooks prints a foot length in cm on its UK site (and IE and DE). Four charts are transcribed.
  - Reebok prints UK and EU on its AU site (men's and women's), and EU in reebok.ca's Winter Boots charts. Four charts are transcribed.
  - Skechers prints no foot length in figures anywhere I reached. Its kids' printable gauge places the size marks along an inch ruler, which could only be read from the drawing's geometry.
  - On's foot-length chart opens only in the browser, so I could not read it.
- **No usable statement:** Puma has no shoe-fitting statement at all. HOKA and Crocs could not be reached.

## Per brand

C-numbers are the rows in claims.csv. "Second page" is the row recorded under `agrees_with`.

**Brooks**

- Length column is the foot's: Foot Length (CM) on the UK size guide's women's, men's and all-gender panels (C001). The DE and IE men's charts are cell-equal to the UK's, 80 of 80 (C002). The US charts have no such column.
- Measuring method (EMEA help centre, C004): heel to a wall, longest toe, in cm, "this is your foot length". The UK guide links to it (C003).
- Allowance (US and UK size guides, which agree, C005 and C006): "a thumb's width … Consider buying a shoe that is a half size up from your measured size."
- Toe room: 1/2 to 1 inch (US help centre, C007 and C008). AU says 1/2 inch (C009), which agrees in part.
- Fit direction: Brooks fits "slightly shorter" than other brands; order a half to one size larger than casual or dress shoes. EMEA, US, CA and CH agree (C010 and C011).
- Relations between labels: men's to women's +1.5 (C012); all-gender = men's (C013); kids on the men's scale (C014).
- Disclaimers: Brooks publishes no exact shoe measurements (C015); a 2D tool only approximates size (C016).
- AU's Japan (cm) columns are named as Japan sizes, not as a foot length (C017).

**Skechers**

- Disclaimer: "Performance … sizes may vary" (C018).
- Kids' printable gauge: heel at the zero marker, inch scale, no length per size in figures (C019).
- The AU size selector offers centimetres, and AU sizing = US (C020). The CM page itself is built in the browser.
- AU fit: snug at the heel, wiggle room at the toes (C021).
- The women's and men's printable PDFs refused: 520 and 403 (C022).

**Puma**

- Women order 1.5 sizes smaller; unisex = men's. AU, US and AE agree (C023 to C025).
- Length column: AU's "Length cm" has no owner (C026); AE says "Product Measurements" (C027); the US kids' Length is in inches (C028); VN's JPN/CM is named Japanese sizing (C029).
- No foot-measuring method or allowance on any Puma guide (C030).

**On**

- "True to size" on the adult product page (Cloudmonster) and the kids' and youth pages, which agree (C031 and C032).
- Kids: if unsure, size up. Kids' measuring method: heels to the wall, longest foot, then the size guide (C033). The tester FAQ uses a Brannock device or a ruler against a wall (C034); it agrees.
- The sizing FAQ and the size guide sit behind a Cloudflare script and could not be reached (C035).

**Reebok**

- AU's charts print US, UK, EU, CM and INCH, and the page ties them to the foot length (C036).
- AU measuring method: a helper marks the big toe and the heel (C037). Between sizes, size up (C038). Club C runs narrow, so go up 0.5; all other lines are true to size (C039).
- US and CA: heel to the wall, longest toe, the larger foot compared with the heel-toe inch chart. They agree (C040 and C041).
- CA's Winter Boots charts print Euro (C042).
- reebok.co.uk refused the connection; reebok.eu is built in the browser (C043).

**Nike**

- Foot Length rows; box CM differs from foot length. Men's and women's pages agree (C044 and C045).
- Measuring method and "between sizes, we recommend sizing up". Men's and women's agree (C046 and C047). The text is word for word the same as Reebok AU's.

**adidas**

- BH chart has Heel-toe rows in inches and cm (C048).
- Measuring method: end of day, heel to the wall, longest toe (C049).
- Between sizes: "For tight fit, go one size down. For loose fit, go one size up" (C050).
- The US and UK pages refused (403).

**Asics**

- Rule, NZ and AU word for word: measure, then add 1 to 1.5 cm to match the size guide (C051 and C052).

**Salomon**

- SG measuring method: in socks, heel to the wall, longer foot; FOOT LENGTH (CM) and (INCH). Men's and women's agree (C053 and C054).

**New Balance**

- Printable tool: heel on the semicircle, full weight, late afternoon; "Choose the larger size if feet are between sizes" (C055).
- Every HTML page refused (403); the support site refused at TLS.

**Converse (converse.ca)**

- Measuring method: afternoon, in socks, the larger foot (C056).
- Chuck Taylor runs large: go down a half size. The size guide and the product page agree (C057 and C058).
- "If you're between sizes, we generally recommend sizing up" (C059). It is printed after the body-measuring list, so it may apply to apparel only.

**Under Armour**

- "We start with the true foot … in centimeters"; between chart numbers, size up; measure later in the day. US, UK and AU agree; AU adds "Measurements are desired standards" (C060 and C061).

**Clarks**

- AU: CM is foot length, not shoe length; the chart is approximate (C062).
- US: foot length in the right-hand column. It agrees with AU (C063).
- GB kids: measure in mm; use the larger foot in the calculator (C064).

**Dr. Martens**

- Foot length and width headings. UK and US agree (C065 and C066).
- Most styles run true to size; between sizes, take the larger with an insole that adds half a size. UK and US agree (C067 and C068).

**Birkenstock**

- US + 31 / + 33 = EU (C069).
- US mm length ranges per size (C070). The MY calculator takes each foot's length and is "based on our size chart"; unsure, choose the next size up (C071).

**UGG**

- Kids' printable chart only: heel to the wall; between two sizes, go a size up; feet of different sizes, choose the larger (C072).

**Vans**

- Measure in mm from the longest toe to the heel; Foot Length column, whose US cells read as inches (C073).
- Women's to men's is 1.5 down; skate shoes fit snug, so perhaps a half size larger (C074).

**Timberland**

- Wall method on the size chart (C075). The FAQ's trace method measures from the big toe, where the chart page says the longest toe; otherwise the two agree (C076).

**HOKA** and **Crocs**: could not reach (C077 and C078).

## What could not be reached

- **HOKA:** 406 to the script; header overflow to the fetcher.
- **Crocs:** every chart is built in the browser.
- **UGG:** adult pages 406 and header overflow; ugg.com.au 404.
- **New Balance:** every site 403; support site TLS error.
- **adidas:** US and UK 403.
- **On:** FAQ and size guide behind Cloudflare.
- **Skechers:** AU CM guide built in the browser; printable PDFs 520 and 403.
- **Reebok:** UK refused the connection; reebok.eu built in the browser.
- **Dr. Martens:** support articles 401.
- **Timberland:** help centre TLS failure.
- **Asics:** MY guide built in the browser.

Search-engine summaries of these pages are filed in leads.csv as leads only. For example: On "add about 1 cm" for JP sizes, Dr. Martens's half-size rules by gender, Crocs "round up", UGG AU "order a size up".

## Summary

1. Only Asics states a label-to-foot rule (foot + 1 to 1.5 cm = the guide's length). Nike, Under Armour, Clarks, Dr. Martens, Vans, Salomon, Brooks UK, Reebok, adidas and Birkenstock say or show their length column is the foot's. Puma calls its column the product's (AE) or leaves it unlabelled.
2. Strongest finding: Asics NZ and AU, "add 1-1.5 centimeters to the length … to match with our shoe size guide" (asics.com/nz …/how-to-measure-shoe-size).
3. Strongest finding: Brooks UK, DE and IE print Foot Length (CM) on every shoe chart; four charts transcribed (brooksrunning.com/en_gb/main-size-guide/).
4. Strongest finding: Reebok AU prints US, UK, EU, CM and INCH tied to "the length of the foot"; two charts transcribed (reebok.com.au/pages/size-guides).
5. Between sizes, size up: Nike, Reebok AU, Under Armour, New Balance, Birkenstock, UGG kids. adidas BH says down for a tight fit, up for a loose one.
6. Fit direction: Converse Chuck Taylor half a size down; Brooks a half to one size up; Reebok Club C 0.5 up; Vans skate shoes a half size up.
7. Could not reach: HOKA and Crocs entirely; most of New Balance, UGG adult, adidas US/UK, On's FAQ, Skechers's CM page, reebok.co.uk.
8. Skechers prints no foot length in figures. Its kids' gauge, like New Balance's printable tool, can only be read from the drawing's geometry.
9. 121 tool calls; 78 claims, 528 chart cells (8 charts), 15 leads, 113 downloads.
10. Files: `scratchpad\shoe-sizes-3\rules\`: claims.csv, charts.csv, leads.csv, sources.md, fetchlog.tsv, downloads\, scripts\.
