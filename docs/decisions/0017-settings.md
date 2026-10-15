# 0017 — Settings: what shows and how it looks, sections by system, two layers

Date: 2026-10-11
Status: accepted; amends 0011 and 0016. Amended 2026-10-14 and 2026-10-15 (see "Amendments" at the end)

## Context

Sean asked for a way to section the table reliably and to control what it shows (2026-10-07), then for the options a converter's power users want: symbols alone or with names, copy buttons, decimals to a place or fractions, rounding (2026-10-10). Three labs explored it (the table controls lab, then the organization lab's rounds, then the settings lab, docs/research/organization-lab.md), and Sean settled the model there over a day of rounds: one Settings button in the action bar, sections by system under fixed names, single units chosen in the table, a Hidden list, search leaving hidden units out, and the defaults. On 2026-10-11 he asked for it in the converter.

## Decision

- **One Settings button** in the toolbar, after the category menu and the calculator, with no dividers among the three; undo, redo, and clear all keep the right end. It opens a non-modal panel beside the toolbar (not in it, so its controls keep their keys), with Units, Display, and two resets. It closes on Escape (focus back on its icon), a press outside, or focus moving out, never on focus merely lost.
- **Sections by system, under fixed names**, the same in every category: the visitor's own system first, then the other main systems, Other, then Specialty (Specialist until 2026-10-14); Standard for a category with no regional system. Only headings take the parentheses ("US (customary)"). This regroups ADR 0011's order into sections; within a section, its smallest-to-largest rule stands.
- **Two layers decide what shows.** The system switches (Metric, US (customary), UK (imperial), Specialty) and their presets (All (All units until 2026-10-15), Standard, Your region) set every category. A unit hidden or shown on its own in a table (Edit, the Hidden list, or a hidden unit taken from search) is an exception, kept when another system's switch changes; its own system's switch changing is final for it, a preset clears every exception, and Show custom hidden units (Unhide units, then Show units you hid, then Unhide hidden units, on 2026-10-15) clears the hidden ones. A system's checkbox shows a dash while units of it are chosen on their own, the presets gain Custom, the visitor's own set, always in reach, lit by any change by hand until a preset is picked, kept aside when a preset is picked and brought back by Custom, and the systems can be reordered in Units, by a handle (drag, or Move up and Move down) or Alt and an arrow, the table's sections following in every category, with Reset order (amended 2026-10-15: exceptions outlasted every switch, so specialist units showed with Specialty unchecked, which Sean found was not what a switch promises). The unit in the box always shows.
- **A fresh visit's settings**: Standard (every system but Specialty), Symbol only, no copy buttons, decimals to 0.01, rounded to the nearest; fractions, once chosen, start in halves, quarters, and eighths. This amends ADR 0016: every unit is still in the table, but the specialist ones wait under Hidden, one tap away, until Specialty or All units is chosen.
- **Display** is written by core (`formatPlaces`, `formatFraction`, ADR 0003): decimals to a place, trailing zeros trimmed; fractions in the sizes chosen, each on or off, every fraction of each size, each written in the smallest size chosen that writes it; Both, the decimal then its fraction. A value under the last place or the smallest size keeps its significant digits whatever the rounding; rounding up is toward larger values and down toward smaller, below zero too.
- **The table holds still**: every column is as wide as the widest it could hold across the category's units and every rounding (a sizer row no one sees), so nothing moves as presets, switches, Hidden, or rounding change what shows; values line up on the decimal point (2026-10-14).
- **Settings stay apart from the conversion**: out of the undo history and out of the URL. Undo steps through what was typed and converted; Settings has its own resets. They started fresh each visit (as decided 2026-10-08, "a fresh start each visit"); since 2026-10-15 they are remembered in this browser, Custom and the order with them (Sean: a set of one's own should last), the conversion still never.

## Alternatives considered

- Basic and advanced modes, or a "Show all": retired by ADR 0016; the switches and Hidden replace them without a second table.
- Jobs (Cooking, Cubic, Trade) as filters: written per category and named differently in each, in the way of one setting for every category.
- Single units chosen in Settings, under each system (the lab's "Together"): Sean chose the table (Separate), where the units are.
- A switch that clears its system's single units: Sean asked for single units to stay as set, outside the global logic.
- A dot on the Settings icon for a changed setting: it would stay lit for good; the resets say what can be undone.
- "Most common" 32nds and 64ths: the table writes one value per row, so a common set would hide nothing and only round some values further than asked.
- Settings in the undo history: settings are preferences, not the conversion; undoing a typed number should not undo a format.

## Consequences

- The table, the matches, and the box take the settings (`features/converter/settings.ts`, then `SettingsPanels.tsx` and `SystemRows.tsx`); `SegmentedControl` joined the components, and `Switch` with it until copy buttons left Display (2026-10-15).
- A fresh visit shows fewer rows (the specialist units under Hidden) and shorter values (two places): browser tests that are about something else set the old view through Settings (`showEverything`, `e2e/support.ts`).
- Saving settings across visits was an exploration (docs/PLAN.md §2), built 2026-10-15 (see Amendments); surfacing one setting on its own in the toolbar still is.
- The settings lab retired on 2026-10-15, its last round's answer (two side panels) shipped; its entry is in the retired labs index (docs/research/labs/README.md).

## Amendments

- **2026-10-14.** The specialist units' section reads Specialty, and values line up on the decimal point.
- **2026-10-15, side panels.** Settings opens as two side panels, Filter and Display, one side panel at a time with the calculator, and units glide and flash as they move between shown and hidden.
- **2026-10-15, Units.** Filter renamed Units, its first preset All; its reset to Standard dropped (the Standard preset does it); Unhide units renamed Show custom hidden units; a system's switch final for its units, its checkbox a dash while some are chosen on their own; Custom among the presets, lit by any change by hand and never out of reach; the systems reordered by a handle, the table's sections following; Other a switch and a place in the order like the systems, Your region showing it too (Standard alone has none).
- **2026-10-15, Display.** Decimals keep their trailing zeros; small values round as chosen ("< 0.01" where one rounds to zero); Symbol and name a fresh visit's default (symbols alone before); the format unlabeled, Rounding over Round to; Copy buttons left Display: one copy button shows, on the active row, and copies what the row shows (docs/UX-SPEC.md §7).
- **2026-10-15, remembered.** Every setting is remembered in this browser, Display by what was changed, so a default changed later reaches anyone who never chose otherwise (`settings-store.ts`, versioned).
