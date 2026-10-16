# Tidy checklist

Walk each section over the files in scope. Searches find candidates; reading the file decides. Every rule here comes from `CLAUDE.md`, `docs/DESIGN-SYSTEM.md`, `docs/ARCHITECTURE.md`, an ADR, or `docs/LEARNINGS.md`. When one of those says otherwise, it wins, and this file gets fixed.

## Tokens and values

- Colors, radii, shadows, fonts, and durations come only from token utilities (`bg-surface`, `rounded-nested`, `shadow-sm`, `font-numeric`, `duration-fast`). `pnpm lint` runs the token guard; it is never silenced.
- No `style=` in components (only the gallery's swatches paint `var(--token)`, and the sketchbook's tiles set their grid and the art's corner from its tuning). Search: `style=` in `apps/web/src`.
- No arbitrary value that stands in for a scale step or a token. Search: `-\[` in `.tsx` and `.astro` files, then judge each: structure is allowed (`grid-cols-[auto_1fr]`, `transition-[border-color,box-shadow]`), values are not.
- A delay is a named constant in `src/lib/timing.ts`, never a number of milliseconds.
- A look no token expresses is a finding for Sean (reuse token X, or add token Y to every theme), never a raw value.

## Recipes and class lists

- A class list, or most of one, in two files becomes a recipe in `src/lib/recipes.ts` with identical output. Search for distinctive runs across files: `min-h-11 cursor-pointer`, `rounded-nested`, `text-sm font-medium text-ink-muted`, `font-numeric font-semibold`, `h-11 w-full items-center`, `border-t border-line`, and any long `className` that looks familiar.
- Two lists for the same role that differ by a utility or two (two triggers, two option rows, two card headers) are one recipe plus the difference at the call site, or a deliberate variant documented in `DESIGN-SYSTEM.md`. An accidental difference is a finding for Sean if it shows.
- A look that depends on a state is a small function returning class lists (`rowFill`), not competing variants on one element.
- A list only one file uses stays in that file as an UPPER_SNAKE constant. A recipe holds only what every use shares.
- TSX joins with `cx()`, Astro with `class:list`; never a template string with `? '' :`.
- `recipes.ts` and the "Recipes" paragraph of `DESIGN-SYSTEM.md` name the same recipes.

## Components and variants

- Markup repeated in two places is a component in `src/components/`, or a prop or variant of one that exists. Extend before adding; never fork.
- A component defined inside a page or a lab that the product uses, or one a second feature needs, moves to `src/components/`; a feature's own parts stay in `features/<name>/`. Search: `^function [A-Z]` and `^export function [A-Z]` outside `src/components/`. Lab-only tools under `src/pages/dev/_<lab>/` stay there.
- Every component in `src/components/` has an inventory row in `DESIGN-SYSTEM.md` and a gallery sample (`src/pages/dev/gallery.astro` and its islands in `src/pages/dev/_gallery/`) in the states that ship.
- Component rules (`DESIGN-SYSTEM.md`, "Component rules"): tokens only, keyboard-operable with visible focus, a name, 44 px targets, 320 px and 400 % zoom, reduced motion, what it branches on as a prop, ARIA written on the element, a labelled container with a role.
- A prop, option, or variant that no caller uses anymore is dead code (below).

## Type and fonts

- Sizes from the scale, numbers in `font-numeric` (tabular digits), faces only through `font-display`, `font-body`, `font-numeric`.
- Text that must fit steps down a ladder in `recipes.ts` through `useFitStep`, `useFieldFit`, or `fitPhrase`: never a third way, never clipped, never a size in between. A column that may not fit gives way whole through `useColumnsFit`.

## Layout

- Fit is decided by measuring the box (`useFieldFit`) or by a container query at the smallest stock size above the widest case, measured in every theme; never by where a component sits, a breakpoint standing in for a width, or a count of characters.
- Where the converter places its pieces is declared once, as named class lists (`TableLayout.tsx`'s `TABLE_GRID` and its cells) or a prop; never inside a shared component, which sets no outer margin (component rule 13).
- A change to a shared component is checked at 320 px and wide, in the converter and in the gallery.
- The server's page carries the converter's empty state, and the first client render matches the server's.

## Behavior and keys

- Every behavior is in `docs/UX-SPEC.md`; code and spec agree. When they disagree, check the findings log, the ADRs, and the research doc behind the feature for which was intended; fix the doc if the code is right, and ask Sean if neither says.
- Work that must happen before the next key runs in a layout effect; keys on a wrapper use native listeners; a widget answers its keys only while focus is inside it, unless an ADR records otherwise.
- Every keyboard shortcut agrees everywhere it is named: the handler, `src/lib/shortcuts.ts` (the map), `UX-SPEC.md` §8's key table and §10's map table, the controls' tooltips and `aria-keyshortcuts`, and `header.spec.ts`. A shortcut kept but left out of the map (Alt+↑ ↓ in Units) says so in §8.
- The page's planes stop at their ends (ADR 0014): nothing wraps from the header to the table or back; a toolbar's ← and → go round their one row.
- No conversion math in the UI; core imports nothing from the DOM, the framework, or `apps/web` (ADR 0003).
- Anything the user edits in the converter lives in the reducer's state and its one history; settings are preferences, outside it (ADR 0018).

## Accessibility

- Names, roles, and `aria-*` on the element itself; a composite follows the WAI-ARIA combobox pattern (ADR 0006, ADR 0012); no control inside another.
- Every Tab stop shows focus; 44 px targets; motion only through the motion tokens.
- axe is clean in every theme, with each list or menu open, and on the gallery (`e2e/smoke.spec.ts` and the feature specs).

## Copy and formats

- Sentence case for labels, buttons, headings, messages, and theme names; no exclamation marks; error and empty text says what to try next.
- Unit symbols and names as the standards write them (mL, kB, °F; "Celsius" and "Fahrenheit" capitalized); category names single capitalized words.
- Digit groups that may wrap use U+202F; special characters are named constants (`MINUS`, `DIGIT_GROUP`, `NO_VALUE`), never Unicode escapes.
- Strings Sean has approved stay exactly as approved; rewording one is a finding for Sean.

## SEO

- Every page in the sitemap meets docs/SEO.md's contract (`pnpm seo:check`, part of `pnpm check`), and every page left out of it asks not to be indexed.
- What was added since the last tidy follows docs/SEO.md §2: a page's own title and description, its text ours, a category's pairs in the pairs' list once pair pages exist, a moved page's old address redirected.

## Dead code and stale bits

- Unused exports: for each export in scope, search its name across `apps/web` and `packages`; one hit (its own definition) means dead, unless it is core's public API (`packages/core/src/index.ts`).
- Unused props, options, recipes, constants, test helpers, e2e selectors, files, and custom CSS utilities in `src/styles/global.css`.
- An option that existed for one caller that has since gone (a layout-only prop after that layout got its own component; `useFieldFit`'s list of texts after the field's second text left with two boxes), and a recipe whose other users were removed, which moves back beside its one use.
- Comments and docblocks that name a function, file, prop, or behavior that no longer exists. Read every docblock in the files that changed, and measure wrapped comments by characters (not bytes: ↑ and × count once): one ragged past 100 after an edit gets rewrapped.
- `TODO`, `FIXME`, and `XXX`: each becomes a fix, a `docs/PLAN.md` item, or goes.
- A prototype the product now duplicates: once a lab's pattern has shipped, the product is the reference. Whether the lab stays is Sean's call.

## Tests

- Each UX-SPEC flow the scope touches has a browser test; each reducer or core rule a unit test.
- Tests assert what something means (a zero duration, `/^0m?s$/`), not how one tool writes it, and check rules across a sweep rather than a count tuned to one machine's font.
- Selectors use roles and names (`exact: true` where one name contains another) or stable `data-*` marks; shared helpers live in `e2e/support.ts`.
- A claim about geometry (it fits, it aligns, it goes four across, a fill keeps its gap) is pinned by a test in every theme where the fonts differ (`THEMES` loop).
- The suite runs in one locale (`en-US` in `playwright.config.ts`, core's format tests passing theirs), so it means the same on any machine; a test that needs another locale sets its own.
- A theme's lengths are read from its tokens (`cssTime`), never written as Daylight's numbers.
- `docs/TESTING.md` describes each spec file as it is.

## Docs

- `UX-SPEC.md`: current behavior only; built items in §14 say so; open questions in §15 still open.
- `DESIGN-SYSTEM.md`: the recipes paragraph, the patterns, the inventory, and the gallery paragraph match the code. The spacing rules hold: a line sits evenly between the ink on either side, and a fill (hovered, focused, switched on) keeps 4 px from a line. A control shown only on the active row stays reachable (`opacity-0 pointer-events-none`); dim text takes the muted ink, never opacity.
- `ARCHITECTURE.md`: the file tables match the tree, and the conventions hold.
- ADRs: a decision explained twice has one; a replaced one says so in its status line; the index lists all.
- `LEARNINGS.md`: every gotcha found has a dated entry, listed in its topic index; one that keeps coming back is promoted into `CLAUDE.md`, an ADR, or the doc where the rule lives, its entry saying **Promoted** to where.
- Research docs say when they were built or superseded; the findings log has a section for the pass, a pass saved before a compaction says where it was built, and rows once open say how they settled.
- ADRs keep a short status line; amendments go in a dated list at the end, never rewriting the decision.
- Persisted settings stay readable: stored by what changed, the version raised when the shape changes, an older version migrated (`settingsFrom`).
- `CLAUDE.md`: "Current status" short and current, "Pick up here" listing the trials (with their reverting commits) and the questions open with Sean, the recipes current.
- Each fact lives in one doc; the others link to it.
