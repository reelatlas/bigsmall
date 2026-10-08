# bigsmall — project plan

Last updated: 2026-10-08. Status: milestones 0, 1, and 2 complete; milestone 2's usability test set aside for friends' feedback rounds until the product gains traction (docs/research/usability-test-1.md).

## 1. Vision

The best-feeling unit converter on the web. The two incumbents (unitconverters.net, onlineconversion.com) are correct and comprehensive but their UX is from another decade: two scrolling list boxes, a Convert button, tiny targets, ad-heavy pages, and no sense of place. bigsmall competes on experience, not on breadth, while still matching the coverage people expect.

Positioning in one line: _type anything into either box and get the answer._

## 2. What we are building

### v1 (launch)

- **One box and its table.** One smart input, and the value in every unit of its category in a table under it, which is also where units are picked (ADR 0012). Two linked boxes behind a switch were built and retired the same day (ADR 0009, ADR 0013).
- **Smart search.** Typing a unit lists matching units across every category, grouped by category, the current category first. Typing a category word (`fluids`, `temp`) offers that category.
- **Manual selection.** Everything reachable by tapping, with no typing required.
- **Calculator.** A scratch pad behind an icon button, for anyone who would rather tap than type or wants to work a number out first; its number goes into the box only when sent (docs/UX-SPEC.md §8).
- **Every unit, no modes.** Each category's table lists all its units, everyday and specialist, in the visitor's order; there is no basic and advanced switch (ADR 0016, Sean, 2026-10-08).
- **Themes.** Two neutral defaults (light, dark) plus distinctive aesthetic themes. Theme choice persists.
- **Shareable URLs.** The current conversion is in the URL, so links and bookmarks work; a Copy URL button in the header copies it.
- **Fast, accessible, responsive.** See budgets and targets below.

### Later

- SEO landing pages, one static page per popular unit pair, generated from the unit data.
- PWA: installable, works offline. This covers most of the "app" ambition with no app store.
- Currency (needs live rates from an API, still no database).
- Ingredient-aware cooking conversions (cups of flour to grams).
- Expression input, the rest of it: `+ − × ÷ ^` and parentheses with Enter as equals shipped on 2026-10-06; still to come are mixed fractions (`3 1/4`), feet-and-inches entry, and more calculator keys. Principle and phasing in `docs/UX-SPEC.md` §14.
- Native wrapper (Capacitor) only if the PWA proves insufficient.

### Explorations (owner, 2026-10-07)

Directions Sean wants to explore after the MVP is shared; none is designed or scheduled yet. Several come from friends who use the site (docs/research/findings-friends-1.md). Sean's controls for the table, in his order: filtering its units, multiples or recommended values that can move into the box, a fractional display pegged to a step, and settings that are always saved, with templates later.

- **Every category at once.** An option to show all categories as collapsible sections below the box, each expanding to show the current value in every unit of that category, like a full conversion table. To work out: when it shows (only with a number?), its size on a phone, and its cost with many units. Its single-category form, every unit of the box's category, is the converter's table (ADR 0012, ADR 0013); every category at once stays an exploration.
- **Favorites (Mike's idea, 2026-10-07).** Star a unit or a category and find it in a favorites bar, in or under the toolbar, for a one-tap pick (docs/research/findings-friends-1.md). To work out: what a favorite does when tapped (set the box's unit, or open its category), how many fit on a phone, and how it relates to the pinned pairs planned for milestone 3 (docs/UX-SPEC.md §14).
- **Filtering the table (Sean, 2026-10-07).** Choose which units the table shows: someone who works in US units turns off cm, m, and km and keeps inches, feet, and yards. To work out: per unit, or by family with one switch for metric; where the control lives (the table's heading, a settings panel); and that the box's own unit always shows. Columns the table may gain for filtering or other data (Sean, 2026-10-08) give way where a row has no room, as the names do (`useColumnsFit`; docs/DESIGN-SYSTEM.md, "Columns that give way"). Prototyped with the other two in the table controls lab (`/dev/table-controls-lab`, docs/research/table-controls.md), 2026-10-08.
- **Everyday or every unit (Sean, 2026-10-08).** A filter that switches the table between the everyday units and all of them, built later; the ground for it is laid. Every unit carries its tier, `basic` (everyday) or `advanced` (specialist), in `packages/core/src/units`; core's `search` takes `tier: 'basic'` to leave the specialist units out, and flags `escalated` when a query matches only specialist ones; the table asks for every tier in one place, `EVERY_TIER` in `apps/web/src/features/converter/state.ts`. Building it means a control (perhaps with the filters above), the table asking for `basic` while it is on, a unit in the box from beyond the filter still showing its row, and a label for a specialist match found anyway. Mark every new unit's tier with care until then (docs/UNITS-CATALOG.md §3). Prototyped with the other two in the table controls lab (`/dev/table-controls-lab`, docs/research/table-controls.md), 2026-10-08.
- **Section names in a long table (Sean, 2026-10-08).** As specialist units lengthen the tables (ADR 0016), headings inside a table could divide its groups: metric, US customary or imperial, other. The listed order already groups units this way (ADR 0011), so headings would name what is there. A heading would also let the UK measures drop "(UK)" from their symbols, which with long values (0.000618891 yd³) takes the names out of the whole volume table on a 390 px phone today; shorter names alone ("UK pints") were tried and do not bring them back. To work out: when a table is long enough to need them, how they read to a screen reader, and whether they fold. If the lengths get unwieldy, re-evaluate the model itself (Sean). Prototyped with the other two in the table controls lab (`/dev/table-controls-lab`, docs/research/table-controls.md), 2026-10-08.
- **Pace, and conversions by time (Sean, 2026-10-08).** Runners' pace (min/km, min/mi) is the reciprocal of speed. To work out: whether it belongs in Speed or a category of its own (race paces), how it reads (`5:30 /km`, minutes and seconds, not `5.5`), and a mechanism for converting by time generally. In Speed today it would also need the listed order to keep its size order with a reciprocal unit present (`order.ts` falls back to the catalog's order). Held with the display of fractions (`1/4`, `5/8` in place of decimals), which the fractional feet and inches and writing fractions explorations below share.
- **Fractional feet and inches (Mike's idea, 2026-10-07).** Construction work measures in fractional inches. Enter feet and inches as decimals or fractions (`5' 10 3/8"`), add and subtract them, and show results as fractions, in lowest terms or rounded to a chosen step (nearest 1/2, 1/4, 1/8, 1/16). Sean's first thought: a toggle in the toolbar that, when on, offers the rounding step. It builds on the planned mixed fractions and feet-and-inches input and the calculator's `½ ¼ ⅛` and `′ ″` keys (docs/UX-SPEC.md §14). To work out: where the toggle fits in the toolbar, at 320 px too, whether fractions apply beyond lengths, and how the table shows them; the same display pegged to a step could serve the table's values (Sean).
- **Writing fractions and parentheses (Sean, 2026-10-07).** People write fractions (`1/2`, `5/6`) and mixed numbers (`3 1/4`), and use parentheses for multiplication (`2(3 + 1)`). A fraction is already a division (`1/2` reads as 0.5, docs/UX-SPEC.md §2), so typing one needs no mode, and a fraction mode would change how results are shown, not how input is read. What needs designing: a whole number followed by a fraction (`3 1/4` as 3 + 1/4, while `3 cups` still finds its unit), and parentheses after a number meaning times (`2(3)`, planned as implied multiplication, §2).
- **Keeping the math (Sean, 2026-10-07).** Some people may want to keep the expression they wrote (`2 × 3/4 + 1`) on screen rather than have Enter turn it into its value, to see the chain of math they are weighing. Today its running value shows beside it while typing, and Enter replaces it with the value (docs/UX-SPEC.md §5, §7). To work out: a setting, a different key, or a tape of past calculations; and how it fits undo and the URL.
- **Multiples beside the values (Dan's idea, 2026-10-07).** Quick multiples or ratios beside a value in the table (½×, 2×, 4×, 8×), or recommended values, so the range around an answer shows at a glance, with the user choosing whether to see them and the step (halves, doubling). Any of them can become the main value everything converts from, as a row can today (Sean). To work out: a column, a row that expands, or a setting; its room on a phone; and how it relates to the calculator.
- **Choosing the sort (Sean, 2026-10-07).** Let people pick how units are ordered in the list and the table: by size across systems (mm, cm, in, ft…), by system (today's default, ADR 0011), alphabetically, or favorites first. To work out: where the choice lives (the table's heading, settings), whether the list and the table share it, and that a chosen sort is remembered.
- **Saved settings and templates (Sean, 2026-10-07).** Every setting is remembered by default, as the theme already is; the table's filter, multiples, and fraction display would join them, with the persistence planned for milestone 3 (docs/UX-SPEC.md §14). Later, maybe: templates, named sets of settings to switch between (a construction set with fractional inches, say). Worth deciding once the settings exist.
- **Many more categories and units.** The catalog's plan (docs/UNITS-CATALOG.md §3: fuel economy, energy, pressure, power, angle, and the advanced groups) and more formulas, each category's data loaded on demand against its own budget (§9), every unit cited (ADR 0004).
- **Search visibility (SEO).** The pair pages already planned for launch (one static page per popular unit pair), plus the technical basics (canonical domain, sitemap, robots, titles and descriptions, structured data, social cards) and Google Search Console and Bing Webmaster Tools.
- **Analytics and monitoring.** Cookieless traffic analytics, product events (what people convert, calculator and Copy URL use, themes chosen), real-user speed (Core Web Vitals), search performance, and optionally errors and uptime; each script counted against the budget.

### Out of scope

Time zones and calendar math, clothing and shoe sizes, decibels, number-base conversion, and "fun" units. Each is a different kind of tool. Revisit after launch if users ask.

## 3. UX concept

Full behavior lives in `docs/UX-SPEC.md`. The short version:

1. The box starts empty, the categories under it to start from.
2. The user types a number, a unit, or both. The parser splits the text into an optional number and an optional unit query.
3. Typing a unit lists the matches under the box, across every category; nothing is chosen on a keystroke: Enter or a click takes a unit into a chip.
4. Choosing a category instead lists its units, with none chosen; picking one means the typed number in that unit.
5. With a number and a unit, every row of the table shows the value in its unit; tapping a row moves it into the box.
6. Undo, redo, and clear all sit above the box. A calculator beside it works a number out and sends it to the box.

The smart input is the whole product. It is the first thing to build and the first thing to test with people.

## 4. Do we need a database?

**No.** A converter is static data plus arithmetic. Conversion factors are constants. Everything the app needs ships with the page and runs in the browser.

| Need                                          | Where it lives                              |
| --------------------------------------------- | ------------------------------------------- |
| Unit definitions and factors                  | TypeScript data in `packages/core`, bundled |
| Theme; later, settings such as a table filter | `localStorage`                              |
| Recent and favorite conversions               | `localStorage`                              |
| Current conversion (for sharing)              | URL                                         |
| Usage analytics (which units people use)      | Third-party cookieless analytics            |

What would change the answer: accounts with cross-device sync of favorites (needs auth plus storage), or server-side logging of search queries that returned nothing. Both are additive and can be bolted on later without touching the core. Currency needs an external rate API, not a database. Do not set up Supabase for v1. See ADR 0001.

## 5. Architecture

Two layers with a hard boundary (ADR 0003). `packages/core` is pure TypeScript with zero runtime dependencies and no DOM: units, conversion, parsing, search, and formatting. `apps/web` is the Astro site with one island for the converter, written against the React API and run on Preact through `preact/compat` (ADR 0007): everything the user sees. The module map, data flow, and how to extend each part are in `docs/ARCHITECTURE.md`.

- **Data model.** `Category` and `Unit` in `packages/core/src/types.ts`. Conversion always goes `from → base → to`, never through an intermediate unit: linear units multiply by a factor, affine units (temperature) add an offset first, and functional units (fuel economy and pace, later) use a `toBase`/`fromBase` pair (docs/ARCHITECTURE.md, "packages/core"). Every unit cites its source.
- **Converter state.** `apps/web/src/features/converter/state.ts`: the box's text and unit, the category its table lists, and the calculator's entry, with one undo history around them all, so undo after a send steps back into the arithmetic that produced it (docs/UX-SPEC.md §9).
- **URL.** The state serializes to the URL's query (format in docs/UX-SPEC.md §11), so sharing, bookmarks, and later SEO pages use one mechanism.

## 6. Stack (ADR 0002, accepted)

| Concern               | Choice                                                   | Why                                                                                                                                                                                     |
| --------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework             | **Astro** with a **Preact** island (React API, ADR 0007) | Static HTML by default, JavaScript only where there is interaction (the converter island, the wordmark's script), static page generation for later SEO pages, built-in view transitions |
| Language              | **TypeScript** (strict)                                  | Catches unit-data mistakes at compile time                                                                                                                                              |
| Styling               | **Tailwind CSS v4** over **CSS custom properties**       | Tokens are plain CSS variables so themes are just variable sets; Tailwind for speed and consistency                                                                                     |
| Accessible primitives | **Native elements + a hand-built combobox** (ADR 0006)   | React Aria was tried and removed at milestone 2: its button machinery alone cost 12 KB gzipped, and the hybrid number-and-unit field does not fit a library combobox                    |
| Package manager       | **pnpm** workspaces                                      | Fast; the workspace enforces the core/web boundary physically                                                                                                                           |
| Tests                 | **Vitest** (core), **Playwright** + **axe** (web)        | Table-driven golden tests for math; end-to-end plus automated accessibility checks                                                                                                      |
| Lint/format           | **ESLint** (flat) + **Prettier**                         | Boring, complete coverage of `.astro`, `.tsx`, and `.css`                                                                                                                               |
| Perf gates            | Bundle size check now; **Lighthouse CI** at milestone 5  | Budgets fail the build                                                                                                                                                                  |
| Hosting               | **Vercel** (ADR 0008)                                    | Serves the static build from the GitHub repository; `bigsmall.work` is the main domain and `bigsmall.diy` redirects to it. Cloudflare Pages is the fallback                             |
| Repo                  | **GitHub**                                               | Actions for CI                                                                                                                                                                          |

The alternatives (SvelteKit, Next.js, an all-React Vite framework) and why they lost are in ADR 0002. The milestone 2 bundle check removed React Aria (ADR 0006), and the island moved from React to Preact through `preact/compat` when the budget ran out (ADR 0007).

## 7. Repo structure

```
bigsmall/
├── CLAUDE.md
├── README.md
├── package.json                 workspace root
├── pnpm-workspace.yaml
├── docs/
│   ├── PLAN.md                  this file
│   ├── UX-SPEC.md
│   ├── UNITS-CATALOG.md
│   ├── LEARNINGS.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN-SYSTEM.md
│   ├── THEMING.md
│   ├── TESTING.md
│   ├── decisions/               ADRs
│   └── research/                usability test scripts and findings
├── packages/
│   └── core/                    @bigsmall/core
└── apps/
    └── web/                     Astro site
```

## 8. Design system and theming

Tokens, the Tailwind bridge, and the component rules are in `docs/DESIGN-SYSTEM.md`; building a theme is in `docs/THEMING.md`. In short: components use semantic tokens only (`bg-canvas`, `text-ink`, `rounded-md`). A theme is a `[data-theme="name"]` block that sets every semantic token, plus an optional decoration stylesheet for atmosphere (petals, rain streaks, blueprint grid). Components never know which theme is active.

The six themes (`daylight`, `midnight`, `sakura`, `neo-noir`, `hardhat`, `theorem`), the feel of each, where each stands, and its direction for milestone 4 are in `docs/THEMING.md`, "Status and direction".

Rules: every theme passes the same contrast checks; decoration costs nothing when the theme is inactive (fonts and textures load on activation only); `prefers-reduced-motion` disables ambient motion; theme is applied by an inline script before first paint so there is no flash; `color-scheme` is set per theme so native controls match. A `/dev/gallery` page renders every component in every theme for visual QA.

## 9. Performance budgets

| Metric                                    | Budget                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| JS on the converter page, gzipped         | ≤ 90 KB (target 60)                                                                          |
| CSS, gzipped                              | ≤ 20 KB                                                                                      |
| Unit data shipped initially               | ≤ 15 KB (basic categories); advanced categories lazy-loaded per category                     |
| Fonts                                     | 0 KB for defaults (system stack); ≤ 2 subset files per aesthetic theme, loaded on activation |
| LCP on simulated mid-tier mobile, slow 4G | < 1.5 s                                                                                      |
| INP                                       | < 200 ms                                                                                     |
| CLS                                       | ≈ 0                                                                                          |
| Lighthouse                                | Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100                             |

The JS and CSS budgets gate CI (`pnpm bundle:check`), counting everything the page can load, lazily loaded chunks included. Measured 2026-10-06 at the end of milestone 2: 82.0 KB JS and 5.3 KB CSS gzipped; with copy link, the calculator, and arithmetic, 86.5 KB JS and 5.7 KB CSS; with the wordmark at play and theme art, 89.2 KB JS and 5.9 KB CSS; on Preact (ADR 0007), 33.9 KB JS; with the tuned wordmark, 38.2 KB JS and 6.2 KB CSS; after the pre-launch tidy-up, 39.6 KB JS and 6.3 KB CSS; with launch prep (the not-found page, the head tags), 40.0 KB JS and 6.5 KB CSS (2026-10-07, `pnpm bundle`). The Lighthouse budgets join CI at milestone 5.

## 10. Accessibility targets

WCAG 2.2 AA throughout. Specifically:

- Keyboard-complete, including suggestion lists, chips, the calculator, and the theme picker.
- Results announced through a polite live region.
- Touch targets ≥ 44 × 44 CSS px.
- Contrast ≥ 4.5:1 for text and ≥ 3:1 for UI, verified per theme.
- Reflow to 320 px and 400 % zoom without horizontal scrolling.
- Reduced motion respected everywhere.
- Native controls where they are good enough (e.g. `<dialog>`), ARIA only where needed.
- Automated axe checks in Playwright; manual screen reader passes (VoiceOver on iOS, NVDA on Windows) before launch.

## 11. Correctness and verification

- **Sources.** NIST Special Publication 811 (Appendix B), NIST Handbook 44 (Appendix C), BIPM SI Brochure (9th edition), IEC 80000-13 for binary prefixes. Each unit cites its source.
- **Golden tests.** A fixture file of known conversions taken from those sources. Every unit appears in at least one row. Tests assert relative error ≤ 1e-12.
- **Round-trip tests.** For every unit, `fromBase(toBase(x)) ≈ x` for several magnitudes.
- **Spot checks against the incumbents.** A small set of conversions compared against the two reference sites as a sanity check only. Disagreements are resolved by the standards source, never by the site. See ADR 0004.
- **Arithmetic.** Double precision via the base unit. Display formatting at 10 significant digits with trailing zeros trimmed hides floating-point noise. Move to a decimal library only if a real test case fails.

## 12. Documentation system

| Doc                        | Purpose                                                      | Updated when                   |
| -------------------------- | ------------------------------------------------------------ | ------------------------------ |
| `CLAUDE.md`                | Conventions and rules for every working session              | Rules change                   |
| `docs/PLAN.md`             | Vision, scope, architecture, milestones                      | Scope or plan changes          |
| `docs/UX-SPEC.md`          | Exact UI behavior                                            | Before any behavior change     |
| `docs/UNITS-CATALOG.md`    | Taxonomy, tiers, special cases, sources                      | Units or categories change     |
| `docs/ARCHITECTURE.md`     | Modules, data flow, boundaries, how to extend                | Structure changes              |
| `docs/DESIGN-SYSTEM.md`    | Tokens, components, usage rules                              | Tokens or components change    |
| `docs/THEMING.md`          | How to author and QA a theme                                 | Theming mechanism changes      |
| `docs/TESTING.md`          | Test layers, how to add golden rows, CI gates                | Test approach changes          |
| `docs/DEPLOYMENT.md`       | How the site is built and served; setup, releases, rollbacks | Hosting or domains change      |
| `docs/decisions/NNNN-*.md` | Why we chose what we chose                                   | A decision is made or reversed |
| `docs/LEARNINGS.md`        | Dated log of gotchas and best practices                      | Something is learned           |
| `docs/research/`           | Usability test scripts, feedback rounds, findings            | A test or feedback round runs  |

Rule of thumb: if a future session would have to rediscover it, write it down.

## 13. Milestones

| #   | Milestone              | Done when                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | **Setup**              | Tooling installed, repo on GitHub, workspace scaffolded, CI runs lint + typecheck + tests, docs skeleton in place. **Done 2026-10-06.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| M1  | **Core engine**        | Eight primary categories with basic-tier units, parser, search, formatter; golden and round-trip tests green; zero UI. **Done 2026-10-06.**                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| M2  | **Smart input spike**  | Two linked boxes with the `daylight` theme, mobile-first, URL state; usability test with five people; bundle measured against budget. **Code done 2026-10-06; closed 2026-10-08 (Sean): the five-person test is set aside while friends' feedback rounds (docs/research/findings-friends-1.md) give the signal, to run on the one-box converter (ADR 0012, ADR 0013) if the product gains traction.**                                                                                                                                                                                                     |
| M3  | **Complete converter** | Remaining everyday categories (Fuel economy, Energy, Pressure, Power, and Angle shipped 2026-10-08 with their specialist units, and the first eight gained theirs the same day), advanced categories loaded on demand (basic and advanced modes dropped, ADR 0016, and only the theme remembered, Sean, 2026-10-08; the URL keeping typed digits and early keystrokes shipped the same day). Shipped early: the calculator (a scratch pad with + − × ÷ ^ whose number can be sent to the box), arithmetic in the box, and Copy URL (2026-10-06); swap shipped in M2 and retired with two boxes (ADR 0013) |
| M4  | **Themes**             | `midnight`, `sakura`, `neo-noir`, `hardhat`, `theorem` designed and polished: fonts and decoration (per-theme art shipped early, 2026-10-06). The picker, the contrast test, the gallery, and the bundle budget already exist                                                                                                                                                                                                                                                                                                                                                                             |
| M5  | **Launch**             | SEO pair pages, analytics, PWA manifest and offline, domain, Lighthouse gates passing. Shipped early: the domain, and the MVP live on `bigsmall.work` for friends' feedback, tagged `v0.1.0` (2026-10-07; docs/DEPLOYMENT.md)                                                                                                                                                                                                                                                                                                                                                                             |

## 14. Setup checklist

### On this machine (Windows 11)

Done 2026-10-06: Node 24.19, pnpm 12.9, GitHub CLI 2.102 (logged in as reelatlas), git identity set, PowerShell execution policy set to RemoteSigned for the current user, Playwright's Chromium installed.

For a new machine:

1. Install Node LTS: `winget install OpenJS.NodeJS.LTS`
2. Install pnpm: `npm install -g pnpm` (PowerShell may need `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` first)
3. Install GitHub CLI: `winget install GitHub.cli`, then `gh auth login --web`
4. Set git identity: `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`
5. Clone, then `pnpm install`, `pnpm --filter @bigsmall/web exec playwright install chromium`, and `pnpm check`.

### Accounts

| Account                                                        | Needed by | Cost                                                                        |
| -------------------------------------------------------------- | --------- | --------------------------------------------------------------------------- |
| GitHub                                                         | M0        | free                                                                        |
| Vercel (`reelatlas`), hosting and preview deploys (ADR 0008)   | launch    | Pro, the team's plan at setup (Hobby would do, for non-commercial use only) |
| Porkbun, `bigsmall.work` and `bigsmall.diy`, bought 2026-10-07 | launch    | ~$10–20/yr each                                                             |

### Not needed

Supabase or any database. A backend. A paid analytics tier. An app store account.

## 15. Decisions (made 2026-10-06)

1. **Stack.** Astro + React + TypeScript + Tailwind v4 (ADR 0002, accepted). Re-examined against an all-React Vite framework the same day and kept; the operating rule is TSX components for interaction, Astro for structure. The island's runtime became Preact (decision 10).
2. **Primary categories.** The eight in `docs/UNITS-CATALOG.md`: Length, Weight, Volume, Temperature, Area, Speed, Time, Data. Fuel economy, Energy, Pressure, Power, and Angle joined them on 2026-10-08 (docs/UNITS-CATALOG.md §0).
3. **Themes.** Framework and palettes for all six now; polish one at a time in milestone 4, `sakura` first (docs/THEMING.md).
4. **Locale defaults.** Detect from the browser, fall back to US; manual override in settings later. Implemented as `regionDefaults` in core.
5. **Toolchain.** Latest where compatible, accessibility tooling never dropped (ADR 0005). TypeScript 6 until the ecosystem supports 7.
6. **Input flexibility.** Spacing, locale number formats, typed math, and Enter-as-equals are a standing UX principle, phased in `docs/UX-SPEC.md` §14.
7. **Commit rules.** Nothing commits on a keystroke. Enter commits the highlighted best match, or a pick does; Tab and clicking away never commit, so moving between boxes never changes what was typed (`docs/UX-SPEC.md` §5).
8. **Token guard.** `pnpm lint` rejects raw colors, palette colors, one-off arbitrary values, untokened radii, shadows, fonts, and literal durations and delays in components. A flagged need is matched to an existing token or brought to the owner as a proposed new one (`docs/DESIGN-SYSTEM.md`, "Token guard").
9. **Control edges.** Fields, the theme menu, and secondary buttons are edged in a new `--edge` token at 3:1 against the page and the surface (WCAG 1.4.11); `--line` stays for dividers. A trial: reverting its one commit restores the lighter edges.
10. **Framework.** The island runs on Preact through `preact/compat` (ADR 0007): 89.2 KB of JavaScript became 33.9 KB with no change to how components are written, and the 90 KB budget stays, so the room goes to the product. Owner's choice after a measured spike.

11. **Hosting and domains.** Vercel, with `bigsmall.work` as the main domain and `bigsmall.diy` redirecting to it (ADR 0008). The main domain can change later with a redirect flip; settle it before SEO work.

Still open: SEO pages in v1 (proposed yes, built at M5), and the analytics tool (to explore with the owner).

## 16. Risks and open questions

- **Ambiguous symbols** (`m`, `oz`, `ton`, `gal`, `cup`, `cal`, `hp`, `mpg`, `kB`). The disambiguation UX decides whether the smart input feels magical or annoying. Test it early.
- **Explicit commit.** Decided: nothing commits on a keystroke, and only Enter or a pick commits (decision 7). The risk left is people who never press Enter; friends' feedback rounds watch for it, and the usability test will if it runs.
- **Bundle size.** Resolved at M2 by removing React Aria (ADR 0006), then at its ceiling (89.2 KB of 90) until the island moved to Preact (ADR 0007), which left about 50 KB of headroom under the same gate (measurements in §9). As formulas and units grow, unit data loads per category against its own budget (§9) so the code that runs first stays small.
- **Themes vs. speed.** Decoration must be free when inactive. Fonts are the main cost; system fonts for the defaults.
- **Locale number parsing.** `1,5` means 1.5 in much of the world. Use the browser locale and show the detected format.
- **Definitions that vary.** Month, year, cup, calorie, horsepower, ton. Each needs a stated definition in the UI and a note in the catalog.
