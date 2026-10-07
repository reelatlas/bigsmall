/** Number separators for a locale, as the browser's Intl implementation reports them. */
export interface Separators {
  decimal: string;
  group: string;
}

/** The separators used when a locale gives none: a period for decimals and a comma for grouping. */
export const DEFAULT_SEPARATORS: Separators = { decimal: '.', group: ',' };

/**
 * Separators for a BCP 47 locale such as "en-US" or "de-DE". With no locale, the runtime default.
 * Falls back to "." and "," when the locale is invalid or Intl is unavailable.
 */
export function localeSeparators(locale?: string): Separators {
  try {
    const parts = new Intl.NumberFormat(locale, { useGrouping: true }).formatToParts(1234567.5);
    const group = parts.find((p) => p.type === 'group')?.value ?? DEFAULT_SEPARATORS.group;
    const decimal = parts.find((p) => p.type === 'decimal')?.value ?? DEFAULT_SEPARATORS.decimal;
    return { decimal, group };
  } catch {
    return { ...DEFAULT_SEPARATORS };
  }
}
