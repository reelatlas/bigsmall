import { describe, expect, it } from 'vitest';
import { ConversionError, convert, getCategory, units } from '../src/index';
import type { AffineUnit, FunctionalUnit } from '../src/types';
import { golden } from './golden/index';

/** Factors are exact; two floating-point operations cost about 1e-16 each. */
const DEFAULT_TOLERANCE = 1e-12;

/** `floor` sets a minimum scale so tiny values are judged on absolute error (affine offsets make relative error meaningless near zero). */
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
    expect(convert(-40, 'fahrenheit', 'fahrenheit')).toBe(-40);
  });
});
