# Testing

What is tested where, how to run it, and what CI blocks on.

## Layers

| Layer      | Tool                               | Lives in              | Covers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ---------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core unit  | Vitest                             | `packages/core/test/` | Golden conversions from sourced fixtures, round trips, unit kinds, errors, registry integrity, region policy, the parser, search and ranking, formatting, matched-letter spans                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Web unit   | Vitest (node)                      | `apps/web/test/`      | The converter reducer, the box, the table's views (start, units, matches), no-answer messages, history, typing chunks and the calculator's Escape steps; the calculator's keys; the URL; spatial navigation for the arrow keys; the wordmark's phrases, mix, line breaks, type steps, and flip frames; the theme contract and WCAG contrast; Astro templates free of HTML comments; the settings lab's sections (fixed names), what shows (system switches, units chosen on their own as a layer the switches leave, the two resets, three-state groups), a fresh visit's defaults, and its number formats (decimals to a place, fractions in the sizes chosen (each written in the smallest size chosen, thirds with quarters), Both's decimal, rounding up and down below zero, float noise) |
| End to end | Playwright + axe-core              | `apps/web/e2e/`       | Real flows on desktop and mobile Chromium, zero WCAG 2.2 AA violations, every theme                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Static     | ESLint, Prettier, tsc, astro check | repo root             | Boundaries (ADR 0003), a11y lint for JSX and Astro, the token guard (no raw values in components), types, formatting                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Budget     | `scripts/bundle-size.mjs`          | repo root             | What the converter page ships, gzipped, against 90 KB JS and 20 KB CSS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Lighthouse CI joins in milestone 5 (docs/PLAN.md §9).

The browser suite skips a test only on a project it does not apply to: hover, the keyboard walk, and single-viewport checks on the phone, and the touch-only check on desktop. Counts are not kept here, since they change with every feature; `pnpm test` and `pnpm e2e` print them.

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

## Parser

`packages/core/test/parse.test.ts` holds the number grammar and the arithmetic. `/` and `-` belong to arithmetic and to unit symbols alike, so each new operator gets a test beside a unit that uses the same character (`5 km/h` is 5 and `km/h`; `5 -ft` is 5 and `-ft`).

## Theme contract

`apps/web/test/themes.test.ts` parses each theme CSS file and checks the token contract and the contrast pairs from `src/lib/themes.ts`. A failing pair prints both colors and the achieved ratio.

## End to end

- Shared helpers live in `e2e/support.ts`: the WCAG tags axe runs with; `ready(page)` (waits for the island's `data-hydrated` mark; call it after every `goto` before typing, or keystrokes land before hydration and are reset); `settled(page)` (waits for theme transitions before axe reads colors); `pickTheme` (through the menu, as a user does) and `applyTheme` (at once, for loops over every theme); `box(page)` and `menu(page)` for the converter's box and its category menu. A helper two spec files need goes here, not into either file.
- Tests run on two projects: Desktop Chrome and a Pixel-class phone (touch, so hover-only features are hidden there and their tests skip).
- One spec file per feature, each opening with the UX-SPEC sections it covers:
  - `smoke.spec.ts`, the checks that span the site: every page (the converter, the gallery, the wordmark lab, the settings lab) and every theme pass axe; an unknown address shows the not-found page, with the way back, and passes axe; the converter page names its canonical address and its link preview, and the dev pages ask not to be indexed; a conversion loads from the URL; every theme passes axe and every Tab stop shows focus with a conversion on screen; reduced motion zeroes the motion tokens in every theme (as `0ms` in dev, `0s` once the build's minifier has written it).
  - `header.spec.ts`: the theme menu applies, persists, previews with the arrows, and closes, and reads "Theme" while open below sm; the shortcuts map opens on hover, pins on click, closes on Escape, passes axe open, is hidden on touch devices, and reads ⌘ and ⌥ on a simulated Mac and Ctrl and Alt elsewhere; at 320 to 640 px the name keeps its art and the menus wrap under it (below 416 px), theme menu first, or share its line.
  - `wordmark.spec.ts`: hovering the heading plays the wordmark without clipping and keeps its name, the menus do not, and reduced motion keeps it still; the art follows the theme, flips to a symbol, and comes home; every phrase fits the name's width in every theme (the lab's sheet); the lab copies its settings as code and loads an earlier version.
  - `table.spec.ts`, the converter (docs/UX-SPEC.md §1, §3, §5, §7–§9, §11, ADR 0012, ADR 0013): one box and no layout to switch; the start's categories, kept while only a number is typed, a tile listing its units with dashes and none chosen or highlighted, and a unit then picked taking the number as typed; the tiles as a grid for the arrows, and Enter into them; a number and a unit listing every unit, the box's own marked; matches from every category while a unit is typed, grouped, without values, with counts in the menu, Enter taking the best and a click any; a typed category name opening the category, which the menu keeps naming while a unit is typed; the category menu reading "Category" while open and keeping its width, its counts fitting, in every theme, its arrows moving without choosing, Enter choosing, Escape closing, and choosing the box's own category keeping its unit; the arrows through every row from the unit in the box, with Ctrl/⌘+C and Enter on a row, and past the last row on round the page; the Escape ladder and undo after it, and Escape from an unfocused page clearing step by step while a hovered shortcuts map's Escape only closes it; the cursor showing only while focus is in the box or its table; typing from the menu, a copy button, the chip, and an unfocused page landing in the box, after what is there; × and Backspace keeping the category; values right-aligned on the left and symbols and names meeting in their columns on the right, the symbols lined up on their last letter with exponents hanging after it; the names giving way in every row where one would not fit on one line, never clipped, in every theme, and coming back with the room; a row moving into the box, and undo; a two-box link opening on the box that held the number; no-answer messages, once and per row, and "Undefined for 0" in a reciprocal unit's rows; the live region's sentence; the calculator's column from md, its top level with the toolbar's and its display with the box, between the box and the table below; the chip keeping its name beside a long number in a wide box, and giving it up sooner on a phone; the server's page showing the start before hydration (the island's code blocked); keys typed before the island loads (its code held) kept, the link's unit staying; the tiles going four across at a 512 px column and fitting in every theme; rows and tiles that fit at 320 px; the hint over the toolbar, which starts with the category menu wide and wraps it under the tools on a phone; copying the box and a row, with the check moving; Copy URL; clear all and undo; undo by bursts and both redo keys; Enter working out arithmetic; a long number stepping down until it fits or scrolls at the smallest size, with its exponent marker bold, as a row's value in exponent form has too; axe with the matches and the menu open, matched letters heavier; a German locale's numbers and URL, a link's long number opening whole in the German decimal mark.
  - `keyboard.spec.ts`, the page's toolbars and planes (docs/UX-SPEC.md §8, §10, ADR 0014): each toolbar one Tab stop that keeps the control last used, ← → Home End along it, round; tools that can do nothing dimmed but in the order; ↑ ↓ between the header, the toolbar, and the box, round both ways, each toolbar keeping its place, and with nothing focused into the box; Escape on a toolbar's control back to the box, closing an open map first; typing on a toolbar's control, the header's too, landing in the box; the map shown while the keyboard is on its icon; a narrow header's order, theme menu first.
  - `touch.spec.ts`, a touch screen (docs/UX-SPEC.md §8, "On a touch screen", ADR 0015), on the phone project with `tap()`: a tile, a row, and a choice in the category menu leave the box unfocused, the menu closing onto its button; a tap in the box focuses it, and a tapped row or Done blurs it; the chip's name counts as the box; the chip's ×, clear all, and the calculator leave the keyboard down.
  - `calculator.spec.ts`: the calculator's keyboard, Tab cycle, arrow keys between its keys with Enter pressing the one with focus and typing going back to =, Alt+C opening and closing it, focus going back where it was when closed from inside, Escape steps, "Use" into the box and the focus after it, one history with the box, and the message when its number has no value.
- Playwright starts `pnpm dev` on `127.0.0.1:4321` and reuses a running server locally. If tests fail wholesale right after a batch of file edits while lint and types pass, the reused dev server is serving stale modules: restart it and run again (docs/LEARNINGS.md).
- A locator names a control exactly (`exact: true`) when its name is part of another's on the page ("Calculator" in "Close calculator"), or is scoped to a container: Playwright matches names as case-insensitive substrings (docs/LEARNINGS.md, "getByRole's name matches part of a name").
- A test of how text fits asserts the rule, never that a given length fits: the number fits at some size or sits at the smallest and scrolls, the chip's name never stays while the number shrinks. Numbers are set in each machine's system font, and CI's Linux digits are wider than Windows' (docs/LEARNINGS.md, twice on 2026-10-07).
- Keep at least one browser test per flow in docs/UX-SPEC.md: the reducer tests cover rules, and the browser tests cover the sequences people perform.
- A test of the keyboard highlight reaches its state with the keyboard, or moves the pointer off the list first, since a pointer moving over a row highlights it.
- A visually hidden input is reached the way a person reaches it, through its visible label (`pickTheme` clicks the theme menu's labels), and checked with `toBeChecked()`, which needs no visibility.
- The focus walk skips anything inside `astro-dev-toolbar`, which only the dev server has, and reads an indicator only after transitions finish (`settled`).
- Script-driven motion is checked by state, not timing: tests set the lab's controls (play without hovering, the art's chance at 1) and assert what lands. A background tab pauses `requestAnimationFrame`.
- A test of a touch screen taps (`locator.tap()`): on the phone project `click()` is a mouse click, which keeps the desktop's flow (ADR 0015).
- Behavior that differs by platform gets a test that fakes the other platform (`page.addInitScript`), since the machine running the tests only exercises its own.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request:

- **verify**: install, lint, format check, typecheck, unit tests, build, bundle budget. `pnpm check` runs the same steps locally.
- **e2e**: install Chromium, run Playwright. The HTML report is uploaded on failure.

Both must pass. There is no manual override; fix the code or fix the test.

Both jobs run on a named image (`ubuntu-26.04`) with every action on its newest major. The comment above the jobs lists the pins and why; review them with the rest at each milestone (ADR 0005).

## Before launch (manual, milestone 5)

- Screen reader pass: VoiceOver on iOS Safari, NVDA on Windows Chrome. Result announcement, suggestion navigation, the calculator.
- Keyboard-only pass through the whole converter.
- 400 % zoom at 1280 px wide; 320 px wide at 100 %.
- Reduced motion enabled: no ambient animation in any theme.
