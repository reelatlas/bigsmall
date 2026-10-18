import { WORDMARK } from './wordmark';

/**
 * The converter page's intro, the line under the name that says what bigsmall does
 * (Converter.tsx), and the site's description in search results and shared links too: the same
 * words by Sean's choice (2026-10-16), so a change here changes what search shows and is shown to
 * him first (docs/SEO.md §2).
 */
export const INTRO = 'Type a number, unit, or both to compare all at once.';

/**
 * What the site says about itself to browsers, search engines, and link previews. The address
 * is Astro's `site` (astro.config.mjs), and the preview image and icons are drawn from the
 * default theme by `pnpm --filter @bigsmall/web brand` (docs/DESIGN-SYSTEM.md, "Brand assets").
 */
export const SITE = {
  name: WORDMARK,
  /** The converter page's title: the name, then what it is. */
  title: `${WORDMARK} · unit converter`,
  /**
   * What a search result shows under the title, and a link preview under its card: the intro's
   * words (INTRO), 50 to 160 characters (docs/SEO.md).
   */
  description: INTRO,
  /** The line under the name on the link preview image: lowercase, like the name. */
  tagline: 'unit converter',
  /** The link preview image, 1200 × 630, in public/. */
  image: '/og.png',
  /** The logo search engines show for the site: a square PNG over 112 px, in public/ (`pnpm brand`). */
  logo: '/icon-512.png',
  imageAlt:
    'The bigsmall logo, a big circle with a small one in front, beside the name and “unit converter”.',
} as const;

/**
 * Umami Cloud's id for this site, which turns counting on (ADR 0019; docs/DEPLOYMENT.md,
 * "Analytics"). Not a secret: it ships in every page. Empty, no tracker loads.
 */
export const UMAMI_WEBSITE_ID: string = '0a3ff4d6-d066-4ed6-97ed-bfb93e047b61';

/**
 * The feedback form at Formspark (ADR 0024; docs/DEPLOYMENT.md, "Feedback"): the About page posts
 * the form's fields to it, and it mails them to Sean. The id is public by design, as a form's
 * address is; what guards it is on the service's side (allowed domains, a honeypot, its filter).
 */
export const FEEDBACK_FORM_ID = 'je13qw0h9';
export const FEEDBACK_ENDPOINT = `https://submit-form.com/${FEEDBACK_FORM_ID}`;
