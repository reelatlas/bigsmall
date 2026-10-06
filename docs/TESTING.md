# Testing

Last updated: 2026-10-06 (milestone 0). What is tested where, how to run it, and what CI blocks on.

## Layers

| Layer      | Tool                               | Lives in              | Covers                                                                                                       |
| ---------- | ---------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ |
| Core unit  | Vitest                             | `packages/core/test/` | Golden conversions from sourced fixtures, round trips, unit kinds, errors, registry integrity, region policy |
| Web unit   | Vitest (node)                      | `apps/web/test/`      | Theme contract and WCAG contrast for every theme                                                             |
| End to end | Playwright + axe-core              | `apps/web/e2e/`       | Pages render, behavior works, zero WCAG 2.2 AA violations, desktop and mobile viewports, every theme         |
| Static     | ESLint, Prettier, tsc, astro check | repo root             | Boundaries (ADR 0003), a11y lint for JSX and Astro, types, formatting                                        |

Performance budgets (Lighthouse CI, bundle size) join CI in milestone 2 when there is a real page to measure.

## Commands

```bash
pnpm test          # all unit projects, once
pnpm test:watch    # watch mode
pnpm e2e           # Playwright (starts the dev server itself)
pnpm lint
pnpm format:check  # or pnpm format to fix
pnpm typecheck
pnpm build
pnpm check         # lint + typecheck + test + build, same as CI's verify job
```

First-time Playwright setup on a machine:

```bash
pnpm --filter @bigsmall/web exec playwright install chromium
```

## Golden tests

`packages/core/test/golden/<category>.ts` holds rows of `{ value, from, to, expected, source, tolerance? }`, collected in `golden/index.ts`. Rows are TypeScript so a derived value is written as its defining ratio (`1 / 0.3048`) rather than a hand-rounded decimal. Every row cites where `expected` comes from: a standards document, or "Derived:" plus the exact definition used. The default tolerance is a relative 1e-12; rows that quote a published seven-digit figure (NIST SP 811 Appendix B) use `PUBLISHED_7_DIGITS` (1e-6) so the strict default stays strict everywhere else.

Adding a unit means adding at least one row that exercises it; a test fails when any registered unit has no row. The round-trip test covers every unit automatically at four magnitudes, judged on `max(|expected|, 1)` so tiny temperatures are not failed on floating-point cancellation.

## Registry integrity

`packages/core/test/registry.test.ts` fails on: duplicate or malformed ids, a unit in an unknown category, a category whose base unit is missing or not linear with factor 1, a missing source, and search-key collisions (name, plural, symbol, alias) within a category. Collisions across categories are allowed; they are the ambiguity list the UI must handle (docs/UX-SPEC.md §5).

## Theme contract

`apps/web/test/themes.test.ts` parses each theme CSS file and checks the token contract and the contrast pairs from `src/lib/themes.ts`. A failing pair prints both colors and the achieved ratio.

## End to end

- Tests run on two projects: Desktop Chrome and a Pixel-class mobile viewport.
- Every page gets an axe pass with the WCAG 2.0/2.1/2.2 A and AA tags. Violations fail the test.
- The theme test applies each theme to the live page and runs axe again.
- The converter island marks itself `data-hydrated` once React has attached. `converter.spec.ts` calls `ready(page)` after every `goto` before typing; without it keystrokes land before hydration and are reset. Things handled by inline scripts (the theme picker) are interactive immediately.
- `converter.spec.ts` covers the flows in docs/UX-SPEC.md: typing locks a unit and scopes the other box, the second box takes over as source, ambiguous symbols show both meanings, keyboard-only category and unit picking, Space locking an extendable match, swap, cross-category switching with its notice, copy, and an axe pass with the listbox open.
- Playwright starts `pnpm dev` on `127.0.0.1:4321` and reuses a running server locally.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request:

- **verify**: install, lint, format check, typecheck, unit tests, build, bundle budget (`scripts/bundle-size.mjs`, which follows the converter page's scripts and their imports and gzips each one; 90 KB JS and 20 KB CSS).
- **e2e**: install Chromium, run Playwright. The HTML report is uploaded on failure.

Both must pass. There is no manual override; fix the code or fix the test.

## Before launch (manual, milestone 5)

- Screen reader pass: VoiceOver on iOS Safari, NVDA on Windows Chrome. Result announcement, suggestion navigation, keypad.
- Keyboard-only pass through the whole converter.
- 400 % zoom at 1280 px wide; 320 px wide at 100 %.
- Reduced motion enabled: no ambient animation in any theme.
