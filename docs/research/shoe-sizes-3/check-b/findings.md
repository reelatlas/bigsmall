# Checker B, RunRepeat's measurements: report (2026-10-21)

The report as the checker returned it, saved by the orchestrator (the `orchestrate` skill, §4). 43 tool calls, 203,313 tokens, about 16 minutes. The rows: `docs/research/shoe-sizes-3/wave2-check-b.csv` (181 rows over 173 pages, written by `wave2-select-b.py`).

**Counts.** All 181 rows were checked against RunRepeat's own pages, re-downloaded by my own script. Every row is confirmed.

| kind              | confirmed | corrected | could not reach | wrong |
| ----------------- | --------- | --------- | --------------- | ----- |
| measurements      | 168       | 0         | 0               | 0     |
| claims            | 8         | 0         | 0               | 0     |
| method statements | 5         | 0         | 0               | 0     |

**Corrected, wrong, or unreachable rows.** None. All 173 distinct pages answered the script with HTTP 200 and none redirected, so the fetcher was never needed. No bot check, login wall or paywall came up.

**Measurements.**

- **167 pages:** each prints the recorded value in both places. One is the lab section (`<section id="internal-length">`, under "Test results" beside the category average). The other is the comparison table's "Internal length" row, in the model's column. The two never disagree, and every label matches the model.
- **B-M168 (Euro Hiker):** this older review has neither the lab section nor the table. It prints the figure once, in prose: "In a men's US size 7.5, we measured the internal length of the boot at 257.9 mm." That is confirmed as recorded.

**Things the rows don't show (confirmed, but worth knowing):**

- **B-S001** joins two places on the methodology page with an ellipsis: a list item under "How we test shoes" and a paragraph in the buying section. The page writes the second "men’s" with a typographic apostrophe, so that part matches only once the apostrophe is folded.
  - The same page qualifies "we wait until it is" in its weight section: "However, in the rare cases where we cannot get US 9, we buy US 8 or 8½ and use a proprietary formula to calculate for US 9."
  - It gives that conversion for weight only. It mentions internal length only in the stack-height passage.
- **B-S003:** the claim's "measured on the cut shoe" comes from the order of the sentences, not their words. The page says "To achieve this, the shoe must be cut in half. After measuring the internal length, we mark…". The Converse size-chart page says it outright: "even cut it open to measure the internal length with a caliper."
- **B-S004:** the worker's ellipsis leaves out "to measure its widest area, toebox width, and height,".
- **B-C001 and B-S005** are the same sentence. It says "US size 9", not "men's"; the claim's summary adds "men's".
- **B-C007:** the recorded words drop the page's leading "Note:". The same note heads the internal-length section on 167 of the 168 review pages.
- **B-C002** is the caption of a figure in the guide. Any lengths are inside the image, which I did not read.
- **Character-for-character:** 12 of the 13 claim and method rows match exactly once runs of spaces are collapsed. The exception is B-S001's second part, because of the apostrophe.

**Which pages name the size in their own text.** 26 of the 168 measurement pages name the size of the tested pair.

- **25 at US 9:**
  - 22 say "men's US size 9" or "US men's 9".
  - B-M060, B-M104 and B-M123 say "US 9" or "US size 9" without "men's".
  - 21 of the 25 name it only in a weight sentence: B-M034, 035, 104, 119, 120, 123, 131, 133, 138, 139, 140, 142, 143, 148, 151, 153, 156, 157, 164, 165, 167.
  - B-M020 and B-M078 name it in a gel-mold or width sentence.
  - B-M158 names it in both a width sentence and a weight sentence.
  - B-M060 names it in a purchase sentence: "As with every shoe we test, we purchased the Nike Structure Plus in US 9 with standard width."
- **1 at men's US size 7.5:** B-M168, in the internal-length sentence itself. This is the only page that names the size in the same sentence as the internal length.
- **The other 142** name no size for the tested pair, so the size rests only on the methodology page ("We always test in men's US 9"). B-M068 mentions US 9 only as adidas's sample size for its listed stack heights.
- **Weight sentences are weak evidence.** The methodology page says all weights are "presented in men’s US size 9", calculated from a US 8 or 8½ when a 9 cannot be had. So a weight sentence gives the size the weight is stated in, not proof of the pair's size.
- **Against the worker's `line` field:** it marks B-M060, B-M104 and B-M123 as "from the methodology page", but those pages do name US 9 (without "men's").

**What RunRepeat says about the method, beyond the recorded statements** (quoted in `sources.md`; every quote was re-found in the saved copy):

- The methodology page describes cutting one shoe of each pair: the upper is cut off, then the midsole is cut "in half lengthwise" with a band saw.
- It says "The black lines visible on the midsole mark 12% and 75% of the shoe's internal length", and that the heel and forefoot stack heights are measured at those points.
- The Timberland size chart says "we measure the internal length as well as the toebox dimensions of each model in our lab."
- No page describes the internal-length measurement itself: where the caliper sits, along which surface, or how many readings. The methodology page has no internal-length test of its own.
- The review pages carry no other prose about internal length.
- On 76 of the 167 lab-layout pages, the section has an image whose alt text is "<brand> <model> Internal length". It is probably a photo of the measurement; I did not read the images.

**Members-only.** No page marks any figure as members-only. A strict search for members-only, unlock, sign-in-to-see, paywall and subscriber wording found nothing, and the internal-length markup has no lock or blur class. A looser search did hit "premium" and "locked", but they were shoe descriptions ("premium price point", "locked-in feel"), plus newsletter state in the pages' script data.

**What the check notes asked that I could not do.** Nothing in the rows was blocked. Three limits:

- I read no images (B-C002's figure and the 76 internal-length photos).
- Sizes were found by a pattern search of each page's visible text, and I read every match. A size written out in words ("size nine") would have been missed.
- Two matches turned out to be the pronoun "us" ("took us 18.2N"), not the US scale, and I discarded them.

## Summary

1. **Answer:** all 181 rows are confirmed against RunRepeat's own pages; nothing is corrected, wrong, or unreachable.
2. **Strongest finding 1:** every one of the 167 lab-layout reviews prints the recorded internal length twice, in agreement, in the model's column. The Euro Hiker prints its 257.9 mm once, in prose, at men's US 7.5.
3. **Strongest finding 2:** only 26 of 168 pages name the tested size themselves, and 21 of those only through weight sentences. For 142 pages the men's US 9 rests on the methodology page alone.
4. **Strongest finding 3:** the methodology page admits buying US 8 or 8½ when a 9 cannot be had, and gives the conversion for weight only. Every review section also carries RunRepeat's own caveat that internal length "is not a great measure of fit".
5. **Not reached:** nothing; all 173 pages returned 200 to the script. Images were not read.
6. **Tool calls:** 43 of the 80 budget.
7. **Files:** `check-b/check.csv` (one row per row), `check-b/sources.md`, the scripts in `check-b/scripts/`, and the working files `fetch_log.csv`, `parsed.csv`, `sizes.txt`, `claims_found.csv`, `claims_decisions.json`, `method_contexts.txt`.
