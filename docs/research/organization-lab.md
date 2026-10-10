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
- **No copy column without copy buttons**: the rows run to the card's edge. The checkboxes of Edit and the Hidden section lead a row, on the left under their heading's, so no column at the right edge is kept for them either and the other rows never move when Hidden opens.
- **Done closes Hidden**: whoever just chose what to hide should not have to fold it again.
- **No dot on Settings**: a dot for "changed" would sit there for good once anything is set. The two resets say what can be undone instead.
- **Two layers, two resets** (Sean, 2026-10-10): the system switches are one layer, for every category; a unit hidden or shown on its own in a table is another, which the switches, the presets, and Reset settings leave. Reset settings puts the switches and Display back as a fresh visit has them; Unhide units brings back every unit hidden on its own, in every category, and leaves the settings.
- **Taking a hidden unit unhides it** (Sean, 2026-10-10): one taken from the hidden matches into the box leaves Hidden, as if checked there, so clearing the box never hides it again.
- **Rounding below zero**: up is toward larger values and down toward smaller, as ceiling and floor are (IEEE 754, and the reading Sean expected): −2.15 rounds up to −2.1 and down to −2.2. Spreadsheets' ROUNDUP, which rounds away from zero, is the exception, not the rule.
- **Fractions apply to every unit** when chosen, metric included.
- **Fractions as one step, in generic groups** (Sean, 2026-10-10): trades are a rule of thumb (a framer may work to 1/16, a woodworker to 1/32), not a standard, so the groups are named by fineness. The steps nest, a sixteenth holding every eighth, quarter, and half, so one step is chosen, never several.

## The model

### Settings, in the action bar

A sliders button at the start of the tools opens one panel, anchored to the action bar's right edge, with two parts and two resets.

**Units**, what the table and search show, in every category:

- Show: All units, Everyday, or Your region (presets; none is lit when the switches are a custom set).
- Systems: Metric, US (customary), UK (imperial), Specialist, a checkbox each.

**Display**, how results look:

- Unit names: Symbol only, or Symbol and name.
- Copy buttons, a switch leading its label, as a checkbox does (a copy still copies the full value).
- Format: Decimals or Fractions.
- Round to: for decimals 0.1, 0.01, 0.001, or No limit (today's six significant digits); for fractions one step of six, in three groups, coarse to fine: Coarse (1/2, 1/4), Medium (1/8), Fine (1/16, 1/32, 1/64), with a line under them that says what the step writes ("Shows 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8"). Fractions are written as mixed numbers in lowest terms, "≈" where they round.
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
3. **The fraction groups' names**: Coarse, Medium, Fine (the lab), or another set, such as Rough, Standard, Precise? And thirds, which do not nest with the others (1/3 cup): left out (the lab), or a choice of their own?
4. **Where Settings sits**: at the start of the tools (the lab), beside the category menu, or at the end? Sean is still thinking (2026-10-10).
5. **One button or several**: one Settings button for everything (the lab), or one or two of the most used surfaced on their own once we know which?
