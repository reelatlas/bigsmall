/**
 * Keys that start typing in the converter's box when nothing on the page has focus (docs/UX-SPEC.md
 * §8): a letter, a digit, or what a number can start with. Not Space, which scrolls the page. The
 * island uses it, and the inline script in layouts/Base.astro receives its source through
 * define:vars, for keys typed before the island has loaded.
 */
export const STARTS_TYPING = /^[\p{L}\p{N}.,-]$/u;
