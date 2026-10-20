import { describe, expect, it } from 'vitest';
import { formatNumber, localeSeparators, parse } from '../src/index';
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
  // A time as a clock writes it, each part sixtieths of the one before (Sean, 2026-10-16).
  { text: '5:30', value: 5.5, valueText: '5:30' },
  { text: '5:30 /km', value: 5.5, query: '/km' },
  { text: '5:30/km', value: 5.5, query: '/km' },
  { text: '5:30 min/mi', value: 5.5, query: 'min/mi' },
  { text: '1:30 h', value: 1.5, query: 'h' },
  { text: '1:05:30', value: 1 + 5 / 60 + 30 / 3600 },
  // Seconds are two digits under 60: anything else is no clock, and "5:" or "5:3" is on its way.
  { text: '5:75 km', value: 5, query: ':75 km' },
  { text: '5:3', value: 5, query: ':3' },
  { text: '5:', value: 5, query: ':' },
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

  it('flags numbers a double cannot hold instead of dropping them', () => {
    expect(parse('1e400 km')).toEqual({
      raw: '1e400 km',
      valueText: '1e400',
      query: 'km',
      outOfRange: 'large',
      exponentMarks: [1],
    });
    expect(parse('-1e400').outOfRange).toBe('large');
    expect(parse('9'.repeat(400)).outOfRange).toBe('large');
    expect(parse('1e-400')).toMatchObject({ valueText: '1e-400', outOfRange: 'small' });
    expect(parse('1e-400').value).toBeUndefined();
  });

  it('keeps an honest zero a zero, whatever its exponent', () => {
    expect(parse('0e-400')).toMatchObject({ value: 0 });
    expect(parse('0.000')).toMatchObject({ value: 0 });
    expect(parse('0e-400').outOfRange).toBeUndefined();
  });

  it('reports where the exponent markers sit in the number', () => {
    expect(parse('1.5E21 km').exponentMarks).toEqual([3]);
    expect(parse('2e-3').exponentMarks).toEqual([1]);
    expect(parse('1e3 + 2E4').exponentMarks).toEqual([1, 7]);
    expect(parse('25').exponentMarks).toBeUndefined();
    expect(parse('5 e').exponentMarks).toBeUndefined();
  });

  it('keeps the largest and smallest doubles in range', () => {
    expect(parse('1.7e308').value).toBe(1.7e308);
    expect(parse('5e-324').value).toBe(5e-324);
  });

  it('gives one number exactly as typed, in canonical form, digits a double would round included', () => {
    expect(parse('123456789012345678').canonical).toBe('123456789012345678');
    expect(parse('1,000.50 km', EN).canonical).toBe('1000.50');
    expect(parse('1.000,5', DE).canonical).toBe('1000.5');
    expect(parse(`${MINUS}40 f`).canonical).toBe('-40');
    // A clock as typed, so a link opens on the same minutes and seconds.
    expect(parse('5:30 /km').canonical).toBe('5:30');
    expect(parse('.5').canonical).toBe('0.5');
    expect(parse('1.5e21').canonical).toBe('1.5E21');
    // Arithmetic, and no number, have none: a URL keeps their value instead.
    expect(parse('5 + 3').canonical).toBeUndefined();
    expect(parse('ml').canonical).toBeUndefined();
    expect(parse('1e400').canonical).toBeUndefined();
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

  it('reads back every number Intl writes, in any locale and script', () => {
    // A row's value goes into the box as the table writes it, so the box must read whatever Intl
    // writes: Swiss apostrophes, Indian grouping, other scripts' digits, the direction marks
    // around a minus, and exponents written in letters or as ×10^.
    const locales = [
      'en-US',
      'de-DE',
      'fr-FR',
      'sv-SE',
      'de-CH',
      'fr-CH',
      'it-CH',
      'en-IN',
      'ja-JP',
    ];
    const scripts = [
      'ar-EG',
      'ar-MA',
      'fa-IR',
      'ps-AF',
      'ckb-IQ',
      'he-IL',
      'ur-PK',
      'bn-BD',
      'mr-IN',
      'my-MM',
    ];
    for (const locale of [...locales, ...scripts]) {
      for (const value of [1234567.891, -1234.5, -0.5, 1e-7, -2.5e20, 0]) {
        const written = formatNumber(value, { locale });
        const parsed = parse(written, localeSeparators(locale));
        expect(parsed.value, `${locale}: ${written}`).toBe(value);
        expect(parsed.query, `${locale}: ${written}`).toBeUndefined();
      }
    }
  });
});

const RIGHT_QUOTE = String.fromCharCode(0x2019);

describe('parse in other scripts and conventions', () => {
  it('reads an apostrophe as grouping only before a group of three', () => {
    expect(parse(`1${RIGHT_QUOTE}234${RIGHT_QUOTE}567.891`).value).toBe(1234567.891);
    expect(parse("12'345 ft")).toMatchObject({ value: 12345, query: 'ft' });
    // Feet and inches keep their apostrophe, and read as one quantity (compound.test.ts).
    expect(parse(`5'10"`)).toMatchObject({ value: 5 + 10 / 12, valueText: `5'10"` });
    expect(parse(`5'10"`).compound?.unit).toBe('foot-inch');
  });

  it('reads digits typed in any script, and fullwidth forms, keeping what was typed', () => {
    expect(parse('١٢٣٫٥', localeSeparators('ar-EG'))).toMatchObject({
      value: 123.5,
      valueText: '١٢٣٫٥',
      canonical: '123.5',
    });
    expect(parse('१२,३४,५६७.८९१ km')).toMatchObject({ value: 1234567.891, query: 'km' });
    expect(parse('１２．５ ｋｍ')).toMatchObject({
      value: 12.5,
      valueText: '１２．５',
      query: 'ｋｍ',
    });
    expect(parse('１０＋５').value).toBe(15);
  });
});

const TIMES = String.fromCharCode(0x00d7);
const DIVIDE = String.fromCharCode(0x00f7);

describe('parse arithmetic', () => {
  const arithmetic: Case[] = [
    { text: '5+3', value: 8, valueText: '5+3' },
    { text: '5 + 3 ft', value: 8, query: 'ft', valueText: '5 + 3' },
    { text: `2${TIMES}3 cm`, value: 6, query: 'cm' },
    { text: `10${DIVIDE}4`, value: 2.5 },
    { text: `9${MINUS}4`, value: 5 },
    { text: '2*3/4', value: 1.5 },
    { text: '2+3*4', value: 14 },
    { text: '(2+3)*4', value: 20 },
    { text: '-2*3', value: -6 },
    { text: `2${TIMES}${MINUS}3`, value: -6 },
    { text: '5 - -3', value: 8 },
    { text: '1/2 cup', value: 0.5, query: 'cup' },
    { text: '1,000+2,000', separators: EN, value: 3000 },
    { text: '1.000+2.000', separators: DE, value: 3000 },
    { text: '1,5+2,5', separators: DE, value: 4 },
    { text: '1e3+1', value: 1001 },
    { text: '2^10', value: 1024 },
    { text: '2^10 bytes', value: 1024, query: 'bytes' },
    { text: `${MINUS}2^2`, value: -4 },
    { text: '2^-3', value: 0.125 },
    { text: '2^3^2', value: 512 },
    { text: '3*2^2', value: 12 },
    { text: '(1+1)^3', value: 8 },
  ];
  for (const c of arithmetic) {
    it(`evaluates ${JSON.stringify(c.text)}`, () => {
      const parsed = parse(c.text, c.separators);
      expect(parsed.value).toBeCloseTo(c.value!, 12);
      expect(parsed.query).toBe(c.query);
      expect(parsed.expression).toBe(true);
      if (c.valueText) expect(parsed.valueText).toBe(c.valueText);
    });
  }

  it('leaves a unit with a slash, and anything that is not arithmetic, to the query', () => {
    expect(parse('5 km/h')).toMatchObject({ value: 5, query: 'km/h' });
    expect(parse('m/s')).toEqual({ raw: 'm/s', query: 'm/s' });
    expect(parse('5 -ft')).toMatchObject({ value: 5, valueText: '5', query: '-ft' });
    expect(parse('5 m^2')).toMatchObject({ value: 5, query: 'm^2' });
    expect(parse('5 ft').expression).toBeUndefined();
    expect(parse('-5').expression).toBeUndefined();
  });

  it('reads unfinished arithmetic as far as it goes while the user types', () => {
    expect(parse('5+')).toMatchObject({ value: 5, valueText: '5+' });
    expect(parse('5+').expression).toBeUndefined();
    expect(parse(`5${TIMES}${MINUS}`)).toMatchObject({ value: 5 });
    expect(parse('5*(')).toMatchObject({ value: 5, valueText: '5*(' });
    expect(parse('(5+3')).toMatchObject({ value: 8, expression: true });
    expect(parse('2^')).toMatchObject({ value: 2, valueText: '2^' });
    expect(parse('5.')).toMatchObject({ value: 5, valueText: '5.' });
    expect(parse('5.5.')).toMatchObject({ value: 5.5 });
    expect(parse('5,', DE)).toMatchObject({ value: 5, valueText: '5,' });
  });

  it('says when arithmetic divides by zero, overflows, or rounds to zero', () => {
    expect(parse('5/0')).toMatchObject({ invalid: 'divide-by-zero', expression: true });
    expect(parse('5/0').value).toBeUndefined();
    expect(parse('0/0').invalid).toBe('divide-by-zero');
    expect(parse('1e308*10').outOfRange).toBe('large');
    expect(parse('1e-200*1e-200').outOfRange).toBe('small');
    expect(parse('1e-400+1').value).toBe(1);
    expect(parse('5-5')).toMatchObject({ value: 0 });
    expect(parse('5-5').outOfRange).toBeUndefined();
    expect(parse('0^-1').invalid).toBe('divide-by-zero');
    expect(parse('(-8)^0.5')).toMatchObject({ invalid: 'not-real', expression: true });
    expect(parse('10^400').outOfRange).toBe('large');
    expect(parse('10^-400').outOfRange).toBe('small');
  });
});
