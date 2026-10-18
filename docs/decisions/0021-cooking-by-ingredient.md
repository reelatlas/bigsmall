# 0021 — Cooking: an ingredient joins volume and weight

Date: 2026-10-16
Status: accepted; amended 2026-10-16, 2026-10-17

## Context

Recipes measure by volume in the US (2 cups of flour) and by weight nearly everywhere else (250 g), and the two meet only through the ingredient: a cup of flour weighs about 125 g, a cup of sugar 200 g, a cup of honey 339 g. Every category so far converts within one quantity, so no unit of Volume converts to one of Weight. The categories lab (`/dev/categories-lab`, 2026-10-15 and 16) drew four ways to bring them together: A, the ingredient in a menu beside the category; B, the same table by system; C, an ingredient's own unit (a stick of butter); D, the ingredient as a second pill in the box, beside the unit. Sean chose D, weight first, then the ingredient (2026-10-16, the sixty-third pass): "cooking can really help our product shine."

The densities are measured, not defined: a cup of flour scooped from the bag weighs more than one spooned in and leveled. USDA FoodData Central (SR Legacy) publishes, for each food, the gram weight of the portions people measure ("1 cup" of all-purpose flour, 125 g; "1 stick" of butter, 113 g), the standard a converter can cite.

## Decision

1. **Cooking is a category in the menu and the start's tiles, a lens over Volume and Weight.** The box's unit stays a unit of Volume or Weight (the cup, the gram); the ingredient is a second value, so `2 cups flour` holds the amount, the unit, and the ingredient. Without an ingredient, the box is plain Volume or Weight again.
2. **The box shows two pills, the unit and then the ingredient, each removable** (the lab's D). Removing the ingredient leaves a Volume or Weight conversion; removing the unit leaves the ingredient, waiting for one. Typed `2 cups flour`, `2 cups of flour`, or `flour 2 cups`, the amount, the unit, and the ingredient are read apart; an ingredient is also offered among the matches, under Cooking, as a unit is.
3. **The table lists Weight, then Volume** (Sean, 2026-10-16), each section by the visitor's own system first: grams and kilograms, ounces and pounds; teaspoons, tablespoons, fluid ounces, cups, milliliters, and liters; and an ingredient's own unit where people count it, a stick of butter, a large egg. Every row that crosses from volume to weight, or back, is marked ≈: a density is measured, and moves with how the ingredient is packed. Rows within one quantity stay exact.
4. **Under the table, the ingredient's line says what was measured and where it comes from**: "All-purpose flour: 125 g a cup (USDA FoodData Central 168894); how it is packed moves it by a tenth or more, heavier scooped from the bag, lighter sifted." Where USDA names how a portion was measured (packed, sifted, dipped), the line says it. The cup is the US customary cup, 236.6 mL, and the line says so; a metric cup (250 mL) waits for a later pass.
5. **Ingredients are data in `packages/core`**, each with its id, name, aliases ("flour", "ap flour"), grams per US cup, the USDA FoodData Central food and portion it was read from, and its own units with their grams. A volume converts to a weight through the density (grams per cup ÷ 236.5882365 mL), both ways; core keeps the math, the UI none (ADR 0003).
6. **Every density is checked on our own** (ADR 0020): read from FoodData Central's SR Legacy data, looked up again blind, and pinned by a golden row per ingredient; where USDA lists several portions (sifted, unsifted, packed), the one a recipe means is chosen and named.
7. **The URL keeps the ingredient**, `?a=us-cup&v=2&i=all-purpose-flour`, so a shared link opens on the same conversion.
8. **The first ingredients are the baking staples** the lab listed: flours, sugars, fats and oils, dairy, syrups, leaveners, salt, cocoa, oats, rice, chocolate chips, nuts, peanut butter, water, and eggs. More come as people ask.

## Alternatives considered

- **The ingredient in a menu beside the category (A).** It works, but the box would no longer say everything being converted, and the toolbar gains a control that only Cooking uses.
- **Sections by system (B), as every other table is.** Volume and weight would mix within each section; weight first answers the question cooks bring.
- **A category per ingredient (Flour, Sugar).** The menu would grow by dozens and each would repeat the same units.
- **Volume and Weight with an ingredient switch, no Cooking category.** Harder to find: people look for cooking, not for a switch.
- **Kitchen densities from a reference site's chart.** A chart is a cross-check; FoodData Central is the standard it is checked against (ADR 0020).

## Consequences

- The converter's state gains an ingredient beside the unit; undo, the URL, the box's pills, the matches, and the category menu learn it.
- Core gains ingredients and a conversion through density, tested in golden rows; the About page's formulas list each ingredient's grams per cup with its source.
- The categories lab's Cooking mocks retire once this ships, and with them the lab (`docs/research/labs/README.md`): retired 2026-10-16.
- Later, and not decided here: the metric cup and spoons, weights rounded to the gram for cooking, more ingredients, an oven's gas marks and fan settings beside Temperature (`docs/PLAN.md` §2, "Categories with a second value").

## Amendments

- **2026-10-16 (the sixty-fourth and sixty-fifth passes).**
  - **Each figure is decided by one written rule from the weighings that count, not read from one source** (Sean: "our best prediction of what the most accurate is", cross-referenced and validated, the sources on the About page; then logic sound enough to validate against and to re-open). No standard defines a cup of flour's weight, so ADR 0020's standard is, for an ingredient, the rule in `docs/research/cooking-2.md`: a cup filled the way US recipes mean it; the weighings that count (by that method, of that food, read on their page, each source once; not labels, compilations such as SR Legacy, or another method); their median, rounded to the gram; with fewer than three, USDA's measured cups (1969) where they weighed it; a liquid by its density times the cup. Two blind reviews gathered the sources, a third checked each against its page, and core's test recomputes every figure from its sources (`cupFigure`).
  - Each ingredient carries the method its cup is filled by, the weighings counted with their figures (`CupSource`), their spread, and a note where another method matters (dipped, sifted), in place of one USDA food and portion. The line under the table names the method, the spread, and how many weighings; the About page says how the figure was reached and lists the weighings. SR Legacy is recorded, not counted.
  - Eleven figures moved from SR Legacy's by more than 3%: cake flour 137 → 111 g, bread flour 137 → 123 g, active dry yeast 192 → 148 g, baking powder 221 → 177 g, baking soda 221 → 240 g, shortening 205 → 186 g, powdered sugar 120 → 113 g, brown sugar 220 → 211 g, white rice 185 → 194 g, rolled oats 81 → 85 g, chopped pecans 109 → 114 g. All-purpose flour, 125 → 127 g.
  - A stick of butter and a packet of yeast are their packages' net weights, a quarter pound and a quarter ounce, exact; a large egg stays 50 g.
  - **A figure is re-opened** when a visitor reports a different weight (the report a lead, its source screened like any other), a new weighing appears, or a product changes. The same rule decides it; where the sources cannot (fewer than three weighings, or a wide spread), we weigh it ourselves by the protocol in cooking-2.md, a weighing counted like any other.
  - The alternative "kitchen densities from a reference site's chart" stands as written: no one chart, nor USDA alone, is the standard.
- **2026-10-17 (the seventieth pass).** The line under the table says only how the cup is filled, "All-purpose flour: spooned and leveled", "Eggs: beaten, poured to the line" (`8e7696a`; Sean: the measuring convention is what a visitor acts on, the cup's weight shows in the table itself once a cup is typed, and the About page keeps every figure with its weighings and their spread). Decision 4's line, and the first amendment's line naming the spread and the count of weighings, are replaced by this (docs/UX-SPEC.md §6).
