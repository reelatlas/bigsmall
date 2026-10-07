# Architecture

How the code is organized, where the boundaries are, and how to extend it without breaking the structure. Behavior lives in docs/UX-SPEC.md; visual rules in docs/DESIGN-SYSTEM.md.

## Shape

```
bigsmall/
├── packages/core        @bigsmall/core — the engine. Pure TypeScript. Zero runtime deps. No DOM.
└── apps/web             @bigsmall/web  — the site. Astro shell, React islands, Tailwind over tokens.
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

| Path                      | Responsibility                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/layouts/Base.astro`  | HTML shell, meta, global CSS, and the inline script: the pre-paint theme, the header-menu controller, and the Ctrl or ⌘ key labels                                                         |
| `src/pages/`              | Routes. `index.astro` is the converter; `dev/gallery.astro` renders every component in every theme                                                                                         |
| `src/components/`         | Design-system components: Button, UnitChip, SuggestionPanel, Keycap, Keypad, Segmented, icons (React); ThemePicker, ShortcutsHelp, and HeaderMenus, which places them (Astro). Tokens only |
| `src/features/<name>/`    | Product features composed from components and core (`converter/` holds the converter island)                                                                                               |
| `src/lib/`                | Shared helpers with no markup of their own (see below)                                                                                                                                     |
| `src/styles/global.css`   | Tailwind import, theme imports, the token → utility bridge, custom utilities, base styles                                                                                                  |
| `src/styles/themes/*.css` | One token set per theme                                                                                                                                                                    |
| `test/`                   | Node-only unit tests: the converter reducer, view, and history; the URL; the theme contract and contrast                                                                                   |
| `e2e/`                    | Playwright on desktop and mobile Chromium: converter behavior, smoke, theme and shortcuts menus, axe accessibility                                                                         |

### `src/lib`

| File           | Responsibility                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `themes.ts`    | Theme registry, the token contract, and the contrast pairs the theme test enforces                                         |
| `region.ts`    | `detectRegion()`: the browser's region for unit-family defaults                                                            |
| `platform.ts`  | `APPLE_PLATFORM`, `isApplePlatform()`: whether shortcuts read ⌘ or Ctrl; the inline script uses the pattern                |
| `shortcuts.ts` | `SHORTCUTS`: the list the shortcuts map shows                                                                              |
| `hydrated.ts`  | `useIsHydrated()`: a `useSyncExternalStore` that flips once on the client, for the island's ready mark                     |
| `fit-step.ts`  | `useFitStep()`: picks the largest type size at which an element's text fits on one line, re-measured on resize             |
| `copied.ts`    | `useCopied()`: which copy button shows its check, and when it reverts                                                      |
| `timing.ts`    | Every UI delay as a named constant: typing chunks, URL writes, announcements, copy feedback, hover peek                    |
| `shell.ts`     | The fluid-shell class recipe the fields and the header menus share (`SHELL`, `SHELL_BORDERED`, `SHELL_GHOST`, `FIELD_ROW`) |
| `slots.ts`     | `SLOTS` and `useSlot()`: places in static markup an island fills after hydration (the header's copy link)                  |

### The converter (`apps/web/src/features/converter`)

| File              | Responsibility                                                                                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `state.ts`        | `reduce` (input, replace, setText, lock, unlock, swap, clear, setMode, hydrate); `selectView` (texts, scope, result, per-box `message` for out-of-range values, `anchor`, announcement); `reduceWithHistory` (undo, redo, `stepBack`, typing chunks, 50 steps) and `escapeTarget`. Pure; tested in node |
| `url.ts`          | `stateToParams` / `paramsToState`: the conversion as `?a=&b=&v=&s=`; `linkFor`: the full address copy link copies                                                                                                                                                                                       |
| `useConverter.ts` | Owns the history reducer, detects locale and region once, restores from the URL after hydration, writes the URL (debounced), paces the live region, exposes each box's Escape target                                                                                                                    |
| `SmartInput.tsx`  | One box: field, text layer, chip, copy slot, out-of-range message, and the suggestion listbox with its Back row. The WAI-ARIA combobox pattern by hand (ADR 0006)                                                                                                                                       |
| `keypad.ts`       | `pressKey`: what each keypad key does to a box's text; `evaluatedText`: arithmetic turned into its value for = and Enter. Pure; tested in node                                                                                                                                                          |
| `Converter.tsx`   | The island: hint with undo, redo, and clear all; the two boxes, swap, copy buttons, category labels; the copy-link button, drawn into the header slot; the calculator toggle and keypad; Ctrl/⌘ undo and redo; live regions; the `data-hydrated` mark                                                   |

### Islands and the inline script

Astro renders every page to static HTML. JavaScript ships only for components marked `client:*`, and only React islands carry React; a React component used without a directive (the icons inside Astro components) renders to plain markup. Rule of thumb: if a thing can be HTML plus a few lines of inline script, it is not an island. The header menus are the worked example: ThemePicker and ShortcutsHelp are Astro markup driven by one controller in the inline script of `Base.astro` (`[data-shell]`, `[data-shell-toggle]`, `[data-open]`, `[data-pinned]`, `[data-shell-hover]`, `[data-shell-initial]`), so they work before any bundle loads and add none (ADR 0002, outcome note).

### Theming

A theme is a set of CSS custom properties on `[data-theme="id"]`. Components consume semantic tokens through Tailwind utilities (`bg-canvas`, `text-ink`, `rounded-md`) that resolve to those properties at runtime, so switching themes touches one attribute on `<html>`. Details in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) and [THEMING.md](THEMING.md).

### State and URLs

The converter state lives in the React island and serializes to the URL as `?a=<unit id>&b=<unit id>&v=<number>&s=<a|b>`; `v` and `s` appear only with a number. Preferences (today, only the theme) live in `localStorage`. There is no server state (ADR 0001).

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
| Add a page        | `src/pages/<route>.astro` using `Base.astro`. Islands only where there is real interaction                                                                                                                                                                             |
| Change behavior   | Update docs/UX-SPEC.md in the same change                                                                                                                                                                                                                              |

## Conventions

- File names: kebab-case for `.ts`/`.css` modules, PascalCase for React and Astro components.
- Imports: from `@bigsmall/core` only; relative paths inside a package.
- No default exports in TypeScript modules. Astro components and tool config files (`astro.config.mjs`, `eslint.config.js`, `playwright.config.ts`, `vitest.config.ts`) are the exceptions, by framework design.
- Comments explain why, not what. Decisions go in `docs/decisions/`, surprises in `docs/LEARNINGS.md`.
