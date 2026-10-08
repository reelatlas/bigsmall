import { PUBLISHED_7_DIGITS, type GoldenRow } from './types';

const SP811 = 'NIST SP 811 (2008) Appendix B.8';

export const power: GoldenRow[] = [
  {
    value: 1,
    from: 'horsepower',
    to: 'watt',
    expected: 7.456999e2,
    source: `${SP811}: horsepower (550 ft·lbf/s) = 7.456999E+02 W`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'metric-horsepower',
    to: 'watt',
    expected: 7.354988e2,
    source: `${SP811}: horsepower, metric = 7.354988E+02 W`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'metric-horsepower',
    to: 'watt',
    expected: 735.49875,
    source: 'Derived: 75 kgf·m/s = 75 × 9.80665 W',
  },
  {
    value: 1,
    from: 'btu-per-hour',
    to: 'watt',
    expected: 2.930711e-1,
    source: `${SP811}: British thermal unit, International Table, per hour = 2.930711E-01 W`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'ton-of-refrigeration',
    to: 'watt',
    expected: 3.516853e3,
    source: `${SP811}: ton of refrigeration (12 000 Btu_IT/h) = 3.516853E+03 W`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'ton-of-refrigeration',
    to: 'btu-per-hour',
    expected: 12000,
    source: `${SP811}: ton of refrigeration = 12 000 Btu_IT/h`,
  },
  {
    value: 1,
    from: 'kilowatt',
    to: 'watt',
    expected: 1000,
    source: 'BIPM SI Brochure, 9th ed. (2019), Table 7: kilo = 10³',
  },
  {
    value: 1,
    from: 'megawatt',
    to: 'kilowatt',
    expected: 1000,
    source: 'Derived: 10⁶ / 10³',
  },
  {
    value: 1,
    from: 'gigawatt',
    to: 'megawatt',
    expected: 1000,
    source: 'Derived: 10⁹ / 10⁶',
  },
];
