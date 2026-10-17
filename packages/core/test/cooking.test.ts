import { describe, expect, it } from 'vitest';
import {
  ConversionError,
  convert,
  convertWith,
  cookingUnits,
  countedUnit,
  crossesDensity,
  getIngredient,
  getUnit,
  ingredients,
  matchIngredients,
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
  it('have unique, URL-safe ids, a weight per cup, and cite FoodData Central', () => {
    const ids = ingredients.map((each) => each.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const each of ingredients) {
      expect(each.id, each.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(Number.isFinite(each.gramsPerCup) && each.gramsPerCup > 0, each.id).toBe(true);
      expect(each.source, each.id).toContain(`USDA FoodData Central ${each.fdcId} (SR Legacy)`);
      if (each.counted) expect(getUnit(each.counted)?.ingredient, each.id).toBe(each.id);
    }
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

  it('weigh a cup as USDA weighs it, every one', () => {
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

describe('convertWith', () => {
  it('crosses volume and weight through the density, both ways', () => {
    expect(convertWith(2, 'us-cup', 'gram', 'all-purpose-flour')).toBeCloseTo(250, 9);
    expect(convertWith(250, 'gram', 'us-cup', 'all-purpose-flour')).toBeCloseTo(2, 12);
    // A tablespoon of butter: 227/16 g, USDA's own tablespoon 14.2 g.
    expect(convertWith(1, 'us-tablespoon', 'gram', 'butter')).toBeCloseTo(227 / 16, 9);
    expect(convertWith(1, 'stick-of-butter', 'us-cup', 'butter')).toBeCloseTo(113 / 227, 9);
    expect(convertWith(3, 'large-egg', 'us-cup', 'eggs')).toBeCloseTo(150 / 243, 9);
    expect(convertWith(1, 'us-teaspoon', 'gram', 'baking-soda')).toBeCloseTo(4.6, 9);
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
