# bigsmall — project plan

Last updated: 2026-10-06. Status: milestones 0 and 1 complete; milestone 2 (smart input spike) is next.

## 1. Vision

The best-feeling unit converter on the web. The two incumbents (unitconverters.net, onlineconversion.com) are correct and comprehensive but their UX is from another decade: two scrolling list boxes, a Convert button, tiny targets, ad-heavy pages, and no sense of place. bigsmall competes on experience, not on breadth, while still matching the coverage people expect.

Positioning in one line: _type anything into either box and get the answer._

## 2. What we are building

### v1 (launch)

- **Two linked smart inputs.** Each accepts a number, a unit, or both (`5 ml`, `ml`, `5`). Typing in one updates the other instantly. Either box can be the source.
- **Smart search.** Empty box shows categories. Typing a unit narrows to matching units across categories. Typing a category word (`fluids`, `temp`) narrows to that category. Once one box has a unit, the other is scoped to the same category.
- **Manual selection.** Everything reachable by tapping, with no typing required.
- **Keypad.** A toggleable on-screen keypad that targets the active box, for touch-only use.
- **Basic and advanced modes.** Basic shows the common units of the common categories. Advanced reveals everything. Searching for an advanced unit escalates automatically.
- **Themes.** Two neutral defaults (light, dark) plus distinctive aesthetic themes. Theme choice persists.
- **Shareable URLs.** The current conversion is in the URL, so links and bookmarks work.
- **Fast, accessible, responsive.** See budgets and targets below.

### Later

- SEO landing pages, one static page per popular unit pair, generated from the unit data.
- PWA: installable, works offline. This covers most of the "app" ambition with no app store.
- Currency (needs live rates from an API, still no database).
- Ingredient-aware cooking conversions (cups of flour to grams).
- Expression input: typed math in the box (`2^10 bytes`, `(5+7)/2 cm`), Enter as equals, operator keys on the keypad, fraction and feet-and-inches entry. Principle and phasing in `docs/UX-SPEC.md` §13.
- Native wrapper (Capacitor) only if the PWA proves insufficient.

### Out of scope

Time zones and calendar math, clothing and shoe sizes, decibels, number-base conversion, and "fun" units. Each is a different kind of tool. Revisit after launch if users ask.

## 3. UX concept

Full behavior lives in `docs/UX-SPEC.md`. The short version:

1. Both boxes start empty, showing the primary categories as chips.
2. The user types into either box. The parser splits the text into an optional number and an optional unit query.
3. Suggestions update on every keystroke. An unambiguous exact match locks the unit into a chip. Ambiguous matches (`oz`, `ton`, `cup`, `gal`) show their category so the user can pick.
4. When one box has a unit, the other box's suggestions are scoped to that category and ordered by the most common counterpart.
5. Once both boxes have a unit, the result appears live in whichever box was not edited last. Editing either side makes it the source.
6. A swap button flips the pair. A keypad button docks a keypad that targets the active box.

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

Two layers with a hard boundary (ADR 0003):

```
packages/core      pure TypeScript, zero runtime deps, no DOM
  units/           one file per category: length.ts, volume.ts, ...
  convert.ts       convert(value, fromUnit, toUnit)
  parse.ts         "5 ml" -> { value: 5, query: "ml" }
  search.ts        unit and category search with ranking
  format.ts        significant figures, locale grouping, exponent switch
  index.ts         public API

apps/web           Astro site with one React island for the converter
  components/      design-system components (Button, Chip, Field, Sheet, Keypad, ...)
  features/        converter/ (SmartInput, ConverterShell, Suggestions, Keypad)
  styles/          tokens.css, themes/*.css
  pages/           index, /[category]/[from]-to-[to] (later), /dev/gallery
```

### Core data model (draft)

```ts
type Category = {
  id: string; // "length"
  name: string; // "Length"
  aliases: string[]; // ["distance", "how far"]
  baseUnit: string; // "meter"
  tier: 'basic' | 'advanced';
  group:
    | 'everyday'
    | 'mechanics'
    | 'fluids'
    | 'heat'
    | 'electromagnetism'
    | 'light'
    | 'radiation'
    | 'digital';
};

type Unit = {
  id: string; // "milliliter"
  category: string; // "volume"
  name: string; // "milliliter"
  plural: string; // "milliliters"
  symbol: string; // "mL"
  aliases: string[]; // ["ml", "millilitre", "cc", "cubic centimeter"]
  system: 'si' | 'metric' | 'us' | 'imperial' | 'other';
  tier: 'basic' | 'advanced';
  factor?: number; // 1 unit = factor base units (linear units)
  toBase?: (v: number) => number; // non-linear units (temperature, fuel economy)
  fromBase?: (v: number) => number;
  exact: boolean; // factor is exact by definition
  source: string; // "NIST SP 811 §B.8" or "BIPM SI Brochure 9th ed. §2.3.1"
};
```

Conversion is always `from -> base -> to`, never chained through intermediate units. Linear units multiply; non-linear units use their function pair.

### Converter state (draft)

```ts
type BoxState = { text: string; value: number | null; unit: string | null };
type ConverterState = {
  a: BoxState;
  b: BoxState;
  source: 'a' | 'b'; // which box was edited last
  category: string | null; // locked once either box has a unit
  mode: 'basic' | 'advanced';
  keypad: { open: boolean; target: 'a' | 'b' };
};
```

State serializes to the URL (`/?a=5ml&b=cup`) so sharing, bookmarks, and later SEO pages all use one mechanism.

## 6. Stack (proposed, ADR 0002)

| Concern               | Choice                                             | Why                                                                                                                          |
| --------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Framework             | **Astro** with a **React** island                  | Static HTML by default, zero JS outside the converter, static page generation for later SEO pages, built-in view transitions |
| Language              | **TypeScript** (strict)                            | Catches unit-data mistakes at compile time                                                                                   |
| Styling               | **Tailwind CSS v4** over **CSS custom properties** | Tokens are plain CSS variables so themes are just variable sets; Tailwind for speed and consistency                          |
| Accessible primitives | **React Aria Components**                          | Best-tested combobox, listbox, number field, and dialog on mobile screen readers; locale-aware number parsing included       |
| Package manager       | **pnpm** workspaces                                | Fast; the workspace enforces the core/web boundary physically                                                                |
| Tests                 | **Vitest** (core), **Playwright** + **axe** (web)  | Table-driven golden tests for math; end-to-end plus automated accessibility checks                                           |
| Lint/format           | **ESLint** (flat) + **Prettier**                   | Boring, complete coverage of `.astro`, `.tsx`, and `.css`                                                                    |
| Perf gates            | **Lighthouse CI**, bundle size check               | Budgets fail the build                                                                                                       |
| Hosting               | **Cloudflare Pages**                               | Free, global edge, preview deploy per pull request, free cookieless analytics                                                |
| Repo                  | **GitHub**                                         | Actions for CI, PR previews                                                                                                  |

Alternative worth naming: **SvelteKit** gives smaller bundles and built-in motion. It loses the React component ecosystem and React Aria. Choose it only if bundle size proves to be the deciding factor after the first measurement. **Next.js** is not recommended: heavier runtime and server features this project never uses.

Bundle check at milestone 2: if the converter island exceeds budget, swap React Aria for a lighter headless library (Base UI or Downshift) before writing more UI.

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
│   ├── ARCHITECTURE.md          (scaffold)
│   ├── DESIGN-SYSTEM.md         (scaffold)
│   ├── THEMING.md               (scaffold)
│   ├── TESTING.md               (scaffold)
│   └── decisions/               ADRs
├── packages/
│   └── core/                    @bigsmall/core
└── apps/
    └── web/                     Astro site
```

## 8. Design system and theming

Three token layers:

1. **Primitives.** Raw palettes and scales (`--pink-200`, `--space-4`). Never used in components.
2. **Semantic tokens.** What components consume: `--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--accent-contrast`, `--border`, `--focus`, `--radius-md`, `--font-display`, `--font-body`, `--font-numeric`, `--shadow-md`, `--dur-base`, `--ease`.
3. **Component tokens.** Only where a component needs its own knob (`--chip-bg`).

A theme is a `[data-theme="name"]` block that reassigns semantic tokens, plus an optional decoration stylesheet for atmosphere (petals, rain streaks, blueprint grid). Components never know which theme is active.

Theme roster (working names, to be designed):

| Theme       | Feel               | Notes                                                                            |
| ----------- | ------------------ | -------------------------------------------------------------------------------- |
| `daylight`  | neutral light      | default, system fonts, the baseline                                              |
| `midnight`  | neutral dark       | default when the OS prefers dark                                                 |
| `sakura`    | cherry blossom     | soft pinks, paper texture, slow petal drift (CSS only, off under reduced motion) |
| `neon-noir` | Tokyo at night     | near-black, magenta and cyan glow, monospace numerals, rain streak texture       |
| `hardhat`   | job site           | safety yellow and steel, blueprint grid, stencil display face, chunky targets    |
| `theorem`   | higher mathematics | chalkboard or graph paper, math serif, typeset-looking results                   |

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

Enforced in CI from milestone 2 onward.

## 10. Accessibility targets

WCAG 2.2 AA throughout. Specifically:

- Keyboard-complete, including suggestion lists, chips, keypad, theme picker.
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
- **Arithmetic.** Double precision via the base unit. Display formatting at up to 12 significant digits with trailing zeros trimmed hides floating-point noise. Move to a decimal library only if a real test case fails.

## 12. Documentation system

| Doc                        | Purpose                                         | Updated when                   |
| -------------------------- | ----------------------------------------------- | ------------------------------ |
| `CLAUDE.md`                | Conventions and rules for every working session | Rules change                   |
| `docs/PLAN.md`             | Vision, scope, architecture, milestones         | Scope or plan changes          |
| `docs/UX-SPEC.md`          | Exact UI behavior                               | Before any behavior change     |
| `docs/UNITS-CATALOG.md`    | Taxonomy, tiers, special cases, sources         | Units or categories change     |
| `docs/ARCHITECTURE.md`     | Modules, data flow, boundaries, how to extend   | Structure changes              |
| `docs/DESIGN-SYSTEM.md`    | Tokens, components, usage rules                 | Tokens or components change    |
| `docs/THEMING.md`          | How to author and QA a theme                    | Theming mechanism changes      |
| `docs/TESTING.md`          | Test layers, how to add golden rows, CI gates   | Test approach changes          |
| `docs/decisions/NNNN-*.md` | Why we chose what we chose                      | A decision is made or reversed |
| `docs/LEARNINGS.md`        | Dated log of gotchas and best practices         | Something is learned           |

Rule of thumb: if a future session would have to rediscover it, write it down.

## 13. Milestones

| #   | Milestone              | Done when                                                                                                                                   |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | **Setup**              | Tooling installed, repo on GitHub, workspace scaffolded, CI runs lint + typecheck + tests, docs skeleton in place. **Done 2026-10-06.**     |
| M1  | **Core engine**        | Eight primary categories with basic-tier units, parser, search, formatter; golden and round-trip tests green; zero UI. **Done 2026-10-06.** |
| M2  | **Smart input spike**  | Two linked boxes with the `daylight` theme, mobile-first, URL state; usability test with five people; bundle measured against budget        |
| M3  | **Complete converter** | Keypad, basic/advanced modes, swap, persistence, remaining basic-tier categories, advanced categories loaded on demand                      |
| M4  | **Themes**             | `midnight`, `sakura`, `neon-noir`, `hardhat`, `theorem`; theme picker; per-theme contrast and gallery QA; perf budgets in CI                |
| M5  | **Launch**             | SEO pair pages, analytics, PWA manifest and offline, domain, Lighthouse gates passing                                                       |

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

1. **Stack.** Astro + React + TypeScript + Tailwind v4 (ADR 0002, accepted). Re-examined against an all-React Vite framework the same day and kept; the operating rule is React for interaction, Astro for structure.
2. **Primary categories.** The eight in `docs/UNITS-CATALOG.md`: Length, Weight, Volume, Temperature, Area, Speed, Time, Data.
3. **Themes.** Framework and palettes for all six now; polish one at a time in milestone 4, `sakura` first (docs/THEMING.md).
4. **Locale defaults.** Detect from the browser, fall back to US; manual override in settings later. Implemented as `regionDefaults` in core.
5. **Toolchain.** Latest where compatible, accessibility tooling never dropped (ADR 0005). TypeScript 6 until the ecosystem supports 7.
6. **Input flexibility.** Spacing, locale number formats, typed math, and Enter-as-equals are a standing UX principle, phased in `docs/UX-SPEC.md` §13.

Still open: SEO pages in v1 (proposed yes, built at M5) and the domain name (check `.app`, `.io`, `.co`, `.tools` availability early).

## 16. Risks and open questions

- **Ambiguous symbols** (`m`, `oz`, `ton`, `gal`, `cup`, `cal`, `hp`, `mpg`, `kB`). The disambiguation UX decides whether the smart input feels magical or annoying. Test it early.
- **Auto-lock vs. explicit pick.** Locking a unit the instant it matches is fast but can surprise. Default proposal is in `docs/UX-SPEC.md`; validate in M2.
- **React Aria bundle size.** Measure at M2. Have a fallback ready.
- **Themes vs. speed.** Decoration must be free when inactive. Fonts are the main cost; system fonts for the defaults.
- **Locale number parsing.** `1,5` means 1.5 in much of the world. Use the browser locale and show the detected format.
- **Definitions that vary.** Month, year, cup, calorie, horsepower, ton. Each needs a stated definition in the UI and a note in the catalog.
