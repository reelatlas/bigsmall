import { describe, expect, it } from 'vitest';
import { ConversionError, convert, convertChange, getCategory, units } from '../src/index';
import type { AffineUnit, FunctionalUnit } from '../src/types';
import { golden } from './golden/index';

/** Factors are exact; two floating-point operations cost about 1e-16 each. */
const DEFAULT_TOLERANCE = 1e-12;

/**
 * `floor` sets a minimum scale so tiny values are judged on absolute error (affine offsets make
 * relative error meaningless near zero).
 */
function expectClose(
  actual: number,
  expected: number,
  tolerance = DEFAULT_TOLERANCE,
  floor = 0,
): void {
  if (expected === 0) {
    expect(Math.abs(actual)).toBeLessThanOrEqual(tolerance);
    return;
  }
  expect(Math.abs(actual - expected) / Math.max(Math.abs(expected), floor)).toBeLessThanOrEqual(
    tolerance,
  );
}

describe('golden conversions (sourced fixtures)', () => {
  for (const [category, rows] of Object.entries(golden)) {
    describe(category, () => {
      for (const row of rows) {
        it(`${row.value} ${row.from} → ${row.to} = ${row.expected}`, () => {
          expectClose(convert(row.value, row.from, row.to), row.expected, row.tolerance);
        });
      }
    });
  }

  it('covers every registered unit with at least one row', () => {
    const covered = new Set(
      Object.values(golden).flatMap((rows) => rows.flatMap((r) => [r.from, r.to])),
    );
    const missing = units.map((u) => u.id).filter((id) => !covered.has(id));
    expect(missing).toEqual([]);
  });

  it('only references units that exist', () => {
    const ids = new Set(units.map((u) => u.id));
    for (const rows of Object.values(golden)) {
      for (const row of rows) {
        expect(ids.has(row.from), row.from).toBe(true);
        expect(ids.has(row.to), row.to).toBe(true);
      }
    }
  });
});

describe('round trips', () => {
  const magnitudes = [1e-6, 1, 123.456, 1e9];
  for (const unit of units) {
    const base = getCategory(unit.category)?.baseUnit;
    if (!base) throw new Error(`no base unit for ${unit.category}`);
    for (const v of magnitudes) {
      it(`${v} ${unit.id} → ${base} → ${unit.id}`, () => {
        expectClose(convert(convert(v, unit, base), base, unit), v, 1e-12, 1);
      });
    }
  }
});

describe('functional units (reciprocal)', () => {
  const meta = {
    category: 'speed',
    system: 'metric',
    tier: 'standard',
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

describe('fuel economy at 0', () => {
  it('has no value in the reciprocal units, and 0 in the others', () => {
    expect(convert(0, 'liter-per-100-kilometers', 'kilometer-per-liter')).toBe(Infinity);
    expect(convert(0, 'mile-per-us-gallon', 'liter-per-100-kilometers')).toBe(Infinity);
    expect(convert(0, 'liter-per-100-kilometers', 'us-gallon-per-100-miles')).toBe(0);
  });
});

describe('errors', () => {
  it('rejects unknown units', () => {
    expect(() => convert(1, 'cubit', 'meter')).toThrowError(ConversionError);
    expect(() => convert(1, 'cubit', 'meter')).toThrow(/unknown unit/i);
  });

  it('rejects category mismatches', () => {
    expect(() => convert(1, 'meter', 'kilogram')).toThrow(/cannot convert/i);
    const fake: AffineUnit = {
      kind: 'affine',
      id: 't-kelvin',
      category: 'temperature',
      name: 'kelvin',
      plural: 'kelvins',
      symbol: 'K',
      aliases: [],
      system: 'si',
      tier: 'standard',
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
    expect(convert(-40, 'fahrenheit', 'fahrenheit')).toBe(-40);
  });
});

describe('convertChange', () => {
  // A change between two readings, not a reading (Sean, 2026-10-16): the scales' degree sizes
  // alone, 1 °C and 1 K of change are 1 K, 1 °F and 1 °R are 5/9 K (NIST SP 811 Appendix B.8,
  // exact).
  it('converts a change by the scales’ degree sizes alone, its sign kept', () => {
    expectClose(convertChange(5, 'celsius', 'fahrenheit'), 9);
    expect(convertChange(5, 'celsius', 'kelvin')).toBe(5);
    expectClose(convertChange(-25, 'fahrenheit', 'celsius'), -125 / 9);
    expectClose(convertChange(9, 'rankine', 'kelvin'), 5);
    expectClose(convertChange(1, 'fahrenheit', 'rankine'), 1);
    expect(convertChange(0, 'celsius', 'fahrenheit')).toBe(0);
    // A reading is another thing: 5 °C reads 41 °F.
    expectClose(convert(5, 'celsius', 'fahrenheit'), 41);
  });

  it('has no change for a unit with no size of its own, nor across categories', () => {
    expect(() => convertChange(5, 'liter-per-100-kilometers', 'kilometer-per-liter')).toThrow(
      ConversionError,
    );
    expect(() => convertChange(5, 'celsius', 'meter')).toThrow(ConversionError);
  });
});
