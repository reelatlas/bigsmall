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

## Fourth pass — pending (next session starts here)

Recorded before a context reset so nothing is lost. Each row carries the intended approach; implement in this order and keep the browser tests in step.

| Observation                                                                                                   | Planned change                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row hover and selected highlights, and the scrollbar, overlap the shell's two-pixel edge and look clipped     | Make the edge a real `border-2` (line color idle, accent when active) so children cannot paint over it; inset the rows (`mx-1 rounded-md`) so highlights sit inside with a small gutter; keep the thin scrollbar inside that gutter. Same treatment for the theme menu. Verify with a screenshot of the last row hovered.                                   |
| Escape clears the whole text; typing in bursts should be separate events, and undo should match               | Group keystrokes into chunks the way editors coalesce undo: a new chunk after a pause of about 700 ms or at a space. `input` actions carry a timestamp; the history coalesces within the window; each box keeps its text checkpoints. Escape with the list closed steps back one chunk of this box's text; undo and redo use the same chunks. Document in UX-SPEC. |
| Unit rows read "symbol name"; wanted the name on the left and the abbreviation right-aligned                  | Rows become `name … symbol` with the symbol right-aligned in muted numeric type. The chip stays "symbol name" unless asked.                                                                                                                                                                                                                              |
| Category rows appear for alias and substring matches and make the list feel inconsistent                       | Categories appear only when the typed text starts the category's name ("vol" → Volume) or exactly equals one of its everyday aliases ("fluids"). No prefix or substring matches on aliases. Core change in `classifyCategory` with unit tests; UX-SPEC §4 updated.                                                                                        |
