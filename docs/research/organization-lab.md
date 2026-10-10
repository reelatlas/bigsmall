# Settings lab: what shows and how it looks (2026-10-10)

Sean's model, in the context of the action bar (2026-10-10): one Settings button shapes the results, and the table holds what is specific to them. `/dev/organization-lab` (the settings lab, `apps/web/src/pages/dev/_organization-lab/`) builds it with single units chosen in the table (Separate) and Settings' choices drawn as segmented controls, both Sean's choices: the action bar (the category menu, the calculator, and Settings, then undo, redo, and clear all at the right), the box, and the table or the matches. Nothing is built in the converter yet.

The earlier prototypes, the table controls lab (A to D), this lab's first two rounds (jobs, by system, six filters, and options E to I), variant 2, Together (single units chosen in Settings, under each system), and the compact pills Settings was also drawn in, are retired; they are in git. What they settled is below.

## Settled along the way

- **Sections by system, under fixed names**: Metric, US (customary), UK (imperial), Other, Specialist, the same in every category, every section headed, the visitor's own first (Sean, 2026-10-10). Only headings take the parentheses; units keep their names and symbols ("imperial gallon" is the standard name, and "gal (UK)" tells the gallons apart when names drop on a phone). A category with no regional system (time, data, angle) heads its everyday units Everyday.
- **Other has no switch** while it holds two units, the knot and the atmosphere, which always show (Sean, 2026-10-10).
- **One setting for every category**: a system switch means the same thing everywhere.
- **Jobs (Cooking, Cubic, Trade) were set aside**: written per category, named differently in each, and in the way of one filter for every category.
- **Separate** (Sean, 2026-10-10): Settings applies to every category; the table applies to this one (Edit, the Hidden section).
- **Display reaches search and the box**: with Symbol only, the matches show symbols alone and the box's chip its symbol alone, the names kept for screen readers; with copy buttons on, the box has its copy button too, off, none (Sean, 2026-10-10). Everything the converter surfaces follows Display.
- **A fresh visit** (Sean, 2026-10-10): every system but Specialist (the Everyday preset), Symbol only (listed first), no copy buttons, decimals to 0.01, rounded to the nearest; fractions, once chosen, start in eighths (1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8).
- **No copy column without copy buttons**: the rows run to the card's edge. The checkboxes of Edit and the Hidden section lead a row, on the left under their heading's, so no column at the right edge is kept for them either.
- **Nothing moves as what shows changes** (Sean, 2026-10-10): every column of the table is as wide as the widest it could hold across all of the category's units, shown or hidden (a sizer row no one sees, as the menus have), so a preset, a switch, a unit hidden, or Hidden opening never shifts the values, symbols, or names. Only Edit, a mode of its own, adds its checkboxes.
- **The Hidden list names its units, without values**: it is for bringing them back, a checkbox, the symbol, and the name where names show, under their section names, and needs none of the table's columns.
- **Standard, not Everyday** (Sean, 2026-10-10): the presets read All units, Standard, Your region, and a category with no regional system heads its units Standard, so Standard and Specialist read as the pair they are.
- **Segmented controls and the switch** (Sean, 2026-10-10): Settings' choices are segmented controls, the copy buttons a switch; both are components now (`SegmentedControl`, `Switch`; docs/DESIGN-SYSTEM.md, "Settings").
- **The action bar** (Sean, 2026-10-10): the category menu, the calculator, and Settings lead, no dividers between them; undo, redo, and clear all keep the right end. On a phone the leading three wrap to the line over the box. The panel opens under Settings, from the left, and on a phone spans the action bar, so it never runs past a 320 px screen.
- **Both**: a third Format choice writes the fraction and its decimal after it in the muted ink, each rounded its own way (Round fractions to, Round decimals to); on a narrow screen the names give way first, then the decimal.
- **Done closes Hidden**: whoever just chose what to hide should not have to fold it again.
- **No dot on Settings**: a dot for "changed" would sit there for good once anything is set. The two resets say what can be undone instead.
- **Two layers, two resets** (Sean, 2026-10-10): the system switches are one layer, for every category; a unit hidden or shown on its own in a table is another, which the switches, the presets, and Reset settings leave. Reset settings puts the switches and Display back as a fresh visit has them; Unhide units brings back every unit hidden on its own, in every category, and leaves the settings.
- **Taking a hidden unit unhides it** (Sean, 2026-10-10): one taken from the hidden matches into the box leaves Hidden, as if checked there, so clearing the box never hides it again.
- **Rounding below zero**: up is toward larger values and down toward smaller, as ceiling and floor are (IEEE 754, and the reading Sean expected): −2.15 rounds up to −2.1 and down to −2.2. Spreadsheets' ROUNDUP, which rounds away from zero, is the exception, not the rule.
- **Fractions apply to every unit** when chosen, metric included.
- **Fractions in the sizes chosen, each on or off by itself** (Sean, 2026-10-10): 1/2, 1/3, 1/4, 1/8, 1/16, 1/32, 1/64. Each writes its whole grid: whoever reads sixteenths needs the rare ones too, a mismeasurement included (5/64 is among them). A fraction is written in the smallest size chosen that writes it exactly, so what is chosen is what shows: 1/4 alone writes a half as 2/4, with 1/2 as well as 1/2; sixteenths alone write 8/16, with the coarser sizes chosen too their lowest terms. No size locks another (an earlier round locked the coarser sizes a finer one held, which left people unsure what they could uncheck). Thirds mix with the rest (1/4, 1/3, 1/2, 2/3, 3/4 for cups). Trades were set aside as a rule of thumb, not a standard.
- **No "most common" 32nds and 64ths** (proposed 2026-10-10, for Sean to confirm): a reference chart lists every 64th, where dropping the rarely used ones trims rows. The table lists none: each row writes one value, rounded to the sizes chosen, so a "common" set would hide nothing and only round some values further than asked (0.078 in would read ≈ 1/16 under 64ths, never 5/64), with no standard behind which 64ths are common. The hardware sizes behind them (screw pilot holes, tap drills) are a lookup, the nearest standard drill to a size, which a later feature could answer with cited sizes.
- **Lowest terms by choosing the sizes**: with the default (halves, quarters, eighths) a value reads 3/8, never 6/16, as drill bits, tapes, and charts mark them; whoever wants 4/64 unchecks the coarser sizes.

## The model

### Settings, in the action bar

A sliders button at the start of the tools opens one panel, anchored to the action bar's right edge, with two parts and two resets.

**Units**, under one line (Sean, 2026-10-10: one sentence for the section, no labels over its two groups; the groups keep names for screen readers): "What search and the table show in every category. Units you hide or show in a table stay as you set them."

- All units, Everyday, or Your region (presets; none is lit when the switches are a custom set).
- Metric, US (customary), UK (imperial), Specialist, a checkbox each.

**Display**, how results look:

- Symbol only, or Symbol and name (no label: the choices say it).
- Copy buttons, a switch leading its label, as a checkbox does (a copy still copies the full value).
- Format: Decimals, Fractions, or Both.
- Round to: for decimals 0.1, 0.01, 0.001, or No limit (today's six significant digits); for fractions the sizes chosen, each on or off, in two strips, each smallest to largest (1/8, 1/4, 1/3, 1/2, the everyday ones, on top; then 1/64, 1/32, 1/16), with a line under them that says what they write ("Shows 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8"); with none chosen, values keep their decimals. With Both, the two read Round decimals to and Round fractions to, decimals first as Format lists them. Fractions are written as mixed numbers, "≈" where they round, a tie going up.
- Rounding: Nearest, Up, or Down (off with No limit).
- A value too small for the places or the step, which would read 0, keeps its significant digits; one past a million keeps decimals.

**Resets**: Reset settings (the switches and Display; the units hidden in a table stay) and Unhide units, with their count (every unit hidden on its own; the settings stay). Each is off while it has nothing to do, and neither closes the panel, so what it changed is there to see (Sean, 2026-10-10).

The panel closes on Escape, a press outside it, or focus moving outside it, never on focus merely lost (a reset turning itself off, the fraction steps leaving with Reset settings).

### What shows: two layers

The system switches set every category. A unit chosen on its own in a table is an exception, shown or hidden against its switch, recorded only where it differs from the switch when chosen, and kept when the category or the switches change. The unit in the box always shows.

### Choosing single units: in the table

The table's foot has Edit, which puts a checkbox on every row and a three-state one on every heading (all, some as a dash, none); Done ends it.

### Hidden units

- **In the table**: a Hidden line at the foot counts them ("Hidden 5"); open, it lists them under their section names, values dimmed, a checkbox on each and a three-state one on each heading, so one or a section comes back with a tap.
- **In search**: hidden units leave the matches. When one matches, a line says so ("2 hidden units also match", or "Only hidden units match"), and Show them lists them under Hidden with their category and section ("Volume · Specialist"). Taking one puts it in the box and unhides it. Nothing typed ever meets a bare "No unit matches" while a hidden unit matches.

## Questions this round puts to Sean

1. **Specialist or Specialty**: the switch and the heading read Specialist; with Standard beside it, would Specialty read better?
2. **No "most common" 32nds and 64ths** (settled above as proposed): agreed, or try a common set anyway?
3. **Edit's checkboxes** widen the value column while Edit is on, a mode of its own; keep, or hold the column for them too?
4. **One button or several**: one Settings button for everything (the lab), or one or two of the most used surfaced on their own once we know which?
5. **Both's order in the table**: Settings now lists decimals first; the table writes the fraction first and its decimal after, in the muted ink, as charts of fractions do. Keep, or the decimal first there too?
6. **The decimal places' order**: the fraction sizes run smallest to largest; the places run 0.1, 0.01, 0.001. Flip them to match (0.001, 0.01, 0.1, No limit)?
