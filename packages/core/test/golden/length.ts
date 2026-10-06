import type { GoldenRow } from './types';

const YP = 'International Yard and Pound Agreement (1959)';
const HB44 = 'NIST Handbook 44, Appendix C';
const SP811 = 'NIST SP 811 (2008) Appendix B.8';

export const length: GoldenRow[] = [
  {
    value: 1,
    from: 'mile',
    to: 'kilometer',
    expected: 1.609344,
    source: `${SP811}: mile = 1.609344E+03 m (exact)`,
  },
  {
    value: 1,
    from: 'inch',
    to: 'centimeter',
    expected: 2.54,
    source: `${YP}: 1 in = 2.54 cm exactly`,
  },
  {
    value: 1,
    from: 'foot',
    to: 'meter',
    expected: 0.3048,
    source: `${YP}: 1 ft = 0.3048 m exactly`,
  },
  {
    value: 1,
    from: 'yard',
    to: 'meter',
    expected: 0.9144,
    source: `${YP}: 1 yd = 0.9144 m exactly`,
  },
  { value: 100, from: 'centimeter', to: 'meter', expected: 1, source: 'SI prefix centi = 10^-2' },
  { value: 1, from: 'kilometer', to: 'meter', expected: 1000, source: 'SI prefix kilo = 10^3' },
  { value: 1, from: 'mile', to: 'foot', expected: 5280, source: `${HB44}: 1 mi = 5280 ft` },
  { value: 5, from: 'foot', to: 'inch', expected: 60, source: `${HB44}: 1 ft = 12 in` },
  {
    value: 1,
    from: 'kilometer',
    to: 'mile',
    expected: 1 / 1.609344,
    source: 'Derived: 1 / 1.609344',
  },
  { value: 1, from: 'meter', to: 'foot', expected: 1 / 0.3048, source: 'Derived: 1 / 0.3048' },
  {
    value: 25.4,
    from: 'millimeter',
    to: 'inch',
    expected: 1,
    source: `${SP811}: 1 in = 25.4 mm exactly`,
  },
  { value: 3, from: 'yard', to: 'foot', expected: 9, source: `${HB44}: 1 yd = 3 ft` },
];
