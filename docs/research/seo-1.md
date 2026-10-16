# SEO 1: where bigsmall stands in search, how ranking works, and what to do next

Written 2026-10-15 for Sean, who asked what has been done for search, whether the metadata is right, how ranking in Google actually works, whether to advertise, and what else to try (the fifty-seventh pass in docs/research/findings-0-first-pass.md). The site's setup was checked on the live site the same day; Google's and others' claims come from their own pages, listed under Sources, as of October 2026. Where a point is our judgement rather than a source's, it says so.

## The short version

- **The basics are in place**: one canonical domain, clean titles, canonical links, a sitemap, robots.txt, link previews, and a fast, accessible static page. Missing: Google Search Console and Bing Webmaster Tools, structured data, a fuller description, and a PNG icon Google can show.
- **Ranking is mostly relevance, then quality and reputation**, with speed and usability as tie-breakers. Ads never buy organic placement.
- **Converters face a special problem**: Google answers "cm to inches" itself, in its own converter box, so most of those searches end without a click. The clicks that remain go to pages more useful than that box.
- **The pair pages planned for v1 are the real lever**, and also the risk: many thin template pages are exactly what Google's spam policies target. Start with 50 to 100 strong pages, measure, and grow what earns impressions.
- **Advertising is not worth it now**: a free tool with no revenue buys visits that lead nowhere. At most one small, capped test, to learn which words bring visitors who stay.

## How ranking in Google works

1. **Crawling.** Google finds pages by following links and reading sitemaps.
2. **Indexing.** It reads each page, groups duplicates, and picks one canonical address for each group. Not every page it finds is indexed.
3. **Serving.** For each search it ranks the indexed pages by:
   - **Relevance**: does the page answer this query, in this language, for this place and device?
   - **Quality and reputation**: links from other sites still count (PageRank remains part of the core systems, if less than SEO folklore says), plus site-wide signals and aggregated data on how people use results.
   - **Helpfulness**: since March 2024, "helpful content" is part of the core ranking. Pages made for people, with something of their own, beat pages made for search engines.
   - **Page experience**: speed (Core Web Vitals), mobile use, and no intrusive popups. Google calls these tie-breakers: they decide between pages that are otherwise close, which is exactly the situation among converter pages (our judgement).

**E-E-A-T** (experience, expertise, authoritativeness, trust) is the yardstick Google's human raters use, not a ranking factor in itself. For a converter, trust means correct numbers with their sources shown (our judgement), which the accuracy audit and the formulas page Sean proposed make visible.

**A new site takes time.** There is no official "sandbox," but trust builds slowly: in one large study only a few percent of new pages reached the top 10 within a year, and the average top result is years old. Plan in months.

## What bigsmall already has

Checked on bigsmall.work on 2026-10-15:

| In place                                                                                                                                                                                     | Where                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| One canonical domain: `bigsmall.diy`, `www.bigsmall.work`, `www.bigsmall.diy`, and `http://` all redirect permanently (308) to `https://bigsmall.work`, so every link counts toward one site | ADR 0008, Vercel                           |
| HTTPS with HSTS for two years                                                                                                                                                                | Vercel                                     |
| A title per page: "bigsmall · unit converter", "About · bigsmall"                                                                                                                            | `src/lib/site.ts`, `layouts/Base.astro`    |
| A meta description, "An efficient unit converter."                                                                                                                                           | `src/lib/site.ts`                          |
| A canonical link on every indexable page, absolute and without the query, so shared conversion links (`?a=…&v=…`) fold into one page                                                         | `layouts/Base.astro`                       |
| `noindex` on the dev pages and the not-found page                                                                                                                                            | `layouts/DevPage.astro`, `pages/404.astro` |
| A sitemap (the converter and About) and a robots.txt that allows everything and points to it                                                                                                 | `@astrojs/sitemap`, `pages/robots.txt.ts`  |
| Link previews: Open Graph and a large Twitter card, a 1200 × 630 image with alt text                                                                                                         | `layouts/Base.astro`, `public/og.png`      |
| Icons: a 32 px ICO, an SVG, a 180 px touch icon                                                                                                                                              | `public/`                                  |
| A fast static page: about 63 KB of script and 8 KB of CSS compressed, within the budgets CI enforces                                                                                         | `scripts/bundle-size.mjs`                  |
| Mobile-first and accessible (WCAG 2.2 AA, axe on every page)                                                                                                                                 | the browser suite                          |
| The page's language declared (`lang="en"`)                                                                                                                                                   | `layouts/Base.astro`                       |

## What is missing: quick wins

1. **Google Search Console and Bing Webmaster Tools** (Sean's accounts; about 15 minutes with a DNS record at Porkbun). Search Console shows which searches show bigsmall, its position, its clicks, which pages are indexed, and why others are not; nothing else gives that. Bing can import the site from Search Console, and Bing's index also feeds ChatGPT's and Copilot's search. Verify `bigsmall.work` as a Domain property, then submit `https://bigsmall.work/sitemap-index.xml`.
2. **Structured data** (ours to build, invisible): `WebSite` markup, which sets the site's name in results ("bigsmall" rather than the address), and `Organization` with the logo. There is no honest rich result for a converter today: the app result needs user ratings, and FAQ and HowTo results are gone.
3. **A fuller description** (Sean's words to choose). "An efficient unit converter." is short enough that Google will often write its own. Something that says what is different, in about 150 characters, for example: "Convert any number in one box and see it in every unit at once: length, weight, cooking, temperature, and more. Free, fast, and no ads."
4. **A PNG icon of 48 px or more**, linked as an icon: Google's favicon guide no longer lists SVG among its formats. The PWA icons planned for milestone 5 (192 and 512 px) cover it; `pnpm brand` can draw them now.
5. **Optional:** a ping to IndexNow on each deploy, which tells Bing and others about changes at once (not Google).

## The real lever: pair pages, done carefully

**Why pages at all.** Today bigsmall is one page: it can rank for "unit converter," one of the hardest searches there is, and not for the thousands of specific ones ("5/8 inch to mm", "cups of flour to grams", "5'10 in cm"). Pair pages give each common question a page of its own (docs/PLAN.md §13, M5).

**The risk.** Google's spam policies name "scaled content abuse": many pages made mainly to rank, however they are made. In September 2026 Google's John Mueller said programmatic pages often end up "spam, borderline spam, or low quality", and that a site can lose Google's trust in a way that takes long to win back. Converter sites with thousands of thin pages are the example everyone uses.

**What makes a pair page worth ranking** (Google asks whether a page adds "substantial value" over the other results; the specifics are our judgement):

- the working converter, set to the pair, not a link to one;
- a table of the values people actually search, with fractions where trades use them (eighths and sixteenths of an inch);
- the exact factor with its source and a worked example: our accuracy is something to show;
- the pitfalls (the US and UK gallons, the two ounces, the tons);
- links to the reverse pair and related ones, a breadcrumb to the category, and a link from a category page, so every page is reachable;
- text written for the page, ours: copied paragraphs do not rank (Google shows one copy, usually the original's), and longer prose is the part of another site that copyright protects (ADR 0020 frees names and units, not essays).

**How many.** Start with 50 to 100 pairs chosen from real demand (Google's Keyword Planner, and the searches Google's own box does not answer well), then measure for 8 to 12 weeks, add pages where Search Console shows impressions, and merge the rest. Values belong in a page's rows, not in pages of their own ("7 cm to inches" is a row of "cm to inches").

**Mechanics** (all easy on Astro): a canonical pointing to itself on each page, every page in the sitemap, `lastmod` only when accurate. Crawl budget does not matter at this size.

## Where clicks still come from for a converter

Google's own box handles plain conversions in length, mass, volume, temperature, speed, area, time, data, and fuel. Its AI answers appeared for about one keyword in six in a large late-2025 study, more on "how to" questions. Yet the incumbents still get most of their visits from search: unitconverters.net about 84 %, inchcalculator.com about 79 % (Similarweb's estimates, on desktop). What those visits search for points at openings (our judgement, from their top keywords):

- **specific values and tables**: "7 in cm", charts to print or keep;
- **heights in feet and inches**: "5'10 in cm" (the feet-and-inches input in docs/PLAN.md §2);
- **cooking by ingredient**: "1 cup of flour in grams", which needs a density, something Google's box does not do (a candidate for the categories shortlist);
- **fractions of an inch**: Mike's construction case (findings-friends-1);
- **other languages**: Spanish searches rank high for metric-conversions.org; later, with `hreflang`.

## Advertising

- **Ads do not change organic ranking.** Google: "no one can buy better placement in organic Search results."
- **Clicks are cheap but low in intent**: about $0.55 for "cm to inches", $0.65 for "kg to lbs", $1.60 for "unit converter" (US, third-party estimates of Google Ads data).
- **Recommended: no ongoing ads.** With no revenue, paid visits lead nowhere, and a converter is used and left. At most one capped test ($50 to $100) to learn which wording brings visitors who stay, measured in Umami. Community posts cost nothing and earn links.

## Being found by AI assistants

- Google's AI Overviews and AI Mode draw on its normal index and ranking: a page needs only to be indexed and eligible for a snippet. No special markup is needed, and Google says it ignores `llms.txt`.
- ChatGPT's search leans on Bing's index, and Copilot is Bing's: another reason for Bing Webmaster Tools.
- robots.txt allows every crawler today, which is right for a free tool: blocking the training crawlers protects little, since the value is the tool rather than its text (our judgement).
- Assistants do simple conversions themselves, so citations will be rare; mentions of bigsmall around the web matter more.

## Earning links and attention

- **Show HN** fits exactly: something people can try without signing up. Post once the pair pages are polished, be there to answer, and never ask friends to upvote.
- **Communities where conversions matter**, each by its own rules on self-promotion: woodworking (fractions of an inch), 3D printing, baking (once cooking by ingredient exists), homebrewing, science students. `r/InternetIsBeautiful` and design communities may like the sketchbook and the themes (our judgement).
- **Resource pages** that list free tools (teachers, libraries, maker groups): write to whoever keeps them.
- **The share link** (Copy URL) is already a link to bigsmall every time someone shares a conversion.
- **Not**: bought links, mass directories, or links hidden in embeddable widgets (Google's link-spam policy names those); a widget later carries one plain branded link at most.

## Measuring

- **Search Console's Performance report**: queries, impressions, clicks, click rate, and average position. In the first months impressions come before clicks, positions are noisy, and many long-tail queries are hidden for privacy. The Page indexing report shows which pages Google has taken and which it has only seen.
- **Bing Webmaster Tools** reports Copilot's citations; **Umami** shows referrers such as chatgpt.com and perplexity.ai.
- Mark launch dates (the pair pages, a Show HN post) with Search Console's notes so later changes can be read against them.

## Recommended plan

1. **Now, Sean:** Google Search Console and Bing Webmaster Tools, verified by DNS at Porkbun, the sitemap submitted; a step-by-step to follow on his screen when he is ready.
2. **Now, ours, on Sean's go:** `WebSite` and `Organization` structured data, the fuller description in his words, and PNG icons of 192 and 512 px linked (the PWA's too).
3. **Next, with v1:** plan the pair pages: the first 50 to 100 from real demand, each a working converter with content of its own (above), in the spec before they are built.
4. **After launch:** measure for 8 to 12 weeks, grow what earns impressions; then Show HN, a few community posts, and resource pages.
5. **Skip:** ongoing ads, link buying, `llms.txt` beyond curiosity.

## Sources

Google: how Search works (developers.google.com/search/docs/fundamentals/how-search-works); the ranking systems guide (/search/docs/appearance/ranking-systems-guide); page experience (/search/docs/appearance/page-experience); creating helpful content (/search/docs/fundamentals/creating-helpful-content); spam policies (/search/docs/essentials/spam-policies) and the March 2024 update (/search/blog/2024/03/core-update-spam-policies); site names (/search/docs/appearance/site-names); software app structured data (/search/docs/appearance/structured-data/software-app); favicons in Search (/search/docs/appearance/favicon-in-search); AI features (/search/docs/appearance/ai-features); search updates (/search/updates); ads and organic results (google.com/search/howsearchworks/our-approach/ads-on-search/); Google's converter (support.google.com/websearch/answer/3284611). Bing: duplicate content and AI search (blogs.bing.com/webmaster, December 2025); importing from Search Console. Mueller on programmatic SEO (seroundtable.com/google-lose-faith-42032.html). Studies: Ahrefs on how long ranking takes and on AI Overviews' clicks; Semrush's AI Overviews study; Pew Research, July 2025; SparkToro, 2026; Similarweb, September 2026. Cost per click: seodata.dev keyword pages. Show HN guidelines (news.ycombinator.com/showhn.html).
