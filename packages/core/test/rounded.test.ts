import { describe, expect, it } from 'vitest';
import {
  formatFraction,
  formatPlaces,
  formatSignificant,
  fractionsOf,
  type FractionSize,
  type Rounding,
} from '../src/index';

const sizes = (...each: FractionSize[]) => new Set<FractionSize>(each);
const listed = (chosen: ReadonlySet<FractionSize>) =>
  fractionsOf(chosen).map((fraction) => `${fraction.n}/${fraction.d}`);
const places = (value: number, count: number, rounding: Rounding = 'nearest') =>
  formatPlaces(value, { places: count, rounding, locale: 'en-US' })?.text ?? null;
const fraction = (
  value: number,
  chosen: ReadonlySet<FractionSize>,
  rounding: Rounding = 'nearest',
) => formatFraction(value, { sizes: chosen, rounding, locale: 'en-US' });
const eighths = sizes(2, 4, 8);

describe('formatPlaces', () => {
  it('writes a value to a place, rounded to the nearest, up, or down', () => {
    expect(places(0.473176, 2)).toBe('0.47');
    expect(places(0.473176, 2, 'up')).toBe('0.48');
    expect(places(0.479, 2, 'down')).toBe('0.47');
    expect(places(1234.5678, 1)).toBe('1,234.6');
    expect(places(96, 2)).toBe('96.00');
  });

  it('writes every place, trailing zeros too, so a column reads alike', () => {
    expect(places(0.5, 2)).toBe('0.50');
    expect(places(0.1, 3)).toBe('0.100');
    expect(places(0, 2)).toBe('0.00');
  });

  it('never rounds a value down a step for float noise', () => {
    // 0.29 × 100 is 28.999… in binary.
    expect(places(0.29, 2, 'down')).toBe('0.29');
    // 12,345 miles in feet arrive as 65,181,599.99999999, which is 65,181,600 exactly.
    expect(places(65181599.99999999, 2, 'down')).toBe('65,181,600.00');
    // 2.675 is 2.67499999999999982 in binary: the tie as typed, away from zero.
    expect(places(2.675, 2)).toBe('2.68');
  });

  it('keeps a large value’s real digits: the number itself rounds, float noise alone forgiven', () => {
    // A snap to 12 significant digits wrote zeros in these places until 2026-10-18.
    expect(places(9460730472580.8, 2)).toBe('9,460,730,472,580.80'); // 1 light-year in km
    expect(places(30856775814913.67, 2)).toBe('30,856,775,814,913.67'); // 1 parsec in km
    expect(places(12345678901.23, 2, 'down')).toBe('12,345,678,901.23');
    expect(places(12345678901.23, 2, 'up')).toBe('12,345,678,901.23');
    // Past 1e15 no hundredth exists (the double's step is 0.125 there): places give way.
    expect(places(2e15, 2)).toBeNull();
  });

  it('rounds up toward larger values and down toward smaller, below zero too', () => {
    expect(places(-2.15, 1, 'up')).toBe('-2.1');
    expect(places(-2.15, 1, 'down')).toBe('-2.2');
  });

  it('rounds small values as chosen, and says one that rounds to zero is below the last place', () => {
    expect(places(0.006, 2)).toBe('0.01');
    expect(places(0.000473, 2, 'up')).toBe('0.01');
    expect(places(0.000473, 2)).toBe('< 0.01');
    expect(places(0.000473, 2, 'down')).toBe('< 0.01');
    expect(places(-0.004, 2)).toBe('> -0.01');
    expect(places(-0.004, 2, 'down')).toBe('-0.01');
    expect(places(0.01, 2, 'down')).toBe('0.01');
    expect(places(Number.NaN, 2)).toBeNull();
  });
});

describe('ties to places', () => {
  it('round away from zero, below zero as above it', () => {
    const at = (value: number, places: number) =>
      formatPlaces(value, { places, rounding: 'nearest', locale: 'en-US' })?.text;
    expect([at(2.5, 0), at(-2.5, 0)]).toEqual(['3', '-3']);
    expect([at(0.125, 2), at(-0.125, 2)]).toEqual(['0.13', '-0.13']);
    expect([at(0.5, 0), at(-0.5, 0)]).toEqual(['1', '-1']);
    expect([at(1.005, 2), at(-1.005, 2)]).toEqual(['1.01', '-1.01']);
    // Up and down keep their direction, toward larger and smaller values.
    expect(formatPlaces(-2.5, { places: 0, rounding: 'up', locale: 'en-US' })?.text).toBe('-2');
    expect(formatPlaces(-2.5, { places: 0, rounding: 'down', locale: 'en-US' })?.text).toBe('-3');
  });
});

describe('fractionsOf', () => {
  it('writes each fraction in the smallest size chosen that writes it', () => {
    expect(listed(eighths)).toEqual(['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8']);
    // Quarters alone write a half as 2/4; with halves as well, 1/2.
    expect(listed(sizes(4))).toEqual(['1/4', '2/4', '3/4']);
    expect(listed(sizes(2, 4))).toEqual(['1/4', '1/2', '3/4']);
    expect(listed(sizes(16)).slice(0, 4)).toEqual(['1/16', '2/16', '3/16', '4/16']);
    // Thirds mix with the rest, for cups, and fifths as thirds do.
    expect(listed(sizes(2, 3, 4))).toEqual(['1/4', '1/3', '1/2', '2/3', '3/4']);
    expect(listed(sizes(2, 5))).toEqual(['1/5', '2/5', '1/2', '3/5', '4/5']);
    expect(listed(sizes(4, 5)).slice(0, 4)).toEqual(['1/5', '1/4', '2/5', '2/4']);
  });
});

describe('formatFraction', () => {
  it('writes a mixed number in the sizes chosen, marked when not exact', () => {
    expect(fraction(6.3, sizes(2, 4, 8, 16))).toEqual({ text: '6 5/16', approx: true });
    expect(fraction(6.3, sizes(2, 4))?.text).toBe('6 1/4');
    expect(fraction(2.4, sizes(5))).toEqual({ text: '2 2/5', approx: false });
    expect(fraction(6.3, sizes(2, 4, 5))).toEqual({ text: '6 1/4', approx: true });
    expect(fraction(6.3, sizes(2, 4), 'up')?.text).toBe('6 1/2');
    expect(fraction(6.3, eighths, 'down')?.text).toBe('6 1/4');
    expect(fraction(2.5, sizes(2, 64))).toEqual({ text: '2 1/2', approx: false });
    expect(fraction(0.75, eighths)?.text).toBe('3/4');
    expect(fraction(0.9999, sizes(2, 4))?.text).toBe('1');
    expect(fraction(1.7, sizes(2, 3, 4))?.text).toBe('1 2/3');
  });

  it('writes the rare ones of a fine size too', () => {
    expect(fraction(0.078125, sizes(64))).toEqual({ text: '5/64', approx: false });
  });

  it('keeps a fraction in its own size where the smaller one is not chosen', () => {
    expect(fraction(2.5, sizes(4))?.text).toBe('2 2/4');
    expect(fraction(-1.5, sizes(4))?.text).toBe('-1 2/4');
  });

  it('rounds up toward larger values and down toward smaller, below zero too', () => {
    expect(fraction(-6.3, sizes(2, 4), 'up')?.text).toBe('-6 1/4');
    expect(fraction(-6.3, sizes(2, 4), 'down')?.text).toBe('-6 1/2');
    expect(fraction(-1.75, sizes(2, 4))?.text).toBe('-1 3/4');
  });

  it('never rounds a value down a step for float noise', () => {
    expect(fraction(2.4999999999999996, eighths, 'down')?.text).toBe('2 1/2');
  });

  it('rounds a tie away from zero, below zero as above it', () => {
    expect(fraction(2.0625, eighths)).toEqual({ text: '2 1/8', approx: true });
    expect(fraction(-2.0625, eighths)).toEqual({ text: '-2 1/8', approx: true });
    expect(fraction(0.0625, eighths)).toEqual({ text: '1/8', approx: true });
    expect(fraction(-0.0625, eighths)).toEqual({ text: '-1/8', approx: true });
    expect(fraction(-2.5, sizes(2), 'up')?.text).toBe('-2 1/2');
  });

  it('rounds small values as chosen, and says one that rounds to zero is below the smallest size', () => {
    expect(fraction(0.07, eighths)).toEqual({ text: '1/8', approx: true });
    expect(fraction(0.0012, eighths, 'up')).toEqual({ text: '1/8', approx: true });
    expect(fraction(0.0012, eighths)).toEqual({ text: '< 1/8', approx: false });
    expect(fraction(0.05, eighths, 'down')?.text).toBe('< 1/8');
    expect(fraction(0.001, sizes(2, 64))?.text).toBe('< 1/64');
    expect(fraction(-0.001, eighths)?.text).toBe('> -1/8');
    expect(fraction(0.125, eighths, 'down')?.text).toBe('1/8');
    expect(fraction(0, eighths)?.text).toBe('0');
  });

  it('writes a value past a million as its whole number, rounded as chosen', () => {
    expect(fraction(2_000_000, eighths)).toEqual({ text: '2,000,000', approx: false });
    expect(fraction(1_043_262.45, eighths)).toEqual({ text: '1,043,262', approx: true });
    expect(fraction(1_043_262.45, eighths, 'up')?.text).toBe('1,043,263');
    expect(fraction(-1_043_262.45, eighths, 'down')?.text).toBe('-1,043,263');
  });

  it('marks a large whole number exact when only float noise separates it', () => {
    // 12,345 miles is 65,181,600 feet exactly; doubles land at 65,181,599.99999999.
    expect(fraction(65_181_599.99999999, eighths)).toEqual({ text: '65,181,600', approx: false });
    expect(fraction(1_481_481_468.0000002, eighths)).toEqual({
      text: '1,481,481,468',
      approx: false,
    });
    // A part that is really there still marks it.
    expect(fraction(65_181_600.25, eighths)?.approx).toBe(true);
    expect(fraction(1e14 + 0.5, eighths)?.approx).toBe(true);
  });

  it('leaves a value with no size chosen, or past where places mean anything, to its digits', () => {
    expect(fraction(0.5, sizes())).toBeNull();
    expect(fraction(2e15, eighths)).toBeNull();
  });
});

const significant = (value: number, rounding: Rounding = 'nearest', digits = 6) =>
  formatSignificant(value, { digits, rounding, locale: 'en-US' });

// No limit is the table's six significant digits, a cut like any other, so it rounds as chosen
// (docs/UX-SPEC.md §7; Sean, 2026-10-18).
describe('formatSignificant', () => {
  it('writes a value to six significant digits, rounded to the nearest, up, or down', () => {
    expect(significant(1 / 3)).toBe('0.333333');
    expect(significant(1 / 3, 'up')).toBe('0.333334');
    expect(significant(1 / 3, 'down')).toBe('0.333333');
    expect(significant(2 / 3)).toBe('0.666667');
    expect(significant(2 / 3, 'down')).toBe('0.666666');
    expect(significant(1234567.89)).toBe('1,234,570');
    expect(significant(1234567.89, 'up')).toBe('1,234,570');
    expect(significant(1234567.89, 'down')).toBe('1,234,560');
  });

  it('goes toward larger values up and smaller down, below zero too, as ceiling and floor do', () => {
    expect(significant(-2 / 3)).toBe('-0.666667');
    expect(significant(-2 / 3, 'up')).toBe('-0.666666');
    expect(significant(-2 / 3, 'down')).toBe('-0.666667');
  });

  it('leaves a value already at its digits alone in every direction, float noise and all', () => {
    expect(significant(0.1, 'up')).toBe('0.1');
    expect(significant(0.3048, 'up')).toBe('0.3048');
    expect(significant(0.3048, 'down')).toBe('0.3048');
    expect(significant(1609.344, 'down')).toBe('1,609.34');
    expect(significant(1609.344, 'up')).toBe('1,609.35');
  });

  it('carries into the next digit, and takes the scientific form where the table does', () => {
    expect(significant(9.999999, 'up')).toBe('10');
    expect(significant(99999.95)).toBe('100,000');
    expect(significant(1e20 / 3)).toBe('3.33333E19');
    expect(significant(1e20 / 3, 'up')).toBe('3.33334E19');
    expect(significant(0.000001 / 3, 'up')).toBe('3.33334E-7');
  });

  it('writes zero as zero, and nothing for what is not finite', () => {
    expect(significant(0)).toBe('0');
    expect(significant(-0, 'down')).toBe('0');
    expect(significant(Number.POSITIVE_INFINITY)).toBeNull();
    expect(significant(Number.NaN, 'up')).toBeNull();
  });
});

describe('the locale’s own marks', () => {
  it('writes the decimal comma and the point groups of German', () => {
    const de = 'de-DE';
    expect(formatPlaces(1234.5678, { places: 1, rounding: 'nearest', locale: de })?.text).toBe(
      '1.234,6',
    );
    expect(formatPlaces(0.000473, { places: 2, rounding: 'nearest', locale: de })?.text).toBe(
      '< 0,01',
    );
    expect(formatPlaces(-0.004, { places: 2, rounding: 'nearest', locale: de })?.text).toBe(
      '> -0,01',
    );
    expect(formatFraction(-1234.5, { sizes: eighths, rounding: 'nearest', locale: de })).toEqual({
      text: '-1.234 1/2',
      approx: false,
    });
    expect(
      formatFraction(1_043_262.45, { sizes: eighths, rounding: 'nearest', locale: de })?.text,
    ).toBe('1.043.262');
    expect(formatSignificant(1234567.89, { digits: 6, rounding: 'down', locale: de })).toBe(
      '1.234.560',
    );
  });

  it('writes the minus sign the locale writes, U+2212 in Swedish', () => {
    // The sign is read from Intl rather than written here: the claim is that every format writes
    // the locale's own sign, whichever its ICU ships. A locale whose sign is the hyphen would
    // prove nothing, so the test says so if Swedish ever stops writing U+2212.
    const sv = 'sv-SE';
    const minus = new Intl.NumberFormat(sv)
      .formatToParts(-1)
      .find((part) => part.type === 'minusSign')?.value;
    expect(minus).not.toBe('-');
    const grouped = (value: number) => new Intl.NumberFormat(sv).format(value);
    expect(formatPlaces(-2.15, { places: 1, rounding: 'up', locale: sv })?.text).toBe(
      `${minus}2,1`,
    );
    expect(formatPlaces(-0.004, { places: 2, rounding: 'nearest', locale: sv })?.text).toBe(
      `> ${minus}0,01`,
    );
    expect(formatFraction(-1.5, { sizes: sizes(4), rounding: 'nearest', locale: sv })?.text).toBe(
      `${minus}1 2/4`,
    );
    expect(formatFraction(-0.001, { sizes: eighths, rounding: 'nearest', locale: sv })?.text).toBe(
      `> ${minus}1/8`,
    );
    expect(
      formatFraction(-1_043_262.45, { sizes: eighths, rounding: 'down', locale: sv })?.text,
    ).toBe(`${minus}${grouped(1_043_263)}`);
    expect(formatSignificant(-2 / 3, { digits: 6, rounding: 'nearest', locale: sv })).toBe(
      `${minus}0,666667`,
    );
  });

  it('falls back to the runtime’s locale for one Intl does not know, as formatNumber does', () => {
    const bad = 'not a locale';
    expect(formatPlaces(1.5, { places: 1, rounding: 'nearest', locale: bad })?.text).toMatch(
      /^1.5$/,
    );
    expect(formatPlaces(-0.004, { places: 2, rounding: 'nearest', locale: bad })?.text).toMatch(
      /^> .0.01$/,
    );
    expect(formatFraction(2.5, { sizes: eighths, rounding: 'nearest', locale: bad })?.text).toBe(
      '2 1/2',
    );
    expect(
      formatFraction(-2e6, { sizes: eighths, rounding: 'nearest', locale: bad })?.text,
    ).toMatch(/^.2.000.000$/);
  });
});

describe('what the formats leave to the digits', () => {
  it('leaves a value at and past 1e15 to them, where places would only repeat them', () => {
    expect(places(1e15, 2)).toBeNull();
    expect(places(2e15, 0)).toBeNull();
    expect(places(-1e15, 1, 'down')).toBeNull();
    expect(places(1e14, 2)).toBe('100,000,000,000,000.00');
  });

  it('leaves what is not finite to the caller, as places does', () => {
    expect(fraction(Number.NaN, eighths)).toBeNull();
    expect(fraction(Number.POSITIVE_INFINITY, eighths)).toBeNull();
  });

  it('writes the nearest digits where rounding up or the scale would overflow a double', () => {
    expect(significant(1.7e308, 'up')).toBe('1.7E308');
    // Rounding the largest double up would pass it; the scale for the smallest, 10^329, is
    // infinite.
    expect(significant(Number.MAX_VALUE, 'up')).toBe('1.79769E308');
    expect(significant(-Number.MAX_VALUE, 'down')).toBe('-1.79769E308');
    expect(significant(Number.MIN_VALUE)).toBe('5E-324');
    expect(significant(1e-310, 'down')).toBe('1E-310');
  });
});
