# Architecture

How the code is organized, where the boundaries are, and how to extend it without breaking the structure. Behavior lives in docs/UX-SPEC.md; visual rules in docs/DESIGN-SYSTEM.md.

## Shape

```
bigsmall/
├── packages/core        @bigsmall/core — the engine. Pure TypeScript. Zero runtime deps. No DOM.
└── apps/web             @bigsmall/web  — the site. Astro shell, Preact islands (React API), Tailwind over tokens.
```

Two packages, one direction of dependency: `web` imports `core`, never the reverse. The pnpm workspace makes this a physical boundary, `packages/core/tsconfig.json` has no DOM library, and ESLint forbids framework and DOM imports inside core and internal-path imports from web (ADR 0003).

## packages/core

| File                 | Responsibility                                                                                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types.ts`       | Data model: `Category`, `Unit` (linear, affine, functional), tiers, systems                                                                                                                                                      |
| `src/units/<id>.ts`  | One file per category: the `Category` record and its `Unit[]`, every unit with a cited source                                                                                                                                    |
| `src/units/index.ts` | Registry: `categories`, `units`, `getUnit`, `getCategory`, `unitsIn`                                                                                                                                                             |
| `src/convert.ts`     | `convert(value, from, to)` via the category base unit; `toBase` / `fromBase`; `ConversionError`                                                                                                                                  |
| `src/normalize.ts`   | `normalizeKey` / `compactKey`: the folded form typed text is matched in (degree signs, superscripts, µ, periods, case, spacing)                                                                                                  |
| `src/parse.ts`       | `parse(text, separators)`: the leading number or arithmetic (+ − × ÷, signs, parentheses; a small hand-written parser, never eval), locale-tolerant, flagged `outOfRange` or `invalid` when it has no value, plus the unit query |
| `src/search.ts`      | `search`, `resolveExact`, `suggest`: ranked unit and category matches by match class, scope, tier escalation, and unit family                                                                                                    |
| `src/highlight.ts`   | `matchSpan(text, query)`: where a query appears in a label under the same folding, for setting matched letters heavier                                                                                                           |
| `src/format.ts`      | `formatNumber`: significant digits, locale grouping, scientific switch                                                                                                                                                           |
| `src/locale.ts`      | `localeSeparators(locale)`: decimal and group marks from Intl                                                                                                                                                                    |
| `src/region.ts`      | `regionDefaults(region)`: which unit family a region expects; unknown falls back to US                                                                                                                                           |
| `src/index.ts`       | The public API. Web imports only from here.                                                                                                                                                                                      |

Per keystroke the UI calls `suggest(text, { category, separators, system, tier })`: `parse` splits number from query, `search` ranks registry keys within the scope, and `resolveExact` says whether the query names exactly one unit, which is what Tab and leaving a box commit. A scoped query with no results is searched again unscoped. Empty lists and the scoped placeholder use `search('')`. Once both boxes hold units the UI calls `convert` and `formatNumber`. All pure functions over the registry; nothing is cached across calls because the registry is small.

Unit kinds:

- **linear**: `base = value × factor`. Almost everything.
- **affine**: `base = (value + offset) × factor`. Temperature scales.
- **functional**: custom `toBase` / `fromBase`. Reciprocal units such as fuel economy and pace.

Every conversion is `from → base → to`. Nothing chains through a third unit, so error never accumulates beyond two floating-point operations.

## apps/web

| Path                        | Responsibility                                                                                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/layouts/Base.astro`    | HTML shell, meta, global CSS, and the inline script: the pre-paint theme, the header-menu controller, and the Ctrl or ⌘ key labels. `noindex` keeps a page out of search                                                                                                                                |
| `src/layouts/DevPage.astro` | A `/dev` page: Base with `noindex`, the shared header, an intro line, then the page's tools                                                                                                                                                                                                             |
| `src/pages/`                | Routes. `index.astro` is the converter; `dev/gallery.astro` renders every component in every theme; `dev/wordmark-lab.astro` tunes the wordmark at play. A page's own parts sit in a folder named after it with a leading underscore, which Astro does not route: `dev/_gallery/`, `dev/_wordmark-lab/` |
| `src/components/`           | Design-system components: Button, UnitChip, SuggestionPanel, Keycap, Calculator, NumberText, ToolbarDivider, icons (TSX); ThemePicker, ShortcutsHelp, HeaderMenus, which places them, Wordmark and ThemeArt, and PageHeader, which places the wordmark and the menus (Astro). Tokens only               |
| `src/features/<name>/`      | Product features composed from components and core (`converter/` holds the converter island)                                                                                                                                                                                                            |
| `src/lib/`                  | Shared helpers with no markup of their own (see below)                                                                                                                                                                                                                                                  |
| `src/styles/global.css`     | Tailwind import, theme imports, the token → utility bridge, custom utilities, base styles                                                                                                                                                                                                               |
| `src/styles/themes/*.css`   | One token set per theme                                                                                                                                                                                                                                                                                 |
| `test/`                     | Node-only unit tests: the converter reducer, view, and history; the URL; the theme contract and contrast                                                                                                                                                                                                |
| `e2e/`                      | Playwright on desktop and mobile Chromium: converter behavior, smoke, theme and shortcuts menus, axe accessibility                                                                                                                                                                                      |

### `src/lib`

| File                 | Responsibility                                                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `themes.ts`          | Theme registry, the token contract, and the contrast pairs the theme test enforces                                                                                                                                                                                                     |
| `region.ts`          | `detectRegion()`: the browser's region for unit-family defaults                                                                                                                                                                                                                        |
| `platform.ts`        | `APPLE_PLATFORM`, `isApplePlatform()`: whether shortcuts read ⌘ or Ctrl; the inline script uses the pattern                                                                                                                                                                            |
| `shortcuts.ts`       | `SHORTCUTS`: the list the shortcuts map shows                                                                                                                                                                                                                                          |
| `hydrated.ts`        | `useIsHydrated()`: a `useSyncExternalStore` that flips once on the client, for the island's ready mark                                                                                                                                                                                 |
| `fit-step.ts`        | `useFitStep()`: picks the largest size on a type ladder at which an element's text fits on one line, re-measured on resize                                                                                                                                                             |
| `recipes.ts`         | Class recipes more than one file builds from (the card, the fluid shells, the field row, the type ladders, the wordmark's face and lines) and `cx()`, which joins class lists (docs/DESIGN-SYSTEM.md, "Recipes")                                                                       |
| `copied.ts`          | `useCopied()`: which copy button shows its check, and when it reverts                                                                                                                                                                                                                  |
| `timing.ts`          | Every UI delay as a named constant: typing chunks, URL writes, announcements, copy feedback, hover peek                                                                                                                                                                                |
| `slots.ts`           | `SLOTS` and `useSlot()`: places in static markup an island fills after hydration (the header's Copy URL button)                                                                                                                                                                        |
| `wordmark.ts`        | The wordmark at play: its phrases in twelve kinds, `WORDMARK_TUNING` (the mix, pointer response, the art's chances, type steps), `nextPhrase()`, `fitSteps()` and `lineBreaks()`, the split-flap `flapPlan()` and `flapFrame()`, and `pace()` from pointer speed. Pure; tested in node |
| `wordmark-motion.ts` | The wordmark's DOM script, which Wordmark.astro and the lab load: `fitPhrase()` and `prepare()` set a phrase and plan its flips, `play()` runs it from the pointer and returns the controls the lab uses                                                                               |

### The converter (`apps/web/src/features/converter`)

| File              | Responsibility                                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `state.ts`        | `reduce` (input, replace, setText, lock, calcType, calcSet, unlock, swap, clear, setMode, hydrate); `selectView` (texts, scope, result, per-box `message` for out-of-range values, `anchor`, announcement); `reduceWithHistory` (undo, redo, `stepBack`, typing chunks for the boxes and the calculator's entry, 50 steps) and `escapeTarget`. Pure; tested in node |
| `url.ts`          | `stateToParams` / `paramsToState`: the conversion as `?a=&b=&v=&s=`; `urlFor`: the full URL that Copy URL copies                                                                                                                                                                                                                                                    |
| `useConverter.ts` | Owns the history reducer, detects locale and region once, restores from the URL after hydration, writes the URL (debounced), paces the live region, exposes each box's Escape target                                                                                                                                                                                |
| `SmartInput.tsx`  | One box: field, text layer, chip, copy slot, out-of-range message, and the suggestion listbox with its Back row. The WAI-ARIA combobox pattern by hand (ADR 0006)                                                                                                                                                                                                   |
| `calculator.ts`   | The calculator's rules: `pressKey` (what a key does to its entry, E and ^ included), `isStepKey` (= and C are steps of their own), `placeNumber` (a sent value into a box's text, keeping its unit text), `evaluatedText` (arithmetic into its value, for = and Enter in a box). Pure; tested in node                                                               |
| `Converter.tsx`   | The island: hint with undo, redo, and clear all; the two boxes, swap, copy buttons, category labels; the Copy URL button, drawn into the header slot; the calculator toggle, its entry, and sending its value to a box; Ctrl/⌘ undo and redo; live regions; the `data-hydrated` mark                                                                                |

### Islands and the inline script

Astro renders every page to static HTML. JavaScript ships only for components marked `client:*`, and only islands carry the framework: Preact, with `preact/compat` answering the components' `'react'` imports (ADR 0007). A TSX component used without a directive (the icons inside Astro components) renders to plain markup. Rule of thumb: if a thing can be HTML plus a few lines of inline script, it is not an island. The header menus are the worked example: ThemePicker and ShortcutsHelp are Astro markup driven by one controller in the inline script of `Base.astro` (`[data-shell]`, `[data-shell-toggle]`, `[data-open]`, `[data-pinned]`, `[data-shell-hover]`, `[data-shell-initial]`), so they work before any bundle loads and add none (ADR 0002, outcome note).

### Theming

A theme is a set of CSS custom properties on `[data-theme="id"]`. Components consume semantic tokens through Tailwind utilities (`bg-canvas`, `text-ink`, `rounded-md`) that resolve to those properties at runtime, so switching themes touches one attribute on `<html>`. Details in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) and [THEMING.md](THEMING.md).

### State and URLs

The converter state lives in the island and serializes to the URL as `?a=<unit id>&b=<unit id>&v=<number>&s=<a|b>`; `v` and `s` appear only with a number. Preferences (today, only the theme) live in `localStorage`. There is no server state (ADR 0001).

## Build and runtime

- `pnpm dev` runs the Astro dev server; `pnpm build` writes a static site to `apps/web/dist`; `pnpm preview` serves that build.
- Core ships as TypeScript source (`exports` points at `src/index.ts`); Vite compiles it with the app. No build step for core.
- `scripts/bundle-size.mjs` measures what the converter page ships, gzipped; `pnpm bundle:check` enforces the budgets (docs/PLAN.md §9).
- Hosting target is any static host; Cloudflare Pages is planned (docs/PLAN.md §6).

## How to extend

| Want to…          | Do this                                                                                                                                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a unit        | Edit `packages/core/src/units/<category>.ts`, cite the source, add a golden row. See docs/UNITS-CATALOG.md §6                                                                                                                                                          |
| Add a category    | Add the id to `CategoryId`, create `units/<id>.ts`, register it in `units/index.ts`, add a `test/golden/<id>.ts` file and list it in `test/golden/index.ts`, update the category lists in `test/registry.test.ts` and `test/search.test.ts`, and add the catalog entry |
| Add a component   | Create it in `src/components/`, tokens only, keyboard and label checked, add it to the gallery. See docs/DESIGN-SYSTEM.md                                                                                                                                              |
| Add a feature     | Create `src/features/<name>/`, compose components, import core only through `@bigsmall/core`                                                                                                                                                                           |
| Add a shortcut    | Handle the key in code, add it to `src/lib/shortcuts.ts`, and describe it in docs/UX-SPEC.md §8                                                                                                                                                                        |
| Add a header menu | Reuse the shell controller: markup with `data-shell` and `data-shell-toggle` like ThemePicker, placed in `HeaderMenus.astro`; no new script                                                                                                                            |
| Add a UI delay    | A named constant in `src/lib/timing.ts`; never a literal number of milliseconds                                                                                                                                                                                        |
| Add a theme       | Follow docs/THEMING.md. The contract test fails until every token exists and every pair passes contrast                                                                                                                                                                |
| Add a page        | `src/pages/<route>.astro` using `Base.astro` and `PageHeader`; a `/dev` page uses `DevPage.astro`. Islands only where there is real interaction                                                                                                                        |
| Change behavior   | Update docs/UX-SPEC.md in the same change                                                                                                                                                                                                                              |

## Conventions

- File names: kebab-case for `.ts`/`.css` modules, PascalCase for TSX and Astro components.
- Imports: from `@bigsmall/core` only; relative paths inside a package.
- No default exports in TypeScript modules. Astro components and tool config files (`astro.config.mjs`, `eslint.config.js`, `playwright.config.ts`, `vitest.config.ts`) are the exceptions, by framework design.
- Comments explain why, not what. Decisions go in `docs/decisions/`, surprises in `docs/LEARNINGS.md`.
