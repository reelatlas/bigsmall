import { PUBLISHED_7_DIGITS, type GoldenRow } from './types';

const SP811 = 'NIST SP 811 (2008) Appendix B.8';

export const torque: GoldenRow[] = [
  {
    value: 1,
    from: 'pound-foot',
    to: 'newton-meter',
    expected: 1.355818,
    source: `${SP811}: pound-force foot (lbf · ft) = 1.355818E+00 N · m`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'pound-inch',
    to: 'newton-meter',
    expected: 1.129848e-1,
    source: `${SP811}: pound-force inch (lbf · in) = 1.129848E-01 N · m`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'kilogram-force-meter',
    to: 'newton-meter',
    expected: 9.80665,
    source: `${SP811}: kilogram-force meter (kgf · m) = 9.80665E+00 N · m (exact)`,
  },
  {
    value: 1,
    from: 'ounce-force-inch',
    to: 'newton-meter',
    expected: 7.061552e-3,
    source: `${SP811}: ounce (avoirdupois)-force inch (ozf · in) = 7.061552E-03 N · m`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'pound-foot',
    to: 'newton-meter',
    expected: 4.4482216152605 * 0.3048,
    source: 'Derived: 4.4482216152605 N (SP 811 footnote 23) × 0.3048 m (1959 agreement)',
  },
  {
    value: 1,
    from: 'pound-foot',
    to: 'pound-inch',
    expected: 12,
    source: 'Derived: 1 ft = 12 in',
  },
  {
    value: 1,
    from: 'kilogram-force-meter',
    to: 'kilogram-force-centimeter',
    expected: 100,
    source: 'Derived: 1 m = 100 cm',
  },
  {
    value: 1,
    from: 'newton-meter',
    to: 'newton-centimeter',
    expected: 100,
    source: 'BIPM SI Brochure, 9th ed. (2019), Table 7: centi = 10⁻²',
  },
  {
    value: 100,
    from: 'newton-meter',
    to: 'pound-foot',
    expected: 100 / (0.45359237 * 9.80665 * 0.3048),
    source: 'Derived: a torque wrench’s 100 N·m over the pound-foot, 1.3558179483314004 N·m',
  },
];
