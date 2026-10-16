import { WORDMARK } from './wordmark';

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
   * What a search result shows under the title, and a link preview under its card: what bigsmall
   * does and how it differs, under 160 characters (docs/SEO.md).
   */
  description:
    'Type any number and unit in one box and see it in every unit at once: length, weight, volume, temperature, speed, and more. Fast and free.',
  /** The line under the name on the link preview image: lowercase, like the name. */
  tagline: 'efficient unit converter',
  /** The link preview image, 1200 × 630, in public/. */
  image: '/og.png',
  /** The logo search engines show for the site: a square PNG over 112 px, in public/ (`pnpm brand`). */
  logo: '/icon-512.png',
  imageAlt:
    'The bigsmall mark, a big circle with a small one in front, beside the name and “efficient unit converter”.',
} as const;

/**
 * Umami Cloud's id for this site, which turns counting on (ADR 0019; docs/DEPLOYMENT.md,
 * "Analytics"). Not a secret: it ships in every page. Empty, no tracker loads.
 */
export const UMAMI_WEBSITE_ID: string = '0a3ff4d6-d066-4ed6-97ed-bfb93e047b61';
