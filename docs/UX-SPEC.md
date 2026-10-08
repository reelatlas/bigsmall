# UX specification — the converter

Current behavior of the build, 2026-10-07: the milestone 2 converter, one box and its table (ADR 0012, ADR 0013). This document describes what the converter does now; anything not built yet is under **Planned** (§14). Change this document before changing behavior, in the same change. How each rule got here, pass by pass, is recorded in `docs/research/findings-0-first-pass.md`.

## 1. Layout

- **Header.** The site name and its art on the left. On the right, a keyboard icon that opens the shortcuts map (§10), the Copy URL button (§7), then the theme menu. Below the `sm` breakpoint the theme menu shows only the theme's name (the word "Theme" stays for screen readers), centered in a trigger as wide as the widest theme name, so it fits the name without changing width as themes are previewed, and it sits 8 px from the icons instead of 22 px, so the header keeps one line longer. Under 416 px of page width, too narrow for every theme's name, art, and menus on one line (a header under 384 px, its container `sm` size; Hardhat's wide name needs 353 px), the menus take a line of their own 20 px under the name, flush left: the theme menu first, then the icons, so the header reads down the left edge. The name and its art always keep their line.
- **The wordmark at play.** While a mouse is over the heading (the name and its art, not the menus), the site name turns into something else and back, like a split-flap board: each letter flips through symbols and lands, left to right. Twelve kinds of phrase, each drawn by a weight the lab tunes: "big" or "small" replaced by a unit, number, or symbol (`∞small`, `bigµm`), both replaced (`TBnm`), letters swapped for look-alikes or capitals (`bιgSmall`), opposite pairs (`giganano`, `km:mm`), analogies of size (`whale:krill`, `oak:acorn`, `Everest:anthill`), idioms of size and measure (`drop in the ocean`, `a stone’s throw`, `byte-sized`), equations (`E = mc²`, `Δx·Δp ≥ ℏ/2`), constants (`α ≈ 1/137`, `c = 299 792 458 m/s`), conversions (`−40 °C = −40 °F`), wordplay on the name (`small ⊂ big`, `∫small = big`), and text art (`▁▂▃▄▅▆▇`): over a thousand phrases, never the same twice in a row. The first change comes a quarter of a second after the pointer arrives, and at rest it then changes every 2 s; moving the pointer speeds it up at once, the faster the movement the faster it goes, down to about every 0.1 s, then eases back as the pointer slows. Each phrase takes the largest type size at which it fits the name's width, from the name's own size down to `sm`; from `base` down, a long phrase takes two lines before a smaller size ("big fish," over "small pond"), broken at a space or after a colon and never inside a grouped number. A flipping letter is never wider than the room its phrase leaves, so no frame runs past the name, and nothing is clipped, so descenders and tall symbols show whole; nothing beside the name moves. The art plays along: from its drawing it flips to a symbol or a short expression in the theme's accent (`π`, `ℏ`, `c²`) with a little under half the name's changes, landing after the name's letters, and back to its drawing with about half, so it shows a symbol about half the time. Leaving the heading lets the name and the art land back home. On a touch screen, a tap on the heading plays it for four seconds. The heading's name stays "bigsmall" for screen readers and search engines throughout; under reduced motion nothing plays. Its code (`lib/wordmark.ts`, `lib/wordmark-motion.ts`) runs only once the heading is hovered or tapped, and every setting is tuned on `/dev/wordmark-lab` (docs/DESIGN-SYSTEM.md, "Tuning labs").
- **Theme art.** A small drawing beside the site name, one per theme and drawn for bigsmall: a sun (Daylight), a full moon (Midnight), a cherry blossom (Sakura), a neon skyline (Neo-noir), a hard hat (Hardhat), and a chalkboard with chalk (Theorem), each in its theme's art colors. Decorative and hidden from screen readers; it shows at every width, phones included.
- **The converter.** One box and its table, the table being the unit list (ADR 0012); two boxes were retired on 2026-10-07 (ADR 0013). Top to bottom: the hint, the toolbar, the category menu, the box, and the table's place, all flush left in a column at most 576 px wide.
- **Hint and toolbar.** On a line of its own: "Type a number, unit, or both to compare all at once." On the next line, 8 px under it and flush left, its first icon lined up with the hint and the box: the calculator icon, a thin rule, undo, redo, a thin rule, and clear all, all ghost icon buttons. The same at every width, so the instruction and the tools read apart.
- **The category menu.** Over the box, flush left with it: a fluid shell like the theme menu, 224 px wide, its trigger reading "Category … Volume ⌄" (the word muted, the name and chevron at the right), or "Choose a category ⌄" before one is chosen. Open, it grows over the page and its choices are native radios, each with its count at the right while a unit is typed ("Weight … 2 matches"). The arrows move through them without choosing, since choosing takes the unit out and is a step to undo; Enter or a click chooses, closes the menu, and puts the caret back in the box; Escape, a click outside, or focus leaving closes it unchanged.
- **The box** is a field: a text input, the unit chip once a unit is in it (§5), and a copy button once it holds a number (§7).
- **The table's place**, under the box, always shows one of four things:
  - **The start**, before any category: the categories as tiles in a card, two across, four once the column has the room (512 px).
  - **The category's units**, once a category is chosen: a card listing every unit of the category in the listed order (§3), the box's own unit among them. The order never changes, so a row stays where the eye left it. A row reads the value to 6 significant digits on the left, then on the right the unit's symbol, its name (singular for exactly 1), and a copy button: `250 … mL milliliters`. Values are right-aligned in equal-width digits, so they line up at their last digit; symbols are right-aligned in their column and names left-aligned in theirs, so the two meet between them. On the narrowest screens a long name wraps and hyphenates. The box's own unit is marked with the accent-soft fill, the chip's color. While the box has no number, or no unit to convert from, each value is a muted em dash ("no value" to screen readers) with no copy button, so the table stays in place. A row whose value a double cannot hold says "Too large" or "Too small" in the danger color, with no copy button.
  - **The matches**, while a unit is typed after the number (§3): units from every category, without values, each its symbol then its name, both left-aligned, under a header per category with its count ("Weight 2").
  - **A message** in place of the rows when the box's value has no answer ("Too large to convert", "Can’t divide by zero").
- **Calculator.** When open, a scratch pad (§8). From the `md` breakpoint (768 px) it takes a column of its own right of the box and the table, flush right and level with the box, the box and the table narrowing to make room; below `md` it opens between the box and the table, flush left.
- **Not found.** Any unknown address shows the site's header, then "Page not found", "Address may be mistyped or the page may have moved.", and a link back to the converter.
- **Title and description.** The converter page's title is "bigsmall · unit converter", and search results and link previews describe it as "An efficient unit converter." A shared link also shows the preview card: the mark beside "bigsmall" over "efficient unit converter" (docs/DESIGN-SYSTEM.md, "Brand assets").
- Field geometry, corners, and the fluid-shell pattern are in docs/DESIGN-SYSTEM.md ("Fields", "Fluid shells").

## 2. Parsing

The box's text is parsed on every keystroke into `{ raw, value?, valueText?, query?, outOfRange?, invalid?, expression?, exponentMarks? }` (`packages/core/src/parse.ts`): a leading number or arithmetic, if any, and the rest as a unit query in its original case.

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

## 3. Listing units

**Listed order.** A category's units are listed the visitor's way (ADR 0011): their own system first (US customary for US visitors, imperial for UK visitors, metric for everyone else, from the browser's region), then the other main system, then units of neither (knots), each group smallest to largest; units of one size keep the catalog's order, most common first. So a US visitor sees in, ft, yd, mi, then mm, cm, m, km. Where size cannot order a category, because a unit has an offset (temperature) or is a reciprocal (fuel economy, later), the catalog's everyday order stands with the visitor's own everyday unit first: °F, °C, K in the US, °C, °F, K elsewhere. The table lists its rows in this order, and it never depends on the value.

**The matches.** Once typing reaches a unit (a letter or a symbol after the number: not a sign, a decimal mark, an operator, or the "e" of an exponent on its way, `1e` before `1e5`), the table's place lists the matches (§1): ranked by §4 across every category, the current category first among equal matches, hiding none, at most 20. Each category's matches stay together, in the order of their best match. A typed category name offers the category itself first in its group ("Length all its units"). The letters the query matches are set heavier, under the same folding search uses (`me` marks "**me**ters" and "kilo**me**ters"; `floz` marks all of "fl oz"); a unit found through an alias the row does not show gets no mark. With no match: "No unit matches “xyz”. Try ml, feet, or °F." Typing back to a number alone brings the units or the start back.

**Placeholder.** The box says what it takes, never a value it might be mistaken for: "Number or unit" with no unit, "Number" with one.

## 4. Matching and ranking

A query is folded for matching: case, accents, spaces, periods, and degree signs do not count, superscripts read as digits, and `µ` reads as `u` (`normalize.ts`). It is matched against each unit's symbol, name, plural, and aliases, and against each category's name and aliases.

Match classes, strongest first:

1. Exact symbol, case-sensitive (`mL`)
2. Exact symbol, name, plural, or alias, case-insensitive (`ml`, `kilos`, `centigrade`)
3. Prefix of a name, plural, or alias (`kilo…`)
4. Prefix of a symbol
5. Substring of a name, plural, or alias
6. One typo away, for units only, only when nothing above matched and the query has at least three characters

**Category rows** appear only when the query starts the category's name (`vol` → Volume) or equals one of its everyday aliases exactly (`fluids`, `temp`, `how heavy`). Aliases never match by prefix or substring, and categories are never fuzzy-matched.

**Order.** Stronger class first. Within a class, categories before units; then the current category's results first; among units, the preferred unit family first (US visitors see US units first, UK visitors imperial, everyone else metric, from the browser's region), then basic before advanced, then display order.

## 5. The box and its unit

Nothing is chosen on a keystroke, and a unit is never chosen for you, on load or otherwise.

- **Choosing a category** (the menu, a tile, or a category match) keeps the typed number, drops a typed query, and lists the category's units with none chosen: the values are dashes until a unit is picked, so a typed number means that number in the unit picked (250, then Volume, then cups, gives 250 cups, not 250 teaspoons converted). Nothing is highlighted for you either: the caret waits in the box, and ↓ or Enter moves the cursor into the units (§8). Choosing the category the box is already in keeps its unit, the cursor resting on it.
- **Taking a unit into the box.** A click or tap on a row, or Enter on it, takes its unit into the box: with its value to the 10 digits a box shows, as if it had been typed, while the table has values; with the number as typed while the rows are dashes. A match is taken the same way, with the number as typed, its category following: `5 ml` and Enter is 5 with the mL chip. One undoable step, after which every row converts from it and the cursor rests on its row. The row of the unit in the box, and a row with a message, do nothing. Focus stays in the box.
- **A typed unit is only taken by Enter or a click.** Tab and leaving the box never take it: the text stays as typed, and back in the box Enter takes the best match.
- **The chip** reads like a row: the unit's symbol, semibold and muted, then its name (`pt pints`); when the box needs the room it gives up its name, leaving the symbol alone in the ink color. That is measured in the box itself, before the value steps down a size (§7), so a wide box keeps the name beside a longer number than a phone's. It is a readout: clicking its body puts the caret in the box and opens nothing, the table being the list. Its × takes the unit out and keeps the category, the table staying with dashes; so does Backspace in an empty box.

## 6. The category

- **The category** the table lists is the box's unit's, or the one chosen before any unit (§5); the category menu names it (§1). Taking a match from another category switches to that category.
- **Taking the unit out keeps the category,** so its table stays in place, with dashes. Escape's fourth step (§9) and clear all empty it, back to the start.
- **Clear all** empties the box, its unit, and its category, back to the start, puts the caret in the box, and is disabled when there is nothing to clear. It can be undone like any other step.

## 7. Conversion and display

- **The table converts** whenever the box holds a number and a unit: every row shows the value in its unit to 6 significant digits. A value moved into the box comes at 10 significant digits, trailing zeros trimmed, with the locale's grouping; magnitudes from 1e15 up, or below 1e-6, switch to exponent form (`1.23456789E23`).
- **The exponent marker** in a value is semibold, so `1.5E21` reads as a number with an exponent. Only a marker inside the parsed number counts.
- **Running value.** While the box holds arithmetic and nothing else, its value follows it in the field in the muted color: `5 + 3 = 8`. The table converts from that value as it changes.
- **Numbers fit.** A long number steps down through five type sizes until it fits on one line beside the chip, re-measured on every change and on resize, and steps back up when room returns. Past the smallest size it scrolls inside the field. Before it steps down at all, the chip gives up its name, if that makes the room (§5).
- **Out of range.** When the typed number is beyond what a double holds (`1e400`), the table says "Too large to convert" in place of its rows; nonzero digits that round to zero say "Too small to convert", arithmetic that divides by zero "Can’t divide by zero", and a power with no real value "No real answer". A row whose own value overflows or rounds to zero says "Too large" or "Too small". Never a bare 0.
- **Copy.** The box has a copy button whenever it holds a number, and each row with a value has one; both copy the full-precision value, not the 6 digits a row shows. A successful copy swaps the icon for a check in the success color and announces "Copied". With a mouse, the check stays while the pointer rests on the button and reverts when it leaves, after at least a second; without a mouse (keyboard, touch) it reverts after two seconds. Copying elsewhere moves the check there.
- **Copy URL.** A link icon in the header, between the shortcuts map and the theme menu, named "Copy URL" (its label and tooltip), copies the URL of the current conversion (§11). The URL is built from the converter's state at the moment of the click, so it is current even inside the address bar's write delay; with nothing entered it is the bare page address. It confirms exactly like the copy buttons, and the status region says "URL copied". Unlike the shortcuts map it shows on every device, phones included. The button is drawn by the converter island into a slot the header reserves, so it appears after hydration without moving anything.
- **Announcements.** A polite live region says how many units the value is shown in once the table settles (600 ms after the last change): "250 milliliters in 9 units of volume", arithmetic named by its value ("8 milliliters in …"); with dashes, how many units are listed ("9 units of volume"); while a unit is typed, how many matches there are ("5 matches", "No unit matches"); and when there is no answer, "1e400 kilometers is too large to convert", or "Can’t divide by zero".

## 8. Keyboard and calculator

The caret stays in the box while a cursor moves through whatever the table's place shows (§1): the tiles, the rows, or the matches. The box points at it (`aria-activedescendant`), and it is drawn in the muted tint of a hovered row, never an outline; the unit in the box keeps its accent fill. Right after Enter, a click, or typing, the cursor rests on the unit in the box, so the arrows move on from its row.

| Key                                | In the box                                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ↑ ↓                                | Round a loop: the category menu, the box, every row, and back to the menu. From the unit in the box while the cursor rests on it, else from the box: ↓ to the first row, ↑ to the menu. On the menu's trigger, ↑ goes to the last row and ↓ to the box; open, they move through its choices                             |
| ← →                                | Across the start's tiles, once the cursor is in them; anywhere else they move the caret                                                                                                                                                                                                                                 |
| Enter                              | On a row, a match, or a tile, take it (§5). Otherwise: a typed unit takes its best match; arithmetic becomes its value (`5 + 3` becomes `8`, the unit staying), one undoable step; with a unit, the cursor comes back to rest on it; without one, the cursor goes into the table's place, onto its first tile or unit   |
| Esc                                | Back one step (§9), also with nothing on the page focused                                                                                                                                                                                                                                                               |
| Backspace                          | In an empty box with a unit: take the unit out, as the chip's × does                                                                                                                                                                                                                                                    |
| Ctrl/⌘+C                           | With the cursor on a row, copy the row's full-precision value; otherwise the box's own copy                                                                                                                                                                                                                             |
| Ctrl/⌘+Z, Ctrl/⌘+Y, Ctrl/⌘+Shift+Z | Undo and redo, anywhere inside the converter, replacing the field's own text undo                                                                                                                                                                                                                                       |
| Typing                             | From the menu, the chip, or a copy button, any character or Backspace lands in the box; from anywhere when nothing on the page has focus, a letter, a digit, `-`, `.`, or `,` does. Always after what is there: 554, then 67, reads 55467. Never with focus in another control, never with Ctrl, ⌘, or Alt, never Space |

The toolbar comes first in the Tab order, then the menu's trigger, then the box, then the calculator while it is open: the rows, the tiles, and the matches are no Tab stops, and the chip's buttons and the copy buttons are out of the Tab order because the box's own keys do the same jobs; pointers and screen readers still reach them. The open calculator keeps its own keys. Typing from anywhere follows the WAI-ARIA combobox guidance (printable keys in the list go to the text field); with nothing focused it is a single-key shortcut by WCAG 2.1.4's reading, kept because it only types into the box and no other single-key shortcut exists (ADR 0012). Escape from the page is no character key, so WCAG 2.1.4 does not reach it.

### The calculator

A scratch pad for working out a number, for anyone who would rather tap than type or wants to try a few sums first. Nothing in it touches the box until its number is sent, and it can be opened, used, and closed without sending anything.

- **Opening and closing.** The calculator icon at the left of the toolbar opens it, between the box and the table or beside them (§1); while open, the icon is switched on (accent-soft fill, `aria-expanded`). It closes with the icon, its own close button (×, top right, beside the title "Calculator"), or Escape on an empty display, and focus then returns to the icon. Clicking elsewhere on the page leaves it open. What it holds stays while the page is open, so reopening shows the same entry.
- **It holds the keyboard.** Opening moves focus onto `=`, so typing goes straight to it: digits, `.` or `,`, `+ - * / ^`, `e` for E, `=`, and Backspace press the matching keys. Clicking any key gives the keyboard back to it if focus had moved elsewhere. Clicking into the box moves the keyboard to the box, as anywhere on a page.
- **Enter and Tab.** Tab and Shift+Tab cycle through `=`, "Use", and close, and Enter presses whichever has focus, so the focus ring always shows what Enter will do. The other keys stay out of the Tab order. "Use" stays in the cycle even with nothing to send; it is then dimmed and does nothing (`aria-disabled`).
- **Escape** takes back the latest burst of typing (keys less than 700 ms apart), one burst at a time; after `=` or `C` it clears the display; on an empty display it closes the calculator.
- **Display.** A box the size of the converter's field, with the same type sizes, showing the entry and, for arithmetic, its running value in the muted color (`12×3 = 36`). Empty, it shows a muted 0. A long entry steps down through the sizes, then keeps its end in view.
- **No value to use.** When the entry has no value a number can hold, the display says why at its right, in the danger color: "Too large" (a large exponent such as `9^999`, or anything past about 1.8 × 10³⁰⁸, negative numbers included, since it is their size that does not fit), "Too small" (nonzero but rounding to zero, `1E−400`), "Can’t divide by zero", or "No real answer". `=` then does nothing and "Use" stays dimmed, until a key brings the entry back in range. The message is part of the description of `=` and of "Use", so a screen reader hears why.
- **Keys**, 48 px or taller, four to a row: `C ⌫ ^ ÷`, `7 8 9 ×`, `4 5 6 −`, `1 2 3 +`, `E 0 . =`. Digits are plain; `C`, `⌫`, `E`, and the decimal mark are quieter (raised surface, muted ink); the five operators are tinted; `=` is filled.
- **What they do.** Digits and the decimal mark (the locale's, `.` or `,`) add to the display, or start it over right after `=`. An operator adds to what the display shows, so a result can be carried on (`× 2`); a second operator in a row replaces the first, except `−` after `×`, `÷`, or `^`, which starts a negative number. On an empty display only `−` works. `^` raises to a power (`2^10` is 1024). `E` means times ten to the power of: `1.5E3` is 1500, `E` on its own starts `1E`, one per number, and an `E` waiting for digits takes only a sign (`1E−3`). The decimal mark is ignored when the number already has one, or is in its exponent, and starts a number as `0.`. `⌫` deletes the last character, `C` empties the display, and `=` replaces arithmetic with its value.
- **Sending.** Under the keys, "Use", with the box's unit symbol once it has one ("Use mL"), puts the display's value into the box: the running value, so `=` is optional. It replaces the number there, or fills an empty box, and keeps the box's unit and any unit text typed after the number. The button confirms with the check copy uses (§7), and the status region says "Sent to the value". The calculator stays open. After a send, focus returns to `=`, so the next keys start on the display and Enter cannot send the same number twice.
- **One history with the box.** The calculator's entry is part of the converter's undo history (§9): typing in it comes in the same bursts, `=`, `C`, and each send are steps of their own, and Ctrl/⌘+Z and Ctrl/⌘+Y, or the toolbar's undo and redo, step through all of it in order. Undo after a send takes back the send, then the `=` before it, and so on. Clear all empties the box and leaves the calculator's entry alone.
- **Accessibility.** A group labelled by its title, "Calculator"; each key a native button named in words ("plus", "to the power of", "times ten to the power of", "decimal point", or "decimal comma" where the comma is the mark, "backspace", "clear"); "Use" named by what it shows. The display is plain text at the top of the group, so a screen reader reaches it first. Keys respond only while focus is inside the calculator, so its single-key shortcuts never fire elsewhere (WCAG 2.1.4).

## 9. Undo, redo, and Escape

- **Typing comes in chunks.** Keystrokes in the box less than 700 ms apart form one chunk; a longer pause, or a space, starts a new one, so `5 ml` is "5" and then " ml". The calculator's keys chunk the same way. Each chunk, each unit taken in or out, each chosen category, each clear, each send, and each `=` or `C` in the calculator is one step. Undo and redo step through them all in order (up to 50), box and calculator alike. Loading a conversion from a URL starts a fresh history.
- **Escape steps back a ladder**, one step a press:
  1. back from browsing the table, the cursor resting again (only after the arrows moved it: right after Enter or a click it already rests, so this step is skipped);
  2. a typed unit, back to the number;
  3. the number;
  4. the unit and the category, back to the start, as clear all does;
  5. it lets go of focus, leaving the page.

  Escape on the chip or a copy button brings the caret back to the box; on the menu's trigger it lets go of focus.

  With nothing on the page focused, Escape takes the clearing steps, 2 to 4, one a press, without taking focus: so with something typed, a unit, or a category on screen, Escape from anywhere clears it back to the start. The cursor shows only while focus is in the converter, so step 1 never waits there. An Escape that closes a header menu does only that.

- Each Escape step that changes the conversion is itself a step that undo can reverse.

## 10. Header: theme menu and keyboard shortcuts map

The theme menu and the shortcuts map are fluid shells driven by the inline script in `layouts/Base.astro`, so they work before any JavaScript bundle loads. Only one is open at a time; a click outside, Escape, or focus leaving closes them.

- **Theme menu.** A trigger showing the current theme; the options are native radios, so arrow keys and Space work. Picking a theme applies it at once, saves it, closes the menu, and returns focus to the trigger. The arrow keys apply and save each theme they reach and leave the menu open, so themes can be compared; Enter or Escape closes it on the theme reached. Without a saved choice the theme follows the system's light or dark preference.
- **Shortcuts map.** A keyboard icon, borderless like the other icon buttons. A mouse resting on it opens the map after 120 ms and it closes 200 ms after the mouse leaves; a click pins it open, and a second click, Escape, or a click outside closes it (WCAG 1.4.13: the map can be hovered, dismissed, and stays until then). Open, it grows left and down from the icon. It lists, from `src/lib/shortcuts.ts`:

  | Action                     | Keys                   |
  | -------------------------- | ---------------------- |
  | Confirm input or selection | Enter                  |
  | Move through menu          | ↑ ↓                    |
  | Back one step              | Esc                    |
  | Toggle inputs              | Tab or Shift Tab       |
  | Undo                       | Ctrl Z                 |
  | Redo                       | Ctrl Y or Ctrl Shift Z |

  Keys pressed together sit side by side; alternatives are joined by "or". Backspace on an empty box and Ctrl C work but are left out to keep the map short. It is hidden on touch-first devices and below the `sm` breakpoint. Sean is rewriting its entries for the one box (§14); "Toggle inputs" described the two boxes.

- **Mac or Windows.** On Apple devices every Ctrl reads ⌘, in the map and in the undo and redo tooltips ("Undo (⌘Z)", "Redo (⇧⌘Z)"), from one case-insensitive check in `src/lib/platform.ts`.

## 11. URL and persistence

- The URL holds the conversion: `?a=<unit id>&v=<number>`, for example `?a=milliliter&v=5`. `v` appears only when the box holds a number. It is written with `replaceState` 250 ms after the last change, and read once after the page hydrates. An unknown unit id is dropped. A link from the two-box converter, which may also carry `b` (the second box's unit) and `s` (which box held the number), opens on the box that held the number, and is then rewritten in this form (ADR 0013). A category chosen with no unit is not in the URL yet (§14).
- `localStorage` holds the theme choice only (and, on `/dev/wordmark-lab`, the lab's settings). The app works when storage is blocked.

## 12. Accessibility notes

- The box is named "Value" and described by the hint.
- The box is a WAI-ARIA combobox (ADR 0006, ADR 0012): focus stays in the input, its popup is what the table's place shows, and it points at what the cursor is on only while it is there. The units are a grid (`aria-haspopup="grid"`) inside a region named by the category: each row holds the unit's cell, named by what it shows ("0.25 L liters") and described as moving the unit into the box, and a cell with its copy button, so no control sits inside another. The row the cursor is on is `aria-selected`; the unit in the box adds ", in the box"; a dash reads "no value"; a row with a message is `aria-disabled`. The matches are a listbox of groups, each named by its category, each match saying its category too; the start is a listbox of the categories. The category menu's trigger names it ("Choose a category", "Category Volume"), and its choices are a radio group named "Category".
- Two live regions only: the table's announcement (polite, debounced) and action feedback ("Copied", "URL copied", "Sent to the value", status). The copy buttons keep their names.
- Every control is at least 44 × 44 px, keyboard-operable, and visibly focused; the box and the theme and category menus show focus with their accent edge, buttons with the focus ring. Every theme passes the axe suite.
- The box's resting edge, and a secondary button's, has 3:1 contrast against the page and the field in every theme (WCAG 1.4.11), so the box reads as a box before anyone focuses it.

## 13. Edge cases

- Negative values are allowed for every unit, with no warning.
- A pasted value with a unit (`5 ml`) is parsed like typing; the unit is taken on Enter or a click, like any typed query.
- Typing before the page hydrates is lost (the island is server-rendered); tests wait for the `data-hydrated` mark. Fix planned (§14).

## 14. Planned

Not built yet; each item names its milestone in docs/PLAN.md §13.

**Owner's ideas, logged 2026-10-06**, all built: copy link (§7, now named Copy URL), the calculator (§8), and the wordmark at play with theme art (§1). Later, maybe: on phones, the native share sheet in place of Copy URL, and the calculator docked to the bottom of the screen.

- **The shortcuts map's entries (Sean, next, after other issues).** Rewritten for the one box: "Toggle inputs" described the two boxes; the arrows now move through the table, and typing works from anywhere. Until then the map lists the entries in §10.
- **Table selection, option A**, decided 2026-10-07 in the selection lab and built the same day (ADR 0012; §1, §5, §8, §9, §12; docs/research/table-selection.md). Still open, for Sean once he has used it: an all-clear control (in the toolbar or inline), and whether a category chosen with no unit belongs in the URL.
- **One layout**, decided 2026-10-07 (ADR 0013): two boxes and the layout switch retired, the table the converter. Their last version, consistent with the table, is in git at commit `f4563f2`; bringing them back starts from reverting the retirement.
- **Modes (milestone 3).** `basic` (default) lists basic-tier units with a final "Show all N units" row in the table; `advanced` lists all units. When a query matches only advanced units, show them under an "Advanced units" label without changing the mode. The mode persists. The reducer already has a `setMode` action; nothing dispatches it yet.
- **Calculator, phase 2.** `( )`, `½ ¼ ⅛`, and `′ ″` keys; the open state and the display remembered with the other preferences.
- **Persistence (milestone 3).** Mode, precision, locale override, the last conversion, up to ten recent conversions, and pinned units in `localStorage`.
- **Early keystrokes (milestone 3).** An inline listener records keystrokes typed before hydration and the island adopts them, the same approach as the header menus.
- **URL keeps the typed text (milestone 3).** Today `v` holds the parsed double, so eighteen typed digits come back rounded after a reload.
- **Unit notes.** A short definition for units that need one (US vs imperial gallon), shown with ambiguous rows and on the chip.
- **Reciprocal and bounded categories.** "Undefined for 0" for reciprocal units (L/100 km at 0), and a small note below absolute zero, when those categories arrive.
- **Input flexibility (principle, phased).** The box accepts what people naturally type and never punishes formatting.
  - Spacing never matters (built). Both decimal marks work (built); when an input is ambiguous, offer the other reading and show the understood number in a quiet line under the field (planned).
  - Phase 2: mixed fractions (`3 1/4`; `1/2` already reads as a division, §2), feet and inches (`5'10"`), and the connective form (`5 ml to cups`, `5 ml in cups`), where the part after the connective names the unit to read.
  - Phase 3, math inside the box: built for `+ − × ÷ ^ * / ( )` with Enter as equals and the running value in the field (§2, §7, §8). Still to come: `x` as times between two numbers, and a soft hint for arithmetic that cannot be read.

## 15. Open questions for the usability test

The script is docs/research/usability-test-1.md (it needs this build's model before it runs). The questions this build raises:

1. Do people press Enter or click a match to take the unit they typed? Anyone who tabs or clicks away expecting it to be taken will see dashes (§5).
2. Do they start from the category tiles, the menu, or by typing? After choosing a category, do the dashes read as "pick a unit", and does a typed number then landing in the unit picked (250 cups, not 250 teaspoons converted) match what they expect?
3. Do they find that tapping a row takes it into the box, and expect it to?
4. Does Escape read as stepping back, one thing at a time? Does typing that lands in the box from elsewhere on the page surprise anyone?
5. Do people find undo, redo, and clear all, and the chip's ×?
6. With `oz`, do they notice which ounce they take from the matches, grouped by category?

## 16. Change history

The converter's behavior was settled in successive rounds of the owner's feedback from 2026-10-06. Each round's observations and changes are in docs/research/findings-0-first-pass.md; each rule above is the current outcome.
