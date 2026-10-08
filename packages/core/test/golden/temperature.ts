import type { GoldenRow } from './types';

const SI = 'BIPM SI Brochure, 9th ed. (2019), §2.3.1: t/°C = T/K − 273.15';
const SP811 = 'NIST SP 811 (2008) Appendix B.8: T/K = (t/°F + 459.67) / 1.8';

export const temperature: GoldenRow[] = [
  { value: 0, from: 'celsius', to: 'kelvin', expected: 273.15, source: SI },
  {
    value: 100,
    from: 'celsius',
    to: 'fahrenheit',
    expected: 212,
    source: `${SP811}; water boils at 100 °C = 212 °F`,
  },
  { value: 32, from: 'fahrenheit', to: 'celsius', expected: 0, source: `${SP811}; 32 °F = 0 °C` },
  {
    value: -40,
    from: 'fahrenheit',
    to: 'celsius',
    expected: -40,
    source: `${SP811}; the scales cross at −40`,
  },
  {
    value: -40,
    from: 'celsius',
    to: 'fahrenheit',
    expected: -40,
    source: `${SP811}; the scales cross at −40`,
  },
  { value: 0, from: 'kelvin', to: 'celsius', expected: -273.15, source: SI },
  {
    value: 98.6,
    from: 'fahrenheit',
    to: 'celsius',
    expected: 37,
    source: `${SP811}; (98.6 + 459.67) / 1.8 − 273.15`,
  },
  {
    value: 37,
    from: 'celsius',
    to: 'fahrenheit',
    expected: 98.6,
    source: `${SP811}; 37 × 1.8 + 32`,
  },
  {
    value: 300,
    from: 'kelvin',
    to: 'fahrenheit',
    expected: 80.33,
    source: `${SP811}; (300 − 273.15) × 1.8 + 32`,
  },
  { value: 273.15, from: 'kelvin', to: 'fahrenheit', expected: 32, source: SP811 },
  { value: 212, from: 'fahrenheit', to: 'kelvin', expected: 373.15, source: SP811 },
  {
    value: 491.67,
    from: 'rankine',
    to: 'celsius',
    expected: 0,
    source: 'NIST SP 811 (2008) Appendix B.8: T/K = (T/°R) / 1.8; 491.67 / 1.8 = 273.15',
  },
  {
    value: 671.67,
    from: 'rankine',
    to: 'fahrenheit',
    expected: 212,
    source: 'Derived: t/°F = T/°R − 459.67',
  },
  {
    value: 1.8,
    from: 'rankine',
    to: 'kelvin',
    expected: 1,
    source: 'NIST SP 811 (2008) Appendix B.8: T/K = (T/°R) / 1.8',
  },
];
