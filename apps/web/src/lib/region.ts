/**
 * Best-effort region (ISO 3166-1 alpha-2) from the browser locale.
 * Returns undefined when it cannot be determined; core then falls back to US.
 * `Intl.Locale#maximize` fills in the likely region for bare language tags ("en" → "US", "de" → "DE").
 */
export function detectRegion(): string | undefined {
  try {
    const tag = navigator.languages?.[0] ?? navigator.language;
    if (!tag) return undefined;
    return new Intl.Locale(tag).maximize().region ?? undefined;
  } catch {
    return undefined;
  }
}
