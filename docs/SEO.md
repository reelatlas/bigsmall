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
2. **The pair pages' shape, in the spec before any are built** (milestone 5, in v1): the address (`/cm-to-inches`), the title and description patterns, the `h1`, the converter opened on the pair, a table of the values people search, the exact factor with its source and a worked example, the pitfalls (the two gallons, the two ounces), links to the reverse pair, related pairs, and the category, and the text written for each. Pages generated from one list, so each meets the contract by construction.
3. **The first 50 to 100 pairs from real demand** (the demand map chooses them, docs/research/demand-map-1.md, with about ten head terms as controls measured against the edge pairs, 2026-10-19), where Google's own converter box answers poorly, and for the kinds it covers too, since a table, fractions, and the cited factor beat its one answer; new categories lean to the useful and less common, torque first (Sean, 2026-10-15): search volumes (Keyword Planner), Umami's "Unit chosen" counts once there are enough, and the categories Sean adds (Force and Torque, Speed's paces, Temperature's change, and Cooking by ingredient came first, 2026-10-15 and 16; Google's converter box covers none of the last three).
4. **Launch, then measure for 8 to 12 weeks** in Search Console; grow the pages that earn impressions, merge the ones that do not; then Show HN, a few community posts, and resource pages.
5. **Not now:** ongoing ads (a capped test at most), bought links, separate pages per value ("7 cm to inches" is a row of "cm to inches"), `llms.txt`.

## 4. Measuring

Search Console's Performance report (queries, impressions, clicks, position) and its Page indexing report; Bing Webmaster Tools, which also counts Copilot's citations; Umami for what visitors convert and where they come from. Launches are marked with Search Console's notes, so a change can be read against them.
