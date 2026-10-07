import { formatNumber, parse, type ParsedInput, type Separators } from '@bigsmall/core';
import type { CalculatorKey } from '../../components/Calculator';
import { EMPTY_CALC, type CalculatorState, type NoAnswer } from './state';

/**
 * The calculator's rules (docs/UX-SPEC.md §8, "The calculator"): what each key does to its own
 * entry, and how a number goes into a box. Pure, so every rule is unit-tested in node.
 */

export interface CalculatorEnv {
  separators: Separators;
  locale: string | undefined;
}

const MINUS = String.fromCharCode(0x2212);
const TIMES = String.fromCharCode(0x00d7);
const DIVIDE = String.fromCharCode(0x00f7);

/** The sign each operator key writes: the typographic ones, which the parser reads like + - * /. */
const SIGN = { add: '+', subtract: MINUS, multiply: TIMES, divide: DIVIDE, power: '^' } as const;
const OPERATOR_CHARS = new Set(['+', '-', MINUS, '*', TIMES, '/', DIVIDE, '^']);
/** Operators after which − starts a negative number instead of replacing them. */
const TAKES_A_SIGN = new Set(['*', TIMES, '/', DIVIDE, '^']);
/** A number whose exponent is still waiting for its digits: 1E, or 1E− with its sign. */
const OPEN_EXPONENT = /[eE]$/;
const OPEN_EXPONENT_SIGN = new RegExp('[eE][+' + MINUS + '-]$');

type OperatorKey = keyof typeof SIGN;

function isOperatorKey(key: CalculatorKey): key is OperatorKey {
  return key in SIGN;
}

/** A value formatted the way results are, in the visitor's locale. */
export function formatValue(value: number, env: CalculatorEnv): string {
  return formatNumber(value, env.locale ? { locale: env.locale } : {});
}

/**
 * What = and Enter turn arithmetic into: its value, formatted the way results are, with any unit
 * query typed after it kept. Null when the text is not arithmetic, or has no value ("5 ÷ 0").
 */
export function evaluatedText(text: string, env: CalculatorEnv): string | null {
  const parsed = parse(text, env.separators);
  if (!parsed.expression || parsed.value === undefined) return null;
  const value = formatValue(parsed.value, env);
  return parsed.query ? `${value} ${parsed.query}` : value;
}

/**
 * What the display says when the entry has no value to use: shorter than a box's "Too large to
 * convert", since nothing is being converted yet.
 */
const NO_VALUE: Record<NoAnswer, string> = {
  large: 'Too large',
  small: 'Too small',
  'divide-by-zero': 'Can’t divide by zero',
  'not-real': 'No real answer',
};

/**
 * Why the entry has no value, said in the display beside it: a number or a result beyond what a
 * double holds ("9^999", "1E400"), one that rounds to zero ("1E−400"), a division by zero, or a
 * power with no real value. Null when the entry has a value or is not a number yet.
 */
export function entryMessage(parsed: ParsedInput): string | null {
  const problem = parsed.outOfRange ?? parsed.invalid;
  return problem ? NO_VALUE[problem] : null;
}

/** = and C make a whole new entry, a step of their own; every other key is typing, chunked. */
export function isStepKey(key: CalculatorKey): boolean {
  return key === 'equals' || key === 'clear';
}

/**
 * The entry after one key, or null when the key changes nothing. The history decides what undo
 * and Escape take back (state.ts): typing keys are chunked like keystrokes in a box.
 */
export function pressKey(
  entry: CalculatorState,
  key: CalculatorKey,
  env: CalculatorEnv,
): CalculatorState | null {
  if (key === 'clear') return entry.text === '' ? null : EMPTY_CALC;
  if (key === 'equals') {
    const value = evaluatedText(entry.text, env);
    return value === null ? null : { text: value, fresh: true };
  }
  const next = edit(entry.text, key, entry.fresh, env.separators.decimal);
  return next === null ? null : { text: next, fresh: false };
}

/**
 * A box's text with its number replaced by `number`, or `number` added when it has none. The box
 * keeps its unit, which is not in the text, and any unit text typed after the number; a box
 * showing a converted result simply takes the number.
 */
export function placeNumber(
  text: string,
  showsResult: boolean,
  number: string,
  separators: Separators,
): string {
  if (showsResult) return number;
  const parsed = parse(text, separators);
  if (parsed.valueText !== undefined) return parsed.query ? `${number} ${parsed.query}` : number;
  // A lone sign or "(" is arithmetic waiting for its first number, which the new number replaces.
  const trimmed = text.trim();
  const waiting = [...trimmed].every((char) => OPERATOR_CHARS.has(char) || char === '(');
  return waiting ? number : `${number} ${trimmed}`;
}

function edit(
  text: string,
  key: Exclude<CalculatorKey, 'clear' | 'equals'>,
  fresh: boolean,
  mark: string,
): string | null {
  if (key === 'backspace') return text === '' ? null : text.slice(0, -1);
  if (key === 'exponent') {
    // E is times ten to the power of: one per number, and on its own it means 1E.
    const operand = lastOperand(text);
    if (/[eE]/.test(operand)) return null;
    return operand === '' ? `${text}1E` : `${text}E`;
  }
  if (key === 'decimal') {
    if (fresh) return `0${mark}`;
    const operand = lastOperand(text);
    if (operand.includes(mark) || /[eE]/.test(operand)) return null;
    return `${text}${operand === '' ? '0' : ''}${mark}`;
  }
  if (isOperatorKey(key)) {
    // Operators carry a result on, so they never start over.
    const base = text.trimEnd();
    // An exponent waiting for digits takes only a sign: 1E then − gives 1E−.
    const operand = lastOperand(base);
    if (OPEN_EXPONENT.test(operand) || OPEN_EXPONENT_SIGN.test(operand)) {
      if (key !== 'add' && key !== 'subtract') return null;
      const head = OPEN_EXPONENT.test(operand) ? base : base.slice(0, -1);
      return `${head}${SIGN[key]}`;
    }
    let start = base.length;
    while (start > 0 && OPERATOR_CHARS.has(base[start - 1]!)) start -= 1;
    const head = base.slice(0, start);
    const run = base.slice(start);
    if (head === '') return key === 'subtract' ? SIGN.subtract : null;
    // − after × or ÷ starts a negative number; any other second operator replaces the first.
    if (key === 'subtract' && TAKES_A_SIGN.has(run)) return `${base}${SIGN.subtract}`;
    return `${head}${SIGN[key]}`;
  }
  return fresh ? key : `${text}${key}`;
}

/** The number being typed: what follows the last operator or parenthesis, an exponent's sign included. */
function lastOperand(text: string): string {
  let start = text.length;
  while (start > 0) {
    const char = text[start - 1]!;
    const exponentSign =
      (char === '+' || char === '-' || char === MINUS) && /[eE]/.test(text[start - 2] ?? '');
    if (!exponentSign && (OPERATOR_CHARS.has(char) || char === '(' || char === ')')) break;
    start -= 1;
  }
  return text.slice(start).trim();
}
