import { describe, expect, it } from 'vitest';
import type { CalculatorKey } from '../src/components/Calculator';
import {
  evaluatedText,
  placeNumber,
  pressKey,
  type CalculatorEnv,
} from '../src/features/converter/calculator';
import { EMPTY_CALC, type CalculatorState } from '../src/features/converter/state';

const EN: CalculatorEnv = { separators: { decimal: '.', group: ',' }, locale: 'en-US' };
const DE: CalculatorEnv = { separators: { decimal: ',', group: '.' }, locale: 'de-DE' };
const MINUS = String.fromCharCode(0x2212);
const TIMES = String.fromCharCode(0x00d7);
const DIVIDE = String.fromCharCode(0x00f7);

const typed = (text: string): CalculatorState => ({ text, fresh: false });
const evaluated = (text: string): CalculatorState => ({ text, fresh: true });
const press = (entry: CalculatorState, key: CalculatorKey, env = EN) =>
  pressKey(entry, key, env)?.text ?? null;

describe('pressKey', () => {
  it('adds digits to the entry, and starts over right after =', () => {
    expect(press(typed('12'), '3')).toBe('123');
    expect(press(EMPTY_CALC, '7')).toBe('7');
    expect(press(evaluated('36'), '5')).toBe('5');
  });

  it('writes the visitor’s decimal mark once per number, as 0. at the start of one', () => {
    expect(press(typed('5'), 'decimal')).toBe('5.');
    expect(press(typed('5'), 'decimal', DE)).toBe('5,');
    expect(press(typed('5.2'), 'decimal')).toBeNull();
    expect(press(EMPTY_CALC, 'decimal')).toBe('0.');
    expect(press(typed(`5.2${TIMES}`), 'decimal')).toBe(`5.2${TIMES}0.`);
    expect(press(evaluated('3.5'), 'decimal')).toBe('0.');
  });

  it('carries a result on with an operator, and lets a second operator replace the first', () => {
    expect(press(evaluated('1.5'), 'multiply')).toBe(`1.5${TIMES}`);
    expect(press(typed('5+'), 'divide')).toBe(`5${DIVIDE}`);
    expect(press(typed(`5${TIMES}`), 'subtract')).toBe(`5${TIMES}${MINUS}`);
    expect(press(typed(`5${TIMES}${MINUS}`), 'add')).toBe('5+');
    expect(press(typed('2'), 'power')).toBe('2^');
    expect(press(typed('2^'), 'subtract')).toBe(`2^${MINUS}`);
    expect(press(typed('2^'), 'multiply')).toBe(`2${TIMES}`);
  });

  it('starts an entry with a minus only', () => {
    expect(press(EMPTY_CALC, 'subtract')).toBe(MINUS);
    expect(press(EMPTY_CALC, 'add')).toBeNull();
    expect(press(typed(MINUS), '4')).toBe(`${MINUS}4`);
  });

  it('writes E as times ten to the power of, once per number', () => {
    expect(press(typed('1.5'), 'exponent')).toBe('1.5E');
    expect(press(EMPTY_CALC, 'exponent')).toBe('1E');
    expect(press(typed('1E'), 'exponent')).toBeNull();
    expect(press(typed(`1E${MINUS}3`), 'exponent')).toBeNull();
    expect(press(evaluated('36'), 'exponent')).toBe('36E');
    // An exponent waiting for digits takes a sign and nothing else.
    expect(press(typed('1E'), 'subtract')).toBe(`1E${MINUS}`);
    expect(press(typed(`1E${MINUS}`), 'add')).toBe('1E+');
    expect(press(typed('1E'), 'multiply')).toBeNull();
    expect(press(typed('1E'), 'decimal')).toBeNull();
  });

  it('deletes the last character, and clears the entry', () => {
    expect(press(typed('123'), 'backspace')).toBe('12');
    expect(press(EMPTY_CALC, 'backspace')).toBeNull();
    expect(pressKey(typed('12+3'), 'clear', EN)).toEqual(EMPTY_CALC);
    expect(pressKey(EMPTY_CALC, 'clear', EN)).toBeNull();
  });

  it('turns arithmetic into its value with =, which the next digit replaces', () => {
    expect(pressKey(typed('12+3'), 'equals', EN)).toEqual(evaluated('15'));
    expect(press(typed('2^10'), 'equals')).toBe('1,024');
    expect(press(typed('15'), 'equals')).toBeNull();
    expect(press(typed('5/0'), 'equals')).toBeNull();
  });
});

describe('placeNumber', () => {
  const SEP = EN.separators;

  it('replaces the number a box holds and keeps unit text typed after it', () => {
    expect(placeNumber('5', false, '36', SEP)).toBe('36');
    expect(placeNumber('5 ft', false, '36', SEP)).toBe('36 ft');
    expect(placeNumber('2+3 ft', false, '36', SEP)).toBe('36 ft');
  });

  it('fills an empty box, or one holding only unit text', () => {
    expect(placeNumber('', false, '36', SEP)).toBe('36');
    expect(placeNumber('ft', false, '36', SEP)).toBe('36 ft');
    expect(placeNumber(MINUS, false, '36', SEP)).toBe('36');
  });

  it('replaces a converted result outright', () => {
    expect(placeNumber('1,056.688', true, '36', SEP)).toBe('36');
  });
});

describe('evaluatedText', () => {
  it('formats the value the way results are, in the visitor’s locale', () => {
    expect(evaluatedText('1/3', EN)).toBe('0.3333333333');
    expect(evaluatedText('1000*2', EN)).toBe('2,000');
    expect(evaluatedText('1000*2', DE)).toBe('2.000');
    expect(evaluatedText('2 × 3 ft', EN)).toBe('6 ft');
  });
});
