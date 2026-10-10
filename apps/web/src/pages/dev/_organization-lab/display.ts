/**
 * How results look, the settings lab's Display (docs/research/organization-lab.md, 2026-10-10):
 * names, copy buttons, and how a value is written, as decimals to a place or as fractions of the
 * sizes chosen, rounded to the nearest, up, or down. A copy button still copies the full value.
 * The lab's own; the converter would take the number formats into core's formatter.
 */
export interface Display {
  names: 'both' | 'symbol';
  copy: boolean;
  format: 'decimal' | 'fraction';
  /** Decimal places, or null for no limit: the table's six significant digits, as today. */
  places: 1 | 2 | 3 | null;
  /** The fraction sizes a value may be written in: 2 for halves, 16 for sixteenths. */
  denominators: ReadonlySet<number>;
  rounding: 'nearest' | 'up' | 'down';
}

export const DENOMINATORS = [2, 3, 4, 8, 16, 32, 64] as const;

export const FRESH_DISPLAY: Display = {
  names: 'both',
  copy: true,
  format: 'decimal',
  places: null,
  denominators: new Set([2, 4, 8, 16]),
  rounding: 'nearest',
};

/** Whether any display setting differs from a fresh visit's. */
export function displayChanged(display: Display): boolean {
  const fresh = FRESH_DISPLAY;
  return (
    display.names !== fresh.names ||
    display.copy !== fresh.copy ||
    display.format !== fresh.format ||
    display.places !== fresh.places ||
    display.rounding !== fresh.rounding
  );
}

const MINUS = '−';

function rounded(value: number, rounding: Display['rounding']): number {
  if (rounding === 'up') return Math.ceil(value);
  if (rounding === 'down') return Math.floor(value);
  return Math.round(value);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * A value as the display writes it, and whether that is not exact (a fraction that rounds); null
 * to keep the table's own text: no limit, a value too small for the places or the sizes (it would
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
  if (Math.abs(value) >= 1e6 || display.denominators.size === 0) return null;
  const size = Math.abs(value);
  let best: { count: number; of: number; error: number } | null = null;
  for (const of of [...display.denominators].sort((a, b) => a - b)) {
    const count = rounded(size * of, display.rounding);
    const error = Math.abs(size - count / of);
    if (!best || error < best.error - 1e-12) best = { count, of, error };
  }
  if (!best) return null;
  const whole = Math.floor(best.count / best.of);
  const part = best.count % best.of;
  if (whole === 0 && part === 0) return value === 0 ? { text: '0', approx: false } : null;
  const common = gcd(part, best.of);
  const fraction = part ? `${part / common}/${best.of / common}` : '';
  const wholeText = whole ? new Intl.NumberFormat(locale).format(whole) : '';
  const text = [wholeText, fraction].filter(Boolean).join(' ');
  return { text: (value < 0 ? MINUS : '') + text, approx: best.error > 1e-9 };
}
