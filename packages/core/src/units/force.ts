import type { Category, Unit } from '../types';

export const force: Category = {
  id: 'force',
  name: 'Force',
  aliases: ['thrust', 'tension', 'load', 'weight force'],
  baseUnit: 'newton',
  tier: 'advanced',
  group: 'mechanics',
};

const SI = 'BIPM SI Brochure, 9th ed. (2019), Table 4 (newton = kg·m/s²) and Table 7 (SI prefixes)';
const POUND_FORCE_SOURCE =
  'NIST SP 811 (2008) Appendix B.8: pound-force (lbf) = 4.448222E+00 N; exact from 1 lb = 0.45359237 kg, gₙ = 9.80665 m/s² (footnote 23: 4.4482216152605 N)';
const KILOGRAM_FORCE =
  'NIST SP 811 (2008) Appendix B.8: kilogram-force (kgf) = 9.80665E+00 N (exact); kilopond (kp), the same';
const DYNE = 'NIST SP 811 (2008) Appendix B.8: dyne (dyn) = 1.0E-05 N (exact)';
const OUNCE_FORCE =
  'NIST SP 811 (2008) Appendix B.8: ounce (avoirdupois)-force (ozf) = 2.780139E-01 N; exact as 1/16 lbf';
const KIP =
  'NIST SP 811 (2008) Appendix B.8: kip (1 kip = 1000 lbf) = 4.448222E+03 N; exact from the pound-force';

/** Pound-force: a pound under standard gravity, in newtons. */
const POUND_FORCE = 0.45359237 * 9.80665;

export const forceUnits: readonly Unit[] = [
  {
    kind: 'linear',
    id: 'newton',
    category: 'force',
    name: 'newton',
    plural: 'newtons',
    symbol: 'N',
    aliases: [],
    system: 'si',
    tier: 'basic',
    factor: 1,
    exact: true,
    source: SI,
  },
  {
    kind: 'linear',
    id: 'kilonewton',
    category: 'force',
    name: 'kilonewton',
    plural: 'kilonewtons',
    symbol: 'kN',
    aliases: [],
    system: 'si',
    tier: 'basic',
    factor: 1e3,
    exact: true,
    source: SI,
  },
  {
    kind: 'linear',
    id: 'pound-force',
    category: 'force',
    name: 'pound-force',
    plural: 'pounds-force',
    symbol: 'lbf',
    aliases: [
      'pound force',
      'pounds force',
      'lb force',
      'lbs force',
      'lb-force',
      'lbs of force',
      'pounds of force',
    ],
    system: 'imperial',
    tier: 'basic',
    factor: POUND_FORCE,
    exact: true,
    source: POUND_FORCE_SOURCE,
    note: 'A pound’s weight under standard gravity, 9.80665 m/s²: about 4.448 N.',
  },
  {
    kind: 'linear',
    id: 'kilogram-force',
    category: 'force',
    name: 'kilogram-force',
    plural: 'kilograms-force',
    symbol: 'kgf',
    aliases: [
      'kilogram force',
      'kilograms force',
      'kg force',
      'kg-force',
      'kilopond',
      'kiloponds',
      'kp',
    ],
    system: 'metric',
    tier: 'basic',
    factor: 9.80665,
    exact: true,
    source: KILOGRAM_FORCE,
    note: 'A kilogram’s weight under standard gravity: 9.80665 N. Also the kilopond (kp).',
  },
  {
    kind: 'linear',
    id: 'dyne',
    category: 'force',
    name: 'dyne',
    plural: 'dynes',
    symbol: 'dyn',
    aliases: [],
    system: 'metric',
    tier: 'advanced',
    factor: 1e-5,
    exact: true,
    source: DYNE,
    note: 'The centimeter-gram-second unit: a hundred-thousandth of a newton.',
  },
  {
    kind: 'linear',
    id: 'ounce-force',
    category: 'force',
    name: 'ounce-force',
    plural: 'ounces-force',
    symbol: 'ozf',
    aliases: ['ounce force', 'ounces force', 'oz force', 'oz-force'],
    system: 'imperial',
    tier: 'advanced',
    factor: POUND_FORCE / 16,
    exact: true,
    source: OUNCE_FORCE,
    note: 'A sixteenth of a pound-force.',
  },
  {
    kind: 'linear',
    id: 'kip',
    category: 'force',
    name: 'kip',
    plural: 'kips',
    symbol: 'kip',
    aliases: ['kilopound', 'kilopounds', 'kilopound-force', 'klbf'],
    system: 'us',
    tier: 'advanced',
    factor: 1000 * POUND_FORCE,
    exact: true,
    source: KIP,
    note: 'A thousand pounds-force, in US structural engineering.',
  },
];
