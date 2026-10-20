import type { GoldenRow } from './types';

const ISO =
  'ISO/TS 19407:2015 §2.2 (through GOST R 57425-2017): UK adult = (lf + 2 × 8.47)/8.47 − 25, EUR = (lf + 2 × 6.67)/6.67, lf the foot length in mm; US men = UK + 1, US women = UK + 2';
const TABLE_3 =
  'ISO/TS 19407:2015 Table 3 (children): the row at 150 mm reads EUR 24.5, UK 7.5, US 8';

/**
 * The scales at the standard's own points (ADR 0027): a size's foot length by the formula, and
 * the children's table's rows. Table 2 as a whole, rounded to the half size, is held in
 * shoe-size.test.ts.
 */
export const shoeSize: GoldenRow[] = [
  {
    value: 270,
    from: 'mondopoint',
    to: 'japan',
    expected: 27,
    source:
      'ISO/TS 19407:2015 §2.2 a): Japan expresses Mondopoint, the foot length in mm, in centimetres',
  },
  {
    value: 9,
    from: 'uk',
    to: 'mondopoint',
    expected: 32 * 8.47,
    source: `Derived: ${ISO}; (9 + 23) × 8.47 = 271.04 mm, which Table 2 rounds to Mondo 270`,
  },
  {
    value: 42.5,
    from: 'eu',
    to: 'mondopoint',
    expected: 40.5 * 6.67,
    source: `Derived: ${ISO}; (42.5 − 2) × 6.67 = 270.135 mm, which Table 2 rounds to Mondo 270`,
  },
  {
    value: 10,
    from: 'us-men',
    to: 'uk',
    expected: 9,
    source: `${ISO}; Table 2: UK 9 is US men's 10`,
  },
  {
    value: 11,
    from: 'us-women',
    to: 'us-men',
    expected: 10,
    source: `${ISO}; Table 2: UK 9 is US men's 10 and US women's 11`,
  },
  {
    value: 10,
    from: 'us-men',
    to: 'mondopoint',
    expected: 32 * 8.47,
    source: `Derived: ${ISO}; (10 + 22) × 8.47 = 271.04 mm`,
  },
  { value: 8, from: 'us-children', to: 'mondopoint', expected: 150, source: TABLE_3 },
  { value: 7.5, from: 'uk-children', to: 'mondopoint', expected: 150, source: TABLE_3 },
  { value: 24.5, from: 'eu-children', to: 'mondopoint', expected: 150, source: TABLE_3 },
  { value: 150, from: 'mondopoint', to: 'us-children', expected: 8, source: TABLE_3 },
  { value: 150, from: 'mondopoint', to: 'uk-children', expected: 7.5, source: TABLE_3 },
  { value: 150, from: 'mondopoint', to: 'eu-children', expected: 24.5, source: TABLE_3 },
];
