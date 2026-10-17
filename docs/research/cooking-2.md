# Cooking 2: each ingredient's cup, weighed across sources

2026-10-16. Sean asked for Cooking's figures to be decided by weighing several sources, "our best prediction of what the most accurate is", cross-referenced and validated, cited with how each was reached, and the sources shown on the About page (the sixty-fourth pass in `findings-0-first-pass.md`). He then asked that the logic be sound enough to validate against and to re-open when a visitor reports a different weight, and brought two outside suggestions to weigh (below). This supersedes `cooking-1.md`'s figures, USDA FoodData Central's SR Legacy portions alone, which stay there as their record. The code is `packages/core/src/units/ingredients.ts`, written from `cooking-2/figures.py`; core's test recomputes every figure by the rule below.

## How a figure is decided

The standing rule, for these 34 ingredients and every one added or re-opened later.

1. **The cup recipes mean.** Each figure is for a US cup (236.5882365 mL) filled the way a US recipe means it, as the sources themselves say: flours, sugars, and powders spooned in and leveled, unsifted; brown sugar, shortening, and peanut butter packed; butter by the stick; cheese loosely filled, at the 4 oz a cup recipes count; nuts chopped, then measured; liquids poured to the line. Another method (dipped and swept, sifted) is recorded, and named on the About page where it matters, never mixed in.
2. **Which figures count.** A figure counts when its source weighed a cup itself, by that method, of that food, and it was read on its page; each source once (its chart where it has one, else the middle of its figures). Counted: USDA's measured cups (1969); USDA's lab samples (Foundation Foods); test kitchens and cooks who weigh; makers' own measures of their products; USDA's Food Buying Guide's yields. Recorded but not counted, each with its reason (`cooking-2/sources.md`):
   - **another method**: America's Test Kitchen dips and sweeps its dry ingredients, and USDA's 1969 cups were spooned unless the report names another way. For free-flowing pieces (granulated sugar, salt, yeast, rice, oats, chips, chopped nuts) dipped and spooned count as one;
   - **labels**: their grams are rounded on a serving of a few grams, some fixed by the FDA's reference amounts, on the FDA's label measures (a 240 mL cup);
   - **compilations and repeats**: SR Legacy (its cups mostly USDA's older weighings, their methods unstated), FNDDS, Milk Street's "Flour Power" table (an average of published charts), database rows taken from web pages, and the Food Buying Guide where it repeats SR Legacy or USDA's 1969 cups;
   - **a density measured for food tables**, for a powder, whose fill is not stated (a flour measured in France weighs 158 g a cup, packed);
   - **another food or form** (almond meal, kosher salt, walnut pieces), **a figure not shown to be weighed**, and **one that could not be read**.
3. **The figure is their median**, rounded to the gram, a half to the even gram (as ISO 80000-1 rounds); a source's range counts at its middle. No one source decides, and each kitchen counts once: the sources differ from one another by more than any one source's cups vary.
4. **With fewer than three, USDA's measured cups decide** where they weighed it, the one source that says how many cups it weighed and how much they varied; otherwise the median of what there is. Six figures rest on so few, the first to weigh again (below).
5. **A liquid by its density** times the cup, from physical references: NIST for water, the Codex standards for oils, dairy science for milk and cream, honey's density by its water, sugar-solution tables at the grade standards' Brix for maple syrup and molasses, a measured density of liquid egg. Each at the condition it is used: milk and cream, used cold, the middle of cold and room temperature; honey at the US average water; maple syrup at about 67 Brix. Cups filled by hand to the line weigh 1 to 7% less (a short fill, the meniscus, what clings): recorded, never setting a figure.
6. **The spread** is the lowest and highest figure counted.
7. **Checked, and tested.** Every figure counted was read on its page, by a third reviewer (`cooking-2/check.md`) or, for six found later, by us. Core's test recomputes each figure from its sources by this rule (`cupFigure`), so a figure cannot drift from them.
8. **Checked against the anchor.** Where USDA's measured cups weighed the cup, the figure must lie within two of the standard deviations USDA reports for its own cups, or the difference is named and explained (below). Core's test holds every figure to it, so a new source cannot pull a figure past USDA's cups unnoticed.

## The figures

Grams in one US cup, filled as the second column says; how the figure was reached; the spread of what counted; SR Legacy's figure, which Cooking used before, where it differs; and the figure the first reconciliation gave the same day, before the rule was written down, where it differs.

| Ingredient        | Filled                                         | g       | Reached                  | Spread     | SR Legacy | First |
| ----------------- | ---------------------------------------------- | ------- | ------------------------ | ---------- | --------- | ----- |
| all-purpose flour | spooned and leveled                            | **127** | median of 6              | 120 to 136 | 125       | 125   |
| bread flour       | spooned and leveled                            | **123** | median of 5              | 118 to 136 | 137       |       |
| whole wheat flour | stirred, spooned, and leveled                  | **120** | USDA's cups, 2 weighings | 113 to 120 |           |       |
| cake flour        | spooned and leveled, unsifted                  | **111** | USDA's cups, 2 weighings | 111 to 113 | 137       | 112   |
| almond flour      | spooned and leveled                            | **96**  | 1 weighing               | 96         | 95        | 98    |
| granulated sugar  | spooned or poured, and leveled                 | **198** | median of 6              | 188 to 202 | 200       |       |
| brown sugar       | firmly packed                                  | **211** | median of 5              | 181 to 217 | 220       |       |
| powdered sugar    | spooned and leveled, unsifted                  | **113** | median of 4              | 112 to 121 | 120       |       |
| butter            | by the stick, half a cup each                  | **227** | median of 5              | 226 to 227 |           |       |
| vegetable oil     | poured to the line                             | **217** | by density               | 216 to 218 | 218       |       |
| olive oil         | poured to the line                             | **216** | by density               | 215 to 216 |           |       |
| shortening        | packed and leveled                             | **186** | median of 4              | 176 to 190 | 205       | 188   |
| milk              | poured to the line                             | **244** | by density               | 243 to 244 |           |       |
| heavy cream       | poured to the line, cold                       | **237** | by density               | 233 to 238 | 238       |       |
| sour cream        | spooned and leveled                            | **236** | median of 3              | 236 to 238 | 230       |       |
| yogurt            | spooned and leveled                            | **245** | USDA's cups, 2 weighings | 244 to 245 |           |       |
| shredded cheddar  | loosely filled, 4 oz a cup as recipes count it | **113** | median of 5              | 98 to 113  |           |       |
| water             | poured to the line                             | **236** | by density               | 236 to 237 | 237       |       |
| honey             | poured or spooned to the line                  | **336** | by density               | 335 to 339 | 339       |       |
| maple syrup       | poured to the line                             | **314** | by density               | 313 to 317 | 315       |       |
| molasses          | poured to the line                             | **332** | by density               | 331 to 334 | 337       |       |
| cocoa powder      | spooned and leveled                            | **85**  | median of 3              | 84 to 86   | 86        |       |
| cornstarch        | spooned and leveled                            | **125** | USDA's cups, 2 weighings | 112 to 125 | 128       |       |
| baking soda       | spooned and leveled                            | **240** | median of 3              | 239 to 288 | 221       | 239   |
| baking powder     | spooned and leveled                            | **177** | USDA's cups, 2 weighings | 177 to 192 | 221       | 192   |
| table salt        | spooned and leveled                            | **292** | median of 3              | 288 to 293 |           | 290   |
| active dry yeast  | spooned and leveled                            | **148** | median of 4              | 142 to 151 | 192       | 147   |
| rolled oats       | poured or spooned, and leveled                 | **85**  | median of 3              | 75 to 89   | 81        |       |
| white rice        | poured and leveled, uncooked                   | **194** | median of 3              | 192 to 198 | 185       | 195   |
| chocolate chips   | poured and leveled                             | **168** | median of 4              | 164 to 170 |           |       |
| chopped walnuts   | chopped, then measured                         | **116** | median of 4              | 112 to 120 | 117       | 117   |
| chopped pecans    | chopped, then measured                         | **114** | median of 5              | 108 to 121 | 109       | 113   |
| peanut butter     | packed and leveled                             | **258** | median of 3              | 255 to 270 |           |       |
| eggs              | beaten, poured to the line                     | **243** | by density               | 243        |           |       |

The ingredients' own units: a **stick of butter** is a quarter pound, 113.4 g, by its wrapper's net weight (half a cup by its markings), exact; a lot of sticks must hold that weight on average (NIST Handbook 133), and a single stick can run light (Beranbaum weighed some at 3.87 oz). A **packet of yeast** is a quarter ounce, 7.09 g, by its label's net weight, about 2¼ teaspoons, exact. A **large egg** is 50 g out of its shell, measured (King Arthur Baking, Rose Levy Beranbaum, SR Legacy; the FDA's reference amount for an egg is the same 50 g).

## What changed, and why

From SR Legacy, the figures live until now, eleven moved by more than 3%:

- **Cake flour, 137 → 111 g; bread flour, 137 → 123 g.** USDA's measured cups (1969) weighed cake flour spooned at 111 g (300 cups), dipped 119 g; bread flour spooned 123 g (40 cups), dipped 136 g. SR Legacy's 137 g is at or above a dipped cup.
- **Active dry yeast, 192 → 148 g (about 3 g a teaspoon).** Both makers put a quarter-ounce packet at about 2¼ teaspoons; the Food Buying Guide 146 g, USDA's measured cups 142 g. SR Legacy's 4 g a teaspoon is heavier than every cup weighed.
- **Baking powder, 221 → 177 g (about 3.7 g a teaspoon).** Two weighings count: USDA's 27 measured cups of a double-acting powder, 177 g, and King Arthur's 4 g a teaspoon, 192 g; with fewer than three, USDA's decide. Kinds differ (USDA's phosphate powder 217 g, its tartrate powder 181 g); a weighing of today's powders would settle it.
- **Baking soda, 221 → 240 g (5 g a teaspoon).** Church & Dwight's bulk density for its powder 239 g, Beranbaum's 5 g a teaspoon, King Arthur's 3 g a half teaspoon; SR Legacy's 4.6 g a teaspoon is lighter than all three.
- **Shortening, 205 → 186 g.** Milk Street 187 g, Crisco's own 1-cup stick 190 g, King Arthur 184 g, America's Test Kitchen 176 g; SR Legacy's 205 g is above every cup weighed.
- **Powdered sugar, 120 → 113 g; brown sugar, 220 → 211 g.** Powdered: USDA's measured cups, King Arthur, and Beranbaum all 113 g. Brown: the middle of USDA's 118 packed cups (211 g), King Arthur, Beranbaum, America's Test Kitchen, and Domino; packing moves it by more grams than any other ingredient (a standard deviation of 22.5 g in USDA's study).
- **White rice, 185 → 194 g; rolled oats, 81 → 85 g; chopped pecans, 109 → 114 g.** Each the middle of its weighings: rice USDA 192 g, a measured density 194 g, King Arthur 198 g; oats America's Test Kitchen 85 g, King Arthur 89 g, USDA's 1969 cups 75 g (today's flakes weigh more); pecans Milk Street and King Arthur 114 g among five.

Within 3%: all-purpose flour 125 → 127 g, granulated sugar 200 → 198 g, sour cream 230 → 236 g, cornstarch 128 → 125 g, almond flour 95 → 96 g, chopped walnuts 117 → 116 g, cocoa 86 → 85 g, and the liquids by a gram or a few (honey 339 → 336 g at the US average 17.2% water; molasses 337 → 332 g; maple syrup 315 → 314 g; water 237 → 236 g at 20 °C; heavy cream 238 → 237 g; vegetable oil 218 → 217 g, soybean oil and canola by the Codex densities). Unchanged: whole wheat flour, butter, olive oil, milk, yogurt, shredded cheddar, table salt, chocolate chips, peanut butter, eggs.

**What writing the rule down changed.** The first reconciliation, the same day, weighed the same sources by judgment. Written down as a rule and applied to the checked sources, eleven of its figures moved:

- **All-purpose flour, 125 → 127 g.** Six weighings count: USDA's 510 cups (126 g), Food Network Kitchen (125 to 130 g), Stella Parks (128 g), and Gold Medal's own "3⅓ cups a pound" spooned (136 g) against King Arthur's and Beranbaum's lighter spooning (120 and 121 g). Their middle is 127 g. The familiar 125 g is SR Legacy's, a compilation.
- **Baking powder, 192 → 177 g**, above: the first took King Arthur's 4 g a teaspoon and a label's 1 g a quarter teaspoon over USDA's 27 cups; labels don't count, and with two weighings USDA's decide.
- **Almond flour, 98 → 96 g.** Milk Street's 100 g is an average of published charts; only King Arthur's weighing counts.
- **Shortening, 188 → 186 g.** USDA's 1969 cups were spooned, not packed.
- **Table salt, 290 → 292 g.** Beranbaum's 6 g a teaspoon names no kind of salt (her recipes use fine sea salt); the middle of USDA's two (292 and 293 g) and King Arthur's (288 g).
- **Chopped pecans, 113 → 114 g.** America's Test Kitchen's 113 g was a cup of whole pecans; chopped, it weighs 119 g.
- **Cake flour, 112 → 111 g.** America's Test Kitchen's 113 g is dipped; two weighings count, so USDA's decide.
- **White rice, 195 → 194 g; chopped walnuts, 117 → 116 g; active dry yeast, 147 → 148 g; baking soda, 239 → 240 g.** Each its median.

## What the sources taught

1. **Method decides flour.** USDA's measured cups (1969) weighed each method on large samples: all-purpose flour dipped 143 g (300 cups), spooned 126 g (510), sifted 116 g (500); cake flour 119, 111, and 99 g. America's Test Kitchen dips (142 g); most other US recipes spoon.
2. **USDA's figures came from that study, and not all match it.** SR Legacy's spooned all-purpose and whole wheat flours match it; its bread and cake flours sit at the dipped rows; its yeast, baking powder, and shortening are heavier than every cup weighed.
3. **Liquids weighed by hand run light.** USDA's measured cups, America's Test Kitchen, and Milk Street weigh oil 4% under its density, honey 3%, molasses 7%: cups filled short, and what clings. Physics sets a liquid's figure.
4. **Some charts write a liquid cup as 8 oz of weight** (King Arthur's water, milk, cream, sour cream, yogurt): 227 g, 4 to 7% light.
5. **Labels repeat the FDA's reference amounts** on a 240 mL label cup, rounded to the gram (21 CFR 101.9(b)(5)(viii), (b)(7)(ii); 101.12(b)): Hershey's chips at 15 g a tablespoon imply 240 g a cup against 164 to 170 g weighed. Not counted.
6. **Measuring cups differ more than ingredients do.** Three dry measuring cups held 182, 201, and 212 g of the same sugar (Beranbaum's kitchen, 2025): no figure can be closer than the cup it is filled in.
7. **Read the source, not the notes about it.** The check found America's Test Kitchen's flour and sugar cups dipped, not spooned; USDA's 1969 shortening and peanut butter spooned, not packed; Milk Street's flour table an average of charts; Foundation Foods' peanut butter SR Legacy's one weighing again; America's Test Kitchen's "chopped" pecans measured whole.
8. **USDA's modern samples are older than they look.** Foundation Foods' sugar was bought in 2006 and its cheddar in 2014, both published in 2019.

## The check

A third reviewer checked all 192 citations (189 ingredient rows, 3 unit rows) against the sources themselves, not the reviewers' notes: page images of the scanned USDA and NBS reports, USDA's data files traced to their samples, and each live page (`cooking-2/check.md`, `cooking-2/check.csv`). 170 confirmed, 21 confirmed with a correction, 1 not reached, none wrong. The corrections: one rounding slip (heavy cream cold 238 g, not 239); America's Test Kitchen's chopped pecans (119 g; its 113 g was whole); two sample years (Foundation Foods' sugar 2006, cheddar 2014); seven fill methods (America's Test Kitchen dips; USDA's 1969 shortening and peanut butter were spooned; Milk Street's flour table averages charts); ten wordings (Foundation Foods' peanut butter one weighing; the molasses grade's 79 Brix a minimum; NBS's 331 g a worked example; seven notes). All are applied. Not reached: Atilgan and Unluturk (2008), behind a bot check and a paywall, confirmed only as Azahra and others quote it; not counted.

The reviewers also found figures they did not cite. Screened by the rule, most are another method, a label, a repeat, another food, or a density for food tables. Six would count, and were read the same day: Gold Medal's "3⅓ cups a pound", spooned, for all-purpose and bread flour (counted); Beranbaum's spaetzle flour, 115 g for a cup less a tablespoon (counted, with her other two); King Arthur's baking soda, 3 g a half teaspoon (counted); Erik Jacobsen's "about 4 ounces", what spooning "usually" gives (not shown to be weighed); Allrecipes' 4.25 oz (the site refuses requests: not read); the Food Buying Guide's nut butters (one figure for every nut and seed butter, USDA's 1969 spooned cup).

## Checked against USDA's cups

USDA's measured cups (1969) are the anchor: the one source that says how many cups it weighed and how much they varied. For each figure the median decided (three or more weighings, USDA's among them), the table gives USDA's cup, the standard deviation USDA reports across its cups, and how many of those deviations our figure sits from USDA's. 11 of 15 lie within one deviation and all 15 within two: the figure of independent kitchens, decided by the rule, lands where USDA's own cups fall. The four between one and two deviations each have a reason, and core's test fails any figure that a new source would carry past two.

| Ingredient        | Ours | USDA's cup | USDA's deviation | Ours, in deviations | Where it is more than one                                                                                                                      |
| ----------------- | ---- | ---------- | ---------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| all-purpose flour | 127  | 126        | 2.8              | +0.4                |                                                                                                                                                |
| bread flour       | 123  | 123        | 3.5              | +0.0                |                                                                                                                                                |
| granulated sugar  | 198  | 196        | 7.6              | +0.3                |                                                                                                                                                |
| brown sugar       | 211  | 211        | 22.5             | +0.0                |                                                                                                                                                |
| powdered sugar    | 113  | 113        | 5.4              | +0.0                |                                                                                                                                                |
| sour cream        | 236  | 236        | 9.4              | +0.0                |                                                                                                                                                |
| shredded cheddar  | 113  | 98         | 11.4             | +1.3                | recipes and packages count 4 oz to a cup, and that convention is what the figure serves; a cup filled lightly by hand weighs what USDA weighed |
| cocoa powder      | 85   | 86         | 8.9              | -0.1                |                                                                                                                                                |
| table salt        | 292  | 292        | 3                | +0.0                |                                                                                                                                                |
| active dry yeast  | 148  | 142        | 4.9              | +1.2                | the makers' own packets, 2¼ teaspoons to a quarter ounce, pull the figure above 1969's cups                                                    |
| rolled oats       | 85   | 75         | 5.5              | +1.8                | today's flakes are thicker: every modern source weighs more than 1969's cups                                                                   |
| white rice        | 194  | 192        | 11.2             | +0.2                |                                                                                                                                                |
| chocolate chips   | 168  | 167        | 2.9              | +0.3                |                                                                                                                                                |
| chopped walnuts   | 116  | 120        | 5.2              | -0.8                |                                                                                                                                                |
| chopped pecans    | 114  | 108        | 4.9              | +1.2                | how fine the nuts are chopped moves the cup; four of five sources sit above USDA's                                                             |

## Sources considered and set aside

Two outside suggestions Sean brought on 2026-10-16, a search assistant's list of "the ultimate" sources and an editor's critique of it, each weighed:

- **USDA FoodData Central's portions**, the list's "ultimate baseline": used, but not as the baseline. Foundation Foods' lab samples count; SR Legacy doesn't, its cups seldom saying how they were filled and several matching a dipped cup or a heaped teaspoon (bread and cake flour 137 g, yeast 4 g a teaspoon).
- **USDA Agriculture Handbook No. 102**, _Food Yields Summarized by Different Stages of Preparation_ (Matthews and Garrison, revised 1975): what is left of a food after trimming, and what cooking adds or takes away. A yield, a different question from a cup's weight, and the source to read if Cooking ever converts raw to cooked, with USDA's _Table of Cooking Yields for Meat and Poultry_.
- **NIST Handbook 133**, _Checking the Net Contents of Packaged Goods_ (2026 edition): how inspectors check that packages hold what their labels say. It gives no conversion factors; it stands behind one thing here, that a stick's quarter pound and a packet's quarter ounce are net weights a lot must hold on average, a single package falling short only within a set tolerance.
- **Francis T. Lynch, _The Book of Yields_, and the Culinary Institute of America, _The Professional Chef_**: textbooks not read for this. A figure counts only from a page read; either, read and cited by page, could add a weighing.
- **King Arthur Baking and America's Test Kitchen**, the list's most precise and most rigorous: both used, each one weighing. Neither is the authority: King Arthur writes a liquid cup as 8 oz (227 g, 4 to 7% light) and fluffs its flour lighter than most; America's Test Kitchen dips, so its flour and sugar cups belong to another method.
- **"Exact" figures**: none of the ingredients' is. The cup is exact (236.5882365 mL, from the inch's definition), and so are a stick's and a packet's net weights by their labels; every ingredient's cup is measured, a spread, its figure rounded to the gram.
- **Answers from search assistants and other converters**: leads to a source, never a source.

## Re-opening a figure

A figure is re-opened, one ingredient at a time, when:

- **a visitor reports a different weight**, once the site takes feedback: the report is a lead, and its source is found, read, and screened like any other;
- **a new weighing appears**: USDA's Foundation Foods adds one of ours (`cooking-2/usda_portions.py` reads each release), or a kitchen publishes one;
- **a product changes**: a new grind, a new kind of baking powder.

The same steps decide it: screen the source, read it, add it to `figures.py`, and regenerate; core's test says what the figure becomes. The change and its reason go here or in a later `cooking-N.md`, and the About page and the line under the table follow from the data.

**Weighing it ourselves**, where the sources cannot settle a figure (fewer than three weighings, or a wide spread), makes us a weighing of our own, counted like any other: a kitchen scale reading to 0.1 g, checked with a known weight; a dry measuring cup checked first by the water it holds level-full (a true cup holds 236 g at 20 °C), replaced if more than 2% off; ten cups filled by the stated method from a fresh package, each weighed; the mean, the standard deviation, the brand, and the date recorded here. The first to weigh: baking powder, almond flour, cake flour, cornstarch, whole wheat flour, and yogurt (fewer than three weighings), then baking soda and brown sugar (the widest spreads).

## Sources

Read 2026-10-16 (the reviewers' files give each figure's exact words and URL; `cooking-2/sources.md` lists every figure by ingredient).

- USDA Agricultural Research Service, _Average Weight of a Measured Cup of Various Foods_, Home Economics Research Report No. 41 (Fulton, Matthews, Davis; ARS 61-6, 1969; reissued 1977), https://archive.org/details/averageweightofm41fult. Dry foods "spooned lightly into the cup" and leveled with a spatula unless dipping or packing is named; liquids to the 1-cup mark at the meniscus; mean, standard deviation, and number of cups per food. On the About page: "USDA's measured cups (1969)".
- USDA FoodData Central: SR Legacy (April 2018), Foundation Foods (April 2026), FNDDS (2021 to 2023), https://fdc.nal.usda.gov/download-datasets.
- USDA Food and Nutrition Service, _Food Buying Guide for Child Nutrition Programs_, Sections 1, 4, and 6, https://foodbuyingguide.fns.usda.gov.
- King Arthur Baking, Ingredient Weight Chart, https://www.kingarthurbaking.com/learn/ingredient-weight-chart, and How to Measure Flour.
- America's Test Kitchen, Baking Conversion Chart and How to Measure Flour, https://www.americastestkitchen.com/how_tos/5490-baking-conversion-chart, and the weights in its recipes.
- Rose Levy Beranbaum, Real Baking with Rose, https://www.realbakingwithrose.com (posts 2005 to 2025).
- Milk Street, "Flour Power" (2017) and "Baking Mix-In Weights" (2019), https://archive.177milkstreet.com.
- Stella Parks, "Do You Scoop or Spoon Your Flour?", Serious Eats (archived copy).
- Food Network Kitchen, How to Measure Flour (2022), https://www.foodnetwork.com/recipes/packages/baking-guide/how-to-measure-flour.
- Zojirushi, The Secret to Perfect Bread, https://www.zojirushi.com/blog/the-secret-to-perfect-bread/.
- Gold Medal, All Purpose Flour and Bread Flour, https://www.goldmedalflour.com/products/all-purpose-flour, https://www.goldmedalflour.com/products/bread-flour.
- FAO/INFOODS Density Database, Version 2.0 (2012), https://openknowledge.fao.org/handle/20.500.14283/ap815e, including the Danish food composition databank's densities (1996).
- Codex Alimentarius, CXS 210-1999 (named vegetable oils) and CXS 33-1981 (olive oils), relative densities at 20 °C, https://www.fao.org/fao-who-codexalimentarius.
- University of Guelph, _Dairy Science and Technology_ eBook (Goff, Hill, Ferrer), Physical Properties of Milk, https://books.lib.uoguelph.ca/dairyscienceandtechnologyebook/chapter/physical-properties-of-milk/.
- NIST Chemistry WebBook, water (IAPWS-95), https://webbook.nist.gov.
- Honey: FAO Agricultural Services Bulletin 124, Table 2.4 (after White, 1975), https://www.fao.org/3/w0076e/w0076e04.htm; USDA Technical Bulletin 1261 (1962) for the US average water; National Honey Board, https://honey.com/faq.
- Maple syrup and molasses: NBS Circular C440 (1942), sucrose tables, https://archive.org/details/circularofbureau440bate; USDA AMS grade standards for maple syrup (2015) and sugarcane molasses (1959); USDA Agriculture Handbook 134, _Maple Sirup Producers Manual_ (1976); B&G Foods, Grandma's Original Molasses specification.
- Church & Dwight (Arm & Hammer), Sodium Bicarbonate USP No. 1 specification, https://ahperformance.com/products/media/specification.
- Azahra, Hintono, and Pramono (2022), _Jurnal Teknologi Pangan_ 6(1), density of pasteurized liquid whole egg.
- Makers and labels: Red Star and Fleischmann's yeast; Crisco; Domino Sugar's conversion charts; Land O Lakes; Bob's Red Mill; Sargento; Jif; Morton; Hershey's; Clabber Girl.
- The rules for labels: 21 CFR 101.9(b) and 101.12(b), https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101. For packages' net weights: NIST Handbook 133 (2026), https://nvlpubs.nist.gov/nistpubs/hb/2025/NIST.HB.133-2026.pdf.
- Rounding: ISO 80000-1:2022, Annex B.

## Files

In `cooking-2/`: the decided figures and the rule (`figures.py`), which write the code and these pages (`write_ingredients.py`, `write_doc.py`); every figure screened, by ingredient (`sources.md`); the USDA extraction (`usda_portions.py` and its outputs); each reviewer's findings and figures (`reviewer-a-*`, `reviewer-b-*`); the check (`check.md`, `check.csv`).

## Later

Weighing the six thin figures ourselves (above); the method as a choice beside the ingredient (dipped and swept for America's Test Kitchen's recipes, sifted for older ones); the metric cup (250 mL) for visitors outside the US; Greek yogurt, kosher salts by brand, instant yeast, quick oats, almond meal, and white whole wheat flour as their own ingredients, each once three weighings count.
