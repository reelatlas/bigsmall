/**
 * The page's planes (docs/UX-SPEC.md §8, ADR 0014): the header's toolbar, the converter's
 * toolbar, and the box with its table, top to bottom, each a [data-plane]. ↑ and ↓ move between
 * them, round from end to end, landing on a toolbar's stop or the box. The inline script in
 * layouts/Base.astro does the moving and receives this event's name through define:vars; an
 * island hands a move over with stepPlane once its own ↑ and ↓ run out.
 */
export const PLANE_EVENT = 'bigsmall:plane';

/** Moves focus from `from`'s plane to the one above (-1) or below (1), round from end to end. */
export function stepPlane(from: Element, step: 1 | -1): void {
  from.dispatchEvent(new CustomEvent(PLANE_EVENT, { bubbles: true, detail: step }));
}
