# 0013 — One layout: the table; two boxes and the layout switch retire

Date: 2026-10-07
Status: accepted; supersedes 0009 and 0010

## Context

ADR 0009 gave the converter two layouts over one state: the table, the default, and two linked boxes behind a switch in the header. ADR 0012 then made the table the unit list, with its own box, keys, and category menu, while two boxes kept their suggestion list.

Using option A in the product, Sean found he does not expect to use two boxes and that the product gains most from the table alone. Keeping both meant two keyboard models, two lists, a switch in the header, a state with a hidden second box, both layouts' empty state in every page, and twice the browser tests. No analytics or test result argues for two boxes.

## Decision

The table is the converter's only layout. Two boxes, their suggestion list, swap, and the layout switch are removed from the product and the code, not hidden. The state holds one box. The URL keeps its unit and number (`?a=…&v=…`); links from two boxes still open, on the box that held the number. Two boxes stay recoverable from git: their last version, made consistent with the table first (its list's fills, its "Number" placeholder), is commit `f4563f2`, and reverting this decision's commit brings them back.

Behavior: docs/UX-SPEC.md.

## Alternatives considered

- **Hide the switch and keep two boxes in the code.** Dead code to keep compiling, testing, and reading around, which the tidy pass exists to remove; git keeps it at no cost.
- **Keep the switch, default to the table.** The switch costs header room on every phone and a second model to learn, for a layout nobody plans to use.

## Consequences

- Removed: `SmartInput`, `SuggestionPanel`, `LayoutSwitch`, `lib/layout.ts`, the layout's pre-paint script and `layout-*` variants, the header's switch slot, the swap, layout, and chevron-right icons, and `converter.spec.ts`, its flows that still apply ported to `table.spec.ts`.
- The state has one box: no source, no second box, no swap, lock, or setText; Escape's chunks are the calculator's alone. `NO_ANSWER_MESSAGES` say `long` and `short`. The URL writes `a` and `v` only.
- The field (`ValueField`) loses what only two boxes used: its shell's open list, the out-of-range message in place of a value, and the focus and leave hooks. The calculator's send button reads "Use" alone.
- Without the switch the header's menus fit beside the name down to a 384 px header (Hardhat's name, the widest, needs 353), so they wrap under 416 px of page width again, as they did before the switch.
- The hint becomes "Type a number, unit, or both to compare all at once."
- Core's `suggest` and `resolveExact` stay in its public API, tested, though the converter no longer calls them.
- ADR 0009's and 0010's decisions are superseded; their context still explains how the table came to be.
