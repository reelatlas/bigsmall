/**
 * Canonical forms for matching typed text against unit and category keys.
 * The search index, matched-letter spans (highlight.ts), and the registry integrity test all use
 * these, so a collision in the test means a collision the user would hit.
 */

/** The degree sign and its look-alikes: the masculine ordinal and the ring above. */
const DEGREE_LOOKALIKES = /[º˚]/g;
/** A degree sign before a letter ("°F", "° C") belongs to that letter's symbol. */
const DEGREE_BEFORE_LETTER = /°\s*(?=\p{L})/gu;
const COMBINING_MARKS = /\p{M}+/gu;
const PERIODS = /\./g;
const WHITESPACE = /\s+/g;

/**
 * Normalize a key or query:
 * - a degree sign before a letter removed ("°F" → "F", "℃" → "C"); alone it stays, the angle's
 *   degree ("45°"), and its look-alikes become it ("º" → "°")
 * - Unicode compatibility decomposition ("²" → "2", "µ" → "μ"), then accents stripped
 * - lowercased, "μ" → "u" ("µm" → "um")
 * - abbreviation periods removed ("fl. oz." → "fl oz")
 * - whitespace collapsed to single spaces and trimmed
 */
export function normalizeKey(input: string): string {
  return fold(input, true);
}

function fold(input: string, dropDegreeBeforeLetter: boolean): string {
  const dropDegree = (text: string) =>
    dropDegreeBeforeLetter ? text.replace(DEGREE_BEFORE_LETTER, '') : text;
  return dropDegree(dropDegree(input.replace(DEGREE_LOOKALIKES, '°')).normalize('NFKD'))
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

/**
 * A key's compact form with its degree sign kept ("°C" → "°c"), or null when it has none before
 * a letter. Search indexes it beside the compact form, so a typed "°" finds every scale whose
 * symbol starts with one, while "C" still finds Celsius.
 */
export function compactKeyWithDegree(input: string): string | null {
  const kept = fold(input, false).replace(/ /g, '');
  return kept === compactKey(input) ? null : kept;
}

/**
 * True when the character at `at` is a degree sign that folds away because a letter follows it
 * ("°F"), the one rule of normalizeKey that looks past a single character: highlighting pulls it
 * into a match that starts at the letter (highlight.ts).
 */
export function degreeBeforeLetter(text: string, at: number): boolean {
  return /^[°º˚]\s*\p{L}/u.test(text.slice(at));
}
