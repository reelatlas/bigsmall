/**
 * How results look, the settings lab's Display (docs/research/organization-lab.md, 2026-10-10):
 * names, copy buttons, and how a value is written, as decimals to a place or as fractions to a
 * step, rounded to the nearest, up, or down. A copy button still copies the full value. The lab's
 * own; the converter would take the number formats into core's formatter.
 */
export interface Display {
  names: 'symbol' | 'both';
  copy: boolean;
  format: 'decimal' | 'fraction';
  /** Decimal places, or null for no limit: the table's six significant digits, as today. */
  places: 1 | 2 | 3 | null;
  /** The finest fraction a value is written to: 8 for eighths, which hold every quarter and half. */
  step: FractionStep;
  rounding: 'nearest' | 'up' | 'down';
}

export type FractionStep = 2 | 4 | 8 | 16 | 32 | 64;

/**
 * The steps in three groups, coarse to fine (Sean, 2026-10-10: generic names, not trades). They
 * nest, a sixteenth holding every eighth, quarter, and half, so one step is chosen, never several.
 */
export const FRACTION_GROUPS: ReadonlyArray<{ name: string; steps: readonly FractionStep[] }> = [
  { name: 'Coarse', steps: [2, 4] },
  { name: 'Medium', steps: [8] },
  { name: 'Fine', steps: [16, 32, 64] },
];

export const STEP_NAME: Record<FractionStep, string> = {
  2: 'halves',
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
  step: 8,
  rounding: 'nearest',
};

/** Whether any display setting differs from a fresh visit's: what Reset settings would change. */
export function displayChanged(display: Display): boolean {
  const fresh = FRESH_DISPLAY;
  return (Object.keys(fresh) as (keyof Display)[]).some((key) => display[key] !== fresh[key]);
}

/** The fractions a step writes below 1, in lowest terms: 1/4, 1/2, 3/4 for quarters. */
export function stepFractions(step: FractionStep): string[] {
  return Array.from({ length: step - 1 }, (_, index) => {
    const common = gcd(index + 1, step);
    return `${(index + 1) / common}/${step / common}`;
  });
}

const MINUS = '−';

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
 * to keep the table's own text: no limit, a value too small for the places or the step (it would
 * read 0), or too large to write as a fraction.
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
  if (Math.abs(value) >= 1e6) return null;
  const { step } = display;
  const count = rounded(value * step, display.rounding);
  if (count === 0) return value === 0 ? { text: '0', approx: false } : null;
  const size = Math.abs(count);
  const whole = Math.floor(size / step);
  const part = size % step;
  const common = gcd(part, step);
  const fraction = part ? `${part / common}/${step / common}` : '';
  const wholeText = whole ? new Intl.NumberFormat(locale).format(whole) : '';
  const text = [wholeText, fraction].filter(Boolean).join(' ');
  return { text: (count < 0 ? MINUS : '') + text, approx: Math.abs(value - count / step) > 1e-9 };
}
