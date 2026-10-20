# 0027 — Shoe sizes: ISO's foot-length model, gender and age as units, the chart as the second value later

Date: 2026-10-20
Status: accepted; amended 2026-10-20 (below)

## Context

The demand map's third question (docs/research/demand-map-1.md, §5 decision 4, Sean's yes of 2026-10-19) found shoe sizes among the most searched conversions ("us 11 to eu", "size 45 euro to us"; about 230,000 searches a month in one estimate) and no body defining one conversion: every converter site publishes its own chart, and brands disagree with one another by half a size to a size. ISO/TS 19407:2015, "Footwear — Sizing — Conversion of sizing systems", brings the systems to one base, the foot's length in millimetres, which is Mondopoint itself (ISO 9407): every adult scale is a straight line over it, the shoe two sizes longer than the foot, and its Table 2 is those lines rounded to the half size, which the formulas with the steps as it prints them (8.47 mm a UK or US size, 6.67 mm a European one) reproduce in 321 of 324 values, the three misses each within a hundredth of a size of a rounding boundary. Children's sizes carry a growth allowance the formulas do not and come from its Table 3 alone; the UK and US children's scales restart at 1 after 13.5. The standard calls its own tables a guideline, and was replaced in 2023 by ISO 19407, whose text is paywalled (docs/research/shoe-sizes-1.md; the demand map's shoe-sizes worker and its checker, 2026-10-19).

A fact of this kind is conventional (docs/RESEARCH.md §1, ADR 0022): one body's table, cited to it, with a brand's chart named as the brand's and never averaged in.

## Decision

1. **Shoe size is a category, its base Mondopoint, the foot's length in millimetres.** Nine units. The adult scales are ISO's formulas as affine units with the printed steps: European (`EU`, base = (size − 2) × 6.67), British (`UK`, (size + 23) × 8.47), US men's (`US M`, size + 22) and US women's (`US W`, size + 21), none exact; Mondopoint (`mm`) and Japanese (`cm`, Mondopoint in centimetres) exact, since they are the foot's length. The children's scales, European, British, and US children's (`EU C`, `UK C`, `US C`), are ISO's Table 3: straight lines between its rows' points up to where a scale restarts at 1, with a `range`, the rows' feet half a row past each end, outside which a row says Out of range rather than carrying the line into sizes no shoe is marked in. Youth sizes (1Y to 7Y) are men's sizes, as Nike's chart and the table itself agree, and the UK junior sizes 1 to 5 are the adult scale, so neither needs a unit.
2. **Gender and age are units, not a setting or a second value**, as mpg (US) and mpg (UK) are: only the US scale splits by gender and the children's scales restart, so each is a unit of its own, listed in its system's section after the adults'. A bare "us" is men's, the match Enter takes; women's and children's follow it.
3. **Every converted size is written to its scale's step** (`step`: the half size, Mondopoint's 5 mm), to the nearest as ISO's table rounds, marked ≈ where that moved it, whatever Display's places or fractions, as a pace keeps its clock; the row's value is the size itself, so it copies and moves into the box as it shows. The box's own row echoes what was typed.
4. **A line under the table says what the sizes rest on and where they differ**: ISO 19407, from the foot's length, to the half size; a brand's chart can differ by up to a size; US women's run 1 (ISO) to 1.5 (Nike, Clarks) above men's. ISO's offsets are the anchor and the line the warning; the women's offset is not a setting until asked for (the demand map's recommendation; Sean's call open).
5. **A scale is written before its number** ("US 11", "eu 45", "us m 11", "size 11", "kids 30"; `prefix` on the units and the category): the parser reads a leading key followed by a number as that number and the key. A query that matches nothing as a whole and ends in "to" or "in" and a target ("us 11 to eu", "5 km to miles") is matched by its head, the target kept beside the matches for a later pass to act on. An apostrophe inside a word folds away in matching ("men's" and "mens" are one key); a lone mark stays, the foot's.
6. **The chart is the second value, later.** ISO's table is the chart now; a brand's chart (Nike's, Clarks's) joins as a second value beside the unit, named as the brand's, in the Cooking pill's shape, when asked for. Widths are out of scope; Korea's and China's millimetre sizes are Mondopoint, China's named as an alias, Korea's a lead.
7. **The record is a data file and a blind check.** The tables are typed once, in `docs/research/shoe-sizes-1/tables.py`, from the standard's page images; a generator writes core's copies; a checker transcribed the same pages blind and every cell agreed; core's test holds the engine to Table 2 (the 321 and the three named misses) and to Table 3 row for row.

## Alternatives considered

- **A chart lookup for adults, as every site does.** Loses the rule: a chart cannot be checked against anything but another chart, while the formulas reproduce ISO's own table and say why the three cells differ.
- **The last's length as the base.** A visitor can measure a foot, not a last, and Mondopoint is the foot's length by definition; the last's allowance is what the systems disagree on.
- **Gender as a setting, or as the second value.** The European, British, Mondopoint, and Japanese scales are unisex in ISO and on every chart opened; a setting would hide a difference only the US scale has.
- **Children's sizes by the adult formulas.** They fail: Table 3's feet carry a growth allowance of their own, up to half a size off the adult rule at the small end and the large.
- **One children's unit per system across the restart.** A number would then name two sizes (a UK child's 4 at 123 mm and a junior's at 226 mm); the scale before the restart is the children's, and after it the adult scale, which already has its unit.
- **Rounding sizes up, as brands advise.** ISO's table rounds to the nearest, and the engine holds the standard; Display's Up could size up in a later pass.
- **Dropping every apostrophe in matching.** A lone mark is the foot's own key (`5'`): only an apostrophe inside a word folds away.

## Consequences

- Seventeen categories. New fields on a unit, `step`, `range`, `prefix`, and `conventional`, and on a category, `note` and `prefix`, each with its docblock; the formulas page says "by convention" for a scale; the change section is Temperature's alone, since a shoe scale is affine too.
- Easier: the next conventional size (ring sizes, a clothing scale) is a scale with a step, a table with a range, and a note, all in place.
- To watch: ISO 19407:2023's text is unread, so whether its numbers differ from 2015's is unknown; brands' charts wait for the second value; Sean's calls on the women's offset, the target's use, and the Out of range rows' interaction.

## Amendments

- **2026-10-20** (the hundred-and-sixth pass, Sean's feedback on the build). The names carry no possessive: US men, US women, US children, European children, British children; the symbols stay. A size takes no places, but Fraction writes its half as one (10 1/2), its scale's own step whatever sizes are chosen, across as every row is, and Both the decimal first and the fraction after it: a size split on its decimal beside rows written across moved with every click.
