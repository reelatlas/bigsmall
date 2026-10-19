# 0025 — The page opts out of scroll anchoring: what must stay put is kept by hand, in every engine

Date: 2026-10-18
Status: accepted

## Context

Browsers disagree on scroll anchoring, the adjustment that keeps the content in view still when something above it changes height. Chrome anchors by a heuristic the page cannot steer; Safari does not anchor at all. The converter changes the page above what is being read often: a table swapped for another category, Edit's list for the rows, a side panel opening or closing between the box and the table below md, the formulas' categories folding, About's tabs switching. Each case had been held in place by hand for Safari (`keeping` and `useKept`, `src/lib/keeping.ts`), as a stand-in to retire once Safari anchored, while Chrome was left to its own. On 2026-10-18 Chrome's anchoring itself misbehaved: closing a panel under the stuck head pulled the page up by the panel's height, so the head slid down out of its place; a script measured the head after the browser had anchored and scrolled the page back. Sean asked for the platform's way where it exists and a stable system over a one-off fix.

## Decision

The page opts out of scroll anchoring, `overflow-anchor: none` on `html` in the base layer of `global.css`. What must stay put across a change above it is kept by hand through `keeping` and `useKept`, the one mechanism in every engine; the by-hand nudge after a panel's close is gone. The pattern is recorded in `docs/DESIGN-SYSTEM.md`, "Stuck layers".

## Alternatives considered

- **Keep the nudge.** A fix per case, each measuring after the browser had moved the page; the next change above the rows would need its own.
- **Opt out the converter's grid alone.** Chrome then picks its anchor outside the grid, the footer when it is in view, and the rows still move; and two engines would still behave two ways on the rest of the page.
- **Wait for Safari to anchor.** No date, and Chrome's heuristic would still decide what moves.

## Consequences

- One behavior in Chrome and Safari: nothing moves the page that the page did not ask for. The suite's WebKit projects had already proved the no-anchoring world, since Safari never anchored.
- A change that should keep a part in place goes through `keeping` or `useKept`, in every engine; a change that forgets to shows the same way everywhere, and the browser suite catches it in Chromium too.
- `keeping` is no longer a stand-in with a retirement date; its docblock and the design system say so.
