import { formatNumber, parse, type Separators } from '@bigsmall/core';
import type { CalculatorKey } from '../../components/Calculator';

/**
 * The calculator's rules (docs/UX-SPEC.md §8, "The calculator"): what each key does to its own
 * entry, and how a number goes into a box. Pure, so every rule is unit-tested in node.
 */

export interface CalculatorEnv {
  separators: Separators;
  locale: string | undefined;
}

/** What the calculator's display holds. `fresh` is true right after =, when a digit starts over. */
export interface CalculatorEntry {
  text: string;
  fresh: boolean;
}

export const EMPTY_ENTRY: CalculatorEntry = { text: '', fresh: false };

const MINUS = String.fromCharCode(0x2212);
const TIMES = String.fromCharCode(0x00d7);
const DIVIDE = String.fromCharCode(0x00f7);

/** The sign each operator key writes: the typographic ones, which the parser reads like + - * /. */
const SIGN = { add: '+', subtract: MINUS, multiply: TIMES, divide: DIVIDE } as const;
const OPERATOR_CHARS = new Set(['+', '-', MINUS, '*', TIMES, '/', DIVIDE]);
const MULTIPLYING = new Set(['*', TIMES, '/', DIVIDE]);

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

/** The entry after one key, or null when the key changes nothing. */
export function pressKey(
  entry: CalculatorEntry,
  key: CalculatorKey,
  env: CalculatorEnv,
): CalculatorEntry | null {
  if (key === 'clear') return entry.text === '' ? null : EMPTY_ENTRY;
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
  if (key === 'decimal') {
    if (fresh) return `0${mark}`;
    const operand = lastOperand(text);
    if (operand.includes(mark)) return null;
    return `${text}${operand === '' ? '0' : ''}${mark}`;
  }
  if (isOperatorKey(key)) {
    // Operators carry a result on, so they never start over.
    const base = text.trimEnd();
    let start = base.length;
    while (start > 0 && OPERATOR_CHARS.has(base[start - 1]!)) start -= 1;
    const head = base.slice(0, start);
    const run = base.slice(start);
    if (head === '') return key === 'subtract' ? SIGN.subtract : null;
    // − after × or ÷ starts a negative number; any other second operator replaces the first.
    if (key === 'subtract' && MULTIPLYING.has(run)) return `${base}${SIGN.subtract}`;
    return `${head}${SIGN[key]}`;
  }
  return fresh ? key : `${text}${key}`;
}

/** The number being typed: what follows the last operator or parenthesis. */
function lastOperand(text: string): string {
  let start = text.length;
  while (start > 0) {
    const char = text[start - 1]!;
    if (OPERATOR_CHARS.has(char) || char === '(' || char === ')') break;
    start -= 1;
  }
  return text.slice(start).trim();
}
