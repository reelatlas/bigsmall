# Settings lab: what shows and how it looks (2026-10-10)

Sean's model, in the context of the action bar (2026-10-10): one Settings button shapes the results, and the table holds what is specific to them. `/dev/organization-lab` (the settings lab, `apps/web/src/pages/dev/_organization-lab/`) builds it with single units chosen in the table (Separate, Sean's direction), in two converters side by side that differ only in how Settings draws its choices: compact pills, or a segmented control. Each has the real action bar (the category menu, then Settings, the calculator, undo and redo, and clear all), the box, and the table or the matches. The category, the number, and the region are shared; each converter keeps its own settings. Nothing is built in the converter yet.

The earlier prototypes, the table controls lab (A to D), this lab's first two rounds (jobs, by system, six filters, and options E to I), and variant 2, Together (single units chosen in Settings, under each system), are retired; they are in git. What they settled is below.

## Settled along the way

- **Sections by system, under fixed names**: Metric, US (customary), UK (imperial), Other, Specialist, the same in every category, every section headed, the visitor's own first (Sean, 2026-10-10). Only headings take the parentheses; units keep their names and symbols ("imperial gallon" is the standard name, and "gal (UK)" tells the gallons apart when names drop on a phone). A category with no regional system (time, data, angle) heads its everyday units Everyday.
- **Other has no switch** while it holds two units, the knot and the atmosphere, which always show (Sean, 2026-10-10).
- **One setting for every category**: a system switch means the same thing everywhere.
- **Jobs (Cooking, Cubic, Trade) were set aside**: written per category, named differently in each, and in the way of one filter for every category.
- **Separate** (Sean, 2026-10-10): Settings applies to every category; the table applies to this one (Edit, the Hidden section).
- **Display reaches search**: with Symbol only, the matches show symbols alone, the name kept for screen readers; everything the converter surfaces follows Display.
- **A fresh visit** (Sean, 2026-10-10): every system but Specialist (the Everyday preset), Symbol only (listed first), no copy buttons, decimals to 0.01, rounded to the nearest; fractions, once chosen, start in eighths (1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8).
- **No copy column without copy buttons**: the rows run to the card's edge. The checkboxes of Edit and the Hidden section lead a row, on the left under their heading's, so no column at the right edge is kept for them either.
- **Opening Hidden never moves the table** (Sean, 2026-10-10): the Hidden list sizes its columns to its own rows, so its checkboxes and long values never widen the table's value column.
- **Done closes Hidden**: whoever just chose what to hide should not have to fold it again.
- **No dot on Settings**: a dot for "changed" would sit there for good once anything is set. The two resets say what can be undone instead.
- **Two layers, two resets** (Sean, 2026-10-10): the system switches are one layer, for every category; a unit hidden or shown on its own in a table is another, which the switches, the presets, and Reset settings leave. Reset settings puts the switches and Display back as a fresh visit has them; Unhide units brings back every unit hidden on its own, in every category, and leaves the settings.
- **Taking a hidden unit unhides it** (Sean, 2026-10-10): one taken from the hidden matches into the box leaves Hidden, as if checked there, so clearing the box never hides it again.
- **Rounding below zero**: up is toward larger values and down toward smaller, as ceiling and floor are (IEEE 754, and the reading Sean expected): −2.15 rounds up to −2.1 and down to −2.2. Spreadsheets' ROUNDUP, which rounds away from zero, is the exception, not the rule.
- **Fractions apply to every unit** when chosen, metric included.
- **Fractions in the sizes chosen** (Sean, 2026-10-10): 1/2, 1/3, 1/4, 1/8, 1/16, 1/32, 1/64, several at once. Each writes its whole grid: whoever reads sixteenths needs the rare ones too, a mismeasurement included. A finer size holds the coarser it contains (sixteenths hold every eighth, quarter, and half), which then show chosen and locked; thirds stand alone and mix with the others (1/4, 1/3, 1/2, 2/3, 3/4 for cups). Trades were set aside as a rule of thumb, not a standard, and so were named groups once several sizes could be chosen.
- **No "most common" 32nds and 64ths** (proposed 2026-10-10, for Sean to confirm): a reference chart lists every 64th, where dropping the rarely used ones trims rows. The table lists none: each row writes one value, rounded to the sizes chosen, so a "common" set would hide nothing and only round some values further than asked (0.078 in would read ≈ 1/16 under 64ths, never 5/64), with no standard behind which 64ths are common. The hardware sizes behind them (screw pilot holes, tap drills) are a lookup, the nearest standard drill to a size, which a later feature could answer with cited sizes.
- **Fractions in lowest terms** (4/64 is written 1/16): drill bits, tapes, and charts mark them so. Unreduced would only help someone counting the ticks of a rule graduated in 64ths; a later option if it is ever asked for.

## The model

### Settings, in the action bar

A sliders button at the start of the tools opens one panel, anchored to the action bar's right edge, with two parts and two resets.

**Units**, under one line (Sean, 2026-10-10: one sentence for the section, no labels over its two groups; the groups keep names for screen readers): "What search and the table show in every category. Units you hide or show in a table stay as you set them."

- All units, Everyday, or Your region (presets; none is lit when the switches are a custom set).
- Metric, US (customary), UK (imperial), Specialist, a checkbox each.

**Display**, how results look:

- Symbol only, or Symbol and name (no label: the choices say it).
- Copy buttons, a switch leading its label, as a checkbox does (a copy still copies the full value).
- Format: Decimals or Fractions.
- Round to: for decimals 0.1, 0.01, 0.001, or No limit (today's six significant digits); for fractions the sizes chosen, in two rows (1/2, 1/3, 1/4, 1/8, then 1/16, 1/32, 1/64), with a line under them that says what they write ("Shows 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8"); with none chosen, values keep their decimals. Fractions are written as mixed numbers in lowest terms, "≈" where they round, a tie going up.
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

1. **Compact pills or a segmented control** for Settings' choices (1 and 2 in the lab)? Both draw a 32 px shape with less padding, the text kept at the 14 px size, and both keep a 44 px tap. Whichever is kept becomes a recipe for every setting list.
2. **The switch's look** for Copy buttons (the trial in the lab): kept, it moves to `components/` and the gallery.
3. **No "most common" 32nds and 64ths** (above, under settled): agreed, or try a common set anyway?
4. **Decimals and fractions together** (Sean, 2026-10-10, asked): a third Format choice, Both, writing the fraction with its decimal after it in the muted ink ("6 5/16 · 6.30"), the decimal a column that gives way on a narrow screen as the names do. Recommended; not built yet.
5. **Where Settings sits**: at the start of the tools (the lab), beside the category menu, or at the end? Sean is still thinking (2026-10-10).
6. **One button or several**: one Settings button for everything (the lab), or one or two of the most used surfaced on their own once we know which?
