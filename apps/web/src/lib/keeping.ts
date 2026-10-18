/**
 * Runs a change to the page, keeping `anchor` where it sat on the screen: the part being read stays
 * put as what is above or around it changes. Needed where the browser's own scroll anchoring does
 * not reach: WebKit has none, and clamps the scroll as a swap passes through a shorter page
 * (docs/LEARNINGS.md, "Safari scrolls to the top as a list is swapped", and 2026-10-18 on the tabs).
 * A change React renders goes in through `flushSync`, so it has happened when the anchor is read
 * again. The formulas' categories opening and closing, and the About page's tabs.
 */
export function keeping(anchor: Element | null | undefined, change: () => void) {
  const was = anchor?.getBoundingClientRect().top;
  change();
  if (!anchor || was === undefined) return;
  const moved = anchor.getBoundingClientRect().top - was;
  if (Math.abs(moved) >= 1) window.scrollBy(0, moved);
}
