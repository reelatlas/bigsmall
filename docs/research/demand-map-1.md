# The demand map: categories, compound input, shoe sizes, and the pair list, researched in waves

v0.1, 2026-10-19. The pass that decides what bigsmall builds before the pair pages: which categories are missing or need regrouping, how a value in two units (a height) is read and shown, how shoe sizes join under a standard, and which pairs get pages, controls included. It is the first full run of "a planner and agents that build" (docs/PLAN.md §2): an orchestrator's brief, parallel workers, checkers apart from gatherers, handoffs as files, a budget and a stop at every wave, as the `orchestrate` skill says (`.claude/skills/orchestrate/`). The method for each fact is docs/RESEARCH.md: a figure by its kind (§1), a practice in layers (§8).

## 1. What it answers

Five questions, one worker each in wave 1, every claim checked in wave 2, the decisions numbered for Sean in wave 3 (§5).

1. **Demand.** Which conversions people search, by category and by pair, in relative terms from public signals, since Keyword Planner is not set up (Sean, 2026-10-19: later); where Google's own box answers and where it does not; where our edge pairs sit against the head terms.
2. **Categories and the IA.** What a general converter should have that we lack, what to merge, split, or group, and how twenty to twenty-five categories stay quick on the start and in the menu. Candidates: shoe sizes, oven gas marks, blood sugar, paper sizes, data rate, frequency, density, flow, acceleration, typography; garment size labels and tailor measurements weighed and, if no body stands behind them, set aside with the reason.
3. **Shoe sizes.** The standards (ISO/TS 19407, ISO 9407), the systems and their arithmetic on last length, the variance, how the best sites present them, the grammar people type ("us 11", "m us 11", "eu 45", a bare "size 11"), and a model our engine can hold: affine scales as Temperature's, half-size rounding, ≈ as Cooking's densities carry, a gender or system as the second value as an ingredient joins a unit. Sean, 2026-10-19: in, "a fun and cool thing we should figure out how to include".
4. **Compound quantities.** One grammar for a value in two units of one kind, heights first (`5'11"`, `5 ft 11 in`, `5ft 11`, `6'`), then stone and pounds, pounds and ounces, hours and minutes, degrees-minutes-seconds; the noise words ("tall"); the connective form the spec plans (`5 ft 11 in to cm`); the pitfalls (5.11 is not 5'11"); and the display of a pair (5′ 11″). Sean, 2026-10-19: "these kind of conversions will give us the biggest edge".
5. **The pair list and the page's shape.** What ranking converter pages are built of and what Google's policies reward or penalize, from primary sources; the common head terms as controls, measured as a group against the edge pairs (Sean, 2026-10-19); the evidence for the page's shape, which the orchestrator drafts as a spec and an artifact mock alongside (docs/SEO.md §3, step 2).

## 2. Method

- **Facts by kind** (docs/RESEARCH.md §1): a factor or a size table is defined or conventional and cited to its body; a figure nobody defines goes through the measured rule.
- **Practices in layers** (docs/RESEARCH.md §8): our own evidence first, then the standards and the established practice (normative apart from guidance), the community and its thinkers, the wild opened and tried, the one-offs; every finding carries its layer and its evidence level (measured, reasoned, asserted).
- **Roles** (docs/RESEARCH.md §4, "How the work is split"): the orchestrator writes the briefs and decides; workers gather, one question each, none seeing another's work; checkers read the cited sources themselves, never the workers' notes; handoffs are files.
- **Safety, in every brief**: downloads in the worker's own folder and scripts elsewhere, readers run with `python -I`; nothing personal in any request; no bot check or paywall bypassed, a source behind one is "could not reach"; nothing posted or submitted anywhere; the repo read, never written.

## 3. Waves and budgets

Each wave is sized before it runs and stops at its end to report what it found, what it cost, and what comes next (Sean, 2026-10-19: estimates and chunks, never full out). The precedent is Cooking's checker, about 0.7 million tokens over 255 tool calls (docs/RESEARCH.md §4). Workers run as Opus 5.5 at high effort, checkers at max, the orchestrator at whatever Sean sets (his decision 2, 2026-10-19).

| Wave        | Who                                    | Budget                                  | Estimate                  | Actual                                                    |
| ----------- | -------------------------------------- | --------------------------------------- | ------------------------- | --------------------------------------------------------- |
| 0, the plan | this session                           | no agents                               | small                     | 2026-10-19: this doc, the skill's v0, docs/RESEARCH.md §8 |
| 1, gather   | 5 workers, parallel, one question each | 150 tool calls each, writing as they go | 1.5 to 2.5 million tokens | launched 2026-10-19                                       |
| 2, verify   | 2 to 3 checkers over `claims.csv`      | 150 calls each                          | 1 to 2 million            |                                                           |
| 3, decide   | this session                           |                                         | small                     |                                                           |

A worker's files live in the session's scratchpad while it works (`demand-map-1/<worker>/`: `findings.md`, `claims.csv`, `sources.md`); at the wave's end the orchestrator copies the keepers into `docs/research/demand-map-1/<worker>/` and commits, since a scratchpad belongs to one session and the next may run on another account. Every wave ends with a save (the `save` skill), so any session picks up from "Pick up here".

## 4. The briefs

The common part every worker gets, then each worker's own. The briefs are the handoff and stay here as the record.

**Common.** You are one of five research workers for bigsmall, a static unit converter at https://bigsmall.work, its repo at the path given. The orchestrator decides; you gather and report. Read first docs/RESEARCH.md §3, §4, and §8, then only the files your brief names. Gather in the layers of §8 and give every finding its claim, its layer, its evidence level, and its source (URL, the exact words, the date read); a number without a source is not a finding. Write to your own folder: `findings.md` (the report, at most 2,500 words, the answer first), `claims.csv` (one row per claim with a source: claim, layer, evidence, URL, exact words, date), `sources.md` (every page opened and what it gave); write `findings.md` as you go so a stop leaves a file. Budget: 150 tool calls; at 120, stop gathering and write. Safety as §2. Finish with a ten-line summary: the answer, the three strongest findings with their evidence level, what you could not reach, your tool-call count, your file paths.

**Demand** (question 1). Which pairs people search most, per category we have and per candidate; what Google's own result does for each (its converter box with one answer, a knowledge answer, nothing); how large the edge searches are against the head terms (heights in feet and inches, a cup of an ingredient in grams, fractions of an inch, paces, torque); the ten head terms as controls. Signals: Google autocomplete and related searches, Trends with one fixed anchor ("cm to inches") for relative interest, the incumbents' featured and top pages and sitemaps, published keyword studies, free keyword tools reachable without an account. Output: at least 120 pair queries tiered head, mid, long, with their signal; the top 30 per group; the method's limits. Read docs/research/seo-1.md ("Where clicks still come from") and docs/UNITS-CATALOG.md.

**Categories** (question 2). The candidates' demand, fit, and the body behind each, if any; whether garment size labels and tailor measurements are conversions or lookups; how the best converters and the best-designed reference products group their categories, opened and tried at a phone's width and a desktop's; two or three groupings for twenty to twenty-five of ours with their trade-offs; what Google's box covers. Read docs/research/categories-1.md (extend it, never redo it), docs/UNITS-CATALOG.md §1 to §3, docs/PLAN.md §2 ("Grouping categories", "Sections within a category"), docs/UX-SPEC.md §1, and docs/research/findings-friends-1.md for our own evidence.

**Shoe sizes** (question 3). The standards and what each defines, quoted; the systems and the arithmetic relating each to last or foot length, with the disputes recorded (the US women's offset); half sizes, and widths named as out of scope; how five to eight sites present sizes, opened; the grammar people type; a model on last length in millimetres with half-size rounding and ≈, and where it breaks (children, brands). Read docs/RESEARCH.md §1 to §2, docs/research/cooking-2.md §1 to §2 (a figure with variance, decided and shown with ≈), docs/UX-SPEC.md §3 (Cooking: a second value joining a unit).

**Compound** (question 4). Every form found for heights, with frequency signals, then the same shape for stone and pounds, pounds and ounces, hours and minutes, degrees-minutes-seconds, and feet-inches with fractions; what six to eight converters and Google's box read when each form is typed, and how they show a pair; the writing conventions (the primes, ISO 80000 and NIST SP 811 on feet and inches); the pitfalls; the connective form and its ambiguities ("in" as inch or into). Output: a grammar in plain rules with examples that must read and must not, and a display rule. Read docs/UX-SPEC.md §2 and §14 ("Input flexibility"), docs/PLAN.md §2 ("Fractional feet and inches", "Writing fractions"), docs/research/findings-friends-1.md (the construction case).

**Pair pages** (question 5). Google's spam policies on scaled content and doorway pages and its helpful-content guidance, quoted from the primary pages, and Mueller on programmatic pages; the top five results for eight queries opened and recorded section by section (the table's values, the converter on the page or not, text length, internal links, title and description patterns, structured data, URL pattern); which sites the 2024 updates hit and which rank, with the evidence level; practitioners on programmatic pages that held; the ten most common pair terms with signals; recommendations for our shape and what to leave out. Read docs/SEO.md, docs/research/seo-1.md ("Pair pages", "Which pairs"), docs/UX-SPEC.md §1.

## 5. Decisions

Filled in wave 3, numbered, Sean's and the orchestrator's, each with where to see it, what changes, and one recommendation.

## 6. Cost and learnings

Filled at each wave's end: tokens and tool calls per agent, what a brief got wrong, what the skill learned.
