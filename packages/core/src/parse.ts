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
}

// Characters that are easy to get wrong as escapes, so they are named once.
const NBSP = String.fromCharCode(0x00a0);
const NARROW_NBSP = String.fromCharCode(0x202f);
const UNICODE_MINUS = String.fromCharCode(0x2212);
const TIMES = String.fromCharCode(0x00d7);
const DIVIDE = String.fromCharCode(0x00f7);

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

  const scanned = scan(trimmed, separators);
  if (!scanned) return { raw: text, query: trimmed };

  const result: ParsedInput = { raw: text, valueText: trimmed.slice(0, scanned.end) };
  const numbers = scanned.tokens.filter((token): token is NumberToken => token.kind === 'number');
  const marks = numbers.flatMap((token) => {
    const at = token.text.search(EXPONENT_MARK);
    return at >= 0 ? [token.start + at] : [];
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

  const rest = trimmed.slice(scanned.end).trim();
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
 * then × and ÷, then + and −. Unfinished input is read as far as it
 * goes: a trailing operator, sign, or "(" is ignored and open parentheses close at the end, so
 * "5 +" is 5 and "(5 + 3" is 8 while the user types.
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

  const canonical = `${integerPart || '0'}${fractionPart ? `.${fractionPart}` : ''}${exponent ? `e${exponent}` : ''}`;
  return Number(canonical);
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
