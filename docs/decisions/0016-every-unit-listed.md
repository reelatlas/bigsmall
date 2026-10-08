# 0016 — Every unit in the table: specialist units listed with the everyday ones, no modes

Date: 2026-10-08
Status: accepted

## Context

The plan had basic and advanced modes (docs/PLAN.md §1, docs/UNITS-CATALOG.md §3): basic listing each category's common units, advanced revealing the rest, a "Show all" under a list, and a search for an advanced unit escalating to show it. Milestone 1 built the basic tier only, and the reducer carried a `mode` nothing could change. Once the table became the unit list (ADR 0012) and the only layout (ADR 0013), Sean dropped the modes (2026-10-08) and asked for the specialist units to be included wherever they make sense and fit, with no "more" control hiding them: keep expanding the one model, and re-evaluate if the scale gets large.

## Decision

- **The table lists every unit of its category,** everyday and specialist alike, in the listed order (ADR 0011): the visitor's own system, then the other main system, then units of neither, each group smallest to largest. The start and the category menu list every category.
- **No modes and no "Show all".** The reducer's `mode` and its `setMode` action are gone; the web asks core for every tier.
- **The tier stays, as a ranking hint.** Among equal matches, a basic unit comes before an advanced one (docs/UX-SPEC.md §4), so a short query still finds the everyday unit first. The catalog keeps marking which units are which.
- **Which specialist units.** Those someone converts in practice, for a trade, a hobby, or the news (hectopascals for weather, therms on a gas bill, arcminutes for a scope), each cited (ADR 0004). Left out: retired units (the US survey foot), units that depend on conditions (Mach), a second row for the same size under another name (cm³ beside mL, millibar beside hectopascal: an alias instead), and curiosities.

Behavior: docs/UX-SPEC.md §3. Catalog: docs/UNITS-CATALOG.md §3.

## Alternatives considered

- **Basic and advanced modes**, the plan. A switch few would look for, and a unit hidden in basic mode could be found only by typing it.
- **Specialist units only when typed.** Keeps each table short, but a unit nobody can see cannot be picked with taps alone (docs/PLAN.md §1, "Manual selection").
- **"Show all" under each table.** One more control in every table; Sean preferred one model.
- **Specialist units after the everyday ones.** Keeps the everyday block at the top, but breaks smallest to largest within a system, so a list would read by two rules.

## Consequences

- Tables grow longer, and the first row is not always the everyday unit: angles start at arcseconds, the smallest. Headings within a long table (metric, US customary, other) are an exploration for when the lengths call for them (docs/PLAN.md §2).
- Long names drop out in every row on a phone more often, since one long name (British thermal units) that does not fit beside its value hides the names of the whole table (`useColumnsFit`, docs/DESIGN-SYSTEM.md, "Columns that give way").
- More category names start more letters, and a category whose name starts the query leads its class (docs/UX-SPEC.md §4): `250 p` now offers Pressure first, ahead of pounds.
- The page's script grows with the units; the bundle budget (`pnpm bundle:check`) keeps watch.
