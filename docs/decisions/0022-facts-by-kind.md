# 0022 — Facts by kind: defined by a standard, measured by a written rule, conventional by a body

Date: 2026-10-16
Status: accepted; extends 0020; amended 2026-10-19 (see Amendments)

## Context

ADR 0020 says every number is checked on our own against the standard that defines it. Cooking's ingredients were the first facts with no such standard: a cup of flour weighs what people measure it to weigh, and the published figures disagree by several grams. The sixty-fourth pass weighed many sources for each figure by judgment, and a citation check of all 192 citations then showed that judgment leaning on sources that did not say what their notes said (a test kitchen's cups dipped rather than spooned, a table that averaged other tables, a label's rounded gram). Written down as a rule and applied to the checked sources, eleven figures moved. Sean asked that the method be sound enough to validate against, recorded so it is repeatable, and general enough to carry to other categories and to re-open a figure when a visitor reports a different one; and he brought two outside lists of "the ultimate" sources to weigh, which mixed three different jobs (a cup's weight, a package's net contents, a food's yield after cooking).

## Decision

1. **Every fact is one of three kinds, decided first** (`docs/RESEARCH.md` §1): **defined** by a standard, which is then the one source, cited and recomputed, never averaged with another; **measured**, with no standard, decided by the rule below; **conventional**, a body's table, cited to the body, bodies listed side by side and never averaged.
2. **A measured fact is decided by the written rule** in `docs/RESEARCH.md` §2: the quantity fixed to one condition, the one its users mean; a screen for which figures count (the source measured it, by that condition, of that thing, and we read it on its page; labels, compilations, other conditions, secondhand quotes set aside with the reason); each source once; the median of what counts, rounded to the data's precision; with fewer than three, the field's anchor source where it measured it; a figure that follows from physics computed from its reference; the spread shown with the figure.
3. **The anchor validates.** The field's strongest source (stated method, count, variance) decides thin data and checks the median: a figure lies within two of the anchor's own standard deviations, or the disagreement is named and explained. A test holds every figure to its sources and to the anchor, so the figure is the rule's output, never a number typed in.
4. **Sources are weighed by the screen and the anchor, never by numeric weights**: weights would need each source's uncertainty, which only the anchor reports, and a formula over guesses claims a precision the data lack. Where screen and median cannot settle a figure, we measure it ourselves by a written protocol and count once.
5. **Leads are not sources.** An answer from a search assistant or another AI tool, another converter, a forum, a reviewer's notes, and a secondhand quote name a source to read; none is cited. Outside suggestions are weighed source by source and the verdicts recorded where the work lives.
6. **A figure is re-opened** by a visitor's report, a new measurement, a product change, or a thin mark, one figure at a time by the same steps; the test says what it becomes.
7. **The method is run by the `research` skill** and adapted to a new category by the questions in `docs/RESEARCH.md` §6; a change that holds in general is an amendment here.

## Alternatives considered

- **One authority per field** (USDA's table for cups). A single source is a single point of failure: USDA's own compiled table carried a dipped cup's weight for cake flour and a heaped teaspoon's for yeast, and products change (today's oats weigh more than 1969's).
- **Weighting sources numerically.** It looks rigorous and is judgment in disguise: no weight can be checked, and the figure inherits a false precision. Rejected in favor of a strict screen, a median, and an anchor that questions the result.
- **A mean of everything found.** It follows outliers and counts a chart's convention (every liquid 8 oz) as a measurement.
- **Leaving the method in the Cooking doc alone.** The next measured category would start from scratch, and a visitor's report would have no process to land in.

## Consequences

- `docs/RESEARCH.md` is read before sourcing any figure or fact; `CLAUDE.md` names it with ADR 0020.
- Core carries each measured figure's counted sources as data (`CupSource`, with the anchor's standard deviation where it reports one) and the rule as code (`cupFigure`); its tests recompute every figure and check it against the anchor.
- A research doc per topic and round records the rule as applied, every source considered, the check, and how to re-open (`docs/research/cooking-2.md` is the first); its data file and generators write the code and the doc.
- Thin figures are named and are the first to measure ourselves; the protocol is written.
- When the site takes feedback, a report on a figure has a process: it is a lead, screened like any source.

## Amendments

- **2026-10-19.** The method extends to practices. A way of doing something, a pattern of design, interaction, code, or process, has no kind and no rule computes it; it is gathered in layers (our own evidence, the standards and the established practice, the community, the wild, the one-offs), every finding with its evidence level, and decided by principle, recorded where decisions go (docs/RESEARCH.md §8; Sean's sourcing philosophy, the ninety-fifth pass in docs/research/findings-0-first-pass.md).
