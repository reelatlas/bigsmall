/**
 * One sourced conversion. `expected` may be written as the defining ratio (1 / 0.3048) so nothing
 * is hand-rounded.
 */
export interface GoldenRow {
  value: number;
  from: string;
  to: string;
  expected: number;
  /**
   * Where `expected` comes from: a standards document, or "Derived:" plus the exact definition
   * used.
   */
  source: string;
  /**
   * Relative tolerance. Default 1e-12. Rows quoting a rounded published figure use a looser
   * value.
   */
  tolerance?: number;
}

/** NIST SP 811 Appendix B prints seven significant digits; this bound covers that rounding. */
export const PUBLISHED_7_DIGITS = 1e-6;
