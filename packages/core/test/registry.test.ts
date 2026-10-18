import { describe, expect, it } from 'vitest';
import {
  categories,
  compactKey,
  compactKeyWithDegree,
  getUnit,
  units,
  unitsIn,
} from '../src/index';

/**
 * Data-integrity rules every unit and category must satisfy. Fails fast when a new entry is
 * malformed.
 */
describe('registry integrity', () => {
  it('registers every category in display order', () => {
    expect(categories.map((c) => c.id)).toEqual([
      'length',
      'mass',
      'volume',
      'cooking',
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

  it('every category has a linear base unit with factor 1 and at least three standard units', () => {
    for (const c of categories) {
      const base = getUnit(c.baseUnit);
      expect(base, `${c.id} base ${c.baseUnit}`).toBeDefined();
      expect(base?.kind).toBe('linear');
      if (base?.kind === 'linear') expect(base.factor).toBe(1);
      // A lens (Cooking, ADR 0021) has no units of its own: its base is one of the categories it
      // looks over.
      if (c.over) {
        expect(c.over, c.id).toContain(base?.category);
        expect(unitsIn(c.id), c.id).toEqual([]);
        continue;
      }
      expect(base?.category).toBe(c.id);
      expect(
        unitsIn(c.id).filter((u) => u.tier === 'standard').length,
        c.id,
      ).toBeGreaterThanOrEqual(3);
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

  it('no two keys of one unit share a compact key, so no alias repeats another spelling', () => {
    // Search drops case, periods, and spaces (normalize.ts), so an alias that folds to a key of
    // its own unit ("in." beside "in", "sqft" beside "sq ft") finds nothing the other does not.
    // The name, plural, and symbol may be one word written once (the cup, the stone, Celsius):
    // identical spellings are one key. A scale's symbol keeps its degree sign here ("°c"), since
    // its bare letter is an alias on purpose: the as-typed spelling that ranks Celsius over the
    // speed of light for a typed "c" (docs/UNITS-CATALOG.md §5).
    // None today: "oz." stayed beside "oz" until later on 2026-10-18, when Sean dropped it so
    // that "oz." asks which ounce as "oz" does.
    const keptOnPurpose: ReadonlyMap<string, ReadonlySet<string>> = new Map();
    for (const u of units) {
      const seen = new Map<string, string>();
      const check = (key: string, compact: string) => {
        const other = seen.get(compact);
        expect(other, `${u.id}: "${key}" repeats "${other}" as "${compact}"`).toBeUndefined();
        seen.set(compact, key);
      };
      check(u.symbol, compactKeyWithDegree(u.symbol) ?? compactKey(u.symbol));
      for (const key of new Set([u.name, u.plural])) {
        if (key !== u.symbol) check(key, compactKey(key));
      }
      for (const alias of u.aliases) {
        if (!keptOnPurpose.get(u.id)?.has(alias)) check(alias, compactKey(alias));
      }
    }
  });

  it('linear, affine, and reciprocal factors are positive finite numbers', () => {
    for (const u of units) {
      if (u.kind === 'functional') continue;
      expect(Number.isFinite(u.factor), `${u.id} factor`).toBe(true);
      expect(u.factor, `${u.id} factor`).toBeGreaterThan(0);
    }
  });
});
