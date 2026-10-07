# Findings 0 — Sean's first pass at the milestone 2 build

Date: 2026-10-06. One person, the product owner, on the desktop build in the Theorem theme. Not a usability test; the observations were acted on the same day so the five-person test (usability-test-1.md) starts from a cleaner baseline.

## Observations and what changed

| Observation                                                             | Change                                                                                               | Where                                           |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| The unit chip sat left of the number; "mL 250" reads backwards          | Chip moved to the right of the number                                                                | `SmartInput.tsx`                                |
| After opening a category, the way back was at the bottom of a long list | Back control at the top of the panel; "Search all categories" lives there too                        | `SuggestionPanel.tsx` header                    |
| Escape should mean "back" at every step                                 | Escape ladder: expanded list → unit → panel → text                                                   | `SmartInput.tsx` `escape()`, UX-SPEC §15        |
| No undo or redo; undo should target the last interaction, not the text  | History with typing runs coalesced; Ctrl+Z / Ctrl+Y and two buttons; undoing a lock keeps the number | `state.ts` `reduceWithHistory`, `Converter.tsx` |
| Clicking the chip did nothing                                           | Chip body opens the unit list for its category; × removes                                            | `UnitChip.tsx`                                  |
| "category" subtext in rows was noise                                    | Removed; chevron and layout carry the meaning                                                        | `SuggestionPanel.tsx`                           |
| "Neon Noir" broke the sentence-case rule                                | Renamed "Neon noir"; copy rules written down                                                         | `themes.ts`, DESIGN-SYSTEM "Copy"               |

## Open questions for the five-person test

- Does Escape removing the unit surprise anyone who only meant to close the list?
- Do people find undo without the keyboard shortcut? The buttons are small and sit by the hint.
- Is a chip on the right discoverable as something to click?

## Second pass, same day

| Observation                                                                    | Change                                                                                                 |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| The list pushed content down                                                   | Floats over the page                                                                                   |
| Should Enter finalize like clicking out?                                       | Yes: Enter picks or locks, then closes the list; focus stays in the field                              |
| Chip hover matched the field background                                        | Hover tints the chip toward the surface                                                                |
| Only six to eight digits fit                                                   | Wider page, one-step smaller type past nine characters, symbol-only chip past six                      |
| Should both boxes copy?                                                        | Yes, whenever a box holds a number                                                                     |
| Too much text in the list: chevron, "Search all categories", "Now pick a unit" | Plain "← Back" only when a category is expanded; scoped searches widen on no match; the prompt is gone |
| Escape removed the unit when typing was the last thing done                    | Escape clears the most recently entered thing first                                                    |
| The theme dropdown looked unlike the inputs                                    | Trigger restyled to the shared control language; native popup kept                                     |

## Third pass, same day

| Observation                                                        | Change                                                                                                          |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| The list the chip opens had no way back to the categories          | Every unit list has "← Back" with the category name; Back and Escape both go up to the categories               |
| "gb" and "ml" chipped themselves while still being typed           | No lock on a keystroke; the match is highlighted and Enter, a pick, Tab, or leaving the field commits it        |
| Escape closed the list when Back was showing                       | Escape is Back whenever Back is visible; it closes only at the category level                                   |
| Nothing said which category you were in                            | A label above the boxes names the category being browsed or locked, and clears with the unit                    |
| The detached list and the square native theme popup broke the look | Field and list are one fluid shape again, drawn over the page; the theme menu is built the same way with radios |

## Fourth pass, same day (recorded before a context reset, built after it)

| Observation                                                                                               | Change                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row hover and selected highlights, and the scrollbar, overlap the shell's two-pixel edge and look clipped | The edge is a real `border-2` (line at rest, accent when open or focused) that children cannot paint over; rows sit in a `p-1` gutter with `rounded-md` corners, and the thin scrollbar sits inside the same gutter. Same for the theme menu. Checked with the last row hovered in every theme |
| Escape clears the whole text; typing in bursts should be separate events, and undo should match           | Keystrokes less than 700 ms apart form one chunk; a pause or a space starts a new one. Undo, redo, and Escape all step through those chunks; Escape steps are themselves undoable (UX-SPEC §17)                                                                                                |
| Unit rows read "symbol name"; wanted the name on the left and the abbreviation right-aligned              | Rows read `name … symbol`, symbol right-aligned in muted numeric type. The chip keeps "symbol name"                                                                                                                                                                                            |
| Category rows appear for alias and substring matches and make the list feel inconsistent                  | A category row needs the start of its name ("vol" → Volume) or a whole alias ("fluids"); no prefix or substring on aliases, no fuzzy categories (`classifyCategory`, UX-SPEC §4)                                                                                                               |
| An `E` in a value blends in with the digits                                                               | The exponent marker is semibold, drawn by a text layer over the field (UX-SPEC §17, DESIGN-SYSTEM "Fields")                                                                                                                                                                                    |
| Long numbers get cut off; two or three size steps are not enough                                          | Five size steps chosen by measuring the text against the field on every change and resize; the number stays on one line and scrolls only past the smallest size. Wrapping is a later idea                                                                                                      |
| (Found while checking) Hover was invisible in Daylight                                                    | `--surface-raised` in Daylight was the same white as `--surface`; now a faint warm gray                                                                                                                                                                                                        |

Noticed, not changed: the URL stores the parsed number (`v=123456789012345680` after typing eighteen digits), so a reload shows the double rather than the typed text. Fold into the URL and persistence work in milestone 3.

## Fifth pass, same day

| Observation                                                                                | Change                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Symbols in the list were not bold like the chip                                            | Symbols are semibold, right-aligned, in the chip's style                                                                                                                                                     |
| A result too large to compute showed "0"                                                   | The other box says "Too large to convert" or "Too small to convert" in place of a value; numbers beyond a double count as numbers (UX-SPEC §7)                                                               |
| Better hint wording, above the boxes                                                       | "Type a number, unit, or both. Once each box has a unit, typing in one updates the other." Above the boxes, with undo and redo at its right                                                                  |
| "Type…" in both placeholders was repetitive                                                | Examples only, different per box ("5 ml, feet, °F…" and "2 kg, inches, speed…"); once the other box has a unit, three units of its category                                                                  |
| The category label should sit under the box whose unit came first, as a cue for the anchor | It sits under the anchor: the box holding the typed number once it has a unit, else the box whose unit set the category; before any number the first box to get a unit keeps it (UX-SPEC §18)                |
| Matched letters should stand out in the list                                               | Matched letters are set heavier in names, categories, and symbols, using search's own normalization (core `matchSpan`)                                                                                       |
| The field felt cramped and slightly misaligned, and so did the lists                       | Measured: chip and copy sat 4 px from the top and bottom but 12 px from the side, the list header sat 10 px off the symbol column, and swap had a thinner edge. Even 8 px insets, nested corners, 2 px edges |
| A way to clear everything                                                                  | An eraser button at the far right of the toolbar; undoable; puts the caret back in the first box                                                                                                             |
| Tab should go to the next box                                                              | Tab goes first box, second box, swap; in-field buttons leave the Tab order since the field's keys cover them; the list is no longer a Tab stop                                                               |
| Back should be reachable with the arrow keys                                               | Back is the list's first option, pinned while scrolling; Up from the first unit or Down from the last highlights it and Enter goes back                                                                      |
| "Neon noir" should be "Neo-noir"                                                           | Renamed, id `neo-noir` included                                                                                                                                                                              |
| The label under the second box was right-aligned, away from the typed value                | Both labels start where the value starts, under the left of the box                                                                                                                                          |
| "Switched to Temperature" was not needed                                                   | The label just names the category; the switch shows through the label moving and the cleared unit                                                                                                            |
| "Too large to convert" was cut off                                                         | The message shrinks through four sizes like a long number, wraps only as a last resort, and the chip collapses to its symbol while it shows                                                                  |
| A keyboard shortcuts map, shown on hover next to the theme menu                            | A keyboard icon left of the theme menu opens the map on hover, pins on click, closes on Escape; Ctrl or ⌘ by platform; hidden on touch-first devices and narrow windows (UX-SPEC §19)                        |
| Swap and the keyboard icon should look like the clear button                               | Both are ghost icon buttons: no border, the page behind them                                                                                                                                                 |
| A green edge lingered around the keyboard icon after its menu closed                       | The icon uses the button focus ring, and the open edge comes and goes with the panel, without a fade                                                                                                         |
| Copying gave no feedback                                                                   | The copy icon turns into a check in the success color, announced as "Copied"; it reverts when the mouse leaves (after at least a second) or after two seconds without a mouse                                |
| The shortcuts map should be shorter, without group headings                                | One list of six in Sean's wording; arrows as two keycaps with nothing between, "or" between alternatives                                                                                                     |

## Hygiene pass — in progress (next session starts here)

Two read-only audits (docs against code, code hygiene) ran on 2026-10-06. The code fixes are done, tested, and committed: visible focus on every button (Tailwind v4's `outline-none` was hiding the ring), header menus closing when focus leaves them, arrow keys previewing themes without closing the menu, reduced motion that actually zeroes the theme tokens, the URL keeping a German "1.000" as 1000, a 44 px chip remove target, motion and corner utilities in the bridge, one fluid-shell recipe (`src/lib/shell.ts`), one timing module (`src/lib/timing.ts`), shared e2e helpers (`e2e/support.ts`), a gallery of real states, dead code removed (`canExtend`, unused theme helpers and icon, unused exports), and new tests for each. Rewritten docs: UX-SPEC (now current behavior only), usability-test-1, README, ARCHITECTURE, TESTING, DESIGN-SYSTEM, THEMING.

**Remaining doc work (do first next session):**

1. **PLAN.md**: §3 UX concept (no chips, no auto-lock, display order); §5 architecture tree and the data-model and state drafts → point to ARCHITECTURE.md and `types.ts`/`state.ts`; URL format `?a=<unit>&b=<unit>&v=&s=`; §6 Lighthouse not yet in CI, drop the React Aria and SvelteKit notes; §8 token names → point to DESIGN-SYSTEM; §9/§16 bundle now about 82 KB; precision is 10 digits, not 12; §13 swap shipped in M2, M4's picker, contrast tests, and gallery exist; §16 "auto-lock vs explicit pick" decided (nothing commits on a keystroke); add docs/research to §12.
2. **UNITS-CATALOG.md**: "auto-lock" wording (L9, L121) → aliases change ranking and what Enter, Tab, and leaving a box commit; the chip shows no definition note (planned); list every unit with a note; drop "(proposed)"; recipe must name `golden/index.ts`.
3. **LEARNINGS.md**: add "Superseded" lines to the focus-edge entry (border plus inset ring), the onBrowse entry (callback removed; keep the general rule), and the auto-lock wording; new entries: `outline-none` hides Tailwind v4 focus rings; unlayered theme tokens beat a layered reduced-motion override; Astro passes children to React as markup (Keycap takes `label`); radios fire change on every arrow key; dev toolbar in Tab walks; a `div` with `aria-label` needs a role.
4. **ADRs**: append an outcome note to 0002 (both header menus are inline-script driven); 0006: Space is not handled, the theme menu is radios, the Back row is an option.
5. **CLAUDE.md**: rule 5 already names the header menus; update rule 6 (axe runs on `/` in every theme and on the gallery once; a keyboard walk checks focus) and rule 7 (bundle budget gates CI; Lighthouse joins at M5); add recipes for a shortcut, a header menu, and UI timings.
6. **DESIGN-SYSTEM.md** is current; **ARCHITECTURE.md** lib table needs `timing.ts`, `shell.ts`; components list needs `Keycap`, `HeaderMenus`.

**Open decisions for Sean:**

- **Field edge contrast.** `--line` is under 3:1 against `--canvas` in every theme, so a field's resting edge does not meet WCAG 1.4.11 by itself. Recommendation: a new `--edge` token at 3:1 or better for control edges, keeping `--line` for dividers. This visibly darkens field borders, so it is your call.
- **Commit rules.** Enter commits the highlighted best match (`kilom` → kilometers), but Tab and clicking away commit only an exact match. Keep as is and watch it in the usability test, or make Tab accept the highlight too.
- **Lint guard for raw values.** A lint rule that rejects raw colors and arbitrary token values in class strings; today review catches them.
