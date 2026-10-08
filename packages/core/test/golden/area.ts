import { PUBLISHED_7_DIGITS, type GoldenRow } from './types';

const YP = 'International Yard and Pound Agreement (1959), squared';
const HB44 = 'NIST Handbook 44, Appendix C';
const SP811 = 'NIST SP 811 (2008) Appendix B.8';

export const area: GoldenRow[] = [
  {
    value: 1,
    from: 'square-foot',
    to: 'square-meter',
    expected: 0.09290304,
    source: `${YP}: 0.3048² = 0.09290304 m² exactly`,
  },
  {
    value: 1,
    from: 'square-inch',
    to: 'square-centimeter',
    expected: 6.4516,
    source: `${YP}: 2.54² = 6.4516 cm² exactly`,
  },
  {
    value: 1,
    from: 'acre',
    to: 'square-foot',
    expected: 43560,
    source: `${HB44}: 1 acre = 43,560 ft²`,
  },
  {
    value: 1,
    from: 'hectare',
    to: 'square-meter',
    expected: 10000,
    source: 'BIPM SI Brochure, 9th ed., Table 8: 1 ha = 10^4 m²',
  },
  {
    value: 1,
    from: 'square-kilometer',
    to: 'hectare',
    expected: 100,
    source: 'Derived: 10^6 / 10^4',
  },
  {
    value: 1,
    from: 'square-mile',
    to: 'acre',
    expected: 640,
    source: `${HB44}: 1 mi² = 640 acres`,
  },
  {
    value: 1,
    from: 'hectare',
    to: 'acre',
    expected: 10000 / 4046.8564224,
    source: 'Derived: 10000 / 4046.8564224',
  },
  {
    value: 1,
    from: 'square-mile',
    to: 'square-kilometer',
    expected: 2.589988110336,
    source: 'Derived: 1.609344² km²',
  },
  {
    value: 144,
    from: 'square-inch',
    to: 'square-foot',
    expected: 1,
    source: `${HB44}: 1 ft² = 144 in²`,
  },
  {
    value: 1,
    from: 'square-foot',
    to: 'square-meter',
    expected: 9.290304e-2,
    source: `${SP811}: square foot = 9.290304E-02 m² (exact)`,
  },
  {
    value: 1,
    from: 'square-mile',
    to: 'square-meter',
    expected: 2.589988e6,
    source: `${SP811}: square mile = 2.589988E+06 m²`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'square-yard',
    to: 'square-foot',
    expected: 9,
    source: 'Derived: 3² ft²',
  },
  {
    value: 1,
    from: 'square-yard',
    to: 'square-meter',
    expected: 0.83612736,
    source: 'Derived: 0.9144² m² (1959 agreement)',
  },
];
