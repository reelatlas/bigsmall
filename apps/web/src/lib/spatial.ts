/**
 * Spatial navigation: which of a set of boxes an arrow key reaches from another, by where they sit
 * on screen rather than by an order or a count, so the same rule holds in any layout (the
 * calculator's keys, docs/UX-SPEC.md §8). Pure; tested in node.
 */

export type Direction = 'left' | 'right' | 'up' | 'down';

/** A box on screen, in the same coordinates for every box compared. */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Sub-pixel layout makes neighbors touch or overlap by a fraction; this much still counts as beside. */
const EDGE = 1;

const centerX = (box: Box) => (box.left + box.right) / 2;

/**
 * The box an arrow reaches from `from`: one wholly in that direction, never `from` itself. ← and →
 * stay in the row, so they take the nearest box beside `from`; ↑ and ↓ take the nearest row above
 * or below, and in it the box closest across to `goalX` (by default the middle of `from`), so
 * moving up and down keeps to a column even through a wide box. Null at an edge: nothing wraps.
 */
export function nextInDirection<T extends Box>(
  from: Box,
  boxes: readonly T[],
  direction: Direction,
  goalX: number = centerX(from),
): T | null {
  let best: T | null = null;
  let bestGap = Infinity;
  let bestAcross = Infinity;
  for (const box of boxes) {
    if (box === from) continue;
    let gap: number;
    let across = 0;
    if (direction === 'left' || direction === 'right') {
      const sameRow = box.top < from.bottom - EDGE && box.bottom > from.top + EDGE;
      gap = direction === 'right' ? box.left - from.right : from.left - box.right;
      if (!sameRow || gap < -EDGE) continue;
    } else {
      gap = direction === 'down' ? box.top - from.bottom : from.top - box.bottom;
      if (gap < -EDGE) continue;
      across = Math.abs(centerX(box) - goalX);
    }
    // The nearest first; within a row (gaps alike to the pixel), the closest across.
    const nearer = gap < bestGap - EDGE;
    const sameDistance = Math.abs(gap - bestGap) <= EDGE;
    if (nearer || (sameDistance && across < bestAcross)) {
      best = box;
      bestGap = nearer ? gap : Math.min(gap, bestGap);
      bestAcross = across;
    }
  }
  return best;
}
