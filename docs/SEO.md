# SEO: the contract every page meets, the conventions, and the plan

v0.1, 2026-10-15. How bigsmall is found in search, kept true as pages, categories, and formulas are added (Sean, 2026-10-15: "conventions in place, so whatever we add is updated with the SEO strategy"). The research behind it is docs/research/seo-1.md; the phased plan is below and on the page published for Sean (CLAUDE.md, "Pick up here").

## 1. The contract

Every page in the sitemap meets these, and `pnpm check` fails when one does not (`scripts/seo-check.mjs`, after the build, as the bundle budget is checked; the gate before every push, CLAUDE.md rule 7):

- **One canonical address**, absolute, the page's own (`https://bigsmall.work/about/`), never with a query: the URL's `?a=…&v=…` is a conversion's state, not a page.
- **In the sitemap**, and not asking to be left out of search. A page left out of the sitemap (the dev pages, the not-found page) asks not to be indexed (`noindex`) and names no canonical address.
- **A title of its own**, unique across the site and at most 60 characters: the page's subject, then the name (`About · bigsmall`), the converter's page leading with the name (`bigsmall · unit converter`).
- **A description of its own**, 50 to 160 characters, written for that page: what it does and why it is worth the click. It is what a result shows under the title.
- **A link preview**: `og:title` the title, `og:url` the canonical address, `og:image` an absolute address (the 1200 × 630 card, `public/og.png`, unless the page has its own).
- **The page's language**, `lang="en"`.
- **One `h1`** naming the page. Today the wordmark is every page's `h1`; when the first page with a subject of its own is built (a pair page, a category page), the wordmark becomes a plain link on it and the page's subject its `h1`.
- **Structured data that parses.** The converter's page carries the site's: `WebSite` (its name in results), `Organization` (its logo, `public/icon-512.png`), and `WebApplication` (what it is), in `layouts/Base.astro`.

## 2. Conventions, by what is added

- **A page.** `src/pages/`, through `layouts/Base.astro` with a title and a description of its own (`CLAUDE.md`, "Add a page"); the sitemap lists it by itself (`@astrojs/sitemap`, every page but `/dev`); linked from a page already in it, with a plain link, so a crawler reaches it; then `pnpm check` holds it to the contract.
- **Text.** Written for the page, ours: names, units, and short definitions may match other converters (ADR 0020), but no paragraph is copied, which would not rank (search engines show one copy, usually the original) and is the part copyright covers.
- **A category or a unit.** Its factors checked on our own (ADR 0020; the audit's method, docs/research/accuracy-audit-1.md); the aliases people type (`docs/UNITS-CATALOG.md` §5); and, once pair pages exist, its most searched pairs added to their list, which generates the pages, their titles, descriptions, and links (§3).
- **A formula shown** (the About page's Every formula, `apps/web/src/features/formulas`): generated from core's own data when the site is built, never typed out by hand, so the page and the math cannot drift; a new unit or category joins it by itself.
- **Speed and accessibility** are part of ranking as tie-breakers: the bundle budget (`docs/PLAN.md` §9), axe on every page, and Lighthouse's SEO score of 100 at milestone 5.
- **Icons.** `pnpm --filter @bigsmall/web brand` draws them from the tokens: the ICO and SVG, the 180 px touch icon, and the 192 and 512 px PNGs (search results' favicon, the logo in structured data, the installed app later).
- **A rename or a move.** A page that moves keeps its old address as a permanent redirect (`apps/web/vercel.json`), so what it earned in search follows it.
- **Shown to Sean first** (Sean, 2026-10-15). Any change to what search engines or link previews show, a title, a description, the preview card, structured data, an icon, or the sitemap and robots rules, is shown to him in chat, exact text before and after, and ships only on his yes. The contract check stays automatic; a change it forces, such as a new page's title, is shown the same way.

## 3. The plan

The detail, with sources, is docs/research/seo-1.md. In order:

1. **Measure from now (Sean).** Done 2026-10-19: Google Search Console (a Domain property, verified by a `TXT` record at Porkbun) and Bing Webmaster Tools (imported from Search Console, verified by the import), the sitemap (`https://bigsmall.work/sitemap-index.xml`) submitted to each; the record is `docs/DEPLOYMENT.md`, "Search".
2. **The pair pages' shape, in the spec before any are built** (milestone 5, in v1): the address (`/cm-to-inches`), the title and description patterns, the `h1`, the converter opened on the pair, a table of the values people search, the exact factor with its source and a worked example, the pitfalls (the two gallons, the two ounces), links to the reverse pair, related pairs, and the category, and the text written for each. Pages generated from one list, so each meets the contract by construction. Drafted 2026-10-19 as §5 and a mock (docs/research/demand-map-1.md §5, decision 5); Sean's yes pending.
3. **The first 50 to 100 pairs from real demand** (the demand map chooses them, docs/research/demand-map-1.md, with about ten head terms as controls measured against the edge pairs, 2026-10-19), where Google's own converter box answers poorly, and for the kinds it covers too, since a table, fractions, and the cited factor beat its one answer; new categories lean to the useful and less common, torque first (Sean, 2026-10-15): search volumes (Keyword Planner), Umami's "Unit chosen" counts once there are enough, and the categories Sean adds (Force and Torque, Speed's paces, Temperature's change, and Cooking by ingredient came first, 2026-10-15 and 16; Google's converter box covers none of the last three).
4. **Launch, then measure for 8 to 12 weeks** in Search Console; grow the pages that earn impressions, merge the ones that do not; then Show HN, a few community posts, and resource pages.
5. **Not now:** ongoing ads (a capped test at most), bought links, separate pages per value ("7 cm to inches" is a row of "cm to inches"), `llms.txt`.

## 4. Measuring

Search Console's Performance report (queries, impressions, clicks, position) and its Page indexing report; Bing Webmaster Tools, which also counts Copilot's citations; Umami for what visitors convert and where they come from. Launches are marked with Search Console's notes, so a change can be read against them.

## 5. The pair page

The shape of a page for one pair, drafted from the demand map (docs/research/demand-map-1.md §5, decision 5; the evidence in `demand-map-1/pair-pages/`, checked in wave 2) and drawn as a mock (https://claude.ai/artifact/45QS11mevTvLwvHa7ko49h); each item below is the rule a built page is held to, by the contract's test where it can be. Pending Sean's yes (2026-10-19).

1. **The address** is flat and worded as people search: `/cm-to-inches/`, with the trailing slash `/about/` has; the slug's words settled by the demand data (`lbs`, not `pounds`). Folders would make no difference to crawling under a few thousand pages, and a flat address survives a regrouping of categories; the breadcrumb carries the category.
2. **The heading** is the pair in words (`Centimeters to inches`), the page's one `h1`; the wordmark becomes a link home, as the contract's heading change plans. The title is the pair as searched with the site's name (`cm to inches · bigsmall`); the description names the exact factor and what the page does, in the words the mock shows, and both come to Sean exactly before shipping; he reviews every page's description and presentation, since the formatting is still his open question (2026-10-19).
3. **The answer line** is the factor with its standard, above the converter, since no large converter site cites one: `1 in = 2.54 cm, exactly, and 1 cm ≈ 0.3937 in`, the standard named (NIST SP 811, Appendix B), rendered from core's data as the About page's formulas are, so the page and the math cannot drift.
4. **The converter** is bigsmall's own box and table, opened on the pair: the box holding `1` and the pair's first unit, the table the whole category with the pair's second unit marked as the target. This is what no incumbent's page has, and it is the page's defence against the doorway rule: the usable part of the site is on the page. It is the same island as the home's: typing updates the table in place and the URL by `replaceState` as today, never a page load; the URL keeps the pair's address with `?v=` while the box's unit is the pair's, and a unit or category picked away from the pair writes the home's `?a=…&v=…` form in place, the page's text left as it is (Sean, 2026-10-19: seamless conversion, no page-to-page loading).
5. **The values table** holds 15 to 25 values people search for that pair, taken from autocomplete and later from Search Console, never a fixed run from 1 to 100; a decimal column and, for inches, a column to the nearest sixteenth; plain HTML in the page with an anchor on each row, so a search for one value lands on its row; a tap on a row fills the box with its value in place, never a link to another page. Heights get one feet-and-inches grid from 4 ft 10 in to 6 ft 6 in with an anchor per height, read against Search Console before any page per height.
6. **How to convert**: the formula and one worked example, the fraction's arithmetic shown where inches are involved; all of it rendered from core's data and arithmetic at the page's build, never typed into a page, so the page and the math cannot drift (Sean, 2026-10-19: accuracy and precision first).
7. **The pitfall** that is real for the pair, and only then: the two gallons, the troy ounce, kgf·m against N·m, a temperature change against a temperature, the 1959 inch; plus one line on where the pair comes up. 150 to 400 words in all, written for the pair; never a generic paragraph repeated across pages, which is the filler Google's policies name.
8. **The links**: the reverse pair (a page of its own, written for its direction, the two linked both ways), two or three related pairs, and the category's hub, under a breadcrumb (`bigsmall › Length › cm to inches`). The breadcrumb belongs to the pair pages and the hubs only, never the converter's home: one quiet line in the muted ink at the small size, there because BreadcrumbList must match a trail the visitor can see and a visitor from a search reads it as where they are; the only navigation on the page is the links at its foot, by the visitor's choice (Sean, 2026-10-19).
9. **The hub** is one page per category (`/length/`): the converter opened on the category, every pair page of the category listed, a breadcrumb back to it from each pair page. It is the browsable hierarchy the doorway policy describes, and it ships in the same batch as the pages.
10. **Structured data**: BreadcrumbList on every pair page and hub; the site's WebApplication kept; no FAQPage (Google stopped showing it on 2026-05-07) and no HowTo.
11. **Left out**: pages per value (a value is a row with an anchor), value-in-the-address URLs in the index (the canonical stays as now), app banners, and lists of a hundred pair links.
12. **The batch**: the controls, their reverses, the hubs, and the edge pages together, small enough to review every page by hand (about 28 at first, §3 step 3), measured for 8 to 12 weeks, then grown or pruned by the data.
