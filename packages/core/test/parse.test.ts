import { describe, expect, it } from 'vitest';
import { localeSeparators, parse } from '../src/index';
import type { Separators } from '../src/index';

const EN: Separators = { decimal: '.', group: ',' };
const DE: Separators = { decimal: ',', group: '.' };
const NBSP = String.fromCharCode(0x00a0);
const MINUS = String.fromCharCode(0x2212);

interface Case {
  text: string;
  separators?: Separators;
  value?: number;
  query?: string;
  valueText?: string;
}

const cases: Case[] = [
  { text: '5', value: 5 },
  { text: '5 ml', value: 5, query: 'ml' },
  { text: '5ml', value: 5, query: 'ml' },
  { text: '   5    ml   ', value: 5, query: 'ml' },
  { text: '5 fl oz', value: 5, query: 'fl oz' },
  { text: 'ml', query: 'ml' },
  { text: 'fluids', query: 'fluids' },
  { text: '-40 f', value: -40, query: 'f' },
  { text: `${MINUS}40 f`, value: -40, query: 'f' },
  { text: '+3 km', value: 3, query: 'km' },
  { text: '.5 in', value: 0.5, query: 'in' },
  { text: '1e3 m', value: 1000, query: 'm' },
  { text: '2.5E-3', value: 0.0025 },
  { text: '5e', value: 5, query: 'e' },
  { text: '1,000.5 km', separators: EN, value: 1000.5, query: 'km', valueText: '1,000.5' },
  { text: '1.000,5 km', separators: DE, value: 1000.5, query: 'km', valueText: '1.000,5' },
  { text: '1,234.56', separators: DE, value: 1234.56 },
  { text: '1.234,56', separators: EN, value: 1234.56 },
  { text: '1,000', separators: EN, value: 1000 },
  { text: '1,000', separators: DE, value: 1 },
  { text: '1.000', separators: EN, value: 1 },
  { text: '1.000', separators: DE, value: 1000 },
  { text: '1,5', separators: EN, value: 1.5 },
  { text: '1.5', separators: DE, value: 1.5 },
  { text: '1,50', separators: EN, value: 1.5 },
  { text: '1,000,000', separators: EN, value: 1e6 },
  { text: '1.000.000', separators: DE, value: 1e6 },
  { text: `1${NBSP}234,5`, separators: DE, value: 1234.5 },
  { text: '0', value: 0 },
  { text: '007', value: 7 },
];

describe('parse', () => {
  for (const c of cases) {
    it(`parses ${JSON.stringify(c.text)}${c.separators ? ` (${c.separators.decimal} decimal)` : ''}`, () => {
      const result = parse(c.text, c.separators);
      expect(result.raw).toBe(c.text);
      expect(result.value).toBe(c.value);
      expect(result.query).toBe(c.query);
      if (c.valueText !== undefined) expect(result.valueText).toBe(c.valueText);
    });
  }

  it('returns only raw for empty or whitespace text', () => {
    expect(parse('')).toEqual({ raw: '' });
    expect(parse('   ')).toEqual({ raw: '   ' });
  });

  it('keeps the query in its original case for symbol matching', () => {
    expect(parse('5 mL').query).toBe('mL');
    expect(parse('KM').query).toBe('KM');
  });

  it('defaults to a period decimal and comma grouping', () => {
    expect(parse('1,234.5').value).toBe(1234.5);
  });
});

describe('localeSeparators', () => {
  it('reads separators from Intl', () => {
    expect(localeSeparators('en-US')).toEqual({ decimal: '.', group: ',' });
    expect(localeSeparators('de-DE')).toEqual({ decimal: ',', group: '.' });
  });

  it('falls back for invalid locales', () => {
    expect(localeSeparators('not a locale')).toEqual({ decimal: '.', group: ',' });
  });

  it('round-trips with parse', () => {
    const de = localeSeparators('de-DE');
    expect(parse('1.234,5 km', de).value).toBe(1234.5);
  });
});
