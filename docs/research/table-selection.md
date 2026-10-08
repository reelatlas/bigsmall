# Table selection: option A, decided and built 2026-10-07

Sean found the table layout's suggestion list covering the very table it lists, and the list repeating the table's units. Three prototypes were built in the selection lab (`/dev/selection-lab`, `apps/web/src/pages/dev/_selection-lab/SelectionLab.tsx`) on one shared model, the table as the unit list: A, a category menu; B, category tabs; C, no category control. Sean chose **A** and refined it over several rounds the same day. This document was the behavior to build into the converter's table layout, the decisions behind it, and the plan; it is now built (ADR 0012), and the current behavior lives in docs/UX-SPEC.md §1, §8, §9, and §12. The lab's `TableIsTheList` component, with `control="menu"`, was the working reference; its B and C variants stay in the lab for comparison.

The two-box layout keeps today's suggestion list, its keys, and its chip, unchanged. Both layouts keep one shared conversion state.

## Behavior

### The pieces

- **Category menu** over the box, where the category label was: a fluid shell like the theme menu (`SHELL`, `SHELL_BORDERED`, `SHELL_PANEL`), the trigger reading "Category · Volume ⌄", or "Choose a category ⌄" before one is chosen. Open, its choices are native radios in the shell's panel. While a unit is typed, each choice shows its match count ("Weight — 2 matches").
- **Field**: the converter's field (text layer, fit, chip, copy button). Placeholder "Number or unit" with no unit, "Number" once there is one; never "0", which reads as a value.
- **Chip**: symbol, then name, the readout of the unit in the box. Clicking it opens nothing, only puts the caret in the field. Its × clears the unit and keeps the category: the table stays, with dashes.
- **The table's place** shows one of four things:
  - **The start**, before any category: the categories as a grid of tiles (2 across on a phone, 4 wider).
  - **The full table**, once a category is chosen: every unit of the category in the listed order (ADR 0011), as today: the value right-aligned on the left; on the right the symbol right-aligned and the name left-aligned; the copy button. With no number, or no unit to convert from, each value is an em dash (muted, "no value" for screen readers), so the table never disappears.
  - **The matches**, while a unit is typed after the number (letters, by `typingUnit`): units from every category, no values at all, left-aligned as symbol then name, grouped under a header per category with its match count (Length 5, Volume 1…). Typing "len" offers "Length — all its units".
  - A **message** in place of the rows when the value has no answer ("Too large to convert"), as today.

### Choosing

- **A category** (menu, tile, or a category match) keeps the typed number and lists the category's units with **none chosen**: the values are dashes until a unit is picked, so a typed number means that number in the unit picked (250, then Volume, then cups, gives 250 cups, not 250 teaspoons converted). The first unit is highlighted for Enter to take. A unit is never chosen on load. Other boxes' units follow today's switch rules (no cross-category pair).
- **A unit**, by Enter or a click on a row of the full table, moves into the box: with its value converted, at the box's 10 digits, when the table has values; else the number as typed. A match's unit becomes the source with the number as typed, its category following. The arrows then rest on its row.
- **Matches ranking**: core's ranker (match classes, category rows, limit 20), the current category winning ties without hiding the others. Taking a match drops the query.

### Keys

The caret stays in the field throughout; the table's rows, the matches, and the start's tiles are reached by a cursor the field points at (`aria-activedescendant`), drawn in the muted tint of a hovered row (`bg-surface-raised`), never an outline. The unit in the box keeps its accent fill.

- **↑ ↓ loop**: category menu → field → every row → back round to the menu. On the menu, ↑ goes to the last row and ↓ to the field; open, the arrows move through its choices instead.
- **Resting on the selection**: right after Enter, a click, or typing, the cursor rests on the unit in the box, so ↑ ↓ move from that row (the listbox convention). With no unit, they move from the field: ↓ to the first row, ↑ to the menu.
- **The start's grid**: ↑ ↓ by row, ← → across, once the cursor is in it; in the field ← → move the caret as ever. ↑ from the top row returns to the field. The full table has one choice per row, so ← → stay in the field there.
- **Enter**: on a row, takes it. In the field: a typed unit takes its best match; arithmetic is worked out, as today; with a unit, the cursor comes back to rest on it, wherever the arrows had gone; without one, Enter goes into the table (the start's first tile, or a category's first unit).
- **Esc ladder**, one step a press:
  1. back from browsing the table (only if the arrows had moved into it; right after Enter the cursor merely rests, so this step is skipped);
  2. the typed unit, back to the number;
  3. the number;
  4. the unit and the category, back to the start (the hidden second box too, as clear all does);
  5. lets go of focus, leaving the page.
     Escape on anything else in the converter (a copy button, the chip) brings the caret back to the field; on the menu's trigger it lets go of focus.
- **Typing from anywhere**: on a row, the chip, a copy button, or the menu, any letter, digit, or Backspace lands in the field, and so does a letter, digit, "-", ".", or "," with nothing focused on the page. Typing always **appends** after what is there (554, then 67, reads 55467); Backspace takes the last character back; Esc is how to clear. Never with focus in another control or text field, never with Ctrl, ⌘, or Alt, never Space (which scrolls, or presses a button). The open calculator keeps its own keys.
- **Ctrl/⌘+C** on a highlighted row copies its full value.

## Decisions along the way

- **Append, not replace** (Sean): typing that suddenly replaced a number would surprise; Esc is the clear.
- **× keeps the category** (Sean): × is the small step back, Esc the big one.
- **Choosing a category picks no unit** (Sean, superseding the first spec's "first unit"): otherwise a typed number would convert from a unit nobody chose.
- **No values in the matches** (Sean): rows with and without numbers side by side read as noise.
- **Typing from anywhere** follows the WAI-ARIA combobox guidance (printable keys in the list go to the text field). Page-wide, with nothing focused, it is a single-character shortcut by WCAG 2.1.4's reading; it only types into the field, never acts, and no single-key shortcut exists to clash with. Revisit if one is ever added.

## Build plan

1. **Core**: a `prefer` option on `search` (the current category wins ties within a match class), with tests.
2. **State** (`state.ts`): a `category` field for a category chosen with no unit (set by lock and use, kept by unlock, cleared by clear); a `chooseCategory` action (undoable); `selectTable` returning the start, the full table (values or dashes), or the matches (grouped, with counts), each with its announcement ("12 matches"); unit tests.
3. **Components**: extract the field from `SmartInput` into a shared component both layouts' boxes use; `CategoryMenu` (components, in the gallery); `ConversionTable` reworked for an external cursor and dashes, with grid semantics (`role="grid"`, the copy buttons in their own cells, the combobox's `aria-haspopup="grid"`) so axe passes; a matches list (listbox, a group per category); the start's grid (listbox, 2-D keys). All in the gallery.
4. **Table layout controller**: the keys above, in a component the converter renders for the table layout, the calculator still between the box and the table on a phone and in its column from `md`.
5. **Docs**: UX-SPEC §1, §5, §8, §9, §12 rewritten for the table layout; ADR 0012 (the table as the unit list, the category menu, the selection model; partly superseding ADR 0009's table rules); DESIGN-SYSTEM (the new components, the cursor tint, the dashes); ARCHITECTURE; TESTING; findings.
6. **Tests**: `table.spec.ts` rewritten (the menu, matches by category and across, a category match, Enter, clicks, the arrow loop, the start's grid, the Esc ladder, typing from anywhere and appending, dashes, × keeping the category); axe and the keyboard walk on both layouts; `converter.spec.ts` untouched (two boxes).

## Built (2026-10-07)

Built as planned, in `TableLayout.tsx` with the components in the gallery, and the build settled a few things the lab left open:

- **The menu's arrows move without choosing.** The lab applied a category on every radio change, as the theme menu previews themes. In the converter a category takes the unit out and is a step to undo, so Enter or a click chooses and Escape closes unchanged (docs/LEARNINGS.md).
- **Choosing the category the box is already in keeps its unit.** In the lab it cleared it.
- **Backspace on an empty field takes the unit out**, as the chip's × does and as it does with two boxes.
- **Matched letters are heavier in the matches**, as in every list of matches, and each match tells screen readers its category.
- **The field points at a row only while the cursor is on it**; resting on the unit in the box, it points at nothing, so a screen reader stays on the field while typing.
- **Ctrl/⌘+C copies a row only with the cursor on it**; otherwise it is the field's own copy.
- **Escape's steps are undoable**, like every other change to the conversion; the table layout's Escape does not use the two-box chunks.
- **The tiles go four across at a 512 px column**, the smallest stock container size above the widest case (Theorem's "Temperature" needs 456 px), not at a breakpoint.
- **The server's page carries both layouts' empty state**, so a saved table layout shows its menu, box, and tiles before the island hydrates.

## Open, after Sean sees it in the product

- An **all-clear** interaction, in the action bar or inline.
- Whether a category chosen with no unit belongs in the URL.
- Whether typing from anywhere should reach the first box in the two-box layout too.
