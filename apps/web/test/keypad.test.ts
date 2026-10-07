import { describe, expect, it } from 'vitest';
import { evaluatedText, pressKey, type KeypadEnv } from '../src/features/converter/keypad';

const EN: KeypadEnv = { separators: { decimal: '.', group: ',' }, locale: 'en-US' };
const DE: KeypadEnv = { separators: { decimal: ',', group: '.' }, locale: 'de-DE' };
const MINUS = String.fromCharCode(0x2212);
const TIMES = String.fromCharCode(0x00d7);
const DIVIDE = String.fromCharCode(0x00f7);

const typed = (text: string) => ({ text, showsResult: false });
const result = (text: string) => ({ text, showsResult: true });

describe('pressKey', () => {
  it('adds digits to what was typed, and starts over on a result', () => {
    expect(pressKey(typed('12'), '3', EN)).toEqual({ kind: 'type', text: '123' });
    expect(pressKey(typed(''), '7', EN)).toEqual({ kind: 'type', text: '7' });
    expect(pressKey(result('1.056688209'), '5', EN)).toEqual({ kind: 'type', text: '5' });
  });

  it('writes the visitor’s decimal mark once per number, as 0. at the start of one', () => {
    expect(pressKey(typed('5'), 'decimal', EN)).toEqual({ kind: 'type', text: '5.' });
    expect(pressKey(typed('5'), 'decimal', DE)).toEqual({ kind: 'type', text: '5,' });
    expect(pressKey(typed('5.2'), 'decimal', EN)).toBeNull();
    expect(pressKey(typed(''), 'decimal', EN)).toEqual({ kind: 'type', text: '0.' });
    expect(pressKey(typed(`5.2${TIMES}`), 'decimal', EN)).toEqual({
      kind: 'type',
      text: `5.2${TIMES}0.`,
    });
    expect(pressKey(result('3.5'), 'decimal', EN)).toEqual({ kind: 'type', text: '0.' });
  });

  it('carries a result on with an operator, and lets a second operator replace the first', () => {
    expect(pressKey(result('1.5'), 'multiply', EN)).toEqual({ kind: 'type', text: `1.5${TIMES}` });
    expect(pressKey(typed('5+'), 'divide', EN)).toEqual({ kind: 'type', text: `5${DIVIDE}` });
    expect(pressKey(typed(`5${TIMES}`), 'subtract', EN)).toEqual({
      kind: 'type',
      text: `5${TIMES}${MINUS}`,
    });
    expect(pressKey(typed(`5${TIMES}${MINUS}`), 'add', EN)).toEqual({ kind: 'type', text: '5+' });
  });

  it('starts a number with a minus only', () => {
    expect(pressKey(typed(''), 'subtract', EN)).toEqual({ kind: 'type', text: MINUS });
    expect(pressKey(typed(''), 'add', EN)).toBeNull();
    expect(pressKey(typed(MINUS), '4', EN)).toEqual({ kind: 'type', text: `${MINUS}4` });
  });

  it('edits the number and keeps a unit query typed after it', () => {
    expect(pressKey(typed('5 ft'), '0', EN)).toEqual({ kind: 'type', text: '50 ft' });
    expect(pressKey(typed('ft'), '2', EN)).toEqual({ kind: 'type', text: '2 ft' });
  });

  it('deletes the last character, and clears the whole box as a step of its own', () => {
    expect(pressKey(typed('123'), 'backspace', EN)).toEqual({ kind: 'type', text: '12' });
    expect(pressKey(typed(''), 'backspace', EN)).toBeNull();
    expect(pressKey(typed('12+3'), 'clear', EN)).toEqual({ kind: 'replace', text: '' });
    expect(pressKey(typed(''), 'clear', EN)).toBeNull();
  });

  it('turns arithmetic into its value with =, and leaves anything else alone', () => {
    expect(pressKey(typed('12+3'), 'equals', EN)).toEqual({ kind: 'replace', text: '15' });
    expect(pressKey(typed('15'), 'equals', EN)).toBeNull();
    expect(pressKey(typed('5/0'), 'equals', EN)).toBeNull();
    expect(pressKey(result('2'), 'equals', EN)).toBeNull();
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
