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
 * ingredient (`ingredient`), measured as USDA FoodData Central weighs them.
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
    factor: 0.113,
    exact: false,
    source: 'USDA FoodData Central 173410 (SR Legacy): Butter, salted; 1 stick = 113 g',
    note: 'A US stick of butter: half a cup, 113 g.',
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
    source: 'USDA FoodData Central 171287 (SR Legacy): Egg, whole, raw, fresh; 1 large = 50 g',
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
    factor: 0.0072,
    exact: false,
    source:
      "USDA FoodData Central 175043 (SR Legacy): Leavening agents, yeast, baker's, active dry; 1 packet = 7.2 g",
    note: 'A US packet of active dry yeast, 7.2 g.',
    ingredient: 'active-dry-yeast',
  },
];
