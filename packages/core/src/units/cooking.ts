import type { Category, Unit } from '../types';

/**
 * Cooking (ADR 0021): a lens over Weight and Volume, with no units of its own; an ingredient's
 * density converts across them. Its base is Weight's, the kilogram.
 */
export const cooking: Category = {
  id: 'cooking',
  name: 'Cooking',
  aliases: [
    'baking',
    'recipe',
    'recipes',
    'kitchen',
    'ingredient',
    'ingredients',
    'cups to grams',
    'grams to cups',
  ],
  baseUnit: 'kilogram',
  tier: 'standard',
  group: 'common',
  over: ['mass', 'volume'],
};

/** The units Cooking lists, Weight's and then Volume's: what recipes measure in. */
export const COOKING_UNITS: readonly string[] = [
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
];

/**
 * An ingredient's own units, as recipes count it: weights of Weight, each listed only with its
 * ingredient (`ingredient`): a stick of butter and a packet of yeast by their packages' net weights,
 * exact; a large egg as the sources weigh one (docs/research/cooking-2.md).
 */
export const ingredientUnits: readonly Unit[] = [
  {
    kind: 'linear',
    id: 'stick-of-butter',
    category: 'mass',
    name: 'stick of butter',
    plural: 'sticks of butter',
    symbol: 'stick',
    aliases: ['sticks', 'butter stick'],
    system: 'us',
    tier: 'standard',
    // A quarter pound.
    factor: 0.25 * 0.45359237,
    exact: true,
    source:
      "A quarter pound by its wrapper's net weight, half a cup by its markings: America's Test Kitchen, King Arthur Baking (4 oz, 113 g); Land O Lakes (32 tablespoons a pound)",
    note: 'A US stick of butter: a quarter pound, 113.4 g, half a cup.',
    ingredient: 'butter',
  },
  {
    kind: 'linear',
    id: 'large-egg',
    category: 'mass',
    name: 'large egg',
    plural: 'large eggs',
    symbol: 'egg',
    aliases: ['large eggs'],
    system: 'us',
    tier: 'standard',
    factor: 0.05,
    exact: false,
    source:
      'King Arthur Baking, Rose Levy Beranbaum, USDA FoodData Central (SR Legacy): 50 g out of the shell; the FDA reference amount for an egg, 21 CFR 101.12(b): 50 g',
    note: 'A US large egg out of its shell, 50 g.',
    ingredient: 'eggs',
  },
  {
    kind: 'linear',
    id: 'packet-of-yeast',
    category: 'mass',
    name: 'packet of yeast',
    plural: 'packets of yeast',
    symbol: 'packet',
    aliases: ['packets', 'yeast packet'],
    system: 'us',
    tier: 'standard',
    // A quarter ounce.
    factor: 0.25 * 0.028349523125,
    exact: true,
    source:
      "A quarter ounce by its label's net weight, about 2¼ teaspoons: Red Star (0.25 oz, 7 g), Fleischmann's",
    note: 'A US packet of active dry yeast: a quarter ounce, 7.09 g, about 2¼ teaspoons.',
    ingredient: 'active-dry-yeast',
  },
];
