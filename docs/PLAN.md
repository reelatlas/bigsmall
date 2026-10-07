# bigsmall — project plan

Last updated: 2026-10-06. Status: milestones 0 and 1 complete; milestone 2 code complete, usability test pending (docs/research/usability-test-1.md).

## 1. Vision

The best-feeling unit converter on the web. The two incumbents (unitconverters.net, onlineconversion.com) are correct and comprehensive but their UX is from another decade: two scrolling list boxes, a Convert button, tiny targets, ad-heavy pages, and no sense of place. bigsmall competes on experience, not on breadth, while still matching the coverage people expect.

Positioning in one line: _type anything into either box and get the answer._

## 2. What we are building

### v1 (launch)

- **Two linked smart inputs.** Each accepts a number, a unit, or both (`5 ml`, `ml`, `5`). Typing in one updates the other instantly. Either box can be the source.
- **Smart search.** Empty box shows categories. Typing a unit narrows to matching units across categories. Typing a category word (`fluids`, `temp`) narrows to that category. Once one box has a unit, the other is scoped to the same category.
- **Manual selection.** Everything reachable by tapping, with no typing required.
- **Calculator.** A scratch pad behind an icon button, for anyone who would rather tap than type or wants to work a number out first; its number goes into either box only when sent (docs/UX-SPEC.md §8).
- **Basic and advanced modes.** Basic shows the common units of the common categories. Advanced reveals everything. Searching for an advanced unit escalates automatically.
- **Themes.** Two neutral defaults (light, dark) plus distinctive aesthetic themes. Theme choice persists.
- **Shareable URLs.** The current conversion is in the URL, so links and bookmarks work; a copy-link button in the header copies it.
- **Fast, accessible, responsive.** See budgets and targets below.

### Later

- SEO landing pages, one static page per popular unit pair, generated from the unit data.
- PWA: installable, works offline. This covers most of the "app" ambition with no app store.
- Currency (needs live rates from an API, still no database).
- Ingredient-aware cooking conversions (cups of flour to grams).
- Expression input, the rest of it: `+ − × ÷` and parentheses with Enter as equals shipped on 2026-10-06; still to come are powers (`2^10 bytes`), fraction and feet-and-inches entry, and more calculator keys. Principle and phasing in `docs/UX-SPEC.md` §14.
- Native wrapper (Capacitor) only if the PWA proves insufficient.

### Explorations (owner, 2026-10-07)

Directions Sean wants to explore after the MVP is shared; none is designed or scheduled yet.

- **Every category at once.** An option to show all categories as collapsible sections below the boxes, each expanding to show the current value in every unit of that category, like a full conversion table. To work out: when it shows (only with a number?), how it relates to basic and advanced modes, its size on a phone, and its cost with many units.
- **Many more categories and units.** The catalog's plan (docs/UNITS-CATALOG.md §3: fuel economy, energy, pressure, power, angle, and the advanced groups) and more formulas, each category's data loaded on demand against its own budget (§9), every unit cited (ADR 0004).
- **Search visibility (SEO).** The pair pages already planned for launch (one static page per popular unit pair), plus the technical basics (canonical domain, sitemap, robots, titles and descriptions, structured data, social cards) and Google Search Console and Bing Webmaster Tools.
- **Analytics and monitoring.** Cookieless traffic analytics, product events (what people convert, calculator and copy-link use, themes chosen), real-user speed (Core Web Vitals), search performance, and optionally errors and uptime; each script counted against the budget.

### Out of scope

Time zones and calendar math, clothing and shoe sizes, decibels, number-base conversion, and "fun" units. Each is a different kind of tool. Revisit after launch if users ask.

## 3. UX concept

Full behavior lives in `docs/UX-SPEC.md`. The short version:

1. Both boxes start empty; focusing one lists the categories.
2. The user types a number, a unit, or both into either box. The parser splits the text into an optional number and an optional unit query.
3. Suggestions update on every keystroke with the best match highlighted, but nothing commits on a keystroke: Enter or a pick puts the unit into a chip, and Tab or clicking away leaves the text as typed. Ambiguous matches (`oz`, later `ton`, `cup`, `gal`) name their category so the choice is visible.
4. When one box has a unit, the other box's list is scoped to that category, most common units first.
5. Once both boxes have a unit, the result appears live in the box that is not the source. Typing a number into either box makes it the source.
6. Swap flips the pair; undo, redo, and clear all sit above the boxes. A calculator beside them works a number out and sends it to either box.

The smart input is the whole product. It is the first thing to build and the first thing to test with people.

## 4. Do we need a database?

**No.** A converter is static data plus arithmetic. Conversion factors are constants. Everything the app needs ships with the page and runs in the browser.

| Need                                       | Where it lives                              |
| ------------------------------------------ | ------------------------------------------- |
| Unit definitions and factors               | TypeScript data in `packages/core`, bundled |
| Theme, mode, precision, locale preferences | `localStorage`                              |
| Recent and favorite conversions            | `localStorage`                              |
| Current conversion (for sharing)           | URL                                         |
| Usage analytics (which units people use)   | Third-party cookieless analytics            |

What would change the answer: accounts with cross-device sync of favorites (needs auth plus storage), or server-side logging of search queries that returned nothing. Both are additive and can be bolted on later without touching the core. Currency needs an external rate API, not a database. Do not set up Supabase for v1. See ADR 0001.

## 5. Architecture

Two layers with a hard boundary (ADR 0003). `packages/core` is pure TypeScript with zero runtime dependencies and no DOM: units, conversion, parsing, search, and formatting. `apps/web` is the Astro site with one island for the converter, written against the React API and run on Preact through `preact/compat` (ADR 0007): everything the user sees. The module map, data flow, and how to extend each part are in `docs/ARCHITECTURE.md`.

- **Data model.** `Category` and `Unit` in `packages/core/src/types.ts`. Conversion always goes `from → base → to`, never through an intermediate unit: linear units multiply by a factor; non-linear units (temperature now, fuel economy later) use a `toBase`/`fromBase` pair. Every unit cites its source.
- **Converter state.** `apps/web/src/features/converter/state.ts`: each box's text and unit, the source box, and the mode, with undo history around them. The calculator's entry lives beside them in the converter, outside the undo history; a send is one undoable step.
- **URL.** The state serializes to `?a=<unit id>&b=<unit id>&v=<number>&s=<a|b>` (docs/UX-SPEC.md §11), so sharing, bookmarks, and later SEO pages use one mechanism.

## 6. Stack (ADR 0002, accepted)

| Concern               | Choice                                                   | Why                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework             | **Astro** with a **Preact** island (React API, ADR 0007) | Static HTML by default, zero JS outside the converter, static page generation for later SEO pages, built-in view transitions                                         |
| Language              | **TypeScript** (strict)                                  | Catches unit-data mistakes at compile time                                                                                                                           |
| Styling               | **Tailwind CSS v4** over **CSS custom properties**       | Tokens are plain CSS variables so themes are just variable sets; Tailwind for speed and consistency                                                                  |
| Accessible primitives | **Native elements + a hand-built combobox** (ADR 0006)   | React Aria was tried and removed at milestone 2: its button machinery alone cost 12 KB gzipped, and the hybrid number-and-unit field does not fit a library combobox |
| Package manager       | **pnpm** workspaces                                      | Fast; the workspace enforces the core/web boundary physically                                                                                                        |
| Tests                 | **Vitest** (core), **Playwright** + **axe** (web)        | Table-driven golden tests for math; end-to-end plus automated accessibility checks                                                                                   |
| Lint/format           | **ESLint** (flat) + **Prettier**                         | Boring, complete coverage of `.astro`, `.tsx`, and `.css`                                                                                                            |
| Perf gates            | Bundle size check now; **Lighthouse CI** at milestone 5  | Budgets fail the build                                                                                                                                               |
| Hosting               | **Cloudflare Pages**                                     | Free, global edge, preview deploy per pull request, free cookieless analytics                                                                                        |
| Repo                  | **GitHub**                                               | Actions for CI, PR previews                                                                                                                                          |

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

Theme roster (working names, to be designed):

| Theme      | Feel               | Notes                                                                            |
| ---------- | ------------------ | -------------------------------------------------------------------------------- |
| `daylight` | neutral light      | default, system fonts, the baseline                                              |
| `midnight` | neutral dark       | default when the OS prefers dark                                                 |
| `sakura`   | cherry blossom     | soft pinks, paper texture, slow petal drift (CSS only, off under reduced motion) |
| `neo-noir` | Tokyo at night     | near-black, magenta and cyan glow, monospace numerals, rain streak texture       |
| `hardhat`  | job site           | safety yellow and steel, blueprint grid, stencil display face, chunky targets    |
| `theorem`  | higher mathematics | chalkboard or graph paper, math serif, typeset-looking results                   |

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

The JS and CSS budgets gate CI (`pnpm bundle:check`), counting everything the page can load, lazily loaded chunks included. Measured 2026-10-06 at the end of milestone 2: 82.0 KB JS and 5.3 KB CSS gzipped; with copy link, the calculator, and arithmetic, 86.5 KB JS and 5.7 KB CSS; with the wordmark at play and theme art, 89.2 KB JS and 5.9 KB CSS; on Preact (ADR 0007), 33.9 KB JS; with the tuned wordmark, 38.2 KB JS and 6.2 KB CSS (`pnpm bundle`). The Lighthouse budgets join CI at milestone 5.

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

| Doc                        | Purpose                                           | Updated when                   |
| -------------------------- | ------------------------------------------------- | ------------------------------ |
| `CLAUDE.md`                | Conventions and rules for every working session   | Rules change                   |
| `docs/PLAN.md`             | Vision, scope, architecture, milestones           | Scope or plan changes          |
| `docs/UX-SPEC.md`          | Exact UI behavior                                 | Before any behavior change     |
| `docs/UNITS-CATALOG.md`    | Taxonomy, tiers, special cases, sources           | Units or categories change     |
| `docs/ARCHITECTURE.md`     | Modules, data flow, boundaries, how to extend     | Structure changes              |
| `docs/DESIGN-SYSTEM.md`    | Tokens, components, usage rules                   | Tokens or components change    |
| `docs/THEMING.md`          | How to author and QA a theme                      | Theming mechanism changes      |
| `docs/TESTING.md`          | Test layers, how to add golden rows, CI gates     | Test approach changes          |
| `docs/decisions/NNNN-*.md` | Why we chose what we chose                        | A decision is made or reversed |
| `docs/LEARNINGS.md`        | Dated log of gotchas and best practices           | Something is learned           |
| `docs/research/`           | Usability test scripts, feedback rounds, findings | A test or feedback round runs  |

Rule of thumb: if a future session would have to rediscover it, write it down.

## 13. Milestones

| #   | Milestone              | Done when                                                                                                                                                                                                                                                                   |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | **Setup**              | Tooling installed, repo on GitHub, workspace scaffolded, CI runs lint + typecheck + tests, docs skeleton in place. **Done 2026-10-06.**                                                                                                                                     |
| M1  | **Core engine**        | Eight primary categories with basic-tier units, parser, search, formatter; golden and round-trip tests green; zero UI. **Done 2026-10-06.**                                                                                                                                 |
| M2  | **Smart input spike**  | Two linked boxes with the `daylight` theme, mobile-first, URL state; usability test with five people; bundle measured against budget. **Code done 2026-10-06; usability test pending.**                                                                                     |
| M3  | **Complete converter** | Basic/advanced modes, persistence, remaining basic-tier categories, advanced categories loaded on demand. Shipped early: swap (M2); the calculator (a scratch pad with + − × ÷ whose number can be sent to either box), arithmetic in the boxes, and copy link (2026-10-06) |
| M4  | **Themes**             | `midnight`, `sakura`, `neo-noir`, `hardhat`, `theorem` designed and polished: fonts and decoration (per-theme art shipped early, 2026-10-06). The picker, the contrast test, the gallery, and the bundle budget already exist                                               |
| M5  | **Launch**             | SEO pair pages, analytics, PWA manifest and offline, domain, Lighthouse gates passing                                                                                                                                                                                       |

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

| Account                            | Needed by               | Cost       |
| ---------------------------------- | ----------------------- | ---------- |
| GitHub                             | M0                      | free       |
| Cloudflare (Pages + Web Analytics) | M2, for preview deploys | free       |
| Domain registrar                   | M5                      | ~$10–20/yr |

### Not needed

Supabase or any database. A backend. A paid analytics tier. An app store account.

## 15. Decisions (made 2026-10-06)

1. **Stack.** Astro + React + TypeScript + Tailwind v4 (ADR 0002, accepted). Re-examined against an all-React Vite framework the same day and kept; the operating rule is TSX components for interaction, Astro for structure. The island's runtime became Preact (decision 10).
2. **Primary categories.** The eight in `docs/UNITS-CATALOG.md`: Length, Weight, Volume, Temperature, Area, Speed, Time, Data.
3. **Themes.** Framework and palettes for all six now; polish one at a time in milestone 4, `sakura` first (docs/THEMING.md).
4. **Locale defaults.** Detect from the browser, fall back to US; manual override in settings later. Implemented as `regionDefaults` in core.
5. **Toolchain.** Latest where compatible, accessibility tooling never dropped (ADR 0005). TypeScript 6 until the ecosystem supports 7.
6. **Input flexibility.** Spacing, locale number formats, typed math, and Enter-as-equals are a standing UX principle, phased in `docs/UX-SPEC.md` §14.
7. **Commit rules.** Nothing commits on a keystroke. Enter commits the highlighted best match, or a pick does; Tab and clicking away never commit, so moving between boxes never changes what was typed (`docs/UX-SPEC.md` §5).
8. **Token guard.** `pnpm lint` rejects raw colors, palette colors, one-off arbitrary values, untokened radii, shadows, fonts, and literal durations and delays in components. A flagged need is matched to an existing token or brought to the owner as a proposed new one (`docs/DESIGN-SYSTEM.md`, "Token guard").
9. **Control edges.** Fields, the theme menu, and secondary buttons are edged in a new `--edge` token at 3:1 against the page and the surface (WCAG 1.4.11); `--line` stays for dividers. A trial: reverting its one commit restores the lighter edges.
10. **Framework.** The island runs on Preact through `preact/compat` (ADR 0007): 89.2 KB of JavaScript became 33.9 KB with no change to how components are written, and the 90 KB budget stays, so the room goes to the product. Owner's choice after a measured spike.

Still open: SEO pages in v1 (proposed yes, built at M5). Domains bought 2026-10-07: `bigsmall.fyi` and `bigsmall.work`; to decide before launch: which is canonical (the other redirects to it), and hosting on Vercel, the owner's preference, in place of Cloudflare Pages (ADR 0002), recorded as an ADR when chosen.

## 16. Risks and open questions

- **Ambiguous symbols** (`m`, `oz`, `ton`, `gal`, `cup`, `cal`, `hp`, `mpg`, `kB`). The disambiguation UX decides whether the smart input feels magical or annoying. Test it early.
- **Explicit commit.** Decided: nothing commits on a keystroke, and only Enter or a pick commits (decision 7). The risk left is people who never press Enter; the usability test watches for it.
- **Bundle size.** Resolved at M2 by removing React Aria (ADR 0006), then at its ceiling (89.2 KB of 90) until the island moved to Preact (ADR 0007): 33.9 KB, about 56 KB of headroom under the same gate. As formulas and units grow, unit data loads per category against its own budget (§9) so the code that runs first stays small.
- **Themes vs. speed.** Decoration must be free when inactive. Fonts are the main cost; system fonts for the defaults.
- **Locale number parsing.** `1,5` means 1.5 in much of the world. Use the browser locale and show the detected format.
- **Definitions that vary.** Month, year, cup, calorie, horsepower, ton. Each needs a stated definition in the UI and a note in the catalog.
