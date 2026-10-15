import { flushSync } from 'react-dom';

/**
 * A change to what the table shows, as a glide (docs/UX-SPEC.md §3; docs/DESIGN-SYSTEM.md,
 * "Motion"; Sean, 2026-10-15). Where each part of the table sits is measured, the change rendered
 * at once (flushSync), and each part that moved slides from where it was to where it is: a unit
 * keeps its key wherever it is, its row or its line in Hidden, so one checked in Hidden travels to
 * its row and the rows around it make room or close up; a part new to the table fades in. The
 * parts carry data attributes (ConversionTable). The rows themselves move, so the page stays
 * usable throughout: a view transition, which moves pictures of them, takes no clicks while it
 * runs (docs/LEARNINGS.md, "A view transition takes no clicks"). Its pace is the theme's
 * --motion-slow, which reduced motion zeroes, so then the change just happens.
 */

/** What moves, and the key that follows each part from one place to the other. */
const MOVING: ReadonlyArray<readonly [selector: string, key: (element: HTMLElement) => string]> = [
  ['[data-row]', (element) => `unit:${element.dataset.row}`],
  ['label[data-unit]', (element) => `unit:${element.dataset.unit}`],
  ['[data-section]', (element) => `section:${element.dataset.section}`],
  ['[data-hidden-section]', (element) => `hidden:${element.dataset.hiddenSection}`],
  ['[data-table-foot]', () => 'foot'],
];

function parts(root: HTMLElement): Map<string, HTMLElement> {
  const found = new Map<string, HTMLElement>();
  for (const [selector, key] of MOVING) {
    for (const element of root.querySelectorAll<HTMLElement>(selector)) {
      found.set(key(element), element);
    }
  }
  return found;
}

/** Runs `change`, a state update, as a glide over the converter at `root`. */
export function glide(root: HTMLElement | null, change: () => void) {
  const card = root?.querySelector<HTMLElement>('[data-table-card]');
  const style = card && getComputedStyle(card);
  const duration = style ? Number.parseFloat(style.getPropertyValue('--motion-slow')) : 0;
  if (!root || !card || !style || !duration || typeof card.animate !== 'function') {
    change();
    return;
  }
  const easing = style.getPropertyValue('--motion-ease');
  const before = new Map(
    [...parts(root)].map(([key, element]) => [key, element.getBoundingClientRect()]),
  );
  flushSync(change);
  // What slides in from outside the card stays inside its edge on the way.
  card.animate([{ clipPath: 'inset(0)' }, { clipPath: 'inset(0)' }], { duration });
  for (const [key, element] of parts(root)) {
    const was = before.get(key);
    if (!was) {
      element.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing });
      continue;
    }
    const now = element.getBoundingClientRect();
    const x = was.left - now.left;
    const y = was.top - now.top;
    if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;
    element.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: 'none' }], {
      duration,
      easing,
    });
  }
}
