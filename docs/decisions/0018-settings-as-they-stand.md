# 0018 — Settings as they stand: Units and Display, the visitor's own set and order, remembered

Date: 2026-10-15
Status: accepted; supersedes 0017, and with it amends 0011 and 0016

## Context

ADR 0017 (2026-10-11) set the settings model: sections by system under fixed names, two layers deciding what shows, Display's formats, and settings kept apart from the conversion. Over the next days Sean's rounds amended it many times in place: two side panels for one Settings panel; Units' presets, Custom, and the visitor's own order; Other a switch; Display's defaults and labels; copy leaving Display; and every setting remembered in this browser. The full tidy (2026-10-15) found that a reader had to replay a day of amendments to learn what holds, and Sean agreed that a decision is upgraded when the process teaches better. This record states the settings as they stand; 0017 stays as the history of how they got here.

## Decision

- **Two side panels, Units and Display**, opened by their buttons in the toolbar after the category menu and the calculator (Alt+V and Alt+B), one side panel open at a time with the calculator. Not modal: every choice takes effect at once beside the results it changes, and the box and the table stay in reach.
- **Sections by system, under fixed names**, the same in every category: Metric, US (customary), UK (imperial), Other (everyday units no region owns, the knot and the atmosphere), and Specialty (the specialist units of every system). A category with no regional system (time, data, angle) heads its everyday units Standard, which always shows and has no switch. Only headings take the parentheses. Within a section, units run smallest to largest (ADR 0011).
- **The visitor orders the systems.** A fresh visit puts their own system first (ADR 0011); in Units each system's row has a handle to drag, or to press for Move up and Move down, and Alt+↑ ↓ moves a row from the keys. The table's sections follow in every category; Reset order brings a fresh visit's back.
- **Two layers decide what shows.** The system switches set every category, through presets: All, Standard (every system but Specialty), Your region (the visitor's own system and Other), and Custom, the visitor's own set. Any change by hand puts the visitor on Custom, which stays lit until a preset is picked; a preset sets exactly its set and keeps the custom one aside, and Custom brings it back. Custom is never out of reach. A unit shown or hidden on its own in a table (Edit, the Hidden list, or a hidden unit taken from search) is an exception to its switch, kept when another system's switch changes; its own switch changing is final for it, a preset clears every exception, and Show custom hidden units clears the hidden ones. A system's checkbox shows a dash while some of its units are chosen on their own. The unit in the box always shows.
- **The table's foot and search.** Hidden at the table's foot lists the hidden units under their sections, to bring back; Edit lists the shown ones, to hide. Search leaves hidden units out, and a line under the matches offers them, listing them under it once shown (docs/UX-SPEC.md §3).
- **Display** writes the values, through core (`formatPlaces`, `formatFraction`, ADR 0003): Symbol only or Symbol and name; Decimals, Fractions, or Both, the decimal then its fraction; Rounding, nearest, up (toward larger values), or down (toward smaller, below zero too); Round to, 0.1, 0.01, 0.001, or No limit for decimals, which keep their trailing zeros to the place, and for fractions the sizes chosen, 1/2 to 1/64, each on or off, each value in the smallest size chosen that writes it. A value that rounds to zero at the place chosen reads "< 0.01"; past a million a fraction is its whole number.
- **Copy is no setting.** One copy button shows, on the active row, and copies what the row shows; Ctrl/⌘+C copies it from the keys (docs/UX-SPEC.md §7).
- **A fresh visit's settings**: Standard, Symbol and name, decimals to 0.01, rounded to the nearest; fractions, once chosen, start in halves, quarters, and eighths. Every unit is in the table (ADR 0016), the specialist ones waiting under Hidden, one tap away.
- **The table holds still**: every column is as wide as the widest it could hold across the category's units and every rounding, so nothing moves as presets, switches, Hidden, or rounding change what shows; values line up on the decimal point.
- **Remembered in this browser, apart from the conversion.** Every setting is kept in `localStorage` (`bigsmall:settings`, versioned), Display by what was changed, so a default changed later reaches anyone who never chose otherwise; each part is read back on its own, falling back to a fresh visit's where it does not read. Settings never enter the URL or the undo history; with storage blocked they last for the visit.

## Alternatives considered

- One Settings button opening one panel with both parts (0017's first form): two side panels put each part beside the results it changes, one at a time with the calculator.
- Settings fresh each visit (decided 2026-10-08): a set of one's own should last (Sean, 2026-10-15).
- Storing every setting whole: a default changed later would never reach a browser that had saved anything.
- A Copy buttons switch in Display: copying is an action, not a way of writing values. Copying on a click: a click already takes the unit, so every pick would replace the clipboard unseen.
- A reset for the switches: the Standard preset is that reset.
- "Region" for "Your region", to fit a 288 px column: the side column widened to 320 px instead.
- Basic and advanced modes, or a "Show all": retired by ADR 0016; the switches and Hidden replace them without a second table.
- Jobs (Cooking, Cubic, Trade) as filters: written per category and named differently in each, in the way of one setting for every category.
- Single units chosen in Settings, under each system: Sean chose the table, where the units are.
- A switch that leaves its system's single units as set: a switch is final for its units, or it does not do what it says.
- A dot on a settings icon for a changed setting: it would stay lit for good; the resets say what can be undone.
- "Most common" 32nds and 64ths: the table writes one value per row, so a common set would hide nothing and only round some values further than asked.
- Settings in the undo history: settings are preferences, not the conversion; undoing a typed number should not undo a format.

## Consequences

- The model is `features/converter/settings.ts`, remembered by `settings-store.ts`, shown by `SettingsPanels.tsx` and `SystemRows.tsx` in `SidePanel`, with `SegmentedControl` for the presets and formats.
- Browser tests about something else set the table as it was before Settings (`showEverything`, `e2e/support.ts`).
- Current docs and code cite this record for settings; 0017's text stays as written, its status pointing here.
- Still explorations (docs/PLAN.md §2): templates of settings, a setting surfaced on its own in the toolbar, and choosing the sort.
