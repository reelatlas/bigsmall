/** The browser's preferred locale tag ("en-US", "de-DE"), or undefined on the server. */
export function browserLocale(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator.languages?.[0] ?? navigator.language ?? undefined;
}

/**
 * Best-effort region (ISO 3166-1 alpha-2) from the browser locale.
 * Returns undefined when it cannot be determined; core then falls back to US.
 * `Intl.Locale#maximize` fills in the likely region for bare language tags ("en" → "US", "de" → "DE").
 */
export function detectRegion(): string | undefined {
  try {
    const tag = browserLocale();
    if (!tag) return undefined;
    return new Intl.Locale(tag).maximize().region ?? undefined;
  } catch {
    return undefined;
  }
}
