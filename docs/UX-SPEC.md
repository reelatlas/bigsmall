# UX specification — the converter

Draft v0.1, 2026-10-06. Everything here is a proposal until validated in the milestone 2 usability test. Change this document before changing behavior.

## 1. Layout

Two boxes, A and B, stacked on narrow screens and side by side from about 640 px. Between them: a swap control. Below them: a toolbar with the keypad toggle, mode toggle, and theme button. Each box contains a text field, a unit chip (when a unit is locked), and a suggestion panel that opens below the field while it has focus.

The active box has an accent outline. The keypad, when open, targets the active box.

## 2. Parsing

Input text is parsed on every keystroke into `{ value?: number, query?: string, target?: string }`.

**Number grammar (v1).** Optional sign, digits with optional locale grouping separators, optional locale decimal separator, optional exponent (`1e6`, `2.5E-3`). Whitespace after the number is ignored.

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
