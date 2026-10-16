import { PUBLISHED_7_DIGITS, type GoldenRow } from './types';

const SP811 = 'NIST SP 811 (2008) Appendix B.8';

export const energy: GoldenRow[] = [
  {
    value: 1,
    from: 'calorie',
    to: 'joule',
    expected: 4.184,
    source: `${SP811}: calorie, thermochemical = 4.184 J (exact)`,
  },
  {
    value: 1,
    from: 'kilocalorie',
    to: 'kilojoule',
    expected: 4.184,
    source: 'Derived: 1000 cal = 4184 J',
  },
  {
    value: 1,
    from: 'kilowatt-hour',
    to: 'joule',
    expected: 3.6e6,
    source: `${SP811}: kilowatt hour = 3.6E+06 J (exact)`,
  },
  {
    value: 1,
    from: 'watt-hour',
    to: 'joule',
    expected: 3600,
    source: 'Derived: 1 W × 3600 s',
  },
  {
    value: 1,
    from: 'british-thermal-unit',
    to: 'joule',
    expected: 1.055056e3,
    source: `${SP811}: British thermal unit, International Table = 1.055056E+03 J`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'british-thermal-unit',
    to: 'joule',
    expected: 1055.05585262,
    source: 'Derived: cal_IT 4.1868 J × 453.59237 g / 1.8',
  },
  {
    value: 1,
    from: 'therm',
    to: 'joule',
    expected: 105505585.262,
    source: 'Derived: US EIA, therm = 100,000 Btu; Btu_IT = 1,055.05585262 J (SP 811 footnote 9)',
  },
  {
    value: 1,
    from: 'therm',
    to: 'british-thermal-unit',
    expected: 100000,
    source: 'US EIA Glossary: therm = 100,000 Btu',
  },
  {
    value: 1,
    from: 'foot-pound',
    to: 'joule',
    expected: 1.355818,
    source: `${SP811}: foot pound-force = 1.355818 J`,
    tolerance: PUBLISHED_7_DIGITS,
  },
  {
    value: 1,
    from: 'electronvolt',
    to: 'joule',
    expected: 1.602176634e-19,
    source: 'BIPM SI Brochure, 9th ed. (2019), Table 8: 1 eV = 1.602 176 634 × 10⁻¹⁹ J (exact)',
  },
  {
    value: 1,
    from: 'megajoule',
    to: 'kilowatt-hour',
    expected: 1 / 3.6,
    source: 'Derived: 10⁶ J / 3.6 × 10⁶ J',
  },
  {
    value: 1,
    from: 'gigajoule',
    to: 'megajoule',
    expected: 1000,
    source: 'Derived: 10⁹ / 10⁶',
  },
  {
    value: 1,
    from: 'kilojoule',
    to: 'joule',
    expected: 1000,
    source: 'BIPM SI Brochure, 9th ed. (2019), Table 7: kilo = 10³',
  },
];
