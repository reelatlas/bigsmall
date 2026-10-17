import {
  categories,
  cupBasis,
  getUnit,
  ingredients,
  unitsIn,
  type Category,
  type CupSource,
  type Ingredient,
  type Unit,
} from '@bigsmall/core';

/**
 * Every formula the converter uses, as the About page shows them (docs/UX-SPEC.md §1, "About";
 * docs/SEO.md §2): made from core's own units when the site is built, never typed out, so the
 * page and the math cannot drift. Pure; tested in node.
 */

/** One unit's line: what one of it is in its category's base unit, or its formula. */
export interface FormulaLine {
  id: string;
  name: string;
  symbol: string;
  /** "1 mi = 1609.344 m"; "K = (°F + 459.67) × 5/9"; "km/L = 100 ÷ (L/100 km)". */
  formula: string;
  exact: boolean;
  /** The standard the factor was checked against (ADR 0020). */
  source: string;
  /** The line as plain text, for Copy all: name, formula, exact or measured, and source. */
  plain: string;
}

export interface FormulaGroup {
  category: Category;
  base: Unit;
  lines: FormulaLine[];
  /** What its summary says after the name: "17 units in meters", "34 ingredients by the cup". */
  summary: string;
  /** The group's heading as plain text, for Copy all. */
  plain: string;
}

/** What Copy all's text opens with. */
export const FORMULAS_HEADING =
  'bigsmall: every conversion factor and formula, each with the standard it was checked against (https://bigsmall.work/about/).';

/**
 * The most digits a double holds, so float noise never shows (0.0311034768, not
 * 0.031103476799999998); the page says it ("16 digits in each factor").
 */
export const SIGNIFICANT = 16;

/** Factors people know by their exact form, written that way. */
const NAMED: ReadonlyArray<readonly [number, string]> = [
  [5 / 9, '5/9'],
  // A pace of a minute per kilometer: 1000 m in 60 s.
  [1000 / 60, '50/3'],
  [Math.PI / 180, 'π/180'],
  [Math.PI / 200, 'π/200'],
  [Math.PI / 10_800, 'π/10800'],
  [Math.PI / 648_000, 'π/648000'],
  [2 * Math.PI, '2π'],
];

/**
 * A factor as the page writes it: its exact form where it has a named one, else 16 digits, large
 * whole numbers grouped, and the very small with an exponent marked as the converter marks it
 * (1E-9).
 */
export function writtenFactor(value: number): string {
  const named = NAMED.find(([known]) => Math.abs(known - value) <= 1e-12 * Math.abs(known));
  if (named) return named[1];
  const rounded = Number(value.toPrecision(SIGNIFICANT));
  if (Number.isInteger(rounded) && Math.abs(rounded) >= 1e6) return rounded.toLocaleString('en-US');
  return String(rounded).replace('e+', 'E').replace('e-', 'E-');
}

/** A unit's formula in its category's base unit, by its kind. */
export function formulaOf(unit: Unit, base: Unit): string {
  if (unit.id === base.id) return `${unit.symbol}, the base unit`;
  switch (unit.kind) {
    case 'linear':
      return `1 ${unit.symbol} = ${writtenFactor(unit.factor)} ${base.symbol}`;
    case 'affine':
      if (unit.factor === 1)
        return `${base.symbol} = ${unit.symbol} + ${writtenFactor(unit.offset)}`;
      return unit.offset === 0
        ? `${base.symbol} = ${unit.symbol} × ${writtenFactor(unit.factor)}`
        : `${base.symbol} = (${unit.symbol} + ${writtenFactor(unit.offset)}) × ${writtenFactor(unit.factor)}`;
    case 'reciprocal':
      return `${base.symbol} = ${writtenFactor(unit.factor)} ÷ (${unit.symbol})`;
    case 'functional':
      return `${base.symbol} from ${unit.symbol} by a function of its own`;
  }
}

/**
 * An ingredient's line under Cooking (ADR 0021): what a cup of it weighs, filled as US recipes
 * mean, measured, never exact; under it how it is filled, the spread across the sources weighed,
 * and each source's figure (docs/research/cooking-2.md).
 */
/** A source's figure as the About page lists it: "King Arthur Baking: 120 g". */
function sourceText(source: CupSource): string {
  const { grams, detail } = source;
  const figure = typeof grams === 'number' ? `${grams}` : `${grams[0]} to ${grams[1]}`;
  return `${source.by}: ${figure} g${detail ? `, ${detail}` : ''}`;
}

/** How the figure was reached, said before its sources (docs/research/cooking-2.md). */
function basisText(ingredient: Ingredient): string {
  const [low, high] = ingredient.range;
  const span = low === high ? `${low} g` : `${low} to ${high} g`;
  const count = ingredient.sources.length;
  switch (cupBasis(ingredient)) {
    case 'density':
      return `by density, ${span}`;
    case 'measured-cups':
      return `${count} weighings, ${span}; with fewer than 3, USDA's measured cups decide`;
    case 'median':
      return count === 1 ? '1 weighing' : `the middle of ${count} weighings, ${span}`;
  }
}

function ingredientLine(ingredient: Ingredient): FormulaLine {
  const formula = `1 cup = ${ingredient.gramsPerCup} g`;
  const method = ingredient.method.charAt(0).toUpperCase() + ingredient.method.slice(1);
  const sources = ingredient.sources.map(sourceText).join('; ');
  const source = `${method}; ${basisText(ingredient)}: ${sources}.${ingredient.note ? ` ${ingredient.note}` : ''}`;
  return {
    id: `ingredient:${ingredient.id}`,
    name: ingredient.name,
    symbol: '',
    formula,
    exact: false,
    source,
    plain: `${ingredient.name}: ${formula}, measured. Source: ${source}`,
  };
}

/**
 * Every category's units with their formulas, in the catalog's order; Cooking, a lens with no
 * units of its own, lists its ingredients' weights by the cup instead.
 */
export function formulaGroups(): FormulaGroup[] {
  return categories.flatMap((category) => {
    const base = getUnit(category.baseUnit);
    if (!base) return [];
    if (category.over) {
      const lines = ingredients.map(ingredientLine);
      return [
        {
          category,
          base,
          lines,
          summary: `${lines.length} ingredients by the cup`,
          plain: `## ${category.name} (each ingredient by the US cup, 236.6 mL, filled as US recipes mean it; the middle of the weighings, a liquid by its density)`,
        },
      ];
    }
    const lines = unitsIn(category.id).map((unit): FormulaLine => {
      const formula = formulaOf(unit, base);
      const kind = unit.exact ? 'exact' : 'measured';
      return {
        id: unit.id,
        name: unit.name,
        symbol: unit.symbol,
        formula,
        exact: unit.exact,
        source: unit.source,
        plain: `${unit.name} (${unit.symbol}): ${formula}, ${kind}. Source: ${unit.source}`,
      };
    });
    return [
      {
        category,
        base,
        lines,
        summary: `${lines.length} units in ${base.plural}`,
        plain: `## ${category.name} (base unit: ${base.name}, ${base.symbol})`,
      },
    ];
  });
}
