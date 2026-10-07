# 0009 — One converter, two layouts: the table by default, two boxes behind a switch

Date: 2026-10-07
Status: accepted; the headline (the last sentence of decision 2) superseded by 0010

## Context

The MVP (`v0.1.0`) converts between two linked boxes. Nothing converts until both have a unit, and seeing the value in a third unit means changing one of them.

Friends who use the live site are bigsmall's first user group; they gave Sean the idea for it. Both asked for the same thing on their own: type a value and a unit, and see it in every unit of its category at once, with a way to switch to any of them. Seeing the units side by side is how they judge which one suits the job. They also asked for favorite units and categories (docs/research/findings-friends-1.md).

Every category today has 3 to 9 units, so a whole category fits on a phone screen. The converter's state already holds what a table needs: a source box with a number and a unit, and optionally a second unit. A table is another way to show that state, not another engine.

There are no analytics yet, and the audience is a handful of people, so an A/B test could not reach an answer.

## Decision

1. Two layouts over one state, reducer, undo history, and URL: **Table**, the default, and **Two boxes**, the MVP's layout. A switch in the header changes between them; the choice is saved like the theme and applied before the page paints, so a saved choice never flashes the other layout.
2. **Table:** one box; once it holds a number and a unit, every unit of its category is listed below it. Tapping a row moves that unit into the box with its value, and every row converts from it. The conversion's second unit, when it has one (from a shared link, or the second box when switching over), heads the table.
3. **Two boxes:** as today, with swap moved into the toolbar, right of the calculator.
4. No A/B test. The five-person usability test runs on the table layout, with two boxes on the switch's other side; product analytics, when they arrive, count use per layout.

Behavior: docs/UX-SPEC.md §14, "Table layout and the layout switch".

## Alternatives considered

- **Replace the two boxes with the table.** Gives up a working, focused one-to-one view that some people may prefer, and saves little: the layouts share everything but their markup.
- **Keep two boxes and add the table under them.** Two answers on one screen, and the second box's decision stays in the way.
- **A/B test the layouts.** Needs random assignment, analytics, and hundreds of sessions per side; with friends as the audience it would measure noise.
- **Carry the layout in the URL.** A link shares a conversion; how it is shown is the viewer's choice, like the theme.

## Consequences

- One new reducer action (moving a unit into the box with its value), a pure table view beside `selectView`, a table component, and a layout switch, the last two in the gallery. The core engine and the URL format are unchanged.
- A unit moved into the box brings its value rounded to the 10 significant digits a result shows, as if it had been typed. Swap in the two-box layout still moves the typed value without re-rounding.
- Twice the surface to test: the browser suite, axe in every theme, and the keyboard walk run on both layouts.
- The inline script that applies the theme before paint also applies the layout. The server-rendered page carries both layouts' empty state (the second box and swap shown only in the two-box layout), so the first client render still matches the server's.
- The calculator's send buttons, the hint, the category label, and the live region each adapt to the layout.
- Both layouts staying is not settled: if the test and later analytics show nearly everyone in one, a new ADR retires the other.

## Outcome notes (2026-10-07)

Built the same day. Where the build settled what the decision left open:

- **Digits.** Rows, the headline included, show 6 significant digits (Sean's choice), so they compare at a glance; copying a row gives its full value. A row moved into the box brings its value to the box's 10 digits, never the row's 6.
- **The box.** The table layout shows the source box, whichever it was with two boxes, at most 576 px wide, and the table under it the same width.
- **"Show all N units"** waits for the modes in milestone 3: every unit is basic today, so the row could not appear.
- **The header.** The switch makes the menus wider, so they take their own line under 544 px of page width (a 512 px header), not 416; on that line the switch sits right of the theme menu.
- **Swap** moved into the toolbar first, in its own commit, and is off while both boxes are empty, like clear all.

**Revised (2026-10-07).** After trying the build, Sean dropped the headline: ADR 0010. The category label stopped adapting to the layout (it sits over the box in both), and the calculator takes a column beside the table from `md` (docs/UX-SPEC.md §1).
