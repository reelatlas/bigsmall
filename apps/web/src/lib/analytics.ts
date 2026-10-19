/**
 * Counting what visitors do, with Umami Cloud (ADR 0019, docs/UX-SPEC.md §11): no cookies and
 * nothing personal, sent through the site's own address. The tracker loads only on the
 * production site (layouts/Base.astro) and an ad blocker may stop it, so a call without it does
 * nothing, and counting never gets in the way of the page.
 *
 * Each event, and each property on it, counts toward the plan's monthly events, so the events are
 * few and their properties short. 'Theme picked' is sent by Base.astro's inline script, which no
 * bundle reaches.
 */
type AnalyticsEvent =
  | 'Unit chosen'
  | 'Ingredient chosen'
  | 'Value copied'
  | 'URL copied'
  | 'Calculator opened'
  | 'Calculator sent'
  | 'Units opened'
  | 'Display opened'
  | 'Setting changed';

interface Umami {
  track: (name: string, data?: Record<string, string>) => unknown;
}

/** Counts an event, with its properties, when the tracker is there. */
export function track(event: AnalyticsEvent, data?: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  const umami = (window as Window & { umami?: Umami }).umami;
  try {
    umami?.track(event, data);
  } catch {
    // Counting never breaks the page.
  }
}
