# Sources opened (worker 2, categories and the IA), 2026-10-19

Every page read on 2026-10-19. "Script" means opened in headless Chromium (the repo's Playwright browsers, driven from a script in this folder) at 390 x 844 (touch, mobile) and 1280 x 800, a screenshot and the visible headings, links, selects, and the first 25 Tab stops saved in `downloads/wild-*.json`.

## Layer 1, our own evidence

- Repo docs, read only: docs/RESEARCH.md §3, §4, §8; docs/research/demand-map-1.md §1, §4; docs/research/categories-1.md; docs/UNITS-CATALOG.md §1 to §3; docs/PLAN.md §2 (Grouping categories, Sections within a category); docs/UX-SPEC.md §1; docs/research/findings-friends-1.md. Gave the 16 categories, the menu's two columns, the friends' favorites request, the deferred list.
- https://bigsmall.work/ (script, `ours.cjs`): measured the start's 16 tiles (2 across at 390 px, 380 px tall; 4 across at 1280 px, 188 px) and the open menu (16 radios, 2 columns, 44 px rows, 352 px). Screenshots `downloads/ours_*.png`.

## Layer 2, standards (normative) and guidance

- https://www.w3.org/TR/WCAG22/ : 1.4.10 Reflow wording. 2.5.8 and 3.2.3 not reached in the fetched part.
- https://www.w3.org/TR/css-values-4/ : absolute lengths (in, pt, pc, px).
- https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9 : headings of B.9, standard gravity, ft/s2.
- https://webbook.nist.gov/cgi/cbook.cgi?ID=C50997&Units=SI (curl): glucose molar mass 180.1559.
- https://ngsp.org/ifccngsp.asp (curl; WebFetch failed on its certificate): HbA1c master equation, eAG regression.
- https://www.sis.se/en/produkter/clothing-industry/footwear/isots194072015/ : ISO/TS 19407:2015 scope, withdrawn, replaced by ISO 19407:2023.
- https://www.sis.se/en/produkter/precision-mechanics-jewellery/jewellery/ss-en-iso-86532026/ : ISO 8653 scope.
- https://www.sis.se/en/produkter/clothing-industry/clothes/ss-en-iso-8559-22020/ : ISO 8559-2 scope (body, not garment, dimensions).
- https://www.sis.se/en/produkter/paper-technology/paper-products/general/sseniso2162007/ : ISO 216 scope.
- https://knowledge.bsigroup.com/products/method-for-measuring-and-designating-the-size-of-rings-used-in-jewellery : BS 6820:1987 withdrawn 1993.
- https://www.nngroup.com/articles/flat-vs-deep-hierarchy/ : flat vs deep (Whitenton, 2013).
- https://www.nngroup.com/articles/menu-design/ : menu checklist (Laubheimer, 2024).
- https://www.nngroup.com/articles/mega-menus-work-well/ : group labels, all visible (Nielsen and Li, 2017).
- https://www.nngroup.com/videos/hicks-law-long-menus/ : summary only; no transcript; little use.
- https://www.microsoft.com/en-us/research/publication/web-page-design-implications-memory-structure-scent-information-retrieval/ : Larson and Czerwinski 1998 abstract.
- https://www.cs.ubc.ca/labs/edapt/papers/findlater2004.pdf (curl, text pulled by `pdftext.py`): static vs adaptive vs adaptable menus.

## Layer 3, community

- Hacker News via the Algolia API (curl): three comment searches; the thread https://news.ycombinator.com/item?id=42115453 (Show HN, betaconvert, 2024-11-12) read whole: the pair-page arrival claim, a natural-language preference, an objection to a page per category.

## Layer 4, the wild (opened and tried)

- https://support.google.com/websearch/answer/3284611?hl=en : Google's conversions list and units table (two reads).
- https://www.google.com/search?q=unit+converter (script): a challenge page; could not reach. Not retried.
- https://www.unitconverters.net/ (script): six tabs, common pairs, nine groups, unit-first search.
- https://www.calculator.net/conversion-calculator.html (script): five tabs.
- https://www.onlineconversion.com/ (script): popular row, alphabetical list, a select of 48; 696 px wide at a 390 px window.
- https://www.metric-conversions.org/ (script): ten categories, popular links.
- https://www.omnicalculator.com/conversion (script): topic groups with emoji headings.
- https://www.inchcalculator.com/convert/ (script): collapsible groups, a converter search.
- https://www.rapidtables.com/convert/index.html (script): alphabetical categories, pair link lists; 16 Tab stops of navigation first.
- https://www.translatorscafe.com/unit-converter/en-US/ (script): field groups, sizes in Common; 509 px wide at 390.
- https://www.convert-me.com/en/ (script): Basic, Historical, Special, Engineering, Computer; 748 px wide at 390.
- https://www.wolframalpha.com/examples/science-and-technology/units-and-measures (script): Fashion Sizes, Gas Marks.
- https://www.unitjuggler.com/ (script): Basic and Other dimensions, Size charts, topic entries.
- https://www.convertunits.com/ (script): 403 Forbidden; could not reach.
- https://www.bing.com/search?q=unit+converter and https://duckduckgo.com/?q=unit+converter&ia=answer (script): no converter widget rendered for that query in headless; nothing used.
- https://support.apple.com/guide/iphone/convert-units-or-currency-iph69d274dde/ios (curl): the swipe row of categories. The en-tm page through WebFetch returned no body.
- https://www.apfelpatient.com/news/ios-18-the-revised-calculator-app-in-detail : iOS 18's 15 categories (secondary).
- https://en.wikipedia.org/wiki/Windows_Calculator : Windows' converter list (secondary).
- https://apps.apple.com/app/id465180749 : Convert Any Unit's description.
- https://www.macworld.com/article/226957/convoto-review-the-only-unit-converter-ios-app-youll-ever-need.html : Convoto review (2015).
- Google autocomplete, https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=... (script `signals.py`, 40 stems): completions saved in `downloads/signals.json`.
- Wikimedia pageviews API (script `signals.py`, `retry_wiki.py`): 46 of 50 articles; four (US standard clothing size, Pound (mass), Roman numerals, Binary number) hit rate limits and were dropped.

## Layer 5, one-offs

- https://manual.raycast.com/calculator.md : type-first conversions, "2 inches in px at 72 ppi".
- https://www.reviewed.com/style/features/different-brands-same-size-fit-different-vanity-sizing-real : one writer's tape measure on five size-4 shorts (2021).

## Leads, not sources (named for a checker)

- https://en.wikipedia.org/wiki/Gas_mark : the 25 °F step and Regulo origin, its key sentences uncited or "citation needed". Recorded in claims.csv as a lead; a checker should find a primary (Radiation Ltd. history, a cooker maker's manual).
- SI Brochure, 9th ed., on hertz only for periodic phenomena and rad/s for angular velocity: seen only quoted in search snippets (Wikipedia "Inverse second"); not read. https://www.bipm.org/en/publications/si-brochure
- Search snippets on ISO 19407:2023, ISO 8653's ring stick, BS 1283:1945: not read on their pages.

## Could not reach

- iso.org standard pages and ANSI webstore previews (403); iteh.es (DNS failure); i.sis.se (TLS); Google's results page (challenge); convertunits.com (403); a CTV News test of size labels (moved, then 404).
