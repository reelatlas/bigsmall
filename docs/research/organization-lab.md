# Settings lab: what shows and how it looks (2026-10-10)

**Built in the converter 2026-10-11** (ADR 0017, docs/UX-SPEC.md §1, §3, §7), as settled below. The lab stays until Sean retires it.

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
- **Edit reads as a tree** (Sean, 2026-10-10: sections and units looked alike): each unit's checkbox is set in under its section's, as a tree's child is, in Edit and in the Hidden list.
- **The Hidden list names its units, without values**: it is for bringing them back, a checkbox, the symbol, and the name where names show, under their section names, and needs none of the table's columns.
- **Standard, not Everyday** (Sean, 2026-10-10): the presets read All units, Standard, Your region, and a category with no regional system heads its units Standard, so Standard and Specialist read as the pair they are.
- **Segmented controls and the switch** (Sean, 2026-10-10): Settings' choices are segmented controls, the copy buttons a switch; both are components now (`SegmentedControl`, `Switch`; docs/DESIGN-SYSTEM.md, "Settings").
- **The action bar** (Sean, 2026-10-10): the category menu, the calculator, and Settings lead, no dividers between them; undo, redo, and clear all keep the right end. On a phone the leading three wrap to the line over the box. The panel opens under Settings, from the left, and on a phone spans the action bar, so it never runs past a 320 px screen.
- **Both**: a third Format choice writes the decimal and its fraction after it in the muted ink, in the order Format and Settings list them (Sean, 2026-10-10), each rounded its own way; on a narrow screen the names give way first, then the fraction.
- **Done closes Hidden**: whoever just chose what to hide should not have to fold it again.
- **No dot on Settings**: a dot for "changed" would sit there for good once anything is set. The two resets say what can be undone instead.
- **Two layers, two resets** (Sean, 2026-10-10): the system switches are one layer, for every category; a unit hidden or shown on its own in a table is another, which the switches, the presets, and Reset settings leave. Reset settings puts the switches and Display back as a fresh visit has them; Unhide units brings back every unit hidden on its own, in every category, and leaves the settings.
- **Taking a hidden unit unhides it** (Sean, 2026-10-10): one taken from the hidden matches into the box leaves Hidden, as if checked there, so clearing the box never hides it again.
- **Rounding below zero**: up is toward larger values and down toward smaller, as ceiling and floor are (IEEE 754, and the reading Sean expected): −2.15 rounds up to −2.1 and down to −2.2. Spreadsheets' ROUNDUP, which rounds away from zero, is the exception, not the rule.
- **Fractions apply to every unit** when chosen, metric included.
- **Fractions in the sizes chosen, each on or off by itself** (Sean, 2026-10-10): 1/2, 1/3, 1/4, 1/8, 1/16, 1/32, 1/64. Each writes its whole grid: whoever reads sixteenths needs the rare ones too, a mismeasurement included (5/64 is among them). A fraction is written in the smallest size chosen that writes it exactly, so what is chosen is what shows: 1/4 alone writes a half as 2/4, with 1/2 as well as 1/2; sixteenths alone write 8/16, with the coarser sizes chosen too their lowest terms. No size locks another (an earlier round locked the coarser sizes a finer one held, which left people unsure what they could uncheck). Thirds mix with the rest (1/4, 1/3, 1/2, 2/3, 3/4 for cups). Trades were set aside as a rule of thumb, not a standard.
- **No "most common" 32nds and 64ths** (Sean agreed, 2026-10-10): a reference chart lists every 64th, where dropping the rarely used ones trims rows. The table lists none: each row writes one value, rounded to the sizes chosen, so a "common" set would hide nothing and only round some values further than asked (0.078 in would read ≈ 1/16 under 64ths, never 5/64), with no standard behind which 64ths are common. The hardware sizes behind them (screw pilot holes, tap drills) are a lookup, the nearest standard drill to a size, which a later feature could answer with cited sizes.
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
- Round to: for decimals 0.1, 0.01, 0.001, or No limit (today's six significant digits); for fractions the sizes chosen, each on or off, in two strips, from the least fine to the finest as the places run (1/2, 1/3, 1/4, 1/8, then 1/16, 1/32, 1/64; Sean, 2026-10-10: people break a measure down that way), with a line under them that says what they write ("Shows 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8"); with none chosen, values keep their decimals. With Both, the two read Round decimals to and Round fractions to, decimals first as Format lists them. Fractions are written as mixed numbers, "≈" where they round, a tie going up.
- Rounding: Nearest, Up, or Down (off with No limit).
- A value smaller than the last place or the smallest size chosen (under 0.01 with two places, under 1/8 with eighths) keeps its significant digits whatever the rounding (Sean, 2026-10-10: rounding up had written 0.000619 as 0.01 while nearest kept its digits, so the table changed shape with the rounding); one past a million keeps decimals. Negative values take the locale's minus sign in every format, as the table's own text does.
- Rounding never moves the columns: the sizer measures each value under nearest, up, and down. A change of format, places, or fraction sizes rewrites the values, and the columns fit the new ones.

**Resets**: Reset settings (the switches and Display; the units hidden in a table stay) and Unhide units, with their count (every unit hidden on its own; the settings stay). Each is off while it has nothing to do, and neither closes the panel, so what it changed is there to see (Sean, 2026-10-10). A reset done shows a check after its label that draws itself in, in the success color, at full strength for the copy check's time (two seconds, longer while the pointer rests on it), then the button settles to its off look; the status line says "Settings reset" or "Units unhidden".

The panel closes on Escape, a press outside it, or focus moving outside it, never on focus merely lost (a reset turning itself off, the fraction steps leaving with Reset settings).

### What shows: two layers

The system switches set every category. A unit chosen on its own in a table is an exception, shown or hidden against its switch, recorded only where it differs from the switch when chosen, and kept when the category or the switches change. The unit in the box always shows.

### Choosing single units: in the table

The table's foot has Edit, which puts a checkbox on every row and a three-state one on every heading (all, some as a dash, none); Done ends it.

### Hidden units

- **In the table**: a Hidden line at the foot counts them ("Hidden 5"); open, it lists them under their section names, a checkbox, the symbol, and the name where names show, set in under a three-state checkbox on each heading, so one or a section comes back with a tap. It shows no values: it is for bringing units back, and needs none of the table's columns.
- **In search**: hidden units leave the matches. When one matches, a line says so ("2 hidden units also match", or "Only hidden units match"), and Show them lists them under Hidden with their category and section ("Volume · Specialist"). Taking one puts it in the box and unhides it. Nothing typed ever meets a bare "No unit matches" while a hidden unit matches.

## Questions this round puts to Sean

1. **Specialist or Specialty**: the switch and the heading read Specialist; with Standard beside it, would Specialty read better?
2. **Edit's view**: Edit sets a checkbox in front of each value, so the values move right while it is on. Keep, or show Edit as a list of units without values, as the Hidden list is?
3. **Trailing zeros**: rounded to 0.01, a value reads 0.1 and 96 today. Recommended: line the values up on the decimal point, with no zeros added; or pad them (0.10, 96.00); or keep them as they are.
4. **One button or several**: one Settings button for everything, or, later, a setting people change often (decimals or fractions, say) also in the action bar on its own?

## Next round (Sean, 2026-10-14, saved before a compaction)

Decided, to build in the converter (one round, then push):

1. **Edit keeps the footer; Done takes Edit's place.** No header row in Edit (it pushed the table down): the footer stays where it is, its Edit button reads Done in the same spot, and its left slot, where Hidden sits, reads a quiet "Choose the units to show" while Edit is on (Hidden means nothing while Edit lists every unit), so the footer keeps its height. On a phone the footer sticks to the bottom of the screen while Edit is on, so Done is always in reach. The one movement left is the values sliding right for the checkboxes as Edit starts; raise it with Sean only if he finds it jarring (never reserve the space at rest).
2. **Edit keeps the numbers** (settled).
3. **Values line up on the decimal point.** Each value carries invisible trailing characters, in an `aria-hidden` span in the same font, written with the locale's decimal mark: 96 carries an invisible ".00" beside 473.18. The count of decimals is the most any value in the column could have (the sizer's rows, every rounding), so tiny values that keep their digits (0.000619) line up too, their extra width falling in the spare space on the right. Nothing visible is added; screen readers and copying read the value alone. Decimals and Both's decimal column only: fractions ("6 5/16") stay right-aligned. Needs a spec line (§7), the sizer to carry the same padding, and a browser test that every shown value's decimal point sits at one x.

Open: **the specialist units' name.** Sean is weighing Anomalous (pushed back: it says abnormal), Dimensional (every unit has a dimension; "dimensionless" is the word for Mach and ratios, and Mach stays out), Non-standard (wrong: the cubic meter is SI's unit of volume, the nautical mile and the astronomical unit international standards; the split is everyday against field-specific), Domain-specific (accurate, long), and Technical (accurate, cold). Recommended: Specialty, which pairs with Standard. Natural units, if ever added, would sit with them, not in Other (Other is the everyday units of neither system, the knot and the atmosphere).

To build in the settings lab, locally (Sean views them on his dev server; push only when he asks), dummy data allowed where it is quicker, since the point is a comparison for his judgment call:

- **A. Today's single dropdown**, for reference.
- **B. Two buttons**, Filter (what shows) and Display (how it looks), each its own smaller dropdown. Advised against one button per setting: the toolbar has six buttons, wraps on a phone, and more icons get hard to tell apart.
- **C. Settings as a panel like the calculator**: a column beside the table from md, so results change beside it. "Both" for C (Sean, 2026-10-14), read as both phone placements: between the box and the table, as the calculator opens, and a bottom sheet; if he meant C and B+C together (the two buttons opening the side panel to their section), build that as well. Rule to propose: one side panel at a time, calculator or Settings.

Retiring labs (Sean, 2026-10-14): no browsable copy; an index with notes, screenshots, learnings, decisions, and what was left out, the process in `CLAUDE.md`'s recipes ("Retire a lab"). The settings lab retires after the mocks, since they live in it; its retirement is the first to follow the process, and the index gathers the labs retired before it (the selection lab, the table controls lab, the organization lab's earlier rounds).
