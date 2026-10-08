import { PUBLISHED_7_DIGITS, type GoldenRow } from './types';

/** km/L in one mile per US gallon: 1.609344 km over 3.785411784 L. */
const MPG_US = 1.609344 / 3.785411784;

export const fuelEconomy: GoldenRow[] = [
  {
    value: 1,
    from: 'mile-per-us-gallon',
    to: 'kilometer-per-liter',
    expected: 4.251437e-1,
    source: 'NIST SP 811 (2008) Appendix B.8: mile per gallon (U.S.) = 4.251437E-01 km/L',
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'mile-per-imperial-gallon',
    to: 'kilometer-per-liter',
    expected: 1.609344 / 4.54609,
    source: 'Derived: 1.609344 km / 4.54609 L',
  },
  {
    value: 1,
    from: 'mile-per-us-gallon',
    to: 'mile-per-imperial-gallon',
    expected: 4.54609 / 3.785411784,
    source: 'Derived: 4.54609 L / 3.785411784 L',
  },
  {
    value: 5,
    from: 'liter-per-100-kilometers',
    to: 'kilometer-per-liter',
    expected: 20,
    source: 'Definition: L/100 km = 100 / (km/L)',
  },
  {
    value: 10,
    from: 'kilometer-per-liter',
    to: 'liter-per-100-kilometers',
    expected: 10,
    source: 'Definition: L/100 km = 100 / (km/L)',
  },
  {
    value: 30,
    from: 'mile-per-us-gallon',
    to: 'liter-per-100-kilometers',
    expected: 100 / (30 * MPG_US),
    source: 'Derived: 100 / (30 × 1.609344 / 3.785411784)',
  },
  {
    value: 4,
    from: 'us-gallon-per-100-miles',
    to: 'mile-per-us-gallon',
    expected: 25,
    source: 'Definition: gal/100 mi = 100 / (mi/gal)',
  },
  {
    value: 1,
    from: 'us-gallon-per-100-miles',
    to: 'liter-per-100-kilometers',
    expected: 3.785411784 / 1.609344,
    source: 'Derived: 3.785411784 L / 1.609344 km, both per hundred',
  },
];
