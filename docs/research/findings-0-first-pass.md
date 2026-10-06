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
