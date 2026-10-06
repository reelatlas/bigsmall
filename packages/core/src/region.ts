/** Which family of everyday units a user most likely expects. */
export type UnitPreference = 'us' | 'imperial' | 'metric';

export interface RegionDefaults {
  /** ISO 3166-1 alpha-2 region the defaults were derived from. */
  region: string;
  system: UnitPreference;
}

const FALLBACK_REGION = 'US';

/**
 * Unit-system defaults for a region code such as "US", "GB", or "DE".
 * Unknown, empty, or missing regions fall back to the US (decision 2026-10-06, docs/PLAN.md §15).
 * The app detects the region from the browser; this function holds only the policy.
 */
export function regionDefaults(region: string | null | undefined): RegionDefaults {
  const code = (region ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return { region: FALLBACK_REGION, system: 'us' };
  if (code === 'US') return { region: code, system: 'us' };
  if (code === 'GB') return { region: code, system: 'imperial' };
  return { region: code, system: 'metric' };
}
