import type { Category, Unit } from '../types';

export const fuelEconomy: Category = {
  id: 'fuel-economy',
  name: 'Fuel economy',
  aliases: ['fuel efficiency', 'fuel consumption', 'mileage', 'gas mileage', 'fuel use'],
  baseUnit: 'kilometer-per-liter',
  tier: 'standard',
  group: 'common',
};

const LITRE = 'BIPM SI Brochure, 9th ed. (2019), Table 8 (litre) and Table 7 (SI prefixes)';
const PER_100_KM = `Definition: L/100 km = 100 / (km/L); ${LITRE}`;
const MPG_US =
  'NIST SP 811 (2008) Appendix B.8: mile per gallon (U.S.) = 4.251437E-01 km/L; exact from 1 mi = 1.609344 km, 1 gal (U.S.) = 3.785411784 L';
const MPG_UK =
  'NIST SP 811 (2008) Appendix B.8: gallon (U.K.) = 4.54609E-03 m³ (exact); 1 mi = 1.609344 km (1959 agreement)';
const PER_100_MI =
  'Definition: gal/100 mi = 100 / (mi/gal); NIST SP 811 (2008) Appendix B.8: 1 mi = 1.609344 km, 1 gal (U.S.) = 3.785411784 L';

const MILE_KM = 1.609344;
const US_GALLON_L = 3.785411784;
const UK_GALLON_L = 4.54609;
/** km/L at one US gallon per 100 miles: a hundred miles in kilometers over a US gallon in liters. */
const PER_100_MI_KM_PER_L = (100 * MILE_KM) / US_GALLON_L;

/**
 * Fuel economy (docs/UNITS-CATALOG.md §4): distance per fuel, or fuel per distance, the
 * reciprocal. Units of fuel per distance divide, so at 0 they have no value in the others.
 */
export const fuelEconomyUnits: readonly Unit[] = [
  {
    kind: 'reciprocal',
    id: 'liter-per-100-kilometers',
    category: 'fuel-economy',
    name: 'liter per 100 kilometers',
    plural: 'liters per 100 kilometers',
    symbol: 'L/100 km',
    aliases: [
      'liters per 100 km',
      'litres per 100 km',
      'litre per 100 kilometres',
      'litres per 100 kilometres',
      'l per 100 km',
    ],
    system: 'metric',
    tier: 'standard',
    factor: 100,
    exact: true,
    source: PER_100_KM,
    note: 'Fuel used over 100 km, so lower is more economical.',
  },
  {
    kind: 'linear',
    id: 'kilometer-per-liter',
    category: 'fuel-economy',
    name: 'kilometer per liter',
    plural: 'kilometers per liter',
    symbol: 'km/L',
    aliases: ['kpl', 'km per liter', 'km per litre', 'kilometre per litre', 'kilometres per litre'],
    system: 'metric',
    tier: 'standard',
    factor: 1,
    exact: true,
    source: LITRE,
  },
  {
    kind: 'linear',
    id: 'mile-per-us-gallon',
    category: 'fuel-economy',
    name: 'mile per US gallon',
    plural: 'miles per US gallon',
    symbol: 'mpg (US)',
    aliases: ['mpg US', 'US mpg', 'miles per gallon (US)', 'mile per gallon (US)', 'mi/gal (US)'],
    system: 'us',
    tier: 'standard',
    factor: MILE_KM / US_GALLON_L,
    exact: true,
    source: MPG_US,
    note: 'Miles per US gallon (3.785411784 L).',
  },
  {
    kind: 'linear',
    id: 'mile-per-imperial-gallon',
    category: 'fuel-economy',
    name: 'mile per imperial gallon',
    plural: 'miles per imperial gallon',
    symbol: 'mpg (UK)',
    aliases: [
      'mpg UK',
      'UK mpg',
      'imperial mpg',
      'mpg imperial',
      'miles per gallon (UK)',
      'mile per gallon (UK)',
      'mi/gal (UK)',
    ],
    system: 'uk',
    tier: 'standard',
    factor: MILE_KM / UK_GALLON_L,
    exact: true,
    source: MPG_UK,
    note: 'Miles per imperial gallon (4.54609 L), about a fifth larger than the US gallon.',
  },
  {
    kind: 'reciprocal',
    id: 'us-gallon-per-100-miles',
    category: 'fuel-economy',
    name: 'US gallon per 100 miles',
    plural: 'US gallons per 100 miles',
    symbol: 'gal/100 mi',
    aliases: ['gallons per 100 miles', 'gallon per 100 miles', 'gal per 100 mi'],
    system: 'us',
    tier: 'specialty',
    factor: PER_100_MI_KM_PER_L,
    exact: true,
    source: PER_100_MI,
    note: 'Fuel used over 100 miles, as US fuel economy labels also give it.',
  },
];
