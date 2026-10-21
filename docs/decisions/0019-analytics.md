# 0019 — Analytics: Umami Cloud, cookieless, through the site's own address

Date: 2026-10-15
Status: accepted; amended 2026-10-18

## Context

The plan asked for traffic, product events (what people convert, the calculator, Copy URL, themes, settings), real-user speed, and search performance, with no cookies, so no consent banner, a small script counted against the page's budget, and room for more sites later (Sean, 2026-10-15: paying is fine). The tools were compared from their own pages on 2026-10-15 (docs/research/findings-0-first-pass.md, forty-seventh pass), and Umami's tracker read in its source the same day.

## Decision

- **Umami Cloud**, on the free Hobby plan to start (Sean's account, 2026-10-15); the $20 plan when we need a second site, two years of history, the API, or more events.
- **First-party and production only.** The tracker (about 2.4 KB compressed, deferred, outside the measured bundle) loads from `/ux/s.js` and sends to `/ux/api/send`, which `apps/web/vercel.json` rewrites to `cloud.umami.is/script.js` and `gateway.umami.is/api/send`, so ad blockers drop less of it; `data-host-url` points the tracker at that path, which a proxied Cloud script needs since Umami moved collection to its gateway. `layouts/Base.astro` adds it only on the production deployment (`VERCEL_ENV=production`) and only once `UMAMI_WEBSITE_ID` is set in `src/lib/site.ts`, so local builds, the browser tests, and preview deployments load nothing; `data-domains` counts only `bigsmall.work`.
- **No query string, no hash.** The URL holds the conversion and is rewritten after each change, and the tracker counts a rewritten URL as a new page view, so `data-exclude-search` and `data-exclude-hash` keep the conversion out and count each visit's page once.
- **No speed data from Umami.** Its performance option sends on every URL change, which this page makes after each edit, each counting toward the plan's events. Real-user speed comes later, from Vercel Speed Insights or a sampled event.
- **Few events, short properties**, since each event and each property counts toward the month's events: Unit chosen (category, unit), Value copied (from, to), URL copied, Calculator opened, Calculator sent, Units opened, Display opened, Setting changed (setting, value), and Theme picked (theme). They go through `track()` in `src/lib/analytics.ts`, which does nothing without the tracker; Theme picked comes from Base.astro's inline script, counted when the theme menu closes on a theme other than the one it opened on.
- **Our own visits** are left out with `localStorage.setItem('umami.disabled', 1)` in each browser we use (docs/DEPLOYMENT.md, "Analytics").

## Alternatives considered

- Vercel Web Analytics and Speed Insights: already on the account, but two properties per event on Pro and real speed figures at $10 per project.
- Plausible: no free plan, event properties only on its Business plan, and no speed.
- Fathom and GoatCounter: no event properties, and neither serves from the site's own address.
- PostHog: a 50 to 105 KB script, and without cookies no countries.
- Cloudflare Web Analytics: no custom events.
- Google Analytics 4: cookies and a consent banner.
- Supabase: a database, not analytics; the counting, bot filtering, and dashboards would be ours to build.

## Consequences

- Nothing was counted until the website ID was set; it was, the same day (2026-10-15).
- Once on, check in Umami that visitors from different places arrive as separate sessions with the right countries: whether Umami's gateway reads the address Vercel forwards is unconfirmed.
- The free plan's 100,000 events a month cover very roughly 10,000 visits at this event rate; past it Umami stops recording until the month resets, so the $20 plan comes before that.
- Search performance comes from Google Search Console, verified with a DNS record, apart from this.
- Umami sets no cookies and stores nothing on the device; a one-line note that visits are counted anonymously is recommended, its wording Sean's to choose.

## Amendments

- **2026-10-18.** The events gained Ingredient chosen (its id) with Cooking (ADR 0021, 2026-10-16; `src/lib/analytics.ts`), ten in all with Theme picked. The note recommended above landed in the About page's footer as the privacy line, in Sean's words (docs/UX-SPEC.md §1, "Footer"): visits are counted anonymously without cookies by Umami, feedback goes through Formspark to our inbox (ADR 0024), and the theme and settings stay in the browser, nothing else kept. The rule for our own visits stands (docs/DEPLOYMENT.md, "Analytics"); whether Umami's gateway reads the visitor's address rather than Vercel's is still Sean's check to make there.
- **2026-10-19.** The events gained Input unread with the compound build (ADR 0026; the demand map's decision 7): an input that matched nothing, once it has stood 1.5 s (`UNREAD_SETTLE_MS`), by its shape alone (`inputShape`: digits a 9, letters an a, spaces one space, the marks a quantity is written with kept, anything else an x, at most 24 characters), never the text, each shape once in a row, so the grammar grows from what people type into the box rather than from search data that under-counts forms that fail elsewhere. Nothing personal can pass: an address is `axa.a`.
- **2026-10-20.** The events gained Brand chosen (its id) with the brands' charts (ADR 0028; `src/lib/analytics.ts`), twelve in all.
