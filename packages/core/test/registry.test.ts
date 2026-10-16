import { describe, expect, it } from 'vitest';
import { categories, compactKey, getUnit, units, unitsIn } from '../src/index';

/** Data-integrity rules every unit and category must satisfy. Fails fast when a new entry is malformed. */
describe('registry integrity', () => {
  it('registers the everyday categories in display order', () => {
    expect(categories.map((c) => c.id)).toEqual([
      'length',
      'mass',
      'volume',
      'temperature',
      'area',
      'speed',
      'time',
      'data',
      'fuel-economy',
      'energy',
      'pressure',
      'power',
      'force',
      'torque',
      'angle',
    ]);
  });

  it('unit ids are unique, lowercase, and URL-safe', () => {
    const ids = units.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it('every unit belongs to a known category', () => {
    const known = new Set(categories.map((c) => c.id));
    for (const u of units) expect(known.has(u.category), `${u.id} → ${u.category}`).toBe(true);
  });

  it('every category has a linear base unit with factor 1 and at least three basic units', () => {
    for (const c of categories) {
      const base = getUnit(c.baseUnit);
      expect(base, `${c.id} base ${c.baseUnit}`).toBeDefined();
      expect(base?.category).toBe(c.id);
      expect(base?.kind).toBe('linear');
      if (base?.kind === 'linear') expect(base.factor).toBe(1);
      expect(unitsIn(c.id).filter((u) => u.tier === 'basic').length, c.id).toBeGreaterThanOrEqual(
        3,
      );
    }
  });

  it('every unit cites a source and has a symbol and plural; notes stay short', () => {
    for (const u of units) {
      expect(u.source.trim().length, `${u.id} source`).toBeGreaterThan(10);
      expect(u.symbol.trim().length, `${u.id} symbol`).toBeGreaterThan(0);
      expect(u.plural.trim().length, `${u.id} plural`).toBeGreaterThan(0);
      if (u.note !== undefined) expect(u.note.length, `${u.id} note`).toBeLessThanOrEqual(140);
    }
  });

  it('search keys do not collide within a category after normalization', () => {
    for (const c of categories) {
      const owner = new Map<string, string>();
      for (const u of unitsIn(c.id)) {
        for (const key of [u.name, u.plural, u.symbol, ...u.aliases]) {
          const k = compactKey(key);
          expect(k.length, `${u.id} key "${key}" normalizes to nothing`).toBeGreaterThan(0);
          const existing = owner.get(k);
          expect(
            existing === undefined || existing === u.id,
            `"${key}" → "${k}" used by ${existing} and ${u.id}`,
          ).toBe(true);
          owner.set(k, u.id);
        }
      }
    }
  });

  it('linear and affine factors are positive finite numbers', () => {
    for (const u of units) {
      if (u.kind === 'functional') continue;
      expect(Number.isFinite(u.factor), `${u.id} factor`).toBe(true);
      expect(u.factor, `${u.id} factor`).toBeGreaterThan(0);
    }
  });
});
