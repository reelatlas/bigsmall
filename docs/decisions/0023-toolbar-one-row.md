# 0023 — The toolbar is one row: a touch screen scrolls it, a pointer gets More

Date: 2026-10-17
Status: accepted

## Context

The converter's toolbar holds seven controls: the category menu, the calculator, Units, and Display at its left, and undo, redo, and clear all at its right end (docs/UX-SPEC.md §1). On a phone the row has no room for all of them. Until now it wrapped: the right end kept the top line and the leading four took the next (2026-10-15). Then the toolbar and the box came to stick together at the window's top while a long table scrolls (the sixty-ninth pass), and a wrapped toolbar made the stuck block two lines tall on a phone, the line a visitor needs least, undo, redo, and clear all, taking the room. Sean wanted one row always (2026-10-17): on a phone a row that scrolls sideways, which he finds the better experience than a menu, actions going out of view being the point with so few of them; on a desktop, where a mouse makes a sideways scroll awkward, a menu for what does not fit. A mock outside the repo ("bigsmall toolbar mock") compared the two with the wrap.

## Decision

The toolbar is one row that never wraps. Where the row lacks room, the pointer decides, not the device or a width:

- **A coarse pointer** (a touch screen; `(pointer: coarse)`): the row scrolls sideways, without a scrollbar, a fade at each edge where more of it waits, read from the row's scroll. A swipe is the way along it; the cut-off control at the edge and the fade say there is more. The focus ring of a control in the row sits inside its edge, since a scroll container would clip a ring around it.
- **A fine pointer** (a mouse, a trackpad): the tools the row has no room for fold into More, one icon at the row's end, in a menu under it, with the same icon, label, and action each. What fits is measured, never counted: the row's width, the category menu's as rendered, and each tool's (`src/lib/overflow.ts`), the tools leaving from the right end first (clear all, redo, undo, then Display, Units, the calculator), the category menu never. A wider window shows them again.
- **The category menu rises to the top layer** while open, as a popover placed over its trigger, so a scrolling row, which clips what opens inside it, cannot cut it off, and nothing covers it; a browser without popovers opens it in place as before.
- The tools are declared once (`ToolbarTool`, `TableLayout`) and drawn as buttons on the row or as items of More; a tool folded away hands focus back to More when its panel closes, so focus always lands on something shown.

Nothing changes while the row has room, which is every ordinary desktop window.

## Alternatives considered

- **Keep the wrap.** Costs nothing while scrolling, but a stuck block two lines tall on a phone, and the second line is the one least needed.
- **A sideways scroll everywhere.** Natural with a finger, awkward with a wheel or a trackpad, where a menu is the convention; and a desktop at 400 % zoom, 320 px wide with a mouse, is the case WCAG's reflow rule exists for, where a menu is the accessible answer.
- **An overflow menu everywhere.** Sean finds overflow menus a poor fit for a phone with seven controls, where a swipe shows everything at once.
- **Deciding by width or device.** A phone in landscape, a tablet with a trackpad, and a zoomed desktop each break a width rule; the pointer is what the two behaviors are about.
- **The category menu through a portal** rather than the top layer. A portal reparents the menu, which the toolbar's roving focus and the menu's own containment checks rely on not happening; the popover keeps the DOM and escapes the clip.

## Consequences

- One toolbar line in the stuck head at every size; the head's measured offset for a wrapped line is gone.
- Two behaviors to maintain and test, by pointer: the Pixel project exercises the scroll, the desktop project More, each at a phone's width.
- The More menu is a design-system component (`MoreMenu`, in the gallery), a dropdown under an icon trigger, the fluid shells' third shape.
- A test or a probe that presses a right-end tool at a phone's width with a fine pointer opens More first (`pressTool` in `e2e/support.ts`).
- The sixty-ninth pass's reasons against the scroll stand corrected in part: WCAG's reflow rule lists toolbars kept in view as an allowed exception, and the top layer answers the clipping; discoverability is answered by the fade and the cut-off control.
