# Sources: pair pages (worker 5, wave 1)

Every page opened, all on 2026-10-19, and what it gave. Pages were read from a saved copy (`downloads/`) turned to text by `totext.py`, so the quotes in `claims.csv` are the pages' own words, not a summary.

## Google (layer 2, the normative floor)

- https://developers.google.com/search/docs/essentials/spam-policies: scaled content abuse, doorway abuse, scraping, thin affiliation; last updated 2026-08-28. The definitions and examples, quoted.
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content: the content, expertise, and people-first questions; "no preferred word count"; last updated 2026-10-05.
- https://developers.google.com/search/blog/2024/03/core-update-spam-policies (2024-03-05): the new scaled-content policy, which covers automation, people, or both.
- https://developers.google.com/search/updates/ranking: the list of updates (March 2024 core and spam, May 2026 core, and the rest).
- https://developers.google.com/search/blog/2023/08/howto-faq-changes (2023-08-08): FAQ rich results limited to government and health sites; HowTo dropped.
- https://developers.google.com/search/docs/appearance/structured-data/faqpage: now serves the changelog. FAQ rich results stopped appearing from 2026-05-07.
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide (updated 2025-12-10): folders matter for crawling only past a few thousand URLs.
- https://developers.google.com/search/docs/crawling-indexing/url-structure (updated 2025-12-10): descriptive words, hyphens.
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb (updated 2026-09-08): breadcrumbs as the page's place in the hierarchy.

## Mueller (layer 3: a Google spokesperson, statements reported on Search Engine Roundtable with the posts embedded)

- https://www.seroundtable.com/google-lose-faith-42032.html (2026-09-07; Bluesky post at https://bsky.app/profile/johnmu.com/post/3muwiaqvf5t22, not opened): the full post, quoted.
- https://www.seroundtable.com/google-technical-seo-vs-programmatic-seo-39473.html (2025-05-27; Reddit thread at https://www.reddit.com/r/TechSEO/comments/1kscb7y/, not opened).
- https://www.seroundtable.com/programmatic-seo-banner-for-spam-google-35766.html (2023-07-26 article; tweets dated 2023-07-25).
- https://www.seroundtable.com/google-thin-content-issues-33202.html (2022-04-06; office-hours video).
- https://www.seroundtable.com/tag/programmatic-seo: the index that led to the two older posts.

## Practitioners and studies (layer 2 guidance, layer 3 community)

- https://ahrefs.com/blog/programmatic-seo/ (updated 2026-09-02): thin-content risk, Lily Ray's tracking of over 70 companies caught after scaling (not opened), Ryan Law on tools, pruning after a test period.
- https://ahrefs.com/blog/biggest-traffic-losers/: Datanyze's 96 % loss of estimated traffic, concentrated in programmatic folders.
- https://backlinko.com/programmatic-seo (updated 2026-01-20): Wise's 8.5 M converter pages and why they hold; data sources ranked (proprietary, public with added value, scraped).
- https://www.searchenginejournal.com/what-400-sites-reveal-about-organic-traffic-gains/571632/ (2026-04-10): Zyppy's 400-site study, task completion 83 % vs 50 %. Third-party estimates, correlational.
- https://www.searchenginejournal.com/googles-march-core-update-shifted-visibility-away-from-aggregators/573621/ (2026-05-03): Amsive's SISTRIX data; utility sites lost ground in Germany.
- https://www.1clickreport.com/blog/google-may-2026-core-update-programmatic-seo-dead (updated 2026-09-13): vendor's claims about the May 2026 core update. A one-off, asserted.
- https://mozdev.nodebb.com/community/q/post/66563 (Moz Q&A, 2018-06-25): online tools and thin content; unitconverters.net's ~50,000 indexed pages.
- Could not reach: https://www.aleydasolis.com/en/search-engine-optimization/google-march-core-update-2026 (403); https://searchengineland.com/guide/programmatic-seo (403).

## Traffic estimates (the wild, asserted as estimates)

Similarweb pages, read through WebFetch (a direct fetch got a 202 challenge, which was not pursued), all "September 2026":

- https://www.similarweb.com/website/unitconverters.net/
- https://www.similarweb.com/website/convertunits.com/
- https://www.similarweb.com/website/calculat.io/
- https://www.similarweb.com/website/inchcalculator.com/
- https://www.similarweb.com/website/metric-conversions.org/

No time series around the 2024 updates was reachable without an account (Semrush, Ahrefs, and SISTRIX all need one), so part (c) rests on today's ranks and estimates, not on 2024's curves.

## Result pages (the wild)

- **Google** could not be reached: automated queries hit its bot check, and so did Startpage (an Anubis check). The ranks are **Bing's** (US, `cc=US`), read from the result page, plus DuckDuckGo for "cm to inches" (DuckDuckGo then hit its bot check on the next query). Bing returned off-topic results for three queries ("cups of flour in grams", "min/km to mph", "shoe size us to eu": cups, Minecraft, shoe shops). For those three the ranks come from the WebSearch tool's extended mode, a third index. Any of these may differ from Google.
- Bing result pages: queries `kg to lbs`, `5'10 in cm`, `nm to ft lbs`, `celsius to fahrenheit`, `cm to inches`, `7 cm to inches`, `70 kg to lbs`, `1 cup flour in grams` (`downloads/bing_*.html`); DuckDuckGo `cm to inches` (`downloads/ddg_cm.html`).
- Google autocomplete (https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=…) for 14 unit stems (`downloads/ac/`).

## The 42 pages opened for part (b) (`pages.csv`, `analysis.json`)

The ranks are as listed in `pages_list.tsv`. Each page gave its title, description, canonical, h1 to h3 in order, tables, inputs, word count, structured data, and internal links.

1–5 cm to inches: unitconverters.net, rapidtables.com, metric-conversions.org, thecalculatorsite.com, calculatorsoup.com.
6–10 kg to lbs: unitconverters.net, convertunits.com, metric-conversions.org, thecalculatorsite.com, rapidtables.com.
11–15 5'10 in cm: calculateme.com, inchcalculator.com, thecalculatorsite.com, calculat.io, cmtoinches.co.
16–20 cups of flour in grams: inchcalculator.com, recipesbycarina.com, thecalculatorsite.com, bakeprofit.com, pastrycal.com.
21–25 nm to ft lbs: unitconverters.net, thecalculatorsite.com, convertunits.com (two pages), omnicalculator.com.
26–30 min/km to mph: rundida.com, calculatordashboard.com, runreps.com, tokyorunclubs.com, pacepercentile.com.
31–35 celsius to fahrenheit: metric-conversions.org, calculatorsoup.com, wikihow.com, unitconverters.net, celsiusfahrenheit.co.
36–42 shoe size us to eu: atoms.com (403, could not reach), famousfootwear.com (security verification, could not reach), grivetoutdoors.com, convertshoesize.com, sizechartguru.com, then smart-calculators.net (#6) and healthyfeetstore.com (#8) in place of the two unreached pages.

## Converter index pages (part e, `downloads/homes/`)

https://www.unitconverters.net/, https://www.metric-conversions.org/, https://www.rapidtables.com/convert/index.html, https://www.thecalculatorsite.com/conversions/, https://www.inchcalculator.com/convert/, https://www.calculatorsoup.com/calculators/conversions/, https://www.convertunits.com/, https://www.omnicalculator.com/conversion. Each gave its links, which `pairs.py` normalized into unit pairs, counting how many of the eight sites link each one.

## Limits

- The word counts are of text outside `nav`, `header`, `footer`, and `aside`, so a sidebar written as a `div` is counted. They are good for comparing pages, not exact.
- "Converter on page" means a text or number input, or a select, in the static HTML. Omni's calculator is drawn by script and was judged by hand; the other judgments by hand are noted in `writepages.py`.
- Reverse-pair links were found by matching URL paths, so a link with an odd slug may have been missed.
