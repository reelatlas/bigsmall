# Pair pages: their shape and the list's controls (worker 5, wave 1, 2026-10-19)

Delivered as the worker's reply and saved here by the orchestrator. Written from the folder's claims.csv, pages.csv, analysis.json, analysis.txt and sources.md, with no further web calls. Every quote is in claims.csv with its URL and date read (2026-10-19). Lines marked "(reasoned)" are the worker's own reasoning.

## The answer

A pair page breaks Google's rules in one of two ways:

- **Doorway:** the useful part is somewhere else. Google's words are "funnel visitors into the actual usable or relevant portion of a site".
- **Scaled content:** the pages are "substantially similar", sit outside "a clearly defined, browseable hierarchy", or carry generated filler.

A page avoids both when:

- the converter works on the page itself;
- the page says things specific to the pair: the exact factor and its source, the values people search, and the pitfalls real for that pair;
- it sits in a hierarchy of category pages and breadcrumbs.

Google sets no word count.

The pages that rank are plainer than the guidance suggests. The big converter sites (unitconverters, rapidtables, metric-conversions, convertunits) hold the top spots for the common pairs in Bing with pages that:

- run 500 to 1,100 words;
- often carry no structured data;
- cite no standard.

What they all share is a converter at the top, a values table, a how-to with the formula, and links to the reverse pair and the category.

bigsmall has two things no big site's pair page shows: every unit of the category at once, and a factor cited to NIST. One finding the plan hasn't met yet: for a height ("5'10 in cm"), all five of Bing's top results are pages for that one height.

## 1. Google's policies

### Spam policies (developers.google.com/search/docs/essentials/spam-policies, updated 2026-08-28; normative)

**Scaled content abuse:** "when many pages are generated for the primary purpose of manipulating search rankings and not helping users. This abusive practice is typically focused on creating large amounts of unoriginal content that provides little to no value to users, no matter how it's created." The example closest to us: "Creating many pages where the content makes little or no sense to a reader but contains search keywords."

**Doorway abuse:** "when sites or pages are created to rank for specific, similar search queries. They lead users to intermediate pages that aren't as useful as the final destination." The examples closest to us:

- "Generating pages to funnel visitors into the actual usable or relevant portion of a site"
- "Creating substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy"

**The March 2024 announcement** (blog, 2024-03-05) says the scaled policy applies "no matter whether content is produced through automation, human efforts, or some combination of human and automated processes." Writing pages by hand is no defence; value is.

### Creating helpful content (updated 2026-10-05; normative guidance)

- "Does the content provide substantial value when compared to other pages in search results?"
- Warning signs:
  - "Are you using extensive automation to produce content on many topics?"
  - "Does your content leave readers feeling like they need to search again to get better information from other sources?"
  - "Are you writing to a particular word count ... (No, we don't.)"
- Trust: "clear sourcing", and "Does the content have any easily-verified factual errors?" Cited factors answer both.

### John Mueller, Google's search advocate (asserted; reported by Search Engine Roundtable with the posts embedded)

| Date       | Where        | What he said                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2022-04-06 | office hours | Thin content "usually that applies more to to the overall website ... the website overall is very light on actual information." On word count: "I wouldn't use it as a metric."                                                                                                                                                                                                                                                                                                                   |
| 2023-07-25 | X            | "programmatic SEO is often a fancy banner for spam", then "To be fair, programmatic SEO is not always spam."                                                                                                                                                                                                                                                                                                                                                                                      |
| 2025-05-27 | Reddit       | "I wouldn't group programmatic SEO together with technical SEO..."                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-09-07 | Bluesky      | About a site built from every combination of a list: "Programmatic SEO like this often leads to a site that's either spam, borderline spam, or low quality. It's easy to spin something up with many pages, it's hard to provide real value to users." Also: "Expanding it with even more generated data ("what does php mean?" etc) doesn't make it more useful for users." And: "Our systems have possibly lost faith in your site ... Resolving this tends to take time & significant effort." |

### Other Google pages that bear on the shape (normative)

- FAQ rich results "will no longer appear in Google Search starting May 7, 2026" (FAQPage documentation changelog). From 2023-08-08 they had been limited to government and health sites, and HowTo results were dropped.
- Breadcrumbs show "the page's position in the site hierarchy" (documentation updated 2026-09-08).
- Folders affect crawling only "if you have more than a few thousand URLs" (SEO Starter Guide, updated 2025-12-10). Google also asks for readable, hyphenated words in URLs.

### What puts a pair page on the wrong side (reasoned from the quotes)

1. **Every combination:** a page for each pair a list allows, rather than for the pairs people search.
2. **Funnelling:** the page's useful part is a link to the real tool.
3. **Near-sameness:** pages that differ only in the swapped names and numbers, with no hierarchy around them.
4. **Filler:** generated definitions repeated across many pages, Mueller's "what does php mean?".
5. **The damage spreads:** Google judges the whole site, and recovery is slow (Mueller 2022 and 2026), so a weak batch puts the converter's own page at risk too.

## 2. The wild: eight queries, 40 pages reached

**Method.** Google's result pages could not be reached: automated queries hit its bot check, and so did Startpage's. The ranks come from Bing US for five queries. For flour, pace and shoes, Bing returned off-topic results, so those ranks come from the search tool's extended index. Neither index is Google.

Each page was saved and parsed for:

- headings in order, tables, inputs, and words outside nav, header, footer and aside;
- JSON-LD and microdata;
- internal links and canonical tags.

All of this is measured and in pages.csv.

**Across all 40:**

- Every page has one h1, naming the pair or the question.
- Text runs a median of about 1,000 words (quartiles 570 and 1,620).
- 16 have no structured data. FAQPage is on 15, BreadcrumbList on 18, WebApplication or SoftwareApplication on 9.
- Only 5 cite a standard or primary source.

### cm to inches

**Results:** unitconverters, rapidtables, metric-conversions, thecalculatorsite, calculatorsoup.

**Sections, in order:**

1. the converter;
2. a definition of each unit;
3. how to convert, with the formula and an example;
4. the table;
5. popular and related conversions.

thecalculatorsite adds questions as headings ("How many inches are in 30 cm?").

**Tables:**

- unitconverters: 11 rows (0.01, 0.1, 1, 2, 3, 5, 10, 20, 50, 100, 1000).
- rapidtables: 21 rows, with decimal and fraction columns.
- thecalculatorsite: 1 to 10, then 25 to 90 by 5.
- metric-conversions: links its table on its own URL (`…-table.htm`).
- calculatorsoup: none in the HTML.

**Other measures:**

- **Converter:** 5 of 5.
- **Words:** 683 to 1,311.
- **Reverse-pair link:** 4 of 5.
- **Internal links:** 19 to 175.
- **Titles:** "Convert cm to inches", "CM to Inches Converter", "cm to inches (cm to in) | centimeters to inches".
- **Descriptions:** say what the tool does, and that a table and steps follow.
- **Structured data:** unitconverters and metric-conversions none; thecalculatorsite FAQPage; calculatorsoup SoftwareApplication and BreadcrumbList.
- **URLs:** a category folder plus a pair slug: `/length/cm-to-inches.htm`, `/convert/length/cm-to-inch.html`, `/conversions/common/cm-inches.php`.

### kg to lbs

**Results:** unitconverters, convertunits, metric-conversions, thecalculatorsite, rapidtables.

**Sections:** the same order as cm to inches.

**Tables:**

- unitconverters: 11 rows.
- thecalculatorsite: 50 to 149 kg one by one, the range people weigh.
- rapidtables: 22 rows, with a pounds-and-ounces column.

**Other measures:**

- **Converter:** 5 of 5.
- **Words:** 501 to 1,508; convertunits is the lowest.
- **Reverse-pair link:** 5 of 5.
- **Description pattern** (convertunits): "Do a quick conversion: 1 kilograms = 2.2046226218488 pounds".
- **Structured data:** almost none.
- **URLs:** folder plus slug, and convertunits' `/from/kg+/to/lb`, which serves any combination of units.

### 5'10 in cm

**Results:** calculateme, inchcalculator, thecalculatorsite, calculat.io, cmtoinches.co. All five are pages for that one height. A second index agrees: 5 of its top 6.

**Sections, in order:**

1. a question h1 ("What is 5' 10" in Centimeters?");
2. the answer;
3. how to convert;
4. a chart of nearby heights;
5. similar heights.

**What some add:**

- calculateme: a table of average heights by sex, 4′11″ to 6′4″.
- thecalculatorsite: "Facts and statistics" and a height comparison.

**Tables:** the 11 neighbouring heights (5'5" to 6'3") on inchcalculator and thecalculatorsite; 4'7" to 7' on calculat.io.

**Other measures:**

- **Converter:** 5 of 5.
- **Words:** 128 to 1,013.
- **Reverse link:** 4 of 5 link cm to feet.
- **Structured data:** BreadcrumbList on inchcalculator and calculat.io; FAQPage on thecalculatorsite; none on calculateme.
- **URLs:** `/5-ft-10`, `/height-converter/5ft-10in/`, `/conversions/height/5ft-10in`.

### Cups of flour in grams (extended index)

**Results:** inchcalculator, recipesbycarina, thecalculatorsite, bakeprofit, pastrycal.

**Converter:** 3 of 5. The recipe blog and bakeprofit's article have none.

**Tables:**

- inchcalculator: 5 to 100 g, all-purpose and bread flour.
- thecalculatorsite: 14 ingredients by cup fractions.
- pastrycal: flour types with a source column, measuring methods, and cup sizes by country.

**Other measures:**

- **Words:** 442 to 1,998.
- **Reverse link:** 1 of 5.
- **Descriptions** state the figure ("1 cup all-purpose flour = 125g").
- **Structured data:** FAQPage on 3, plus Article or BlogPosting.
- **Sources:** thecalculatorsite cites NIST and King Arthur; pastrycal cites USDA and King Arthur.

### Nm to ft lbs

**Results:** unitconverters (filed under energy), thecalculatorsite, convertunits (two pages), Omni.

**Tables:**

- unitconverters: 11 rows.
- thecalculatorsite: 22 rows, 10 to 200 Nm.
- Omni: 11 rows each way, 1 to 100.

**Other measures:**

- **Converter:** 5 of 5; Omni's is drawn by script.
- **Words:** 323 to 1,392.
- **Reverse link:** 4 of 5. Omni instead carries both directions' tables.
- **Structured data:** Omni has FAQPage, Article and Person; the others none.

### min/km to mph (extended index)

**Results:** rundida, calculatordashboard, runreps, tokyorunclubs, pacepercentile. All are newer single-purpose running sites.

**Converter:** 4 of 5, each converting min/km, min/mi, km/h and mph at once. pacepercentile is a chart page.

**Tables:** paces from 3:30 to 10:00 per km, and race benchmarks.

**What they add:** effort zones, finish times, and treadmill charts.

**Other measures:**

- **Words:** 561 to 2,972.
- **Reverse link:** none. Every direction is on the one page.
- **Structured data:** FAQPage on all 5, WebApplication or SoftwareApplication on 4.
- **Sources:** tokyorunclubs cites NIST SP 811.

### Celsius to fahrenheit

**Results:** metric-conversions, calculatorsoup, wikihow, unitconverters, celsiusfahrenheit.co.

**Tables:**

- wikihow: −40 to 100 by 10.
- unitconverters: 11 rows.
- celsiusfahrenheit.co: reference temperatures with what each means, plus 1 to 99.
- metric-conversions: the table on its own URL.

**Other measures:**

- **Converter:** 4 of 5; wikihow is unclear.
- **Words:** 432 to 2,727.
- **Reverse link found:** 2 of 5.
- **Structured data:** HowTo on calculatorsoup, wikihow and celsiusfahrenheit.co; FAQPage on celsiusfahrenheit.co; none on metric-conversions and unitconverters.
- **Sources:** celsiusfahrenheit.co cites BIPM and ITS-90.
- **Titles** carry "°C to °F".

### Shoe size US to EU (extended index)

**Results:** atoms.com (403) and famousfootwear (security check) could not be reached. The pages reached are grivetoutdoors, convertshoesize, sizechartguru, plus smart-calculators (#6) and healthyfeetstore (#8) in place of the two.

**Tables:** charts by sex and age, US 4 to 16 in 17 to 22 rows. smart-calculators adds foot length in cm.

**Other measures:**

- **Converter:** 4 of 5; the store page has none.
- **Words:** 552 to 3,084.
- **Reverse link:** none.
- **Structured data:** FAQPage on 2 of 5, BreadcrumbList on 3.
- **Sources:** smart-calculators cites ISO/TS 19407 and NIST SP 811.

### Value queries (Bing, measured)

- **"7 cm to inches":** single-value pages hold 5 of the top 8, but unitconverters' pair page is #2.
- **"70 kg to lbs":** rapidtables is #3 with `?x=70`, which gives the page a value title and has no canonical tag.

**Pattern (reasoned):** the big sites rank on age, links, and a converter at the top. Only the newer sites cite sources and carry heavy markup. In the newer categories (pace, shoes) the pages that rank convert every way at once, as bigsmall's table does.

## 3. The 2024 updates: who was hit, who kept ranking

- **No converter site is shown as hit by a 2024 update.** No Google statement, measured study, or practitioner post naming one was found. Google's update list confirms the March 2024 core and spam updates, and a May 2026 core update (measured).
- **Kept ranking (measured, Bing, today):**
  - unitconverters is #1 for cm to inches, kg to lbs, and Nm to ft-lb;
  - rapidtables, metric-conversions, thecalculatorsite, calculatorsoup, and convertunits fill the rest of the top five.
- **Similarweb, September 2026 (estimates):**

  | Site               | Visits, last 3 months | Share from search (desktop) |
  | ------------------ | --------------------- | --------------------------- |
  | unitconverters     | 3.4 M                 | 84%                         |
  | metric-conversions | 1.3 M                 | 72%                         |
  | calculat.io        | 1.4 M                 | 79%                         |
  | inchcalculator     | not shown             | 79%                         |

  Each was within about 3% of the month before.

- **The one fall (estimate):** convertunits.com, "decreased by 46.28% compared to last month", its rank falling from 101,088 to 167,584. Its model is a page for any combination of units, the pattern Mueller describes. That link is the worker's reasoning, not shown.
- **Nearest measured signals:**
  - Over the March 2026 core update, "online shops and utility sites lost ground" in SISTRIX's German data (Amsive, via Search Engine Journal, 2026-05-03; a visibility index, not traffic).
  - Zyppy's 400-site study (via SEJ, 2026-04-10; correlational, on traffic estimates): "83% of winners let users complete the task they searched for, versus 50% of losers."
- **Asserted only:** a vendor blog (1ClickReport, 2026-09-13) says the May 2026 update cut template pages "-40% to -90%" and that tools existing "only to rank for 'X calculator' with no actual utility are also getting flagged".
- **A non-converter case** (Ahrefs, estimate): Datanyze lost 96% of its traffic, mostly in its template-built folders.

## 4. Practitioners on programmatic pages that held

| Advice                                      | Source and words                                                                                                                                                                                                                                                                          | Reason                                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Do the task on the page                     | Backlinko (2026-01-20): Wise's 8.5 M currency pages "include real-time rates, interactive calculators, historical charts ... Not just basic templated text with a CTA." Ahrefs (2026-09-02): "a calculator is a lot harder for Google to summarize out of existence than a paragraph is." | People searched to get something done; a page that does it can't be replaced by an AI summary |
| Something unique on each page               | Backlinko: "Without unique, valuable information, you're just going to create thin pages Google will eventually demote." With public data, "how you present it is absolutely key." Ahrefs: scale "is only a risk if you don't have anything worth publishing at scale."                   | Unit factors are public, so presentation and citation are where the value is                  |
| Prune after a test period                   | Ahrefs: "remove or de-index pages that still earn nothing after a fair testing period."                                                                                                                                                                                                   | Matches docs/SEO.md §3.4                                                                      |
| Old head start, not shape (community, 2018) | Moz Q&A: unitconverters ranked #1 with about 50,000 thin pages, "admittedly, this may be due to other factors"; the art is to "give a search result with context without spinning out too much thin content."                                                                             | The big sites' lead doesn't transfer to a new site                                            |
| Hubs and links (asserted)                   | Lower-tier guides recommend a hub page linking out to every pair page; none was strong enough to cite                                                                                                                                                                                     | Agrees with the doorway policy's "browseable hierarchy"                                       |

## 5. The ten controls

The signals are how many of eight big converter sites' index pages link the pair (measured), and its place in Google autocomplete for its stem (measured).

| #   | Pair                  | Index pages linking it | Autocomplete                  |
| --- | --------------------- | ---------------------- | ----------------------------- |
| 1   | cm to inches          | 7 of 8                 | 2nd for "cm to"               |
| 2   | inches to cm          | 7                      | 1st for "inches to"           |
| 3   | kg to lbs             | 6                      | 2nd for "kg to"               |
| 4   | lbs to kg             | 6                      | 1st for "lbs to" (as "kilos") |
| 5   | celsius to fahrenheit | 6                      | 1st for "celsius to"          |
| 6   | fahrenheit to celsius | 6                      | 1st for "fahrenheit to"       |
| 7   | feet to meters        | 6                      | 1st for "feet to"             |
| 8   | meters to feet        | 6                      | 1st for "m to"                |
| 9   | mm to inches          | 5                      | 2nd for "mm to"               |
| 10  | km to miles           | 4                      | 3rd and 4th for "km to"       |

Alternates: cm to feet (4 of 8, 1st for "cm to"), ft to in (5), g to oz (5), miles to km (4), oz to g (4).

## 6. Recommendations for bigsmall's page shape

### Sections, in order

1. **The h1:** the pair in words, "Centimeters to inches", with "cm to in" in the title.
2. **The answer line:** "1 in = 2.54 cm exactly (NIST SP 811); 1 cm ≈ 0.3937 in".
3. **bigsmall's own box and table**, opened on the pair.
4. **The values table.**
5. **How to convert:** the formula and one worked example.
6. **Pitfalls**, only where the pair has a real one.
7. **Links:** the reverse pair, related pairs, and the category, with a breadcrumb.

The converter sits near the top because every ranking page puts it there and it is the task. The cited factor goes above it because no big site shows one (reasoned).

### The values table

- 15 to 25 rows of values people search (from autocomplete, later Search Console), never a fixed 1-to-100 run.
- A decimal column, plus a fraction column for inches, as rapidtables has.
- Height pairs get a feet-and-inches grid, 4′10″ to 6′6″.
- Plain HTML in the page, not drawn by script or moved to its own URL as metric-conversions does (reasoned).
- An anchor on each row, so a value search can land on its row (reasoned).

### The text

The big sites rank on 500 to 1,100 words, the table and controls included, and Google sets no count. Write 150 to 400 words for the pair:

- the exact definition and its standard;
- the pitfall that's real for that pair: US vs UK gallons, the troy ounce, kgf·m vs N·m, a temperature change vs a temperature;
- one line on where the pair comes up.

Never a generic "What is a centimeter?" paragraph repeated on every page; that is the filler Mueller names. Where a definition helps, generate it from core's data.

### The URL

**`/cm-to-inches/`**, flat, as docs/SEO.md already says, with the trailing slash `/about/` has.

- At 50 to 100 pages, folders make no crawling difference (Google's starter guide).
- A flat address survives a regrouping of categories (question 2 may regroup them), and the breadcrumb carries the category (reasoned).
- Slugs use the words people type; "lbs" vs "pounds" is settled by the demand worker's volumes.

### Reverse pairs

A separate page for each direction, written for that direction, linked both ways with a swap control. 13 of the 15 cm, kg, and Nm pages link their reverse, and autocomplete shows the two directions as separate searches.

### Category hubs

One page per category (`/length/`), with the converter opened on the category, every pair page listed, and a breadcrumb back to it from each pair page. This is the "browseable hierarchy" the doorway policy describes. Hubs ship in the same batch as the pair pages.

### Structured data

- Add BreadcrumbList.
- Keep the site's WebApplication.
- Leave out FAQPage, which Google stopped showing on 2026-05-07, and HowTo, which it no longer shows.

### What to leave out

- **Pages per value** (docs/SEO.md §3.5) stay out, with one open question for Sean on heights. The worker's recommendation: one "feet and inches to cm" page with the full grid and an anchor per height, read against Search Console, before any page per height.
- **Value-in-the-address URLs** stay out of the index, with the canonical tag as now.
- **Clutter:** app banners, "Download our app", and lists of 100 or more pair links (reasoned).

### What to keep from bigsmall's page

- **The one box and its table, opened on the pair.** It shows every unit of the category, which no big site's pair page does, and it is the defence against the doorway rule.
- **Display's fractions, and Copy URL.**
- **The heading change the SEO contract plans:** the wordmark becomes a link and the pair becomes the h1.
- **The factor and its source rendered from core's data**, as About's "Every formula" is, so the page and the math can't drift.

### The batch

- Ship the controls, the edge pairs, and the hubs together.
- Measure for 8 to 12 weeks, then prune (docs/SEO.md §3.4; Ahrefs agrees).
- Mueller's site-wide warning argues for a first batch small enough to review every page by hand (reasoned).

## The worker's summary

1. **Answer:** a pair page is safe when the converter works on the page, the text is specific to the pair, and a category page sits above it. Funnelling to a tool, near-identical pages, and filler are what break the rules.
2. **Strongest, normative (asserted policy):** the doorway examples name "Generating pages to funnel visitors into the actual usable or relevant portion of a site" and "substantially similar pages" without "a clearly defined, browseable hierarchy". Mueller (2026-09-07) says the lost trust is site-wide and slow to regain.
3. **Strongest, measured (Bing):** the big sites rank with plain pages: a converter, an 11 to 22 row table, a formula, a reverse link, 500 to 1,100 words. Only 5 of 40 pages cite a standard and no big site does, so a NIST-cited factor sets bigsmall apart.
4. **Strongest, measured (Bing plus a second index):** for "5'10 in cm", all five of Bing's top results are single-height pages. For "7 cm to inches" a pair page ranks #2. The no-page-per-value rule holds, with heights left to Sean.
5. **2024 updates:** no converter is shown as hit; the big sites still rank. convertunits' 46% monthly fall is an estimate.
6. **Could not reach:** Google's own result pages, Startpage's, and DuckDuckGo's after one query (bot checks); atoms.com and famousfootwear.com; Aleyda Solis's March 2026 analysis and Search Engine Land's guide (403); any 2024 traffic history (account needed).
7. **Tool calls:** about 105 of 150.
8. **Files:** claims.csv (59 rows), pages.csv (42 rows, 40 reached), sources.md; supporting: analysis.json, analysis.txt, pages_list.tsv, the scripts, and downloads/.
9. **Caveat:** pages.csv's "converter on page" column says yes for any page with an input. On a few blog and shop pages that input is site search, so check before quoting it.
10. **Cost (the orchestrator's record):** the harness reported about 270,000 tokens for the gathering sitting and 281,000 for the sitting that delivered this report.
