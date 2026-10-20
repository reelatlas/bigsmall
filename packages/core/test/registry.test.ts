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
      'shoe-size',
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
    // speed of light for a typed "c" (docs/UNITS-CATALOG.md §5). No alias is exempt.
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
      for (const alias of u.aliases) check(alias, compactKey(alias));
    }
  });

  it('a pair names two or three parts of its category, largest first, each a whole number of the next (ADR 0026)', () => {
    const pairs = units.filter((u) => u.pair);
    expect(pairs.map((u) => u.id)).toEqual([
      'foot-inch',
      'stone-pound',
      'pound-ounce',
      'hour-minute-second',
      'degree-arcminute-arcsecond',
    ]);
    for (const pair of pairs) {
      const parts = (pair.pair ?? []).map((id) => getUnit(id));
      expect(parts.length, pair.id).toBeGreaterThanOrEqual(2);
      expect(parts.length, pair.id).toBeLessThanOrEqual(3);
      for (const part of parts) {
        expect(part, pair.id).toBeDefined();
        expect(part?.category, pair.id).toBe(pair.category);
        expect(part?.kind, pair.id).toBe('linear');
      }
      const factors = parts.map((part) => (part?.kind === 'linear' ? part.factor : Number.NaN));
      // The pair's own factor is its first part's: a plain number in it is that part.
      expect(pair.kind === 'linear' && pair.factor, pair.id).toBe(factors[0]);
      for (let at = 1; at < factors.length; at += 1) {
        const ratio = factors[at - 1]! / factors[at]!;
        expect(Math.abs(ratio - Math.round(ratio)), `${pair.id} part ${at}`).toBeLessThan(1e-9);
        expect(Math.round(ratio), `${pair.id} part ${at}`).toBeGreaterThan(1);
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
