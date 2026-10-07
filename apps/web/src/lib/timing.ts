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

/** A mouse resting on a hover-enabled header menu opens it after this (§10). */
export const PEEK_OPEN_MS = 120;

/** A hover-opened header menu closes this long after the mouse leaves (§10). */
export const PEEK_CLOSE_MS = 200;

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
