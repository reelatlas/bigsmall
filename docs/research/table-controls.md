# Table controls: filtering the table and naming its sections (lab, 2026-10-08)

**Retired 2026-10-10.** Superseded by the settings lab (docs/research/organization-lab.md), where Sean's model, one Settings button in the action bar and the table's sections and Hidden section, took over; the lab is in git before its removal. What it showed (folding, chips, a panel, editing the list) fed that model.

Sean asked for a way to filter the table's units and for section names in a long table, designed together with the everyday-or-every-unit toggle (docs/PLAN.md §2). Four ways to filter and four ways to mark sections are prototyped in the table controls lab (`/dev/table-controls-lab`, `apps/web/src/pages/dev/_table-controls-lab/TableControlsLab.tsx`), in any pairing. Nothing is chosen or built in the converter yet.

The lab is built from the real engine, table view (`selectTable`), category menu, and chip, with the table's columns and its names giving way as in the converter, but it holds its own simple state: no undo, no URL, no arrow keys. It can switch the visitor's region (US, UK, metric) and the width (a phone's column, 360 px, or the converter's wide one, 576 px).

## Sections

A section is a group of the listed order (ADR 0011, ADR 0016), named by core's `unitListGroup`: the visitor's everyday units, the other main system's, those of neither, and the specialist units of every system.

| Section           | US visitor                                  | UK visitor             | Metric visitor            |
| ----------------- | ------------------------------------------- | ---------------------- | ------------------------- |
| Own everyday      | US customary                                | Imperial               | Metric                    |
| Other main system | Metric                                      | Metric                 | Imperial and US customary |
| Neither           | UK imperial, or Other (knots, atmospheres)  | US customary, or Other | Other                     |
| Specialist        | Specialist (or "Less common", "More units") | the same               | the same                  |

- **A category with no regional system** (time, data, angle) lists its everyday units together with no heading, then the specialist heading: "Metric" over minutes and hours would mislead.
- **A category ordered by its catalog** (temperature, fuel economy) can interleave groups; under headings its rows gather by section, so a metric visitor reads °C and K under Metric and °F under Imperial and US customary.
- **Symbols under a heading that names the region** can drop "(US)" and "(UK)" (fl oz (UK) under UK imperial reads fl oz), unless two symbols in the section would then read alike, as in a metric visitor's mixed section.

## The four ways to filter

|                             | How it works                                                                                                                 | For                                                                                                                                                                       | Against                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **A. Fold the sections**    | Each heading is a button with a chevron that folds its section to one line ("Specialist 5") and back                         | No new control; the headings are the filter; folding Metric is Sean's example (a US worker turning off cm, m, km), and folding Specialist is the everyday-or-every toggle | No single units; needs headings with names                                                       |
| **B. Chips over the table** | A toggle per section at the top of the table card, filled when shown, outlined when hidden                                   | Every option visible at once; the state reads at a glance                                                                                                                 | A row of buttons over every table, two lines on a phone; sections named twice when headings show |
| **C. A filter panel**       | A filter button in the toolbar opens a card between the box and the table: a checkbox per section and per unit, and Show all | Single units as well as sections; the table stays clean                                                                                                                   | Behind a button; one more panel, like the calculator, on a phone                                 |
| **D. Edit the list**        | Edit swaps the copy buttons for checkboxes; Done hides what is unchecked, leaving "3 hidden · Show" at the bottom            | Single units, in place, where the eye already is                                                                                                                          | A mode; nothing shows a section can be hidden at once                                            |

In every way the box's own unit always shows, even in a hidden section.

## The four ways to mark sections

- **None**: today's table.
- **Labels**: the section's name in a label's muted ink over its rows.
- **Labels with a line**: the same, with a divider over each section after the first.
- **A line only**: a divider and no name. Folding and the chips still need names, so they keep theirs.

## What the lab showed

- **Hiding the specialist section on a phone brings the names back** in the volume table: its long values (0.000618891 yd³) are what leave no room. Dropping "(UK)" under a heading does not, on its own.
- A metric visitor's second section mixes US and UK measures, smallest to largest, so their symbols keep "(UK)".
- The chips take two lines on a phone for volume (four sections).

## Recommendation

**A, folding sections, with labels and a line**, for a first build: the headings name the groups and are the filter, with no new control in the toolbar and nothing to discover; folding Specialist is the everyday-or-every toggle, and folding Metric is Sean's own example. Each category's folds would be remembered once saved settings exist (docs/UX-SPEC.md §14, persistence). Single units (C or D) can follow if people ask for them. The alternative is B, if folding reads as too hidden.

## Open questions for Sean

1. Which way to filter, and which heading look?
2. The last section's name: Specialist, Less common, or More units?
3. Folds remembered per category, or one choice for every category (fold Specialist everywhere)?
4. Headings when a category has only one everyday section and no specialist units: none, as the lab does?
5. Keys: the converter's cursor moves through rows from the box; a fold button needs a way in (a stop in the arrows' loop, or Tab).

## Build plan, once chosen

1. Core: `unitListGroup` (built for the lab, with a test).
2. State: what is hidden, per category, in the reducer's state and its history; persistence with saved settings later.
3. The table: sections in `ConversionTable`, the chosen filter control, the box's unit always shown, names giving way as today.
4. Keys and screen readers: the headings in the arrows' loop or the Tab order, announced with their counts.
5. Docs and tests: UX-SPEC §1 and §3, an ADR, DESIGN-SYSTEM, TESTING; browser tests for folding (or the chosen control) in every theme, at 320 px, and with axe.
