import { readCompound, type Compound } from './compound';
import { MINUS } from './format';
import { DEFAULT_SEPARATORS, type Separators } from './locale';
import {
  canonicalNumber,
  DIVIDE,
  EXPONENT_MARK,
  numberAt,
  readable,
  readableSeparators,
  SIGNS,
  skipSpace,
  TIMES,
  toNumber,
} from './number';

export { NBSP } from './number';

/**
 * What the user typed, split into the number or arithmetic (if any) and the unit query (if any).
 */
export interface ParsedInput {
  raw: string;
  /**
   * The number the text starts with, or the value of the arithmetic it starts with ("5+3" is 8),
   * or of the compound it starts with, in its pair's first part ("5 ft 11 in" is 5.916… feet).
   */
  value?: number;
  /**
   * The exact substring read as the number, the arithmetic (a trailing operator included), or the
   * compound.
   */
  valueText?: string;
  /**
   * Whatever followed the number, trimmed, original case. The whole text when there is no
   * number.
   */
  query?: string;
  /**
   * Set when the text holds an amount a double cannot hold, and `value` is then absent: 'large'
   * beyond about ±1.8e308 ("1e400", or arithmetic that overflows), 'small' when a nonzero amount
   * rounds to zero ("1e-400", "1e-200 × 1e-200").
   */
  outOfRange?: 'large' | 'small';
  /**
   * Set when the arithmetic has no answer, and `value` is then absent: 'divide-by-zero' ("5 ÷ 0",
   * "0^-1"), or 'not-real' for a power with no real value ("(−8)^0.5").
   */
  invalid?: 'divide-by-zero' | 'not-real';
  /** Set when the value comes from arithmetic rather than one number, so the UI can show it. */
  expression?: true;
  /**
   * Where the exponent markers ("e" or "E") sit within `valueText`, so the UI can set them
   * apart.
   */
  exponentMarks?: number[];
  /**
   * The number exactly as typed, when the text is one number rather than arithmetic: its digits in
   * canonical form, a period decimal, no grouping, and an E exponent ("1,000.50" is "1000.50"), so
   * a URL can keep digits a double would round ("123456789012345678"); a clock as typed ("5:30");
   * a compound in its pair's own words ("5 ft 11 in"), which reads back as the same value.
   */
  canonical?: string;
  /**
   * Set when the text starts with a quantity in two or three units of one kind (ADR 0026;
   * compound.ts): "5'11", "5 ft 11 in", "11 st 4", "1h30", "45° 30′ 15″". The value is then in the
   * pair's first part, and the pair is the unit the text names.
   */
  compound?: Compound;
}

type Operator = 'add' | 'subtract' | 'multiply' | 'divide' | 'power';

/** Arithmetic by the character typed: ASCII, and the signs the calculator writes (− × ÷). */
const OPERATORS: Readonly<Record<string, Operator>> = {
  '+': 'add',
  '-': 'subtract',
  [MINUS]: 'subtract',
  '*': 'multiply',
  [TIMES]: 'multiply',
  '/': 'divide',
  [DIVIDE]: 'divide',
  '^': 'power',
};

const NONZERO_DIGIT = /[1-9]/;

/**
 * Words people type around a quantity that name no unit (docs/UX-SPEC.md §2; the demand map's
 * compound worker, 2026-10-19): a question's start before a number ("how tall is 180 cm",
 * "convert 5 ft 11 in"), and "tall" or "high" after it ("5'11 tall"), with a question mark. Each
 * is dropped only beside a number, so a word still being typed on its own stays a query.
 */
const LEADING_NOISE = new RegExp(
  `^(?:how\\s+(?:tall|heavy|far|long|much|big|hot|cold|fast|old)\\s+is|what\\s+is|what's|convert)\\s+(?=[0-9.,+(${MINUS}-])`,
  'iu',
);
const TRAILING_NOISE = /\s+(?:tall|high)$/iu;

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
 * the digits make that reading impossible ("1,5" is 1.5 everywhere), the number can be
 * arithmetic ("2 × 3 ft", "(5 + 7) / 2 cm", "2^10 bytes"), and a quantity in two or three units
 * of one kind is read as one ("5'11", "11 st 4", "1h30"; compound.ts).
 */
export function parse(text: string, separators: Separators = DEFAULT_SEPARATORS): ParsedInput {
  const trimmed = text.trim();
  if (!trimmed) return { raw: text };
  const body = trimmed
    .replace(/\s*\?$/u, '')
    .replace(TRAILING_NOISE, '')
    .replace(LEADING_NOISE, '')
    .trim();
  if (!body) return { raw: text, query: trimmed };

  const compound = readCompound(body, separators);
  if (compound) {
    const result: ParsedInput = { raw: text, valueText: body.slice(0, compound.end) };
    if (Number.isFinite(compound.value)) {
      result.value = compound.value;
      result.canonical = compound.canonical;
    } else result.outOfRange = 'large';
    result.compound = { unit: compound.unit, parts: compound.parts };
    const rest = body.slice(compound.end).trim();
    if (rest) result.query = rest;
    return result;
  }

  // Scanned in a readable copy, mapped back to the typed text, so the number and the query keep
  // the characters that were typed.
  const read = readable(body, separators.exponent);
  const marked = readableSeparators(separators);
  const scanned = scan(read.text, marked);
  if (!scanned) return { raw: text, query: body };

  const end = read.at[scanned.end] ?? body.length;
  const result: ParsedInput = { raw: text, valueText: body.slice(0, end) };
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
    const digits = only.text.includes(':') ? only.text : canonicalNumber(only.text, marked);
    result.canonical = `${signs.length % 2 === 1 ? '-' : ''}${digits}`;
  }

  const rest = body.slice(end).trim();
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
