import type { Category, Unit } from '../types';

export const temperature: Category = {
  id: 'temperature',
  name: 'Temperature',
  aliases: ['temp', 'degrees', 'hot', 'cold', 'how hot', 'how cold', 'weather'],
  baseUnit: 'kelvin',
  tier: 'basic',
  group: 'everyday',
};

const KELVIN = 'BIPM SI Brochure, 9th ed. (2019), §2.3.1 (kelvin)';
const CELSIUS = 'BIPM SI Brochure, 9th ed. (2019), §2.3.1: t/°C = T/K − 273.15';
const FAHRENHEIT = 'NIST SP 811 (2008) Appendix B.8: T/K = (t/°F + 459.67) / 1.8';

const RANKINE = 'NIST SP 811 (2008) Appendix B.8: T/K = (T/°R) / 1.8';

/** Temperature scales are affine: base = (value + offset) × factor, base is kelvin. */
export const temperatureUnits: readonly Unit[] = [
  {
    kind: 'affine',
    id: 'celsius',
    category: 'temperature',
    name: 'Celsius',
    plural: 'Celsius',
    symbol: '°C',
    aliases: [
      'c',
      'deg c',
      'degc',
      'degree c',
      'degrees c',
      'degree celsius',
      'degrees celsius',
      'centigrade',
      'celcius',
    ],
    system: 'si',
    tier: 'basic',
    factor: 1,
    offset: 273.15,
    exact: true,
    source: CELSIUS,
  },
  {
    kind: 'affine',
    id: 'fahrenheit',
    category: 'temperature',
    name: 'Fahrenheit',
    plural: 'Fahrenheit',
    symbol: '°F',
    aliases: [
      'f',
      'deg f',
      'degf',
      'degree f',
      'degrees f',
      'degree fahrenheit',
      'degrees fahrenheit',
      'farenheit',
      'fahrenheight',
    ],
    system: 'us',
    tier: 'basic',
    factor: 5 / 9,
    offset: 459.67,
    exact: true,
    source: FAHRENHEIT,
  },
  {
    kind: 'linear',
    id: 'kelvin',
    category: 'temperature',
    name: 'kelvin',
    plural: 'kelvins',
    symbol: 'K',
    aliases: ['deg k', 'degrees kelvin'],
    system: 'si',
    tier: 'basic',
    factor: 1,
    exact: true,
    source: KELVIN,
    note: 'Absolute scale. 0 K is absolute zero; there are no degrees.',
  },
  {
    kind: 'affine',
    id: 'rankine',
    category: 'temperature',
    name: 'Rankine',
    plural: 'Rankine',
    symbol: '°R',
    aliases: ['deg r', 'degr', 'degree r', 'degrees r', 'degree rankine', 'degrees rankine'],
    system: 'us',
    tier: 'advanced',
    factor: 5 / 9,
    offset: 0,
    exact: true,
    source: RANKINE,
    note: 'Absolute zero is 0 °R, with degrees the size of Fahrenheit’s. Used in US engineering.',
  },
];
