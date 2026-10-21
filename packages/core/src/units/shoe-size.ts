import type { Category, FunctionalUnit, Unit } from '../types';
import { CHILDREN_TABLE } from './shoe-size-tables';

/**
 * Shoe sizes (ADR 0027; docs/research/shoe-sizes-1.md): a conventional fact, one body's table
 * (docs/RESEARCH.md §1). ISO/TS 19407:2015 brings the systems to one base, the foot's length in
 * millimetres, which is Mondopoint itself: every adult scale is a straight line over it, with the
 * steps as the standard prints them (8.47 mm a UK or US size, 6.67 mm a European one) and the
 * shoe two sizes longer than the foot; its Table 2 is those lines rounded to the half size, which
 * the formulas reproduce in 321 of its 324 values, the three misses each within a hundredth of a
 * size of a rounding boundary (packages/core/test/shoe-size.test.ts). Children's sizes carry a
 * growth allowance the formulas do not, so they come from its Table 3 alone, and brands mark
 * sizes half a size to a size away from ISO, so no converted size is exact.
 */
export const shoeSize: Category = {
  id: 'shoe-size',
  name: 'Shoe size',
  aliases: [
    'shoe',
    'shoes',
    'shoe sizes',
    'size',
    'sizes',
    'footwear',
    'sneakers',
    'boots',
    'foot size',
    'kids',
    'kid',
    'child',
    'children',
    "children's",
    'toddler',
    'toddlers',
    'infant',
    'baby',
    'kids shoe size',
    'kids shoes',
    'kids size',
    'brand',
    'brands',
    'shoe brand',
  ],
  baseUnit: 'mondopoint',
  tier: 'standard',
  group: 'sizes',
  prefix: true,
  note: 'ISO 19407’s sizes from the foot’s length, to the half size. Each brand’s row is its own chart read at that foot. Type a brand you fit (nike 10), or measure your foot heel to toe and type its length (27 cm).',
};

const ISO = 'ISO/TS 19407:2015, read through GOST R 57425-2017, its adoption';
const UK_RULE = `${ISO}, §2.2 c): UK adult = (lf + 2 × 8.47)/8.47 − 25, lf the foot length in mm`;
const EUR_RULE = `${ISO}, §2.2 b): EUR = (lf + 2 × 6.67)/6.67, lf the foot length in mm`;
const US_RULE = `${ISO}, §2.2 d): the US system is the UK one shifted one size for men’s shoes and two for women’s`;
const MONDO = `ISO 9407:2019: Mondopoint is the foot length in mm; ${ISO}, §2.2 a) and Table 1 (Mondopoint, China and Japan)`;
const JAPAN = `${ISO}, §2.2 a): Japan sometimes expresses the size in centimetres; Table 1 (Mondopoint, China and Japan)`;
const CHILDREN = `${ISO}, Table 3 (children), straight lines between its rows`;

/** A UK or US size in mm, as the standard prints the barleycorn (an inch's third, 8.4667 mm). */
const UK_STEP = 8.47;
/** A European size in mm, as the standard prints the Paris point (two thirds of a centimetre). */
const EUR_STEP = 6.67;

/** Every scale is marked in half sizes but Mondopoint, in 5 mm. */
const HALF = 0.5;

/** A straight line through sorted points, carried on past the ends so the function is total. */
function along(xs: readonly number[], ys: readonly number[], x: number): number {
  let at = 1;
  while (at < xs.length - 1 && x > xs[at]!) at += 1;
  const x0 = xs[at - 1]!;
  const y0 = ys[at - 1]!;
  return y0 + ((x - x0) * (ys[at]! - y0)) / (xs[at]! - x0);
}

/**
 * A children's scale from ISO's Table 3 (ADR 0027): the (foot length, size) points of its rows
 * that carry a size, up to where the scale restarts at 1 (the UK and US after 13.5), joined by
 * straight lines so a foot between two rows reads between their sizes; its range the rows' feet,
 * half a row's step past each end, as a shoe fits a foot half a step either way (the standard's
 * Table 1, note a).
 */
function childrenScale(
  column: 'eu' | 'uk' | 'us',
): Pick<FunctionalUnit, 'toBase' | 'fromBase' | 'range'> {
  const feet: number[] = [];
  const sizes: number[] = [];
  for (const row of CHILDREN_TABLE) {
    const size = row[column];
    if (size === null) continue;
    if (sizes.length > 0 && size < sizes[sizes.length - 1]!) break;
    feet.push(row.foot);
    sizes.push(size);
  }
  const first = feet[0]!;
  const last = feet[feet.length - 1]!;
  return {
    toBase: (size) => along(sizes, feet, size),
    fromBase: (foot) => along(feet, sizes, foot),
    range: [first - (feet[1]! - first) / 2, last + (last - feet[feet.length - 2]!) / 2],
  };
}

/**
 * Shoe scales over the foot's length in mm (ADR 0027). The adult scales are affine, base = (size
 * + offset) × step: the offset counts the sizes from the scale's zero to the foot's own length,
 * the shoe being two sizes longer than the foot (ISO/TS 19407:2015 §2.2); the children's scales
 * are ISO's Table 3. The US scales split by gender as the standard does, a bare "US 11" being
 * men's, and youth sizes (1Y to 7Y) are men's sizes, as Nike's chart and ISO's Table 3 agree.
 * The names carry no possessive (US men, British children; Sean, 2026-10-20). "m" and "w" are
 * the US scales' shorthand keys (`shorthand`): matched only where the category is named, in Shoe
 * size or by a query's target ("11m to eu", "11 w e"), never at the start, where "11m" is the
 * meter alone and "8w" the watt (Sean, 2026-10-20; docs/UNITS-CATALOG.md §0). The British scale
 * has no "england" or "english", so a one-letter target "e" reaches European.
 */
export const shoeSizeUnits: readonly Unit[] = [
  {
    kind: 'affine',
    id: 'us-men',
    category: 'shoe-size',
    name: 'US men',
    plural: 'US men',
    symbol: 'US M',
    aliases: ['us', 'm us', 'men', "men's", 'usa', 'us size', 'us youth', 'youth', 'us y'],
    system: 'us',
    tier: 'standard',
    factor: UK_STEP,
    offset: 22,
    exact: false,
    conventional: true,
    step: HALF,
    prefix: true,
    shorthand: ['m'],
    source: US_RULE,
    note: 'ISO puts US men’s one size above UK; the Brannock device half a size. Youth sizes (1Y to 7Y) are men’s sizes.',
  },
  {
    kind: 'affine',
    id: 'us-women',
    category: 'shoe-size',
    name: 'US women',
    plural: 'US women',
    symbol: 'US W',
    aliases: ['w us', 'women', "women's", 'ladies', 'us ladies'],
    system: 'us',
    tier: 'standard',
    factor: UK_STEP,
    offset: 21,
    exact: false,
    conventional: true,
    step: HALF,
    prefix: true,
    shorthand: ['w'],
    source: US_RULE,
    note: 'ISO’s scale, men’s + 1; Nike, Clarks, and KEEN count men’s + 1.5, and Zappos’s FAQ + 2.',
  },
  {
    kind: 'functional',
    id: 'us-children',
    category: 'shoe-size',
    name: 'US children',
    plural: 'US children',
    symbol: 'US C',
    aliases: [
      'c us',
      'us kids',
      'us kid',
      'us child',
      'us toddler',
      'us infant',
      'us baby',
      'kids us',
      'toddler us',
    ],
    system: 'us',
    tier: 'standard',
    ...childrenScale('us'),
    exact: false,
    conventional: true,
    step: HALF,
    prefix: true,
    source: CHILDREN,
    note: 'ISO’s children’s table, 4C to 13.5C; from 1Y on, youth sizes are men’s sizes.',
  },
  {
    kind: 'affine',
    id: 'uk',
    category: 'shoe-size',
    name: 'British',
    plural: 'British',
    symbol: 'UK',
    aliases: ['britain', 'uk size'],
    system: 'uk',
    tier: 'standard',
    factor: UK_STEP,
    offset: 23,
    exact: false,
    conventional: true,
    step: HALF,
    prefix: true,
    source: UK_RULE,
    note: 'A third of an inch a size, counted from a four-inch last; ISO’s shoe is two sizes longer than the foot.',
  },
  {
    kind: 'functional',
    id: 'uk-children',
    category: 'shoe-size',
    name: 'British children',
    plural: 'British children',
    symbol: 'UK C',
    aliases: [
      'c uk',
      'uk kids',
      'uk kid',
      'uk child',
      'uk children',
      'uk toddler',
      'uk infant',
      'uk baby',
      'kids uk',
      'toddler uk',
    ],
    system: 'uk',
    tier: 'standard',
    ...childrenScale('uk'),
    exact: false,
    conventional: true,
    step: HALF,
    prefix: true,
    source: CHILDREN,
    note: 'ISO’s children’s table, 3.5 to 13.5; the scale then restarts at 1, which is the adult UK 1.',
  },
  {
    kind: 'affine',
    id: 'eu',
    category: 'shoe-size',
    name: 'European',
    plural: 'European',
    symbol: 'EU',
    aliases: [
      'eur',
      'euro',
      'europe',
      'eu size',
      'continental',
      'paris point',
      'paris points',
      'french',
      'italian',
      'german',
    ],
    system: 'metric',
    tier: 'standard',
    factor: EUR_STEP,
    offset: -2,
    exact: false,
    conventional: true,
    step: HALF,
    prefix: true,
    source: EUR_RULE,
    note: 'Two thirds of a centimetre a size; shoes are often marked half a size above ISO (UK 4 as 37, not 36.5).',
  },
  {
    kind: 'functional',
    id: 'eu-children',
    category: 'shoe-size',
    name: 'European children',
    plural: 'European children',
    symbol: 'EU C',
    aliases: [
      'c eu',
      'eu kids',
      'eu kid',
      'eu child',
      'eu children',
      'eu toddler',
      'eu infant',
      'eu baby',
      'eur kids',
      'euro kids',
      'kids eu',
      'toddler eu',
    ],
    system: 'metric',
    tier: 'standard',
    ...childrenScale('eu'),
    exact: false,
    conventional: true,
    step: HALF,
    prefix: true,
    source: CHILDREN,
    note: 'ISO’s children’s table, 19.5 to 38, which gives a growing foot more room than the adult rule.',
  },
  {
    kind: 'linear',
    id: 'mondopoint',
    category: 'shoe-size',
    name: 'Mondopoint',
    plural: 'Mondopoint',
    symbol: 'mm',
    aliases: ['mondo', 'china', 'chinese'],
    system: 'si',
    tier: 'standard',
    factor: 1,
    exact: true,
    step: 5,
    prefix: true,
    source: MONDO,
    note: 'The foot’s length in millimetres, marked in steps of 5 mm; China’s sizes too.',
  },
  {
    kind: 'linear',
    id: 'foot-cm',
    category: 'shoe-size',
    name: 'Foot length',
    plural: 'Foot length',
    symbol: 'cm',
    aliases: ['cms', 'foot cm', 'centimeters', 'centimetres'],
    system: 'si',
    tier: 'standard',
    factor: 10,
    exact: true,
    step: 0.1,
    prefix: true,
    source: MONDO,
    note: 'The foot’s length in centimetres, measured heel to toe: Mondopoint in centimetres. A brand’s chart gives it where its length is the foot’s.',
  },
  {
    kind: 'linear',
    id: 'japan',
    category: 'shoe-size',
    name: 'Japanese',
    plural: 'Japanese',
    symbol: 'JP',
    aliases: ['japan', 'jpn', 'japan cm'],
    system: 'metric',
    tier: 'standard',
    factor: 10,
    exact: true,
    step: HALF,
    prefix: true,
    source: JAPAN,
    note: 'A size label in centimetres, the foot’s length by ISO; brands print it about a centimetre above the foot, so its symbol is JP.',
  },
];
