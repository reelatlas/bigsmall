import { describe, expect, it } from 'vitest';
import { ConversionError, convert, getCategory, units } from '../src/index';
import type { AffineUnit, FunctionalUnit } from '../src/types';
import golden from './golden/length.json' with { type: 'json' };

/** Relative tolerance for floating-point comparison. Factors are exact; two multiplications cost ~1e-16 each. */
const REL_TOL = 1e-12;

function expectClose(actual: number, expected: number): void {
  if (expected === 0) {
    expect(Math.abs(actual)).toBeLessThanOrEqual(REL_TOL);
    return;
  }
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThanOrEqual(REL_TOL);
}

describe('golden conversions (sourced fixtures)', () => {
  for (const row of golden) {
    it(`${row.value} ${row.from} → ${row.to} = ${row.expected}`, () => {
      expectClose(convert(row.value, row.from, row.to), row.expected);
    });
  }
});

describe('round trips', () => {
  const magnitudes = [1e-6, 1, 123.456, 1e9];
  for (const unit of units) {
    const base = getCategory(unit.category)?.baseUnit;
    if (!base) throw new Error(`no base unit for ${unit.category}`);
    for (const v of magnitudes) {
      it(`${v} ${unit.id} → ${base} → ${unit.id}`, () => {
        expectClose(convert(convert(v, unit, base), base, unit), v);
      });
    }
  }
});

describe('affine units (temperature-style)', () => {
  const meta = {
    category: 'temperature',
    system: 'metric',
    tier: 'basic',
    exact: true,
    source: 'test',
  } as const;
  const celsius: AffineUnit = {
    kind: 'affine',
    id: 't-celsius',
    name: 'celsius',
    plural: 'celsius',
    symbol: '°C',
    aliases: [],
    factor: 1,
    offset: 273.15,
    ...meta,
  };
  const fahrenheit: AffineUnit = {
    kind: 'affine',
    id: 't-fahrenheit',
    name: 'fahrenheit',
    plural: 'fahrenheit',
    symbol: '°F',
    aliases: [],
    factor: 5 / 9,
    offset: 459.67,
    ...meta,
  };

  it('212 °F = 100 °C', () => expectClose(convert(212, fahrenheit, celsius), 100));
  it('-40 °F = -40 °C', () => expectClose(convert(-40, fahrenheit, celsius), -40));
  it('0 °C = 32 °F', () => expectClose(convert(0, celsius, fahrenheit), 32));
  it('37 °C = 98.6 °F', () => expectClose(convert(37, celsius, fahrenheit), 98.6));
});

describe('functional units (reciprocal)', () => {
  // Base: kilometers per liter. L/100km is its reciprocal, scaled.
  const meta = {
    category: 'speed',
    system: 'metric',
    tier: 'basic',
    exact: true,
    source: 'test',
  } as const;
  const kmPerL: FunctionalUnit = {
    kind: 'functional',
    id: 't-km-per-l',
    name: 'km/L',
    plural: 'km/L',
    symbol: 'km/L',
    aliases: [],
    toBase: (v) => v,
    fromBase: (v) => v,
    ...meta,
  };
  const lPer100km: FunctionalUnit = {
    kind: 'functional',
    id: 't-l-per-100km',
    name: 'L/100km',
    plural: 'L/100km',
    symbol: 'L/100km',
    aliases: [],
    toBase: (v) => 100 / v,
    fromBase: (v) => 100 / v,
    ...meta,
  };

  it('5 L/100km = 20 km/L', () => expectClose(convert(5, lPer100km, kmPerL), 20));
  it('20 km/L = 5 L/100km', () => expectClose(convert(20, kmPerL, lPer100km), 5));
});

describe('errors', () => {
  it('rejects unknown units', () => {
    expect(() => convert(1, 'cubit', 'meter')).toThrowError(ConversionError);
    expect(() => convert(1, 'cubit', 'meter')).toThrow(/unknown unit/i);
  });

  it('rejects category mismatches', () => {
    const fake: AffineUnit = {
      kind: 'affine',
      id: 't-kelvin',
      category: 'temperature',
      name: 'kelvin',
      plural: 'kelvins',
      symbol: 'K',
      aliases: [],
      system: 'si',
      tier: 'basic',
      factor: 1,
      offset: 0,
      exact: true,
      source: 'test',
    };
    expect(() => convert(1, 'meter', fake)).toThrow(/cannot convert/i);
  });

  it('rejects non-finite values', () => {
    expect(() => convert(Number.NaN, 'meter', 'foot')).toThrow(/finite/);
    expect(() => convert(Number.POSITIVE_INFINITY, 'meter', 'foot')).toThrow(/finite/);
  });

  it('is the identity for same-unit conversion', () => {
    expect(convert(42.5, 'meter', 'meter')).toBe(42.5);
  });
});
