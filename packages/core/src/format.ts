export interface FormatOptions {
  /** Significant digits to show, 1–21. Default 10. Trailing zeros are never shown. */
  precision?: number;
  /**
   * BCP 47 locale for grouping and the decimal mark. Default (or undefined): the runtime's
   * locale.
   */
  locale?: string | undefined;
  /** 'auto' switches to scientific notation for very large or very small magnitudes. */
  notation?: 'auto' | 'standard' | 'scientific';
}

/**
 * Magnitudes at or beyond these switch to scientific notation in 'auto' mode (docs/UX-SPEC.md
 * §7).
 */
const SCIENTIFIC_ABOVE = 1e15;
const SCIENTIFIC_BELOW = 1e-6;

const DEFAULT_PRECISION = 10;

/**
 * The typographic minus, U+2212: the sign some locales write before a negative (minusSign), which
 * the parser reads as one (parse.ts). Named once, never written as an escape.
 */
export const MINUS = String.fromCharCode(0x2212);

/**
 * A number format for the locale, or for the runtime's when the locale is not one Intl knows (an
 * invalid tag throws a RangeError). Every number core writes goes through it, so a bad locale
 * never breaks a table.
 */
export function numberFormat(
  locale: string | undefined,
  options: Intl.NumberFormatOptions = {},
): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    return new Intl.NumberFormat(undefined, options);
  }
}

/** The minus sign the locale writes (U+2212 in some, a hyphen in most). */
export function minusSign(locale: string | undefined): string {
  const parts = numberFormat(locale).formatToParts(-1);
  return parts.find((part) => part.type === 'minusSign')?.value ?? '-';
}

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

  return numberFormat(options.locale, {
    maximumSignificantDigits: precision,
    notation,
    useGrouping: true,
  }).format(normalized);
}

/**
 * A time in minutes as a clock writes it, minutes and seconds to the nearest second: 5.5 is
 * "5:30", 65.5 is "65:30". Minutes never carry into hours, so what is written reads back as the
 * same value (parse reads "5:30" as 5 and 30 sixtieths), and one under a second is "< 0:01".
 * Digits in the locale's own; a time too long for a clock to count in whole seconds is written
 * as a number of minutes. Empty for NaN or an infinity, as formatNumber.
 */
export function formatClock(minutes: number, options: Pick<FormatOptions, 'locale'> = {}): string {
  if (!Number.isFinite(minutes)) return '';
  const seconds = Math.round(Math.abs(minutes) * 60);
  if (!Number.isSafeInteger(seconds)) return formatNumber(minutes, options);
  const digits = (value: number, at: number) =>
    numberFormat(options.locale, { minimumIntegerDigits: at, useGrouping: false }).format(value);
  // A pace under a second is never written 0:00, so it is never taken for nothing, as a decimal
  // that rounds to zero reads "< 0.01" (formatPlaces).
  if (seconds === 0 && minutes !== 0) {
    const second = `${digits(0, 1)}:${digits(1, 2)}`;
    return minutes > 0 ? `< ${second}` : `> ${minusSign(options.locale)}${second}`;
  }
  const sign = minutes < 0 && seconds > 0 ? minusSign(options.locale) : '';
  return `${sign}${digits(Math.floor(seconds / 60), 1)}:${digits(seconds % 60, 2)}`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
