> Reviewer A's findings for `docs/research/cooking-2.md`, as written on 2026-10-16, blind to the other reviewer and to our figures. Paths under `dl/` and `scripts/` refer to the reviewer's working folder, not kept.

# Cup weights of baking ingredients: findings of reviewer A

Read and computed 2026-10-16. 1 US cup = 236.5882365 mL; 1 oz = 28.349523125 g; 1 lb = 453.59237 g. 302 figures are in figures.csv (one row each, with the arithmetic in the notes column). Saved copies of every page and file read are under dl/, the scripts under scripts/.

## Sources

- **King Arthur Baking, Ingredient Weight Chart** (kingarthurbaking.com, read 2026-10-16), with its "How to Measure Flour" page and
  2023 blog post. KA's test kitchen; flour is "fluff, sprinkle (spoon), scrape" = 120 g. Grams follow an ounce column in 1/8-oz
  steps. Quirk: every cup-measured liquid (water, milk, cream, yogurt, sour cream) is written as 8 oz = 227 g, though water is
  236 g; oils are 198-200 g. A note says its recipes may differ slightly. Independent of USDA.
- **America's Test Kitchen / Cook's Illustrated**: the "Baking Conversion Chart for Flour and Butter", the "Measuring Flour"
  explanation (dip and sweep; "dozens of volunteers" averaged 5 oz), and the ingredient lists (JSON-LD) of 70 ATK recipe
  pages, 27 of which supplied the weights used here (many ATK recipes give no weight for liquids, rice or small measures).
  Independent of USDA. Newer recipes give grams for liquids (milk 245-246, water 236, oil 210); older ones write
  liquids as 8 oz per cup; a few internal contradictions (molasses 340 vs 312, cornstarch 112 vs 150).
- **USDA Home Economics Research Report No. 41, "Average Weight of a Measured Cup of Various Foods"** (Fulton, Matthews,
  Davis; first issued as ARS 61-6, February 1969; reissued March 1977; archive.org scan of the NAL copy). Consumer and Food
  Economics Institute laboratory. 1 cup = 237 mL. "Dry food items were measured in cups that indicated 1 cup at the top rim. The
  cup was filled with the food, and the top was leveled with the thin edge of a metal spatula. All materials were spooned lightly
  into the cup unless a special measuring technique, such as dipping, is included in the description of the food item. Liquid
  foods and foods in juice were measured in glass measuring cups filled so that the meniscus was on the 1-cup mark. Food items
  were weighed to the nearest gram." Mean, SD and number of cups (2 to 510) per row; flour rows from Matthews & Batcher (1963).
  This is USDA's own measured basis, so it is not independent of USDA's cup weights. I read every needed row from the page
  images (the OCR text is scrambled). Its liquids and syrups run 1-7% below their physical densities.
- **USDA FNS Food Buying Guide for Child Nutrition Programs** (2018 PDFs of Sections 4 and 6, as posted by NC DPI; the same
  grain table is on foodbuyingguide.fns.usda.gov). Conversion factors and yields derived from USDA data (flour 125, whole wheat
  120, oats 81, butter 1 lb = 2 cups, honey 1.40 cups/lb, yeast 3.10 cups/lb). Not independent.
- **FAO/INFOODS Density Database v2.0 (2012)** (Charrondiere, Haytowitz, Stadlmayr; xlsx from FAO's repository). A compilation:
  TB (hypertextbook.com), DK (Danish food table 1996), UK 6th (McCance & Widdowson), RC (Charrondiere's own measurements at
  21 C in France), ASI (industrial bulk densities), KEN (Kenyan project), CSG (specific gravities at 15.6 C), S&W (Stumbo &
  Weiss 2011, computed from USDA database values) and FNDDS/USDA (USDA-derived). Quirks: no fill method for bulk densities;
  "salt 2.165" and "sodium bicarbonate 2.2" are crystal densities; "sunflower oil 0.96" is implausible; no entries for honey,
  molasses, cocoa, peanut butter or raw eggs.
- **Physical references**: NIST Chemistry WebBook (IAPWS-95) for water; Codex standards for named vegetable oils (CODEX-STAN
  210-1999, Appendix) and olive oil (CODEX STAN 33-1981, Rev. 1-1989), read in FAO's 2001 Codex compilation because the current
  Codex PDFs sit behind a Cloudflare challenge; University of Guelph Dairy Science and Technology eBook (Goff, Hill, Ferrer)
  density table for milk and cream at 4.4-38.9 C; FAO Agricultural Services Bulletin 124, Table 2.4 (honey specific gravity
  by water content, after White 1975a) with USDA Tech. Bull. 1261 (1962) for the US mean moisture; National Honey Board FAQ;
  USDA AMS maple syrup grade standard (2015), CFIA's Canadian Grade Compendium Vol. 7 (maple syrup) and USDA's sugarcane
  molasses standard (1959) with NBS Circular C440 (1942) Table 117 (sucrose solutions by Brix, in vacuo and in air); USDA
  Agriculture Handbook 134 (Maple Sirup Producers Manual, 1976); B&G Foods' technical data sheet for Grandma's Original
  Molasses (11.7 lb/gal at 79-80 Brix); Azahra, Hintono & Pramono (2022) for liquid whole egg; Church & Dwight's
  specification for USP No. 1 sodium bicarbonate.
- **Cookbook authors and measured tests**: Rose Levy Beranbaum's site (posts 2005-2025; she weighs on laboratory scales and
  states the method per ingredient: "lightly spooned", "dip and sweep", cake flour sifted); Milk Street "Flour Power" (2017: 22
  published sources averaged, outliers dropped, checked by its own measurements; method: gentle scoop and straight sweep) and
  "Baking Mix-In Weights" (2019: 26 ingredients measured several times and averaged); Stella Parks for Serious Eats (read in an
  archived syndicated copy; spooned cup 4.5 oz, Serious Eats' old dipped standard 5 oz); Food Network Kitchen (2022: spoon and
  level, 125-130 g); Erik Jacobsen's flour page (2007; his own King Arthur bread flour cups). Not read: Joy of Cooking, BakeWise,
  Baking Illustrated and The Cake Bible (only restricted lending copies online); House of Nash Eats' measured test (403).
- **Brand pages and labels**: Gold Medal, Bob's Red Mill, Domino, Land O Lakes, Crisco, Hershey's, Morton, Clabber Girl, Dannon,
  Sargento, Jif, Red Star, Fleischmann's. Open Food Facts was down (503). Labels are weak evidence (next section).
- **Method sources**: Betty Crocker's Picture Cooky Book (General Mills, copyright 1948, Project Gutenberg): sift flour, spoon in
  lightly, level, do not shake; pack brown sugar "just enough to hold its shape"; sieve and spoon confectioners' sugar; pack
  shortening firmly; fill and level measuring spoons; read liquids at eye level. Williams-Sonoma's "Measuring Ingredients" for
  the chopped-nut wording rule.

## How far to trust labels (21 CFR 101.9(b), 101.12)

- The serving size comes from the reference amount (RACC) in 101.12(b); for bulk products such as flour and sugar it is "the
  amount in household measure that most closely approximates the reference amount" (101.9(b)(2)(iii)). RACCs relevant here:
  flours 30 g; sugar 8 g; confectioner's sugar 30 g; starches 10 g; baking powder and soda 0.6 g; salt 1/4 tsp; cocoa 1 tbsp;
  butter, oil, shortening 1 tbsp; honey and molasses 1 tbsp; syrups 30 mL; sour cream 30 g; yogurt 170 g; cheese 30 g; nuts
  30 g; nut butters 2 tbsp; nut flours 15 g; baking candies (chips) 15 g; dry grains 45 g; eggs 50 g.
- For labeling, "a cup means 240 mL", a tablespoon 15 mL, a teaspoon 5 mL, and 1 oz 28 g (101.9(b)(5)(viii)), so a label cup is
  1.4% larger than the US customary cup (236.6 mL).
- The parenthetical grams are "the gram ... quantity equivalent to the household measure", rounded to the whole gram at 5 g and
  above, to 0.5 g from 2 to 5 g, and to 0.1 g below 2 g (101.9(b)(7)(ii)). So "1 tsp (4g)" means 3.75-4.25 g (+/-6%), "1 Tbsp
  (14g)" 13.5-14.5 g, "1/4 cup (30g)" 29.5-30.5 g.
- FDA's guidance ("Guidelines for Determining Metric Equivalents of Household Measures", 1993, now docket FDA-2020-D-1977)
  asks for laboratory measurement: calibrated volumetric equipment, replicates, room-temperature foods at 20 C and refrigerated
  ones at 4 C, fine powders leveled with a straight edge after transfer, a measured volume at least ten times the reference
  amount. It does not say spoon versus dip. FDA checks compliance against the declared grams (nutrients per gram), not the
  gram-to-volume link.
- In practice many labels simply restate the RACC: Hershey's chips "1 tbsp (15g)" (240 g per cup, against 164-170 measured);
  Dannon yogurt "3/4 cup (170g)"; cheese 28 g per 1/4 cup; baking powder and soda "1/8 tsp (0.6g)". Clabber Girl's corn starch
  page even shows the baking powder serving. Bob's Red Mill's flour labels run heavy (AP 136, bread 144, whole wheat 152).
  Conclusion: labels are anchored to the reference amounts and coarsely rounded; use them only as weak corroboration.

## Ingredients

### all-purpose-flour

| Source                                                                                | As given                                    | g per US cup | Method                                                             |
| ------------------------------------------------------------------------------------- | ------------------------------------------- | -----------: | ------------------------------------------------------------------ |
| King Arthur Baking, Ingredient Weight Chart                                           | All-Purpose Flour: 1 cup = 4 1/4 oz = 120 g |        120.0 | Fluff, Sprinkle (spoon), and Scrape (KA how-to-measure-flour page) |
| King Arthur Baking, How to Measure Flour                                              | 1 cup = 120g (or 4.25 oz.)                  |        120.0 | fluff, sprinkle/spoon into cup, scrape level                       |
| King Arthur Baking blog, How to measure flour (R. Anastopoulo, 2023-10-13)            | up to 160 grams (packed)                    |        160.0 | flour condensed/packed into cup                                    |
| America's Test Kitchen, Baking Conversion Chart                                       | 1 cup = 5 oz / 142g                         |        142.0 | dip and sweep (ATK method page)                                    |
| America's Test Kitchen / Cook's Illustrated, Measuring Flour                          | average (5 ounces)                          |        141.7 | dip and sweep                                                      |
| America's Test Kitchen, recipe: Perfect Chocolate Chip Cookies                        | 1 3/4 cups = 8 3/4 oz/248 g                 |        141.7 | dip and sweep (ATK convention)                                     |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 385                                | 1 cup = 143 g (SD 4.8, n=300)               |        143.0 | unsifted: dipped                                                   |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 386                                | 1 cup = 126 g (SD 2.8, n=510)               |        126.0 | unsifted: spooned                                                  |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 387                                | 1 cup = 116 g (SD 1.9, n=500)               |        116.0 | sifted, spooned                                                    |
| USDA FNS Food Buying Guide (2018), Section 4 Grains, Conversions                      | cups of enriched white flour x 125 grams    |        125.0 | not stated                                                         |
| FAO/INFOODS Density DB v2.0 (2012), 'Wheat, flour, white' [RC]                        | 0.67 g/mL                                   |        158.5 | not stated (R. Charrondiere's own measurement, 21 C, France)       |
| FAO/INFOODS Density DB v2.0 (2012), 'Wheat, flour' [S&W]                              | 0.521 g/mL                                  |        123.3 | derived from database values                                       |
| Rose Levy Beranbaum, realbakingwithrose.com: Shortbread for Mother's Day (2017-04-29) | 362 grams/3 cups (bleached)                 |        120.7 | lightly spooned into cup and leveled off                           |
| Rose Levy Beranbaum, realbakingwithrose.com: Spaetzle (2021-12-15)                    | 115 grams (1 cup - 1 Tablespoon), bleached  |        122.7 | lightly spooned                                                    |
| Rose Levy Beranbaum, realbakingwithrose.com: Lesson in Warqa (2021-07-12)             | 363 grams 3 cups (unbleached, King Arthur)  |        121.0 | lightly spooned                                                    |
| Serious Eats / Stella Parks, 'Do You Scoop or Spoon Your Flour?'                      | four-and-a-half-ounce cup                   |        127.6 | spooning method                                                    |
| Serious Eats / Stella Parks, 'Do You Scoop or Spoon Your Flour?'                      | a five-ounce cup                            |        141.7 | dipping (scooping), average of Kenji Lopez-Alt's 4-6 oz            |
| Food Network Kitchen (J. Sheehan), How to Measure Flour (2022-02-15)                  | 125 to 130 grams, or about 4 1/2 ounces     |        127.5 | spoon and level (fluff, spoon in, scrape level)                    |
| Milk Street, 'Flour Power' (2017)                                                     | All-purpose 130 grams per cup               |        130.0 | scoop gently from a container, sweep level with a straight knife   |
| Gold Medal (General Mills) product page, All Purpose Flour                            | 3 1/3 cups of flour per pound               |        136.1 | not stated                                                         |
| Label: Gold Medal All Purpose Flour (brand site)                                      | 1/4 cup (30g); 75 servings per 5 lb         |        120.0 | not stated                                                         |
| Label: Bob's Red Mill Unbleached White All-Purpose Flour (brand site)                 | 1/4 cup (34g)                               |        136.0 | not stated                                                         |

Method US recipes mean: Spoon and level, unsifted: fluff the flour, spoon it into a dry cup, sweep level without tapping. This is King Arthur's "fluff, sprinkle, scrape", Food Network Kitchen's and Stella Parks's method, Beranbaum's "lightly spooned", and the default of USDA's own measuring study. The large exception is America's Test Kitchen (Cook's Illustrated, Cook's Country), which dips and sweeps (5 oz); older Serious Eats recipes did too. Recipes from before about 1970 assumed sifted flour (Betty Crocker, 1948: sift, then spoon in lightly). "1 cup sifted flour" means sift, then measure.

**Best estimate: 125 g per US cup (spoon and level, unsifted)**; why: the only large laboratory series, HERR 41, measured 126 g (510 cups, SD 2.8); Beranbaum's lightly spooned cups are 121-123 g, Parks's 128 g, Food Network's 125-130 g, King Arthur's 120 g; their mean is about 124. Dip and sweep is a different, consistent 142 g (ATK 142, HERR dipped 143, Erik Jacobsen 142, Serious Eats' old 141.7) and sifted is 116 g (HERR); a converter could offer both. Discounted: label grams (30 g per 1/4 cup equals the flour reference amount), Bob's Red Mill's label (136), Gold Medal's "3 1/3 cups per pound" (136, method unstated and contradicted by its own label), FAO's 0.67 g/mL (French flour, fill unknown), Milk Street's 130 (gentle scoop, partly a survey of other charts).

### bread-flour

| Source                                                                               | As given                                                           | g per US cup | Method                                       |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | -----------: | -------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                          | Bread Flour: 1 cup = 4 1/4 oz = 120 g                              |        120.0 | Fluff, Sprinkle, and Scrape                  |
| America's Test Kitchen, recipe: Classic Italian Bread                                | 3 cups = 16 1/2 oz/468 g                                           |        156.0 | dip and sweep (ATK convention)               |
| America's Test Kitchen, recipe: American Sandwich Bread                              | 2 1/2 cups = 13 3/4 oz/390 g                                       |        156.0 | dip and sweep (ATK convention)               |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 388                               | 1 cup = 136 g (SD 6.5, n=40)                                       |        136.0 | unsifted: dipped                             |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 389                               | 1 cup = 123 g (SD 3.5, n=40)                                       |        123.0 | unsifted: spooned                            |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 390                               | 1 cup = 117 g (SD 4.2, n=41)                                       |        117.0 | sifted, spooned                              |
| Rose Levy Beranbaum, realbakingwithrose.com: Casting Pizza on the Water (2012-10-13) | 250 grams (2 cups minus 1 tablespoon), Gold Medal Better for Bread |        129.0 | lightly spooned into the cup and leveled off |
| Erik Jacobsen, Notes on Flour Weights and Measures (updated 2007-08-06)              | about 4 ounces (113 grams)                                         |        113.0 | spoon (sprinkle) and level, no tapping       |
| Erik Jacobsen, Notes on Flour Weights and Measures (updated 2007-08-06)              | about 5 ounces (142 grams)                                         |        142.0 | scoop from container, tap, level             |
| Milk Street, 'Flour Power' (2017)                                                    | Bread 137 grams per cup                                            |        137.0 | scoop gently from a container, sweep level   |
| Gold Medal (General Mills) product page, Bread Flour                                 | 3 1/3 cups of flour per pound                                      |        136.1 | not stated                                   |
| Label: Gold Medal Bread Flour (brand site)                                           | 1/4 cup (30g)                                                      |        120.0 | not stated                                   |
| Label: Bob's Red Mill Artisan Bread Flour (brand site)                               | 1/4 cup (36 g)                                                     |        144.0 | not stated                                   |

Method US recipes mean: Same as all-purpose: spoon and level unless the recipe is from America's Test Kitchen (dip and sweep).

**Best estimate: 123 g per US cup (spoon and level)**; why: HERR 41 spooned 123 g (40 cups), King Arthur 120, Beranbaum 129 (Gold Medal Better for Bread), Jacobsen about 113 (whole-ounce rounding); HERR's three methods for bread flour (dipped 136, spooned 123, sifted 117) sit a few grams below its all-purpose rows. Scooped values cluster at 136-142 (HERR dipped 136, Milk Street 137, Gold Medal 136, Jacobsen 142). ATK's 156 (5 1/2 oz) is the outlier and labels (120, 144) were discounted.

### whole-wheat-flour

| Source                                                                        | As given                                               | g per US cup | Method                                     |
| ----------------------------------------------------------------------------- | ------------------------------------------------------ | -----------: | ------------------------------------------ |
| King Arthur Baking, Ingredient Weight Chart                                   | Whole Wheat Flour (Premium 100%): 1 cup = 4 oz = 113 g |        113.0 | Fluff, Sprinkle, and Scrape                |
| King Arthur Baking, Ingredient Weight Chart (white whole wheat)               | Golden Wheat Flour: 1 cup = 4 oz = 113 g               |        113.0 | Fluff, Sprinkle, and Scrape                |
| King Arthur Baking, recipe: 100% Whole Wheat Banana Bread (white whole wheat) | 2 cups (226g) Golden Wheat Flour                       |        113.0 | KA standard                                |
| America's Test Kitchen, Baking Conversion Chart                               | 1 cup = 5½ oz / 156g                                   |        156.0 | dip and sweep                              |
| America's Test Kitchen, recipe: Whole Wheat American Loaf Bread               | 1 1/3 cups = 7 1/3 oz/208 g                            |        156.0 | dip and sweep (ATK convention)             |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 400                        | 1 cup = 120 g (SD 3.3, n=45)                           |        120.0 | stirred, spooned                           |
| USDA FNS Food Buying Guide (2018), Section 4 Grains, Conversions              | cups of whole wheat flour x 120 grams                  |        120.0 | not stated                                 |
| FAO/INFOODS Density DB v2.0 (2012), 'Wheat, flour, wholemeal' [RC]            | 0.55 g/mL                                              |        130.1 | not stated (Charrondiere, France)          |
| Milk Street, 'Flour Power' (2017)                                             | Whole wheat 140 grams per cup (King Arthur)            |        140.0 | scoop gently from a container, sweep level |
| Label: Gold Medal Whole Wheat Flour (brand site)                              | 1/4 cup (30g)                                          |        120.0 | not stated                                 |
| Label: Bob's Red Mill Whole Wheat Flour (brand site)                          | 1/4 cup (38 g)                                         |        152.0 | not stated                                 |

Method US recipes mean: Spoon and level (HERR: stirred, then spooned).

**Best estimate: 120 g per US cup (spoon and level). White whole wheat: 113 g per US cup (one source only)**; why: HERR 41 measured 120 g (45 cups); King Arthur's regular whole wheat is 113; Gold Medal's label (30 g per 1/4 cup) agrees with 120; USDA's Food Buying Guide factor (120) is derived from USDA data, not independent. Dip-and-sweep and coarse stone-ground flours run higher: ATK 156, Milk Street 140, Bob's Red Mill label 152. White whole wheat: King Arthur's Golden Wheat (renamed from White Whole Wheat in 2024) is 113 g in its chart and recipes; I found no second source, so treat it as provisional.

### cake-flour

| Source                                                                                                    | As given                                        | g per US cup | Method                                                                  |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -----------: | ----------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                               | Unbleached Cake Flour: 1 cup = 4 1/4 oz = 120 g |        120.0 | Fluff, Sprinkle, and Scrape                                             |
| America's Test Kitchen, Baking Conversion Chart                                                           | 1 cup = 4 oz / 113g                             |        113.0 | dip and sweep (ATK convention)                                          |
| America's Test Kitchen, recipe: Easy Almond Pound Cake                                                    | 1 1/2 cups = 6 oz/170 g                         |        113.3 | dip and sweep (ATK convention)                                          |
| America's Test Kitchen, recipe: Lemon-Poppy Seed Angel Food Cake                                          | 1 cup + 2 tbsp = 4 1/2 oz/128 g                 |        113.8 | dip and sweep (ATK convention)                                          |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 391                                                    | 1 cup = 119 g (SD 3.1, n=300)                   |        119.0 | unsifted: dipped                                                        |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 392                                                    | 1 cup = 111 g (SD 2.4, n=300)                   |        111.0 | unsifted: spooned                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 393                                                    | 1 cup = 99 g (SD 1.6, n=300)                    |         99.0 | sifted, spooned                                                         |
| Rose Levy Beranbaum, realbakingwithrose.com: The Undoing of a Revision: The UK Cake Bible (2012) (sifted) | 100 grams/3.5 ounces/1 cup                      |        100.0 | sifted into the cup and leveled off (her stated default for cake flour) |
| Rose Levy Beranbaum, realbakingwithrose.com: The UK Cake Bible conversions (2012)                         | 170 grams/6 ounces/1-1/2 cups                   |        113.3 | lightly spooned into the cup and leveled off                            |
| Rose Levy Beranbaum, realbakingwithrose.com: The UK Cake Bible conversions (2012)                         | 65 grams/2.25 ounces/1/2 cup                    |        130.0 | dip and sweep                                                           |
| Milk Street, 'Flour Power' (2017)                                                                         | Cake 120 grams per cup                          |        120.0 | scoop gently, sweep level                                               |
| Label: Bob's Red Mill Super-Fine Cake Flour (brand site)                                                  | 1/4 cup (28g)                                   |        112.0 | not stated                                                              |

Method US recipes mean: As it comes, spooned and leveled; "sifted" only where the recipe says so. Beranbaum's books are the notable exception: her cake-flour cups are sifted into the cup (100 g).

**Best estimate: 113 g per US cup as it comes (spooned); sifted 100 g per US cup**; why: four independent figures agree within 2 g: HERR 41 spooned 111 (300 cups), Beranbaum lightly spooned 113.3, ATK 113, Bob's Red Mill label 112. Sifted: HERR 99 (300 cups) and Beranbaum 100. Dipped: HERR 119, Beranbaum 130. King Arthur's 120 is for its own unbleached cake flour, a heavier product, and Milk Street's 120 is a survey average.

### almond-flour

| Source                                                                   | As given                              | g per US cup | Method                         |
| ------------------------------------------------------------------------ | ------------------------------------- | -----------: | ------------------------------ |
| King Arthur Baking, Ingredient Weight Chart                              | Almond Flour: 1 cup = 3 3/8 oz = 96 g |         96.0 | not stated (KA chart)          |
| King Arthur Baking, Ingredient Weight Chart (almond meal)                | Almond meal: 1 cup = 3 oz = 84 g      |         84.0 | not stated (KA chart)          |
| America's Test Kitchen, recipe: Gingery Carrot Cake with Pistachios      | 1 cup = 4 oz/113 g                    |        113.0 | dip and sweep (ATK convention) |
| Milk Street, 'Flour Power' (2017)                                        | Almond flour 100 grams per cup        |        100.0 | scoop gently, sweep level      |
| Label: Bob's Red Mill Almond Flour (super-fine, blanched; brand site)    | 2 Tbsp (14g)                          |        112.0 | not stated                     |
| Label: Bob's Red Mill Unblanched Almond Flour (brand site) (almond meal) | 2 Tbsp (13 g)                         |        104.0 | not stated                     |

Method US recipes mean: Spoon and level, without packing (almond flour compresses easily).

**Best estimate: 100 g per US cup (blanched, finely ground, spooned). Almond meal: unresolved, 84-104 g**; why: King Arthur 96 and Milk Street 100 are the spooned/gentle values; ATK 113 (dip and sweep) and Bob's Red Mill's label 112 (14 g per 2 Tbsp, a small measure rounded to the gram) are the scooped end. Almond meal: King Arthur 84 versus Bob's Red Mill unblanched almond flour label 104; no third source.

### granulated-sugar

| Source                                                                                                    | As given                                                 | g per US cup | Method                                                                           |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | -----------: | -------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                               | Sugar (granulated white): 1 cup = 7 oz = 198 g           |        198.0 | not stated (spooned/poured, leveled)                                             |
| King Arthur Baking, recipe: Classic Chocolate Chip Cookies                                                | 2/3 cup (131g)                                           |        196.5 | KA standard                                                                      |
| America's Test Kitchen, Baking Conversion Chart                                                           | 1 cup = 7 oz / 198g                                      |        198.0 | not stated                                                                       |
| America's Test Kitchen, recipe: Molasses Spice Cookies with Orange Essence                                | 1 cup = 7 oz/198 g                                       |        198.0 | not stated                                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 767                                                    | 1 cup = 196 g (SD 7.6, n=81)                             |        196.0 | spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| Rose Levy Beranbaum, realbakingwithrose.com: Sugar (2005-12-06)                                           | 1 cup/200 grams                                          |        200.0 | not stated                                                                       |
| Rose Levy Beranbaum site (W. Wolston): A Reason to Weigh... Measuring Cups are not all Equal (2025-12-06) | always at 200 grams/cup; three cups gave 182, 201, 212 g |        200.0 | dry measuring cups                                                               |
| Domino Sugar, Measurement and Conversion Charts                                                           | Granulated Sugar, 1 lb = 2 1/4 cups                      |        201.6 | not stated                                                                       |
| FAO/INFOODS Density DB v2.0 (2012), 'Sugar, white' [RC]                                                   | 0.9 g/mL                                                 |        212.9 | not stated (Charrondiere, France)                                                |
| FAO/INFOODS Density DB v2.0 (2012), 'Sugar, white' [FNDDS 4.1]                                            | 0.88 g/mL                                                |        208.2 | derived                                                                          |
| FAO/INFOODS Density DB v2.0 (2012), 'Sugar, granulated' [ASI]                                             | 0.7 g/mL                                                 |        165.6 | industrial bulk density                                                          |

Method US recipes mean: Spoon or pour in and level; packing hardly matters for granulated sugar.

**Best estimate: 200 g per US cup**; why: HERR 41 196 (81 cups), King Arthur 198, ATK 198 (7 oz), Beranbaum 200, Domino's package table 201.6 (2 1/4 cups per pound). Beranbaum's site also found that three retail measuring cups held 182, 201 and 212 g of the same sugar, so the cup itself is a larger error than the sugar. FAO's 0.88-0.90 g/mL entries (208-213 g) are USDA-derived or of unknown method; ASI figures are industrial.

### brown-sugar

| Source                                                          | As given                                                      | g per US cup | Method        |
| --------------------------------------------------------------- | ------------------------------------------------------------- | -----------: | ------------- |
| King Arthur Baking, Ingredient Weight Chart                     | Brown sugar (dark or light, packed): 1 cup = 7 1/2 oz = 213 g |        213.0 | packed        |
| King Arthur Baking, recipe: Classic Chocolate Chip Cookies      | 2/3 cup (142g), packed                                        |        213.0 | packed        |
| King Arthur Baking, recipe: Maple-Walnut Sticky Buns            | 1 cup (213g), firmly packed                                   |        213.0 | firmly packed |
| America's Test Kitchen, Baking Conversion Chart                 | 1 cup = 7 oz / 198g                                           |        198.0 | packed        |
| America's Test Kitchen, recipe: Perfect Pecan Pie               | 1 cup = 7 oz/198 g, packed dark                               |        198.0 | packed        |
| America's Test Kitchen, recipe: Ultimate Banana Bread           | 3/4 cup = 5 1/4 oz/149 g, packed light                        |        198.7 | packed        |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 763          | 1 cup = 211 g (SD 22.5, n=118)                                |        211.0 | packed        |
| Rose Levy Beranbaum, realbakingwithrose.com: Sugar (2005-12-06) | 1 cup packed light brown sugar 217 grams                      |        217.0 | packed        |
| Rose Levy Beranbaum, realbakingwithrose.com: Sugar (2005-12-06) | 1 cup packed dark brown sugar/ 239 grams                      |        239.0 | packed        |
| Domino Sugar, Measurement and Conversion Charts                 | Brown Sugar, 1 lb = approximately 2 1/3 cups (firmly packed)  |        194.4 | firmly packed |
| Domino Sugar, Measurement and Conversion Charts                 | Brown Sugar, 4 lbs = 10 cups (firmly packed)                  |        181.4 | firmly packed |

Method US recipes mean: Firmly packed (King Arthur, ATK, Domino "firmly packed"; Betty Crocker 1948: packed "just enough to hold its shape").

**Best estimate: 213 g per US cup (packed, light or dark)**; why: King Arthur 213 (chart and recipes), HERR 41 211 (118 cups, but SD 22.5 g: packing varies more than for any other dry ingredient), Beranbaum light 217. Lower: ATK 198 (7 oz), Domino 194 and 181 (its own table is inconsistent). Beranbaum's dark brown 239 is the high outlier (she favors moist Muscovado-style sugars). King Arthur and ATK treat light and dark alike.

### powdered-sugar

| Source                                                                                        | As given                                              | g per US cup | Method                                       |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -----------: | -------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                   | Confectioners' sugar (unsifted): 1 cup = 4 oz = 113 g |        113.0 | unsifted                                     |
| America's Test Kitchen, Baking Conversion Chart                                               | 1 cup = 4 oz / 113g                                   |        113.0 | not stated                                   |
| America's Test Kitchen, recipe: Hummingbird Banana Bread                                      | 1 1/2 cups = 6 oz/170 g                               |        113.3 | not stated                                   |
| America's Test Kitchen, recipe: Cranberry-Orange Olive Oil Cake                               | 283 grams (2 1/2 cups)                                |        113.2 | not stated                                   |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 765                                        | 1 cup = 113 g (SD 5.4, n=40)                          |        113.0 | unsifted (spooned)                           |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 766 (sifted)                               | 1 cup = 95 g (SD 3.9, n=64)                           |         95.0 | sifted (spooned)                             |
| Rose Levy Beranbaum, realbakingwithrose.com: Shortbread for Mother's Day (2017-04-29)         | 28 grams/1/4 cup                                      |        112.0 | lightly spooned into cup and leveled off     |
| Rose Levy Beranbaum, realbakingwithrose.com: Sweet, Spicy, Salty, Candied Pecans (2021-02-12) | 57 grams/1/2 cup                                      |        114.0 | lightly spooned into the cup and leveled off |
| Domino Sugar, Measurement and Conversion Charts                                               | Powdered Sugar, 1 lb = 3 3/4 cups (unsifted)          |        121.0 | unsifted                                     |
| FAO/INFOODS Density DB v2.0 (2012), 'Sugar, powdered' [ASI]                                   | 0.56 g/mL                                             |        132.5 | industrial bulk density                      |

Method US recipes mean: Unsifted, spooned and leveled, unless the recipe says sifted (King Arthur and Domino give unsifted; Beranbaum "lightly spooned").

**Best estimate: 113 g per US cup unsifted; sifted 95 g per US cup**; why: HERR 41 113 (40 cups), King Arthur 113, ATK 113, Beranbaum 112-114: unusually tight agreement. Domino's 3 3/4 cups per pound (121) is the only higher figure. Sifted: HERR 95 (64 cups).

### butter

| Source                                                                            | As given                                          | g per US cup | Method                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------- | -----------: | ------------------------------ |
| King Arthur Baking, Ingredient Weight Chart                                       | Butter: 8 tablespoons (1/2 cup) = 4 oz = 113 g    |        226.0 | stick/tablespoon markings      |
| America's Test Kitchen, Baking Conversion Chart                                   | 16 tablespoons (2 sticks, or 1 cup) = 8 oz / 227g |        227.0 | stick markings                 |
| America's Test Kitchen, recipe: Salted Malted Milk Chocolate Chunk Cookies        | 228 grams (16 tablespoons)                        |        228.0 | stick markings                 |
| Rose Levy Beranbaum, realbakingwithrose.com: The UK Cake Bible conversions (2012) | 227 grams/8 ounces/16 tablespoons                 |        227.0 | weighed                        |
| Land O Lakes salted butter (brand site, label)                                    | About 32 per lb; 1 Tbsp (14g)                     |        226.8 | 1 lb = 32 tablespoons = 2 cups |
| USDA FNS Food Buying Guide (2018), Section 6 Other Foods                          | Butter: 1 lb = 2 cups                             |        226.8 | package equivalence            |
| FAO/INFOODS Density DB v2.0 (2012), 'Butter' [TB]                                 | 0.911 g/mL                                        |        215.5 | physical density               |

Method US recipes mean: By stick and tablespoon marks: 1 lb = 4 sticks = 2 cups = 32 tablespoons.

**Best estimate: 227 g per US cup (226.8 g = 1/2 lb)**; why: the cup is defined by the package: ATK 227, Beranbaum 227, Land O Lakes 32 tablespoons per pound, USDA Food Buying Guide "1 lb = 2 cups", King Arthur 226 (113 g per half cup). ATK's newer recipes round to 228. The physical density of butter (0.911 g/mL, 215.5 g per cup) is irrelevant to how US recipes measure butter.

### vegetable-oil

| Source                                                                               | As given                                          | g per US cup | Method                                                                                   |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- | -----------: | ---------------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                          | Vegetable oil: 1 cup = 7 oz = 198 g               |        198.0 | liquid measure                                                                           |
| King Arthur Baking, recipe: Classic Sandwich Bread                                   | 1/4 cup (50g)                                     |        200.0 | liquid measure                                                                           |
| America's Test Kitchen, recipe: Spiced Pumpkin Layer Cake                            | 1 cup (210 grams)                                 |        210.0 | liquid measure                                                                           |
| America's Test Kitchen, recipe: Classic Chewy Oatmeal Cookies                        | 1/2 cup (105 grams)                               |        210.0 | liquid measure                                                                           |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 497                               | 1 cup = 209 g (SD 3.1, n=49)                      |        209.0 | glass measuring cup filled to the 1-cup mark at the meniscus (report method for liquids) |
| Milk Street, Baking Mix-In Weights (Mar-Apr 2019)                                    | Oil, liquid 206 g per cup                         |        206.0 | measured by volume several times, averaged                                               |
| Codex CODEX-STAN 210-1999, Appendix Table 2 (soya bean oil)                          | relative density 0.919-0.925 (20 C/water at 20 C) |        217.7 | physical density at 20 C                                                                 |
| Codex CODEX-STAN 210-1999, Appendix Table 2 (rapeseed oil, low erucic acid = canola) | relative density 0.914-0.920 (20 C/water at 20 C) |        216.6 | physical density at 20 C                                                                 |
| FAO/INFOODS Density DB v2.0 (2012), 'Oil, vegetable, soya' [TB]                      | 0.927 g/mL                                        |        219.3 | physical density                                                                         |
| FAO/INFOODS Density DB v2.0 (2012), 'Oil, other than palmoil' [DK]                   | 0.92 g/mL                                         |        217.7 | physical density                                                                         |
| Label: Crisco Pure Vegetable Oil (brand site)                                        | 1 Tbsp (14g)                                      |        224.0 | not stated                                                                               |
| Label: Crisco Pure Canola Oil (brand site)                                           | 1 Tbsp (14g)                                      |        224.0 | not stated                                                                               |

Method US recipes mean: Liquid measuring cup filled to the line.

**Best estimate: 218 g per US cup (soybean or canola oil at about 20 C)**; why: the physical value is well established: Codex relative density 0.919-0.925 for soybean oil (217.0-218.5 g) and 0.914-0.920 for low-erucic rapeseed (canola) oil (215.9-217.3 g), FAO's Danish 0.92 (217.7) and hypertextbook 0.927 (219.3). Cups measured in kitchens come in 4-5% lower: HERR 41 209 (49 cups), ATK 210, Milk Street 206. King Arthur's 198 (7 oz) and 200 look like ounce rounding, and label grams (14 g per Tbsp = 224) are rounded up from about 13.6 g. I recommend the physical value and flag the gap.

### olive-oil

| Source                                                                     | As given                                          | g per US cup | Method                     |
| -------------------------------------------------------------------------- | ------------------------------------------------- | -----------: | -------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                | Olive oil: 1/4 cup = 1 3/4 oz = 50 g              |        200.0 | liquid measure             |
| America's Test Kitchen, recipe: Cranberry-Orange Olive Oil Cake            | 280 grams (1 1/3 cups)                            |        210.0 | liquid measure             |
| America's Test Kitchen, recipe: Chocolate Olive Oil Cake                   | 1/2 cup (105 grams)                               |        210.0 | liquid measure             |
| Codex CODEX STAN 33-1981, Rev. 1-1989, 3.1.2.1 (virgin, refined olive oil) | relative density 0.910-0.916 (20 C/water at 20 C) |        215.6 | physical density at 20 C   |
| FAO/INFOODS Density DB v2.0 (2012), 'Oil, vegetable, olive' [TB]           | 0.918 g/mL                                        |        217.2 | physical density           |
| FAO/INFOODS Density DB v2.0 (2012), 'Oil, olive (at 15.6 C)' [CSG]         | specific gravity 0.91-0.92                        |        216.5 | specific gravity at 15.6 C |

Method US recipes mean: Liquid measuring cup filled to the line.

**Best estimate: 216 g per US cup**; why: Codex relative density 0.910-0.916 at 20 C gives 214.9-216.3 g; FAO's hypertextbook 0.918 gives 217.2. ATK's 210 and King Arthur's 200 show the same low kitchen-measurement bias as for vegetable oil.

### shortening

| Source                                                     | As given                                        | g per US cup | Method                                                                           |
| ---------------------------------------------------------- | ----------------------------------------------- | -----------: | -------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                | Vegetable shortening: 1/4 cup = 1 5/8 oz = 46 g |        184.0 | not stated                                                                       |
| King Arthur Baking, recipe: Classic Chocolate Chip Cookies | 1/2 cup (92g)                                   |        184.0 | not stated                                                                       |
| America's Test Kitchen, recipe: Foolproof Pie Dough        | 1/2 cup (88 grams)                              |        176.0 | not stated                                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 715     | 1 cup = 187 g (SD 8.8, n=7)                     |        187.0 | spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| Milk Street, Baking Mix-In Weights (Mar-Apr 2019)          | Shortening 187 g per cup                        |        187.0 | measured, averaged                                                               |
| Crisco All-Vegetable Shortening Baking Sticks (brand site) | 6.7 OZ (one cup stick)                          |        189.9 | 1-cup stick                                                                      |
| Label: Crisco All-Vegetable Shortening (brand site)        | 1 Tbsp (12g)                                    |        192.0 | not stated                                                                       |

Method US recipes mean: Packed firmly into a dry cup and leveled (Betty Crocker 1948); now often by Crisco's 1-cup sticks.

**Best estimate: 190 g per US cup**; why: Crisco defines its baking stick as one cup of 6.7 oz (190 g; 20 oz for 3 sticks = 189 g); two independent measurements agree within 2%: HERR 41 187 (7 cups) and Milk Street 187; King Arthur 184 and Crisco's label (12 g per Tbsp = 192) bracket it. ATK's 176 is low.

### milk

| Source                                                                                               | As given                                       | g per US cup | Method                                                                                   |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -----------: | ---------------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                          | Milk (fresh): 1 cup = 8 oz = 227 g             |        227.0 | liquid measure                                                                           |
| King Arthur Baking, recipe: Classic Sandwich Bread                                                   | 1/2 cup (113g)                                 |        226.0 | liquid measure                                                                           |
| America's Test Kitchen, recipe: Chocolate Guinness Cake                                              | 1/2 cup (123 grams) whole milk                 |        246.0 | liquid measure                                                                           |
| America's Test Kitchen, recipe: Cranberry-Orange Olive Oil Cake                                      | 276 grams (1 cup plus 2 tablespoons) milk      |        245.3 | liquid measure                                                                           |
| America's Test Kitchen, recipe: American Sandwich Bread                                              | 3/4 cup (6 ounces) whole milk                  |        226.8 | liquid measure                                                                           |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 469                                               | 1 cup = 241 g (SD 8.5, n=47)                   |        241.0 | glass measuring cup filled to the 1-cup mark at the meniscus (report method for liquids) |
| Univ. of Guelph Dairy Science and Technology eBook (Goff, Hill, Ferrer), Physical Properties of Milk | homogenized milk 3.6% fat: 1.029 kg/L at 20 C  |        243.4 | physical density at 20 C                                                                 |
| Univ. of Guelph Dairy Science and Technology eBook (Goff, Hill, Ferrer), Physical Properties of Milk | homogenized milk 3.6% fat: 1.033 kg/L at 4.4 C |        244.4 | physical density at 4.4 C (refrigerated)                                                 |
| FAO/INFOODS Density DB v2.0 (2012), 'Milk, liquid, whole' [TB]                                       | 1.03 g/mL                                      |        243.7 | physical density                                                                         |
| FAO/INFOODS Density DB v2.0 (2012), 'Milk, liquid, whole' [DK]                                       | 1.031 g/mL                                     |        243.9 | physical density                                                                         |

Method US recipes mean: Liquid measuring cup; milk is usually measured cold.

**Best estimate: 244 g per US cup**; why: density of homogenized whole milk is 1.029 kg/L at 20 C (243.4 g) and 1.033 at 4.4 C (244.4 g) (Guelph); FAO's 1.030-1.031 agree; ATK's newer recipes use 245-246 and HERR 41 measured 241 (47 cups). King Arthur's 227 and ATK's older "6 ounces per 3/4 cup" treat a fluid cup as 8 oz of weight and are 7% low.

### heavy-cream

| Source                                                                                               | As given                                                               | g per US cup | Method                                                                                   |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -----------: | ---------------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                          | Cream (heavy cream, light cream, or half & half): 1 cup = 8 oz = 227 g |        227.0 | liquid measure                                                                           |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 351                                               | 1 cup = 232 g (SD 7.7, n=9)                                            |        232.0 | glass measuring cup filled to the 1-cup mark at the meniscus (report method for liquids) |
| Univ. of Guelph Dairy Science and Technology eBook (Goff, Hill, Ferrer), Physical Properties of Milk | heavy cream 36.6% fat: 0.994 kg/L at 20 C                              |        235.2 | physical density at 20 C                                                                 |
| Univ. of Guelph Dairy Science and Technology eBook (Goff, Hill, Ferrer), Physical Properties of Milk | heavy cream 36.6% fat: 1.008 kg/L at 4.4 C                             |        238.5 | physical density at 4.4 C (refrigerated)                                                 |
| FAO/INFOODS Density DB v2.0 (2012), 'Cream, heavy' [TB]                                              | 0.994 g/mL                                                             |        235.2 | physical density                                                                         |
| FAO/INFOODS Density DB v2.0 (2012), 'Cream, 38% fat' [DK]                                            | 0.984 g/mL                                                             |        232.8 | physical density                                                                         |
| FAO/INFOODS Density DB v2.0 (2012), 'Cream, whipping (about 40% fat)' [UK 6th]                       | specific gravity 0.96                                                  |        227.1 | specific gravity                                                                         |

Method US recipes mean: Liquid measuring cup, cold from the refrigerator.

**Best estimate: 237 g per US cup (36-40% fat)**; why: Guelph's heavy cream (36.6% fat) is 1.008 kg/L at 4.4 C (238.5 g) and 0.994 at 20 C (235.2 g); FAO's hypertextbook 0.994 and Danish 38%-fat 0.984 (232.8) agree; HERR 41 measured 232 for 1960s whipping cream (9 cups). King Arthur's 227 is the 8-oz convention; McCance & Widdowson's 0.96 for UK whipping cream (227) is low against every dairy reference.

### sour-cream

| Source                                                                               | As given                         | g per US cup | Method                                                                           |
| ------------------------------------------------------------------------------------ | -------------------------------- | -----------: | -------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                          | Sour cream: 1 cup = 8 oz = 227 g |        227.0 | not stated                                                                       |
| America's Test Kitchen, recipe: Chocolate Guinness Cake                              | 1/4 cup (59 grams)               |        236.0 | not stated                                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 349                               | 1 cup = 236 g (SD 9.4, n=32)     |        236.0 | spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| FAO/INFOODS Density DB v2.0 (2012), 'Cream, sour (creme fraiche about 18% fat)' [DK] | 1.005 g/mL                       |        237.8 | physical density                                                                 |

Method US recipes mean: Spooned into a dry cup and leveled.

**Best estimate: 236 g per US cup**; why: HERR 41 236 (32 cups) and ATK 236 (59 g per 1/4 cup) agree; the Danish table's 18%-fat sour cream at 1.005 g/mL gives 237.8 (a spooned cup holds some air). King Arthur's 227 is the 8-oz convention.

### yogurt

| Source                                                                        | As given                     | g per US cup | Method                                                                           |
| ----------------------------------------------------------------------------- | ---------------------------- | -----------: | -------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                   | Yogurt: 1 cup = 8 oz = 227 g |        227.0 | not stated                                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 823                        | 1 cup = 245 g (SD 4.6, n=11) |        245.0 | spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| FAO/INFOODS Density DB v2.0 (2012), 'Yoghurt, plain, unsweetened' [DK]        | 1.031 g/mL                   |        243.9 | physical density                                                                 |
| FAO/INFOODS Density DB v2.0 (2012), 'Yoghurt, plain, unsweetened' [FNDDS 4.1] | 1.06 g/mL                    |        250.8 | derived                                                                          |
| Label: Dannon Plain Whole Milk Yogurt (brand site)                            | 3/4 Cup (170g)               |        226.7 | not stated                                                                       |

Method US recipes mean: Spooned into a cup and leveled.

**Best estimate: 245 g per US cup (plain whole-milk). Greek: not established**; why: HERR 41 measured 245 (11 cups) and the Danish table's 1.031 g/mL gives 243.9. FNDDS's 1.06 (250.8) is USDA-derived. King Arthur's 227 is the 8-oz convention and Dannon's label (170 g per 3/4 cup = 226.7) equals the yogurt reference amount (170 g). Greek yogurt: I found no measured or physical figure (ATK's recipes with Greek yogurt give none, and I could not read a Greek yogurt label); any label would be anchored to the same 170 g reference amount.

### shredded-cheddar

| Source                                                                      | As given                                                                  | g per US cup | Method                                                                                     |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -----------: | ------------------------------------------------------------------------------------------ |
| King Arthur Baking, Ingredient Weight Chart                                 | Cheese (grated cheddar, jack, mozzarella, or Swiss): 1 cup = 4 oz = 113 g |        113.0 | not stated (loosely filled)                                                                |
| America's Test Kitchen, recipe: North Carolina Cheese Biscuits              | 8 ounces (227 grams) ... shredded (2 cups)                                |        113.5 | shredded, loosely measured                                                                 |
| America's Test Kitchen, recipe: Crispy-Creamy Sheet-Pan Macaroni and Cheese | 8 ounces ... shredded (2 cups)                                            |        113.4 | shredded                                                                                   |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 263                      | 1 cup = 98 g (SD 11.4, n=20)                                              |         98.0 | shredded, spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| Label: Sargento Shredded Mild Cheddar, fine cut, 8 oz (brand site)          | 1/4 Cup (28g); 8 servings                                                 |        112.0 | not stated                                                                                 |

Method US recipes mean: Loosely filled, not packed; US recipes equate 4 oz of cheese with 1 cup shredded.

**Best estimate: 113 g per US cup (the 4-oz convention)**; why: King Arthur 113, ATK 113.4 (8 oz = 2 cups), Sargento's label 112 (28 g per 1/4 cup) all encode the 4-oz cup. HERR 41's lightly spooned cup was only 98 g (20 cups, SD 11.4), which shows how much loose shreds vary; recipes mean the 4-oz cup.

### water

| Source                                                         | As given                             | g per US cup | Method                   |
| -------------------------------------------------------------- | ------------------------------------ | -----------: | ------------------------ |
| King Arthur Baking, Ingredient Weight Chart                    | Water: 1 cup = 8 oz = 227 g          |        227.0 | liquid measure           |
| America's Test Kitchen, recipe: Foolproof Pie Dough            | 1/4 cup (59 grams)                   |        236.0 | liquid measure           |
| America's Test Kitchen, recipe: American Sandwich Bread        | 1/3 cup (2 2/3 ounces/75 grams)      |        225.0 | liquid measure           |
| NIST Chemistry WebBook, water (IAPWS-95), 0.101325 MPa         | 998.2072 kg/m3 at 20 C               |        236.2 | physical density at 20 C |
| NIST Chemistry WebBook, water (IAPWS-95), 0.101325 MPa         | 999.9749 kg/m3 at 4 C                |        236.6 | physical density at 4 C  |
| FAO/INFOODS Density DB v2.0 (2012), 'Water, liquid, 20 C' [TB] | 0.998 g/mL                           |        236.1 | physical density         |
| Erik Jacobsen, Notes on Flour Weights and Measures (2007)      | a cup of water is 8 ounces by weight |        226.8 | liquid measure           |

Method US recipes mean: Liquid measuring cup.

**Best estimate: 236 g per US cup (236.2 at 20 C, 236.6 at 4 C)**; why: NIST's IAPWS-95 densities give 236.16 g at 20 C and 236.58 g at 4 C; ATK's newer recipes use 236 (59 g per 1/4 cup). King Arthur (227), older ATK (225) and Jacobsen ("8 ounces") use the fluid-ounce-equals-ounce shortcut, 4% low.

### honey

| Source                                                                                                              | As given                                                                        | g per US cup | Method                                                                                   |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -----------: | ---------------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                                         | Honey: 1 tablespoon = 3/4 oz = 21 g                                             |        336.0 | not stated                                                                               |
| King Arthur Baking, recipe: 100% Whole Wheat Banana Bread                                                           | 1/4 cup (85g) honey                                                             |        340.0 | not stated                                                                               |
| King Arthur Baking, recipe: Honey-Oat Pain de Mie                                                                   | 3 tablespoons (64g) honey                                                       |        341.3 | not stated                                                                               |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 430                                                              | 1 cup = 325 g (SD 10.9, n=13)                                                   |        325.0 | glass measuring cup filled to the 1-cup mark at the meniscus (report method for liquids) |
| USDA FNS Food Buying Guide (2018), Section 6 Other Foods                                                            | Honey: 1 lb = 1.40 cups                                                         |        324.0 | not stated                                                                               |
| USDA FNS Food Buying Guide (2018), Section 6 Other Foods                                                            | Honey: 1 lb = 22.30 tablespoons                                                 |        325.4 | not stated                                                                               |
| FAO Agric. Services Bull. 124 (Krell 1996), Table 2.4 after White (1975a), with USDA Tech. Bull. 1261 mean moisture | specific gravity 1.4237 at 17.0% water, 1.4171 at 18.0%; US mean moisture 17.2% |        336.5 | physical density at 20 C                                                                 |
| National Honey Board, FAQ                                                                                           | 1 cup of honey weighs 12 ounces; a gallon about 12 pounds                       |        340.2 | not stated                                                                               |

Method US recipes mean: Liquid measure (often in a greased cup).

**Best estimate: 336 g per US cup**; why: honey at the US mean moisture of 17.2% (USDA Tech. Bull. 1261, 490 honeys) has specific gravity about 1.422 (White's table in FAO's bulletin), 336.5 g per cup; King Arthur's chart (21 g per Tbsp) gives 336, its recipes 340-341, and the National Honey Board says 12 oz (340 g). HERR 41's 325 (13 cups) and the Food Buying Guide's 324-325 (which reproduce it) are 3% low.

### maple-syrup

| Source                                                                                   | As given                                                              | g per US cup | Method                                        |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -----------: | --------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                              | Maple syrup: 1/2 cup = 5 1/2 oz = 156 g                               |        312.0 | not stated                                    |
| King Arthur Baking, recipe: Maple-Walnut Sticky Buns                                     | 1/2 cup (156g) maple syrup                                            |        312.0 | not stated                                    |
| King Arthur Baking, recipe: Classic 100% Whole Wheat Bread                               | 1/4 cup (85g) honey, molasses, or maple syrup                         |        340.0 | not stated                                    |
| NBS Circular C440 (1942) Table 117, sucrose solution at 66 Brix, 20 C                    | 5005.8 g per US gallon in vacuo; SG 20/4 = 1.32242                    |        312.9 | physical density at 20 C (sucrose equivalent) |
| NBS Circular C440 (1942) Table 117, sucrose solution at 67 Brix, 20 C                    | 5029.0 g per US gallon in vacuo; SG 20/4 = 1.32855                    |        314.3 | physical density at 20 C (sucrose equivalent) |
| NBS Circular C440 (1942) Table 117, sucrose solution at 68 Brix, 20 C                    | 5052.4 g per US gallon in vacuo; SG 20/4 = 1.33472                    |        315.8 | physical density at 20 C (sucrose equivalent) |
| NBS Circular C440 (1942) Table 117, sucrose solution at 69 Brix, 20 C                    | 5075.9 g per US gallon in vacuo; SG 20/4 = 1.34093                    |        317.2 | physical density at 20 C (sucrose equivalent) |
| USDA AMS, United States Standards for Grades of Maple Syrup (effective 2015-03-02)       | not less than 66 percent ... not more than 68.9 percent solids (Brix) |            - | grade limits                                  |
| CFIA, Canadian Grade Compendium Volume 7 - Maple Syrup (modified 2021-04-28)             | Canada Grade A: soluble solids 66% to 68.9% at 20 C                   |            - | grade limits                                  |
| USDA Agriculture Handbook 134, Maple Sirup Producers Manual (Willits & Hills, rev. 1976) | a gallon ... 67.5 Brix weighs 11.10 pounds (63.5 Brix: 10.90 lb)      |        314.7 | at 68 F                                       |
| USDA Agriculture Handbook 134, Maple Sirup Producers Manual (Willits & Hills, rev. 1976) | a gallon of standard-density sirup weighs 11 pounds                   |        311.8 | standard density                              |
| FAO/INFOODS Density DB v2.0 (2012), 'Syrup, maple' [USDA]                                | 1.3186907 g/mL (SG 1.3216)                                            |        312.0 | derived                                       |

Method US recipes mean: Liquid measure.

**Best estimate: 314 g per US cup**; why: US (USDA AMS 2015) and Canadian (CFIA Grade Compendium Vol. 7) grade standards both hold syrup between 66.0 and 68.9 Brix; sucrose solutions at those strengths weigh 312.9-317.1 g per cup (NBS Circular C440); USDA's Maple Sirup Producers Manual gives 11.10 lb per gallon at 67.5 Brix (314.7 g) and the trade rule of 11 lb per gallon (311.8 g, the old minimum-density test). King Arthur's chart and recipes say 312. FAO's 'USDA' entry (312.0) is USDA-derived. King Arthur's one-weight-for-three-syrups line (85 g per 1/4 cup) was discounted.

### molasses

| Source                                                                                               | As given                                                                                   | g per US cup | Method                                                                                   |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -----------: | ---------------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                          | Molasses: 1/4 cup = 3 oz = 85 g                                                            |        340.0 | not stated                                                                               |
| America's Test Kitchen, recipe: Molasses Spice Cookies with Orange Essence                           | 1/2 cup (6 ounces/170 grams)                                                               |        340.0 | not stated                                                                               |
| America's Test Kitchen, recipe: Chocolate Guinness Cake                                              | 1/3 cup (104 grams) molasses                                                               |        312.0 | not stated                                                                               |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 477                                               | 1 cup = 309 g (SD 11.3, n=25)                                                              |        309.0 | glass measuring cup filled to the 1-cup mark at the meniscus (report method for liquids) |
| NBS Circular C440 (1942) Table 117 with USDA AMS Standards for Grades of Sugarcane Molasses (1959)   | Grade A: not less than 79.0 Brix; 79 Brix = 5318.8 g per gallon in vacuo (SG 20/4 1.40509) |        332.4 | physical density at 20 C (sucrose equivalent)                                            |
| B&G Foods product technical data sheet, Grandma's Original Molasses, 1 gallon (effective 2019-09-23) | Density 11.7 lbs/gal; Brix 79 - 80                                                         |        331.7 | manufacturer specification                                                               |
| NBS Circular C440 (1942), worked example of weight per gallon of molasses                            | density 1.3986; 11.664 pounds per gallon in air                                            |        330.9 | picnometer at 20 C                                                                       |
| USDA FNS Food Buying Guide (2018), Section 6 Other Foods                                             | Syrups (cane, corn, maple, molasses): gallon about 183 oz = 16 cups                        |        324.2 | not stated                                                                               |

Method US recipes mean: Liquid measure.

**Best estimate: 332 g per US cup**; why: B&G Foods' specification for Grandma's Original Molasses gives 11.7 lb per gallon at 79-80 Brix, 331.7 g per cup; USDA's grade standard requires at least 79.0 Brix for Grade A cane molasses, and sucrose-equivalent solutions at 79-80 Brix weigh 332.4-334.0 g (NBS C440); NBS's worked example (density 1.3986) gives 330.9. King Arthur and ATK's older recipes use 340 (12 oz, probably the honey convention); ATK's newer recipe 312, HERR 41 309 (25 cups) and the Food Buying Guide's generic 324 are low.

### cocoa-powder

| Source                                                                                       | As given                                         | g per US cup | Method                                                                           |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------ | -----------: | -------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                  | Cocoa (unsweetened): 1/2 cup = 1 1/2 oz = 42 g   |         84.0 | not stated                                                                       |
| America's Test Kitchen, Baking Conversion Chart                                              | 1 cup = 3 oz / 85g                               |         85.0 | not stated                                                                       |
| America's Test Kitchen, recipe: No-Bake Peanut Butter-Chocolate Cookies with Oats (natural)  | 1/4 cup (3/4 ounce/21 grams), natural            |         84.0 | not stated                                                                       |
| America's Test Kitchen, recipe: Chocolate Guinness Cake (dutch-process)                      | 1/2 cup (1 1/2 ounces/43 grams), Dutch-processed |         86.0 | not stated                                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 307                                       | 1 cup = 86 g (SD 8.9, n=14)                      |         86.0 | spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| Milk Street, Baking Mix-In Weights (Mar-Apr 2019)                                            | Cocoa powder 85 g per cup                        |         85.0 | measured, averaged                                                               |
| Label: Hershey's Cocoa, natural unsweetened, 8 oz (brand site)                               | 1 tbsp (5g); about 45 servings                   |         80.0 | not stated                                                                       |
| Label: Hershey's Cocoa Special Dark (Dutch-process blend), 8 oz (brand site) (dutch-process) | 1 tbsp (5g)                                      |         80.0 | not stated                                                                       |

Method US recipes mean: Spooned and leveled (sift first only if the recipe says sifted).

**Best estimate: 85 g per US cup, natural or Dutch-process alike**; why: HERR 41 86 (14 cups), ATK 85 (chart), 84 natural and 86 Dutch (recipes), King Arthur 84, Milk Street 85. Hershey's labels (5 g per Tbsp = 80, for natural and Special Dark alike) are rounded to the gram on a 5-g measure.

### rolled-oats

| Source                                                                                         | As given                                                       | g per US cup | Method                                                                                              |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -----------: | --------------------------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                    | Oats (old-fashioned or quick-cooking): 1 cup = 3 1/8 oz = 89 g |         89.0 | not stated                                                                                          |
| King Arthur Baking, Ingredient Weight Chart                                                    | Oats (King Arthur Rolled): 1 cup = 4 oz = 113 g                |        113.0 | not stated                                                                                          |
| King Arthur Baking, recipe: Honey-Oat Pain de Mie                                              | 1 cup (89g) old-fashioned rolled oats                          |         89.0 | not stated                                                                                          |
| America's Test Kitchen, recipe: Classic Chewy Oatmeal Cookies                                  | 3 cups (9 ounces/255 grams)                                    |         85.0 | not stated                                                                                          |
| America's Test Kitchen, recipe: No-Bake Peanut Butter-Chocolate Cookies with Oats (quick oats) | 2 1/2 cups (8 1/2 ounces/241 grams) quick oats                 |         96.4 | not stated                                                                                          |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 495                                         | 1 cup = 75 g (SD 5.5, n=80)                                    |         75.0 | regular, uncooked; spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 492 (quick oats)                            | 1 cup = 73 g (SD 4.7, n=87)                                    |         73.0 | quick, uncooked; spooned lightly into a rim-full cup, leveled with metal spatula (report default)   |
| USDA FNS Food Buying Guide (2018), Section 4 Grains, Conversions                               | cups of regular rolled oats x 81 grams                         |         81.0 | not stated                                                                                          |
| FAO/INFOODS Density DB v2.0 (2012), 'Oats, rolled' [ASI]                                       | 0.30-0.38 g/mL                                                 |         80.4 | industrial bulk density                                                                             |
| Label: Bob's Red Mill Old Fashioned Regular Rolled Oats (brand site)                           | 1/2 cup (49g)                                                  |         98.0 | not stated                                                                                          |
| Label: Bob's Red Mill Quick Cooking Rolled Oats (brand site) (quick oats)                      | 1/2 cup (45g)                                                  |         90.0 | not stated                                                                                          |

Method US recipes mean: Poured or spooned in and leveled.

**Best estimate: 85 g per US cup old-fashioned; quick oats about 90 g per US cup**; why: old-fashioned: ATK 85, King Arthur 89, Bob's Red Mill label 98, HERR 41 75 (80 cups, 1960s oats); USDA's Food Buying Guide factor 81 is derived. The spread (75-98) is real: oats vary by flake thickness and brand. Quick: ATK 96, Bob's Red Mill 90, King Arthur 89, HERR 73.

### white-rice

| Source                                                      | As given                                          | g per US cup | Method                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------- | -----------: | ------------------------------------------------------------------------------------------------------ |
| King Arthur Baking, Ingredient Weight Chart                 | Rice (long grain, dry): 1/2 cup = 3 1/2 oz = 99 g |        198.0 | not stated                                                                                             |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 685      | 1 cup = 192 g (SD 11.2, n=28)                     |        192.0 | long grain, uncooked; spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| FAO/INFOODS Density DB v2.0 (2012), 'Rice, white, raw' [RC] | 0.82 g/mL                                         |        194.0 | not stated (Charrondiere)                                                                              |
| FAO/INFOODS Density DB v2.0 (2012), 'Rice' [ASI]            | 0.72 g/mL                                         |        170.3 | industrial bulk density                                                                                |
| FAO/INFOODS Density DB v2.0 (2012), 'Rice, raw' [KEN]       | 0.85 g/mL                                         |        201.1 | not stated (Kenya project)                                                                             |

Method US recipes mean: Poured in and leveled.

**Best estimate: 195 g per US cup (long-grain, uncooked)**; why: HERR 41 192 (28 cups), King Arthur 198, Charrondiere's 0.82 g/mL (194). The ASI 0.72 g/mL industrial figure was discounted. ATK's rice recipes I read give no weights.

### cornstarch

| Source                                                                                     | As given                          | g per US cup | Method                                                                           |
| ------------------------------------------------------------------------------------------ | --------------------------------- | -----------: | -------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                | Cornstarch: 1/4 cup = 1 oz = 28 g |        112.0 | not stated                                                                       |
| America's Test Kitchen, recipe: Classic Vanilla Pudding                                    | 1/4 cup (1 ounce/28 grams)        |        112.0 | not stated                                                                       |
| America's Test Kitchen, recipe: Gingery Carrot Cake with Pistachios                        | 1/3 cup (1 1/3 ounces/38 grams)   |        114.0 | not stated                                                                       |
| America's Test Kitchen, recipe: Chocolate Fudge Cake with Ganache and Miso-Caramel Drizzle | 1/3 cup (1 3/4 ounces/50 grams)   |        150.0 | not stated                                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 341                                     | 1 cup = 125 g (SD 4.7, n=15)      |        125.0 | spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| Milk Street, 'Flour Power' (2017)                                                          | Cornstarch 133 grams per cup      |        133.0 | scoop gently, sweep level                                                        |
| FAO/INFOODS Density DB v2.0 (2012), 'Corn/maize starch, loosely packed' [TB]               | 0.54 g/mL                         |        127.8 | loosely packed                                                                   |
| FAO/INFOODS Density DB v2.0 (2012), 'Corn/maize, starch, tightly packed' [TB]              | 0.63 g/mL                         |        149.1 | tightly packed                                                                   |
| Label: Bob's Red Mill Cornstarch (brand site)                                              | 1 Tbsp (8g)                       |        128.0 | not stated                                                                       |

Method US recipes mean: Spooned and leveled.

**Best estimate: 125 g per US cup**; why: HERR 41 125 (15 cups), Bob's Red Mill label 128 (8 g per Tbsp), hypertextbook's loosely packed 0.54 g/mL (127.8). King Arthur and ATK use 1 oz per 1/4 cup (112-114), Milk Street 133; one ATK recipe's 150 contradicts ATK's own other recipes. Tightly packed starch is 149 (0.63 g/mL).

### baking-soda

| Source                                                                                                    | As given                                  | g per US cup | Method                           |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -----------: | -------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                               | Baking soda: 1/2 teaspoon = 1/10 oz = 3 g |        288.0 | not stated                       |
| Rose Levy Beranbaum, realbakingwithrose.com: The UK Cake Bible conversions (2012)                         | 1 teaspoon/5 grams                        |        240.0 | weighed (lab scale)              |
| Church & Dwight (Arm & Hammer) specification, Sodium Bicarbonate USP No. 1 Powdered (reviewed 2026-01-20) | Bulk Density 63 lb/ft3, 1.009 g/cc        |        238.7 | bulk density (method not stated) |
| Label: Clabber Girl Baking Soda 5 lb (brand site)                                                         | 1/8 tsp (0.6g); about 3780 servings       |        230.4 | not stated                       |
| Label: Bob's Red Mill Baking Soda (brand site)                                                            | 1/4 tsp (1g)                              |        192.0 | not stated                       |
| FAO/INFOODS Density DB v2.0 (2012), 'Sodium bicarbonate' [TB]                                             | 2.2 g/mL                                  |            - | crystal density                  |

Method US recipes mean: Measuring spoon dipped and leveled with a straight edge (Betty Crocker 1948; Beranbaum dips and sweeps).

**Best estimate: 238 g per US cup (about 5.0 g per teaspoon)**; why: Beranbaum's lab-scale weighings give 5 g per teaspoon (240) and Church & Dwight's bulk density for its USP No. 1 powder, 1.009 g/mL, gives 238.7. Clabber Girl's label (0.6 g per 1/8 tsp = 230) equals the reference amount. Bob's Red Mill (1 g per 1/4 tsp) and King Arthur (3 g per 1/2 tsp) are too coarse to use. FAO's 2.2 g/mL is the crystal density.

### baking-powder

| Source                                                                                     | As given                                     | g per US cup | Method                                                                           |
| ------------------------------------------------------------------------------------------ | -------------------------------------------- | -----------: | -------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                | Baking powder: 1 teaspoon = 1/8 oz = 4 g     |        192.0 | not stated                                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 63                                      | SAS-phosphate: 1 cup = 177 g (SD 4.3, n=27)  |        177.0 | spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| Rose Levy Beranbaum, realbakingwithrose.com: Baking Basics Production Phase 6 (2017-03-01) | average weight of 4.5 grams per teaspoon     |        216.0 | dip and sweep (about 1 g more than sifted into the spoon)                        |
| Label: Clabber Girl Baking Powder (double-acting; brand site)                              | 1/8 tsp (0.6g); about 383 servings in 8.1 oz |        230.4 | not stated                                                                       |
| Label: Bob's Red Mill Baking Powder (brand site)                                           | 1/4 tsp (1g)                                 |        192.0 | not stated                                                                       |
| FAO/INFOODS Density DB v2.0 (2012), 'Baking powder' [ASI]                                  | 0.9 g/mL                                     |        212.9 | industrial bulk density                                                          |

Method US recipes mean: Measuring spoon dipped and leveled (stir the can first).

**Best estimate: 192 g per US cup (about 4.0 g per teaspoon), double-acting**; why: King Arthur 4 g per teaspoon, Bob's Red Mill 1 g per 1/4 tsp, HERR 41's double-acting (SAS-phosphate) powder 177 g per cup (27 cups, spooned into a cup) and Beranbaum's 4.5 g per teaspoon (dip and sweep, which she finds 1 g heavier than sifted) bracket about 4 g. HERR shows the type matters: phosphate powder 217, tartrate 181. Clabber Girl's 0.6 g per 1/8 tsp equals the reference amount.

### table-salt

| Source                                                                                     | As given                                                    | g per US cup | Method                                                                           |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | -----------: | -------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                | Salt (table): 1 tablespoon = 2/3 oz = 18 g                  |        288.0 | not stated                                                                       |
| King Arthur Baking, Ingredient Weight Chart (kosher)                                       | Salt (Kosher, Diamond Crystal): 1 tablespoon = 1/4 oz = 8 g |        128.0 | not stated                                                                       |
| King Arthur Baking, Ingredient Weight Chart (kosher)                                       | Salt (Kosher, Morton's): 1 tablespoon = 1/2 oz = 16 g       |        256.0 | not stated                                                                       |
| King Arthur Baking, recipe: Classic Sandwich Bread                                         | 1 1/4 teaspoons (8g) table salt                             |        307.2 | not stated                                                                       |
| King Arthur Baking, recipe: Honey-Oat Pain de Mie                                          | 1 1/2 teaspoons (9g) table salt                             |        288.0 | not stated                                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 711                                     | 1 cup = 292 g (SD 3.0, n=27)                                |        292.0 | spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| Rose Levy Beranbaum, realbakingwithrose.com: Baking Basics Production Phase 6 (2017-03-01) | a teaspoon of salt which is almost always exactly 6 grams   |        288.0 | spoon measure                                                                    |
| Label: Morton Table Salt (brand site)                                                      | 1/4 tsp (1.5g); about 491 servings                          |        288.0 | not stated                                                                       |
| Label: Morton Coarse Kosher Salt (brand site) (kosher)                                     | 1/4 tsp (1.2g); about 1133 servings                         |        230.4 | not stated                                                                       |
| FAO/INFOODS Density DB v2.0 (2012), 'Salt, table' [S&W]                                    | 1.217 g/mL                                                  |        287.9 | derived                                                                          |
| FAO/INFOODS Density DB v2.0 (2012), 'Salt, fine table' [ASI]                               | 1.38 g/mL                                                   |        326.5 | industrial bulk density                                                          |

Method US recipes mean: Measuring spoon dipped and leveled.

**Best estimate: 288 g per US cup (6.0 g per teaspoon). Kosher salts differ: Diamond Crystal about 128, Morton coarse kosher 230-256**; why: King Arthur 18 g per Tbsp, Beranbaum "almost always exactly 6 grams" per teaspoon, Morton's label 1.5 g per 1/4 tsp all give 288; HERR 41 measured 292 (27 cups). Kosher: King Arthur gives Diamond Crystal 8 g and Morton 16 g per tablespoon (128, 256); Morton's coarse kosher label says 1.2 g per 1/4 tsp (230).

### active-dry-yeast

| Source                                                   | As given                                                    | g per US cup | Method                                                                           |
| -------------------------------------------------------- | ----------------------------------------------------------- | -----------: | -------------------------------------------------------------------------------- |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 822   | 1 cup = 142 g (SD 4.9, n=22)                                |        142.0 | spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| USDA FNS Food Buying Guide (2018), Section 6 Other Foods | Yeast, active dry: 1 lb = 3.10 cups                         |        146.3 | not stated                                                                       |
| Red Star Yeast, Active Dry Yeast product page            | 0.25 ounce or 7 gram packet = approximately 2 1/4 teaspoons |        149.3 | spoon measure                                                                    |
| Fleischmann's Yeast, FAQ                                 | 1/4-ounce packet = about 2-1/4 teaspoons                    |        151.2 | spoon measure                                                                    |
| Label: Bob's Red Mill Active Dry Yeast (brand site)      | 1/4 tsp (0.8g)                                              |        153.6 | not stated                                                                       |
| King Arthur Baking, Ingredient Weight Chart (instant)    | Yeast (instant): 2 1/4 teaspoons = 1/4 oz = 7 g             |        149.3 | not stated                                                                       |
| King Arthur Baking, Ingredient Weight Chart (instant)    | Yeast (instant): 1 tablespoon = 1/3 oz = 9 g                |        144.0 | not stated                                                                       |
| FAO/INFOODS Density DB v2.0 (2012), 'Yeast' [ASI]        | 0.95 g/mL                                                   |        224.8 | industrial bulk density                                                          |

Method US recipes mean: Measuring spoon; usually counted in packets.

**Best estimate: 149 g per US cup (about 3.1 g per teaspoon). Instant: about 144-149 g**; why: both makers equate a 1/4-oz (7 g) packet with about 2 1/4 teaspoons (149-151 g per cup); USDA's Food Buying Guide 146; Bob's Red Mill label 0.8 g per 1/4 tsp (154); HERR 41 measured 142 spooned into a cup (22 cups). Instant: King Arthur 7 g per 2 1/4 tsp (149) and 9 g per tablespoon (144).

### chocolate-chips

| Source                                                                     | As given                                | g per US cup | Method                                                                           |
| -------------------------------------------------------------------------- | --------------------------------------- | -----------: | -------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                | Chocolate Chips: 1 cup = 6 oz = 170 g   |        170.0 | not stated                                                                       |
| King Arthur Baking, recipe: Classic Chocolate Chip Cookies                 | 2 cups (340g) semisweet chocolate chips |        170.0 | not stated                                                                       |
| America's Test Kitchen, recipe: Perfect Chocolate Chip Cookies             | 1 1/4 cups (213 grams)                  |        170.4 | not stated                                                                       |
| America's Test Kitchen, recipe: Levain-Style Chocolate Chip Walnut Cookies | 2 cups (12 ounces/340 grams)            |        170.0 | not stated                                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 302                     | 1 cup = 167 g (SD 2.9, n=12)            |        167.0 | spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| Milk Street, Baking Mix-In Weights (Mar-Apr 2019)                          | Chocolate chips 164 g per cup           |        164.0 | measured, averaged                                                               |
| Label: Hershey's Semi-Sweet Chocolate Chips, 12 oz (brand site)            | 1 tbsp. (15g); about 23 servings        |        240.0 | not stated                                                                       |

Method US recipes mean: Poured in and leveled.

**Best estimate: 168 g per US cup (semisweet)**; why: HERR 41 167 (12 cups), King Arthur 170, ATK 170, Milk Street 164. Hershey's label (15 g per tablespoon = 240 g per cup) equals the 15-g reference amount for baking candies and is 40% above every measured cup.

### chopped-walnuts

| Source                                                                                                                 | As given                                                       | g per US cup | Method                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -----------: | ----------------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                                            | Walnuts (chopped): 1 cup = 4 oz = 113 g                        |        113.0 | chopped, then measured                                                                    |
| King Arthur Baking, Ingredient Weight Chart (whole walnuts)                                                            | Walnuts (whole): 1/2 cup = 2 1/4 oz = 64 g                     |        128.0 | whole                                                                                     |
| King Arthur Baking, recipe: Maple-Walnut Sticky Buns                                                                   | 1 cup (113g) diced toasted walnuts                             |        113.0 | diced, then measured                                                                      |
| America's Test Kitchen, recipe: Perfect Chocolate Chip Cookies                                                         | 3/4 cup (89 grams) chopped pecans or walnuts                   |        118.7 | chopped, then measured                                                                    |
| America's Test Kitchen, recipe: Ultimate Banana Bread                                                                  | 1/2 cup (53 grams) walnuts, toasted and coarsely chopped       |        106.0 | measured whole, then chopped                                                              |
| America's Test Kitchen, recipe: Levain-Style Chocolate Chip Walnut Cookies (whole halves)                              | 2 cups (210 grams) walnut halves                               |        105.0 | whole halves                                                                              |
| America's Test Kitchen, recipe: Maple-Pecan Protein Granola                                                            | 1 cup (5 ounces) pecans or walnuts, toasted and chopped coarse |        141.7 | measured whole?, then chopped                                                             |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 808                                                                 | 1 cup = 120 g (SD 5.2, n=13)                                   |        120.0 | chopped; spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| Milk Street, Baking Mix-In Weights (Mar-Apr 2019)                                                                      | Walnuts, chopped 112 g per cup                                 |        112.0 | measured, averaged                                                                        |
| Rose Levy Beranbaum, realbakingwithrose.com: Carrot Cake (Cake Bible 35th anniversary ed., 2025-05-03) (whole walnuts) | 100 grams/1 cup lightly toasted walnuts ... coarsely chopped   |        100.0 | measured whole, then chopped                                                              |

Method US recipes mean: "1 cup chopped walnuts" means chop, then measure; "1 cup walnuts, chopped" means measure whole, then chop (Williams-Sonoma). A cup of chopped nuts holds more than a cup of whole nuts.

**Best estimate: 116 g per US cup (chopped, then measured)**; why: HERR 41 120 (13 cups), ATK 118.7, King Arthur 113, Milk Street 112. Measured whole: ATK 105-106, Beranbaum 100, King Arthur 128. ATK's 5 oz per cup in one 2025 recipe is an outlier.

### chopped-pecans

| Source                                                           | As given                                 | g per US cup | Method                                                                                    |
| ---------------------------------------------------------------- | ---------------------------------------- | -----------: | ----------------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                      | Pecans (diced): 1/2 cup = 2 oz = 57 g    |        114.0 | diced, then measured                                                                      |
| King Arthur Baking, Ingredient Weight Chart (whole pecans)       | Pecans (whole): 1 cup = 3 3/4 oz = 105 g |        105.0 | whole                                                                                     |
| America's Test Kitchen, recipe: Honey-Pecan Granola              | 2 cups (8 ounces) pecans, chopped coarse |        113.4 | measured, then chopped (ATK wording)                                                      |
| America's Test Kitchen, recipe: Perfect Pecan Pie (whole pecans) | 2 cups whole pecans (8 ounces/227 grams) |        113.5 | whole, then chopped                                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 581           | 1 cup = 108 g (SD 4.9, n=20)             |        108.0 | chopped; spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| Milk Street, Baking Mix-In Weights (Mar-Apr 2019)                | Pecans, chopped 114 g per cup            |        114.0 | measured, averaged                                                                        |

Method US recipes mean: As for walnuts.

**Best estimate: 112 g per US cup (chopped, then measured)**; why: Milk Street 114, King Arthur 114 (diced), ATK 113.4 (8 oz in 2 cups, chopped coarse), HERR 41 108 (20 cups). Whole pecans: King Arthur 105, ATK 113.5, Milk Street 113.

### peanut-butter

| Source                                                      | As given                                        | g per US cup | Method                                                                           |
| ----------------------------------------------------------- | ----------------------------------------------- | -----------: | -------------------------------------------------------------------------------- |
| King Arthur Baking, Ingredient Weight Chart                 | Peanut butter: 1/2 cup = 4 3/4 oz = 135 g       |        270.0 | not stated                                                                       |
| America's Test Kitchen, recipe: Chewy Peanut Butter Cookies | 1 cup (9 ounces/255 grams) creamy peanut butter |        255.0 | not stated                                                                       |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 557      | 1 cup = 251 g (SD 14.4, n=35)                   |        251.0 | spooned lightly into a rim-full cup, leveled with metal spatula (report default) |
| Label: Jif Creamy Peanut Butter (brand site)                | 2 Tbsp (33g)                                    |        264.0 | not stated                                                                       |

Method US recipes mean: Packed into a dry cup and leveled.

**Best estimate: 258 g per US cup (creamy)**; why: HERR 41 251 (35 cups, SD 14.4), ATK 255, Jif's label 264 (33 g per 2 Tbsp, a measured figure since the reference amount is in tablespoons), King Arthur 270. Median of the four is 259.

### eggs

| Source                                                                    | As given                                                     | g per US cup | Method                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ | -----------: | ------------------------------------------------- |
| Azahra, Hintono & Pramono (2022), J. Teknologi Pangan 6(1):13-17, Table 2 | pasteurized liquid whole egg, 0% sugar: 1.027 +/- 0.002 g/mL |        243.0 | pycnometer                                        |
| Azahra et al. (2022), citing Atilgan & Unluturk (2008)                    | liquid whole egg 1.033 g/mL                                  |        244.4 | not stated                                        |
| USDA HERR 41 (ARS 61-6, 1969; reissued 1977), item 360                    | 1 cup = 251 g (SD 6.0, n=8)                                  |        251.0 | large eggs, shelled, whole (not stated as beaten) |
| American Egg Board, as reproduced by What's Cooking America               | Large: 5 whole eggs per cup; 1 whole egg = 3 tablespoons     |        250.0 | count per cup                                     |

Method US recipes mean: Beaten whole egg measured as a liquid.

**Best estimate: 243 g per US cup**; why: pasteurized liquid whole egg measured 1.027 g/mL by pycnometer (Azahra et al. 2022), 243.0 g; the 2008 study they cite gives 1.033 (244.4). HERR 41's 251 g for whole shelled eggs (8 cups) and the American Egg Board's 5 large eggs per cup (about 250 g) are 3% higher, probably because unbeaten eggs mound above the line (my inference). Beating adds a little foam, which would only lower the figure.

## Counted units

### unit: stick of butter (g per stick)

| Source                                                                  | As given                                        | grams per unit | Method                    |
| ----------------------------------------------------------------------- | ----------------------------------------------- | -------------: | ------------------------- |
| America's Test Kitchen, Baking Conversion Chart                         | 8 tablespoons (1 stick, or ½ cup) = 4 oz / 113g |          113.0 | package                   |
| King Arthur Baking, Ingredient Weight Chart                             | 8 tablespoons (1/2 cup) = 4 oz = 113 g          |          113.0 | package                   |
| Land O Lakes salted butter (brand site)                                 | About 32 [1-Tbsp servings] per lb               |          113.4 | 1 lb = 4 sticks of 8 Tbsp |
| Rose Levy Beranbaum, realbakingwithrose.com: Weigh to Bake (2005-10-27) | around 3.87 ounces instead of 4                 |          109.7 | weighed                   |

**Best estimate: 113 g (1/4 lb = 113.4 g). ATK and King Arthur state 4 oz = 113 g; Land O Lakes packs 32 tablespoons to the pound. Beranbaum found retail sticks weighing about 3.87 oz (110 g) in 2005, so packages can run a little light.**

### unit: large egg out of shell (g per egg)

| Source                                                                                               | As given                                                                                | grams per unit | Method                      |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------: | --------------------------- |
| King Arthur Baking, Ingredient Weight Chart                                                          | Egg (fresh) 1 large = 1 3/4 oz = 50 g                                                   |           50.0 | weighed                     |
| Rose Levy Beranbaum, realbakingwithrose.com: Chocolate Layer Cake (2020-05-30)                       | the standard 50 grams/1 large egg                                                       |           50.0 | weighed                     |
| 21 CFR 101.12(b), Table 2 (reference amounts)                                                        | Eggs (all sizes): 50 g; label '1 large'                                                 |           50.0 | regulatory reference amount |
| USDA AMS 56, Standards, Grades, and Weight Classes for Shell Eggs (2000), §56.218 Table I (in-shell) | Large: minimum 24 oz per dozen (in shell); individual eggs at a rate of 23 oz per dozen |           56.7 | in shell (weight class)     |
| Rose Levy Beranbaum, realbakingwithrose.com: Weigh to Bake (2005-10-27) (in-shell)                   | large egg in the shell weighed the standard 2 ounces or 56 grams                        |           56.0 | weighed in shell            |

**Best estimate: 50 g. King Arthur and Beranbaum ("the standard 50 grams/1 large egg") agree, and 50 g is the FDA reference amount for an egg. USDA's weight class for Large is at least 24 oz per dozen in the shell (56.7 g each on average), which Beranbaum also cites (2 oz, 56 g in shell); 50 g out of shell implies a shell and membrane share of about 12%, which I did not confirm in a source.**

### unit: packet of active dry yeast (g per packet)

| Source                                                   | As given                                            | grams per unit | Method        |
| -------------------------------------------------------- | --------------------------------------------------- | -------------: | ------------- |
| Red Star Yeast, Active Dry Yeast product page            | 0.25 ounce or 7 gram; approximately 2 1/4 teaspoons |            7.0 | packet        |
| Fleischmann's Yeast, FAQ                                 | ¼-ounce packet; about 2-¼ teaspoons                 |            7.1 | packet        |
| USDA FNS Food Buying Guide (2018), Section 6 Other Foods | 1 package (1/4 oz) = about 1 tablespoon             |            7.1 | packet        |
| King Arthur Baking, Ingredient Weight Chart (instant)    | Yeast (instant) 2 1/4 teaspoons = 1/4 oz = 7 g      |            7.0 | spoon measure |

**Best estimate: 7 g (1/4 oz = 7.09 g), about 2 1/4 teaspoons. Red Star ("0.25 ounce or 7 gram ... approximately 2 1/4 teaspoons") and Fleischmann's ("About 2-1/4 teaspoons") agree; King Arthur gives instant yeast 2 1/4 tsp = 7 g. USDA's Food Buying Guide says a 1/4-oz package is "about 1 tablespoon", which conflicts with both makers.**

## What surprised me

1. **King Arthur's liquids.** Every cup-measured liquid in KA's chart is 8 oz = 227 g. Water is 236 g, milk 244 g, so KA's
   cup of milk is 7% light; its vegetable oil (198 g, 7 oz) is 9% below the oil's physical weight (218 g).
2. **Measured cups of oil and syrup run low everywhere.** HERR 41 (oil 209, honey 325, molasses 309, whipping cream 232),
   ATK (oil 210, molasses 312) and Milk Street (oil 206) all fall 1-7% below what density predicts (oil about 4%, honey 3%,
   molasses 7%), while HERR's milk is close (241 against 243.4). Viscous liquids that cling to the cup or trap air are probably being under-measured (my
   inference; none of the sources says so). Any cup weight built on HERR 41's measured syrups or oil would understate them.
3. **HERR 41 shows how much method matters, with large samples.** All-purpose flour: dipped 143 g (300 cups), spooned 126 g
   (510), sifted 116 g (500). Cake flour 119 / 111 / 99 (300 each). Bread flour 136 / 123 / 117. A single USDA number per
   flour hides which method it is: 125 g (the Food Buying Guide's factor) is the spooned cup, which suits most US recipes but
   is 12% light for an ATK recipe (142 g dipped).
4. **HERR 41's shredded cheddar is 98 g, not 113.** Lightly spooned shreds weigh 13% less than the 4-oz cup US recipes assume.
5. **Brown sugar's spread.** HERR's 118 packed cups had an SD of 22.5 g (11%), several times any other dry ingredient.
6. **Gold Medal contradicts itself**: its product page says 3 1/3 cups per pound (136 g per cup) while the same page's label
   says 1/4 cup = 30 g (120 g per cup).
7. **Measuring cups are not standard**: Beranbaum's team got 182, 201 and 212 g of sugar from three retail cups (-10% to +6%).
8. **USDA's Food Buying Guide says a 1/4-oz yeast package is "about 1 tablespoon"**; both yeast makers say 2 1/4 teaspoons.
9. **ATK disagrees with itself**: molasses 340 vs 312 g per cup, cornstarch 112-114 vs 150, chopped pecans or walnuts 113-119
   vs 142, water 225 vs 236, milk 227 vs 246 (older recipes treat fluid ounces as ounces).
10. **Baking powder type matters**: HERR 41 found phosphate powder 217 g per cup, double-acting SAS-phosphate 177, tartrate 181.
11. **Eggs measured by the cup come out heavier than liquid egg**: HERR's whole eggs (251 g per cup) exceed the measured
    density of liquid whole egg (1.027-1.033 g/mL, 243-244 g), presumably because unbeaten eggs mound above the line.
12. **FAO's density database mixes physical, bulk, crystal and USDA-derived values without fill methods**, so it is useful for
    liquids and nearly useless for powders.

## Where a USDA SR Legacy cup weight might mislead a US baker (from what I found; SR itself not checked here)

- If an SR cup weight for oil, honey, molasses or cream comes from HERR 41's measured cups, it is 1-7% below the physical value
  (oil 209 vs 218, honey 325 vs 336, molasses 309 vs about 332, whipping cream 232 vs 235-238).
- SR's flour cups should be checked against HERR's method rows: the spooned row (AP 126, bread 123, cake 111, whole wheat 120)
  suits most US recipes; a dipped row (AP 143, bread 136, cake 119) would be 7-14% heavy for them, and a spooned figure is
  12% light for ATK recipes, which dip.
- Shredded cheddar from HERR (98 g) would be 13% light against the 4-oz cup recipes assume; rolled oats from HERR (75 g) are
  lighter than today's 85-98 g; HERR's whole eggs (251 g per cup) are about 3% heavy for beaten eggs.
- Brown sugar's packed cup varies by about 11% between bakers whatever figure is chosen.
