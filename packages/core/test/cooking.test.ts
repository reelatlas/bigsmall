import { describe, expect, it } from 'vitest';
import {
  ConversionError,
  convert,
  convertWith,
  cookingUnits,
  countedUnit,
  crossesDensity,
  cupBasis,
  cupFigure,
  getIngredient,
  getUnit,
  INGREDIENT_KINDS,
  ingredients,
  matchIngredients,
  MEASURED_CUPS,
  search,
  splitIngredient,
} from '../src/index';
import { compactKey } from '../src/normalize';

// Cooking (ADR 0021): an ingredient joins volume and weight through its density.

const ingredient = (id: string) => {
  const found = getIngredient(id);
  if (!found) throw new Error(`no ingredient ${id}`);
  return found;
};

describe('ingredients', () => {
  it('have unique, URL-safe ids, and a weight per cup their sources decide by the rule', () => {
    const ids = ingredients.map((each) => each.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const each of ingredients) {
      expect(each.id, each.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(Number.isFinite(each.gramsPerCup) && each.gramsPerCup > 0, each.id).toBe(true);
      expect(each.method.length, each.id).toBeGreaterThan(0);
      // docs/research/cooking-2.md: each source once, with its figure; the spread is theirs.
      expect(each.sources.length, each.id).toBeGreaterThanOrEqual(1);
      expect(new Set(each.sources.map((source) => source.by)).size, each.id).toBe(
        each.sources.length,
      );
      const ends = each.sources.flatMap((source) =>
        typeof source.grams === 'number' ? [source.grams] : [...source.grams],
      );
      for (const grams of ends) expect(Number.isInteger(grams) && grams > 0, each.id).toBe(true);
      expect(each.range, each.id).toEqual([Math.min(...ends), Math.max(...ends)]);
      // The figure: a liquid's within its density's references; any other, the rule's.
      const [low, high] = each.range;
      if (each.byDensity) {
        expect(low <= each.gramsPerCup && each.gramsPerCup <= high, each.id).toBe(true);
      } else {
        expect(each.gramsPerCup, each.id).toBe(cupFigure(each.sources));
      }
      if (each.counted) expect(getUnit(each.counted)?.ingredient, each.id).toBe(each.id);
    }
  });

  it('each have a kind, every kind some, the data in the kinds’ order', () => {
    const order = INGREDIENT_KINDS.map((kind) => kind.id);
    const at = ingredients.map((each) => order.indexOf(each.kind));
    expect(at.every((index) => index >= 0)).toBe(true);
    expect(at).toEqual([...at].sort((a, b) => a - b));
    expect(new Set(at).size).toBe(order.length);
  });

  it('answer to their names and aliases, no two to the same', () => {
    const owner = new Map<string, string>();
    for (const each of ingredients) {
      for (const key of [each.name, ...each.aliases]) {
        const compact = compactKey(key);
        const before = owner.get(compact);
        expect(before === undefined || before === each.id, `"${key}": ${before}, ${each.id}`).toBe(
          true,
        );
        owner.set(compact, each.id);
      }
    }
  });

  it('weigh a cup as their estimate says, every one', () => {
    for (const each of ingredients) {
      expect(convertWith(1, 'us-cup', 'gram', each), each.id).toBeCloseTo(each.gramsPerCup, 9);
    }
  });

  it('own units only their ingredient lists, and a typed query finds', () => {
    expect(
      search('', { category: 'mass', tier: 'all' }).results.map(
        (r) => r.kind === 'unit' && r.unit.id,
      ),
    ).not.toContain('stick-of-butter');
    expect(
      search('', { category: 'mass', tier: 'all', ingredient: 'butter' }).results.map(
        (r) => r.kind === 'unit' && r.unit.id,
      ),
    ).toContain('stick-of-butter');
    const stick = search('stick').results[0];
    expect(stick?.kind === 'unit' && stick.unit.id).toBe('stick-of-butter');
  });
});

describe('cupFigure, the rule (docs/research/cooking-2.md)', () => {
  const cups = (grams: number) => ({ by: MEASURED_CUPS, grams });
  const kitchen = (by: string, grams: number | readonly [number, number]) => ({ by, grams });

  it('takes the median of three or more, a range at its middle', () => {
    expect(cupFigure([cups(126), kitchen('a', 120), kitchen('b', 128)])).toBe(126);
    // Even: the middle two's mean, 126 and 127.5.
    expect(
      cupFigure([cups(126), kitchen('a', 120), kitchen('b', 136), kitchen('c', [125, 130])]),
    ).toBe(127);
  });

  it('rounds a half to the even gram', () => {
    expect(
      cupFigure([kitchen('a', 164), kitchen('b', 167), kitchen('c', 170), kitchen('d', 170)]),
    ).toBe(168);
    expect(
      cupFigure([kitchen('a', 176), kitchen('b', 184), kitchen('c', 187), kitchen('d', 190)]),
    ).toBe(186);
  });

  it('with fewer than three, takes USDA’s measured cups where they weighed it', () => {
    expect(cupFigure([cups(177), kitchen('King Arthur Baking', 192)])).toBe(177);
    expect(cupFigure([kitchen('a', 239), kitchen('b', 240)])).toBe(240);
    expect(cupFigure([kitchen('King Arthur Baking', 96)])).toBe(96);
  });

  it('says how each ingredient’s figure was reached', () => {
    expect(cupBasis(ingredient('milk'))).toBe('density');
    expect(cupBasis(ingredient('baking-powder'))).toBe('measured-cups');
    expect(cupBasis(ingredient('all-purpose-flour'))).toBe('median');
  });

  it('lands within two of USDA’s own cup-to-cup deviations wherever USDA weighed the cup', () => {
    // The anchor check (docs/RESEARCH.md §2.7): a new source cannot carry a figure past USDA's
    // measured cups unnoticed; a figure that must sit further is named and explained first.
    let checked = 0;
    for (const each of ingredients) {
      const cups = each.sources.find((source) => source.by === MEASURED_CUPS);
      if (!cups?.sd || each.byDensity) continue;
      const grams =
        typeof cups.grams === 'number' ? cups.grams : (cups.grams[0] + cups.grams[1]) / 2;
      expect(Math.abs(each.gramsPerCup - grams), each.id).toBeLessThanOrEqual(2 * cups.sd);
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(20);
  });
});

describe('convertWith', () => {
  it('crosses volume and weight through the density, both ways', () => {
    expect(convertWith(2, 'us-cup', 'gram', 'all-purpose-flour')).toBeCloseTo(254, 9);
    expect(convertWith(254, 'gram', 'us-cup', 'all-purpose-flour')).toBeCloseTo(2, 12);
    // A tablespoon of butter: 227/16 g, about 14.2 g.
    expect(convertWith(1, 'us-tablespoon', 'gram', 'butter')).toBeCloseTo(227 / 16, 9);
    // A stick, a quarter pound, through butter's cup: about half a cup.
    expect(convertWith(1, 'stick-of-butter', 'us-cup', 'butter')).toBeCloseTo(
      (0.25 * 453.59237) / 227,
      9,
    );
    expect(convertWith(3, 'large-egg', 'us-cup', 'eggs')).toBeCloseTo(150 / 243, 9);
    // A teaspoon of baking soda: 240/48 g, 5 g.
    expect(convertWith(1, 'us-teaspoon', 'gram', 'baking-soda')).toBeCloseTo(240 / 48, 9);
  });

  it('converts within one quantity exactly, as convert does, whatever the ingredient', () => {
    expect(convertWith(1, 'us-cup', 'milliliter', 'honey')).toBe(
      convert(1, 'us-cup', 'milliliter'),
    );
    expect(convertWith(1, 'pound', 'gram', 'honey')).toBe(convert(1, 'pound', 'gram'));
    expect(crossesDensity(getUnit('us-cup')!, getUnit('gram')!)).toBe(true);
    expect(crossesDensity(getUnit('us-cup')!, getUnit('milliliter')!)).toBe(false);
  });

  it('throws for an unknown ingredient, or a unit of neither weight nor volume', () => {
    expect(() => convertWith(1, 'us-cup', 'gram', 'moon-dust')).toThrow(ConversionError);
    expect(() => convertWith(1, 'meter', 'gram', 'water')).toThrow(ConversionError);
  });
});

describe('splitIngredient', () => {
  const split = (query: string) => {
    const found = splitIngredient(query);
    return found && [found.unit, found.ingredient.id];
  };

  it('reads the ingredient a query ends with, and the unit before it', () => {
    expect(split('cups flour')).toEqual(['cups', 'all-purpose-flour']);
    expect(split('cups of flour')).toEqual(['cups', 'all-purpose-flour']);
    expect(split('tbsp butter')).toEqual(['tbsp', 'butter']);
    expect(split('stick butter')).toEqual(['stick', 'butter']);
    expect(split('cup brown sugar')).toEqual(['cup', 'brown-sugar']);
    expect(split('cup sugar')).toEqual(['cup', 'granulated-sugar']);
    expect(split('flour')).toEqual(['', 'all-purpose-flour']);
  });

  it('finds none where the query ends with no ingredient named exactly', () => {
    expect(split('cups')).toBeNull();
    expect(split('fl oz')).toBeNull();
    expect(split('cups flo')).toBeNull();
  });
});

describe('matchIngredients and the units', () => {
  it('ranks an exact name first, then the start of one, then one that holds it', () => {
    const ids = (query: string) => matchIngredients(query).map((match) => match.ingredient.id);
    expect(ids('sugar')[0]).toBe('granulated-sugar');
    expect(ids('sugar')).toEqual(expect.arrayContaining(['brown-sugar', 'powdered-sugar']));
    expect(ids('brown')).toEqual(['brown-sugar']);
    expect(ids('flour').slice(0, 2)).toEqual(['all-purpose-flour', 'bread-flour']);
    expect(ids('')).toEqual([]);
  });

  it('lists Weight’s units, then Volume’s, then the ingredient’s own', () => {
    const ids = (id: string | null) =>
      cookingUnits(id ? ingredient(id) : null).map((unit) => unit.id);
    expect(ids('all-purpose-flour')).toEqual([
      'gram',
      'kilogram',
      'ounce',
      'pound',
      'us-teaspoon',
      'us-tablespoon',
      'us-fluid-ounce',
      'us-cup',
      'milliliter',
      'liter',
    ]);
    expect(ids('butter').at(-1)).toBe('stick-of-butter');
    expect(ids('eggs').at(-1)).toBe('large-egg');
    expect(countedUnit(ingredient('eggs'))?.id).toBe('large-egg');
    expect(countedUnit(ingredient('butter'))).toBeUndefined();
  });
});
