# 0006 — The smart input is a hand-built WAI-ARIA combobox; React Aria removed

Date: 2026-10-06
Status: accepted

## Context

The smart input takes a number, a unit, or both in one field, locks the unit into a chip, and keeps the number in the field. Library comboboxes (React Aria's included) assume the text in the field is the selected item's name: on selection they write that name into the input, clear the selection when the text stops matching, and own Enter and Escape. Every one of those assumptions fights the hybrid field.

After milestone 2's first build the converter page measured 91.4 KB of gzipped JavaScript against a 90 KB budget. The largest avoidable piece was React Aria's button machinery (press, hover, and focus management), which the page used for two buttons.

## Decision

1. Build the smart input directly on the WAI-ARIA combobox pattern: the input keeps DOM focus, `role="combobox"` with `aria-expanded`, `aria-controls`, and `aria-activedescendant`; the listbox rows are `role="option"`; arrows, Enter, Escape, Tab, Space, and Backspace are handled by the input. Playwright with axe checks every state on desktop and mobile viewports, and a manual screen reader pass is scheduled before launch (docs/TESTING.md).
2. Use native elements for everything else that has a native equivalent: `<button>`, `<select>`, later `<dialog>`.
3. Remove `react-aria-components`. The page measures 79.1 KB after the change.
4. Bring a component library back only for a measured need, recorded in a new ADR.

## Alternatives considered

- **React Aria `ComboBox` with controlled `inputValue`.** Possible, but every behavior in docs/UX-SPEC.md §3–§5 would be an override of library defaults, and the bundle cost stays.
- **Downshift `useCombobox`.** Designed for custom input text and has a state reducer for overrides. About 10 KB more than hand-rolling for roughly the same amount of code we would still write.
- **Raise the budget.** Rejected: the budget exists to force exactly this decision.

## Consequences

- One composite control to maintain by hand. Its keyboard and ARIA contract lives in `SmartInput.tsx` and is pinned by the browser tests.
- No component library dependency. ADR 0002's "React Aria Components" row is superseded by this decision.
- The milestone 2 bundle is 79.1 KB JS and 4.4 KB CSS gzipped; `pnpm bundle:check` fails CI above 90 KB and 20 KB.

## Outcome notes (2026-10-06)

- **Space is not handled.** Decision 1 listed it, but the input leaves Space alone: it types a space, which also starts a new typing chunk for undo.
- **The Back row is an option.** Inside a category the list's first row is "← Back", a `role="option"` like the others, so `aria-activedescendant` and the arrow keys reach it and Enter on it goes up a level.
- **Commits.** Only Enter and a pick commit a unit. Tab and leaving the box never commit, so moving between boxes never changes what was typed (owner decision; docs/UX-SPEC.md §5).
- **The theme menu is native radios** in a header shell, per decision 2, not a second listbox.

## Outcome notes (2026-10-07)

The smart input this decision built retired with two boxes (ADR 0013). Its hand-built combobox lives on in the table's box, whose popup is the table's place, a grid or a listbox (ADR 0012).
