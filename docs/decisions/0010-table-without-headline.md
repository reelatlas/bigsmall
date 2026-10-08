# 0010 — The table shows every unit alike; the second box's unit is kept, not shown

Date: 2026-10-07
Status: superseded by 0013

## Context

ADR 0009 headed the table with the conversion's second unit when it had one: from a shared link that names two units, or the second box when switching over from two boxes. Its value showed larger, over a rule, and it was left out of the rows.

Sean tried the build the same day. The table already shows the value in every unit of the category, so singling one out adds a second answer to read, and the second unit matters only with two boxes. It should still be kept, so that switching back to two boxes restores the pair.

## Decision

The table has no headline. Every unit is a row in the list's order, the second box's unit among them in its place. The state, the URL's `b`, and undo keep the second box's unit while the table shows, so switching back to two boxes shows the pair. When that unit's own row moves into the box, the second box takes the box's old unit, as swap does, so the two never share a unit.

Behavior: docs/UX-SPEC.md §1 and §11.

## Alternatives considered

- **Keep the headline.** One more thing to read above a table that already holds the answer.
- **Clear the second unit on entering the table.** Switching back to two boxes would lose it, and a shared link's pair with it.
- **Mark the second unit's row** (a tint or a label). Unasked for; the five-person test can show whether a link's second unit needs one (docs/UX-SPEC.md §15).

## Consequences

- A link that names two units opens in the table with every unit alike; the pair returns with two boxes.
- The table's announcement is always how many units it shows the value in ("250 milliliters in 9 units of volume").
- The rows' keyboard, copy, and moving a unit in are unchanged; `selectTable` loses its headline, and the table component its larger first row.
- ADR 0009's decision 2 stands except for its last sentence, which this replaces.

## Outcome notes (2026-10-07)

With two boxes retired (ADR 0013) there is no second box's unit to keep: a two-box link opens on the box that held the number, and the URL drops `b`.
