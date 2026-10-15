/**
 * Values written to a chosen step (docs/UX-SPEC.md §7, ADR 0017): to a number of decimal places,
 * or as fractions in the sizes chosen, rounded to the nearest, up, or down. The table's own text,
 * six significant digits (formatNumber), is what a caller falls back to wherever these return null.
 */

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

/** Past this, a value keeps its decimals rather than a fraction. */
const FRACTION_LIMIT = 1e6;

/** Past this, places would only repeat the significant digits' scientific form. */
const PLACES_LIMIT = 1e15;

/**
 * A scaled value snapped to 12 significant digits before rounding, so float noise (0.29 × 100 is
 * 28.999…) never rounds a value down a step.
 */
function rounded(scaled: number, rounding: Rounding): number {
  const value = Number(scaled.toPrecision(12));
  if (rounding === 'up') return Math.ceil(value);
  if (rounding === 'down') return Math.floor(value);
  return Math.round(value);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** The locale's minus sign, as Intl writes it in the table's own text. */
function minusSign(locale: string | undefined): string {
  return (
    new Intl.NumberFormat(locale).formatToParts(-1).find((part) => part.type === 'minusSign')
      ?.value ?? '-'
  );
}

/**
 * A value to `places` decimal places. Null for a value smaller than the last place (under 0.01
 * with two), which keeps its significant digits whatever the rounding, or one too large for places
 * to mean anything. Every place is written, trailing zeros too (96.00, 0.50), so a column of values
 * reads alike and says how precise each is (Sean, 2026-10-15).
 */
export function formatPlaces(
  value: number,
  options: { places: number; rounding: Rounding; locale?: string | undefined },
): Rounded | null {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** options.places;
  if (value !== 0 && Math.abs(value) < 1 / scale) return null;
  const result = rounded(value * scale, options.rounding) / scale;
  if (Math.abs(result) >= PLACES_LIMIT) return null;
  const text = new Intl.NumberFormat(options.locale, {
    minimumFractionDigits: options.places,
    maximumFractionDigits: options.places,
  }).format(Object.is(result, -0) ? 0 : result);
  return { text, approx: false };
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
 * A value in the sizes chosen, as a mixed number ("6 5/16"), and whether it rounds. Null with no
 * size chosen, past a million, or for a value smaller than the smallest size chosen (under 1/8
 * with eighths), which keeps its digits whatever the rounding. A tie goes up, as Math.round's does.
 */
export function formatFraction(
  value: number,
  options: { sizes: ReadonlySet<FractionSize>; rounding: Rounding; locale?: string | undefined },
): Rounded | null {
  const { sizes, rounding, locale } = options;
  if (!Number.isFinite(value) || sizes.size === 0 || Math.abs(value) >= FRACTION_LIMIT) return null;
  if (value !== 0 && Math.abs(value) < 1 / Math.max(...sizes) - NOISE) return null;
  const base = Math.floor(value);
  const rest = value - base;
  const steps: Fraction[] = [{ n: 0, d: 1 }, ...fractionsOf(sizes), { n: 1, d: 1 }];
  const at = (fraction: Fraction) => fraction.n / fraction.d;
  const pick =
    rounding === 'up'
      ? steps.find((fraction) => at(fraction) >= rest - NOISE)
      : rounding === 'down'
        ? steps.findLast((fraction) => at(fraction) <= rest + NOISE)
        : steps.reduce((best, fraction) =>
            Math.abs(at(fraction) - rest) <= Math.abs(at(best) - rest) + NOISE ? fraction : best,
          );
  if (!pick) return null;
  const count = base * pick.d + pick.n;
  if (count === 0) return value === 0 ? { text: '0', approx: false } : null;
  // Written in the fraction's own size, never reduced past it: a below-zero part (d − n) has the
  // same lowest terms as n/d, so the same smallest size chosen writes it.
  const size = Math.abs(count);
  const whole = Math.floor(size / pick.d);
  const part = size % pick.d;
  const text = [
    whole ? new Intl.NumberFormat(locale).format(whole) : '',
    part ? `${part}/${pick.d}` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return {
    text: (count < 0 ? minusSign(locale) : '') + text,
    approx: Math.abs(value - count / pick.d) > NOISE,
  };
}
