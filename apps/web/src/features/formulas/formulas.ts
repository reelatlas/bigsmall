import {
  categories,
  getUnit,
  ingredients,
  unitsIn,
  type Category,
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
 * An ingredient's line under Cooking (ADR 0021): what USDA weighed of it, measured, never exact,
 * with the food and portion it was read from.
 */
function ingredientLine(ingredient: Ingredient): FormulaLine {
  return {
    id: `ingredient:${ingredient.id}`,
    name: ingredient.name,
    symbol: '',
    formula: ingredient.portion,
    exact: false,
    source: ingredient.source,
    plain: `${ingredient.name}: ${ingredient.portion}, measured. Source: ${ingredient.source}`,
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
          plain: `## ${category.name} (each ingredient by the US cup, 236.6 mL, as USDA FoodData Central weighs it)`,
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
