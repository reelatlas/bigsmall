import type { GoldenRow } from './types';

const IEC = 'IEC 80000-13:2008';

export const data: GoldenRow[] = [
  { value: 1, from: 'byte', to: 'bit', expected: 8, source: `${IEC}: 1 B = 8 bit` },
  { value: 1, from: 'kilobyte', to: 'byte', expected: 1000, source: `${IEC}: 1 kB = 10^3 B` },
  { value: 1, from: 'megabyte', to: 'kilobyte', expected: 1000, source: `${IEC}: 1 MB = 10^6 B` },
  { value: 1, from: 'gigabyte', to: 'megabyte', expected: 1000, source: `${IEC}: 1 GB = 10^9 B` },
  { value: 1, from: 'terabyte', to: 'gigabyte', expected: 1000, source: `${IEC}: 1 TB = 10^12 B` },
  { value: 1, from: 'gigabyte', to: 'byte', expected: 1e9, source: `${IEC}: 1 GB = 10^9 B` },
  { value: 8000, from: 'bit', to: 'kilobyte', expected: 1, source: 'Derived: 8000 bit / 8 / 1000' },
  { value: 1, from: 'terabyte', to: 'megabyte', expected: 1e6, source: 'Derived: 10^12 / 10^6' },
  { value: 1.5, from: 'megabyte', to: 'bit', expected: 12e6, source: 'Derived: 1.5 × 10^6 × 8' },
  { value: 0.5, from: 'byte', to: 'bit', expected: 4, source: 'Derived: 0.5 × 8' },
];
