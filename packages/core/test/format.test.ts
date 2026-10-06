import { describe, expect, it } from 'vitest';
import { compactKey, formatNumber, normalizeKey } from '../src/index';

describe('formatNumber', () => {
  it('shows up to ten significant digits and trims trailing zeros', () => {
    expect(formatNumber(1.609344)).toBe('1.609344');
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1 / 3)).toBe('0.3333333333');
    expect(formatNumber(2 / 3, { precision: 3 })).toBe('0.667');
  });

  it('hides floating-point noise', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(1.1 * 1.1)).toBe('1.21');
  });

  it('groups digits and localizes the decimal mark', () => {
    expect(formatNumber(1234567.891)).toBe('1,234,567.891');
    expect(formatNumber(1234.5, { locale: 'de-DE' })).toBe('1.234,5');
    expect(formatNumber(-1234.5)).toBe('-1,234.5');
  });

  it('switches to scientific notation at the documented bounds', () => {
    expect(formatNumber(1e15)).toBe('1E15');
    expect(formatNumber(123456789012345680)).toBe('1.23456789E17');
    expect(formatNumber(0.0000001)).toBe('1E-7');
    expect(formatNumber(0.000001)).toBe('0.000001');
    expect(formatNumber(999999999999999)).toBe('1,000,000,000,000,000');
  });

  it('honors an explicit notation', () => {
    expect(formatNumber(123456.789, { notation: 'scientific' })).toBe('1.23456789E5');
    expect(formatNumber(1e20, { notation: 'standard' })).toBe('100,000,000,000,000,000,000');
  });

  it('handles zero, negative zero, and non-finite values', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-0)).toBe('0');
    expect(formatNumber(Number.NaN)).toBe('');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('');
  });

  it('clamps precision and survives an invalid locale', () => {
    expect(formatNumber(1 / 3, { precision: 0 })).toBe('0.3');
    // A double holds about 16–17 significant digits; asking for more never invents digits.
    expect(formatNumber(1 / 3, { precision: 99 })).toMatch(/^0\.3{15,17}$/);
    expect(formatNumber(1234.5, { locale: 'not a locale' }).length).toBeGreaterThan(0);
  });
});

describe('normalizeKey and compactKey', () => {
  it('removes degree signs, periods, and accents; lowercases; collapses spaces', () => {
    expect(normalizeKey('°F')).toBe('f');
    expect(normalizeKey('℃')).toBe('c');
    expect(normalizeKey('Fl. Oz.')).toBe('fl oz');
    expect(normalizeKey('  square   Metre ')).toBe('square metre');
    expect(normalizeKey('Litre')).toBe('litre');
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
