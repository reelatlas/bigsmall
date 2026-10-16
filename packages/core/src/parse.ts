import { DEFAULT_SEPARATORS, type Separators } from './locale';

/** What the user typed, split into the number or arithmetic (if any) and the unit query (if any). */
export interface ParsedInput {
  raw: string;
  /** The number the text starts with, or the value of the arithmetic it starts with ("5+3" is 8). */
  value?: number;
  /** The exact substring read as the number or the arithmetic, a trailing operator included. */
  valueText?: string;
  /** Whatever followed the number, trimmed, original case. The whole text when there is no number. */
  query?: string;
  /**
   * Set when the text holds an amount a double cannot hold, and `value` is then absent: 'large'
   * beyond about ±1.8e308 ("1e400", or arithmetic that overflows), 'small' when a nonzero amount
   * rounds to zero ("1e-400", "1e-200 × 1e-200").
   */
  outOfRange?: 'large' | 'small';
  /**
   * Set when the arithmetic has no answer, and `value` is then absent: 'divide-by-zero' ("5 ÷ 0",
   * "0^-1"), or 'not-real' for a power with no real value ("(-8)^0.5").
   */
  invalid?: 'divide-by-zero' | 'not-real';
  /** Set when the value comes from arithmetic rather than one number, so the UI can show it. */
  expression?: true;
  /** Where the exponent markers ("e" or "E") sit within `valueText`, so the UI can set them apart. */
  exponentMarks?: number[];
  /**
   * The number exactly as typed, when the text is one number rather than arithmetic: its digits in
   * canonical form, a period decimal, no grouping, and an E exponent ("1,000.50" is "1000.50"), so
   * a URL can keep digits a double would round ("123456789012345678").
   */
  canonical?: string;
}

// Characters that are easy to get wrong as escapes, so they are named once.
const NBSP = String.fromCharCode(0x00a0);
const NARROW_NBSP = String.fromCharCode(0x202f);
const UNICODE_MINUS = String.fromCharCode(0x2212);
const TIMES = String.fromCharCode(0x00d7);
const DIVIDE = String.fromCharCode(0x00f7);
const RIGHT_QUOTE = String.fromCharCode(0x2019);
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

type Operator = 'add' | 'subtract' | 'multiply' | 'divide' | 'power';

/** Arithmetic by the character typed: ASCII, and the signs the calculator writes (− × ÷). */
const OPERATORS: Readonly<Record<string, Operator>> = {
  '+': 'add',
  '-': 'subtract',
  [UNICODE_MINUS]: 'subtract',
  '*': 'multiply',
  [TIMES]: 'multiply',
  '/': 'divide',
  [DIVIDE]: 'divide',
  '^': 'power',
};

const SIGNS = new Set(['+', '-', UNICODE_MINUS]);
const DIGITS = '[0-9]+';
const SEPARATOR = `[.,${NBSP}${NARROW_NBSP}]`;
const ENDS_A_NUMBER = `[ ${NBSP}${NARROW_NBSP})+*/^${TIMES}${DIVIDE}${UNICODE_MINUS}-]`;

/**
 * One unsigned number (arithmetic reads the signs): digit groups split by ".", ",", or a
 * non-breaking space, an optional exponent, and a decimal mark still waiting for its digits
 * ("5." on the way to 5.5) when only space, an operator, or the end follows it.
 */
const NUMBER = new RegExp(
  `(?:${DIGITS}(?:${SEPARATOR}${DIGITS})*|[.,]${DIGITS})(?:[eE][+${UNICODE_MINUS}-]?${DIGITS})?(?:[.,](?=$|${ENDS_A_NUMBER}))?`,
  'y',
);
const ANY_SEPARATOR = new RegExp(SEPARATOR, 'g');
const TRAILING_MARK = /[.,]$/;
const EXPONENT_MARK = /[eE]/;
const NONZERO_DIGIT = /[1-9]/;

type NumberToken = { kind: 'number'; text: string; start: number; value: number };
type Token =
  | NumberToken
  | { kind: 'sign'; negative: boolean }
  | { kind: 'operator'; operator: Operator }
  | { kind: 'open' }
  | { kind: 'close' };

/**
 * Parse one box's text. Lenient by design (docs/UX-SPEC.md §2): spacing never matters, both
 * "1,000.5" and "1.000,5" work, a lone separator is read the way the locale would write it unless
 * the digits make that reading impossible ("1,5" is 1.5 everywhere), and the number can be
 * arithmetic ("2 × 3 ft", "(5 + 7) / 2 cm", "2^10 bytes").
 */
export function parse(text: string, separators: Separators = DEFAULT_SEPARATORS): ParsedInput {
  const trimmed = text.trim();
  if (!trimmed) return { raw: text };

  // Scanned in a readable copy, mapped back to the typed text, so the number and the query keep
  // the characters that were typed.
  const read = readable(trimmed, separators.exponent);
  const marked = readableSeparators(separators);
  const scanned = scan(read.text, marked);
  if (!scanned) return { raw: text, query: trimmed };

  const end = read.at[scanned.end] ?? trimmed.length;
  const result: ParsedInput = { raw: text, valueText: trimmed.slice(0, end) };
  const numbers = scanned.tokens.filter((token): token is NumberToken => token.kind === 'number');
  const marks = numbers.flatMap((token) => {
    const at = token.text.search(EXPONENT_MARK);
    return at >= 0 ? [read.at[token.start + at] ?? token.start + at] : [];
  });
  if (marks.length > 0) result.exponentMarks = marks;

  const evaluation = evaluate(scanned.tokens);
  if (evaluation.operations > 0) result.expression = true;
  const roundedToZero = numbers.some(
    (token) => token.value === 0 && NONZERO_DIGIT.test(token.text.split(EXPONENT_MARK)[0] ?? ''),
  );
  if (numbers.some((token) => !Number.isFinite(token.value))) result.outOfRange = 'large';
  else if (evaluation.divideByZero) result.invalid = 'divide-by-zero';
  else if (evaluation.notReal) result.invalid = 'not-real';
  else if (!Number.isFinite(evaluation.value)) result.outOfRange = 'large';
  else if (evaluation.value === 0 && (evaluation.underflow || roundedToZero)) {
    result.outOfRange = 'small';
  } else result.value = evaluation.value;

  const [only] = numbers;
  if (result.value !== undefined && !result.expression && only && numbers.length === 1) {
    const signs = scanned.tokens.filter((token) => token.kind === 'sign' && token.negative);
    result.canonical = `${signs.length % 2 === 1 ? '-' : ''}${canonicalNumber(only.text, marked)}`;
  }

  const rest = trimmed.slice(end).trim();
  if (rest) result.query = rest;
  return result;
}

/**
 * Read the arithmetic the text starts with: numbers joined by + − × ÷ ^ (or * and /), with signs
 * and parentheses, stopping where something else begins, which is the unit query. An operator,
 * sign, or "(" at the very end stays part of it, because the user is still typing. Null when the
 * text does not start with a number.
 */
function scan(text: string, separators: Separators): { tokens: Token[]; end: number } | null {
  const tokens: Token[] = [];
  let i = 0;
  let end = 0;
  let complete = 0;
  let depth = 0;
  let expectOperand = true;

  for (;;) {
    i = skipSpace(text, i);
    const char = text[i];
    if (char === undefined) {
      if (expectOperand) end = text.length;
      break;
    }
    if (expectOperand) {
      if (char === '(') {
        tokens.push({ kind: 'open' });
        depth += 1;
        i += 1;
        continue;
      }
      if (SIGNS.has(char)) {
        tokens.push({ kind: 'sign', negative: char !== '+' });
        i += 1;
        continue;
      }
      const number = numberAt(text, i);
      if (number === null) {
        // "5 × (ft": the arithmetic ends after its last complete part.
        tokens.length = complete;
        break;
      }
      tokens.push({ kind: 'number', text: number, start: i, value: toNumber(number, separators) });
      i += number.length;
      expectOperand = false;
    } else if (char === ')' && depth > 0) {
      tokens.push({ kind: 'close' });
      depth -= 1;
      i += 1;
    } else {
      const operator = OPERATORS[char];
      const next = skipSpace(text, i + 1);
      // An operator joins the arithmetic only before another operand or at the very end, so
      // "5 -ft" is the number 5 and the query "-ft".
      if (!operator || (next < text.length && !startsOperand(text, next))) break;
      tokens.push({ kind: 'operator', operator });
      i += 1;
      expectOperand = true;
      continue;
    }
    end = i;
    complete = tokens.length;
  }

  return tokens.some((token) => token.kind === 'number') ? { tokens, end } : null;
}

/** A readable copy of typed text, and where each of its characters was typed. */
interface Readable {
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
function readable(typed: string, exponent: string | undefined): Readable {
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
function readableSeparators(separators: Separators): Separators {
  const read = (mark: string) =>
    mark === ARABIC_DECIMAL ? '.' : mark === ARABIC_GROUP ? ',' : mark;
  return { decimal: read(separators.decimal), group: read(separators.group) };
}

function skipSpace(text: string, from: number): number {
  let i = from;
  while (i < text.length && text[i]!.trim() === '') i += 1;
  return i;
}

function numberAt(text: string, at: number): string | null {
  NUMBER.lastIndex = at;
  return NUMBER.exec(text)?.[0] ?? null;
}

function startsOperand(text: string, at: number): boolean {
  const char = text[at]!;
  return char === '(' || SIGNS.has(char) || numberAt(text, at) !== null;
}

interface Evaluation {
  value: number;
  /** Operations performed; 0 means a single number, signed or not. */
  operations: number;
  divideByZero: boolean;
  /** A power with no real value, such as a negative number to the power of a half. */
  notReal: boolean;
  /** A product, quotient, or power of nonzero amounts rounded to zero. */
  underflow: boolean;
}

/**
 * The value of scanned arithmetic: ^ first (from the right, and before a sign, so −2^2 is −4),
 * then × and ÷, then + and −. Unfinished input is read as far as it goes: a trailing operator,
 * sign, or "(" is ignored and open parentheses close at the end, so "5 +" is 5 and "(5 + 3" is 8
 * while the user types.
 */
function evaluate(scanned: readonly Token[]): Evaluation {
  let length = scanned.length;
  while (length > 0 && !['number', 'close'].includes(scanned[length - 1]!.kind)) length -= 1;
  const tokens = scanned.slice(0, length);
  const result: Evaluation = {
    value: 0,
    operations: 0,
    divideByZero: false,
    notReal: false,
    underflow: false,
  };
  let at = 0;

  function apply(left: number, operator: Operator, right: number): number {
    result.operations += 1;
    switch (operator) {
      case 'add':
        return left + right;
      case 'subtract':
        return left - right;
      case 'multiply': {
        const value = left * right;
        if (value === 0 && left !== 0 && right !== 0) result.underflow = true;
        return value;
      }
      case 'divide': {
        if (right === 0) {
          result.divideByZero = true;
          return Number.NaN;
        }
        const value = left / right;
        if (value === 0 && left !== 0) result.underflow = true;
        return value;
      }
      case 'power': {
        if (left === 0 && right < 0) {
          result.divideByZero = true;
          return Number.NaN;
        }
        const value = left ** right;
        if (Number.isNaN(value)) result.notReal = true;
        else if (value === 0 && left !== 0) result.underflow = true;
        return value;
      }
    }
  }

  function primary(): number {
    const token = tokens[at];
    at += 1;
    if (token?.kind === 'open') {
      const value = sum();
      if (tokens[at]?.kind === 'close') at += 1;
      return value;
    }
    return token?.kind === 'number' ? token.value : Number.NaN;
  }

  /** A power reads its exponent as a signed power, so 2^-3 works and 2^3^2 is 2^9. */
  function power(): number {
    const base = primary();
    const token = tokens[at];
    if (token?.kind !== 'operator' || token.operator !== 'power') return base;
    at += 1;
    return apply(base, 'power', signed());
  }

  function signed(): number {
    const token = tokens[at];
    if (token?.kind !== 'sign') return power();
    at += 1;
    return token.negative ? -signed() : signed();
  }

  function product(): number {
    let value = signed();
    for (let token = tokens[at]; token?.kind === 'operator'; token = tokens[at]) {
      if (token.operator !== 'multiply' && token.operator !== 'divide') break;
      at += 1;
      value = apply(value, token.operator, signed());
    }
    return value;
  }

  function sum(): number {
    let value = product();
    for (let token = tokens[at]; token?.kind === 'operator'; token = tokens[at]) {
      at += 1;
      value = apply(value, token.operator, product());
    }
    return value;
  }

  result.value = sum();
  return result;
}

/** The number the text spells, which may be Infinity or a zero that underflowed; parse() judges the range. */
function toNumber(text: string, separators: Separators): number {
  return Number(canonicalNumber(text, separators));
}

/** A typed number's digits in canonical form: a period decimal, no grouping, an E exponent. */
function canonicalNumber(text: string, separators: Separators): string {
  let body = text.replace(TRAILING_MARK, '').split(UNICODE_MINUS).join('-');
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
