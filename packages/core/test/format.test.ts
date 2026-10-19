import { describe, expect, it } from 'vitest';
import {
  compactKey,
  compactKeyWithDegree,
  formatClock,
  formatNumber,
  normalizeKey,
} from '../src/index';

describe('formatNumber', () => {
  it('shows up to ten significant digits and trims trailing zeros', () => {
    expect(formatNumber(1.609344, { locale: 'en-US' })).toBe('1.609344');
    expect(formatNumber(1000, { locale: 'en-US' })).toBe('1,000');
    expect(formatNumber(1 / 3, { locale: 'en-US' })).toBe('0.3333333333');
    expect(formatNumber(2 / 3, { precision: 3, locale: 'en-US' })).toBe('0.667');
  });

  it('hides floating-point noise', () => {
    expect(formatNumber(0.1 + 0.2, { locale: 'en-US' })).toBe('0.3');
    expect(formatNumber(1.1 * 1.1, { locale: 'en-US' })).toBe('1.21');
  });

  it('groups digits and localizes the decimal mark', () => {
    expect(formatNumber(1234567.891, { locale: 'en-US' })).toBe('1,234,567.891');
    expect(formatNumber(1234.5, { locale: 'de-DE' })).toBe('1.234,5');
    expect(formatNumber(-1234.5, { locale: 'en-US' })).toBe('-1,234.5');
  });

  it('switches to scientific notation at the documented bounds', () => {
    expect(formatNumber(1e15, { locale: 'en-US' })).toBe('1E15');
    expect(formatNumber(123456789012345680, { locale: 'en-US' })).toBe('1.23456789E17');
    expect(formatNumber(0.0000001, { locale: 'en-US' })).toBe('1E-7');
    expect(formatNumber(0.000001, { locale: 'en-US' })).toBe('0.000001');
    expect(formatNumber(999999999999999, { locale: 'en-US' })).toBe('1,000,000,000,000,000');
  });

  it('honors an explicit notation', () => {
    expect(formatNumber(123456.789, { notation: 'scientific', locale: 'en-US' })).toBe(
      '1.23456789E5',
    );
    expect(formatNumber(1e20, { notation: 'standard', locale: 'en-US' })).toBe(
      '100,000,000,000,000,000,000',
    );
  });

  it('handles zero, negative zero, and non-finite values', () => {
    expect(formatNumber(0, { locale: 'en-US' })).toBe('0');
    expect(formatNumber(-0, { locale: 'en-US' })).toBe('0');
    expect(formatNumber(Number.NaN, { locale: 'en-US' })).toBe('');
    expect(formatNumber(Number.POSITIVE_INFINITY, { locale: 'en-US' })).toBe('');
  });

  it('clamps precision and survives an invalid locale', () => {
    expect(formatNumber(1 / 3, { precision: 0, locale: 'en-US' })).toBe('0.3');
    // A double holds about 16–17 significant digits; asking for more never invents digits.
    expect(formatNumber(1 / 3, { precision: 99, locale: 'en-US' })).toMatch(/^0\.3{15,17}$/);
    expect(formatNumber(1234.5, { locale: 'not a locale' }).length).toBeGreaterThan(0);
  });
});

describe('formatClock', () => {
  it('writes minutes as minutes and seconds, to the nearest second', () => {
    expect(formatClock(5.5, { locale: 'en-US' })).toBe('5:30');
    expect(formatClock(6, { locale: 'en-US' })).toBe('6:00');
    expect(formatClock(5.999, { locale: 'en-US' })).toBe('6:00');
    expect(formatClock(8 / 1.609344, { locale: 'en-US' })).toBe('4:58');
    // Under a second never reads 0:00, as a decimal under its places reads "< 0.01".
    expect(formatClock(0.004, { locale: 'en-US' })).toBe('< 0:01');
    expect(formatClock(-0.004, { locale: 'en-US' })).toBe('> -0:01');
    expect(formatClock(0, { locale: 'en-US' })).toBe('0:00');
  });

  it('never carries minutes into hours, so what it writes reads back the same', () => {
    expect(formatClock(65.5, { locale: 'en-US' })).toBe('65:30');
    expect(formatClock(1500, { locale: 'en-US' })).toBe('1500:00');
  });

  it('keeps the sign and the locale’s digits, and leaves what no clock can count', () => {
    expect(formatClock(-6, { locale: 'en-US' })).toBe('-6:00');
    expect(formatClock(5.5, { locale: 'ar-EG' })).toBe('٥:٣٠');
    expect(formatClock(Number.NaN)).toBe('');
    expect(formatClock(1e300, { locale: 'en-US' })).toBe(formatNumber(1e300, { locale: 'en-US' }));
  });
});

describe('normalizeKey and compactKey', () => {
  it('removes a degree sign before a letter, periods, and accents; lowercases; collapses spaces', () => {
    expect(normalizeKey('°F')).toBe('f');
    expect(normalizeKey('° c')).toBe('c');
    expect(normalizeKey('℃')).toBe('c');
    expect(normalizeKey('ºF')).toBe('f');
    expect(normalizeKey('Fl. Oz.')).toBe('fl oz');
    expect(normalizeKey('  square   Metre ')).toBe('square metre');
    expect(normalizeKey('Litre')).toBe('litre');
  });

  it('keeps a degree sign on its own, the angle’s degree, and its look-alikes as it', () => {
    expect(normalizeKey('°')).toBe('°');
    expect(normalizeKey('º')).toBe('°');
    expect(normalizeKey('˚')).toBe('°');
  });

  it('keeps the degree sign of a scale’s symbol on request, for a typed "°" to find', () => {
    expect(compactKeyWithDegree('°C')).toBe('°c');
    expect(compactKeyWithDegree('℉')).toBe('°f');
    expect(compactKeyWithDegree('°')).toBeNull();
    expect(compactKeyWithDegree('deg c')).toBeNull();
  });

  it('maps superscripts and micro signs to ASCII', () => {
    expect(normalizeKey('m²')).toBe('m2');
    expect(normalizeKey('cm³')).toBe('cm3');
    expect(normalizeKey('µm')).toBe('um');
    expect(normalizeKey('μm')).toBe('um');
  });

  it('compactKey removes all spaces', () => {
    expect(compactKey('fl oz')).toBe('floz');
    expect(compactKey('square meter')).toBe('squaremeter');
    expect(compactKey('  ')).toBe('');
  });
});
