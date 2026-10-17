import { ConversionError, convert } from './convert';
import { compactKey } from './normalize';
import type { MatchClass } from './search';
import type { Ingredient, Unit } from './types';
import { getUnit, units } from './units';
import { COOKING_UNITS } from './units/cooking';
import { ingredients } from './units/ingredients';

/**
 * Cooking (ADR 0021): an ingredient joins volume and weight through its density, how much a US
 * customary cup of it weighs (`units/ingredients.ts`). Pure, as the rest of core.
 */

export { ingredients };

const byId: ReadonlyMap<string, Ingredient> = new Map(ingredients.map((each) => [each.id, each]));

/** Every key an ingredient answers to, compact: its name and its aliases. */
const byKey: ReadonlyMap<string, Ingredient> = new Map(
  ingredients.flatMap((each) =>
    [each.name, ...each.aliases].map((key) => [compactKey(key), each] as const),
  ),
);

export function getIngredient(id: string): Ingredient | undefined {
  return byId.get(id);
}

/** The ingredient a text names exactly, by its name or an alias, case and spacing aside. */
export function exactIngredient(text: string): Ingredient | undefined {
  return byKey.get(compactKey(text));
}

/** An ingredient matching a typed query, ranked as units are (search.ts). */
export interface IngredientMatch {
  kind: 'ingredient';
  ingredient: Ingredient;
  /** 2 an exact name or alias, 3 the start of one, 5 inside one. */
  matchClass: MatchClass;
  /** The name or alias that matched, as written in the data. */
  matchedKey: string;
}

/**
 * Ingredients for a typed query, strongest first, then in the data's order: an exact name or
 * alias, then the start of one, then, from three letters on, one that holds it ("sugar" finds
 * brown sugar).
 */
export function matchIngredients(query: string, limit = 8): IngredientMatch[] {
  const target = compactKey(query);
  if (!target) return [];
  const found: IngredientMatch[] = [];
  for (const ingredient of ingredients) {
    let best: IngredientMatch | null = null;
    for (const key of [ingredient.name, ...ingredient.aliases]) {
      const compact = compactKey(key);
      const matchClass: MatchClass | null =
        compact === target
          ? 2
          : compact.startsWith(target)
            ? 3
            : target.length >= 3 && compact.includes(target)
              ? 5
              : null;
      if (matchClass !== null && (!best || matchClass < best.matchClass)) {
        best = { kind: 'ingredient', ingredient, matchClass, matchedKey: key };
      }
    }
    if (best) found.push(best);
  }
  return found
    .map((match, index) => ({ match, index }))
    .sort((a, b) => a.match.matchClass - b.match.matchClass || a.index - b.index)
    .slice(0, limit)
    .map(({ match }) => match);
}

/**
 * The ingredient a typed query ends with, named exactly, and what comes before it, the unit:
 * "cups flour" is cups of all-purpose flour, and so is "cups of flour". The longest name that
 * fits wins ("brown sugar" over "sugar"). Null when the query ends with no ingredient.
 */
export function splitIngredient(query: string): { unit: string; ingredient: Ingredient } | null {
  const words = query.trim().split(/\s+/).filter(Boolean);
  for (let start = 0; start < words.length; start += 1) {
    const ingredient = exactIngredient(words.slice(start).join(' '));
    if (!ingredient) continue;
    const head = words.slice(0, start);
    if (head.at(-1)?.toLowerCase() === 'of') head.pop();
    return { unit: head.join(' '), ingredient };
  }
  return null;
}

/**
 * The units Cooking lists for an ingredient: Weight's and Volume's that recipes use, then the
 * ingredient's own (a stick of butter), which no other ingredient lists.
 */
export function cookingUnits(ingredient: Ingredient | null): Unit[] {
  const listed = COOKING_UNITS.flatMap((id) => getUnit(id) ?? []);
  const own = units.filter((unit) => unit.ingredient && unit.ingredient === ingredient?.id);
  return [...listed, ...own];
}

/** The unit a bare count of the ingredient means, a large egg for eggs ("2 eggs"), if any. */
export function countedUnit(ingredient: Ingredient): Unit | undefined {
  return ingredient.counted ? getUnit(ingredient.counted) : undefined;
}

/** Grams in a milliliter of the ingredient: its cup's weight over the US cup's volume. */
function density(ingredient: Ingredient): number {
  return ingredient.gramsPerCup / convert(1, 'us-cup', 'milliliter');
}

function resolveUnit(ref: Unit | string): Unit {
  if (typeof ref !== 'string') return ref;
  const unit = getUnit(ref);
  if (!unit) throw new ConversionError(`Unknown unit "${ref}"`, 'unknown-unit');
  return unit;
}

/** The value in grams: a weight as it is, a volume through the ingredient's density. */
function toGrams(value: number, unit: Unit, ingredient: Ingredient): number {
  if (unit.category === 'mass') return convert(value, unit, 'gram');
  if (unit.category === 'volume') return convert(value, unit, 'milliliter') * density(ingredient);
  throw new ConversionError(`${unit.id} is neither a weight nor a volume`, 'category-mismatch');
}

function fromGrams(grams: number, unit: Unit, ingredient: Ingredient): number {
  if (unit.category === 'mass') return convert(grams, 'gram', unit);
  if (unit.category === 'volume') return convert(grams / density(ingredient), 'milliliter', unit);
  throw new ConversionError(`${unit.id} is neither a weight nor a volume`, 'category-mismatch');
}

/**
 * Convert an amount of an ingredient between any of Weight's and Volume's units: within one
 * quantity as convert does, exactly; across them through the ingredient's density, a measured
 * figure (ADR 0021). 2 cups of all-purpose flour is 250 g.
 */
export function convertWith(
  value: number,
  from: Unit | string,
  to: Unit | string,
  ingredient: Ingredient | string,
): number {
  const source = resolveUnit(from);
  const target = resolveUnit(to);
  const known = typeof ingredient === 'string' ? getIngredient(ingredient) : ingredient;
  if (!known)
    throw new ConversionError(`Unknown ingredient "${String(ingredient)}"`, 'unknown-unit');
  if (!Number.isFinite(value)) {
    throw new ConversionError('Value must be a finite number', 'not-finite');
  }
  if (source.category === target.category) return convert(value, source, target);
  return fromGrams(toGrams(value, source, known), target, known);
}

/** Whether converting between two units goes through a density, so the answer is measured (≈). */
export function crossesDensity(from: Unit, to: Unit): boolean {
  return from.category !== to.category;
}
