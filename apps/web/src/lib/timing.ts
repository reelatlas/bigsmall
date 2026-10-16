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
 * The sketchbook at play (docs/UX-SPEC.md §1, the About page), as Sean tuned it in
 * /dev/sketchbook-lab (v2, 2026-10-15): how soon a hovered tile first changes, how long each sketch
 * shows while it stays hovered, how long a change takes, how often a stepped change (Glitch,
 * Scramble, Scan) shows a new frame, as the name's Flip does for its letters, how far apart the
 * tiles start in a shuffle, and how long each tile waits after a change before it changes by
 * itself, a random time between idleMinMs and idleMaxMs, drawn afresh each time (both 0: never).
 */
export const SKETCHBOOK_TIMING = {
  firstMs: 40,
  holdMs: 900,
  swapMs: 480,
  frameMs: 24,
  waveMs: 60,
  idleMinMs: 2250,
  idleMaxMs: 5800,
} as const;

/**
 * The least time from the start of one change of a tile to the start of its next while it plays
 * by itself (hovered, pinned, or idle), so its whole picture never changes more than three times
 * a second, whatever the lab sets (WCAG 2.3.1).
 */
export const SKETCH_MIN_GAP_MS = 1000 / 3;

/**
 * The sketchbook's Flip button, pressed (features/sketchbook/burst.ts): how long its particles
 * last, the shortest and the longest of each mood, and the spread of their starts after a press.
 */
export const BURST_TIMING = {
  bubbles: { leastMs: 1300, mostMs: 2000 },
  feathers: { leastMs: 1800, mostMs: 2600 },
  sparkles: { leastMs: 700, mostMs: 1200 },
  confetti: { leastMs: 1400, mostMs: 2200 },
  hearts: { leastMs: 1500, mostMs: 2300 },
  ripples: { leastMs: 900, mostMs: 1400 },
  fireflies: { leastMs: 1800, mostMs: 2600 },
  marks: { leastMs: 1500, mostMs: 2300 },
  blossoms: { leastMs: 1800, mostMs: 2600 },
  spreadMs: 600,
} as const;
