import { describe, expect, it } from 'vitest';
import {
  formatFraction,
  formatPlaces,
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
