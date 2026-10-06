import type { Separators } from './locale';

/** What the user typed, split into the number (if any) and the unit query (if any). */
export interface ParsedInput {
  raw: string;
  /** Parsed number, when the text starts with one. */
  value?: number;
  /** The exact substring read as the number, for highlighting. */
  valueText?: string;
  /** Whatever followed the number, trimmed, original case. The whole text when there is no number. */
  query?: string;
}

const DEFAULT_SEPARATORS: Separators = { decimal: '.', group: ',' };

// Characters that are easy to get wrong as escapes, so they are named once.
const NBSP = String.fromCharCode(0x00a0);
const NARROW_NBSP = String.fromCharCode(0x202f);
const UNICODE_MINUS = String.fromCharCode(0x2212);

const SIGN = `[+${UNICODE_MINUS}-]?`;
const DIGITS = '[0-9]+';
const SEPARATOR = `[.,${NBSP}${NARROW_NBSP}]`;

/** Leading number: optional sign (ASCII or Unicode minus), digit groups split by ".", ",", or a non-breaking space, optional exponent. */
const LEADING_NUMBER = new RegExp(
  `^${SIGN}(?:${DIGITS}(?:${SEPARATOR}${DIGITS})*|[.,]${DIGITS})(?:[eE]${SIGN}${DIGITS})?`,
);
const ANY_SEPARATOR = new RegExp(SEPARATOR, 'g');

/**
 * Parse one box's text. Lenient by design (docs/UX-SPEC.md §2 and §13):
 * spacing never matters, both "1,000.5" and "1.000,5" work, and a lone separator is read the way
 * the locale would write it unless the digits make that reading impossible ("1,5" is 1.5 everywhere).
 */
export function parse(text: string, separators: Separators = DEFAULT_SEPARATORS): ParsedInput {
  const trimmed = text.trim();
  if (!trimmed) return { raw: text };

  const match = LEADING_NUMBER.exec(trimmed);
  if (!match) return { raw: text, query: trimmed };

  const valueText = match[0];
  const rest = trimmed.slice(valueText.length).trim();
  const value = toNumber(valueText, separators);

  const result: ParsedInput = { raw: text, valueText };
  if (value !== undefined) result.value = value;
  if (rest) result.query = rest;
  return result;
}

function toNumber(text: string, separators: Separators): number | undefined {
  let body = text.split(UNICODE_MINUS).join('-');
  let exponent = '';
  const expIndex = body.search(/[eE]/);
  if (expIndex >= 0) {
    exponent = body.slice(expIndex + 1);
    body = body.slice(0, expIndex);
  }

  let sign = '';
  if (body.startsWith('-') || body.startsWith('+')) {
    sign = body.startsWith('-') ? '-' : '';
    body = body.slice(1);
  }

  const decimalIndex = findDecimal(body, separators);
  const integerPart = (decimalIndex >= 0 ? body.slice(0, decimalIndex) : body).replace(
    ANY_SEPARATOR,
    '',
  );
  const fractionPart =
    decimalIndex >= 0 ? body.slice(decimalIndex + 1).replace(ANY_SEPARATOR, '') : '';

  const canonical = `${sign}${integerPart || '0'}${fractionPart ? `.${fractionPart}` : ''}${exponent ? `e${exponent}` : ''}`;
  const value = Number(canonical);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * Index of the decimal separator in `body`, or -1 when every separator is a group separator.
 * - Two different separator characters: the last one is the decimal ("1,234.5" and "1.234,5").
 * - One character used more than once: grouping ("1,000,000").
 * - One character used once: the locale decides, except that a tail that is not exactly 3 digits
 *   can only be a fraction ("1,5" is 1.5 even in en-US), and non-breaking spaces always group.
 */
function findDecimal(body: string, separators: Separators): number {
  const found = [...body.matchAll(ANY_SEPARATOR)].map((m) => ({ char: m[0], index: m.index }));
  if (found.length === 0) return -1;

  const last = found[found.length - 1]!;
  const distinct = new Set(found.map((f) => f.char));
  if (distinct.size > 1) return last.index;
  if (found.length > 1) return -1;

  const tailLength = body.length - last.index - 1;
  if (last.char === NBSP || last.char === NARROW_NBSP) return -1;
  if (last.char === separators.decimal) return last.index;
  return tailLength === 3 ? -1 : last.index;
}
