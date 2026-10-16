import { shuffle } from './sketches';

/**
 * The sketchbook's changes that step frame by frame, like the name's split-flap letters (Glitch,
 * Scramble, Scan), planned here and drawn by motion.ts, a new frame every frameMs. However fast
 * the frames come, a change swaps a tile's whole picture once, and what changes between frames
 * is at most a quarter of the tile (FLICKER_SHARE), so nothing on the page strobes, a whole grid
 * flipping included (WCAG 2.3.1). Pure; tested in node.
 */

/** The most of a tile's area that may change from one frame to the next. */
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

/** A glitch's strength at frame `k` of `count`: rising to the middle, where the picture changes, then settling. */
export function envelope(k: number, count: number): number {
  return Math.sin((Math.PI * (k + 0.5)) / count);
}

/**
 * One frame of a glitch: one to three bands, each in its own third of the tile so none overlap,
 * together at most FLICKER_SHARE of it, shifted as far as the envelope and `strength` allow.
 */
export function glitchFrame(
  k: number,
  count: number,
  strength: number,
  random: () => number,
): GlitchFrame {
  const power = envelope(k, count) * strength;
  const zones = 1 + Math.floor(random() * 3);
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

/** A band of a tile as a clip-path, reaching past its sides so a split edge still shows. */
export function bandClip({ top, height }: Pick<Band, 'top' | 'height'>): string {
  return `inset(${pct(top)} -10% ${pct(1 - top - height)} -10%)`;
}

/**
 * The tile with its bands cut out, as a clip-path reaching past its sides: each band a loop of its
 * own, which the even-odd rule makes a hole, joined to the outline along its left side.
 */
export function cutClip(bands: readonly Pick<Band, 'top' | 'height'>[]): string {
  const [left, right] = ['-10%', '110%'];
  const points = [`${left} -10%`, `${right} -10%`, `${right} 110%`, `${left} 110%`, `${left} -10%`];
  for (const { top, height } of bands) {
    const [upper, lower] = [pct(top), pct(top + height)];
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
export const drawnClip = (drawn: number) => `inset(0 0 ${pct(1 - drawn)} 0)`;

/** One block of the Scramble grid as a clip-path. */
export function blockClip(block: number): string {
  const size = 1 / BLOCKS;
  const x = (block % BLOCKS) * size;
  const y = Math.floor(block / BLOCKS) * size;
  return `inset(${pct(y)} ${pct(1 - x - size)} ${pct(1 - y - size)} ${pct(x)})`;
}

/**
 * Blocks of the Scramble grid as one clip-path: each a loop from the corner and back along the
 * same line, which the even-odd rule leaves out, so the blocks show and the lines do not.
 */
export function blocksClip(blocks: readonly number[]): string {
  if (blocks.length === 0) return 'inset(50%)';
  const size = 1 / BLOCKS;
  const points = ['0% 0%'];
  for (const block of blocks) {
    const x = (block % BLOCKS) * size;
    const y = Math.floor(block / BLOCKS) * size;
    const [left, right, top, bottom] = [pct(x), pct(x + size), pct(y), pct(y + size)];
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
