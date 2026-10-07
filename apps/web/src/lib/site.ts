import { WORDMARK } from './wordmark';

/**
 * What the site says about itself to browsers, search engines, and link previews. The address
 * is Astro's `site` (astro.config.mjs).
 */
export const SITE = {
  name: WORDMARK,
  /** The converter page's title: the name, then what it is. */
  title: `${WORDMARK} · unit converter`,
  description: 'An efficient unit converter.',
} as const;
