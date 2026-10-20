/**
 * Values written to a chosen step (docs/UX-SPEC.md §7, ADR 0018): to a number of decimal places,
 * or as fractions in the sizes chosen, rounded to the nearest, up, or down. The table's own text,
 * six significant digits (formatNumber), is what a caller falls back to wherever these return null;
 * formatSignificant writes that same cut rounded up or down, since no limit is still a cut.
 */
import { formatNumber, minusSign, numberFormat } from './format';

/** Up is toward larger values and down toward smaller, below zero too, as ceiling and floor are. */
export type Rounding = 'nearest' | 'up' | 'down';

/** The fraction sizes offered: halves, thirds, quarters, fifths, and on to sixty-fourths. */
export type FractionSize = 2 | 3 | 4 | 5 | 8 | 16 | 32 | 64;

/** The sizes, from the least fine to the finest. */
export const FRACTION_SIZES: readonly FractionSize[] = [2, 3, 4, 5, 8, 16, 32, 64];

/** A value as written, and whether that is not exact (a fraction that rounds). */
export interface Rounded {
  text: string;
  approx: boolean;
}

/** A fraction below 1, in the size that writes it: 2/4 is two quarters. */
export interface Fraction {
  n: number;
  d: number;
}

/** Below this, a difference is float noise: 2.4999999999999996 is 2 1/2. */
const NOISE = 1e-9;

/**
 * Float noise grows with a value, a few steps of a double past a million: 12,345 miles in feet
 * lands at 65,181,599.99999999, which is 65,181,600 exactly.
 */
function noiseAt(value: number): number {
  return Math.max(NOISE, Math.abs(value) * 1e-15);
}

/** Past this, a value's fraction is only its whole number: an eighth is noise beside a million. */
const FRACTION_LIMIT = 1e6;

/** Past this, places would only repeat the significant digits' scientific form. */
export const PLACES_LIMIT = 1e15;

/**
 * A scaled value rounded as chosen: the number itself, except that a difference within a few of
 * the double's steps from the nearest 15-digit decimal is taken as that decimal, since that is the
 * noise a typed value or a conversion carries (0.29 × 100 arrives as 28.999999999999996, which is
 * 29), so float noise never rounds a value down a step and a value's real digits stay: 1 light-year
 * is 9,460,730,472,580.80 km, where a snap to 12 digits wrote .00 until 2026-10-18
 * (docs/LEARNINGS.md, the correction). To the nearest, a tie rounds away from zero, below zero as
 * above it: −2.5 is −3, as 2.5 is 3 (Sean, 2026-10-15).
 */
function rounded(scaled: number, rounding: Rounding): number {
  const near = Number(scaled.toPrecision(15));
  const value = Math.abs(scaled - near) <= 4 * ulpOf(scaled) ? near : scaled;
  if (rounding === 'up') return Math.ceil(value);
  if (rounding === 'down') return Math.floor(value);
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** The step from a double to the next at `x`: what one bit of float noise is worth there. */
function ulpOf(x: number): number {
  const size = Math.abs(x);
  if (size === 0 || !Number.isFinite(size)) return 0;
  let exponent = Math.floor(Math.log2(size));
  if (2 ** exponent > size) exponent -= 1;
  else if (2 ** (exponent + 1) <= size) exponent += 1;
  return 2 ** (exponent - 52);
}

/**
 * A value times `scale`, rounded as chosen to a whole number: the count of the step that places or
 * significant digits write it in (formatPlaces, formatSignificant), and what a pair's last part is
 * split from (compound.ts).
 */
export function roundedScaled(value: number, scale: number, rounding: Rounding): number {
  return rounded(value * scale, rounding);
}

/** A value written to a step: the nearest multiple, and whether that moved it beyond float noise. */
export interface Stepped {
  value: number;
  approx: boolean;
}

/**
 * A value to the nearest multiple of `step`, as a size is marked (a shoe scale's half size,
 * Mondopoint's 5 mm; ADR 0027), rounded as chosen, a tie away from zero: 9.89 to halves is 10,
 * and 271.04 to fives is 270. `approx` says the rounding moved the value by more than float
 * noise, so a row can mark it ≈. Null for a value that is not finite, or a step that is not
 * positive.
 */
export function roundToStep(
  value: number,
  step: number,
  rounding: Rounding = 'nearest',
): Stepped | null {
  if (!Number.isFinite(value) || !(step > 0)) return null;
  const result = roundedScaled(value, 1 / step, rounding) * step;
  return {
    value: Object.is(result, -0) ? 0 : result,
    approx: Math.abs(value - result) > noiseAt(value),
  };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * A value that is not zero but rounds to zero, said as below the step rather than as nothing:
 * "< 0.01", "< 1/8", and below zero "> −0.01" (Sean, 2026-10-15).
 */
function belowStep(value: number, step: string, locale: string | undefined): Rounded {
  return { text: value > 0 ? `< ${step}` : `> ${minusSign(locale)}${step}`, approx: false };
}

/**
 * A value to `places` decimal places, rounded as chosen, small values too: 0.006 to two places is
 * 0.01, and so is 0.001 rounded up. One that is not zero but rounds to zero reads "< 0.01", never
 * 0.00, so it is never taken for nothing. Every place is written, trailing zeros too (96.00, 0.50),
 * so a column of values reads alike and says how precise each is (Sean, 2026-10-15). Null for a
 * value too large for places to mean anything.
 */
export function formatPlaces(
  value: number,
  options: { places: number; rounding: Rounding; locale?: string | undefined },
): Rounded | null {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** options.places;
  const result = roundedScaled(value, scale, options.rounding) / scale;
  if (Math.abs(result) >= PLACES_LIMIT) return null;
  const written = numberFormat(options.locale, {
    minimumFractionDigits: options.places,
    maximumFractionDigits: options.places,
  });
  if (result === 0 && value !== 0)
    return belowStep(value, written.format(1 / scale), options.locale);
  return { text: written.format(Object.is(result, -0) ? 0 : result), approx: false };
}

/**
 * A value to `digits` significant digits, rounded as chosen, written as the table's own text is
 * (formatNumber: grouped, trailing zeros trimmed, scientific past its magnitudes). What No limit
 * shows: no limit is still a cut, at the sixth digit, so Up and Down apply there too (Sean,
 * 2026-10-18). Null for a value that is not finite.
 */
export function formatSignificant(
  value: number,
  options: { digits: number; rounding: Rounding; locale?: string | undefined },
): string | null {
  if (!Number.isFinite(value)) return null;
  const { digits, rounding, locale } = options;
  if (value === 0) return formatNumber(0, { precision: digits, locale });
  // The exponent from the value's own scientific form, exact where a logarithm might not be.
  const exponent = Number(value.toExponential().split('e')[1]);
  const scale = 10 ** (digits - 1 - exponent);
  const result = roundedScaled(value, scale, rounding) / scale;
  // At the ends of what a double holds the scale or the result overflows: the nearest digits then.
  const written = Number.isFinite(scale) && Number.isFinite(result) && scale !== 0 ? result : value;
  return formatNumber(written, { precision: digits, locale });
}

/**
 * Every fraction below 1 the sizes write, smallest first: every one of each size, written in the
 * smallest size chosen that writes it exactly. With quarters alone a half is 2/4; with halves as
 * well, 1/2. So each size is on or off by itself, and what shows is what was chosen.
 */
export function fractionsOf(sizes: ReadonlySet<FractionSize>): Fraction[] {
  const found = new Map<string, Fraction>();
  for (const d of [...sizes].sort((a, b) => a - b)) {
    for (let n = 1; n < d; n += 1) {
      const common = gcd(n, d);
      const key = `${n / common}/${d / common}`;
      if (!found.has(key)) found.set(key, { n, d });
    }
  }
  return [...found.values()].sort((a, b) => a.n / a.d - b.n / b.d);
}

/**
 * A value rounded to the fractions of the sizes chosen, as a count of the step that writes it:
 * 2 7/8 to eighths is 23 of 8 (`count`, signed, and `d`), and past a million the whole number
 * alone (d 1). What formatFraction writes, and what a pair's last part is split from
 * (compound.ts). A tie rounds away from zero: 2 1/16 to eighths is 2 1/8, and −2 1/16 is −2 1/8.
 * Null with no size chosen, or past where places stop meaning anything.
 */
export function roundToFraction(
  value: number,
  options: { sizes: ReadonlySet<FractionSize>; rounding: Rounding },
): { count: number; d: number } | null {
  const { sizes, rounding } = options;
  if (!Number.isFinite(value) || sizes.size === 0 || Math.abs(value) >= PLACES_LIMIT) return null;
  if (Math.abs(value) >= FRACTION_LIMIT) return { count: rounded(value, rounding), d: 1 };
  const base = Math.floor(value);
  const rest = value - base;
  const steps: Fraction[] = [{ n: 0, d: 1 }, ...fractionsOf(sizes), { n: 1, d: 1 }];
  const at = (fraction: Fraction) => fraction.n / fraction.d;
  const pick =
    rounding === 'up'
      ? steps.find((fraction) => at(fraction) >= rest - NOISE)
      : rounding === 'down'
        ? steps.findLast((fraction) => at(fraction) <= rest + NOISE)
        : steps.reduce((best, fraction) => {
            const gap = Math.abs(at(fraction) - rest) - Math.abs(at(best) - rest);
            // A tie goes away from zero: to the larger step above zero, the smaller below it.
            return gap < -NOISE || (gap <= NOISE && value > 0) ? fraction : best;
          });
  if (!pick) return null;
  return { count: base * pick.d + pick.n, d: pick.d };
}

/**
 * A value in the sizes chosen, as a mixed number ("6 5/16"), and whether it rounds, small values
 * rounded as chosen too (0.07 to eighths is ≈ 1/8). One that is not zero but rounds to zero reads
 * "< 1/8", the smallest size chosen. Past a million it is the whole number, rounded as chosen
 * ("≈ 1,043,262"), so no row's fraction is left blank (Sean, 2026-10-15). Null with no size
 * chosen, or past where places stop meaning anything (roundToFraction).
 */
export function formatFraction(
  value: number,
  options: { sizes: ReadonlySet<FractionSize>; rounding: Rounding; locale?: string | undefined },
): Rounded | null {
  const { sizes, rounding, locale } = options;
  const step = roundToFraction(value, { sizes, rounding });
  if (!step) return null;
  const { count, d } = step;
  if (count === 0) {
    return value === 0
      ? { text: '0', approx: false }
      : belowStep(value, `1/${Math.max(...sizes)}`, locale);
  }
  // Written in the fraction's own size, never reduced past it: a below-zero part (d − n) has the
  // same lowest terms as n/d, so the same smallest size chosen writes it.
  const size = Math.abs(count);
  const whole = Math.floor(size / d);
  const part = size % d;
  const text = [whole ? numberFormat(locale).format(whole) : '', part ? `${part}/${d}` : '']
    .filter(Boolean)
    .join(' ');
  return {
    text: (count < 0 ? minusSign(locale) : '') + text,
    approx: Math.abs(value - count / d) > noiseAt(value),
  };
}
