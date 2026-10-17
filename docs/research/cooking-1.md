# Cooking 1: ingredients and their densities

2026-10-16. The data behind Cooking (ADR 0021): each ingredient's weight for a US cup, as USDA FoodData Central measures it, and how it was checked (ADR 0020). The code is `packages/core/src/units/ingredients.ts`; this file is its provenance.

## Method

1. **Read.** FoodData Central's SR Legacy data (the April 2018 CSV release, `food.csv` and `food_portion.csv`), each staple's food and its household portions. Where USDA weighs a cup, the cup; where it weighs a smaller measure only, that measure times how many make a cup (48 teaspoons, 16 tablespoons). Where it gives several cups (packed or not, sifted or not, chopped or ground), the one a US recipe means.
2. **Checked blind.** A second reviewer, without these readings, looked each one up again in the SR Legacy files and FoodData Central's API (every portion matched), and cross-checked USDA's Home and Garden Bulletin No. 72, _Nutritive Value of Foods_ (2002). HG-72's figures come from SR Release 13 (2000), rounded to whole grams, so its agreement shows the numbers have held since then rather than measuring anew.
3. **Pinned.** A test weighs a cup of every ingredient through the converter against these figures (`packages/core/test/cooking.test.ts`), and the ingredients' own units (a stick of butter, a large egg, a packet of yeast) have golden rows.

## The ingredients

| Ingredient        | FoodData Central food                                                          | Portion read                   | g per US cup | HG-72         |
| ----------------- | ------------------------------------------------------------------------------ | ------------------------------ | ------------ | ------------- |
| all-purpose flour | 168894 Wheat flour, white, all-purpose, enriched, bleached                     | 1 cup = 125 g                  | 125          | 125 (spooned) |
| bread flour       | 168896 Wheat flour, white, bread, enriched                                     | 1 cup = 137 g                  | 137          | 137           |
| whole wheat flour | 168893 Wheat flour, whole-grain                                                | 1 cup = 120 g                  | 120          | 120           |
| cake flour        | 169723 Wheat flour, white, cake, enriched                                      | 1 cup unsifted, dipped = 137 g | 137          | 137 (spooned) |
| almond flour      | 170567 Nuts, almonds                                                           | 1 cup, ground = 95 g           | 95           | not listed    |
| granulated sugar  | 169655 Sugars, granulated                                                      | 1 cup = 200 g                  | 200          | 200           |
| brown sugar       | 168833 Sugars, brown                                                           | 1 cup packed = 220 g           | 220          | 220           |
| powdered sugar    | 169656 Sugars, powdered                                                        | 1 cup unsifted = 120 g         | 120          | 120           |
| butter            | 173410 Butter, salted                                                          | 1 cup = 227 g; 1 stick = 113 g | 227          | stick 113     |
| vegetable oil     | 172336 Oil, canola                                                             | 1 cup = 218 g                  | 218          | 218           |
| olive oil         | 171413 Oil, olive, salad or cooking                                            | 1 cup = 216 g                  | 216          | 216           |
| shortening        | 173584 Shortening, vegetable, household, composite                             | 1 cup = 205 g                  | 205          | 205           |
| milk              | 171265 Milk, whole, 3.25% milkfat, with added vitamin D                        | 1 cup = 244 g                  | 244          | 244           |
| heavy cream       | 170859 Cream, fluid, heavy whipping                                            | 1 cup, fluid = 238 g           | 238          | 238           |
| sour cream        | 171257 Cream, sour, cultured                                                   | 1 cup = 230 g                  | 230          | 230           |
| yogurt            | 171284 Yogurt, plain, whole milk                                               | 1 cup (8 fl oz) = 245 g        | 245          | not listed    |
| shredded cheddar  | 173414 Cheese, cheddar                                                         | 1 cup, shredded = 113 g        | 113          | 113           |
| water             | 173647 Beverages, water, tap, drinking                                         | 8 fl oz = 237 g                | 237          | 237           |
| honey             | 169640 Honey                                                                   | 1 cup = 339 g                  | 339          | 339           |
| maple syrup       | 169661 Syrups, maple                                                           | 1 cup = 315 g                  | 315          | not listed    |
| molasses          | 168820 Molasses                                                                | 1 cup = 337 g                  | 337          | see below     |
| cocoa powder      | 169593 Cocoa, dry powder, unsweetened                                          | 1 cup = 86 g                   | 86           | 86            |
| rolled oats       | 173904 Cereals, oats, regular and quick, not fortified, dry                    | 1 cup = 81 g                   | 81           | not listed    |
| white rice        | 168877 Rice, white, long-grain, regular, raw, enriched                         | 1 cup = 185 g                  | 185          | 185           |
| cornstarch        | 169698 Cornstarch                                                              | 1 cup = 128 g                  | 128          | 8 a tbsp      |
| baking soda       | 175040 Leavening agents, baking soda                                           | 1 tsp = 4.6 g                  | 220.8        | 5 a tsp       |
| baking powder     | 172803 Leavening agents, baking powder, double-acting, sodium aluminum sulfate | 1 tsp = 4.6 g                  | 220.8        | 5 a tsp       |
| table salt        | 173468 Salt, table                                                             | 1 cup = 292 g                  | 292          | 6 a tsp       |
| active dry yeast  | 175043 Leavening agents, yeast, baker's, active dry                            | 1 tsp = 4 g; 1 packet = 7.2 g  | 192          | 4 a tsp       |
| chocolate chips   | 167976 Candies, semisweet chocolate                                            | 1 cup chips = 168 g            | 168          | 168           |
| chopped walnuts   | 170187 Nuts, walnuts, english                                                  | 1 cup, chopped = 117 g         | 117          | 120           |
| chopped pecans    | 170182 Nuts, pecans                                                            | 1 cup, chopped = 109 g         | 109          | not listed    |
| peanut butter     | 174266 Peanut butter, smooth style, with salt                                  | 1 cup = 258 g                  | 258          | 16 a tbsp     |
| eggs              | 171287 Egg, whole, raw, fresh                                                  | 1 cup = 243 g; 1 large = 50 g  | 243          | large 50      |

## Where the sources differ, and what was chosen

- **Molasses.** FoodData Central weighs a cup at 337 g but a tablespoon at 20 g (320 g a cup); HG-72 lists only blackstrap, 328 g. US recipes mean regular molasses: the cup, 337 g.
- **Maple syrup.** FoodData Central's cup is 315 g, its quarter cup 83 g (332 g a cup); its Canadian entry, about 315 g a cup, supports the cup.
- **Chopped walnuts.** FoodData Central 117 g (12 samples), HG-72 120 g, the same as FoodData Central's "pieces or chips": the chopped cup is kept.
- **Cake flour.** Both say 137 g, but FoodData Central calls the cup "unsifted, dipped" and HG-72 "unsifted, spooned"; the line under the table gives FoodData Central's words. Sifted cake flour, which older recipes call for, is in neither.
- **Yeast.** USDA's 4 g a teaspoon and 7.2 g packet give about 1.8 teaspoons a packet; a maker's figure (Red Star, a 7 g packet of about 2¼ teaspoons) is about 3.1 g a teaspoon. USDA stays the standard (ADR 0020); a later pass may weigh instant yeast apart.
- **Shortening.** The composite household entry (173584), the generic one, rather than a single blend; both are 205 g.
- **Not used.** The plain "Oats" entry (169705, whole groats, 156 g a cup); the almonds' whole, sliced, and slivered cups (ground is almond flour's).

## Later

The metric cup (250 mL) and spoons, weights rounded to the gram for cooking, instant yeast, cake flour sifted, more ingredients as asked, and an oven's gas marks beside Temperature (docs/PLAN.md §2, "Categories with a second value").
