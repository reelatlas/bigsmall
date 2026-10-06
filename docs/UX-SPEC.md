# UX specification — the converter

Draft v0.1, 2026-10-06. Everything here is a proposal until validated in the milestone 2 usability test. Change this document before changing behavior.

## 1. Layout

Two boxes, A and B, stacked on narrow screens and side by side from about 640 px. Between them: a swap control. Below them: a toolbar with the keypad toggle, mode toggle, and theme button. Each box contains a text field, a unit chip (when a unit is locked), and a suggestion panel that opens below the field while it has focus.

The active box has an accent outline. The keypad, when open, targets the active box.

## 2. Parsing

Input text is parsed on every keystroke into `{ value?: number, query?: string, target?: string }`.

**Number grammar (v1, implemented in `parse.ts`).** Optional sign (`-`, `+`, or the Unicode minus), digit groups separated by `.`, `,`, or a non-breaking space, an optional fraction, an optional exponent (`1e6`, `2.5E-3`), and the leading-dot form (`.5`). Which mark is the decimal:

- two different marks present: the last one is the decimal (`1,234.5` and `1.234,5` both work);
- one mark used more than once: grouping (`1,000,000`);
- one mark used once: the locale's reading, unless the tail is not exactly three digits, which can only be a fraction (`1,5` is 1.5 even in en-US; `1,000` is a thousand in en-US and one in de-DE).

Non-breaking spaces always group. Whitespace between the number and the unit is optional.

**Query.** The remainder, trimmed, lowercased, diacritics stripped. Internal whitespace collapsed. Symbols keep their original case for a first exact-match pass (`mL` vs `ML` vs `ml`), then fall back to case-insensitive.

**Phase 2 grammar.** Fractions (`1/2`, `3 1/4`), feet-and-inches (`5'10"`), and the connective form (`5 ml to cups`, `5 ml in cups`) where the part after the connective sets the other box's unit.

Examples:

| Input                | value  | query    |
| -------------------- | ------ | -------- |
| `5`                  | 5      | —        |
| `5 ml`               | 5      | `ml`     |
| `5ml`                | 5      | `ml`     |
| `ml`                 | —      | `ml`     |
| `-40 f`              | -40    | `f`      |
| `1,000.5 km` (en-US) | 1000.5 | `km`     |
| `1.000,5 km` (de-DE) | 1000.5 | `km`     |
| `fluids`             | —      | `fluids` |

## 3. Box states

| State       | Condition                        | Panel shows                                                                                                                                  |
| ----------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `idle`      | empty text, no unit              | Primary categories as chips, then "All categories". If the other box has a unit: that category's basic units, ordered by common counterpart. |
| `number`    | value present, no query, no unit | Same as `idle`, with the prompt "Now pick a unit".                                                                                           |
| `searching` | query present, no unit locked    | Ranked unit matches. If the query matches a category name or alias, that category's units.                                                   |
| `locked`    | unit chosen                      | Panel closed. Field is numeric. Chip shows the unit symbol and name.                                                                         |
| `no-match`  | query present, zero matches      | "No unit matches 'xyz'", then the categories, then three example inputs.                                                                     |

Transitions:

- `locked` + typing a letter → `searching`, with the current unit shown as the first suggestion so a quick swap is one keystroke away.
- `locked` + Backspace on an empty field → removes the chip → `idle` or `number`.
- Selecting a suggestion (tap, click, Enter) → `locked`. Escape closes the panel without changing anything.

## 4. Matching and ranking

A query is matched against each unit's symbol, name, plural, and aliases, and against each category's name and aliases.

Match classes, strongest first:

1. Exact symbol (case-sensitive)
2. Exact symbol (case-insensitive), exact name, exact plural, exact alias
3. Prefix of name or alias (`kilo` → kilometer, kilogram, kilojoule …)
4. Prefix of symbol
5. Substring of name or alias
6. Fuzzy (one typo), only when nothing above matched

Within a class, order by: category lock (the other box's category wins) → locale default (US vs UK variants) → tier (basic before advanced) → popularity → alphabetical.

A category match (`fluids`, `temp`, `distance`) expands to that category's units, basic tier first.

## 5. Locking

- **Unambiguous exact match** (classes 1–2 with a single result): lock immediately. Show the chip with a brief highlight. Keep the panel open for one beat with the next-best alternatives so a wrong lock is one tap to fix.
- **Ambiguous exact match** (`oz`, `ton`, `cup`, `gal`, `pt`, `qt`, `m`, `cal`, `hp`, `mpg`): do not auto-lock. Show each candidate with its category label and definition note. The top candidate is highlighted; Enter picks it.
- **Partial match:** never auto-lock. Enter picks the highlighted suggestion.
- **Timing (added after milestone 1).** An exact match can still be the start of a longer key (`c` → `cm`, `cup`; `km` → `km/h`, `km²`). The engine reports this as `canExtend`. When it is false the lock fires on the keystroke; when it is true the lock waits for a word boundary (space, Enter, Tab, blur), so typing never fights a premature lock.
- **Engine contract.** `resolveExact(query, { category })` returns a unit only when exactly one unit matches in classes 1–2 within the current scope. `oz` resolves once a category is locked.

This is the behavior most likely to need tuning after testing.

## 6. Category linkage

- When box A locks a unit in category C, box B's suggestions are scoped to C. An escape hatch ("Search all units") is always visible at the bottom of B's panel.
- If the user picks a unit from a different category D in box B, box A's unit is cleared, A returns to `idle` scoped to D, and a short message says "Switched to D". No silent cross-category pairs.
- Clearing both units unlocks the category.

## 7. Conversion and display

- Conversion runs whenever both boxes have a unit and the source box has a value.
- The box edited last is the source. The other box is derived. Editing the derived box makes it the source.
- Derived values are formatted to the current precision (default 10 significant digits, trailing zeros trimmed, locale grouping). Values beyond 1e15 or below 1e-6 switch to exponent form.
- The derived box has a copy action that copies the full-precision value.
- A polite live region announces "5 milliliters is 0.169 US fluid ounces" when the result settles (debounced so screen readers are not flooded).
- Swap exchanges units and values and keeps the same source side.

## 8. Modes

- `basic` (default): suggestion lists show basic-tier units; a final row "Show all N units" expands the category for this search.
- `advanced`: all units shown always.
- Auto-escalation: when a query matches only advanced-tier units, show them and label the panel "Advanced units". The mode setting itself does not change.
- The mode toggle persists.

## 9. Keypad

- Toggle in the toolbar. On narrow screens the keypad docks to the bottom; on wide screens it sits beside the boxes.
- Keys (v1): `0–9`, decimal separator (locale-aware), backspace, clear, negate, and a "target A / B" switch.
- Keys are real buttons, 48 px minimum, with visible focus and pressed states. Keypad input goes through the same parser as typed input.
- Phase 2: `+ − × ÷ =` with evaluation into the box, `½ ¼ ⅛` fraction keys, `′ ″` keys.

## 10. URL and persistence

- URL encodes the pair and value: `/?a=5ml&b=cup`. Loading a URL restores the state. Updating the URL uses `replaceState` and is debounced.
- `localStorage` (all optional; the app works when storage is blocked): theme, mode, precision, locale override, last conversion, up to 10 recent pairs, pinned pairs.

## 11. Empty, error, and edge cases

- Non-finite or absurd inputs (`1e400`): show "That number is too large" in the derived box.
- Division-by-zero cases in reciprocal categories (0 L/100 km): show "Undefined for 0".
- Negative values for units that cannot be negative (mass, length): allowed, with no warning. Temperature below absolute zero: allowed, with a small note.
- Paste of a value with a unit (`5 ml`) into a locked box: re-parse; if the unit differs, re-lock to the pasted unit.

## 12. Things to test with people (milestone 2)

1. Do people understand they can type a unit into the box, or do they look for a dropdown?
2. Does auto-lock on exact match feel helpful or surprising?
3. Ambiguity: when `oz` offers two choices, do people pick correctly without reading?
4. Do people find the swap and keypad controls?
5. On a phone, is one-thumb use comfortable with the keypad open?

## 13. Input flexibility (principle, phased)

Decision 2026-10-06: the box accepts what people naturally type and never punishes formatting. Not implemented yet; this section is the standing brief so each phase builds toward it.

- **Spacing is irrelevant.** `5ml`, `5 ml`, `5  mL`, and `5 ml` all parse the same.
- **Locale number formats.** `1,5` and `1.5` both work according to the detected locale. When an input is ambiguous, the other reading is offered, and a quiet line under the field shows the number we understood.
- **Math inside the box.** `2*3 ft`, `(5+7)/2 cm`, `2^10 bytes`, `1e6 m`, `3 1/2 in`, `5'10"`. Operators: `+ − × ÷ * / ^ ( )`, `e`/`E` exponents, unicode minus and multiplication signs, and `x` as multiply when it sits between two numbers.
- **Enter means equals.** When the box holds an expression, Enter evaluates it in place and the unit chip stays locked. With a bare number, Enter does nothing new because the result is already live.
- **Show the understanding.** While an expression is being typed, a line under the field shows the evaluated value (`= 1024`) so people trust what will be converted.
- **Never block.** A partial or invalid expression keeps the last good result and shows a soft hint, not an error state, until the user pauses.

Phasing: v1 ships the number grammar in §2 (sign, grouping, decimal, exponent). Phase 2 adds fractions, feet-and-inches, and the connective form. Phase 3 adds the expression evaluator (a small dependency-free parser in core, never `eval`) and Enter-as-equals. The keypad grows the same operators when phase 3 lands (§9).

## 14. Milestone 2 implementation notes (2026-10-06)

What shipped and where it deliberately differs from the sections above. Each difference is a candidate question for the usability test (docs/research/usability-test-1.md).

- **Labels.** The boxes are named "First value" and "Second value" for assistive technology. Neither is "from" or "to" because either can drive the other. One shared hint sits under the boxes.
- **Lock closes the panel.** §5 asks for the panel to stay open one beat after a lock; for now it closes, and the chip's remove control is the undo.
- **Lock timing** follows §5: on the keystroke when nothing else could still be typed, otherwise on Space, Enter, Tab, or blur.
- **Source handoff.** Only a number makes a box the source. Typing a bare unit into the other box keeps the current source, so the number already entered never disappears while a unit is being chosen.
- **Swap** moves the typed value with its unit to the other side and makes that side the source, so nothing is re-rounded. §7's "keeps the same source side" meant this.
- **Category rows** expand in place: picking "Length" lists its units. "Search all categories" at the bottom of a scoped list is the escape hatch from §6.
- **No match** shows the message, then the categories.
- **URL** is `?a=<unit>&b=<unit>&v=<number>&s=<a|b>` (§10), written with `replaceState` after a short pause.
- **Known gap: typing before hydration.** The island is server-rendered; keystrokes before React attaches are lost. Tests wait for the `data-hydrated` mark. Planned fix in milestone 3: an inline listener records early keystrokes and the island adopts them, the same approach as the theme picker.
- **Not yet:** keypad (§9), persistence (§10), precision setting, the chip's definition note, the "next-best alternatives" after a lock.

## 15. Changes after the first pass (2026-10-06)

Sean's first use of the milestone 2 build. Each item is now implemented and covered by a browser test.

- **Chip on the right.** The number sits on the left of the field and the unit chip on the right, so a box reads "250 mL".
- **Back at the top.** When a category is expanded, a plain "← Back" control sits above the list, not below it. There is no "Search all categories" control: a query that finds nothing in the scoped category widens to every category by itself, so a unit from elsewhere is always one pick away.
- **Escape is Back, one step at a time.** Expanded list → previous list. Open panel → closed. Then whatever was put into the box most recently: text typed last → text cleared; unit chosen last → unit removed and that category's units listed; then the other. The list Escape opens after removing a unit closes on the next Escape.
- **Undo and redo.** Ctrl/Cmd+Z and Ctrl/Cmd+Y (or Shift+Z), plus two buttons by the hint. The last interaction is what gets undone: a run of typing in one box is one step, and undoing a unit pick keeps the number and removes the unit. Loading from a URL starts a fresh history.
- **The chip opens the list.** Clicking the chip body lists the units of its category so the unit can be changed in place; the × still removes it.
- **No "category" subtext** on category rows. The chevron and the missing symbol column mark them.
- **Sentence case everywhere** except proper names and unit conventions (docs/DESIGN-SYSTEM.md, "Copy"). "Neon noir", not "Neon Noir".
- **The list floats.** The suggestion panel overlays the page below the field instead of pushing content down. A browser test checks the other box does not move.
- **Enter commits.** Enter picks the highlighted row or locks an exact match, then closes the list, the same result as clicking out, while focus stays in the field (the combobox convention).
- **Copy on both boxes** whenever a box holds a number, so the control never jumps sides.
- **Room for numbers.** The page is wider on desktop; a number longer than nine characters steps down one text size; a number longer than six collapses the chip to its symbol. The full value is always in the field and in copy.
- **Chip hover** tints the chip toward the surface instead of replacing its color.
- **Fewer words.** "Now pick a unit" and the "category" subtext are gone; the only message left is the no-match one.
- **One control language.** The theme picker keeps a native select for accessibility but its trigger now matches the other controls (docs/DESIGN-SYSTEM.md, "Controls").

## 16. Third pass (2026-10-06)

- **Nothing locks on a keystroke.** The best match is highlighted as you type; Enter, picking a row, Tab, or leaving the field commits it. "gb" and "ml" stay editable text until then. §5's keystroke lock and the `canExtend` timing are retired for the UI (the engine still reports it).
- **Two levels, one Back.** Every unit list, including the one the chip opens, has "← Back" at the top with the category name beside it. Back always goes up to the categories; Escape does the same whenever Back is visible, closes the list at the category level, and only then clears the latest entry (§15).
- **A category label** sits above the boxes: the category being browsed while a list is open, otherwise the locked category. It disappears when the last unit is removed.
- **One fluid shape, drawn over the page.** The list grows out of the field inside one rounded border, as in milestone 2, but the shell is absolutely positioned inside a fixed-height placeholder so nothing below moves.
- **The theme menu uses the same shape:** trigger and options in one shell, native radios inside, driven by the pre-paint script. The system select popup is gone because its square, OS-colored list could not match the design language.
