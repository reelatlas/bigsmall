# Research: how a fact is sourced, decided, and checked

The method behind every number and every word of fact in bigsmall: a factor, an ingredient's cup, a unit's name, a size table. `CLAUDE.md`'s first rule says every number is checked on our own; this is how, by the kind of fact, so the same steps decide the next category and re-open a figure a visitor questions. The `research` skill (`.claude/skills/research/`) runs these steps; ADR 0022 records the decision; `docs/research/cooking-2.md` is the worked example.

## 1. Three kinds of fact

Decide the kind first; it decides everything after.

| Kind             | What it is                                                                                    | Examples                                                                             | How it is decided                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Defined**      | A standard, a law, or a specification defines it                                              | the inch, the pound, the US cup, the calorie, the knot, a paper size                 | One source, the one that defines it: recomputed from it and cited to it, exact where the definition is exact (ADR 0020; `docs/UNITS-CATALOG.md` §2). A second source is a cross-check, never a vote: two sources are never averaged. Where standards differ, the one that governs the use (NIST Handbook 44 and SP 811 for US customary, the SI Brochure for SI, the 1959 agreement for the yard and pound). |
| **Measured**     | No standard defines it; it is a property of a material or a practice, known only by measuring | a cup of flour in grams, a liquid's density, a cooking yield, a pace's typical range | The rule in §2: a screen for which measurements count, their median, the field's strongest source as the anchor; a figure that follows from physics computed from it.                                                                                                                                                                                                                                        |
| **Conventional** | A body or a trade agrees a table, which can differ by body, brand, or region                  | shoe, ring, and clothing sizes, wire and screw gauges, oven marks                    | The body's own table, cited to it. Where bodies differ, each is listed under its name and none is averaged; the visitor's region picks the default and the others stay reachable. A table with no body behind it (a brand's chart) is named as the brand's.                                                                                                                                                  |

A fact can be of two kinds at once: the cup is defined (236.5882365 mL, from the inch), what fills it is measured. Split it, and decide each part by its kind.

## 2. Measured facts: the rule

1. **The quantity, exactly.** What is measured and under what condition, as the people who use the figure mean it: a cup filled the way a US recipe means it (spooned, packed, by the stick, poured), a density at the temperature of use, a yield for a stated cut and method. Another condition's figure is recorded and named where it matters, never mixed in.
2. **Which figures count: the screen.** A figure counts when its source measured it, by that condition, of that food or material, and we read it on the source's own page. Recorded but set aside, each with its reason: another method or condition; a label (grams rounded on a serving of a few grams, some fixed by the FDA's reference amounts); a compilation or a repeat (a database row with its method unstated, a table that averages other tables, a guide that copies a database); a figure for another food or form; one not shown to be measured; one quoted secondhand; one we could not read.
3. **Each source once.** Its chart where it has one, else the middle of its figures. A prolific source is still one kitchen.
4. **The figure is their median**, rounded to the precision the data have (the gram for a cup), a half to the even digit (ISO 80000-1); a source's range counts at its middle. The median gives each independent measurement one vote and shrugs off an outlier; a mean would follow the outlier, and numeric weights would be our judgment dressed as arithmetic (§2.9).
5. **Thin data.** With fewer than three counted, the anchor (§2.7) decides where it measured the quantity; otherwise the median of what there is, and the figure is marked thin in the research doc, first in line to re-measure (§5).
6. **Physics first.** Where the quantity follows from a measured physical property (a liquid's weight from its density), it is computed from that property's reference, at the condition of use, and hand measurements are recorded as a check, never counted: they run short in known ways (a cup filled by hand to the line weighs 1 to 7% less than its density says).
7. **The anchor.** The strongest source in the field, the one that states its method, how many it measured, and how much they varied (for cups, USDA's measured-cup study of 1969). It does two jobs: it decides thin data, and it validates the median: a figure must lie within two of the anchor's own standard deviations of the anchor's figure, or the disagreement is named and explained (a product that changed, a convention the trade counts by). A test holds every figure to this, so a new source cannot pull a figure past the anchor unnoticed.
8. **The spread** is the lowest and highest figure counted, shown wherever the figure is.
9. **Why not weights.** Weighting sources numerically (a lab study 3, a kitchen 1) needs each source's uncertainty, which only the anchor reports; the rest would be our guess, and a formula over guesses claims a precision the data do not have. Quality enters twice instead: through the screen, which decides what is in, and through the anchor, which decides thin data and questions the result. Where that is not enough, the answer is a measurement of our own (§5), not a heavier weight.

**Tiers**, for the screen and the anchor: A, lab studies with method, count, and variance; B, practitioners who measure and state their method (test kitchens, authors who weigh); C, makers' own measures of their own products. All three count once each; only A anchors.

## 3. What a source is

- **Read on its page**: the exact words, the URL, the date read, kept with the figure (a CSV of findings per reviewer). A scanned report is read from its page images where text extraction is unsure; a data file from the file, traced to its samples.
- **Leads, not sources**: an answer from a search assistant or an AI tool, another converter's figure, a forum, a reviewer's notes, a quote of a book on a blog. A lead names a source to go and read; it is never cited as the source. Sean's cross-checks from other tools are weighed the same way, and the verdict on each is recorded where the work lives.
- **Textbooks** (_The Book of Yields_, _The Professional Chef_) count only when read and cited by page.
- **Standards bodies** for defined facts: NIST, BIPM, ISO, IEC, the CFR, Codex Alimentarius, the body that owns a conventional table.
- **Safety.** Downloads go in their own folders outside the repo, scripts in another; readers run with `python -I`; nothing personal (an email address, a name) ever goes in a request, a header, or a form (a research agent once did, and the request failed).

## 4. The process

What the `research` skill runs, for a new category or figure, and for re-opening one.

1. **Scope and classify** (§1): the facts in scope and the kind of each, said in a line before gathering.
2. **Gather.** For a whole category, or a figure many conversions rest on: two reviewers, blind to each other and to our figures, each recording every figure found with its source's words, URL, date, and stated condition. For one figure: one reviewer, then a checker.
3. **Screen** (§2.2) every figure found, counted or set aside, each with its reason, kept in the research folder.
4. **Decide** by the rule, in a data file that holds the figures and the rule as code (`figures.py`), from which the code and the docs are written (`write_ingredients.py`, `write_doc.py`); never by hand in two places.
5. **Check.** A third reader checks every citation against the source itself, not the reviewers' notes; corrections go into the data file and regenerate everything.
6. **Test.** Core's tests recompute each figure from its sources by the rule and hold it to the anchor; a defined fact gets its golden row.
7. **Document**, each in its home: the research doc (`docs/research/<topic>-N.md`: the rule as applied, the figures and how each was reached, what changed and why, the check, the sources considered and set aside, how to re-open), an ADR for a decision, `docs/UX-SPEC.md` where words on screen change, `docs/UNITS-CATALOG.md`, `docs/LEARNINGS.md`, the findings log. The About page shows the sources from the data.
8. **Ship** on the gate.

## 5. Re-opening a figure

- **When:** a visitor reports a different figure (once the site takes feedback; the report is a lead, its source found and screened like any other); a new measurement appears (USDA's Foundation Foods releases are re-read by `usda_portions.py`); a product changes (a new grind, a new kind of leavener); a figure marked thin.
- **How:** one figure at a time, by the same steps: screen, read, add to the data file, regenerate; the test says what the figure becomes. The change and its reason go in the research doc or a later `<topic>-N.md`.
- **Measuring it ourselves**, where the sources cannot settle it, makes us a source counted like any other, if it is done as a source would: an instrument reading finer than the figure's precision, checked against a known reference (a 0.1 g scale and a known weight; a dry measuring cup checked by the water it holds level-full, replaced if more than 2% off); the stated condition followed to the letter; ten measurements from a fresh package; the mean, the standard deviation, the brand, and the date recorded. Ours never outranks the anchor; it counts once.

## 6. Adapting the rule to a new category

Ask, in order, and write the answers at the top of the category's research doc:

1. Does a standard define it? Then it is defined, and §1's first row is the whole method.
2. Does it follow from a physical property with a reference (a density, a heat of combustion)? Then compute it from the reference at the condition of use (§2.6).
3. Is it a trade's or a body's table? Then it is conventional: which bodies, and which is the visitor's default.
4. What condition must be fixed for the figure to mean one thing (temperature, fill, grade, cut)?
5. Which source is the field's anchor, and does it report its variance? Without one, the median stands alone and thin data stay thin until we measure.
6. What precision do the data have? Round to it.
7. What varies by region, and which region is the default?

A change the rule needs for a category is written in that category's research doc; a change that holds in general is written here and recorded as an amendment to ADR 0022.

## 7. Files

- `docs/research/<topic>-N.md`: one doc per topic and round; a later round supersedes an earlier one with a note at its top, and the earlier one stays as the record.
- `docs/research/<topic>-N/`: the data file and its rule, the generators, each reviewer's findings and figures, the check, the extractions. Downloads are not kept.
- `packages/core`: the data the generators write, the tests that hold it to its sources.
