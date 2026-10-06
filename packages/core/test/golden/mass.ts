import { PUBLISHED_7_DIGITS, type GoldenRow } from './types';

const YP = 'International Yard and Pound Agreement (1959)';
const SP811 = 'NIST SP 811 (2008) Appendix B.8';

export const mass: GoldenRow[] = [
  {
    value: 1,
    from: 'pound',
    to: 'kilogram',
    expected: 0.45359237,
    source: `${YP}: 1 lb = 0.45359237 kg exactly`,
  },
  {
    value: 1,
    from: 'kilogram',
    to: 'pound',
    expected: 1 / 0.45359237,
    source: 'Derived: 1 / 0.45359237',
  },
  {
    value: 1,
    from: 'ounce',
    to: 'gram',
    expected: 28.349523125,
    source: `${YP}: 1 oz = 1/16 lb = 28.349523125 g exactly`,
  },
  {
    value: 16,
    from: 'ounce',
    to: 'pound',
    expected: 1,
    source: 'NIST Handbook 44, Appendix C: 1 lb = 16 oz',
  },
  {
    value: 1,
    from: 'stone',
    to: 'pound',
    expected: 14,
    source: 'UK Weights and Measures Act 1985, Schedule 1: 1 stone = 14 lb',
  },
  {
    value: 1,
    from: 'stone',
    to: 'kilogram',
    expected: 6.35029318,
    source: 'Derived: 14 × 0.45359237',
  },
  {
    value: 1,
    from: 'tonne',
    to: 'kilogram',
    expected: 1000,
    source: 'BIPM SI Brochure, 9th ed., Table 8: 1 t = 10^3 kg',
  },
  { value: 1000, from: 'milligram', to: 'gram', expected: 1, source: 'SI prefix milli = 10^-3' },
  {
    value: 1,
    from: 'kilogram',
    to: 'ounce',
    expected: 1000 / 28.349523125,
    source: 'Derived: 1000 / 28.349523125',
  },
  {
    value: 1,
    from: 'ounce',
    to: 'kilogram',
    expected: 2.834952e-2,
    source: `${SP811}: ounce (avoirdupois) = 2.834952E-02 kg`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'pound',
    to: 'kilogram',
    expected: 4.535924e-1,
    source: `${SP811}: pound (avoirdupois) = 4.535924E-01 kg`,
    tolerance: PUBLISHED_7_DIGITS,
  },
];
