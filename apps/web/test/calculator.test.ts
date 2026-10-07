import { describe, expect, it } from 'vitest';
import {
  EMPTY_ENTRY,
  evaluatedText,
  placeNumber,
  pressKey,
  type CalculatorEnv,
} from '../src/features/converter/calculator';

const EN: CalculatorEnv = { separators: { decimal: '.', group: ',' }, locale: 'en-US' };
const DE: CalculatorEnv = { separators: { decimal: ',', group: '.' }, locale: 'de-DE' };
const MINUS = String.fromCharCode(0x2212);
const TIMES = String.fromCharCode(0x00d7);
const DIVIDE = String.fromCharCode(0x00f7);

const typed = (text: string) => ({ text, fresh: false });
const evaluated = (text: string) => ({ text, fresh: true });
const press = (
  entry: { text: string; fresh: boolean },
  key: Parameters<typeof pressKey>[1],
  env = EN,
) => pressKey(entry, key, env)?.text ?? null;

describe('pressKey', () => {
  it('adds digits to the entry, and starts over right after =', () => {
    expect(press(typed('12'), '3')).toBe('123');
    expect(press(EMPTY_ENTRY, '7')).toBe('7');
    expect(press(evaluated('36'), '5')).toBe('5');
  });

  it('writes the visitor’s decimal mark once per number, as 0. at the start of one', () => {
    expect(press(typed('5'), 'decimal')).toBe('5.');
    expect(press(typed('5'), 'decimal', DE)).toBe('5,');
    expect(press(typed('5.2'), 'decimal')).toBeNull();
    expect(press(EMPTY_ENTRY, 'decimal')).toBe('0.');
    expect(press(typed(`5.2${TIMES}`), 'decimal')).toBe(`5.2${TIMES}0.`);
    expect(press(evaluated('3.5'), 'decimal')).toBe('0.');
  });

  it('carries a result on with an operator, and lets a second operator replace the first', () => {
    expect(press(evaluated('1.5'), 'multiply')).toBe(`1.5${TIMES}`);
    expect(press(typed('5+'), 'divide')).toBe(`5${DIVIDE}`);
    expect(press(typed(`5${TIMES}`), 'subtract')).toBe(`5${TIMES}${MINUS}`);
    expect(press(typed(`5${TIMES}${MINUS}`), 'add')).toBe('5+');
  });

  it('starts an entry with a minus only', () => {
    expect(press(EMPTY_ENTRY, 'subtract')).toBe(MINUS);
    expect(press(EMPTY_ENTRY, 'add')).toBeNull();
    expect(press(typed(MINUS), '4')).toBe(`${MINUS}4`);
  });

  it('deletes the last character, and clears the entry', () => {
    expect(press(typed('123'), 'backspace')).toBe('12');
    expect(press(EMPTY_ENTRY, 'backspace')).toBeNull();
    expect(pressKey(typed('12+3'), 'clear', EN)).toEqual(EMPTY_ENTRY);
    expect(pressKey(EMPTY_ENTRY, 'clear', EN)).toBeNull();
  });

  it('turns arithmetic into its value with =, which the next digit replaces', () => {
    expect(pressKey(typed('12+3'), 'equals', EN)).toEqual({ text: '15', fresh: true });
    expect(pressKey(typed('15'), 'equals', EN)).toBeNull();
    expect(pressKey(typed('5/0'), 'equals', EN)).toBeNull();
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
