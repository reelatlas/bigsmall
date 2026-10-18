# 0014 — The arrow keys move between the page's planes

Date: 2026-10-08
Status: accepted; amended (see Amendments)

## Context

The converter is used from the keyboard as much as with a pointer: the box takes typing from anywhere, Escape steps back from anywhere, and the arrows already went round a loop of the category menu, the box, and the table (ADR 0012). The rest of the page did not join in: the toolbar and the header were rows of Tab stops, and the arrows did nothing there. Sean asked for the page to feel fluid without a mouse (2026-10-08): ↑ and ↓ moving between the header, the toolbar, and the box with its table, ← and → along whichever bar focus is in, and each bar remembering the control last used. The category menu moved into the toolbar's row at the same time.

## Decision

The page is a stack of planes, top to bottom: the header's controls, the converter's toolbar, and the box with its table.

- Each bar is a WAI-ARIA toolbar: one Tab stop; ← and → (Home, End) along its controls in the order they show, round from end to end; and a roving tabindex that keeps the control last used as its stop. First reached, the converter's toolbar lands on the category menu, where ↑ from the box went before, and the header on its first control.
- ↑ and ↓ on a toolbar's control go to the plane above or below. In the box they go through its rows as before, and past the field or the last row on to the next plane, round from the box to the header. Entering the box always lands in the box, its cursor resting, and with nothing on the page focused ↑ or ↓ enters there first, as typing from anywhere lands there (Sean, 2026-10-08).
- Escape on a toolbar's control goes back to the box.
- A control that can do nothing right now is `aria-disabled`, not `disabled`, so a toolbar's order never changes shape and the control last used is still there after it is used (clear all).
- Reaching the shortcuts icon with the keyboard shows its map, as a resting mouse does.

The controller lives in the inline script of `layouts/Base.astro`, beside the header menus', so the header's toolbar works before any bundle and on every page. Markup joins in with attributes (`role="toolbar"`, `data-tool`, `data-default-tool`, `data-plane`), and the converter's box hands its ↑ and ↓ over with an event (`src/lib/planes.ts`). Behavior: docs/UX-SPEC.md §8 and §10.

## Alternatives considered

- **Tab only, every control a stop.** The web's default. It still works, but a keyboard user crosses every icon to get anywhere, and the arrows do nothing outside the box.
- **Spatial navigation everywhere**, the arrows moving to the nearest control in a direction, as on a television. Predictable in a grid, surprising across a page whose rows have different lengths, and it would fight the box's own arrows. The calculator, which is a grid, does move this way (`src/lib/spatial.ts`).
- **No wrapping at the edges.** Easier to explain, but the box's loop already went round (ADR 0012), and Sean wanted the same feel across the page. Taken on 2026-10-15 after all: going round from the table's foot to the header, or from the header to the box, jumped the length of the page, which Sean found jarring. ↑ on the header and ↓ past the table's last control now do nothing; a toolbar's ← and → still go round, along one row.

## Consequences

- Tab is shorter: the header's toolbar, the converter's, the box, then the calculator while it is open.
- Screen readers announce two named toolbars, "Site" and "Tools", and their arrows. In browse mode a screen reader keeps the arrows for itself, and Tab still reaches everything.
- ↑ and ↓ no longer scroll the converter's page: from anywhere they go into the box and on through the planes, and a row the cursor reaches scrolls into view. Space and Page Down still scroll, and pages without the converter (the gallery, the labs) keep the arrows for scrolling.
- A header menu added later joins the header's toolbar by carrying `data-tool` (CLAUDE.md, "Add a header menu").

## Amendments

- **2026-10-15, the table's foot carries on the box's plane.** Past the last row, ↓ went straight on to the header, so the arrows never reached the table's foot (Hidden and Edit, or Show them under the matches), only Tab did; Sean found Hidden out of the arrows' reach (2026-10-15). The foot now carries on the box's plane: past the last row ↓ lands on it, the cursor resting, ← and → move between Hidden and Edit, ↓ goes on through Hidden's lines while it is open, and past the last control on to the next plane as before; ↑ from the foot comes back to the box with the cursor on the last row. The foot stays a Tab stop, Escape on it goes back to the box, and Edit keeps every arrow for itself, Escape ending it (docs/UX-SPEC.md §3, §8). The table hands its edges back to the layout through `panelKeys`' `onEdge` (`src/lib/panel-keys.ts`).
- **2026-10-15, the page's ends are stops.** ↑ on the header and ↓ past the table's last control do nothing, where they went round the page before; a toolbar's ← and → still go round its one row (Sean found the jump from the foot to the header jarring; "No wrapping at the edges" above). The decision's "round from the box to the header" is replaced by this.
- **2026-10-15, the shortcuts map opens on a click alone.** Neither the keyboard reaching its icon nor a resting mouse opens the map any more (Sean, 2026-10-15): a click, Enter, or Space does, and Escape or a second click closes it (docs/UX-SPEC.md §10). The decision's line on reaching the icon with the keyboard is replaced by this.
