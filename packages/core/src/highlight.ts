import { compactKey } from './normalize';

/** A run of characters in a label, as UTF-16 offsets: `text.slice(start, end)`. */
export interface TextSpan {
  start: number;
  end: number;
}

/**
 * Where a typed query appears in a label, under the same normalization search uses: case,
 * accents, spaces, periods, degree signs, and superscripts do not matter, so "floz" is found in
 * "fl oz", "m2" in "m²", and "fahr" in "Fahrenheit". Returns the first match, or null when the
 * label does not contain the query (a unit found through an alias, say). A degree sign right
 * before the match joins it, so "f" marks all of "°F".
 *
 * Each character is folded on its own and remembers where it came from, which is exact because
 * normalizeKey has no rule that spans characters except whitespace, which compactKey drops.
 */
export function matchSpan(text: string, query: string): TextSpan | null {
  const target = compactKey(query);
  if (!target) return null;

  let folded = '';
  /** For each character of `folded`, the offset in `text` of the character it came from. */
  const origin: number[] = [];
  /** Offsets of characters that fold to nothing, such as spaces, periods, and degree signs. */
  const ignorable = new Set<number>();
  for (let i = 0; i < text.length;) {
    const char = String.fromCodePoint(text.codePointAt(i) ?? 0);
    const piece = compactKey(char);
    if (piece === '') ignorable.add(i);
    for (let k = 0; k < piece.length; k += 1) origin.push(i);
    folded += piece;
    i += char.length;
  }

  const at = folded.indexOf(target);
  if (at < 0) return null;
  let start = origin[at] ?? 0;
  const last = origin[at + target.length - 1] ?? start;
  const end = last + String.fromCodePoint(text.codePointAt(last) ?? 0).length;

  // Pull in a symbol's own leading marks ("°" in "°F"), but never a space before a word.
  while (start > 0 && ignorable.has(start - 1) && (text[start - 1] ?? ' ').trim() !== '') {
    start -= 1;
  }
  return { start, end };
}
