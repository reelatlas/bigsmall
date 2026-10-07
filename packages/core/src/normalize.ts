/**
 * Canonical forms for matching typed text against unit and category keys.
 * The search index, matched-letter spans (highlight.ts), and the registry integrity test all use
 * these, so a collision in the test means a collision the user would hit.
 */

const DEGREE_SIGNS = /[°º˚]/g;
const COMBINING_MARKS = /\p{M}+/gu;
const PERIODS = /\./g;
const WHITESPACE = /\s+/g;

/**
 * Normalize a key or query:
 * - degree signs removed ("°F" → "F", "℃" → "C")
 * - Unicode compatibility decomposition ("²" → "2", "µ" → "μ"), then accents stripped
 * - lowercased, "μ" → "u" ("µm" → "um")
 * - abbreviation periods removed ("fl. oz." → "fl oz")
 * - whitespace collapsed to single spaces and trimmed
 */
export function normalizeKey(input: string): string {
  return input
    .replace(DEGREE_SIGNS, '')
    .normalize('NFKD')
    .replace(DEGREE_SIGNS, '')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/μ/g, 'u')
    .replace(PERIODS, '')
    .replace(WHITESPACE, ' ')
    .trim();
}

/** normalizeKey with every space removed, so "fl oz", "floz", and "fl  oz" compare equal. */
export function compactKey(input: string): string {
  return normalizeKey(input).replace(/ /g, '');
}
