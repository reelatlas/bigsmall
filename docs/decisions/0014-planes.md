# 0014 — The arrow keys move between the page's planes

Date: 2026-10-08
Status: accepted

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
- **No wrapping at the edges.** Easier to explain, but the box's loop already went round (ADR 0012), and Sean wanted the same feel across the page.

## Consequences

- Tab is shorter: the header's toolbar, the converter's, the box, then the calculator while it is open.
- Screen readers announce two named toolbars, "Site" and "Tools", and their arrows. In browse mode a screen reader keeps the arrows for itself, and Tab still reaches everything.
- ↑ and ↓ no longer scroll the converter's page: from anywhere they go into the box and on through the planes, and a row the cursor reaches scrolls into view. Space and Page Down still scroll, and pages without the converter (the gallery, the labs) keep the arrows for scrolling.
- A header menu added later joins the header's toolbar by carrying `data-tool` (CLAUDE.md, "Add a header menu").
