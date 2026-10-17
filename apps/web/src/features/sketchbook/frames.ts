import { shuffle } from './sketches';

/**
 * The sketchbook's changes that step frame by frame, like the name's split-flap letters (Glitch,
 * Scramble, Scan), planned here and drawn by motion.ts, a new frame every frameMs. However fast
 * the frames come, a change swaps a tile's whole picture once, and each frame's bands, blocks, or
 * row cover at most a quarter of the tile (FLICKER_SHARE). From one frame to the next up to half
 * of it changes, one frame's bands leaving as the next's arrive, which at the shipped size, tiles
 * at most 128 px, keeps a whole grid flipping under WCAG 2.3.1's flash area (Sean kept the look,
 * 2026-10-15). Pure; tested in node.
 */

/** The most of a tile's area one frame's bands or blocks cover; twice it may change between two. */
export const FLICKER_SHARE = 0.25;

/** A horizontal slice of a tile, in fractions of its height, moved sideways `shift` tile widths. */
export interface Band {
  top: number;
  height: number;
  shift: number;
  /** For a frame it shows another sketch, as a flipping letter shows another glyph. */
  other: boolean;
}

export interface GlitchFrame {
  bands: Band[];
  /** How far the picture's edges split into the theme's colors, 0 to 1. */
  fringe: number;
}

/**
 * A glitch's strength at frame `k` of `count`: nothing at the first frame and the last, rising to
 * the middle, where the picture changes. The last frame is the new picture at rest, so the settle
 * after it paints nothing new: a last frame still shifted a pixel or two, with a fringe, snapped
 * (Sean, 2026-10-17). A change of two frames is a cut.
 */
export function envelope(k: number, count: number): number {
  // Exactly 0 at the ends: sin(π) is not, and a hair of power would still cut bands.
  if (k <= 0 || k >= count - 1) return 0;
  return Math.sin((Math.PI * k) / (count - 1));
}

/**
 * One frame of a glitch: one to three bands, each in its own third of the tile so none overlap,
 * together at most FLICKER_SHARE of it, shifted as far as the envelope and `strength` allow; at no
 * power, none, so the picture shows whole.
 */
export function glitchFrame(
  k: number,
  count: number,
  strength: number,
  random: () => number,
): GlitchFrame {
  const power = envelope(k, count) * strength;
  const zones = power > 0 ? 1 + Math.floor(random() * 3) : 0;
  const bands: Band[] = [];
  for (let zone = 0; zone < zones; zone++) {
    const height = (FLICKER_SHARE / zones) * (0.4 + 0.6 * random());
    const top = zone / zones + random() * (1 / zones - height);
    const shift = (random() < 0.5 ? -1 : 1) * (0.04 + 0.2 * random()) * power;
    bands.push({ top, height, shift, other: random() < 0.35 * power });
  }
  return { bands, fringe: power };
}

/** Blocks to a side: Scramble lands the next sketch in a grid of this many by this many. */
export const BLOCKS = 4;

/** The order Scramble lands its blocks in, at random. */
export function scrambleOrder(random: () => number): number[] {
  return shuffle(
    Array.from({ length: BLOCKS * BLOCKS }, (_, block) => block),
    random,
  );
}

/**
 * Scramble at `progress` (0 to 1): the blocks landed so far, and the next ones in its order,
 * flipping through other sketches before they land, never more than FLICKER_SHARE of the tile.
 */
export function scrambleFrame(
  order: readonly number[],
  progress: number,
): { landed: number[]; flipping: number[] } {
  const count = Math.min(order.length, Math.floor(progress * (order.length + 1)));
  const flipping = Math.floor(FLICKER_SHARE * order.length);
  return { landed: order.slice(0, count), flipping: order.slice(count, count + flipping) };
}

/** Rows Scan draws the next sketch in, top to bottom. */
export const SCAN_ROWS = 16;

/**
 * Scan at `progress` (0 to 1): how much of the tile, from the top, shows the next sketch, and the
 * bright row being drawn under it, jittering sideways, until the last row lands.
 */
export function scanFrame(
  progress: number,
  random: () => number,
): { drawn: number; row: Band | null } {
  const rows = Math.min(SCAN_ROWS, Math.floor(progress * (SCAN_ROWS + 1)));
  const drawn = rows / SCAN_ROWS;
  const row =
    rows < SCAN_ROWS
      ? { top: drawn, height: 1 / SCAN_ROWS, shift: (random() - 0.5) * 0.06, other: false }
      : null;
  return { drawn, row };
}

/** A fraction as a percentage, rounded so a clip-path stays short. */
const pct = (fraction: number) => `${Number((fraction * 100).toFixed(3))}%`;

/** A length in CSS px, rounded so a clip-path stays short. */
const px = (length: number) => `${Number(length.toFixed(3))}px`;

/**
 * Where a tile's fractions fall as a clip-path's lengths, each edge measured from the side it is
 * nearest: `top(f)` is the inset from the top to f of the height, `bottom(f)` the inset from the
 * bottom up to it, and so across. `over` asks for the edge `over` device pixels further out.
 *
 * Two clips that meet on a fractional device pixel are each antialiased there, and between them a
 * seam of what lies under shows: the canvas through Glitch's holes, the sketch leaving between
 * Scan's drawn part and its beam. A piece reaching a device pixel past the edge it shares covers
 * the seam, but where its own softened edge crosses a shape, the piece's ground tints the shape a
 * quarter. So an edge from a tile's measured box (`grainOf`) sits on the device's pixel grid, where
 * nothing is antialiased, and the piece on top reaches one device pixel past it, which still covers
 * the seam when the grid moves under the tile (a page scrolled to a fraction of a pixel). `PLAIN`
 * writes percentages, exact: for a clip that animates (Blinds) and for tests of a frame's shape
 * (docs/LEARNINGS.md, 2026-10-17).
 */
export interface Grain {
  top(fraction: number, over?: number): string;
  bottom(fraction: number, over?: number): string;
  left(fraction: number, over?: number): string;
  right(fraction: number, over?: number): string;
}

/** A tile's box on the page, in CSS px, as getBoundingClientRect gives it. */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Fractions as percentages, every edge exact. */
export const PLAIN: Grain = {
  top: pct,
  bottom: (fraction) => pct(1 - fraction),
  left: pct,
  right: (fraction) => pct(1 - fraction),
};

/**
 * A tile's grain from its box and the screen's device pixels per CSS px: each edge on the device
 * pixel nearest to where the fraction falls on the page, `over` device pixels further out.
 */
export function grainOf({ left, top, width, height }: Box, dpr: number): Grain {
  // Where a fraction of a side lands, snapped to the page's device pixels, as CSS px from the
  // side's start.
  const snap = (start: number, fraction: number, size: number, over: number) =>
    (Math.round((start + fraction * size) * dpr) + over) / dpr - start;
  return {
    top: (fraction, over = 0) => px(snap(top, fraction, height, -over)),
    bottom: (fraction, over = 0) => px(height - snap(top, fraction, height, over)),
    left: (fraction, over = 0) => px(snap(left, fraction, width, -over)),
    right: (fraction, over = 0) => px(width - snap(left, fraction, width, over)),
  };
}

/** How far a piece reaches past the edge it shares with another, in device pixels. */
export const OVER = 1;

/**
 * A band of a tile as a clip-path, reaching past its sides so a split edge still shows, and
 * `over` device pixels past its top and bottom, over the edges of the hole it fills.
 */
export function bandClip(
  { top, height }: Pick<Band, 'top' | 'height'>,
  grain: Grain = PLAIN,
  over = 0,
): string {
  return `inset(${grain.top(top, over)} -10% ${grain.bottom(top + height, over)} -10%)`;
}

/**
 * The top or bottom half of a tile as a clip-path (Flap), reaching `over` device pixels past the
 * middle. Flap gives the reach to the front's bottom half, under every other layer: where two
 * softened edges meet on a fraction of a pixel, the seam then shows the sketch leaving, never the
 * canvas, and nothing of it shows otherwise. The back's half and the halves that turn keep the
 * middle exact: a sliver of theirs past it would show as a line of the next sketch, or stay at a
 * hinge.
 */
export function halfClip(half: 'top' | 'bottom', grain: Grain = PLAIN, over = 0): string {
  return half === 'top'
    ? `inset(0 0 ${grain.bottom(0.5, over)} 0)`
    : `inset(${grain.top(0.5, over)} 0 0 0)`;
}

/**
 * The tile with its bands cut out, as a clip-path reaching past its sides: each band a loop of its
 * own, which the even-odd rule makes a hole, joined to the outline along its left side. The holes
 * are exact: the bands reach over their edges.
 */
export function cutClip(
  bands: readonly Pick<Band, 'top' | 'height'>[],
  grain: Grain = PLAIN,
): string {
  const [left, right] = ['-10%', '110%'];
  const points = [`${left} -10%`, `${right} -10%`, `${right} 110%`, `${left} 110%`, `${left} -10%`];
  for (const { top, height } of bands) {
    const [upper, lower] = [grain.top(top), grain.top(top + height)];
    points.push(
      `${left} ${upper}`,
      `${right} ${upper}`,
      `${right} ${lower}`,
      `${left} ${lower}`,
      `${left} ${upper}`,
      `${left} -10%`,
    );
  }
  return `polygon(evenodd, ${points.join(', ')})`;
}

/** The top of a tile, down to `drawn` of its height, as a clip-path. */
export const drawnClip = (drawn: number, grain: Grain = PLAIN) =>
  `inset(0 0 ${grain.bottom(drawn)} 0)`;

/**
 * One block of the Scramble grid as a clip-path, `over` device pixels past each side, over its
 * neighbors' edges.
 */
export function blockClip(block: number, grain: Grain = PLAIN, over = 0): string {
  const size = 1 / BLOCKS;
  const x = (block % BLOCKS) * size;
  const y = Math.floor(block / BLOCKS) * size;
  return `inset(${grain.top(y, over)} ${grain.right(x + size, over)} ${grain.bottom(y + size, over)} ${grain.left(x, over)})`;
}

/**
 * Blocks of the Scramble grid as one clip-path: each a loop from the corner and back along the
 * same line, which the even-odd rule leaves out, so the blocks show and the lines do not.
 */
export function blocksClip(blocks: readonly number[], grain: Grain = PLAIN): string {
  if (blocks.length === 0) return 'inset(50%)';
  const size = 1 / BLOCKS;
  const points = ['0% 0%'];
  for (const block of blocks) {
    const x = (block % BLOCKS) * size;
    const y = Math.floor(block / BLOCKS) * size;
    const [left, right, top, bottom] = [
      grain.left(x),
      grain.left(x + size),
      grain.top(y),
      grain.top(y + size),
    ];
    points.push(
      `${left} ${top}`,
      `${right} ${top}`,
      `${right} ${bottom}`,
      `${left} ${bottom}`,
      `${left} ${top}`,
      '0% 0%',
    );
  }
  return `polygon(evenodd, ${points.join(', ')})`;
}

/** Slats Blinds opens the next sketch through. */
export const SLATS = 6;

/**
 * Blinds open by `open` (0 to 1) as a clip-path: each slat shown from its top down, every one a
 * loop from the corner as in blocksClip, so shut and open have the same points and the change
 * between them animates.
 */
export function slatsClip(open: number): string {
  const points = ['0% 0%'];
  for (let slat = 0; slat < SLATS; slat++) {
    const [top, bottom] = [pct(slat / SLATS), pct((slat + open) / SLATS)];
    points.push(`0% ${top}`, `100% ${top}`, `100% ${bottom}`, `0% ${bottom}`, `0% ${top}`, '0% 0%');
  }
  return `polygon(evenodd, ${points.join(', ')})`;
}
