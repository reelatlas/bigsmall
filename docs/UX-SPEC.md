# UX specification — the converter

Current behavior of the milestone 2 build, 2026-10-06. This document describes what the converter does now; anything not built yet is under **Planned** (§14). Change this document before changing behavior, in the same change. How each rule got here, pass by pass, is recorded in `docs/research/findings-0-first-pass.md`.

## 1. Layout

- **Header.** The site name on the left. On the right, a keyboard icon that opens the shortcuts map (§10), the copy-link button (§7), then the theme menu. Below the `sm` breakpoint the theme menu shows only the theme's name (the word "Theme" stays for screen readers), so the header keeps one line on a 360 px phone.
- **The wordmark at play.** While a mouse is over the heading (the name and its art, not the menus), the site name turns into something else and back, like a split-flap board: each letter flips through symbols and lands, left to right. Twelve kinds of phrase, each drawn by a weight the lab tunes: "big" or "small" replaced by a unit, number, or symbol (`∞small`, `bigµm`), both replaced (`TBnm`), letters swapped for look-alikes or capitals (`bιgSmall`), opposite pairs (`giganano`, `km:mm`), analogies of size (`whale:krill`, `oak:acorn`, `Everest:anthill`), idioms of size and measure (`drop in the ocean`, `a stone’s throw`, `byte-sized`), equations (`E = mc²`, `Δx·Δp ≥ ℏ/2`), constants (`α ≈ 1/137`, `c = 299 792 458 m/s`), conversions (`−40 °C = −40 °F`), wordplay on the name (`small ⊂ big`, `∫small = big`), and text art (`▁▂▃▄▅▆▇`): over a thousand phrases, never the same twice in a row. At rest it changes every 2 s; moving the pointer speeds it up at once, the faster the movement the faster it goes, down to about every 0.1 s, then eases back as the pointer slows. Each phrase takes the largest type size at which it fits the name's width, from the name's own size down to `sm`; from `base` down, a long phrase takes two lines before a smaller size ("big fish," over "small pond"), broken at a space or after a colon and never inside a grouped number. A flipping letter is never wider than the room its phrase leaves, so no frame runs past the name, and nothing is clipped, so descenders and tall symbols show whole; nothing beside the name moves. The art plays along: with the name's next change it flips to a symbol or a short expression in the theme's accent (`π`, `ℏ`, `c²`), landing after the name's letters, and from then on it flips back to its drawing about every other change and out again with the next. Leaving the heading lets the name and the art land back home. On a touch screen, a tap on the heading plays it for four seconds. The heading's name stays "bigsmall" for screen readers and search engines throughout; under reduced motion nothing plays. Its code (`lib/wordmark.ts`, `components/wordmark-motion.ts`) runs only once the heading is hovered or tapped, and every setting is tuned on `/dev/wordmark-lab` (docs/DESIGN-SYSTEM.md, "Tuning labs").
- **Theme art.** A small drawing beside the site name, one per theme and drawn for bigsmall: a sun (Daylight), a full moon (Midnight), a cherry blossom (Sakura), a neon skyline (Neo-noir), a hard hat (Hardhat), and a chalkboard with chalk (Theorem), each in its theme's art colors. Decorative and hidden from screen readers; it shows from the `sm` breakpoint up, since a phone's header has no room for it.
- **Hint and toolbar.** Above the boxes, on a line of its own: "Type a number, unit, or both. Once each box has a unit, typing in one updates the other." On the next line, right-aligned over the boxes: the calculator icon, a thin rule, undo, redo, a thin rule, and clear all, all ghost icon buttons. The same at every width, so the instructions and the tools read apart.
- **Two boxes.** Side by side from the `sm` breakpoint (640 px), stacked below it. A ghost swap button sits between them. Each box is a field (a text input, the unit chip once a unit is chosen, and a copy button once it holds a number) whose suggestion list grows out of it over the page, never pushing content down.
- **Category label.** Under the box the conversion is anchored on (§6), left-aligned with the value.
- **Calculator.** When open, a scratch pad below the boxes (§8).
- Field geometry, corners, and the fluid-shell pattern are in docs/DESIGN-SYSTEM.md ("Fields", "Fluid shells").

## 2. Parsing

Each box's text is parsed on every keystroke into `{ raw, value?, valueText?, query?, outOfRange?, invalid?, expression?, exponentMarks? }` (`packages/core/src/parse.ts`): a leading number or arithmetic, if any, and the rest as a unit query in its original case.

**Number grammar.** Optional sign (`-`, `+`, or the Unicode minus), digit groups separated by `.`, `,`, a non-breaking space, or a narrow non-breaking space, an optional fraction, an optional exponent (`1e6`, `2.5E-3`), and the leading-separator forms `.5` and `,5`. Which mark is the decimal:

- two different marks present: the last one is the decimal (`1,234.5` and `1.234,5` both work);
- one mark used more than once: grouping (`1,000,000`);
- one mark used once: the locale's reading, unless the tail is not exactly three digits, which can only be a fraction (`1,5` is 1.5 even in en-US; `1,000` is a thousand in en-US and one in de-DE).

Non-breaking spaces always group. Whitespace between the number and the unit is optional.

A decimal mark still waiting for its digits belongs to the number (`5.` on the way to `5.5` is 5).

**Arithmetic.** The number can be arithmetic: numbers joined by `+ − × ÷ ^` (or `-`, `*`, `/`), with signs and parentheses, spacing optional (`2 × 3 ft` is 6 and `ft`, `2^10 bytes` is 1024 bytes). `^` comes first and groups from the right (`2^3^2` is 2^9), and before a sign, so `−2^2` is −4 and `2^−3` is 0.125; then `×` and `÷`; then `+` and `−`. It ends where something else begins, so `5 km/h` is still 5 and `km/h`: an operator joins the arithmetic only before another number, a sign, or `(`, or at the very end. Unfinished arithmetic is read as far as it goes while typing: a trailing operator or `(` is ignored and open parentheses close at the end (`5 +` is 5, `(5 + 3` is 8). `expression` is set once an operation was evaluated. A small hand-written parser in core does it, never `eval`. Not yet: `x` as times, implied multiplication (`2(3)`).

**Out of range.** A number a double cannot hold is still a number: `1e400` sets `outOfRange: 'large'`, and nonzero digits that round to zero (`1e-400`) set `'small'`; arithmetic that overflows or underflows does the same; `value` is absent in both cases. Dividing by zero, including `0^−1`, sets `invalid: 'divide-by-zero'`, and a power with no real value (`(−8)^0.5`) sets `invalid: 'not-real'`, both without a value.

**Query.** Whatever follows the number, trimmed, in its original case. Search folds it (§4); the parser does not.

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
| `2 × 3 ft`           | 6      | `ft`     |
| `1/2 cup`            | 0.5    | `cup`    |
| `5 km/h`             | 5      | `km/h`   |

## 3. The suggestion list

**Opening.** Focusing a box opens its list; so do typing, the arrow keys, and clicking the chip. A box that holds an uncommitted query opens with its best match highlighted again, so Enter takes it. A focused result box selects its text, so typing replaces it and Ctrl/⌘+C copies it.

**Two levels.** The top level lists the categories. Inside a category, the list shows that category's units with a **Back row** first: "← Back" and the category name, pinned while the list scrolls. A box is inside a category when it has a unit, or when the other box has one (its scope); picking a category row, or Back, moves between the levels. Going back up highlights the category just left, so Enter goes straight back in; when a typed query hides that row, the best match is highlighted instead.

**What it lists.**

- Nothing typed: the scope's units in display order, or the categories when there is no scope.
- A query: ranked matches (§4) within the scope. A query that matches nothing in the scope widens to every category on its own, so a unit from elsewhere is always one pick away.
- No match anywhere: "No unit matches "xyz". Try ml, feet, or °F." above the category rows.
- At most 20 rows.

**Rows.**

- A unit row reads "name … symbol": the plural name on the left, the symbol right-aligned, semibold and muted: the order the chip shows them in. When the list spans categories (top level, or a widened search) each unit row also names its category, which is how `oz` (weight) and `fl oz` (volume) are told apart.
- A category row shows its name and a chevron.
- The letters the query matches are set heavier, under the same folding search uses (`me` marks "**me**ters" and "kilo**me**ters"; `floz` marks all of "fl oz"). A unit found through an alias the row does not show gets no mark.
- Moving the pointer over a row highlights it. A row that appears under a still pointer, as after Back, does not take the highlight.

**Placeholders.** An empty box with its own unit shows "0". With no unit, it shows examples: "5 ml, feet, °F…" in the first box, "2 kg, inches, speed…" in the second (which shows a category can be typed). Once the other box has a unit, an empty box lists three units of that category instead ("L, tsp, tbsp…" beside milliliters), never the other box's own unit.

## 4. Matching and ranking

A query is folded for matching: case, accents, spaces, periods, and degree signs do not count, superscripts read as digits, and `µ` reads as `u` (`normalize.ts`). It is matched against each unit's symbol, name, plural, and aliases, and against each category's name and aliases.

Match classes, strongest first:

1. Exact symbol, case-sensitive (`mL`)
2. Exact symbol, name, plural, or alias, case-insensitive (`ml`, `kilos`, `centigrade`)
3. Prefix of a name, plural, or alias (`kilo…`)
4. Prefix of a symbol
5. Substring of a name, plural, or alias
6. One typo away, for units only, only when nothing above matched and the query has at least three characters

**Category rows** appear only when the query starts the category's name (`vol` → Volume) or equals one of its everyday aliases exactly (`fluids`, `temp`, `how heavy`). Aliases never match by prefix or substring, and categories are never fuzzy-matched; the no-match list shows them all anyway.

**Order.** Stronger class first. Within a class, categories before units; among units, the preferred unit family first (US visitors see US units first, UK visitors imperial, everyone else metric, from the browser's region), then basic before advanced, then display order. The other box's category is a filter (the scope, §3), not a ranking.

## 5. Committing a unit

Nothing commits on a keystroke: while typing, the best match is highlighted and the text stays editable.

- **Enter** commits the highlighted row. While typing, the highlight sits on the best match, so Enter takes it even when it is a prefix match (`kilom` + Enter → kilometers). Enter on a category row or the Back row moves between levels instead. With nothing highlighted, Enter commits an exact match if the query names exactly one unit; failing that, when the box holds arithmetic, Enter replaces it with its value (`5 + 3` becomes `8`, the unit stays), one undoable step. Enter closes the list and keeps focus in the box.
- **Picking a row** with a click or tap commits it.
- **Tab and leaving the box never commit**, not even an exact match. The text stays as typed, so moving between boxes never changes anything; back in the box, the best match is highlighted again for Enter.
- Committing keeps the number and drops the query: `5 ml` becomes `5` with the mL chip. Picking a category row while a query is typed, in either box, keeps the number and drops the query.
- **The chip.** It reads like a row of the list: the unit's name, then its symbol, semibold and muted (`pints pt`); when the field needs the room it collapses to the symbol alone, in the ink color. Clicking its body lists the units of its category to change it; its × removes the unit and puts the caret back in the box. Backspace on an empty box removes the unit and lists its category's units.

## 6. Two boxes: source, scope, and anchor

- **Source.** The box a number was last typed into is the source; its value is the truth and the other box is derived from it. Only a number moves the source (an out-of-range one counts), so typing a unit name into the other box never blanks the number already there. Before any number is typed, the first box to get a unit becomes the source.
- **Scope.** A box with a unit scopes its own list to that category; an empty box takes the other box's category.
- **Switching category.** Committing a unit from another category clears the other box's unit; that box keeps its number only if it was the source. There is never a cross-category pair.
- **Anchor and category label.** The anchor is the box the conversion reads from: the source when it has a unit, otherwise the box whose unit set the category. The category name sits under it, left-aligned with its value, so the label says both what kind of units these are and which side is driving. It disappears when no unit is chosen, and names only the category (no "Switched to…" message). The category an open list is browsing is named on that list's Back row instead.
- **Swap** trades the boxes' units and texts; the typed value moves with its unit and stays the source, so nothing is re-rounded.
- **Clear all** empties both boxes and units, puts the caret in the first box, and is disabled when there is nothing to clear. It can be undone like any other step.

## 7. Conversion and display

- A conversion runs whenever both boxes have a unit and the source has a number. The derived box shows the result formatted to 10 significant digits, trailing zeros trimmed, with the locale's grouping; magnitudes from 1e15 up, or below 1e-6, switch to exponent form (`1.23456789E23`).
- **The exponent marker** in a value is semibold, so `1.5E21` reads as a number with an exponent. Only a marker inside the parsed number counts.
- **Running value.** While a box holds arithmetic and nothing else, its value follows it in the field in the muted color: `5 + 3 = 8`. The conversion uses that value as it changes.
- **Numbers fit.** A long number steps down through five type sizes until it fits on one line beside the chip, re-measured on every change and on resize, and steps back up when room returns. Past the smallest size it scrolls inside the field. Once the number is longer than six characters the chip collapses to its symbol.
- **Out of range.** When the typed number is beyond what a double holds (`1e400`), or the result is (`1e308 km` in millimeters), the derived box says "Too large to convert" in place of a value; when a nonzero value rounds to zero (`1e-320 mm` in kilometers), it says "Too small to convert". Arithmetic that divides by zero makes it say "Can’t divide by zero", and a power with no real value "No real answer". Never a bare 0. The message shrinks through three sizes and wraps to two lines only as a last resort, and the chip collapses to its symbol while it shows.
- **Copy.** Each box has a copy button whenever it holds a number; it copies the full-precision value. A successful copy swaps the icon for a check in the success color and announces "Copied". With a mouse, the check stays while the pointer rests on the button and reverts when it leaves, after at least a second; without a mouse (keyboard, touch) it reverts after two seconds. Copying the other box moves the check there.
- **Copy link.** A link icon in the header, between the shortcuts map and the theme menu, copies the address of the current conversion (§11). The address is built from the converter's state at the moment of the click, so it is current even inside the URL's write delay; with nothing entered it is the bare page address. It confirms exactly like the box copy buttons, and the status region says "Link copied". Unlike the shortcuts map it shows on every device, phones included. The button is drawn by the converter island into a slot the header reserves, so it appears after hydration without moving anything.
- **Announcements.** A polite live region says "5 milliliters is 0.1690701102 fluid ounces" once the result settles (600 ms after the last change), or "1e308 kilometers is too large to convert to millimeters". For arithmetic it names the value (`5 + 3` mL: "8 milliliters is …"), and for a division by zero it says "Can’t divide by zero".

## 8. Keyboard and calculator

| Key                                        | In a box                                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Enter                                      | Commit the highlighted row, or move between levels on a category or Back row (§5)                                 |
| ↑ ↓                                        | Move through the list. Down from nothing goes to the first unit or category; Up from nothing goes to the last row |
| Up from the first unit, Down from the last | Highlight the Back row                                                                                            |
| Esc                                        | Back one step (§9)                                                                                                |
| Backspace                                  | On an empty box with a unit: remove the unit                                                                      |
| Tab, Shift+Tab                             | Go to the other box without committing anything: first box, second box, then swap                                 |
| Ctrl/⌘+Z, Ctrl/⌘+Y, Ctrl/⌘+Shift+Z         | Undo and redo, anywhere inside the converter, replacing the field's own text undo                                 |

The chip's buttons and the copy buttons are out of the Tab order because the field's own keys do the same jobs; pointers and screen readers still reach them. The list itself is not a Tab stop. Swap follows the second box in the DOM so Tab goes box to box; the grid still draws it between them.

### The calculator

A scratch pad for working out a number, for anyone who would rather tap than type or wants to try a few sums first. Nothing in it touches the boxes until its number is sent to one, and it can be opened, used, and closed without sending anything.

- **Opening and closing.** The calculator icon at the left of the toolbar opens it below the boxes; while open, the icon is switched on (accent-soft fill, `aria-expanded`). It closes with the icon, its own close button (×, top right, beside the title "Calculator"), or Escape on an empty display, and focus then returns to the icon. Clicking elsewhere on the page leaves it open. What it holds stays while the page is open, so reopening shows the same entry.
- **It holds the keyboard.** Opening moves focus onto `=`, so typing goes straight to it: digits, `.` or `,`, `+ - * / ^`, `e` for E, `=`, and Backspace press the matching keys. Clicking any key gives the keyboard back to it if focus had moved elsewhere. Clicking into a box moves the keyboard to that box, as anywhere on a page.
- **Enter and Tab.** Tab and Shift+Tab cycle through `=`, "Use in 1st", "Use in 2nd", and close, and Enter presses whichever has focus, so the focus ring always shows what Enter will do. The other keys stay out of the Tab order. The send buttons stay in the cycle even with nothing to send; they are then dimmed and do nothing (`aria-disabled`).
- **Escape** works as in a box (§9): it takes back the latest burst of typing (keys less than 700 ms apart), one burst at a time; after `=` or `C` it clears the display; on an empty display it closes the calculator.
- **Display.** A box the size of the converter's fields, with the same type sizes, showing the entry and, for arithmetic, its running value in the muted color (`12×3 = 36`). Empty, it shows a muted 0. A long entry steps down through the sizes, then keeps its end in view.
- **No value to use.** When the entry has no value a number can hold, the display says why at its right, in the danger color, the way a box does (§7): "Too large" (a large exponent such as `9^999`, or anything past about 1.8 × 10³⁰⁸, negative numbers included, since it is their size that does not fit), "Too small" (nonzero but rounding to zero, `1E−400`), "Can’t divide by zero", or "No real answer". `=` then does nothing and the send buttons stay dimmed, until a key brings the entry back in range. The message is part of the description of `=` and of the send buttons, so a screen reader hears why.
- **Keys**, 48 px or taller, four to a row: `C ⌫ ^ ÷`, `7 8 9 ×`, `4 5 6 −`, `1 2 3 +`, `E 0 . =`. Digits are plain; `C`, `⌫`, `E`, and the decimal mark are quieter (raised surface, muted ink); the five operators are tinted; `=` is filled.
- **What they do.** Digits and the decimal mark (the locale's, `.` or `,`) add to the display, or start it over right after `=`. An operator adds to what the display shows, so a result can be carried on (`× 2`); a second operator in a row replaces the first, except `−` after `×`, `÷`, or `^`, which starts a negative number. On an empty display only `−` works. `^` raises to a power (`2^10` is 1024). `E` means times ten to the power of: `1.5E3` is 1500, `E` on its own starts `1E`, one per number, and an `E` waiting for digits takes only a sign (`1E−3`). The decimal mark is ignored when the number already has one, or is in its exponent, and starts a number as `0.`. `⌫` deletes the last character, `C` empties the display, and `=` replaces arithmetic with its value.
- **Sending.** Under the keys, "Use in 1st" and "Use in 2nd", each with that box's unit symbol once it has one, put the display's value into that box: the running value, so `=` is optional. It replaces the number there, or fills an empty box, and keeps the box's unit and any unit text typed after the number; the box becomes the source, so the other box converts from it. The button confirms with the check copy uses (§7), and the status region says "Sent to the first value". The calculator stays open, so the same number can go to the other box too. After a send, focus returns to `=`, so the next keys start on the display and Enter cannot send the same number twice.
- **One history with the boxes.** The calculator's entry is part of the converter's undo history (§9): typing in it comes in the same bursts, `=`, `C`, and each send are steps of their own, and Ctrl/⌘+Z and Ctrl/⌘+Y, or the toolbar's undo and redo, step through all of it in order. Undo after a send takes back the send, then the `=` before it, and so on. Clear all empties the boxes and leaves the calculator's entry alone.
- **Accessibility.** A group labelled by its title, "Calculator"; each key a native button named in words ("plus", "to the power of", "times ten to the power of", "decimal point", "backspace", "clear"); the send buttons named by what they show. The display is plain text at the top of the group, so a screen reader reaches it first. Keys respond only while focus is inside the calculator, so its single-key shortcuts never fire elsewhere (WCAG 2.1.4).

## 9. Undo, redo, and Escape

- **Typing comes in chunks.** Keystrokes in one box less than 700 ms apart form one chunk; a longer pause, or a space, starts a new one, so `5 ml` is "5" and then " ml". The calculator's keys chunk the same way. Each chunk, each committed or removed unit, each swap, each clear, each send, and each `=` or `C` in the calculator is one step. Undo and redo step through them all in order (up to 50), boxes and calculator alike; undoing a unit commit keeps the number and removes the unit. Loading a conversion from a URL starts a fresh history.
- **Escape is "back", one step at a time.**
  1. Inside a category: up to the categories, with that category highlighted.
  2. At the categories: close the list.
  3. List closed: take back the latest thing put into this box, one chunk of typing or the unit, newest first. Taking back a unit lists that category's units. A conversion loaded from a URL has no chunks, so Escape clears the text, then the unit.
- Each Escape step is itself a step that undo can reverse.

## 10. Header: theme menu and keyboard shortcuts map

Both are fluid shells driven by the inline script in `layouts/Base.astro`, so they work before any JavaScript bundle loads. Only one is open at a time; a click outside or Escape closes them.

- **Theme menu.** A trigger showing the current theme; the options are native radios, so arrow keys and Space work. Picking a theme applies it at once, saves it, closes the menu, and returns focus to the trigger. Without a saved choice the theme follows the system's light or dark preference.
- **Shortcuts map.** A keyboard icon, borderless like the other icon buttons. A mouse resting on it opens the map after 120 ms and it closes 200 ms after the mouse leaves; a click pins it open, and a second click, Escape, or a click outside closes it (WCAG 1.4.13: the map can be hovered, dismissed, and stays until then). Open, it grows left and down from the icon. It lists, from `src/lib/shortcuts.ts`:

  | Action                     | Keys                   |
  | -------------------------- | ---------------------- |
  | Confirm input or selection | Enter                  |
  | Move through menu          | ↑ ↓                    |
  | Back one step              | Esc                    |
  | Toggle inputs              | Tab or Shift Tab       |
  | Undo                       | Ctrl Z                 |
  | Redo                       | Ctrl Y or Ctrl Shift Z |

  Keys pressed together sit side by side; alternatives are joined by "or". Backspace on an empty box and Ctrl C work but are left out to keep the map short. It is hidden on touch-first devices and below the `sm` breakpoint.

- **Mac or Windows.** On Apple devices every Ctrl reads ⌘, in the map and in the undo and redo tooltips ("Undo (⌘Z)", "Redo (⇧⌘Z)"), from one case-insensitive check in `src/lib/platform.ts`.

## 11. URL and persistence

- The URL holds the conversion: `?a=<unit id>&b=<unit id>&v=<number>&s=<a|b>`, for example `?a=milliliter&b=us-cup&v=5&s=a`. `v` and `s` appear only when the source holds a number. It is written with `replaceState` 250 ms after the last change, and read once after the page hydrates. Unknown unit ids, and a second unit from a different category, are dropped.
- `localStorage` holds the theme choice only. The app works when storage is blocked.

## 12. Accessibility notes

- The boxes are named "First value" and "Second value"; neither is "from" or "to" because either can drive the other. Both are described by the hint.
- Each box is a WAI-ARIA combobox: focus stays in the input and `aria-activedescendant` points at the highlighted row, the Back row included (ADR 0006).
- Two live regions only: the conversion announcement (polite, debounced) and action feedback ("Copied" or "Link copied", status). The category label is plain text; the copy button keeps its name. An out-of-range message joins the derived box's description.
- Every control is at least 44 × 44 px, keyboard-operable, and visibly focused; fields and the theme menu show focus with their accent edge, buttons with the focus ring. Every theme passes the axe suite.
- A field's resting edge, and a secondary button's, has 3:1 contrast against the page and the field in every theme (WCAG 1.4.11), so a box reads as a box before anyone focuses it.

## 13. Edge cases

- Negative values are allowed for every unit, with no warning.
- A pasted value with a unit (`5 ml`) is parsed like typing; the unit commits on Enter or a pick, like any typed query.
- Typing before the page hydrates is lost (the island is server-rendered); tests wait for the `data-hydrated` mark. Fix planned (§14).

## 14. Planned

Not built yet; each item names its milestone in docs/PLAN.md §13.

**Owner's ideas, logged 2026-10-06**, all built: copy link (§7), the calculator (§8), and the wordmark at play with theme art (§1). Back highlighting the category it came from (§3) and "Toggle inputs" (§10) shipped at once. Later, maybe: on phones, the native share sheet in place of copy link, and the calculator docked to the bottom of the screen.

- **Modes (milestone 3).** `basic` (default) lists basic-tier units with a final "Show all N units" row; `advanced` lists all units. When a query matches only advanced units, show them under an "Advanced units" label without changing the mode. The mode persists. The reducer already has a `setMode` action; nothing dispatches it yet.
- **Calculator, phase 2.** `( )`, `½ ¼ ⅛`, and `′ ″` keys; the open state and the display remembered with the other preferences.
- **Persistence (milestone 3).** Mode, precision, locale override, the last conversion, up to ten recent pairs, and pinned pairs in `localStorage`.
- **Early keystrokes (milestone 3).** An inline listener records keystrokes typed before hydration and the island adopts them, the same approach as the header menus.
- **URL keeps the typed text (milestone 3).** Today `v` holds the parsed double, so eighteen typed digits come back rounded after a reload.
- **Unit notes.** A short definition for units that need one (US vs imperial gallon), shown with ambiguous rows and on the chip.
- **Reciprocal and bounded categories.** "Undefined for 0" for reciprocal units (L/100 km at 0), and a small note below absolute zero, when those categories arrive.
- **Input flexibility (principle, phased).** The box accepts what people naturally type and never punishes formatting.
  - Spacing never matters (built). Both decimal marks work (built); when an input is ambiguous, offer the other reading and show the understood number in a quiet line under the field (planned).
  - Phase 2: fractions (`1/2`, `3 1/4`), feet and inches (`5'10"`), and the connective form (`5 ml to cups`, `5 ml in cups`), where the part after the connective sets the other box's unit.
  - Phase 3, math inside the box: built for `+ − × ÷ ^ * / ( )` with Enter as equals and the running value in the field (§2, §5, §7). Still to come: `x` as times between two numbers, and a soft hint for arithmetic that cannot be read.

## 15. Open questions for the usability test

The script is docs/research/usability-test-1.md. The questions this build raises:

1. Do people press Enter or pick a row to commit the unit they typed? Anyone who tabs or clicks away expecting a commit will see nothing convert (§5).
2. Do they notice that nothing converts until both boxes have a committed unit?
3. Does Escape stepping back one chunk at a time, and removing the unit, surprise anyone? Is 700 ms the right chunk window?
4. Do people find undo, redo, and clear all, and the chip as something to click?
5. Do they read the category label under a box as "this side is driving"?
6. With `oz`, do they notice which ounce is highlighted before pressing Enter?

## 16. Change history

The converter's behavior was settled in successive rounds of the owner's feedback on 2026-10-06. Each round's observations and changes are in docs/research/findings-0-first-pass.md; each rule above is the current outcome.
