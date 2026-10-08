import { PUBLISHED_7_DIGITS, type GoldenRow } from './types';

const SI_TABLE_8 = 'BIPM SI Brochure, 9th ed. (2019), Table 8';
const SP811 = 'NIST SP 811 (2008) Appendix B.8';

export const angle: GoldenRow[] = [
  {
    value: 180,
    from: 'degree',
    to: 'radian',
    expected: Math.PI,
    source: `${SI_TABLE_8}: 1° = (π/180) rad`,
  },
  {
    value: 1,
    from: 'radian',
    to: 'degree',
    expected: 180 / Math.PI,
    source: `${SI_TABLE_8}: 1° = (π/180) rad`,
  },
  {
    value: 1,
    from: 'degree',
    to: 'arcminute',
    expected: 60,
    source: `${SI_TABLE_8}: 1′ = (1/60)°`,
  },
  {
    value: 1,
    from: 'arcminute',
    to: 'arcsecond',
    expected: 60,
    source: `${SI_TABLE_8}: 1″ = (1/60)′`,
  },
  {
    value: 100,
    from: 'gradian',
    to: 'degree',
    expected: 90,
    source: `${SP811}: gon = 9.0E-01 degree (exact)`,
  },
  {
    value: 1,
    from: 'gradian',
    to: 'radian',
    expected: 1.570796e-2,
    source: `${SP811}: gon = 1.570796E-02 rad`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'revolution',
    to: 'degree',
    expected: 360,
    source: 'Definition: 1 revolution = 360°',
  },
  {
    value: 0.25,
    from: 'revolution',
    to: 'radian',
    expected: Math.PI / 2,
    source: 'Derived: 360° × (π/180) / 4',
  },
];
