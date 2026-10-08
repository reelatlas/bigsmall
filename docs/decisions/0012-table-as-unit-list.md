# 0012 — The table is the unit list: a category menu, and a cursor that keeps the caret in the field

Date: 2026-10-07
Status: accepted; partly supersedes 0009 (decision 2's table)

## Context

In the table layout (ADR 0009), the box's suggestion list grew out of the field over the very table it listed, repeating the table's units and covering its rows. Opening the list only on request (a typed letter, Enter, the arrows) reduced the clash but did not remove it: picking a unit still meant a list over the table.

Sean asked for strategies to explore. Three prototypes were built in a selection lab (`/dev/selection-lab`) on one shared model, the table as the unit list: A, a category menu over the box; B, every category as a tab; C, no category control. All three were tried and refined over several rounds the same day. Sean chose A. The behavior, the rounds, and the decisions are in docs/research/table-selection.md.

## Decision

1. **The table is the list.** In the table layout the box has no suggestion list. The table's place under it shows the categories to start from (before any category), the category's units (with values, or a dash for each while there is no number or no unit to convert from), or, while a unit is typed, the matches from every category, grouped under their category, without values.
2. **A category menu** over the box, a fluid shell like the theme menu, chooses the category. Choosing a category keeps the typed number and chooses no unit; a unit is never chosen for you.
3. **The caret stays in the field.** A cursor the field points at (`aria-activedescendant`) moves through whatever the table's place shows. The arrows go round a loop: the menu, the field, every row, and back to the menu. Enter takes what the cursor is on. Escape steps back a ladder: browsing, the typed unit, the number, the unit and the category, then the page.
4. **Typing from anywhere** in the layout, or with nothing focused on the page, lands in the field, always after what is there.
5. **Grid semantics for the units.** The units are a grid (`aria-haspopup="grid"` on the field), each row a cell for the unit and a cell for its copy button, so no control sits inside another; the matches and the start are listboxes.
6. Two boxes are unchanged: their suggestion list, keys, and chip stay as they are. Both layouts keep one state, history, and URL; the state gains the chosen category, which unit changes set and removing a unit keeps.

Behavior: docs/UX-SPEC.md §1, §8, §9, §12.

## Alternatives considered

- **B, category tabs.** Every category always in view, the categories with matches lit while typing; it costs a row or two of tabs over the box at every width, and the tiles of the start already show every category when nothing is chosen.
- **C, no category control.** Start from the categories in the table's place, or type; once a category is chosen, getting back to the others needs a back row, an extra step for a common change.
- **Keep the list, opened on request** (the build before this one). The clash remains whenever a unit is picked.
- **A popover beside the field.** No room beside a full-width field on a phone, and still a list over the page.
- **Rows as their own Tab stops** (the roving tabindex the table had). Moving between the field and the rows took Tab and focus jumps; with the caret kept in the field, typing, the arrows, and Enter work from one place.
- **The menu's arrows choosing as they go**, as the theme menu previews themes. Choosing a category takes the unit out and is a step to undo, so each arrow would cost the unit and add an undo step; Enter or a click chooses instead.

## Consequences

- New components, all in the gallery: the converter's field extracted from SmartInput (`ValueField`), used by both layouts; `CategoryMenu`; `CategoryTiles`; `UnitMatches`; `MatchedText`, shared with the suggestion list. `ConversionTable` takes an outside cursor and shows dashes. The menu and the theme menu share new recipes (`MENU_TRIGGER`, `MENU_OPTION`, `MENU_CHEVRON`), and the lists the cursor moves through share `CURSOR_ROW` and `rowFill`.
- `TableLayout.tsx` holds the table layout's keys; SmartInput loses its table-only option (`listOpens`).
- Core's search takes a preferred category (`prefer`): the current category ranks first among equal matches without hiding others.
- The state gains `category` and a `chooseCategory` action; `selectTable` returns the start, the units, or the matches, each with its announcement. Choosing a category, taking a unit, and each Escape step that changes the conversion are undoable.
- The cursor is drawn in the muted tint of a hovered row, while the two-box list highlights with the accent's soft fill: in the table, that fill already marks the unit in the box.
- Typing from anywhere with nothing focused is a single-key shortcut by WCAG 2.1.4's reading. It only types into the field and never acts, and no other single-key shortcut exists; if one is ever added, revisit this.
- The server's page carries both layouts' empty state, the table layout's being the menu, the box, and the start's categories.
- Still open, for after Sean uses it (docs/UX-SPEC.md §14): an all-clear control, a chosen category in the URL, and typing from anywhere reaching the first of two boxes.

## Outcome notes (2026-10-07)

- The selection lab retired once A shipped; it is in git as of commit `f1321b0` (`apps/web/src/pages/dev/_selection-lab/`).
