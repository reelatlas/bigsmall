import { PUBLISHED_7_DIGITS, type GoldenRow } from './types';

const SP811 = 'NIST SP 811 (2008) Appendix B.8';
/** Pound-force per square inch, in pascals: 0.45359237 kg × 9.80665 m/s² over 0.0254² m². */
const PSI = (0.45359237 * 9.80665) / (0.0254 * 0.0254);

export const pressure: GoldenRow[] = [
  {
    value: 1,
    from: 'bar',
    to: 'pascal',
    expected: 1e5,
    source: `${SP811}: bar = 1.0E+05 Pa (exact)`,
  },
  {
    value: 1,
    from: 'atmosphere',
    to: 'pascal',
    expected: 101325,
    source: `${SP811}: atmosphere, standard = 1.01325E+05 Pa (exact)`,
  },
  {
    value: 1,
    from: 'pound-per-square-inch',
    to: 'pascal',
    expected: 6.894757e3,
    source: `${SP811}: pound-force per square inch = 6.894757E+03 Pa`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'millimeter-of-mercury',
    to: 'pascal',
    expected: 1.333224e2,
    source: `${SP811}: millimeter of mercury, conventional = 1.333224E+02 Pa`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'inch-of-mercury',
    to: 'pascal',
    expected: 3.386389e3,
    source: `${SP811}: inch of mercury, conventional = 3.386389E+03 Pa`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'inch-of-mercury',
    to: 'millimeter-of-mercury',
    expected: 25.4,
    source: 'Derived: 1 in = 25.4 mm, the same mercury column',
  },
  {
    value: 1,
    from: 'atmosphere',
    to: 'pound-per-square-inch',
    expected: 101325 / PSI,
    source: 'Derived: 101325 Pa / (0.45359237 × 9.80665 / 0.0254²) Pa',
  },
  {
    value: 1,
    from: 'atmosphere',
    to: 'kilopascal',
    expected: 101.325,
    source: 'Derived: 101325 / 1000',
  },
  {
    value: 1,
    from: 'bar',
    to: 'hectopascal',
    expected: 1000,
    source: 'Derived: 10⁵ Pa / 10² Pa',
  },
  {
    value: 1,
    from: 'megapascal',
    to: 'bar',
    expected: 10,
    source: 'Derived: 10⁶ Pa / 10⁵ Pa',
  },
  {
    value: 1,
    from: 'kilopascal',
    to: 'pascal',
    expected: 1000,
    source: 'BIPM SI Brochure, 9th ed. (2019), Table 7: kilo = 10³',
  },
];
