# Architecture

Last updated: 2026-10-06 (milestone 0). How the code is organized, where the boundaries are, and how to extend it without breaking the structure.

## Shape

```
bigsmall/
├── packages/core        @bigsmall/core — the engine. Pure TypeScript. Zero runtime deps. No DOM.
└── apps/web             @bigsmall/web  — the site. Astro shell, React islands, Tailwind over tokens.
```

Two packages, one direction of dependency: `web` imports `core`, never the reverse. The pnpm workspace makes this a physical boundary, `packages/core/tsconfig.json` has no DOM library, and ESLint forbids framework and DOM imports inside core and internal-path imports from web (ADR 0003).

## packages/core

| File                 | Responsibility                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/types.ts`       | Data model: `Category`, `Unit` (linear, affine, functional), tiers, systems                                                |
| `src/units/<id>.ts`  | One file per category: the `Category` record and its `Unit[]`, every unit with a cited source                              |
| `src/units/index.ts` | Registry: `categories`, `units`, `getUnit`, `getCategory`, `unitsIn`                                                       |
| `src/convert.ts`     | `convert(value, from, to)` via the category base unit; `toBase` / `fromBase`; `ConversionError`                            |
| `src/normalize.ts`   | `normalizeKey` / `compactKey`: canonical form for matching typed text (degree signs, superscripts, periods, case, spacing) |
| `src/parse.ts`       | `parse(text, separators)`: the leading number, locale-tolerant, plus the remaining unit query                              |
| `src/search.ts`      | `search`, `resolveExact`, `suggest`: ranked unit and category matches with match classes, scope, tier escalation           |
| `src/format.ts`      | `formatNumber`: significant digits, locale grouping, scientific switch                                                     |
| `src/locale.ts`      | `localeSeparators(locale)`: decimal and group marks from Intl                                                              |
| `src/region.ts`      | `regionDefaults(region)`: which unit family a region expects; unknown falls back to US                                     |
| `src/index.ts`       | The public API. Web imports only from here.                                                                                |

Per keystroke the UI calls `suggest(text, { category, separators })`: `parse` splits number from query, `search` ranks registry keys, `resolveExact` says whether one unit can lock. Once both boxes hold units the UI calls `convert` and `formatNumber`. All pure functions over the registry; nothing is cached across calls because the registry is small.

Unit kinds:

- **linear**: `base = value × factor`. Almost everything.
- **affine**: `base = (value + offset) × factor`. Temperature scales.
- **functional**: custom `toBase` / `fromBase`. Reciprocal units such as fuel economy and pace.

Every conversion is `from → base → to`. Nothing chains through a third unit, so error never accumulates beyond two floating-point operations.

## apps/web

| Path                      | Responsibility                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/layouts/Base.astro`  | HTML shell, meta, global CSS, the inline pre-paint theme script                                    |
| `src/pages/`              | Routes. `index.astro` is the converter; `dev/gallery.astro` renders every component in every theme |
| `src/components/`         | Design-system primitives (Button, ThemePicker). Tokens only, accessible by construction            |
| `src/features/<name>/`    | Product features composed from primitives and core (`converter/` holds the converter island)       |
| `src/lib/`                | Browser-side helpers with no UI: theme registry and contract, region detection                     |
| `src/styles/global.css`   | Tailwind import, theme imports, the token → utility bridge, base styles                            |
| `src/styles/themes/*.css` | One token set per theme                                                                            |
| `test/`                   | Node-only unit tests (theme contract and contrast)                                                 |
| `e2e/`                    | Playwright: smoke, behavior, axe accessibility on desktop and mobile                               |

### The converter (`apps/web/src/features/converter`)

| File              | Responsibility                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `state.ts`        | `reduce` (input, setText, lock, unlock, swap, clear, setMode, hydrate) and `selectView` (texts, result, announcement). Pure; tested in node |
| `url.ts`          | `stateToParams` / `paramsToState`: the conversion as `?a=&b=&v=&s=`                                                                         |
| `useConverter.ts` | Owns the reducer, detects locale and region once, restores from the URL after hydration, writes the URL (debounced), paces the live region  |
| `SmartInput.tsx`  | One box: field, chip, suggestion listbox. The WAI-ARIA combobox pattern by hand (ADR 0006)                                                  |
| `Converter.tsx`   | The island: two inputs, swap, copy, hint, status line, live region, `data-hydrated` mark                                                    |

`src/lib/hydrated.ts` provides `useIsHydrated`, a `useSyncExternalStore` that flips once on the client, so the island can mark itself ready without effects.

### Islands

Astro renders every page to static HTML. JavaScript ships only for components marked `client:*`, and only React islands carry React. Rule of thumb: if a thing can be HTML plus a few lines of inline script, it is not an island. The theme picker is the worked example: a plain `<select>` handled by the pre-paint script, so it works before any bundle loads.

### Theming

A theme is a set of CSS custom properties on `[data-theme="id"]`. Components consume semantic tokens through Tailwind utilities (`bg-canvas`, `text-ink`, `rounded-md`) that resolve to those properties at runtime, so switching themes touches one attribute on `<html>`. Details in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) and [THEMING.md](THEMING.md).

### State and URLs (milestone 2)

The converter state lives in the React island and serializes to the URL (`/?a=5ml&b=cup`). Preferences live in `localStorage`. There is no server state (ADR 0001).

## Build and runtime

- `pnpm dev` runs the Astro dev server; `pnpm build` writes a static site to `apps/web/dist`.
- Core ships as TypeScript source (`exports` points at `src/index.ts`); Vite compiles it with the app. No build step for core.
- Hosting target is any static host; Cloudflare Pages is planned (docs/PLAN.md §6).

## How to extend

| Want to…           | Do this                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Add a unit         | Edit `packages/core/src/units/<category>.ts`, cite the source, add a golden row. See docs/UNITS-CATALOG.md §6             |
| Add a category     | Add the id to `CategoryId`, create `units/<id>.ts`, register it in `units/index.ts`, add golden rows and catalog entry    |
| Add a UI primitive | Create it in `src/components/`, tokens only, keyboard and label checked, add it to the gallery. See docs/DESIGN-SYSTEM.md |
| Add a feature      | Create `src/features/<name>/`, compose primitives, import core only through `@bigsmall/core`                              |
| Add a theme        | Follow docs/THEMING.md. The contract test fails until every token exists and every pair passes contrast                   |
| Add a page         | `src/pages/<route>.astro` using `Base.astro`. Islands only where there is real interaction                                |
| Change behavior    | Update docs/UX-SPEC.md in the same change                                                                                 |

## Conventions

- File names: kebab-case for `.ts`/`.css`/`.astro` modules, PascalCase for React components and Astro components.
- Imports: from `@bigsmall/core` only; relative paths inside a package.
- No default exports in TypeScript modules (Astro components are the exception, by framework design).
- Comments explain why, not what. Decisions go in `docs/decisions/`, surprises in `docs/LEARNINGS.md`.
