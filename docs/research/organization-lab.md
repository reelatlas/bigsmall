# Settings lab: what shows and how it looks (2026-10-10)

Sean's model, in the context of the action bar (2026-10-10): one Settings button shapes the results, and the table holds what is specific to them. `/dev/organization-lab` (the settings lab, `apps/web/src/pages/dev/_organization-lab/`) builds it in two converters side by side, which differ only in where single units are chosen. Each has the real action bar (the category menu, then Settings, the calculator, undo and redo, and clear all), the box, and the table or the matches. The category, the number, and the region are shared; each converter keeps its own settings. Nothing is built in the converter yet.

The earlier prototypes, the table controls lab (A to D) and this lab's first two rounds (jobs, by system, six filters, and options E to I), are retired; they are in git before this round. What they settled is below.

## Settled along the way

- **Sections by system, under fixed names**: Metric, US (customary), UK (imperial), Other, Specialist, the same in every category, every section headed, the visitor's own first (Sean, 2026-10-10). Only headings take the parentheses; units keep their names and symbols ("imperial gallon" is the standard name, and "gal (UK)" tells the gallons apart when names drop on a phone). A category with no regional system (time, data, angle) heads its everyday units Everyday.
- **Other has no switch** while it holds two units, the knot and the atmosphere, which always show (Sean, 2026-10-10).
- **One setting for every category**: a system switch means the same thing everywhere.
- **Jobs (Cooking, Cubic, Trade) were set aside**: written per category, named differently in each, and in the way of one filter for every category.

## The model

### Settings, in the action bar

A sliders button at the start of the tools opens one panel, anchored to the action bar's right edge, with two parts. A dot on the button says something differs from a fresh visit.

**Units**, what the table and search show, in every category:

- Show: All units, Everyday, or Your region (presets; none is lit when the switches are a custom set).
- Systems: Metric, US (customary), UK (imperial), Specialist.

**Display**, how results look:

- Unit names: Symbol and name, or Symbol only.
- Copy buttons, on or off (a copy still copies the full value).
- Format: Decimals, rounded to 0.1, 0.01, 0.001, or No limit (today's six significant digits); or Fractions, in the sizes chosen (1/2, 1/3, 1/4, 1/8, 1/16, 1/32, 1/64, several at once), written as mixed numbers in lowest terms, "≈" where they round.
- Rounding: Nearest, Up, or Down (off with No limit).
- A value too small for the places or the sizes chosen, which would read 0, keeps its significant digits; one past a million keeps decimals.

### What shows: one rule

The system switches set every category. A unit chosen on its own is an exception, shown or hidden against its switch, and stays when the category changes. Turning a switch sets that system everywhere and clears its exceptions, so the last thing done wins at the scope it was done; a preset clears the exceptions of the systems it changes. Settings counts a category's exceptions ("2 units chosen on their own in Volume") with Reset Volume. The unit in the box always shows.

### Choosing single units: the two converters

- **1. Separate.** Settings lists the systems as plain switches for every category. The table's foot has Edit, which puts a checkbox on every row and a three-state one on every heading (all, some as a dash, none); Done ends it.
- **2. Together.** Settings shows this category under each system: the system's checkbox reads all, some, or none of its units here, and sets the system everywhere, clearing its exceptions; a chevron opens it to its units, each chosen here alone. A system with no units in the category is a plain switch, "none in Length".

### Hidden units

- **In the table**: a Hidden line at the foot counts them ("Hidden 5"); open, it lists them under their section names, values dimmed, a checkbox on each and a three-state one on each heading, so one or a section comes back with a tap.
- **In search**: hidden units leave the matches. When one matches, a line says so ("2 hidden units also match", or "Only hidden units match"), and Show them lists them under Hidden with their category and section ("Volume · Specialist"). Taking one puts it in the box, where it shows. Nothing typed ever meets a bare "No unit matches" while a hidden unit matches.

## Questions this round puts to Sean

1. **Where single units are chosen**: in the table (1) or in Settings (2)?
2. **One button or several**: one Settings button for everything (the lab), or one or two of the most used surfaced on their own (decimals or fractions, say) once we know which?
3. **Fractions for metric units**: "≈ 1,920 1/4 mm" reads oddly; fractions for customary units only, metric staying decimal, or every unit alike?
4. **Rounding up and down** below zero: toward larger values (up is toward +∞), or away from zero?
5. **Where Settings sits**: at the start of the tools (the lab), beside the category menu, or at the end?
