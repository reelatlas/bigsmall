---
name: research
description: Sources, decides, checks, and records a fact for bigsmall by its kind (defined by a standard, measured by the written rule, conventional by a body), as docs/RESEARCH.md says (ADR 0022). Use when adding a category or a unit whose factor no standard defines, adding or re-opening an ingredient's figure, weighing an outside suggestion of sources, or answering a visitor's report that a figure is wrong; or when Sean types /research.
argument-hint: '[a category, a unit, an ingredient, a figure to re-open, or a pasted suggestion to weigh]'
---

# Research

A figure leaves this with its sources read on their pages, decided by the rule for its kind, checked against the sources themselves, held by a test, and recorded so the next person can re-open it. The rules live in `docs/RESEARCH.md`; this is the order of work.

Requested scope: `$ARGUMENTS`

## 1. Scope and kind

- Name the facts in scope and the kind of each (`docs/RESEARCH.md` §1: defined, measured, conventional), in a line to Sean before gathering, so he can correct it. A fact of two kinds is split.
- For a **defined** fact, the work is `docs/UNITS-CATALOG.md` §6: the standard, the recomputation, the citation, the golden row. Stop here unless the standard is in doubt.
- For a **conventional** fact: which bodies publish the table, which is the visitor's default by region, and that none will be averaged.
- For a **measured** fact, read `docs/RESEARCH.md` §2 and §6 and answer §6's questions at the top of the research doc: the condition fixed, the anchor source, the precision, the region.
- For a **suggestion to weigh** (an outside list of sources, an AI tool's answer): it is a lead, never a source. Classify each item: what job it does (a defining standard, a measurement, a yield, a package rule), whether it is readable, and whether it would count under the screen. Record the verdicts in the research doc's "Sources considered and set aside" and say them plainly to Sean.
- For a **report that a figure is wrong**: a lead; find the source behind it, then run steps 3 to 7 for that one figure.

## 2. Gather

- A whole category, or a figure many conversions rest on: two reviewers in parallel, blind to each other and to our figures, each recording every figure found as a row: source, the figure as given, the figure in our unit, the condition the source states, the URL, the exact words, the date. One figure: one reviewer, then the checker in step 5.
- Reviewers read the source itself: a scan from its page images where text extraction is unsure, a data file from the file traced to its samples, a live page fetched fresh.
- Run them as agents from one brief, the orchestrator never gathering itself (`docs/RESEARCH.md` §4, "How the work is split"): the brief names the things and the condition, never a number, and the output's shape; each agent works in its own scratch folder; results are read from files.
- Downloads in their own folders in the scratchpad, scripts in another, readers run with `python -I`; nothing personal in any request, header, or form.

## 3. Screen

- Every figure found is kept, counted or set aside, each set-aside with its reason (`docs/RESEARCH.md` §2.2): another condition, a label, a compilation or repeat, another food or form, not shown to be measured, secondhand, unread.
- Each source once; tiers noted (A lab, B practitioner, C maker); the anchor named.

## 4. Decide

- The data file holds the figures and the rule as code (`docs/research/<topic>-N/figures.py`, after `cooking-2/`): the counted figures, the set-asides with reasons, the rule's output asserted. Generators write the code (`write_ingredients.py`) and the doc (`write_doc.py`) from it; nothing is typed in two places.
- The rule: the median of what counts, rounded to the data's precision; fewer than three, the anchor; physics where it applies; the spread recorded.

## 5. Check

- A third reader, blind to the reviewers' notes, checks every citation against the source itself and reports confirmed, corrected, unreachable, or wrong, row by row (`check.csv`, `check.md`). Every correction goes into the data file, and everything regenerates.
- Figures the reviewers found but did not cite are screened too; those that would count are read and added.

## 6. Test

- Core's tests recompute each figure from its sources by the rule (`cupFigure`), check it against the anchor within two standard deviations, and hold the data's shape (each source once, the spread theirs). A defined fact gets its golden row. The gate must pass.

## 7. Record, each note in its home

| Note                                                                | Home                                                                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| The rule as applied, the figures, the check, set-asides, re-opening | `docs/research/<topic>-N.md`, written by its generator; its folder holds the data, generators, findings, check |
| A decision anyone would explain twice                               | An ADR in `docs/decisions/`; a change to the general rule, an amendment to ADR 0022                            |
| Words on screen (the note under a table, About's lines)             | `docs/UX-SPEC.md`, in the same change                                                                          |
| What a category carries and how to add to it                        | `docs/UNITS-CATALOG.md`                                                                                        |
| What is tested where                                                | `docs/TESTING.md`                                                                                              |
| A gotcha or a best practice found                                   | A dated entry in `docs/LEARNINGS.md`                                                                           |
| Sean's notes and what changed for them                              | `docs/research/findings-0-first-pass.md`                                                                       |
| Where things stand                                                  | `CLAUDE.md`, "Pick up here"                                                                                    |

## 8. Report to Sean

Short, plain, in this order: what kind each fact is and the rule that decided it; what moved and why, the largest first; what the check found; what is thin and what would settle it; what was set aside from any suggestion he brought, with the reason each. Then ship (the `ship` skill) unless he asked to hold.
