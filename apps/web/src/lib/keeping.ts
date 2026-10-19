import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Runs a change to the page, keeping `anchor` where it sat on the screen: the part being read stays
 * put as what is above or around it changes. The browsers' own scroll anchoring would not do:
 * WebKit has none, and clamps the scroll as a swap passes through a shorter page
 * (docs/LEARNINGS.md, "Safari scrolls to the top as a list is swapped", and 2026-10-18 on the tabs),
 * and Chrome's is a heuristic the page cannot steer, which once pulled the page up as a panel
 * closed under a stuck head; so the page opts out of it (`overflow-anchor: none`, global.css, ADR
 * 0025), and this, with `useKept`, is the one way a part stays put, the same in every engine
 * (docs/DESIGN-SYSTEM.md, "Stuck layers"). A change React renders goes in through `flushSync`, so
 * it has happened when the anchor is read again. The formulas' categories opening and closing,
 * and the About page's tabs.
 */
export function keeping(anchor: Element | null | undefined, change: () => void) {
  const was = anchor?.getBoundingClientRect().top;
  change();
  if (!anchor || was === undefined) return;
  const moved = anchor.getBoundingClientRect().top - was;
  if (Math.abs(moved) >= 1) window.scrollBy(0, moved);
}

/**
 * The same for a change React renders on its own time: the hold this returns notes where the
 * anchor sits before the change is asked for (a dispatch, a setState), and the layout effect after
 * the next render scrolls by what it moved, before paint. The converter's box across a swap of its
 * table (TableLayout) and the table's card as Edit starts and ends (ConversionTable).
 */
export function useKept(anchor: RefObject<HTMLElement | null>) {
  const held = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (held.current === null) return;
    const was = held.current;
    held.current = null;
    const now = anchor.current?.getBoundingClientRect().top;
    if (now !== undefined && Math.abs(now - was) >= 1) window.scrollBy(0, now - was);
  });
  return () => {
    held.current = anchor.current?.getBoundingClientRect().top ?? null;
  };
}
