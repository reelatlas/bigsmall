# Testing

What is tested where, how to run it, and what CI blocks on.

## Layers

| Layer      | Tool                               | Lives in              | Covers                                                                                                                                                                         |
| ---------- | ---------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Core unit  | Vitest                             | `packages/core/test/` | Golden conversions from sourced fixtures, round trips, unit kinds, errors, registry integrity, region policy, the parser, search and ranking, formatting, matched-letter spans |
| Web unit   | Vitest (node)                      | `apps/web/test/`      | The converter reducer, view, anchor, out-of-range messages, history, typing chunks and Escape steps; the URL; the theme contract and WCAG contrast                             |
| End to end | Playwright + axe-core              | `apps/web/e2e/`       | Real flows on desktop and mobile Chromium, zero WCAG 2.2 AA violations, every theme                                                                                            |
| Static     | ESLint, Prettier, tsc, astro check | repo root             | Boundaries (ADR 0003), a11y lint for JSX and Astro, types, formatting                                                                                                          |
| Budget     | `scripts/bundle-size.mjs`          | repo root             | What the converter page ships, gzipped, against 90 KB JS and 20 KB CSS                                                                                                         |

Lighthouse CI joins in milestone 5 (docs/PLAN.md §9).

## Commands

```bash
pnpm test          # all unit projects, once
pnpm test:watch    # watch mode
pnpm e2e           # Playwright (starts the dev server itself)
pnpm lint
pnpm format:check  # or pnpm format to fix
pnpm typecheck
pnpm build
pnpm bundle        # print the gzipped sizes; bundle:check enforces the budget
pnpm check         # lint + format check + typecheck + test + build + bundle check: CI's verify job
```

First-time Playwright setup on a machine:

```bash
pnpm --filter @bigsmall/web exec playwright install chromium
```

## Golden tests

`packages/core/test/golden/<category>.ts` holds rows of `{ value, from, to, expected, source, tolerance? }`, collected in `golden/index.ts`. Rows are TypeScript so a derived value is written as its defining ratio (`1 / 0.3048`) rather than a hand-rounded decimal. Every row cites where `expected` comes from: a standards document, or "Derived:" plus the exact definition used. The default tolerance is a relative 1e-12; rows that quote a published seven-digit figure (NIST SP 811 Appendix B) use `PUBLISHED_7_DIGITS` (1e-6) so the strict default stays strict everywhere else.

Adding a unit means adding at least one row that exercises it; a test fails when any registered unit has no row. The round-trip test covers every unit automatically at four magnitudes, judged on `max(|expected|, 1)` so tiny temperatures are not failed on floating-point cancellation.

## Registry integrity

`packages/core/test/registry.test.ts` fails on: duplicate or malformed ids, a unit in an unknown category, a category whose base unit is missing or not linear with factor 1, a missing source, fewer than three basic units in a category, a note over 140 characters, a non-positive factor, a change to the category order, and search-key collisions (name, plural, symbol, alias) within a category. Collisions across categories are allowed; they are the ambiguity the UI shows with category labels (`oz` today; docs/UX-SPEC.md §3).

## Theme contract

`apps/web/test/themes.test.ts` parses each theme CSS file and checks the token contract and the contrast pairs from `src/lib/themes.ts`. A failing pair prints both colors and the achieved ratio.

## End to end

- Shared helpers live in `e2e/support.ts`: the WCAG tags axe runs with, `ready(page)` (waits for the island's `data-hydrated` mark; call it after every `goto` before typing, or keystrokes land before hydration and are reset), and `settled(page)` (waits for theme transitions before axe reads colors).
- Tests run on two projects: Desktop Chrome and a Pixel-class phone (touch, so hover-only features are hidden there and their tests skip).
- `smoke.spec.ts`: both pages pass axe; a conversion loads from the URL; the theme menu applies, persists, and closes; every theme passes axe on the live page; the shortcuts map opens on hover, pins on click, closes on Escape, and passes axe open; it is hidden on touch devices; it reads ⌘ on a simulated Mac and Ctrl elsewhere.
- `converter.spec.ts` covers the flows in docs/UX-SPEC.md: nothing commits on a keystroke and Enter commits; Tab and leaving a box commit an exact match; the arrows reach the Back row; Tab goes box to box; the list floats; swap; widening to other categories; copy and its check; axe with the list open; Back and Escape levels; Escape steps through typing chunks and units; undo and redo; the category label under the anchor box; out-of-range messages that fit; placeholders; matched letters; long numbers that shrink; clear all; the hint above the boxes.
- Playwright starts `pnpm dev` on `127.0.0.1:4321` and reuses a running server locally. If tests fail wholesale right after a batch of file edits while lint and types pass, the reused dev server is serving stale modules: restart it and run again (docs/LEARNINGS.md).

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request:

- **verify**: install, lint, format check, typecheck, unit tests, build, bundle budget. `pnpm check` runs the same steps locally.
- **e2e**: install Chromium, run Playwright. The HTML report is uploaded on failure.

Both must pass. There is no manual override; fix the code or fix the test.

## Before launch (manual, milestone 5)

- Screen reader pass: VoiceOver on iOS Safari, NVDA on Windows Chrome. Result announcement, suggestion navigation, keypad.
- Keyboard-only pass through the whole converter.
- 400 % zoom at 1280 px wide; 320 px wide at 100 %.
- Reduced motion enabled: no ambient animation in any theme.
