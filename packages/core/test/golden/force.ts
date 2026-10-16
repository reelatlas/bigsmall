import { PUBLISHED_7_DIGITS, type GoldenRow } from './types';

const SP811 = 'NIST SP 811 (2008) Appendix B.8';

export const force: GoldenRow[] = [
  {
    value: 1,
    from: 'pound-force',
    to: 'newton',
    expected: 4.448222,
    source: `${SP811}: pound-force (lbf) = 4.448222E+00 N`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'pound-force',
    to: 'newton',
    expected: 4.4482216152605,
    source: `${SP811}, footnote 23: with gₙ = 9.80665 m/s², exactly 4.4482216152605 N`,
  },
  {
    value: 1,
    from: 'kilogram-force',
    to: 'newton',
    expected: 9.80665,
    source: `${SP811}: kilogram-force (kgf) = 9.80665E+00 N (exact)`,
  },
  {
    value: 1,
    from: 'dyne',
    to: 'newton',
    expected: 1e-5,
    source: `${SP811}: dyne (dyn) = 1.0E-05 N (exact)`,
  },
  {
    value: 1,
    from: 'ounce-force',
    to: 'newton',
    expected: 2.780139e-1,
    source: `${SP811}: ounce (avoirdupois)-force (ozf) = 2.780139E-01 N`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'kip',
    to: 'newton',
    expected: 4.448222e3,
    source: `${SP811}: kip (1 kip = 1000 lbf) = 4.448222E+03 N`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'kilonewton',
    to: 'newton',
    expected: 1000,
    source: 'BIPM SI Brochure, 9th ed. (2019), Table 7: kilo = 10³',
  },
  {
    value: 1,
    from: 'kilogram-force',
    to: 'pound-force',
    expected: 1 / 0.45359237,
    source: 'Derived: both under gₙ, so their ratio is the kilogram over the pound, 1 / 0.45359237',
  },
  {
    value: 1,
    from: 'kip',
    to: 'kilonewton',
    expected: 4.4482216152605,
    source: 'Derived: 1000 × 0.45359237 kg × 9.80665 m/s² = 4448.2216152605 N',
  },
];
