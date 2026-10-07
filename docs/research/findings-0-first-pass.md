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
