import { flushSync } from 'react-dom';
import { cssTime } from '../../lib/css-time';

/**
 * A change to what the table shows, as a glide (docs/UX-SPEC.md §3; docs/DESIGN-SYSTEM.md,
 * "Motion"; Sean, 2026-10-15). Where each part of the table sits on the page is measured, the
 * change rendered at once (flushSync), and each part that moved slides from where it was to where
 * it is: a unit keeps its key wherever it is, its row or its line in Hidden, so one checked in
 * Hidden travels to its row and the rows around it make room or close up; a part new to the table
 * fades in, and one that left fades out where it was, a copy of it laid over the page. Positions
 * are the page's, not the screen's, so the page scrolling as the table changes moves nothing. The
 * parts carry data attributes (ConversionTable). The rows themselves move, so the page stays
 * usable throughout: a view transition, which moves pictures of them, takes no clicks while it
 * runs (docs/LEARNINGS.md, "A view transition takes no clicks"). Its pace is the theme's
 * --motion-slow, which reduced motion zeroes, so then the change just happens, on --motion-glide,
 * an even curve: the theme's own easing does most of its travel in the first fifth, and a glide
 * then reads as a jump (Sean, 2026-10-15).
 */

/** What moves, and the key that follows each part from one place to the other. */
const MOVING: ReadonlyArray<readonly [selector: string, key: (element: HTMLElement) => string]> = [
  ['[data-row]', (element) => `unit:${element.dataset.row}`],
  ['label[data-unit]', (element) => `unit:${element.dataset.unit}`],
  ['[data-section]', (element) => `section:${element.dataset.section}`],
  ['[data-hidden-section]', (element) => `hidden:${element.dataset.hiddenSection}`],
  ['[data-table-foot]', () => 'foot'],
];

/**
 * The three beats of a glide, in its one length (Sean, 2026-10-15: what left lingered as a ghost
 * the rows slid through): what left is gone in the first 30 %, before anything slides over where
 * it was; what moved glides throughout; what is new waits for the second half, once what moved
 * out of its place has gone. Both fades are even (an animation's default), the offsets doing the
 * pacing.
 */
const LEAVING: Keyframe[] = [{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }];
const ARRIVING: Keyframe[] = [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }];

interface Place {
  element: HTMLElement;
  left: number;
  top: number;
  width: number;
  height: number;
  /**
   * The columns a row of the table's grid sat in, which a copy of it needs once it is out of the
   * grid: a subgrid's own columns read only "subgrid", so they are its grid's, resolved.
   */
  columns: string | null;
}

function parts(root: HTMLElement): Map<string, HTMLElement> {
  const found = new Map<string, HTMLElement>();
  for (const [selector, key] of MOVING) {
    for (const element of root.querySelectorAll<HTMLElement>(selector)) {
      found.set(key(element), element);
    }
  }
  return found;
}

/** The resolved columns of the nearest grid that is not a subgrid, for a row that is one. */
function columnsOf(element: HTMLElement): string | null {
  if (!getComputedStyle(element).gridTemplateColumns.startsWith('subgrid')) return null;
  for (let at = element.parentElement; at; at = at.parentElement) {
    const columns = getComputedStyle(at).gridTemplateColumns;
    if (columns !== 'none' && !columns.startsWith('subgrid')) return columns;
  }
  return null;
}

function placeOf(element: HTMLElement): Place {
  const box = element.getBoundingClientRect();
  return {
    element,
    left: box.left + window.scrollX,
    top: box.top + window.scrollY,
    width: box.width,
    height: box.height,
    columns: columnsOf(element),
  };
}

/** A part that left, copied where it was and faded out: never a field, a target, or a name to hear. */
function fadeOut(place: Place, duration: number) {
  const copy = place.element.cloneNode(true) as HTMLElement;
  for (const each of [copy, ...copy.querySelectorAll<HTMLElement>('[id]')])
    each.removeAttribute('id');
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  Object.assign(copy.style, {
    position: 'absolute',
    left: `${place.left}px`,
    top: `${place.top}px`,
    width: `${place.width}px`,
    height: `${place.height}px`,
    margin: '0',
    pointerEvents: 'none',
  });
  if (place.columns) copy.style.gridTemplateColumns = place.columns;
  document.body.append(copy);
  const remove = () => copy.remove();
  copy.animate(LEAVING, { duration }).finished.then(remove, remove);
}

/** Runs `change`, a state update, as a glide over the converter at `root`. */
export function glide(root: HTMLElement | null, change: () => void) {
  const card = root?.querySelector<HTMLElement>('[data-table-card]');
  const style = card && getComputedStyle(card);
  const duration = style ? cssTime(style.getPropertyValue('--motion-slow')) : 0;
  if (!root || !card || !style || !duration || typeof card.animate !== 'function') {
    change();
    return;
  }
  const timing = { duration, easing: style.getPropertyValue('--motion-glide') };
  const before = new Map([...parts(root)].map(([key, element]) => [key, placeOf(element)]));
  flushSync(change);
  const after = parts(root);
  // What slides in from outside the card stays inside its edge on the way.
  card.animate([{ clipPath: 'inset(0)' }, { clipPath: 'inset(0)' }], { duration });
  for (const [key, element] of after) {
    const was = before.get(key);
    if (!was) {
      element.animate(ARRIVING, { duration });
      continue;
    }
    const now = placeOf(element);
    const x = was.left - now.left;
    const y = was.top - now.top;
    if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;
    element.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: 'none' }], timing);
  }
  for (const [key, place] of before) {
    if (!after.has(key)) fadeOut(place, duration);
  }
}
