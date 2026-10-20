import type { GoldenRow } from './types';

const SI = 'BIPM SI Brochure, 9th ed. (2019), Table 8';
const GREG = 'Gregorian calendar: mean year 365.2425 d (146,097 d / 400 y); mean month = year / 12';

export const time: GoldenRow[] = [
  // The pair is its first part's size: one of it is 3600 of its last part (ADR 0026).
  {
    value: 1,
    from: 'hour-minute-second',
    to: 'second',
    expected: 3600,
    source: 'BIPM SI Brochure, 9th ed. (2019), Table 8: 1 h = 3600 s',
  },
  { value: 1, from: 'minute', to: 'second', expected: 60, source: `${SI}: 1 min = 60 s` },
  { value: 1, from: 'hour', to: 'minute', expected: 60, source: `${SI}: 1 h = 60 min` },
  { value: 1, from: 'day', to: 'hour', expected: 24, source: `${SI}: 1 d = 24 h` },
  { value: 1, from: 'week', to: 'day', expected: 7, source: 'Definition: 1 week = 7 d' },
  { value: 1, from: 'year', to: 'day', expected: 365.2425, source: GREG },
  { value: 1, from: 'month', to: 'day', expected: 30.436875, source: GREG },
  { value: 1, from: 'year', to: 'month', expected: 12, source: GREG },
  { value: 1, from: 'year', to: 'second', expected: 31556952, source: `${GREG}; 365.2425 × 86400` },
  {
    value: 1000,
    from: 'millisecond',
    to: 'second',
    expected: 1,
    source: 'SI prefix milli = 10^-3',
  },
  { value: 1, from: 'hour', to: 'second', expected: 3600, source: `${SI}: 1 h = 3600 s` },
  { value: 1, from: 'week', to: 'hour', expected: 168, source: 'Derived: 7 × 24' },
  {
    value: 2,
    from: 'year',
    to: 'week',
    expected: 730.485 / 7,
    source: 'Derived: 2 × 365.2425 / 7',
  },
  {
    value: 1,
    from: 'microsecond',
    to: 'millisecond',
    expected: 0.001,
    source: 'BIPM SI Brochure, 9th ed. (2019), Table 7: micro = 10⁻⁶, milli = 10⁻³',
  },
  {
    value: 1,
    from: 'nanosecond',
    to: 'second',
    expected: 1e-9,
    source: 'BIPM SI Brochure, 9th ed. (2019), Table 7: nano = 10⁻⁹',
  },
];
