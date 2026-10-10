/**
 * How results look, the settings lab's Display (docs/research/organization-lab.md, 2026-10-10):
 * names, copy buttons, and how a value is written, as decimals to a place or as fractions in the
 * sizes chosen, rounded to the nearest, up, or down. A copy button still copies the full value.
 * The lab's own; the converter would take the number formats into core's formatter.
 */
export interface Display {
  names: 'symbol' | 'both';
  copy: boolean;
  format: 'decimal' | 'fraction';
  /** Decimal places, or null for no limit: the table's six significant digits, as today. */
  places: 1 | 2 | 3 | null;
  /** The fraction sizes chosen: 8 for eighths, 3 for thirds. Each writes its whole grid. */
  fractions: ReadonlySet<Size>;
  rounding: 'nearest' | 'up' | 'down';
}

export type Size = 2 | 3 | 4 | 8 | 16 | 32 | 64;

/** The sizes, largest first (Sean, 2026-10-10: thirds among them, for cups). */
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

/**
 * The finer size chosen that holds this one, or null: sixteenths hold every eighth, quarter, and
 * half, so with 1/16 chosen those are in already. Thirds hold and are held by none.
 */
export function heldBy(size: Size, chosen: ReadonlySet<Size>): Size | null {
  return SIZES.find((other) => other !== size && other % size === 0 && chosen.has(other)) ?? null;
}

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
 * Every fraction below 1 the sizes chosen write, in lowest terms, smallest first: every one of
 * each grid (Sean, 2026-10-10: whoever reads sixteenths needs the rare ones too).
 */
export function fractionsOf(chosen: ReadonlySet<Size>): Fraction[] {
  const found = new Map<string, Fraction>();
  for (const d of chosen) {
    for (let n = 1; n < d; n += 1) {
      const common = gcd(n, d);
      found.set(`${n / common}/${d / common}`, { n: n / common, d: d / common });
    }
  }
  return [...found.values()].sort((a, b) => a.n / a.d - b.n / b.d);
}

const MINUS = '−';
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

/**
 * A value as the display writes it, and whether that is not exact (a fraction that rounds); null
 * to keep the table's own text: no limit, no fraction size chosen, a value too small for the places
 * or the sizes (it would read 0), or too large to write as a fraction. A tie goes up, as
 * Math.round's does.
 */
export function displayValue(
  value: number | null,
  display: Display,
  locale?: string,
): { text: string; approx: boolean } | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (display.format === 'decimal') {
    if (display.places === null) return null;
    const scale = 10 ** display.places;
    const result = rounded(value * scale, display.rounding) / scale;
    if (result === 0 && value !== 0) return null;
    if (Math.abs(result) >= 1e15) return null;
    const text = new Intl.NumberFormat(locale, { maximumFractionDigits: display.places }).format(
      Math.abs(result),
    );
    return { text: (result < 0 ? MINUS : '') + text, approx: false };
  }
  if (Math.abs(value) >= 1e6 || display.fractions.size === 0) return null;
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
  const size = Math.abs(count);
  const whole = Math.floor(size / pick.d);
  const part = size % pick.d;
  const common = gcd(part, pick.d);
  const fraction = part ? `${part / common}/${pick.d / common}` : '';
  const wholeText = whole ? new Intl.NumberFormat(locale).format(whole) : '';
  const text = [wholeText, fraction].filter(Boolean).join(' ');
  return {
    text: (count < 0 ? MINUS : '') + text,
    approx: Math.abs(value - count / pick.d) > NOISE,
  };
}
