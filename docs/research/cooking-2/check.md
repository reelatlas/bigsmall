> The citation check for `docs/research/cooking-2.md`, as written on 2026-10-16 by a third reviewer, against the sources themselves. Paths under `dl/` and `scripts/` refer to the reviewer's working folder, not kept; every correction is applied in `cooking-2.md` and `figures.py`.

# Cooking 2: citation check

2026-10-16. Every citation in `citations.json` (189 ingredient rows, 3 unit rows) checked against the source itself, not the reviewers' notes. Row by row, with the source's words, the URL, and any correction: `check.csv`.

## Summary

| Status                      |    Rows |
| --------------------------- | ------: |
| Confirmed                   |     170 |
| Confirmed with a correction |      21 |
| Could not reach             |       1 |
| Wrong                       |       0 |
| **Total**                   | **192** |

Every cited figure is on its source's page once the arithmetic is redone, except one rounding slip (heavy cream, 239 g cold should be 238 g). The 21 corrections:

- **A figure:** heavy cream's 239 g cold (238 g); America's Test Kitchen's chopped pecans, 113 g, which is its cup of whole pecans (119 g chopped).
- **A sample year:** two Foundation Foods rows say "2019 to 2022 samples"; the sugar was bought in 2006, the cheddar in 2014.
- **A fill method that doesn't match the source (7):** America's Test Kitchen dips and sweeps flour and sugar (cake flour, granulated and powdered sugar listed as spooned); USDA's 1969 cups of shortening and peanut butter were spooned, not packed; Milk Street's flour-table figures (almond flour, cornstarch) are averages of published charts.
- **Wording (10):** Foundation Foods' peanut butter is one weighing, likely SR Legacy's again; two molasses rows (the grade sets only a 79 Brix minimum; NBS's 331 g is a worked example); seven notes (bread flour's 157 g unattributed, almond "scooped", Greek yogurt, quick oats, whole walnuts, whole pecans, "mounded unbeaten" eggs).

The one source not reached is the 2008 egg study, behind a bot wall and a paywall; its figure is confirmed only as cited by the 2022 study.

## How each source was checked

- **USDA's measured cups (1969)** (HERR No. 41, archive.org scan): every row cited, read from the page images (my own download), cropped to the row: the weight, the standard deviation, the number of samples and the method words. The method rule is on p. 2: dry foods "spooned lightly into the cup unless a special measuring technique, such as dipping, is included"; liquids in glass cups to the line.
- **USDA FoodData Central**: SR Legacy from its April 2018 bulk CSV (downloaded); Foundation Foods from the 2026-04-30 zip, tracing each portion to its sample foods and their purchase dates (`scripts/foundation_trace.py`).
- **Web pages and PDFs**: each fetched fresh today (curl; WebFetch where a site refused curl; the Wayback Machine for the Food Network text). Recipe weights read from each ATK and King Arthur page's own ingredient list.
- **Physical references**: the density, the reference temperature, and the conversion redone for each (`scripts/arith.py`): relative densities at 20/20 °C times 0.998207 g/mL, densities times 236.5882365 mL.

## Corrections and problems, by ingredient

### bread-flour

- **Note** ("136 to 157 g (USDA's 1969 measured cups 136 g, America's Test Kitchen 156 g)... SR Legacy gives 137 g, a dipped cup's weight"). The 157 g is Rose Levy Beranbaum's dip-and-sweep figure, known only from a 2009 Fresh Loaf quote of her books; neither named source gives it. SR Legacy names no method for its 137 g. **Change to** "136 to 156 g (...)" or add "Rose Levy Beranbaum 157 g"; and "SR Legacy gives 137 g, about what a dipped cup weighs".

### cake-flour

- **America's Test Kitchen: 113 g.** The figure is right ("1 cup cake flour = 4 oz / 113g"), but ATK measures flour by dip and sweep ("In the test kitchen, we favor the dip-and-sweep method"), not spooned. **Label it** "America's Test Kitchen, dipped: 113 g" or move it to the note. The range (111 to 113) holds without it.

### almond-flour

- **Milk Street: 100 g.** Milk Street's flour table is an average of 22 published charts with the outliers dropped, checked by its own measurements; its volume method is a gentle dip and sweep. It is not a spooned measurement. **Write** "Milk Street, an average of published charts: 100 g" or move it out of the spooned sources. _Consequence:_ without it the spooned evidence is King Arthur 96 g and SR Legacy's ground almonds 95 g, so the figure of 98 g rests on this average; worth a second look.
- **Note** ("Scooped, a cup holds 112 to 113 g (America's Test Kitchen, Bob's Red Mill's label)"). The label ("2 Tbsp (14g)") gives no fill method. **Write** "Dipped, a cup holds about 113 g (America's Test Kitchen); Bob's Red Mill's label gives 112 g."

### granulated-sugar

- **America's Test Kitchen: 198 g.** ATK: "Dip the measuring cup into the flour or sugar and sweep away excess." **Label it** dipped. (The method barely moves granulated sugar; the figure can stay.)
- **Foundation Foods, "2019 to 2022 samples": 188 g.** The 188 g cup (14 data points) comes from sugars bought 2006-04-08 to 2006-04-12; the food was published in 2019. **Change to** "Foundation Foods, 2006 samples: 188 g".

### powdered-sugar

- **America's Test Kitchen: 113 g.** Dipped, like its granulated sugar. **Label it** dipped or move it to the note.

### shortening

- **USDA's measured cups (1969): 187 g.** Item 715 names no technique, so by the report's own rule the shortening was spooned lightly into the cup, not packed. **If methods are shown,** "USDA's measured cups (1969), spooned: 187 g, 7 cups".

### heavy-cream

- **University of Guelph: "235 g at 20 °C, 239 g cold".** Guelph gives heavy cream (36.6% fat) 1.008 kg/L at 4.4 °C: 1.008 x 236.588 = 238.48 g, which rounds to **238**, not 239. **Change to** "235 g at 20 °C, 238 g cold", and the ingredient's range from 233 to 239 to 233 to 238. (The figure, 237 g, stands.)

### yogurt

- **Note** ("no source weighs a cup of it yet"). USDA does list a cup of Greek yogurt, 245 g, in FNDDS 2021-2023 and in SR Legacy (171300, strawberry lowfat), though it is plain yogurt's 245 g reused, not a weighing. **Write** "no source we found has weighed a cup of it (USDA's survey tables reuse plain yogurt's 245 g)".

### shredded-cheddar

- **Foundation Foods, "2019 to 2022 samples": 105 g.** The 105 g cup (41 data points) comes from shredded cheddar bought in November 2014 (slices in March 2013); published 2019. **Change to** "Foundation Foods, 2014 samples: 105 g".

### molasses

- **"Sucrose density tables (NBS C440) at Grade A's 79 to 80 Brix: 332 to 334 g".** The figures hold (79 Brix 5318.8 g a gallon, 80 Brix 5343.8 g, in vacuo). But USDA's molasses grades (1959) set only a minimum, 79.0 Brix, for Grades A, B and C alike; the 79 to 80 is Grandma's specification. **Write** "at 79 to 80 Brix (USDA's grades: at least 79)".
- **"NBS Circular C440, molasses measured: 331 g".** The 11.664 lb a gallon is the worked example in C440's method for weighing molasses (p. 252: "Example. Weight per gallon determined at 20° C."), one sample of unstated kind, its weight per gallon read from the sucrose table at the measured density. **Write** "NBS Circular C440, a worked example of weighing molasses: 331 g".

### rolled-oats

- **Note** ("quick oats weigh about 90 g a cup"). Only Bob's Red Mill's label (90 g) and King Arthur's single row for "old-fashioned or quick-cooking" oats (89 g) say so; USDA's measured cups give quick oats 73 g (87 cups), the Food Buying Guide 73 g, and ATK 96 g. **Write** "quick oats run 73 to 96 g a cup by source", or name the 90 g's sources.

### cornstarch

- **Milk Street: 133 g.** The same survey average as almond flour, not a spooned cup. **Write** "Milk Street, an average of published charts: 133 g" or move it. (The figure, 125 g, does not lean on it.)

### chopped-walnuts

- **Note** ("a cup of whole walnuts is lighter, 100 to 106 g"). ATK's own measuring guide gives "1 cup walnuts, chopped" (measured whole) as 3.4 oz, **96 g**, below the range. And two cited sources weigh a cup of whole walnuts heavier: King Arthur 128 g (64 g a half cup), Milk Street 184 g. **Write** "96 to 106 g (America's Test Kitchen, Rose Levy Beranbaum)" and present the lighter cup as theirs, not as a rule.

### chopped-pecans

- **America's Test Kitchen: 113 g.** The 113 g comes from "2 cups (8 ounces) pecans, chopped coarse", which by ATK's own rule ("1 cup walnuts, chopped": the walnuts are measured, then chopped) is a cup of whole pecans. ATK's chopped-then-measured cup is "3/4 cup (89 grams) chopped pecans or walnuts", **119 g**. **Change to** "America's Test Kitchen: 119 g". _Consequence:_ the sources' middle moves from 113 toward 114 g (Milk Street 114, King Arthur 114, ATK 119, USDA 1969 108, Food Buying Guide 121, SR Legacy 109).
- **Note** ("Whole pecans weigh 105 to 114 g a cup"). SR Legacy, cited for pecans, weighs a cup of halves at 99 g (18 data points). **Write** "99 to 114 g".

### peanut-butter

- **Foundation Foods, Jif and Skippy: 258 g.** The Foundation food's cup is one data point (2013 samples); its Jif and Skippy samples each list exactly 258 g a cup and 32 g for 2 tablespoons, the same as SR Legacy's 258 g (also one data point) and 32 g. Probably one weighing carried over, not two brands measured. **Write** "Foundation Foods (one cup weighed, 2013): 258 g" and don't count it as independent of SR Legacy. (The figure, 258 g, is still the middle of USDA 1969 251, ATK 255, SR Legacy 258, Jif's label 264 and King Arthur 270.)
- **USDA's measured cups (1969): 251 g.** Like shortening, spooned by the report's rule, not packed. **If methods are shown,** "spooned: 251 g, 35 cups".

### eggs

- **Atilgan and Unluturk (2008): 244 g. Could not reach.** The open copy at the Izmir Institute of Technology's repository is behind an Anubis bot challenge (not bypassed); the publisher (Int. J. Food Properties 11(2):296-309, doi 10.1080/10942910701329658) is paywalled. Azahra and others (2022) do cite "1,033 g/ml (Atilgan dan Unluturk, 2008)". The 2008 study measured from 4 to 60 °C, so the temperature of 1.033 is unknown. **Until it is read,** "Atilgan and Unluturk (2008), as cited by Azahra and others (2022): 244 g".
- **Note** ("Whole eggs mounded unbeaten in a cup weigh more"). USDA's 1969 item 360 says only "Eggs, large, shell: Shelled: Whole", 251 g (8 cups); nothing about beating or mounding. **Drop** "mounded unbeaten" or mark it as our explanation.

## Worth knowing (confirmed, no change needed)

- **The Danish figures** (oil, milk, cream, sour cream, yogurt) were read in FAO/INFOODS's Density Database v2.0 (2012), which credits the "Danish food composition databank 4th edition 1996"; the Danish source itself was not opened. "(1996, via FAO/INFOODS)" would say where they were read. The sour cream entry is Danish crème fraîche of about 18% fat; the oil entry is "oil, other than palm oil".
- **FAO/INFOODS's olive oil (0.918) and loosely packed cornstarch (0.54)** come from hypertextbook.com; its rice (0.82) is the compiler's own measurement at 21 °C.
- **Codex** values were read in the 2015 editions on FAO's server (the current PDFs are behind a bot check); both sit in the standards' supplementary appendices, CXS 210's table for crude oils.
- **Honey**: White's table is relative density at 20°/20 °C (Crane's reprint says so), giving 336 g at 17.2% water; read as a density it would be 337 g.
- **USDA 1969**: the all-purpose and cake flour rows come from Matthews and Batcher (1963); its baking powder is "SAS-phosphate" (a double-acting type) in the report's words; its rice and chips were spooned, not poured (immaterial for free-flowing pieces).
- **The brown sugar note's** "more than for any other ingredient" is true in grams (22.5 g); relative to the cup, shredded cheddar varied as much (11.4 g on 98 g).
- **America's Test Kitchen disagrees with itself** on cornstarch (one 2025 recipe: 150 g a cup), water (75 g a third of a cup, 225 g) and milk (6 oz for 3/4 cup); the cited figures are its other recipes'. ATK's cocoa, oats, cornstarch and chips are probably dipped too (its rule for dry ingredients), though it doesn't say so per ingredient.
- **Secondhand Beranbaum figures**: the 145 g and 114 g ends of the all-purpose note are from a 2009 Fresh Loaf quote of her books. Her salt "almost always exactly 6 grams" names no kind of salt; her recipes use fine sea salt.
- **The measuring-cups note** comes from a post by Woody Wolston on Beranbaum's site (2025); it says "dry ingredient measuring cups", not "retail".
- **Domino's own table** gives brown sugar both 194 g (1 lb, 2 1/3 cups) and 181 g (4 lbs, 10 cups) a cup. **Milk Street** prints whole walnuts at 184 g a cup. **The Egg Board chart** says both five and six large eggs a cup.
- **Labels** cited (Bob's Red Mill, Sargento, Morton, Jif, Land O Lakes) say what we say; the 0.6 g and 15 g labels equal 21 CFR 101.12(b)'s reference amounts exactly, as the notes say.
- **Pages that refuse plain requests**: Food Network and Domino (403); read through WebFetch, browser headers, and a Wayback capture. Red Star's cited URL now redirects to its jar page, which still carries the packet sentence.

## Files

- `check.csv`: one row per citation (192), with the source's words, URL, correction and notes.
- `scripts/`: `build_check.py` (writes `check.csv`), `arith.py` (every conversion), `fdc_portions.py` and `foundation_trace.py` (USDA bulk files), `crop.py` (page images), `html_text.py`, `pdf_text.py`, `recipe_ingredients.py`, `xlsx_grep.py`.
- `dl/`: everything downloaded, including the HERR 41, NBS C440, Tech. Bull. 1261 and Maple Sirup Producers Manual page images and the crops read (`dl/crops/`).
