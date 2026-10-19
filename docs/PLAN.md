# bigsmall — project plan

Last updated: 2026-10-18. Status: milestones 0, 1, and 2 complete, milestone 3 under way (§13); milestone 2's usability test set aside for friends' feedback rounds until the product gains traction (docs/research/usability-test-1.md).

## 1. Vision

The best-feeling unit converter on the web. The two incumbents (unitconverters.net, onlineconversion.com) are correct and comprehensive but their UX is from another decade: two scrolling list boxes, a Convert button, tiny targets, ad-heavy pages, and no sense of place. bigsmall competes on experience, not on breadth, while still matching the coverage people expect.

Positioning in one line: _type anything into the box and see it in every unit at once._

## 2. What we are building

### v1 (launch)

- **One box and its table.** One smart input, and the value in every unit of its category in a table under it, which is also where units are picked (ADR 0012). Two linked boxes behind a switch were built and retired the same day (ADR 0009, ADR 0013).
- **Smart search.** Typing a unit lists matching units across every category, grouped by category, the current category first. Typing a category word (`fluids`, `temp`) offers that category.
- **Manual selection.** Everything reachable by tapping, with no typing required.
- **Calculator.** A scratch pad behind an icon button, for anyone who would rather tap than type or wants to work a number out first; its number goes into the box only when sent (docs/UX-SPEC.md §8).
- **Every unit, no modes.** Each category's table lists all its units, standard and specialty, in the visitor's order; there is no switch between basic and advanced modes (ADR 0016, Sean, 2026-10-08).
- **Themes.** Two neutral defaults (light, dark) plus distinctive aesthetic themes. Theme choice persists.
- **Shareable URLs.** The current conversion is in the URL, so links and bookmarks work; a Copy URL button in the header copies it.
- **Pages for search.** One static page per popular unit pair ("cm to inches"), generated from the unit data, each opening the converter on its pair with a short original explanation (Sean, 2026-10-15: in v1, built at milestone 5).
- **Fast, accessible, responsive.** See budgets and targets below.

### Later

- PWA: installable, works offline. This covers most of the "app" ambition with no app store.
- Currency (needs live rates from an API, still no database).
- Cooking's later pieces (Cooking by ingredient shipped 2026-10-16, ADR 0021): the metric cup and spoons, the way of filling the cup as a choice beside the ingredient, weights rounded to the gram, more ingredients as people ask (docs/UX-SPEC.md §14, "Cooking, later").
- Expression input, the rest of it: `+ − × ÷ ^` and parentheses with Enter as equals shipped on 2026-10-06; still to come are mixed fractions (`3 1/4`), feet-and-inches entry, and more calculator keys. Principle and phasing in `docs/UX-SPEC.md` §14.
- Native wrapper (Capacitor) only if the PWA proves insufficient.

### Explorations (owner, 2026-10-07)

Directions Sean wants to explore after the MVP is shared; none is designed or scheduled yet. Several come from friends who use the site (docs/research/findings-friends-1.md). Sean's controls for the table, in his order: filtering its units, multiples or recommended values that can move into the box, a fractional display pegged to a step, and settings that are always saved, with templates later.

- **Every category at once.** An option to show all categories as collapsible sections below the box, each expanding to show the current value in every unit of that category, like a full conversion table. To work out: when it shows (only with a number?), its size on a phone, and its cost with many units. Its single-category form, every unit of the box's category, is the converter's table (ADR 0012, ADR 0013); every category at once stays an exploration.
- **Favorites (Mike's idea, 2026-10-07).** Star a unit or a category and find it in a favorites bar, in or under the toolbar, for a one-tap pick (docs/research/findings-friends-1.md). To work out: what a favorite does when tapped (set the box's unit, or open its category), how many fit on a phone, and how it relates to the pinned pairs planned for milestone 3 (docs/UX-SPEC.md §14).
- **Settings: what shows and how it looks (Sean, 2026-10-07 to 15). Built (ADR 0018; docs/UX-SPEC.md §1, §3, §7, §11).** Units and Display as side panels: presets and Custom, the systems' switches and their order, single units chosen in the table (Edit, the Hidden list), names, format, and rounding, all remembered in this browser. The settings lab that shaped it is retired (docs/research/labs/README.md).
- **Pace, and conversions by time (Sean, 2026-10-08; pace built 2026-10-16).** Built: min/km and min/mi in Speed, reciprocal units in a Pace section of their own, typed and written in minutes and seconds, listed apart so Speed keeps its size order (the sixty-third pass; docs/UX-SPEC.md §3, §7). Still open: a swimmer's pace per 100 m and a rower's per 500 m, and converting by time generally.
- **Fractional feet and inches (Mike's idea, 2026-10-07).** Construction work measures in fractional inches. Enter feet and inches as decimals or fractions (`5' 10 3/8"`), add and subtract them, and show results as fractions, in lowest terms or rounded to a chosen step (nearest 1/2, 1/4, 1/8, 1/16). Sean's first thought: a toggle in the toolbar that, when on, offers the rounding step. It builds on the planned mixed fractions and feet-and-inches input and the calculator's `½ ¼ ⅛` and `′ ″` keys (docs/UX-SPEC.md §14). To work out: where the toggle fits in the toolbar, at 320 px too, whether fractions apply beyond lengths, and how the table shows them; the same display pegged to a step could serve the table's values (Sean). Sean, 2026-10-10, from the settings lab: let people type fractions into the box (`3 5/8`), and perhaps keep the calculation written out rather than turned into its value. Recommended then: the box keeps what was typed, decimal or fraction, and never rewrites it into the display's format; the table follows Display (decimals, fractions in the sizes chosen, or both), so a typed decimal is seen as a fraction in the table and a typed fraction as a decimal; mixed numbers are phase 2 of the box's grammar (docs/UX-SPEC.md §14; `1/2` already reads as a division). Sean (2026-10-17), on the feedback form's own example, typing 5 ft 10 in and reading centimeters: "genius", to explore later; the first step of this entry.
- **Writing fractions and parentheses (Sean, 2026-10-07).** People write fractions (`1/2`, `5/6`) and mixed numbers (`3 1/4`), and use parentheses for multiplication (`2(3 + 1)`). A fraction is already a division (`1/2` reads as 0.5, docs/UX-SPEC.md §2), so typing one needs no mode, and a fraction mode would change how results are shown, not how input is read. What needs designing: a whole number followed by a fraction (`3 1/4` as 3 + 1/4, while `3 cups` still finds its unit), and parentheses after a number meaning times (`2(3)`, planned as implied multiplication, §2).
- **Grouping categories (Sean, 2026-10-16; a later exploration).** As categories grow past fifteen, a way to group them so the start and the menu are easier to parse (common, mechanics, cooking, digital), with "every category at once" below.
- **Sections within a category, and their filters (Sean, 2026-10-16; a later exploration).** Pace inside Speed and a temperature change inside Temperature are sections of their own, standard rather than specialty, which the system switches in Settings' Units do not describe: how sections and their switches are grouped and filtered, a topic's own (Pace, As a change) beside the systems'.
- **A planner and agents that build (Sean, 2026-10-16; a later pass).** One model as the orchestrator (Opus 5.5 at max effort, or Fable) makes the plans and strategies; when they are ready, subagents (Opus 5.5 at max effort) carry out the tasks. All of it coordinated through the docs, CLAUDE.md, the skills, and the best practices, so each knows where to look and why; efficient, sharing learnings and findings, cleaning up after itself, never one-offs, always going back into the system for design, code, and data. To work out: the roles and handoffs, a skill or workflow for it, how each task's result is verified and merged, and what it costs. Its first worked piece is research (2026-10-16): the `research` skill runs an orchestrator's brief, two blind reviewers and a checker as agents, handoffs as files, the rule deciding, with the cost recorded (`docs/RESEARCH.md` §4, "How the work is split"). Next: the same shape on a bounded build task (a planner's brief, builders with the gate as their check, one merge), to learn the handoffs before anything larger.
- **Categories with a second value (Sean, 2026-10-16; a later exploration).** Cooking built the same day (ADR 0021). Cooking's shape, an ingredient joining volume and weight, fits other strong uses: oven temperatures with gas marks and fan ovens, download time (a file's size over a connection's speed), price per unit (per pound against per kilogram), and print size at a resolution (pixels against inches at a dpi).
- **Standard or specialty, re-weighed (Sean, 2026-10-16; a later pass).** Which units are standard and which specialty, now that fifteen moved to standard on his call (docs/UNITS-CATALOG.md §0): whether a finer split is wanted (by field, or the units of bills and forecasts apart from a trade's), whether a standard unit could still start hidden on a fresh visit, and how Settings' Units would show it. Until then the tiers stand as the sixty-first pass set them (docs/research/findings-0-first-pass.md).
- **Keeping the math (Sean, 2026-10-07).** Some people may want to keep the expression they wrote (`2 × 3/4 + 1`) on screen rather than have Enter turn it into its value, to see the chain of math they are weighing. Today its running value shows beside it while typing, and Enter replaces it with the value (docs/UX-SPEC.md §5, §7). To work out: a setting, a different key, or a tape of past calculations; and how it fits undo and the URL. Sean added (2026-10-15), for a later pass: a fraction shown as typed (`5/6`, `2/5`) rather than turned into a decimal, and the full calculation kept on screen while its value is still given; with "Writing fractions and parentheses" above, the box would keep what was typed after Enter, its value beside it as arithmetic's running value is today, and the table convert the value (the fifty-ninth pass in docs/research/findings-0-first-pass.md).
- **Multiples beside the values (Dan's idea, 2026-10-07).** Quick multiples or ratios beside a value in the table (½×, 2×, 4×, 8×), or recommended values, so the range around an answer shows at a glance, with the user choosing whether to see them and the step (halves, doubling). Any of them can become the main value everything converts from, as a row can today (Sean). To work out: a column, a row that expands, or a setting; its room on a phone; and how it relates to the calculator.
- **A Custom preset in Units (Sean, 2026-10-15). Built the same day (docs/UX-SPEC.md §1; ADR 0018).** Left open: whether Show custom hidden units stays once visitors know Custom.
- **Ordering the sections by dragging (Sean, 2026-10-15). Built the same day (docs/UX-SPEC.md §1, §3, §8; ADR 0018).** Left open: how to show the keys that reorder (Alt+↑ ↓), out of the shortcuts map for now (Sean).
- **Choosing the sort (Sean, 2026-10-07).** Let people pick how units are ordered in the list and the table: by size across systems (mm, cm, in, ft…), by system (today's default, ADR 0011), alphabetically, or favorites first. To work out: where the choice lives (the table's heading, settings), whether the list and the table share it, and that a chosen sort is remembered.
- **Saved settings and templates (Sean, 2026-10-07).** Every setting is remembered by default, as the theme is: built 2026-10-15 for Units and Display (ADR 0018, docs/UX-SPEC.md §11); multiples would join them once they exist. Later, maybe: templates, named sets of settings to switch between (a construction set with fractional inches, say).
- **Many more categories and units.** The catalog's plan (docs/UNITS-CATALOG.md §3's specialty groups; fuel economy, energy, pressure, power, and angle shipped on 2026-10-08) and more formulas, each category's data loaded on demand against its own budget (§9), every unit cited (ADR 0020).
- **Search visibility (SEO).** The pair pages already planned for launch (one static page per popular unit pair), plus the technical basics (canonical domain, sitemap, robots, titles and descriptions, structured data, social cards) and Google Search Console and Bing Webmaster Tools. The contract every page meets, the conventions for what is added, and the plan: docs/SEO.md (2026-10-15).
- **Analytics and monitoring.** Cookieless traffic analytics and product events: Umami Cloud, built and on 2026-10-15 (ADR 0019). Still to come: real-user speed (Core Web Vitals, not from Umami's performance option, which sends on every URL change), search performance (Google Search Console), and optionally errors and uptime; each script counted against the budget.
- **The formulas on the About page (Sean, 2026-10-15; built 2026-10-16, docs/UX-SPEC.md §1, "About").** Built: every factor and formula the converter calculates with, so anyone, by hand or with an AI, can check that they are sound, by category, each unit's definition, its factor to the base unit or its formula, exact or measured, and the standard it was checked against, generated when the site is built from `@bigsmall/core`'s own unit data so the page can never drift from the math, folded by default with Show all and Copy all, and Cooking's cups with their weighings; a tab beside Feedback since 2026-10-18. Still open: only a new kind of unit, which needs its sentence (TypeScript's exhaustive switch asks for it at build).

### Hygiene backlog (from the full tidy, 2026-10-15)

Real improvements the tidy found and left, each small enough to pick up cold:

- **One seam recipe.** The Move menu (`MOVE` in `SystemRows.tsx`) redraws `SegmentedControl`'s seam with different selectors (`first:` and `focus-visible:` against `group-first:` and `peer-*`); once the two reconcile their selectors, a `SEAM` recipe in `recipes.ts` draws the seam once for both.
- **The calculator on SidePanel.** The two now share their card and title row (`PANEL_CARD`, `PANEL_HEAD`, `PANEL_HEADING`); the calculator could build on `SidePanel` itself once its own keys (Tab going round, the grid's arrows) fit beside a panel's.
- **The header menus' placement.** `HeaderMenus.astro` sets its own outer placement (`ml-auto @max-xs:ml-0 @max-xs:basis-full`), which component rule 13 gives to the parent, `PageHeader`. `SiteFooter.astro`'s `mt-auto` (`FOOT`) is the same kind: the footer's place in the body's column, set on the component (2026-10-18).
- **One MINUS.** `ConversionTable.tsx` and `calculator.ts` each define the typographic minus as a named constant; one shared constant would do.
- **Core's public API.** Exports the web never imports (`toBase`, `fromBase`, `ConversionError`, `units`, `normalizeKey`, `compactKey`, `compactKeyWithDegree`, `suggest`, the `'standard'` search mode, and several types): keep as API, or trim. `resolveExact` and `unitListGroup` left this list on 2026-10-16, Cooking's exact ingredient match and the arranged lists using them; `cupFigure` and `MEASURED_CUPS` joined it the same day, core's own tests their only readers.
- **Search's tier escalation.** `search()` still widens a standard-only search to every tier when nothing standard matches and reports it in `SearchResponse.escalated`, which nothing reads (its own docblock says so: the converter asks for every tier and leaves specialty units out by Settings' switch, ADR 0018): remove the escalation and the flag.
- **Gallery samples still missing:** the calculator showing "Too large", and the matches with no match and with only hidden matches.
- **Tests still missing:** the focus walk with Units, Display, the calculator, Edit, Hidden, and the Move menu open (the walk goes round every stop since 2026-10-15; the drawn checkbox's ring sits on a sibling span, `Checkbox.tsx`, which `walkTabStops` must learn to read first); a row past 1e15 rounding Up and Down (`/?a=light-year&v=1e3`, the millimeter row; core pins the format, `7460d32`); Ctrl/⌘+C with text selected in the box; blocked storage (settings last for the visit); the Other switch in a browser; the shortcuts map's rows; tapping the wordmark; settings kept out of the URL and the undo history.
- **UX-SPEC §14.** Mostly built or decided items now; keep the planned ones there and let the built ones live in their sections.
- **The labs' shared controls** (the tidy after the sketchbook, 2026-10-15). `SketchbookLab.tsx`'s `Toggle` and `Choice`, the Settings panel both labs repeat (Earlier version, Load, Reset, Copy settings), `literal()`, and the small class lists both write (a hint, a note) into `src/pages/dev/_lab/controls.tsx`, the wordmark lab then using them for its own markup; then give the selects and checkboxes a shipped mark, as `Slider` has.
- **The labs' shared class lists** (the full tidy, 2026-10-18). `SketchbookLab.tsx` and `WordmarkLab.tsx` write the same class strings by hand, ten alike: the page heading (`font-display text-2xl font-semibold`), the hint and the note (`text-sm text-ink-muted`, `text-xs text-ink-muted`), the settings' code block (`rounded-md bg-surface-raised p-4 font-numeric text-xs …`), and the control rows and groups; they belong in `_lab/controls.tsx` beside `HEADING`, `FIELD`, and `CHECK`.
- **The wordmark lab's saved settings** load through a setState in an effect, the pattern the compiler's lint stops elsewhere; `SketchbookLab.tsx` shows the fix (`useIsHydrated` and `useMemo`; docs/LEARNINGS.md, "The compiler's lint stops a setState in an effect").
- **One name for the shipped settings.** `Sketchbook.tsx`'s `SHIPPED` (the settings) and `presets.ts`'s `SHIPPED` (the version, "v3") share a name, and `SketchbookLab.tsx`'s `DEFAULTS` is the first again.
- **The lab's preview of reduced motion** stills the tiles but not Flip's particles: `burst.ts` reads only the system's setting.
- **The lab's saved-settings migration** (version 1 to 2, `load()` in `SketchbookLab.tsx`) is untested.
- **A budget for the About page.** `scripts/bundle-size.mjs` measures the converter's page alone (`index.html`); the sketchbook island with its 93 inline sketches, the feedback form, and the tabs ship unmeasured. Measure once, then Sean sets the budget (§9).
- **The matches' line and the table's foot** sit 6 and 4 px under what is above them (`mt-1.5`, `mt-1`), and the even-spacing test measures only section headings: measure both in every theme, then pick one. Their words share one list written twice (`px-2 text-sm text-ink-muted`, `ConversionTable.tsx`, `UnitMatches.tsx`): one recipe when the spacing is reconciled (2026-10-18).
- **CSS anchor positioning** (the full tidy, 2026-10-18). The category menu's popover is placed by hand from its root's rect on every scroll and resize (`CategoryMenu.tsx`), the stuck section names take their `top` from the head's measured height (`ConversionTable.tsx`, `UnitMatches.tsx`), and the side cell takes its `top` and its card's room (`--side-max`) from the box's measured place in the stuck head (`TableLayout.tsx`): all three retire to CSS anchor positioning (`anchor()`, `position-anchor`) once every engine the site supports has it, as the stand-ins in docs/DESIGN-SYSTEM.md, "Stuck layers", name their standards.
- **The container tokens read twice** (2026-10-18). `global.css` writes `var(--container-xl)` into `grid-cols-margin-box-and-side` and `var(--container-5xl)` into `mx-page`, where the recipes pair them with `max-w-xl` (`CONTENT_COLUMN`) and `max-w-5xl` (`PAGE_COLUMN`): each width is named in two places, so a change to one would miss the other. The panel's width is named twice the same way: `--side-track` (`global.css`, 320 + 16 px) and the side cell's `md:w-80 md:ml-4` (`TableLayout.tsx`).
- **One `units/constants.ts`** (2026-10-18). The defining constants are repeated across the unit files: the pound-force, `0.45359237 * 9.80665`, in `pressure.ts`, `force.ts`, and `torque.ts`; the cubic inch, `0.016387064`, three times in `volume.ts`; the US gallon in `fuel-economy.ts` and `volume.ts`, the mile in `length.ts` and `speed.ts`; the International Table BTU, `(4.1868 * 453.59237) / 1.8`, in `energy.ts` and `power.ts`. One module of named constants, each cited once, which every unit file reads.
- **An `exactForm` on units** (2026-10-18). `formulas.ts` re-states seven factors by their exact form (5/9 and π/180 among them), found by tolerance against the factor; a unit could carry its exact form as data, so the page and the unit cannot drift.
- **The unit `note` field** (2026-10-18). `Unit.note` (the two gallons, the two ounces) is data nothing shows: ship it with "Unit notes" (docs/UX-SPEC.md §14), or drop the field.
- **One-user recipes kept as families** (2026-10-18). `CONVERTER_MAIN`, `CONVERTER_FOOT`, `FIELD_LABEL`, and `TEXT_AREA` each have one reader (`index.astro`, `SiteFooter.astro`, `Feedback.tsx`), against the rule that a list one file uses stays in that file; kept as deliberate families (the page layouts declared beside `PAGE_MAIN`, the text fields' set in the design system's "Fields"), noted so the exceptions are known.
- **One `--side-top`** (2026-10-18). The side cell's inline `top` and its wrapper's `--side-max` are two inline styles from one measurement (`TableLayout.tsx`); one variable on the cell, read by a `top` utility and by `side-panel-room`'s calc, would write it once. Retires with the anchor-positioning item either way.
- **Comment lines past 100 characters from before the last tidy** (2026-10-18): 31 one-line docblocks of 101 to 118 characters in `Calculator.tsx`, `ConversionTable.tsx`, `TableLayout.tsx`, `Formulas.astro`, `recipes.ts`, `wordmark.ts`, and `table.spec.ts`, untouched since; rewrap each as its file is next edited.
- **findings-friends-1's open questions** (2026-10-18). Two of them ask about the second box and its switch, retired with ADR 0013: fold them when the five-person test is next planned (docs/research/usability-test-1.md).

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

| Need                                     | Where it lives                              |
| ---------------------------------------- | ------------------------------------------- |
| Unit definitions and factors             | TypeScript data in `packages/core`, bundled |
| The theme and the settings (ADR 0018)    | `localStorage`                              |
| Recent and favorite conversions          | `localStorage`                              |
| Current conversion (for sharing)         | URL                                         |
| Usage analytics (which units people use) | Third-party cookieless analytics            |

What would change the answer: accounts with cross-device sync of favorites (needs auth plus storage), or server-side logging of search queries that returned nothing. Both are additive and can be bolted on later without touching the core. Currency needs an external rate API, not a database. Do not set up Supabase for v1. See ADR 0001.

## 5. Architecture

Two layers with a hard boundary (ADR 0003). `packages/core` is pure TypeScript with zero runtime dependencies and no DOM: units, conversion, parsing, search, and formatting. `apps/web` is the Astro site with one island for the converter, written against the React API and run on Preact through `preact/compat` (ADR 0007): everything the user sees. The module map, data flow, and how to extend each part are in `docs/ARCHITECTURE.md`.

- **Data model.** `Category` and `Unit` in `packages/core/src/types.ts`. Conversion always goes `from → base → to`, never through an intermediate unit: linear units multiply by a factor, affine units (temperature) add an offset first, reciprocal units (fuel economy, and Speed's paces) divide a factor by the value, and functional units would use a `toBase`/`fromBase` pair (docs/ARCHITECTURE.md, "packages/core"). Every unit cites its source.
- **Converter state.** `apps/web/src/features/converter/state.ts`: the box's text and unit, the category its table lists, and the calculator's entry, with one undo history around them all, so undo after a send steps back into the arithmetic that produced it (docs/UX-SPEC.md §9).
- **URL.** The state serializes to the URL's query (format in docs/UX-SPEC.md §11), so sharing, bookmarks, and later SEO pages use one mechanism.

## 6. Stack (ADR 0002, accepted)

| Concern               | Choice                                                   | Why                                                                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework             | **Astro** with a **Preact** island (React API, ADR 0007) | Static HTML by default, JavaScript only where there is interaction (the converter island, the sketchbook's on the About page, the wordmark's script), static page generation for later SEO pages, built-in view transitions |
| Language              | **TypeScript** (strict)                                  | Catches unit-data mistakes at compile time                                                                                                                                                                                  |
| Styling               | **Tailwind CSS v4** over **CSS custom properties**       | Tokens are plain CSS variables so themes are just variable sets; Tailwind for speed and consistency                                                                                                                         |
| Accessible primitives | **Native elements + a hand-built combobox** (ADR 0006)   | React Aria was tried and removed at milestone 2: its button machinery alone cost 12 KB gzipped, and the hybrid number-and-unit field does not fit a library combobox                                                        |
| Package manager       | **pnpm** workspaces                                      | Fast; the workspace enforces the core/web boundary physically                                                                                                                                                               |
| Tests                 | **Vitest** (core), **Playwright** + **axe** (web)        | Table-driven golden tests for math; end-to-end plus automated accessibility checks                                                                                                                                          |
| Lint/format           | **ESLint** (flat) + **Prettier**                         | Boring, complete coverage of `.astro`, `.tsx`, and `.css`                                                                                                                                                                   |
| Perf gates            | Bundle size check now; **Lighthouse CI** at milestone 5  | Budgets fail the build                                                                                                                                                                                                      |
| Hosting               | **Vercel** (ADR 0008)                                    | Serves the static build from the GitHub repository; `bigsmall.work` is the main domain and `bigsmall.diy` redirects to it. Cloudflare Pages is the fallback                                                                 |
| Repo                  | **GitHub**                                               | Actions for the checks when someone starts them; a push deploys on its own (ADR 0008, amended 2026-10-18)                                                                                                                   |

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
│   ├── RESEARCH.md              how a fact is decided by its kind (ADR 0022)
│   ├── LEARNINGS.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN-SYSTEM.md
│   ├── THEMING.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   ├── SEO.md
│   ├── decisions/               ADRs
│   └── research/                feedback rounds, findings, labs/ (the retired labs index)
├── .claude/skills/              tidy, save, ship, research: the working routines
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
| Unit data shipped initially               | ≤ 15 KB (standard categories); specialty categories lazy-loaded per category                 |
| Fonts                                     | 0 KB for defaults (system stack); ≤ 2 subset files per aesthetic theme, loaded on activation |
| LCP on simulated mid-tier mobile, slow 4G | < 1.5 s                                                                                      |
| INP                                       | < 200 ms                                                                                     |
| CLS                                       | ≈ 0                                                                                          |
| Lighthouse                                | Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100                             |

The JS and CSS budgets gate every push (`pnpm bundle:check`, in `pnpm check`), counting everything the page can load, lazily loaded chunks included. Measured 2026-10-06 at the end of milestone 2: 82.0 KB JS and 5.3 KB CSS gzipped; with copy link, the calculator, and arithmetic, 86.5 KB JS and 5.7 KB CSS; with the wordmark at play and theme art, 89.2 KB JS and 5.9 KB CSS; on Preact (ADR 0007), 33.9 KB JS; with the tuned wordmark, 38.2 KB JS and 6.2 KB CSS; after the pre-launch tidy-up, 39.6 KB JS and 6.3 KB CSS; with launch prep (the not-found page, the head tags), 40.0 KB JS and 6.5 KB CSS (2026-10-07, `pnpm bundle`); with sixteen categories, Settings, Cooking, the toolbar's one row, and the page's two tracks, 77.6 KB JS and 9.0 KB CSS (2026-10-18, the gate's own measure). The Lighthouse budgets join CI at milestone 5.

Umami's tracker (ADR 0019), about 2.4 KB compressed and deferred, loads from the site's address on the production deployment alone, so `pnpm bundle`, which measures the build, does not see it: counted here by hand, the page's 77.6 KB of JS (2026-10-18) and the tracker stay under 90.

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

- **Sources.** The standards in docs/UNITS-CATALOG.md §2; each unit cites the one it was checked against (ADR 0020).
- **Golden tests.** A fixture file of known conversions taken from those sources. Every unit appears in at least one row. Tests assert relative error ≤ 1e-12.
- **Round-trip tests.** For every unit, `fromBase(toBase(x)) ≈ x` for several magnitudes.
- **Spot checks against the incumbents.** A small set of conversions compared against the two reference sites as a sanity check only. Disagreements are resolved by the standards source, never by the site. See ADR 0020.
- **The accuracy audit (Sean, 2026-10-15), run the same day (docs/research/accuracy-audit-1.md; the fifty-sixth pass in docs/research/findings-0-first-pass.md).** Accuracy is the product's foundation, so one pass checked every calculation from first principles, apart from the tests that grew with the code: each unit's factor and offset recomputed blind by two reviewers from its cited source (NIST SP 811, Handbook 44, the SI Brochure), never read off the golden rows, 130 of 131 agreeing to 1e-12 and the one that differed, the therm, a choice Sean settled; the formulas; the arithmetic parser; rounding and fractions; numbers read and written in 36 locales (two fixes shipped, every locale's numbers read back and no false "≈" on large whole numbers); the calculator's entry and its send; and the precision a value keeps through the box, a row, a copy, and the URL. Every unit added since is checked the same way before it ships (Force and Torque and the paces, 2026-10-15 and 16), and a fact no standard defines by the rule for its kind (docs/RESEARCH.md, ADR 0022).
- **Arithmetic.** Double precision via the base unit. Display formatting at 10 significant digits with trailing zeros trimmed hides floating-point noise. Move to a decimal library only if a real test case fails.

## 12. Documentation system

| Doc                        | Purpose                                                                                                                        | Updated when                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `CLAUDE.md`                | Conventions and rules for every working session                                                                                | Rules change                                            |
| `docs/PLAN.md`             | Vision, scope, architecture, milestones                                                                                        | Scope or plan changes                                   |
| `docs/UX-SPEC.md`          | Exact UI behavior                                                                                                              | Before any behavior change                              |
| `docs/UNITS-CATALOG.md`    | Taxonomy, tiers, special cases, sources                                                                                        | Units or categories change                              |
| `docs/RESEARCH.md`         | How a fact is decided by its kind, and re-opened (ADR 0022)                                                                    | The method changes                                      |
| `docs/ARCHITECTURE.md`     | Modules, data flow, boundaries, how to extend                                                                                  | Structure changes                                       |
| `docs/DESIGN-SYSTEM.md`    | Tokens, components, usage rules                                                                                                | Tokens or components change                             |
| `docs/THEMING.md`          | How to author and QA a theme                                                                                                   | Theming mechanism changes                               |
| `docs/TESTING.md`          | Test layers, how to add golden rows, the gate before a push and the workflow                                                   | Test approach changes                                   |
| `docs/DEPLOYMENT.md`       | How the site is built and served; setup, releases, rollbacks                                                                   | Hosting or domains change                               |
| `docs/SEO.md`              | The SEO contract every page meets, the conventions, the plan                                                                   | A page, a category, or the plan changes                 |
| `docs/decisions/NNNN-*.md` | Why we chose what we chose                                                                                                     | A decision is made or reversed                          |
| `docs/LEARNINGS.md`        | Dated log of gotchas and best practices                                                                                        | Something is learned                                    |
| `docs/research/`           | Usability test scripts, feedback rounds, findings                                                                              | A test or feedback round runs                           |
| `docs/research/labs/`      | The retired labs index, with each lab's screenshots                                                                            | A lab retires                                           |
| `.claude/skills/`          | The working routines: tidy, save (a handoff), ship, research; how they evolve is `CLAUDE.md`, "How the docs and skills evolve" | A routine changes, in the same commit as what taught it |

Rule of thumb: if a future session would have to rediscover it, write it down.

## 13. Milestones

| #   | Milestone              | Done when                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0  | **Setup**              | Tooling installed, repo on GitHub, workspace scaffolded, CI runs lint + typecheck + tests, docs skeleton in place. **Done 2026-10-06.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| M1  | **Core engine**        | Eight primary categories with standard-tier units, parser, search, formatter; golden and round-trip tests green; zero UI. **Done 2026-10-06.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| M2  | **Smart input spike**  | Two linked boxes with the `daylight` theme, mobile-first, URL state; usability test with five people; bundle measured against budget. **Code done 2026-10-06; closed 2026-10-08 (Sean): the five-person test is set aside while friends' feedback rounds (docs/research/findings-friends-1.md) give the signal, to run on the one-box converter (ADR 0012, ADR 0013) if the product gains traction.**                                                                                                                                                                                                                                                                                                                                                                                                                    |
| M3  | **Complete converter** | Remaining common categories (Fuel economy, Energy, Pressure, Power, and Angle shipped 2026-10-08 with their specialty units, and the first eight gained theirs the same day), the first specialty ones (Force and Torque, 2026-10-15, docs/research/categories-1.md), then Speed's paces, Temperature's change, and Cooking by ingredient (2026-10-16; ADR 0021), specialty categories loaded on demand (basic and advanced modes dropped, ADR 0016; the theme remembered, Sean, 2026-10-08, and the settings too from 2026-10-15; the URL keeping typed digits and early keystrokes shipped the same day). Shipped early: the calculator (a scratch pad with + − × ÷ ^ whose number can be sent to the box), arithmetic in the box, and Copy URL (2026-10-06); swap shipped in M2 and retired with two boxes (ADR 0013) |
| M4  | **Themes**             | `midnight`, `sakura`, `neo-noir`, `hardhat`, `theorem` designed and polished: fonts and decoration (per-theme art shipped early, 2026-10-06). The picker, the contrast test, the gallery, and the bundle budget already exist                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| M5  | **Launch**             | SEO pair pages, analytics, PWA manifest and offline, domain, Lighthouse gates passing. Shipped early: the domain, and the MVP live on `bigsmall.work` for friends' feedback, tagged `v0.1.0` (2026-10-07; docs/DEPLOYMENT.md); analytics, Umami Cloud (2026-10-15, ADR 0019)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

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
2. **Primary categories.** The eight in `docs/UNITS-CATALOG.md`: Length, Weight, Volume, Temperature, Area, Speed, Time, Data. Fuel economy, Energy, Pressure, Power, and Angle joined them on 2026-10-08, and Force and Torque, the first of the mechanics group, on 2026-10-15 (docs/UNITS-CATALOG.md §0).
3. **Themes.** Framework and palettes for all six now; polish one at a time in milestone 4, `sakura` first (docs/THEMING.md).
4. **Locale defaults.** Detect from the browser, fall back to US; manual override in settings later. Implemented as `regionDefaults` in core.
5. **Toolchain.** Latest where compatible, accessibility tooling never dropped (ADR 0005). TypeScript 6 until the ecosystem supports 7.
6. **Input flexibility.** Spacing, locale number formats, typed math, and Enter-as-equals are a standing UX principle, phased in `docs/UX-SPEC.md` §14.
7. **Commit rules.** Nothing commits on a keystroke. Enter commits the highlighted best match, or a pick does; Tab and clicking away never commit, so moving away never changes what was typed (`docs/UX-SPEC.md` §5).
8. **Token guard.** `pnpm lint` rejects raw colors, palette colors, one-off arbitrary values, untokened radii, shadows, fonts, and literal durations and delays in components. A flagged need is matched to an existing token or brought to the owner as a proposed new one (`docs/DESIGN-SYSTEM.md`, "Token guard").
9. **Control edges.** Fields, the theme menu, and secondary buttons are edged in a new `--edge` token at 3:1 against the page and the surface (WCAG 1.4.11); `--line` stays for dividers. Kept after a trial (Sean, 2026-10-15).
10. **Framework.** The island runs on Preact through `preact/compat` (ADR 0007): 89.2 KB of JavaScript became 33.9 KB with no change to how components are written, and the 90 KB budget stays, so the room goes to the product. Owner's choice after a measured spike.

11. **Hosting and domains.** Vercel, with `bigsmall.work` as the main domain and `bigsmall.diy` redirecting to it (ADR 0008). Settled for good on 2026-10-15 (Sean): `bigsmall.work`, a .com or .org not being available; a later change would still be a redirect flip (docs/DEPLOYMENT.md), so the SEO work builds on it.

Decided 2026-10-15 (Sean): the SEO pair pages are in v1, built at M5 on `bigsmall.work`. Decided the same day: Umami Cloud for analytics (ADR 0019), counting since.

## 16. Risks and open questions

- **Ambiguous symbols** (`m`, `oz`, `ton`, `gal`, `cup`, `cal`, `hp`, `mpg`, `kB`). The disambiguation UX decides whether the smart input feels magical or annoying. Test it early.
- **Explicit commit.** Decided: nothing commits on a keystroke, and only Enter or a pick commits (decision 7). The risk left is people who never press Enter; friends' feedback rounds watch for it, and the usability test will if it runs.
- **Bundle size.** Resolved at M2 by removing React Aria (ADR 0006), then at its ceiling (89.2 KB of 90) until the island moved to Preact (ADR 0007), which left about 50 KB of headroom under the same gate (measurements in §9). As formulas and units grow, unit data loads per category against its own budget (§9) so the code that runs first stays small.
- **Themes vs. speed.** Decoration must be free when inactive. Fonts are the main cost; system fonts for the defaults.
- **Locale number parsing.** `1,5` means 1.5 in much of the world. Use the browser locale and show the detected format.
- **Definitions that vary.** Month, year, cup, calorie, horsepower, ton. Each needs a stated definition in the UI and a note in the catalog.
