/**
 * How results look, the settings lab's Display (docs/research/organization-lab.md, 2026-10-10):
 * names, copy buttons, and how a value is written, as decimals to a place, as fractions in the
 * sizes chosen, or both side by side, rounded to the nearest, up, or down. A copy button still copies the full value.
 * The lab's own; the converter would take the number formats into core's formatter.
 */
export interface Display {
  names: 'symbol' | 'both';
  copy: boolean;
  /** Both writes the fraction, then its decimal (Sean, 2026-10-10). */
  format: 'decimal' | 'fraction' | 'both';
  /** Decimal places, or null for no limit: the table's six significant digits, as today. */
  places: 1 | 2 | 3 | null;
  /** The fraction sizes chosen, each on or off by itself: 8 for eighths, 3 for thirds. */
  fractions: ReadonlySet<Size>;
  rounding: 'nearest' | 'up' | 'down';
}

export type Size = 2 | 3 | 4 | 8 | 16 | 32 | 64;

/** The sizes offered (Sean, 2026-10-10: thirds among them, for cups). */
export const SIZES: readonly Size[] = [2, 3, 4, 8, 16, 32, 64];

export const SIZE_NAME: Record<Size, string> = {
  2: 'halves',
  3: 'thirds',
  4: 'quarters',
  8: 'eighths',
  16: 'sixteenths',
  32: 'thirty-seconds',
  64: 'sixty-fourths',
};

/** A fresh visit's (Sean, 2026-10-10): symbols, no copy buttons, two places, eighths in waiting. */
export const FRESH_DISPLAY: Display = {
  names: 'symbol',
  copy: false,
  format: 'decimal',
  places: 2,
  fractions: new Set([2, 4, 8]),
  rounding: 'nearest',
};

function sameSizes(a: ReadonlySet<Size>, b: ReadonlySet<Size>): boolean {
  return a.size === b.size && [...a].every((size) => b.has(size));
}

/** Whether any display setting differs from a fresh visit's: what Reset settings would change. */
export function displayChanged(display: Display): boolean {
  const fresh = FRESH_DISPLAY;
  return (
    display.names !== fresh.names ||
    display.copy !== fresh.copy ||
    display.format !== fresh.format ||
    display.places !== fresh.places ||
    !sameSizes(display.fractions, fresh.fractions) ||
    display.rounding !== fresh.rounding
  );
}

interface Fraction {
  n: number;
  d: number;
}

/**
 * Every fraction below 1 the sizes chosen write, smallest first: every one of each size (Sean,
 * 2026-10-10: whoever reads sixteenths needs the rare ones too), each written in the smallest
 * size chosen that writes it exactly. With 1/4 alone a half is 2/4; with 1/2 as well, 1/2. So
 * every size is on or off by itself, and what shows is what was chosen.
 */
export function fractionsOf(chosen: ReadonlySet<Size>): Fraction[] {
  const found = new Map<string, Fraction>();
  for (const d of [...chosen].sort((a, b) => a - b)) {
    for (let n = 1; n < d; n += 1) {
      const common = gcd(n, d);
      const key = `${n / common}/${d / common}`;
      if (!found.has(key)) found.set(key, { n, d });
    }
  }
  return [...found.values()].sort((a, b) => a.n / a.d - b.n / b.d);
}

/**
 * The locale's minus sign, as the table's own text writes it (Intl's), so a negative value reads
 * the same in every format and with no limit (Sean, 2026-10-10: −40 and -40 had both shown).
 */
function minusSign(locale?: string): string {
  return (
    new Intl.NumberFormat(locale).formatToParts(-1).find((part) => part.type === 'minusSign')
      ?.value ?? '-'
  );
}
const NOISE = 1e-9;

/**
 * Up is toward larger values and down toward smaller, below zero too (Sean, 2026-10-10): −2.15
 * rounds up to −2.1 and down to −2.2, as ceiling and floor do (IEEE 754). The scaled value is
 * snapped first, so float noise (0.29 × 100 = 28.999…) never rounds a value down a step.
 */
function rounded(scaled: number, rounding: Display['rounding']): number {
  const value = Number(scaled.toPrecision(12));
  if (rounding === 'up') return Math.ceil(value);
  if (rounding === 'down') return Math.floor(value);
  return Math.round(value);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export interface Written {
  text: string;
  /** Not exact: a fraction that rounds. */
  approx: boolean;
}

/**
 * A value as the display writes it first: its decimal, or its fraction (alone, or ahead of its
 * decimal with Both). Null keeps the table's own text.
 */
export function displayValue(
  value: number | null,
  display: Display,
  locale?: string,
): Written | null {
  return display.format === 'decimal'
    ? decimalValue(value, display, locale)
    : fractionValue(value, display, locale);
}

/**
 * A value to the places chosen; null with no limit, or for a value smaller than the last place
 * (under 0.01 with two), which keeps its significant digits whatever the rounding (Sean,
 * 2026-10-10: rounding up had written 0.000619 as 0.01 while nearest kept its digits, so the
 * table changed shape with the rounding).
 */
export function decimalValue(
  value: number | null,
  display: Display,
  locale?: string,
): Written | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (display.places === null) return null;
  const scale = 10 ** display.places;
  if (value !== 0 && Math.abs(value) < 1 / scale) return null;
  const result = rounded(value * scale, display.rounding) / scale;
  if (result === 0 && value !== 0) return null;
  if (Math.abs(result) >= 1e15) return null;
  const text = new Intl.NumberFormat(locale, { maximumFractionDigits: display.places }).format(
    result,
  );
  return { text, approx: false };
}

/**
 * A value in the fraction sizes chosen, as a mixed number, and whether it rounds; null with no
 * size chosen, past a million, or for a value smaller than the smallest size chosen (under 1/8
 * with eighths), which keeps its digits whatever the rounding, as decimals do. A tie goes up, as
 * Math.round's does.
 */
export function fractionValue(
  value: number | null,
  display: Display,
  locale?: string,
): Written | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (Math.abs(value) >= 1e6 || display.fractions.size === 0) return null;
  if (value !== 0 && Math.abs(value) < 1 / Math.max(...display.fractions) - NOISE) return null;
  // The nearest, the next up, or the next down of whole + a fraction chosen, a hair of float noise
  // allowed either way, so 2.4999999999999996 is still 2 1/2.
  const base = Math.floor(value);
  const rest = value - base;
  const steps: Fraction[] = [{ n: 0, d: 1 }, ...fractionsOf(display.fractions), { n: 1, d: 1 }];
  const at = (f: Fraction) => f.n / f.d;
  const pick =
    display.rounding === 'up'
      ? steps.find((f) => at(f) >= rest - NOISE)
      : display.rounding === 'down'
        ? steps.findLast((f) => at(f) <= rest + NOISE)
        : steps.reduce((best, f) =>
            Math.abs(at(f) - rest) <= Math.abs(at(best) - rest) + NOISE ? f : best,
          );
  if (!pick) return null;
  const count = base * pick.d + pick.n;
  if (count === 0) return value === 0 ? { text: '0', approx: false } : null;
  // Written in the fraction's own size, never reduced past it: a below-zero part (d − n) has the
  // same lowest terms as n/d, so the same smallest size chosen writes it.
  const size = Math.abs(count);
  const whole = Math.floor(size / pick.d);
  const part = size % pick.d;
  const fraction = part ? `${part}/${pick.d}` : '';
  const wholeText = whole ? new Intl.NumberFormat(locale).format(whole) : '';
  const text = [wholeText, fraction].filter(Boolean).join(' ');
  return {
    text: (count < 0 ? minusSign(locale) : '') + text,
    approx: Math.abs(value - count / pick.d) > NOISE,
  };
}
