# Shoe sizes 2: the brands' own charts against ISO 19407

v0.1, 2026-10-20. A research pass by the `orchestrate` skill, wave 0 (the plan) written before any agent runs, so a fresh session on any account can pick it up. It follows docs/research/shoe-sizes-1.md, which holds ISO/TS 19407's tables as the engine holds them (ADR 0027), and answers Sean's ask of 2026-10-20 (the findings log, the hundred-and-seventh and hundred-and-eighth passes): ISO stays the default benchmark, and if we know how each brand compares against it we can give visitors shopping for a brand "really accurate info", a hint first and a brand to choose later.

## 1. What it answers

1. **Coverage.** Which systems and regions a brand's own chart covers (US men's, US women's, UK, EU, Japan or CM, China, Korea, Australia, Mexico, children's), and whether the brand gives a foot length per size, in centimetres or inches, which is what ties a chart to ISO's rule.
2. **What is only partly known.** Which brands publish charts for some audiences or regions and not others; where a brand's sites by region disagree; where a chart is an image, a PDF, or behind a page a fetcher cannot reach.
3. **Reliability.** What the brand itself says of its chart ("approximate", "size up between sizes"); whether its foot length is the foot's or the last's; whether two of its charts contradict each other; and whether a chart can be read at all without guessing (an image read by eye is flagged as such).
4. **What full data can be sourced.** For which brands a complete foot-length chart exists on the brand's own site, so a delta against ISO can be computed size by size, and for which only cross-system offsets exist (US to EU with no foot length), so the delta is an offset alone.

The product shape it feeds, in order, each on Sean's go: a hint per brand (the line under the table, or a unit's note: "Nike marks EU a size above ISO; its women's are men's + 1.5"); then a brand to choose once in Shoe size, the second value in the box as Cooking's ingredient is (ADR 0027, decision 6), the table showing the brand's chart, named as the brand's; brand against brand through the foot length where both charts give one. No setting for one category (Sean, 2026-10-20).

## 2. Method

- **The kind of fact.** Conventional (docs/RESEARCH.md §1): each brand's chart is the brand's own table, cited to its page, named as the brand's, never averaged with another's or with ISO's. The delta against ISO is computed from the data, never typed: per size, the brand's foot length for a marked size against ISO's for the same size, where the chart gives feet; else the brand's cross-system offsets against ISO's.
- **Only the brand's own page counts** as the record of its chart. A retailer's copy is a lead, noted as such, never the record. A page that refuses the fetcher (a 403, a bot check, a login) is "could not reach", never bypassed; a page the harness's fetcher reads after a script's request was refused is read, and the row says which tool read it.
- **Every cell as printed.** Thirds (40.7), halves, suffixes (13.5C, 1Y), ranges, blanks. A chart in an image is transcribed from the image and flagged; a figure read by eye is never trusted alone (docs/LEARNINGS.md, 2026-10-19).
- **Blind.** The workers are told nothing of ISO's numbers or of each other's work; the orchestrator gathers nothing itself. A checker reads the cited pages fresh, from the claims alone.
- **The data file.** `docs/research/shoe-sizes-2/brands.py` will hold every chart kept, brand by brand, with the deltas computed by a script, and a generator will write whatever core carries (a hint's words, later a chart); the research doc's figures are written from it (docs/RESEARCH.md §4).

## 3. Waves and budgets

Workers run as Opus 5.5 at high effort, checkers at max (the demand map's run, 2026-10-19). Each wave stops at its end with the actuals here and a save.

| Wave        | Who                                                    | Budget                                                            | Estimate                                                                       | Actual |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------ |
| 0, the plan | this session                                           | no agents                                                         | small                                                                          |        |
| 1, gather   | 2 workers, parallel, ten brands each                   | 150 tool calls each, gathering stopped at 120, writing as they go | 0.5 to 1 million tokens; the demand map's workers ran 0.25 to 0.5 million each |        |
| 2, verify   | 1 or 2 checkers over the kept charts' cells and claims | 60 to 80 calls each                                               | 0.3 to 0.6 million                                                             |        |
| 3, decide   | this session                                           | no agents                                                         | small: the data file, the deltas, the hint's words, the decisions for Sean     |        |

The workers' files live in the session's scratchpad while they work (`shoe-sizes-2/brands-a/`, `brands-b/`: `charts.csv`, `claims.csv`, `sources.md`, `downloads/`, `scripts/`); each report comes back as the text of the reply and is saved as `findings.md`; at the wave's end the keepers are copied into `docs/research/shoe-sizes-2/<worker>/` and committed.

## 4. The briefs

Both workers get the same brief but for the brands. Worker A: Nike, Adidas, New Balance, Puma, Asics, Converse, Vans, Skechers, Reebok, Under Armour. Worker B: Clarks, Dr. Martens, Birkenstock, Timberland, UGG, Crocs, Hoka, On, Brooks, Salomon.

> **Goal.** For each brand named, read the brand's own official shoe size chart or charts on the brand's own site and record every cell exactly as printed, with the foot length per size where the chart gives one, so bigsmall can compute how each brand's chart differs from ISO 19407's foot-length rule and say so to visitors.
>
> **Ruled out.** A retailer's or a third party's copy as the record of a brand's chart (note one in sources.md as a lead, flagged, only where the brand's own page cannot be reached); any average of charts; any cell guessed, remembered, or inferred; widths (note only that a chart has them). Never edit a file of the repository, never run pnpm or git.
>
> **Read first, and nothing else from the repo:** docs/RESEARCH.md §1 to §4 (the kinds of fact, what a source is, the process); docs/research/shoe-sizes-1.md §1 and §2 (what the engine already rests on, and the pages opened on 2026-10-19).
>
> **Method, per brand.** (1) Find the brand's size chart page or pages on the brand's own domain, by web search and then by fetching the page. (2) For every chart on it: the audience (men, women, unisex, kids: C, Y, toddler, infant), the site and region (nike.com/us, nike.com/gb), the columns it gives (US M, US W, UK, EU, JP or CM, CN, KR, AU, MX, foot length in cm or in, any other label, exactly as the chart names it), and every row's cells exactly as printed, thirds, halves, suffixes, and blanks included. (3) The exact words of any disclaimer or advice on the page ("approximate", "size up"). (4) Whether the page says its length is the foot's, the last's, or the insole's. (5) The URL, the date read, and which tool read it (the harness's fetcher, a script, a browser). (6) A second region's site of the same brand where reachable, and whether its chart differs, where. (7) A page that refuses (403, timeout, bot check, login, paywall) is "could not reach", never bypassed; a chart in an image is transcribed from the image and flagged "read from an image".
>
> **Output files**, in `<scratchpad>/shoe-sizes-2/<worker>/`, written by your own scripts as you go: `charts.csv` (brand, site, chart, column, row, value, url, date_read, tool, notes: one row per cell, `column` the chart's own column name, `row` the row's index from 1); `claims.csv` (claim, evidence level, url, exact words, date read) for every fact that is not a cell: a disclaimer, foot against last, an offset the page states in words, a regional difference, a page not reached; `sources.md` (every page opened, in order, and what it gave); downloads in `downloads/` (the saved HTML, PDF, or image of every chart kept), scripts in `scripts/`, never beside them, and every reader run with `python -I`.
>
> **Budget.** 150 tool calls; stop gathering at 120 and write.
>
> **Safety.** Nothing personal (no email address, no name) in any request, header, or form; no bot check, CAPTCHA, login wall, or paywall bypassed; nothing posted, submitted, or signed up for anywhere; downloads only in your downloads folder; the repository read and never written.
>
> **Reply with** the report itself as text (at most 2,500 words): the answer first; then per brand, what charts exist, which columns, whether foot lengths are given and as what, the disclaimers' words, regional differences, and reachability; then the four questions of the plan: coverage by system and region across the brands, what is only partly known, the reliability signals, and for which brands a full foot-length chart exists against offsets alone. Then ten lines of summary: the answer, the three strongest findings with their evidence level, what could not be reached, the tool-call count, the file paths.

The checker's brief is written at wave 2 from the kept charts: `check.csv` with a `check` note per row (re-download the page, re-read the cell, a chart image measured), never the workers' notes.

## 5. Decisions

To come at wave 3: numbered for Sean, each with where to see it, what changes, and one recommendation.

## 6. Cost and learnings

To come at each wave's end.

## 7. Wave 1: what the workers found

To come.
