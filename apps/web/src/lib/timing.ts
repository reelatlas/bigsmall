/**
 * Every UI timing in one place. Code and tests import these instead of repeating numbers, and the
 * inline script in layouts/Base.astro receives the header-menu ones through define:vars.
 * Behavior is described in docs/UX-SPEC.md.
 */

/** Longest pause between two keystrokes in one box that still belong to one typing chunk (§9). */
export const TYPING_CHUNK_MS = 700;

/** How long after the last change the URL is rewritten (§11). */
export const URL_WRITE_MS = 250;

/** How long after the last change the result is announced to screen readers (§7). */
export const ANNOUNCE_MS = 600;

/** The copy check shows at least this long, so a quick click-and-move still shows it (§7). */
export const COPIED_MIN_MS = 1000;

/** Without a mouse resting on the copy button (keyboard, touch), the check reverts after this (§7). */
export const COPIED_MS = 2000;

/** One frame at 60 Hz: the wordmark times its pace against it, and a flipping letter never changes faster. */
export const FRAME_MS = 1000 / 60;

/** However fast the pointer moves, the wordmark's letters land at least this far apart. */
export const WORDMARK_MIN_STEP_MS = 4;

/**
 * The header wordmark (docs/UX-SPEC.md §1). Wordmark.astro hands these to its motion code;
 * /dev/wordmark-lab tunes them, and keeps the ones that shipped before as presets.
 */
export const WORDMARK_TIMING = {
  /** The resting pace while hovered, and the fastest it may go. */
  restMs: 2000,
  fastMs: 110,
  /** The first change after the pointer arrives comes this soon, so the header answers at once. */
  firstMs: 250,
  /** At rest, how far apart the letters land in a change, and how often a flipping letter changes. */
  stepMs: 45,
  flipMs: 34,
  /** On a touch screen, a tap on the heading plays the wordmark this long. */
  tapMs: 4000,
} as const;

/**
 * The sketchbook at play (docs/UX-SPEC.md §14, the About page), which /dev/sketchbook-lab tunes:
 * how soon a hovered tile first changes, how long each sketch shows while it stays hovered, how
 * long a change takes, how far apart the tiles start in a shuffle, and, above 0, how often a tile
 * changes by itself.
 */
export const SKETCHBOOK_TIMING = {
  firstMs: 150,
  holdMs: 900,
  swapMs: 560,
  waveMs: 60,
  idleMs: 0,
} as const;
