import { MINUS } from './format';
import type { Separators } from './locale';

/**
 * How a typed number is read (docs/UX-SPEC.md §2): the characters, the regexes, and the readable
 * copy of typed text the parser and the compound reader share (parse.ts, compound.ts). Lenient by
 * design: any script's digits, both decimal marks, a clock's colon, an exponent.
 */

// Characters that are easy to get wrong as escapes, so they are named once (the minus in
// format.ts).
/** The no-break space, named once (an amount and its symbol stay on one line in the web). */
export const NBSP = String.fromCharCode(0x00a0);
export const NARROW_NBSP = String.fromCharCode(0x202f);
export const TIMES = String.fromCharCode(0x00d7);
export const DIVIDE = String.fromCharCode(0x00f7);
export const RIGHT_QUOTE = String.fromCharCode(0x2019);
const ARABIC_DECIMAL = String.fromCharCode(0x066b);
const ARABIC_GROUP = String.fromCharCode(0x066c);
/** The marks that set a run's direction, which Intl writes around a minus sign in some scripts. */
const DIRECTION_MARKS = new Set([0x200e, 0x200f, 0x061c].map((code) => String.fromCharCode(code)));

/** Fullwidth forms, as a Japanese or Chinese keyboard types them, sit this far above ASCII. */
const FULLWIDTH = { first: 0xff01, last: 0xff5e, offset: 0xfee0 } as const;
const DECIMAL_DIGIT = /\p{Nd}/u;
const LETTERS = /^\p{L}+$/u;
/** An apostrophe between a digit and a group of exactly three: grouping, as Swiss numbers write. */
const GROUPING_APOSTROPHE = new RegExp(`([0-9])['${RIGHT_QUOTE}](?=[0-9]{3}(?![0-9]))`, 'g');

/** A sign before a number: plus, the hyphen, or the typographic minus. */
export const SIGNS = new Set(['+', '-', MINUS]);
const DIGITS = '[0-9]+';
const SEPARATOR = `[.,${NBSP}${NARROW_NBSP}]`;
const ENDS_A_NUMBER = `[ ${NBSP}${NARROW_NBSP})+*/^${TIMES}${DIVIDE}${MINUS}-]`;

/**
 * One unsigned number (arithmetic reads the signs): digit groups split by ".", ",", or a
 * non-breaking space, an optional exponent, and a decimal mark still waiting for its digits
 * ("5." on the way to 5.5) when only space, an operator, or the end follows it.
 */
const NUMBER = new RegExp(
  `(?:${DIGITS}(?:${SEPARATOR}${DIGITS})*|[.,]${DIGITS})(?:[eE][+${MINUS}-]?${DIGITS})?(?:[.,](?=$|${ENDS_A_NUMBER}))?`,
  'y',
);
/**
 * A time written as a clock writes it, each part sixtieths of the one before: "5:30" is 5 and 30
 * sixtieths, a pace's minutes and seconds ("5:30 /km") or an hour and a half ("1:30 h"), and
 * "1:05:30" has three parts. Every part after the first is two digits under 60. Read before a
 * plain number, so its digits are not taken for one.
 */
const CLOCK = /[0-9]+(?::[0-5][0-9]){1,2}(?![0-9])/y;
const ANY_SEPARATOR = new RegExp(SEPARATOR, 'g');
const TRAILING_MARK = /[.,]$/;
export const EXPONENT_MARK = /[eE]/;

/** A readable copy of typed text, and where each of its characters was typed. */
export interface Readable {
  text: string;
  /** The typed index of each character of `text`, then the typed text's length. */
  at: number[];
}

/**
 * The text as the scanner reads it, each character mapped back to where it was typed: any
 * script's digits as ASCII (١٢٣ and १२३ are 123), fullwidth forms as ASCII (１２．５ is 12.5), the
 * Arabic decimal and group marks as a period and a comma, direction marks dropped, a locale's
 * exponent written in letters (Arabic's أس) as E, and an apostrophe between digit groups of three
 * as grouping (1'234'567), while 5'10 keeps its own.
 */
export function readable(typed: string, exponent: string | undefined): Readable {
  let text = '';
  const at: number[] = [];
  let index = 0;
  for (const char of typed) {
    const read = DIRECTION_MARKS.has(char) ? '' : readableChar(char);
    for (let unit = 0; unit < read.length; unit += 1) at.push(index + unit);
    text += read;
    index += char.length;
  }
  at.push(typed.length);
  if (exponent && exponent.toUpperCase() !== 'E' && LETTERS.test(exponent)) {
    for (let from = text.indexOf(exponent); from >= 0; from = text.indexOf(exponent, from + 1)) {
      if (from === 0 || !/[0-9.,]/.test(text[from - 1] ?? '')) continue;
      text = `${text.slice(0, from)}E${text.slice(from + exponent.length)}`;
      at.splice(from + 1, exponent.length - 1);
    }
  }
  text = text.replace(GROUPING_APOSTROPHE, (_, digit: string) => `${digit}${NARROW_NBSP}`);
  return { text, at };
}

function readableChar(char: string): string {
  const code = char.charCodeAt(0);
  // A character outside the basic plane is two units long, and stays as typed to keep the length.
  if (code < 0x80 || char.length > 1) return char;
  if (code >= FULLWIDTH.first && code <= FULLWIDTH.last) {
    return String.fromCharCode(code - FULLWIDTH.offset);
  }
  if (char === ARABIC_DECIMAL) return '.';
  if (char === ARABIC_GROUP) return ',';
  return DECIMAL_DIGIT.test(char) ? String(digitValue(code)) : char;
}

/** A decimal digit's value: how far it sits from the zero that starts its run of ten. */
function digitValue(code: number): number {
  let zero = code;
  while (DECIMAL_DIGIT.test(String.fromCharCode(zero - 1))) zero -= 1;
  return (code - zero) % 10;
}

/** The locale's marks as readable() writes them: the Arabic ones as a period and a comma. */
export function readableSeparators(separators: Separators): Separators {
  const read = (mark: string) =>
    mark === ARABIC_DECIMAL ? '.' : mark === ARABIC_GROUP ? ',' : mark;
  return { decimal: read(separators.decimal), group: read(separators.group) };
}

export function skipSpace(text: string, from: number): number {
  let i = from;
  while (i < text.length && text[i]!.trim() === '') i += 1;
  return i;
}

/** The number, or the clock, written at `at` in readable text, or null where none starts there. */
export function numberAt(text: string, at: number): string | null {
  CLOCK.lastIndex = at;
  const clock = CLOCK.exec(text)?.[0];
  if (clock) return clock;
  NUMBER.lastIndex = at;
  return NUMBER.exec(text)?.[0] ?? null;
}

/**
 * The number the text spells, which may be Infinity or a zero that underflowed; the caller judges
 * the range.
 */
export function toNumber(text: string, separators: Separators): number {
  if (text.includes(':')) {
    // A clock: each part sixtieths of the one before ("5:30" is 5.5, "1:05:30" 1.0916…).
    return text.split(':').reduce((value, part, at) => value + Number(part) / 60 ** at, 0);
  }
  return Number(canonicalNumber(text, separators));
}

/** A typed number's digits in canonical form: a period decimal, no grouping, an E exponent. */
export function canonicalNumber(text: string, separators: Separators): string {
  let body = text.replace(TRAILING_MARK, '').split(MINUS).join('-');
  let exponent = '';
  const expIndex = body.search(EXPONENT_MARK);
  if (expIndex >= 0) {
    exponent = body.slice(expIndex + 1);
    body = body.slice(0, expIndex);
  }

  const decimalIndex = findDecimal(body, separators);
  const integerPart = (decimalIndex >= 0 ? body.slice(0, decimalIndex) : body).replace(
    ANY_SEPARATOR,
    '',
  );
  const fractionPart =
    decimalIndex >= 0 ? body.slice(decimalIndex + 1).replace(ANY_SEPARATOR, '') : '';

  return `${integerPart || '0'}${fractionPart ? `.${fractionPart}` : ''}${exponent ? `E${exponent}` : ''}`;
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
