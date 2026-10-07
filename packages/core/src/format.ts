export interface FormatOptions {
  /** Significant digits to show, 1–21. Default 10. Trailing zeros are never shown. */
  precision?: number;
  /** BCP 47 locale for grouping and the decimal mark. Default: the runtime's locale. */
  locale?: string;
  /** 'auto' switches to scientific notation for very large or very small magnitudes. */
  notation?: 'auto' | 'standard' | 'scientific';
}

/** Magnitudes at or beyond these switch to scientific notation in 'auto' mode (docs/UX-SPEC.md §7). */
const SCIENTIFIC_ABOVE = 1e15;
const SCIENTIFIC_BELOW = 1e-6;

const DEFAULT_PRECISION = 10;

/**
 * Format a conversion result for display. Returns an empty string for NaN or infinities, which
 * is how a result too large for a double reaches the UI; callers show their own message for it.
 */
export function formatNumber(value: number, options: FormatOptions = {}): string {
  if (!Number.isFinite(value)) return '';
  const normalized = Object.is(value, -0) ? 0 : value;
  const precision = clamp(Math.round(options.precision ?? DEFAULT_PRECISION), 1, 21);
  const magnitude = Math.abs(normalized);
  const notation =
    options.notation === undefined || options.notation === 'auto'
      ? magnitude >= SCIENTIFIC_ABOVE || (magnitude > 0 && magnitude < SCIENTIFIC_BELOW)
        ? 'scientific'
        : 'standard'
      : options.notation;

  const formatOptions: Intl.NumberFormatOptions = {
    maximumSignificantDigits: precision,
    notation,
    useGrouping: true,
  };
  try {
    return new Intl.NumberFormat(options.locale, formatOptions).format(normalized);
  } catch {
    return new Intl.NumberFormat(undefined, formatOptions).format(normalized);
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
