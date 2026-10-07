import { formatNumber, parse, type Separators } from '@bigsmall/core';
import type { KeypadKey } from '../../components/Keypad';

/**
 * What the keypad's keys do to a box's text (docs/UX-SPEC.md §8, "The keypad"). Pure, so every
 * rule is unit-tested in node; the converter turns each edit into a history action.
 */

export interface KeypadEnv {
  separators: Separators;
  locale: string | undefined;
}

/** The box a press lands in: the text it shows, and whether that text is a result to start over from. */
export interface KeypadBox {
  text: string;
  showsResult: boolean;
}

/** A press as a change: typing, chunked like keystrokes, or a whole new text as its own step (= and C). */
export interface KeypadEdit {
  kind: 'type' | 'replace';
  text: string;
}

const MINUS = String.fromCharCode(0x2212);
const TIMES = String.fromCharCode(0x00d7);
const DIVIDE = String.fromCharCode(0x00f7);

/** The sign each operator key writes: the typographic ones, which the parser reads like + - * /. */
const SIGN = { add: '+', subtract: MINUS, multiply: TIMES, divide: DIVIDE } as const;
const OPERATOR_CHARS = new Set(['+', '-', MINUS, '*', TIMES, '/', DIVIDE]);
const MULTIPLYING = new Set(['*', TIMES, '/', DIVIDE]);

type OperatorKey = keyof typeof SIGN;

function isOperatorKey(key: KeypadKey): key is OperatorKey {
  return key in SIGN;
}

/**
 * What = and Enter turn arithmetic into: its value, formatted the way results are, with any unit
 * query typed after it kept. Null when the text is not arithmetic, or has no value ("5 ÷ 0").
 */
export function evaluatedText(text: string, env: KeypadEnv): string | null {
  const parsed = parse(text, env.separators);
  if (!parsed.expression || parsed.value === undefined) return null;
  const value = formatNumber(parsed.value, env.locale ? { locale: env.locale } : {});
  return parsed.query ? `${value} ${parsed.query}` : value;
}

/** The box's text after one key, or null when the key changes nothing. */
export function pressKey(box: KeypadBox, key: KeypadKey, env: KeypadEnv): KeypadEdit | null {
  if (key === 'clear') return box.text === '' ? null : { kind: 'replace', text: '' };
  if (key === 'equals') {
    const value = box.showsResult ? null : evaluatedText(box.text, env);
    return value === null ? null : { kind: 'replace', text: value };
  }
  // The keypad edits the number; a unit query typed after it stays where it is.
  const { number, tail } = box.showsResult
    ? { number: box.text, tail: '' }
    : split(box.text, env.separators);
  const next = edit(number, key, box.showsResult, env.separators.decimal);
  return next === null ? null : { kind: 'type', text: `${next}${tail}` };
}

function edit(
  number: string,
  key: Exclude<KeypadKey, 'clear' | 'equals'>,
  fresh: boolean,
  mark: string,
): string | null {
  if (key === 'backspace') return number === '' ? null : number.slice(0, -1);
  if (key === 'decimal') {
    if (fresh) return `0${mark}`;
    const operand = lastOperand(number);
    if (operand.includes(mark)) return null;
    return `${number}${operand === '' ? '0' : ''}${mark}`;
  }
  if (isOperatorKey(key)) {
    // Operators carry a result on, so they never start over.
    const base = number.trimEnd();
    let start = base.length;
    while (start > 0 && OPERATOR_CHARS.has(base[start - 1]!)) start -= 1;
    const head = base.slice(0, start);
    const run = base.slice(start);
    if (head === '') return key === 'subtract' ? SIGN.subtract : null;
    // − after × or ÷ starts a negative number; any other second operator replaces the first.
    if (key === 'subtract' && MULTIPLYING.has(run)) return `${base}${SIGN.subtract}`;
    return `${head}${SIGN[key]}`;
  }
  return fresh ? key : `${number}${key}`;
}

/** Splits a box's text into the number or arithmetic the keypad edits and a unit query after it. */
function split(text: string, separators: Separators): { number: string; tail: string } {
  const parsed = parse(text, separators);
  if (parsed.valueText !== undefined) {
    return { number: parsed.valueText, tail: parsed.query ? ` ${parsed.query}` : '' };
  }
  const trimmed = text.trim();
  // A lone sign or "(" is arithmetic waiting for its first number, not a unit query.
  const waiting = [...trimmed].every((char) => OPERATOR_CHARS.has(char) || char === '(');
  if (waiting) return { number: trimmed, tail: '' };
  return { number: '', tail: ` ${trimmed}` };
}

/** The number being typed: what follows the last operator or parenthesis. */
function lastOperand(number: string): string {
  let start = number.length;
  while (start > 0) {
    const char = number[start - 1]!;
    if (OPERATOR_CHARS.has(char) || char === '(' || char === ')') break;
    start -= 1;
  }
  return number.slice(start).trim();
}
